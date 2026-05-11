import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, MoreVertical, Edit, Trash2, X, GraduationCap, MapPin, Phone, Mail, Key, Users, Loader2 } from 'lucide-react';

const brandNavy = '#101869';

export default function MasterMitra() {
    const [mitraList, setMitraList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // ── STATE MODAL SISWA MITRA ──
    const [selectedMitra, setSelectedMitra] = useState(null);
    const [mitraStudents, setMitraStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const initialForm = {
        nama_institusi: '', jenis_institusi: 'SMK', 
        penanggung_jawab: '', no_telepon: '', email: '', 
        password: '', 
        alamat: '', status: 'Aktif'
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchData();
        function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('master_mitra_lokal').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setMitraList(data);
        } catch (error) {
            console.error("Gagal memuat data Mitra:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openModal = (mitra = null) => {
        if (mitra) {
            setEditingId(mitra.id);
            setFormData({ ...mitra, password: '' }); 
        } else {
            setEditingId(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
        setActiveDropdown(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let targetId = editingId;
            const cleanEmail = formData.email ? formData.email.trim() : '';

            if (!editingId) {
                if (!formData.password || formData.password.length < 6) {
                    throw new Error("Password minimal 6 karakter untuk akun Mitra.");
                }

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: cleanEmail,
                    password: formData.password,
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error("Gagal membuat kredensial akses. Mungkin email sudah terdaftar.");
                
                targetId = authData.user.id; 
            }

            const profileData = {
                id: targetId, 
                nama_institusi: formData.nama_institusi,
                jenis_institusi: formData.jenis_institusi,
                penanggung_jawab: formData.penanggung_jawab,
                no_telepon: formData.no_telepon,
                email: cleanEmail, 
                alamat: formData.alamat,
                status: formData.status
            };

            if (editingId) {
                const { error } = await supabase.from('master_mitra_lokal').update(profileData).eq('id', editingId);
                if (error) throw error;
                alert('Data Mitra berhasil diperbarui!');
            } else {
                const { error } = await supabase.from('master_mitra_lokal').insert([profileData]);
                if (error) throw error;
                alert('Mitra & Akun Login berhasil dibuat!');
            }
            
            setIsModalOpen(false);
            fetchData();
        } catch (error) { 
            alert('Proses Gagal: ' + error.message); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus Mitra ${nama}? Akses login juga mungkin perlu dihapus manual dari Supabase Auth.`)) return;
        try {
            const { error } = await supabase.from('master_mitra_lokal').delete().eq('id', id);
            if (error) throw error;
            alert('Data berhasil dihapus!');
            setActiveDropdown(null);
            fetchData();
        } catch (error) { alert('Error: ' + error.message); }
    };

    // ── FUNGSI MELIHAT DAFTAR SISWA MITRA ──
    const handleViewStudents = async (mitra) => {
        setSelectedMitra(mitra);
        setIsLoadingStudents(true);
        setActiveDropdown(null); // Tutup dropdown
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, nik, nama_lengkap, jenis_kelamin, program, tahap_sekarang, status_akhir, medical_checkup_status')
                .eq('lpk_asal', mitra.nama_institusi) // Filter berdasarkan nama_institusi
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMitraStudents(data || []);
        } catch (error) {
            alert('Gagal mengambil data siswa: ' + error.message);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const filteredData = mitraList.filter(m =>
        (m.nama_institusi?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.jenis_institusi?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0' }}>Master Mitra & Akses</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola profil sekolah dan otomatis buatkan akun login portal mereka.</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Institusi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '280px', fontSize: '0.9rem' }} />
                    </div>
                    <button onClick={() => openModal()} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Tambah Mitra
                    </button>
                </div>
            </header>

            {isLoading && mitraList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}>Memuat data...</div>
            ) : filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', color: '#64748b', fontWeight: 600 }}>Belum ada data Mitra yang ditambahkan.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredData.map(mitra => (
                        <div key={mitra.id} style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', flexShrink: 0 }}>
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 800 }}>{mitra.nama_institusi}</h3>
                                        <div style={{ display: 'inline-block', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                                            {mitra.jenis_institusi}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => setActiveDropdown(activeDropdown === mitra.id ? null : mitra.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0' }}>
                                        <MoreVertical size={20} />
                                    </button>
                                    {activeDropdown === mitra.id && (
                                        <div ref={dropdownRef} style={dropdownContainer}>
                                            {/* TOMBOL LIHAT SISWA DITAMBAHKAN DI SINI */}
                                            <button onClick={() => handleViewStudents(mitra)} style={{...dropdownItemS, color: brandNavy}}><Users size={14} /> Lihat Delegasi</button>
                                            <button onClick={() => openModal(mitra)} style={dropdownItemS}><Edit size={14} /> Ubah Data</button>
                                            <button onClick={() => handleDelete(mitra.id, mitra.nama_institusi)} style={{ ...dropdownItemS, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginTop: '10px' }}>
                                <div style={infoRowS}><Phone size={14}/> <span>{mitra.no_telepon || '-'}</span> <span style={{color: '#cbd5e1'}}>•</span> <span>{mitra.penanggung_jawab || '-'}</span></div>
                                {mitra.email && <div style={infoRowS}><Mail size={14}/> <span>{mitra.email}</span></div>}
                                {mitra.alamat && <div style={{...infoRowS, alignItems: 'flex-start'}}><MapPin size={14} style={{marginTop:'3px', flexShrink: 0}}/> <span style={{lineHeight: 1.4}}>{mitra.alamat}</span></div>}
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Ditambahkan: {new Date(mitra.created_at).toLocaleDateString('id-ID')}</span>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: mitra.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: mitra.status === 'Aktif' ? '#166534' : '#991b1b' }}>{mitra.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── MODAL DAFTAR SISWA PER MITRA ── */}
            {selectedMitra && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '900px', maxWidth: '95vw', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ background: brandNavy, padding: '25px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Daftar Siswa Delegasi</h3>
                                <p style={{ margin: '5px 0 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>🏢 LPK Asal: {selectedMitra.nama_institusi}</p>
                            </div>
                            <button onClick={() => setSelectedMitra(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
                        </div>

                        <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto', background: '#f8fafc' }}>
                            {isLoadingStudents ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={40} color={brandNavy}/></div>
                            ) : mitraStudents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 700, border: '2px dashed #cbd5e1', borderRadius: '12px' }}>
                                    Mitra ini belum mendaftarkan siswa sama sekali.
                                </div>
                            ) : (
                                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                            <tr>
                                                <th style={thStyle}>Nama & NIK</th>
                                                <th style={thStyle}>Program</th>
                                                <th style={thStyle}>Posisi / Tahap Saat Ini</th>
                                                <th style={thStyle}>Status MCU & Akhir</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mitraStudents.map((s, idx) => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{idx + 1}. {s.nama_lengkap}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{s.nik}</div>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>{s.program}</span>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', display: 'inline-block', fontWeight: 800 }}>
                                                            {s.tahap_sekarang}
                                                        </div>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, background: s.medical_checkup_status === 'FIT' ? '#dcfce7' : (s.medical_checkup_status === 'UNFIT' ? '#fee2e2' : '#fef3c7'), color: s.medical_checkup_status === 'FIT' ? '#166534' : (s.medical_checkup_status === 'UNFIT' ? '#991b1b' : '#92400e') }}>
                                                                MCU: {s.medical_checkup_status || 'PENDING'}
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, background: s.status_akhir === 'GAGAL SELEKSI' ? '#fee2e2' : '#f1f5f9', color: s.status_akhir === 'GAGAL SELEKSI' ? '#991b1b' : '#475569' }}>
                                                                Status: {s.status_akhir || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL FORM TAMBAH/EDIT MITRA ── */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '550px', maxWidth: '95%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{editingId ? 'Edit Mitra' : 'Tambah Mitra & Buat Akun'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
                            
                            {!editingId && (
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px dashed #cbd5e1', marginBottom: '10px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: brandNavy, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Key size={16}/> KREDENSIAL LOGIN PORTAL</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div><label style={labelForm}>Email Login *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={inputForm} placeholder="email@sekolah.com" /></div>
                                        <div><label style={labelForm}>Password Sementara *</label><input type="text" name="password" value={formData.password} onChange={handleInputChange} required style={inputForm} placeholder="Min. 6 Karakter" /></div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px' }}>* Email ini akan digunakan Mitra untuk login. Pastikan tidak ada spasi ekstra.</div>
                                </div>
                            )}

                            {editingId && (
                                <div><label style={labelForm}>Email Kontak / Login</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{...inputForm, background: '#f1f5f9'}} readOnly title="Email login tidak bisa diubah dari sini." /></div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div><label style={labelForm}>Nama Institusi / Sekolah *</label><input type="text" name="nama_institusi" value={formData.nama_institusi} onChange={handleInputChange} required style={inputForm} placeholder="Contoh: SMKN 1 Jepara" /></div>
                                <div><label style={labelForm}>Jenis</label>
                                    <select name="jenis_institusi" value={formData.jenis_institusi} onChange={handleInputChange} style={inputForm}>
                                        <option value="SMK">SMK / Sekolah</option>
                                        <option value="LPK">LPK Lain</option>
                                        <option value="Agensi">Agensi</option>
                                        <option value="Sponsor">Sponsor Perorangan</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={labelForm}>Penanggung Jawab (PIC)</label><input type="text" name="penanggung_jawab" value={formData.penanggung_jawab} onChange={handleInputChange} style={inputForm} placeholder="Nama Guru / PIC" /></div>
                                <div><label style={labelForm}>No. Telepon / WA</label><input type="text" name="no_telepon" value={formData.no_telepon} onChange={handleInputChange} style={inputForm} /></div>
                            </div>

                            <div><label style={labelForm}>Status Kemitraan</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} style={inputForm}>
                                    <option value="Aktif">Aktif</option>
                                    <option value="Non-Aktif">Non-Aktif</option>
                                </select>
                            </div>

                            <div><label style={labelForm}>Alamat Lengkap</label><textarea name="alamat" value={formData.alamat} onChange={handleInputChange} rows="3" style={{ ...inputForm, resize: 'vertical' }}></textarea></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                {isLoading ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Buat Akun & Simpan')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' };
const inputForm = { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const infoRowS = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' };
const dropdownContainer = { position: 'absolute', right: '0', top: '25px', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '140px', zIndex: 50, padding: '5px', textAlign: 'left' };
const dropdownItemS = { width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', borderRadius: '4px', transition: 'background 0.2s' };
const thStyle = { padding: '18px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px 20px', fontSize: '0.95rem', color: '#334155', verticalAlign: 'middle' };