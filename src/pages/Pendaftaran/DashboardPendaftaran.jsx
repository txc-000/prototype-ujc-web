import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Sesuaikan path jika perlu
import { UserPlus, Loader2, Users, Edit3, XCircle, Camera, X } from 'lucide-react';
import RegistrationPhotoUpload from './RegistrationPhotoUpload'; // Sesuaikan path import komponen upload

export default function DashboardPendaftaran() {
    const [isLoading, setIsLoading] = useState(false);
    const [recentStudents, setRecentStudents] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [uploadModalId, setUploadModalId] = useState(null); // State untuk mengontrol modal foto
    
    const [formData, setFormData] = useState({
        nik: '', nama_lengkap: '', tempat_lahir: '', tanggal_lahir: '', asal_sekolah: ''
    });

    const fetchRecentStudents = async () => {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setRecentStudents(data);
    };

    useEffect(() => { fetchRecentStudents(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleEditInit = (siswa) => {
        setEditingId(siswa.id);
        setFormData({
            nik: siswa.nik,
            nama_lengkap: siswa.nama_lengkap,
            tempat_lahir: siswa.tempat_lahir,
            tanggal_lahir: siswa.tanggal_lahir,
            asal_sekolah: siswa.asal_sekolah
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ nik: '', nama_lengkap: '', tempat_lahir: '', tanggal_lahir: '', asal_sekolah: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (editingId) {
                const { error } = await supabase.from('students').update(formData).eq('id', editingId);
                if (error) throw error;
                alert("Data Siswa Berhasil Diperbarui!");
                resetForm();
            } else {
                // Tambahkan .select() untuk mengembalikan data yang baru di-insert (butuh ID-nya)
                const { data, error } = await supabase.from('students').insert([formData]).select();
                if (error) throw error;
                alert("Siswa Berhasil Didaftarkan! Silakan unggah foto.");
                resetForm();
                
                // Memicu modal upload foto menggunakan ID siswa yang baru terbuat
                if (data && data.length > 0) {
                    setUploadModalId(data[0].id);
                }
            }
            fetchRecentStudents();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <aside style={{ width: '250px', background: 'var(--ink, #0f172a)', color: 'white', padding: '30px 20px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '40px', color: 'var(--red-light, #fbbf24)', fontFamily: 'serif' }}>UJC CONVEYOR</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                    <UserPlus size={18} /> Pendaftaran
                </div>
            </aside>

            <main style={{ flex: 1, padding: '40px', position: 'relative' }}>
                <header style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b' }}>{editingId ? 'Koreksi Data Siswa' : 'Dashboard Pendaftaran'}</h1>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px' }}>
                    {/* FORM INPUT TEKS */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', alignSelf: 'start' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={labelStyle}>NIK (ID Unik)</label>
                                <input type="number" name="nik" value={formData.nik} onChange={handleChange} required style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Nama Lengkap</label>
                                <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} required style={inputStyle} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input type="text" name="tempat_lahir" placeholder="Tempat Lahir" value={formData.tempat_lahir} onChange={handleChange} required style={inputStyle} />
                                <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} required style={inputStyle} />
                            </div>
                            <input type="text" name="asal_sekolah" placeholder="Asal Sekolah" value={formData.asal_sekolah} onChange={handleChange} required style={inputStyle} />
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" disabled={isLoading} style={{ flex: 1, background: '#dc2626', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', justifyContent: 'center' }}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : editingId ? 'Simpan Koreksi' : 'Daftarkan Siswa'}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={resetForm} style={{ padding: '15px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><XCircle size={20}/></button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* TABEL DATA */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} /> Daftar Seluruh Siswa</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '10px', fontSize: '0.85rem', color: '#64748b' }}>Nama / NIK</th>
                                <th style={{ padding: '10px', fontSize: '0.85rem', color: '#64748b' }}>Tahap</th>
                                <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>Aksi</th>
                            </tr></thead>
                            <tbody>
                                {recentStudents.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.nama_lengkap}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.nik}</div>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>{s.tahap_sekarang || 'PENDAFTARAN'}</span>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <button onClick={() => handleEditInit(s)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '5px' }} title="Edit Teks"><Edit3 size={18}/></button>
                                            <button onClick={() => setUploadModalId(s.id)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '5px', marginLeft: '5px' }} title="Upload/Update Foto"><Camera size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL UPLOAD FOTO */}
                {uploadModalId && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>Unggah Foto Siswa</h3>
                                <button onClick={() => setUploadModalId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                            </div>
                            
                            <RegistrationPhotoUpload 
                                studentId={uploadModalId} 
                                onUploadSuccess={() => {
                                    setUploadModalId(null);
                                    fetchRecentStudents(); // Refresh data jika diperlukan
                                }} 
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// STYLES
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.9rem' };
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '12px', width: '450px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' };