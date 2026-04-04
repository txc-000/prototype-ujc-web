import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import { UserPlus, Loader2, Users, Edit3, XCircle, Camera, X, Trash2 } from 'lucide-react';
import RegistrationPhotoUpload from './RegistrationPhotoUpload'; 

// BRAND COLORS
const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function DashboardPendaftaran() {
    const [isLoading, setIsLoading] = useState(false);
    const [recentStudents, setRecentStudents] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [uploadModalId, setUploadModalId] = useState(null); 
    
    const initialFormState = {
        nik: '', nama_lengkap: '', nama_jepang: '', tempat_lahir: '', tanggal_lahir: '', 
        jenis_kelamin: '', agama: '', golongan_darah: '', tinggi_badan: '', berat_badan: '', 
        telepon: '', email: '', asal_sekolah: '',
        pendidikan_history: [], kerja_history: [], keluarga_history: []
    };
    
    const [formData, setFormData] = useState(initialFormState);

    const fetchRecentStudents = async () => {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);
        if (!error && data) setRecentStudents(data);
    };

    useEffect(() => { fetchRecentStudents(); }, []);

    // ── HANDLER INPUT ──
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // ── HANDLER ARRAY (DINAMIS) ──
    const handleArrayChange = (field, index, key, value) => {
        const updatedArray = [...formData[field]];
        updatedArray[index][key] = value;
        setFormData({ ...formData, [field]: updatedArray });
    };
    const addArrayItem = (field, newItem) => setFormData({ ...formData, [field]: [...formData[field], newItem] });
    const removeArrayItem = (field, index) => setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });

    // ── INIT EDIT ──
    const handleEditInit = (siswa) => {
        setEditingId(siswa.id);
        
        // Pastikan format array/JSON aman
        const cleanArr = (arr) => {
            if (!arr) return [];
            if (Array.isArray(arr)) return arr;
            if (typeof arr === 'string') { try { return JSON.parse(arr); } catch { return []; } }
            return [];
        };

        setFormData({
            nik: siswa.nik || '', nama_lengkap: siswa.nama_lengkap || '', nama_jepang: siswa.nama_jepang || '',
            tempat_lahir: siswa.tempat_lahir || '', tanggal_lahir: siswa.tanggal_lahir || '', jenis_kelamin: siswa.jenis_kelamin || '',
            agama: siswa.agama || '', golongan_darah: siswa.golongan_darah || '', tinggi_badan: siswa.tinggi_badan || '',
            berat_badan: siswa.berat_badan || '', telepon: siswa.telepon || '', email: siswa.email || '', asal_sekolah: siswa.asal_sekolah || '',
            pendidikan_history: cleanArr(siswa.pendidikan_history), kerja_history: cleanArr(siswa.kerja_history), keluarga_history: cleanArr(siswa.keluarga_history)
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData(initialFormState);
    };

    // ── SUBMIT FORM ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            ...formData,
            tinggi_badan: formData.tinggi_badan ? parseInt(formData.tinggi_badan) : null,
            berat_badan: formData.berat_badan ? parseInt(formData.berat_badan) : null,
            tahap_sekarang: editingId ? undefined : 'Pemberkasan', 
            status_akhir: editingId ? undefined : 'Proses' 
        };

        try {
            if (editingId) {
                const { error } = await supabase.from('students').update(payload).eq('id', editingId);
                if (error) throw error;
                alert("Data Siswa Berhasil Diperbarui!");
                resetForm();
            } else {
                const { data, error } = await supabase.from('students').insert([payload]).select();
                if (error) throw error;
                alert("Siswa Berhasil Didaftarkan! Silakan unggah foto.");
                resetForm();
                if (data && data.length > 0) setUploadModalId(data[0].id);
            }
            fetchRecentStudents();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
            
            {/* ── SIDEBAR KHUSUS PENDAFTARAN ── */}
            <aside style={{ width: '260px', background: brandNavy, color: 'white', padding: '30px 20px', boxShadow: '4px 0 10px rgba(0,0,0,0.1)', zIndex: 10 }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '40px', color: brandYellow, fontWeight: 900, letterSpacing: '0.5px' }}>UJC CONVEYOR</h2>
                
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', marginLeft: '5px' }}>Menu Divisi</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.15)', padding: '12px 15px', borderRadius: '8px', fontWeight: 700, color: brandYellow }}>
                    <UserPlus size={18} /> Entri Pendaftar Baru
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <header style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', fontWeight: 800, margin: '0 0 5px 0' }}>
                        {editingId ? 'Koreksi Data Pendaftar' : 'Pendaftaran Siswa Baru'}
                    </h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Masukkan data komprehensif siswa termasuk riwayat pendidikan dan pengalaman.</p>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* ── FORM INPUT DINAMIS ── */}
                    <div style={{ background: 'white', padding: '35px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `5px solid ${brandNavy}` }}>
                        <form onSubmit={handleSubmit}>
                            
                            {/* 1. IDENTITAS DASAR */}
                            <h3 style={sectionTitle}>I. Identitas Dasar</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '40px' }}>
                                <div><label style={labelForm}>NIK *</label><input type="number" name="nik" value={formData.nik} onChange={handleChange} required style={inputForm} /></div>
                                <div><label style={labelForm}>Nama Lengkap *</label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} required style={inputForm} /></div>
                                <div><label style={labelForm}>Nama Jepang</label><input type="text" name="nama_jepang" value={formData.nama_jepang} onChange={handleChange} style={inputForm} /></div>
                                
                                <div><label style={labelForm}>Tempat Lahir *</label><input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} required style={inputForm} /></div>
                                <div><label style={labelForm}>Tanggal Lahir *</label><input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} required style={inputForm} /></div>
                                <div><label style={labelForm}>Jenis Kelamin *</label>
                                    <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} required style={inputForm}>
                                        <option value="">-- Pilih --</option><option value="Laki-Laki">Laki-Laki</option><option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>

                                <div><label style={labelForm}>Agama</label>
                                    <select name="agama" value={formData.agama} onChange={handleChange} style={inputForm}>
                                        <option value="">-- Pilih --</option><option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <div><label style={labelForm}>Gol. Darah</label>
                                        <select name="golongan_darah" value={formData.golongan_darah} onChange={handleChange} style={inputForm}>
                                            <option value="">-</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option>
                                        </select>
                                    </div>
                                    <div><label style={labelForm}>Tinggi (cm)</label><input type="number" name="tinggi_badan" value={formData.tinggi_badan} onChange={handleChange} style={inputForm} /></div>
                                    <div><label style={labelForm}>Berat (kg)</label><input type="number" name="berat_badan" value={formData.berat_badan} onChange={handleChange} style={inputForm} /></div>
                                </div>

                                <div><label style={labelForm}>No. WhatsApp *</label><input type="text" name="telepon" value={formData.telepon} onChange={handleChange} required style={inputForm} /></div>
                                <div><label style={labelForm}>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} style={inputForm} /></div>
                                <div><label style={labelForm}>Asal Sekolah Terakhir *</label><input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} required style={inputForm} /></div>
                            </div>

                            {/* 2. RIWAYAT PENDIDIKAN */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>II. Riwayat Pendidikan</h3>
                                <button type="button" onClick={() => addArrayItem('pendidikan_history', { tahun_masuk: '', tahun_lulus: '', nama_institusi: '', jurusan: '' })} style={btnAddArray}>+ Tambah Pendidikan</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                                {formData.pendidikan_history.map((edu, idx) => (
                                    <div key={idx} style={dynamicRowStyle}>
                                        <input style={inputForm} placeholder="Tahun Masuk" value={edu.tahun_masuk} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'tahun_masuk', e.target.value)} />
                                        <input style={inputForm} placeholder="Tahun Lulus" value={edu.tahun_lulus} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'tahun_lulus', e.target.value)} />
                                        <input style={inputForm} placeholder="Nama Institusi" value={edu.nama_institusi} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'nama_institusi', e.target.value)} />
                                        <input style={inputForm} placeholder="Jurusan" value={edu.jurusan} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'jurusan', e.target.value)} />
                                        <button type="button" onClick={() => removeArrayItem('pendidikan_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                {formData.pendidikan_history.length === 0 && <div style={emptyArrayText}>Belum ada riwayat pendidikan yang ditambahkan.</div>}
                            </div>

                            {/* 3. PENGALAMAN KERJA */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>III. Riwayat Pekerjaan</h3>
                                <button type="button" onClick={() => addArrayItem('kerja_history', { bulan_tahun_masuk: '', bulan_tahun_keluar: '', nama_perusahaan: '', jabatan: '' })} style={btnAddArray}>+ Tambah Pengalaman</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                                {formData.kerja_history.map((job, idx) => (
                                    <div key={idx} style={dynamicRowStyle}>
                                        <input style={inputForm} type="month" value={job.bulan_tahun_masuk} onChange={(e) => handleArrayChange('kerja_history', idx, 'bulan_tahun_masuk', e.target.value)} />
                                        <input style={inputForm} type="month" value={job.bulan_tahun_keluar} onChange={(e) => handleArrayChange('kerja_history', idx, 'bulan_tahun_keluar', e.target.value)} />
                                        <input style={inputForm} placeholder="Nama Perusahaan" value={job.nama_perusahaan} onChange={(e) => handleArrayChange('kerja_history', idx, 'nama_perusahaan', e.target.value)} />
                                        <input style={inputForm} placeholder="Jabatan / Bagian" value={job.jabatan} onChange={(e) => handleArrayChange('kerja_history', idx, 'jabatan', e.target.value)} />
                                        <button type="button" onClick={() => removeArrayItem('kerja_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                {formData.kerja_history.length === 0 && <div style={emptyArrayText}>Belum ada pengalaman kerja yang ditambahkan.</div>}
                            </div>

                            {/* 4. SUSUNAN KELUARGA */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>IV. Susunan Keluarga</h3>
                                <button type="button" onClick={() => addArrayItem('keluarga_history', { hubungan: '', nama: '', umur: '', pekerjaan: '', domisili: '' })} style={btnAddArray}>+ Tambah Keluarga</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                                {formData.keluarga_history.map((fam, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 2fr 2fr auto', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <select style={inputForm} value={fam.hubungan} onChange={(e) => handleArrayChange('keluarga_history', idx, 'hubungan', e.target.value)}>
                                            <option value="">- Hubungan -</option><option value="Ayah">Ayah</option><option value="Ibu">Ibu</option>
                                            <option value="Kakak">Kakak</option><option value="Adik">Adik</option><option value="Suami">Suami</option>
                                            <option value="Istri">Istri</option><option value="Anak">Anak</option>
                                        </select>
                                        <input style={inputForm} placeholder="Nama Lengkap" value={fam.nama} onChange={(e) => handleArrayChange('keluarga_history', idx, 'nama', e.target.value)} />
                                        <input style={inputForm} type="number" placeholder="Umur" value={fam.umur} onChange={(e) => handleArrayChange('keluarga_history', idx, 'umur', e.target.value)} />
                                        <input style={inputForm} placeholder="Pekerjaan" value={fam.pekerjaan} onChange={(e) => handleArrayChange('keluarga_history', idx, 'pekerjaan', e.target.value)} />
                                        <input style={inputForm} placeholder="Domisili" value={fam.domisili} onChange={(e) => handleArrayChange('keluarga_history', idx, 'domisili', e.target.value)} />
                                        <button type="button" onClick={() => removeArrayItem('keluarga_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                {formData.keluarga_history.length === 0 && <div style={emptyArrayText}>Belum ada data keluarga yang ditambahkan.</div>}
                            </div>
                            
                            {/* ── TOMBOL AKSI ── */}
                            <div style={{ display: 'flex', gap: '15px', borderTop: '2px solid #e2e8f0', paddingTop: '25px' }}>
                                <button type="submit" disabled={isLoading} style={{ flex: 1, background: brandNavy, color: 'white', padding: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', justifyContent: 'center', fontSize: '1rem', transition: '0.2s', boxShadow: '0 4px 6px rgba(16, 24, 105, 0.2)' }}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : editingId ? 'Simpan Koreksi Data' : 'Daftarkan Siswa ke Sistem'}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={resetForm} style={{ padding: '16px 30px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Batal Edit</button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* ── TABEL RIWAYAT PENDAFTARAN ── */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontSize: '1.2rem', fontWeight: 800 }}><Users size={22} color={brandNavy}/> Histori Pendaftar Terbaru</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead><tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={thStyle}>Identitas Siswa</th>
                                    <th style={thStyle}>Data Demografi</th>
                                    <th style={thStyle}>Kontak & Pendidikan</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>Aksi Data</th>
                                </tr></thead>
                                <tbody>
                                    {recentStudents.map((s) => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>{s.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>NIK: {s.nik}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ color: '#475569', fontWeight: 600 }}>{s.tempat_lahir}, {s.tanggal_lahir}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.jenis_kelamin || '-'}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ color: '#475569', fontWeight: 600 }}>{s.telepon || '-'}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.asal_sekolah || '-'}</div>
                                            </td>
                                            <td style={{...tdStyle, textAlign: 'center'}}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button onClick={() => handleEditInit(s)} style={actionBtn('#3b82f6')} title="Edit Semua Data"><Edit3 size={18}/></button>
                                                    <button onClick={() => setUploadModalId(s.id)} style={actionBtn('#10b981')} title="Unggah / Update Foto Pas"><Camera size={18}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentStudents.length === 0 && (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontWeight: 600 }}>Belum ada data pendaftar baru di sistem.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── MODAL UPLOAD FOTO ── */}
                {uploadModalId && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>Unggah Foto Siswa</h3>
                                <button onClick={() => setUploadModalId(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                            </div>
                            <RegistrationPhotoUpload 
                                studentId={uploadModalId} 
                                onUploadSuccess={() => { setUploadModalId(null); fetchRecentStudents(); }} 
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── STYLE OBJECTS ──
const sectionTitle = { fontSize: '1.2rem', color: '#1e293b', fontWeight: 800, margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' };
const labelForm = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputForm = { width: '100%', padding: '12px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc', transition: 'border 0.2s' };

const dynamicRowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 2fr auto', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const btnAddArray = { background: '#dbeafe', color: brandNavy, border: `1px solid ${brandNavy}`, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: '0.2s' };
const btnRemoveArray = { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const emptyArrayText = { textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1' };

const thStyle = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' };
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle' };
const actionBtn = (color) => ({ background: 'white', border: `1px solid ${color}40`, color: color, cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s' });

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '35px', borderRadius: '15px', width: '450px', maxWidth: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };