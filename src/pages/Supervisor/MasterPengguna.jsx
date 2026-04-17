import React, { useState, useEffect, useRef } from 'react';
import { supabase, supabaseAdmin } from '../../lib/supabase'; 
import { Search, Plus, MoreVertical, Edit, Trash2, X, LayoutGrid, List, Key } from 'lucide-react'; 

const brandNavy = '#101869';

export default function MasterPengguna() {
    const [penggunaList, setPenggunaList] = useState([]);
    const [roles, setRoles] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('CARD');

    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        id_karyawan: '', nama_lengkap: '', email_pribadi: '', no_hp: '', role_id: '', alamat: '', status: 'Aktif'
    });

    useEffect(() => {
        function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- FUNGSI FETCH ANTI-BADAI (BYPASS RLS & RELASI) ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Ambil Role menggunakan Kunci Master (Bypass RLS)
            const { data: roleData, error: roleError } = await supabaseAdmin
                .from('master_role')
                .select('id, nama_role')
                .order('nama_role', { ascending: true });

            if (roleError) console.error("Error Fetch Role:", roleError.message);
            if (roleData) setRoles(roleData);

            // 2. Ambil Karyawan menggunakan Kunci Master (Bypass RLS)
            const { data: empData, error: empError } = await supabaseAdmin
                .from('employees')
                .select('*') // Hanya ambil data asli karyawan
                .order('created_at', { ascending: false });

            if (empError) throw empError;

            // 3. Gabungkan Jabatan (Role) secara manual di React
            if (empData && roleData) {
                const combinedData = empData.map(emp => {
                    const matchedRole = roleData.find(r => r.id === emp.role_id);
                    return {
                        ...emp,
                        master_role: { nama_role: matchedRole ? matchedRole.nama_role : 'BELUM ADA JABATAN' }
                    };
                });
                setPenggunaList(combinedData);
            } else {
                setPenggunaList(empData || []);
            }

        } catch (error) {
            console.error("Gagal memuat data:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openModal = (user = null) => {
        if (user) {
            setEditingId(user.id);
            setFormData({
                id_karyawan: user.id_karyawan || '',
                nama_lengkap: user.nama_lengkap || '',
                email_pribadi: user.email_pribadi || '',
                no_hp: user.no_hp || '',
                role_id: user.role_id || '',
                alamat: user.alamat || '',
                status: user.status || 'Aktif'
            });
        } else {
            setEditingId(null);
            setFormData({ id_karyawan: '', nama_lengkap: '', email_pribadi: '', no_hp: '', role_id: roles.length > 0 ? roles[0].id : '', alamat: '', status: 'Aktif' });
        }
        setIsModalOpen(true);
        setActiveDropdown(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('employees').update({
                    id_karyawan: formData.id_karyawan.trim().toUpperCase(),
                    nama_lengkap: formData.nama_lengkap,
                    email_pribadi: formData.email_pribadi,
                    no_hp: formData.no_hp,
                    role_id: formData.role_id, // Gunakan role_id sesuai schema Anda
                    alamat: formData.alamat,
                    status: formData.status
                }).eq('id', editingId);
                
                if (error) throw new Error('Gagal update database: ' + error.message);
                alert('Data Karyawan berhasil diupdate!');
            } else {
                const shadowEmail = `${formData.id_karyawan.trim().toUpperCase()}@internal.ujc.com`;
                const defaultPassword = 'UJC12345'; 

                // 1. Buat User di Auth
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: shadowEmail,
                    password: defaultPassword,
                    email_confirm: true 
                });

                if (authError) throw new Error('Gagal membuat akun Auth: ' + authError.message);

                // 2. Insert Profil
                const { error: empError } = await supabase.from('employees').insert([{
                    id: authData.user.id, 
                    id_karyawan: formData.id_karyawan.trim().toUpperCase(),
                    nama_lengkap: formData.nama_lengkap,
                    email_pribadi: formData.email_pribadi,
                    no_hp: formData.no_hp,
                    role_id: formData.role_id, // Gunakan role_id sesuai schema Anda
                    alamat: formData.alamat,
                    status: formData.status,
                    is_first_login: true 
                }]);
                
                if (empError) {
                    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                    throw new Error('Gagal menyimpan profil: ' + empError.message);
                }

                alert(`Berhasil!\nAkun karyawan otomatis dibuat.\nEmail: ${shadowEmail}\nPassword Sementara: ${defaultPassword}`);
            }
            setIsModalOpen(false);
            
            await fetchData(); 
            
        } catch (error) { 
            alert('Error: ' + error.message); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus akun dan data karyawan ${nama}?`)) return;
        try {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) throw new Error('Gagal menghapus akun: ' + authError.message);
            
            alert('Akun karyawan berhasil dihapus!');
            fetchData();
            setActiveDropdown(null);
        } catch (error) { alert('Error: ' + error.message); }
    };

    // --- FUNGSI RESET PASSWORD ---
    const handleResetPassword = async (id, nama) => {
        if (!window.confirm(`Yakin ingin mereset password ${nama} kembali ke default (UJC12345)?`)) return;
        
        setIsLoading(true);
        try {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                id, 
                { password: 'UJC12345' }
            );
            if (authError) throw new Error('Gagal reset Auth: ' + authError.message);

            const { error: empError } = await supabase.from('employees')
                .update({ is_first_login: true })
                .eq('id', id);
            
            if (empError) throw new Error('Gagal update status profil: ' + empError.message);

            alert(`✅ Password ${nama} berhasil direset!\nSilakan login menggunakan password sementara: UJC12345`);
            setActiveDropdown(null);
            fetchData();
        } catch (error) { 
            alert('Error: ' + error.message); 
        } finally {
            setIsLoading(false);
        }
    };

    const filteredData = penggunaList.filter(p =>
        p.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id_karyawan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.master_role?.nama_role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- UPDATE: WARNA BADGE SESUAI SOP BARU ---
    const getTipeBadge = (namaRole) => {
        const t = namaRole ? namaRole.toLowerCase() : '';
        if (t === 'super admin') return { bg: '#0f172a', text: 'SUPER ADMIN' }; // Slate
        if (t === 'direktur') return { bg: '#8b5cf6', text: 'DIREKTUR' }; // Violet
        if (t === 'supervisor') return { bg: '#ec4899', text: 'SUPERVISOR' }; // Pink
        if (t === 'reguler') return { bg: '#3b82f6', text: 'REGULER' }; // Blue
        if (t === 'rekrutmen') return { bg: '#10b981', text: 'REKRUTMEN' }; // Emerald
        if (t === 'dokumen') return { bg: '#f59e0b', text: 'DOKUMEN' }; // Amber
        if (t === 'pendidikan') return { bg: '#14b8a6', text: 'PENDIDIKAN' }; // Teal
        if (t === 'administrasi') return { bg: '#6366f1', text: 'ADMINISTRASI' }; // Indigo
        return { bg: '#64748b', text: namaRole ? namaRole.toUpperCase() : 'UNDEFINED' }; // Slate Gray (Default)
    };

    return (
        <div className="fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0' }}>Manajemen Karyawan (SDM)</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola profil staf dan hak akses operasional LPK.</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Nama / ID / Role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '0.9rem' }} />
                    </div>
                    <button onClick={() => openModal()} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Tambah Karyawan
                    </button>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                        <button onClick={() => setViewMode('CARD')} style={viewBtnS(viewMode === 'CARD')}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('TABLE')} style={viewBtnS(viewMode === 'TABLE')}><List size={18} /></button>
                    </div>
                </div>
            </header>

            {/* Indikator Loading Data */}
            {isLoading && penggunaList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}>Memuat data karyawan dari server...</div>
            ) : filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', color: '#64748b', fontWeight: 600 }}>
                    Belum ada data karyawan. Silakan tambah data baru.
                </div>
            ) : viewMode === 'CARD' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredData.map((user) => {
                        const tBadge = getTipeBadge(user.master_role?.nama_role);
                        return (
                            <div key={user.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: brandNavy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fdfb06', flexShrink: 0, fontWeight: 900, fontSize: '1.2rem' }}>
                                            {user.nama_lengkap ? user.nama_lengkap.substring(0, 2).toUpperCase() : 'SD'}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>{user.nama_lengkap}</h3>
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                <span style={{ background: tBadge.bg, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{tBadge.text}</span>
                                                <span style={{ background: user.status === 'Aktif' || !user.status ? '#10b981' : '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{user.status || 'Aktif'}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                {user.id_karyawan && <span style={{ border: '1px solid #a855f7', color: '#9333ea', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>{user.id_karyawan}</span>}
                                                {user.no_hp && <span style={{ border: '1px solid #3b82f6', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>{user.no_hp}</span>}
                                            </div>
                                            {user.email_pribadi && <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '10px', marginBottom: 0 }}>Email Asli: {user.email_pribadi}</p>}
                                        </div>
                                    </div>

                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0' }}>
                                            <MoreVertical size={20} />
                                        </button>
                                        {activeDropdown === user.id && (
                                            <div ref={dropdownRef} style={dropdownContainer}>
                                                <button onClick={() => openModal(user)} style={dropdownItemS}><Edit size={14} /> Ubah</button>
                                                <button onClick={() => handleResetPassword(user.id, user.nama_lengkap)} style={{ ...dropdownItemS, color: '#f59e0b' }}><Key size={14} /> Reset Sandi</button>
                                                <button onClick={() => handleDelete(user.id, user.nama_lengkap)} style={{ ...dropdownItemS, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '15px', overflow: 'visible', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr><th style={thP}>Identitas Pegawai</th><th style={thP}>Kontak Pribadi</th><th style={thP}>Status</th><th style={{ ...thP, textAlign: 'center' }}>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {filteredData.map(user => {
                                const tBadge = getTipeBadge(user.master_role?.nama_role);
                                return (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdP}>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{user.nama_lengkap}</div>
                                        <div style={{ fontSize: '0.75rem', color: tBadge.bg, fontWeight: 700, marginTop: '2px' }}>
                                            {tBadge.text} • {user.id_karyawan}
                                        </div>
                                    </td>
                                    <td style={{ ...tdP, fontSize: '0.8rem', color: '#475569' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{user.no_hp || '-'}</div>
                                        <div>{user.email_pribadi || '-'}</div>
                                    </td>
                                    <td style={tdP}>
                                        <span style={{ background: user.status === 'Aktif' || !user.status ? '#dcfce7' : '#fee2e2', color: user.status === 'Aktif' || !user.status ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>{user.status || 'Aktif'}</span>
                                    </td>
                                    <td style={{ ...tdP, textAlign: 'center', position: 'relative' }}>
                                        <button onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '5px' }}>
                                            <MoreVertical size={20} />
                                        </button>
                                        {activeDropdown === user.id && (
                                            <div ref={dropdownRef} style={{...dropdownContainer, right: '40px', top: '50%', transform: 'translateY(-50%)'}}>
                                                <button onClick={() => openModal(user)} style={dropdownItemS}><Edit size={14} /> Ubah</button>
                                                <button onClick={() => handleResetPassword(user.id, user.nama_lengkap)} style={{ ...dropdownItemS, color: '#f59e0b' }}><Key size={14} /> Reset Sandi</button>
                                                <button onClick={() => handleDelete(user.id, user.nama_lengkap)} style={{ ...dropdownItemS, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{editingId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                                <div><label style={labelForm}>ID Karyawan *</label><input type="text" name="id_karyawan" placeholder="UJC-XXX" value={formData.id_karyawan} onChange={handleInputChange} required style={inputForm} /></div>
                                <div><label style={labelForm}>Nama Lengkap *</label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} required style={inputForm} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={labelForm}>Email Pribadi</label><input type="email" name="email_pribadi" placeholder="Opsional" value={formData.email_pribadi} onChange={handleInputChange} style={inputForm} /></div>
                                <div><label style={labelForm}>No. WhatsApp</label><input type="text" name="no_hp" value={formData.no_hp} onChange={handleInputChange} style={inputForm} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={labelForm}>Jabatan (Role) *</label>
                                    <select name="role_id" value={formData.role_id} onChange={handleInputChange} required style={inputForm}>
                                        {roles.length === 0 ? <option value="">Loading roles...</option> : <option value="">-- Pilih Jabatan --</option>}
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.nama_role}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelForm}>Status Karyawan</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} style={inputForm}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                        <option value="Cuti">Cuti</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={labelForm}>Alamat Domisili</label>
                                <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} rows="2" style={{ ...inputForm, resize: 'vertical' }}></textarea>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>{isLoading ? 'Menyimpan...' : 'Simpan Karyawan'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' };
const inputForm = { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const viewBtnS = (active) => ({ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: active ? 'white' : 'transparent', color: active ? brandNavy : '#94a3b8', transition: '0.2s', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' });
const thP = { padding: '18px 25px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', fontWeight: 800 };
const tdP = { padding: '18px 25px', verticalAlign: 'middle' };
const dropdownContainer = { position: 'absolute', right: '0', top: '25px', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '135px', zIndex: 50, padding: '5px', textAlign: 'left' };
const dropdownItemS = { width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', borderRadius: '4px', transition: 'background 0.2s' };