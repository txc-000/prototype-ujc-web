import React, { useState, useEffect, useRef } from 'react';
import { supervisorService } from '../../services/supervisorService';
import { Search, Plus, MoreVertical, Edit, Trash2, X, LayoutGrid, List, Key, Loader2 } from 'lucide-react'; 
import { supabase } from '../../lib/supabase';

// IMPORT STYLES SENTRAL
import { styles, brandNavy, viewBtnS } from '../Reguler/components/dashboardStyles';

export default function MasterPengguna() {
    const [penggunaList, setPenggunaList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('CARD');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const dropdownRef = useRef(null);
    const [roles, setRoles] = useState([]);

    const [formData, setFormData] = useState({
        id_karyawan: '', nama_lengkap: '', email_pribadi: '', no_hp: '', role_id: '', alamat: '', status: 'Aktif'
    });

    useEffect(() => {
        fetchData();
        fetchRoles();
        const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setActiveDropdown(null); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await supervisorService.getEmployeeList();
            setPenggunaList(data);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await supabase.from('master_role').select('id, nama_role').order('nama_role');
            if (data) setRoles(data);
        } catch (error) {
            console.error("Gagal memuat daftar role:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) {
                await supervisorService.updateEmployee(editingId, formData);
                alert('Data Karyawan berhasil diupdate!');
            } else {
                const creds = await supervisorService.createEmployee(formData);
                alert(`Berhasil!\nAkun karyawan otomatis dibuat.\nEmail: ${creds.email}\nSandi Sementara: ${creds.password}`);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) { 
            alert('Error: ' + error.message); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleReset = async (id, nama) => {
        if (!window.confirm(`Yakin ingin mereset password ${nama} ke default (UJC12345)?`)) return;
        setIsLoading(true);
        try {
            await supervisorService.resetEmployeePassword(id);
            alert(`✅ Password ${nama} berhasil direset!\nSilakan login menggunakan password sementara: UJC12345`);
            setActiveDropdown(null);
            fetchData();
        } catch (error) { 
            alert('Error: ' + error.message); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus permanen akun dan data karyawan ${nama}?`)) return;
        setIsLoading(true);
        try {
            await supervisorService.deleteEmployee(id);
            alert('Akun karyawan berhasil dihapus!');
            setActiveDropdown(null);
            fetchData();
        } catch (error) { 
            alert('Error: ' + error.message); 
        } finally {
            setIsLoading(false);
        }
    };

    // --- WARNA BADGE ---
    const getTipeBadge = (namaRole) => {
        const t = namaRole ? namaRole.toLowerCase() : '';
        const colors = {
            'super admin': '#0f172a', 'direktur': '#8b5cf6', 'supervisor': '#ec4899',
            'reguler': '#3b82f6', 'rekrutmen': '#10b981', 'dokumen': '#f59e0b',
            'pendidikan': '#14b8a6', 'administrasi': '#6366f1'
        };
        return { bg: colors[t] || '#64748b', text: namaRole?.toUpperCase() || 'UNDEFINED' };
    };

    const filteredData = penggunaList.filter(p =>
        p.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id_karyawan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.master_role?.nama_role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <input type="text" placeholder="Cari Nama / ID / Role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px', width: '250px' }} />
                    </div>
                    <button onClick={() => { setEditingId(null); setFormData({id_karyawan:'', nama_lengkap:'', email_pribadi:'', no_hp:'', role_id:'', alamat:'', status:'Aktif'}); setIsModalOpen(true); }} style={styles.btnPrimary}>
                        <Plus size={18} /> Tambah Karyawan
                    </button>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                        <button onClick={() => setViewMode('CARD')} style={viewBtnS(viewMode === 'CARD')}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('TABLE')} style={viewBtnS(viewMode === 'TABLE')}><List size={18} /></button>
                    </div>
                </div>
            </header>

            {isLoading && penggunaList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}><Loader2 className="animate-spin" size={30} style={{margin:'0 auto'}}/></div>
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
                                            <div ref={dropdownRef} style={styles.dropdownContainer}>
                                                <button onClick={() => { setEditingId(user.id); setFormData(user); setIsModalOpen(true); setActiveDropdown(null); }} style={styles.dropdownItemS}><Edit size={14} /> Ubah</button>
                                                <button onClick={() => handleReset(user.id, user.nama_lengkap)} style={{ ...styles.dropdownItemS, color: '#f59e0b' }}><Key size={14} /> Reset Sandi</button>
                                                <button onClick={() => handleDelete(user.id, user.nama_lengkap)} style={{ ...styles.dropdownItemS, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.tableS}>
                        <thead style={styles.theadS}>
                            <tr><th style={styles.thStyle}>Identitas Pegawai</th><th style={styles.thStyle}>Kontak Pribadi</th><th style={styles.thStyle}>Status</th><th style={{ ...styles.thStyle, textAlign: 'center' }}>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {filteredData.map(user => {
                                const tBadge = getTipeBadge(user.master_role?.nama_role);
                                return (
                                <tr key={user.id} style={styles.trS}>
                                    <td style={styles.tdStyle}>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{user.nama_lengkap}</div>
                                        <div style={{ fontSize: '0.75rem', color: tBadge.bg, fontWeight: 700, marginTop: '2px' }}>
                                            {tBadge.text} • {user.id_karyawan}
                                        </div>
                                    </td>
                                    <td style={{ ...styles.tdStyle, fontSize: '0.8rem', color: '#475569' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{user.no_hp || '-'}</div>
                                        <div>{user.email_pribadi || '-'}</div>
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <span style={{ background: user.status === 'Aktif' || !user.status ? '#dcfce7' : '#fee2e2', color: user.status === 'Aktif' || !user.status ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>{user.status || 'Aktif'}</span>
                                    </td>
                                    <td style={{ ...styles.tdStyle, textAlign: 'center', position: 'relative' }}>
                                        <button onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '5px' }}>
                                            <MoreVertical size={20} />
                                        </button>
                                        {activeDropdown === user.id && (
                                            <div ref={dropdownRef} style={{...styles.dropdownContainer, right: '40px', top: '50%', transform: 'translateY(-50%)'}}>
                                                <button onClick={() => { setEditingId(user.id); setFormData(user); setIsModalOpen(true); setActiveDropdown(null); }} style={styles.dropdownItemS}><Edit size={14} /> Ubah</button>
                                                <button onClick={() => handleReset(user.id, user.nama_lengkap)} style={{ ...styles.dropdownItemS, color: '#f59e0b' }}><Key size={14} /> Reset Sandi</button>
                                                <button onClick={() => handleDelete(user.id, user.nama_lengkap)} style={{ ...styles.dropdownItemS, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
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
                <div style={styles.modalOverlay}>
                    <form onSubmit={handleSubmit} style={{ ...styles.modalContent, width: '500px', padding: '30px' }}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{editingId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={styles.closeBtn}><X size={20} color="#64748b" /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                                <div><label style={styles.lb}>ID Karyawan *</label><input type="text" name="id_karyawan" placeholder="UJC-XXX" value={formData.id_karyawan} onChange={(e) => setFormData({...formData, id_karyawan: e.target.value})} required style={styles.inp} /></div>
                                <div><label style={styles.lb}>Nama Lengkap *</label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})} required style={styles.inp} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={styles.lb}>Email Pribadi</label><input type="email" name="email_pribadi" placeholder="Opsional" value={formData.email_pribadi} onChange={(e) => setFormData({...formData, email_pribadi: e.target.value})} style={styles.inp} /></div>
                                <div><label style={styles.lb}>No. WhatsApp</label><input type="text" name="no_hp" value={formData.no_hp} onChange={(e) => setFormData({...formData, no_hp: e.target.value})} style={styles.inp} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={styles.lb}>Jabatan (Role) *</label>
                                    <select name="role_id" value={formData.role_id} onChange={(e) => setFormData({...formData, role_id: e.target.value})} required style={styles.inp}>
                                        <option value="">-- Pilih Jabatan / Role --</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.nama_role?.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.lb}>Status Karyawan</label>
                                    <select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={styles.inp}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                        <option value="Cuti">Cuti</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={styles.lb}>Alamat Domisili</label>
                                <textarea name="alamat" value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} rows="2" style={{ ...styles.inp, resize: 'vertical' }}></textarea>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Batal</button>
                            <button type="submit" disabled={isLoading} style={styles.btnPrimary}>
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Karyawan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}