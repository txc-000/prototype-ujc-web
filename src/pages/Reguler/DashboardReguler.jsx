import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, FileText, Activity, CheckCircle, Search, Plus, Loader2, Edit3, Camera, X, Trash2, Award, UserCircle, ClipboardList, MessageCircle, PhoneOutgoing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RegistrationPhotoUpload from './RegistrationPhotoUpload'; 

const brandNavy = '#101869';

export default function DashboardReguler() {
    const navigate = useNavigate();
    
    // ── STATE DASHBOARD UTAMA ──
    const [activeTab, setActiveTab] = useState('PENDAFTARAN'); // PENDAFTARAN, SELEKSI, DIKLAT, PEMANGGILAN
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // ── STATE USER LOGIN ──
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE FORM & MODAL ──
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploadModalId, setUploadModalId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [evalModal, setEvalModal] = useState(null); 
    const [evalFormData, setEvalFormData] = useState({ medical_checkup_status: '', nilai_bahasa: '' });

    const initialFormState = {
        nik: '', nama_lengkap: '', nama_jepang: '', tempat_lahir: '', tanggal_lahir: '', 
        jenis_kelamin: '', agama: '', golongan_darah: '', tinggi_badan: '', berat_badan: '', 
        telepon: '', email: '', asal_sekolah: '',
        pendidikan_history: [], kerja_history: [], keluarga_history: []
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user);
                fetchUserProfile(user.id);
            }
        };
        initData();
    }, []);

    useEffect(() => {
        fetchStudents();
        if (isFormOpen && activeTab !== 'PENDAFTARAN') {
            setIsFormOpen(false);
            resetForm();
        }
    }, [activeTab]);

    const fetchUserProfile = async (userId) => {
        try {
            const { data } = await supabase.from('employees').select('nama_lengkap, id_karyawan, poin_pendaftaran, master_role(nama_role)').eq('id', userId).maybeSingle();
            if (data) { setUserProfile(data); setMyPoints(data.poin_pendaftaran || 0); }
        } catch (err) { console.error("Gagal load profil:", err.message); }
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('students').select('*').order('created_at', { ascending: false });

            if (activeTab === 'PENDAFTARAN') query = query.in('tahap_sekarang', ['REGISTRASI', 'PEMBERKASAN']);
            else if (activeTab === 'SELEKSI') query = query.in('tahap_sekarang', ['SELEKSI AWAL']);
            else if (activeTab === 'DIKLAT') query = query.in('tahap_sekarang', ['PENDIDIKAN REGULER']);
            else if (activeTab === 'PEMANGGILAN') {
                // Filter untuk tab pemanggilan: Yang nganggur nunggu interview ATAU yang status akhirnya BELUM DAPAT JOB
                query = query.or('tahap_sekarang.eq.AVAILABLE,status_akhir.eq.BELUM DAPAT JOB');
            }

            const { data, error } = await query;
            if (error) throw error;
            setStudents(data || []);
        } catch (error) { console.error("Error:", error.message); } 
        finally { setIsLoading(false); }
    };

    const logActivity = async (actionDesc) => {
        if (!currentUser) return;
        try { await supabase.from('activity_logs').insert([{ user_id: currentUser.id, keterangan: actionDesc }]); } catch (err) {}
    };

    const incrementPoint = async () => {
        if (!currentUser) return;
        try {
            const newPoint = myPoints + 1;
            await supabase.from('employees').update({ poin_pendaftaran: newPoint }).eq('id', currentUser.id);
            setMyPoints(newPoint);
        } catch (err) {}
    };

    // ── FUNGSI MEMANGGIL WA SISWA ──
    const handleHubungiSiswa = (nama, telepon, konteks) => {
        if (!telepon) return alert('Nomor telepon tidak tersedia untuk siswa ini.');
        let formattedPhone = telepon.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.substring(1);
        
        let message = `Halo ${nama}, ini dari LPK UJC Divisi Reguler. `;
        if (konteks === 'SELEKSI') message += `Kami ingin mengingatkan jadwal seleksi/MCU Anda.`;
        else if (konteks === 'INTERVIEW') message += `Terdapat Job Order baru yang sesuai untuk Anda. Silakan hubungi kami untuk konfirmasi kesiapan Interview.`;
        else message += `Ada informasi penting terkait status Anda. Kapan ada waktu untuk ke kantor?`;

        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
        logActivity(`Menghubungi siswa via WA: ${nama}`);
    };

    // HANDLER FORM (SAMA SEPERTI SEBELUMNYA)
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleArrayChange = (field, index, key, value) => { const updated = [...formData[field]]; updated[index][key] = value; setFormData({ ...formData, [field]: updated }); };
    const addArrayItem = (field, newItem) => setFormData({ ...formData, [field]: [...formData[field], newItem] });
    const removeArrayItem = (field, index) => setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });

    const handleEditInit = (siswa) => {
        setEditingId(siswa.id);
        const cleanArr = (arr) => { if (!arr) return []; if (Array.isArray(arr)) return arr; if (typeof arr === 'string') { try { return JSON.parse(arr); } catch { return []; } } return []; };
        setFormData({
            nik: siswa.nik || '', nama_lengkap: siswa.nama_lengkap || '', nama_jepang: siswa.nama_jepang || '', tempat_lahir: siswa.tempat_lahir || '', tanggal_lahir: siswa.tanggal_lahir || '', jenis_kelamin: siswa.jenis_kelamin || '', agama: siswa.agama || '', golongan_darah: siswa.golongan_darah || '', tinggi_badan: siswa.tinggi_badan || '', berat_badan: siswa.berat_badan || '', telepon: siswa.telepon || '', email: siswa.email || '', asal_sekolah: siswa.asal_sekolah || '',
            pendidikan_history: cleanArr(siswa.pendidikan_history), kerja_history: cleanArr(siswa.kerja_history), keluarga_history: cleanArr(siswa.keluarga_history)
        });
        setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => { setEditingId(null); setFormData(initialFormState); setIsFormOpen(false); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        const payload = { ...formData, tinggi_badan: formData.tinggi_badan ? parseInt(formData.tinggi_badan) : null, berat_badan: formData.berat_badan ? parseInt(formData.berat_badan) : null };
        try {
            if (editingId) {
                const { error } = await supabase.from('students').update(payload).eq('id', editingId);
                if (error) throw error; alert("Data Berhasil Diperbarui!");
            } else {
                payload.tahap_sekarang = 'REGISTRASI'; payload.status_akhir = 'Proses'; payload.created_by = currentUser ? currentUser.id : null; 
                const { data, error } = await supabase.from('students').insert([payload]).select();
                if (error) throw error;
                await logActivity(`Mendaftarkan siswa: ${payload.nama_lengkap}`); await incrementPoint(); 
                alert("Siswa Didaftarkan!"); if (data && data.length > 0) setUploadModalId(data[0].id);
            }
            resetForm(); fetchStudents();
        } catch (err) { alert("Error: " + err.message); } finally { setIsSubmitting(false); }
    };

    const openEvalModal = (student) => { setEvalModal(student); setEvalFormData({ medical_checkup_status: student.medical_checkup_status || '', nilai_bahasa: student.nilai_bahasa || '' }); };
    
    const handleEvalSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const { error } = await supabase.from('students').update({ medical_checkup_status: evalFormData.medical_checkup_status || null, nilai_bahasa: evalFormData.nilai_bahasa ? parseFloat(evalFormData.nilai_bahasa) : null }).eq('id', evalModal.id);
            if (error) throw error; alert("Evaluasi Disimpan!"); setEvalModal(null); fetchStudents();
        } catch (err) { alert("Gagal: " + err.message); } finally { setIsSubmitting(false); }
    };

    const updateStage = async (id, nama, newStage, successMsg) => {
        if (!window.confirm(`Pindahkan ${nama} ke tahap ${newStage}?`)) return;
        try {
            const { error } = await supabase.from('students').update({ tahap_sekarang: newStage }).eq('id', id);
            if (error) throw error; alert(successMsg); fetchStudents();
        } catch (error) { alert("Gagal: " + error.message); }
    };

    const filteredStudents = students.filter(s => (s.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.nik || '').includes(searchTerm));

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR ── */}
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Divisi Reguler</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Pusat Komando & Diklat</p>
                </div>

                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><Award size={20}/></div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Poin Keaktifan Anda</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{myPoints} <span style={{fontSize:'0.8rem', color:'#64748b'}}>Siswa</span></div>
                    </div>
                </div>

                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <button onClick={() => setActiveTab('PENDAFTARAN')} style={activeTab === 'PENDAFTARAN' ? activeMenuS : inactiveMenuS}><Users size={18} /> Pendaftaran Baru</button>
                    <button onClick={() => setActiveTab('SELEKSI')} style={activeTab === 'SELEKSI' ? activeMenuS : inactiveMenuS}><Activity size={18} /> Seleksi & MCU 1</button>
                    <button onClick={() => setActiveTab('DIKLAT')} style={activeTab === 'DIKLAT' ? activeMenuS : inactiveMenuS}><FileText size={18} /> Kelas Reguler (Diklat)</button>
                    <button onClick={() => setActiveTab('PEMANGGILAN')} style={activeTab === 'PEMANGGILAN' ? activeMenuS : inactiveMenuS}><PhoneOutgoing size={18} /> Daftar Pemanggilan</button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: brandNavy }}><UserCircle size={24} /></div>
                        <div style={{ overflow: 'hidden' }}><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile ? userProfile.nama_lengkap : 'Memuat...'}</div><div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{userProfile?.master_role?.nama_role || 'Staf'}</div></div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '10px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>Keluar Sistem</button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900 }}>
                            {activeTab === 'PENDAFTARAN' ? (isFormOpen ? (editingId ? 'Edit Data Pendaftar' : 'Form Pendaftaran Baru') : 'Manajemen Pendaftar') : activeTab === 'SELEKSI' ? 'Proses Seleksi & Kesehatan' : activeTab === 'DIKLAT' ? 'Siswa Pendidikan Reguler' : 'Daftar Pemanggilan Siswa'}
                        </h1>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>
                            {activeTab === 'PEMANGGILAN' ? 'Pantau dan panggil siswa yang Available (siap interview) atau Tanggungan (Belum Dapat Job).' : 'Kelola data, evaluasi, dan pantau perkembangan siswa.'}
                        </p>
                    </div>
                    
                    {!isFormOpen && (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                                <input type="text" placeholder="Cari NIK / Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }} />
                            </div>
                            {activeTab === 'PENDAFTARAN' && <button onClick={() => setIsFormOpen(true)} style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18}/> Tambah Pendaftar</button>}
                        </div>
                    )}
                </header>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                    {isFormOpen && activeTab === 'PENDAFTARAN' ? (
                        /* ================== FORM PENDAFTARAN (DISEMBUNYIKAN UNTUK EFISIENSI KODE, SAMA SEPERTI SEBELUMNYA) ================== */
                        <div style={{ background: 'white', padding: '35px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `5px solid ${brandNavy}`, marginBottom: '40px' }}>
                            <form onSubmit={handleSubmit}>
                                {/* 1. IDENTITAS */}
                                <h3 style={sectionTitle}>I. Identitas Dasar</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '40px' }}>
                                    <div><label style={labelForm}>NIK *</label><input type="text" name="nik" value={formData.nik} onChange={handleChange} required style={inputForm} /></div>
                                    <div><label style={labelForm}>Nama Lengkap *</label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} required style={inputForm} /></div>
                                    <div><label style={labelForm}>Nama Jepang</label><input type="text" name="nama_jepang" value={formData.nama_jepang} onChange={handleChange} style={inputForm} /></div>
                                    <div><label style={labelForm}>Tempat Lahir *</label><input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} required style={inputForm} /></div>
                                    <div><label style={labelForm}>Tanggal Lahir *</label><input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} required style={inputForm} /></div>
                                    <div><label style={labelForm}>Jenis Kelamin *</label><select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} required style={inputForm}><option value="">-- Pilih --</option><option value="L">Laki-Laki</option><option value="P">Perempuan</option></select></div>
                                    <div><label style={labelForm}>Agama</label><select name="agama" value={formData.agama} onChange={handleChange} style={inputForm}><option value="">-- Pilih --</option><option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option></select></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div><label style={labelForm}>Gol. Darah</label><select name="golongan_darah" value={formData.golongan_darah} onChange={handleChange} style={inputForm}><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select></div>
                                        <div><label style={labelForm}>Tinggi (cm)</label><input type="number" name="tinggi_badan" value={formData.tinggi_badan} onChange={handleChange} style={inputForm} /></div>
                                        <div><label style={labelForm}>Berat (kg)</label><input type="number" name="berat_badan" value={formData.berat_badan} onChange={handleChange} style={inputForm} /></div>
                                    </div>
                                    <div><label style={labelForm}>No. WhatsApp *</label><input type="text" name="telepon" value={formData.telepon} onChange={handleChange} required style={inputForm} /></div>
                                    <div><label style={labelForm}>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} style={inputForm} /></div>
                                    <div><label style={labelForm}>Asal Sekolah *</label><input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} required style={inputForm} /></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>II. Riwayat Pendidikan</h3><button type="button" onClick={() => addArrayItem('pendidikan_history', { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' })} style={btnAddArray}>+ Tambah Pendidikan</button></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>{formData.pendidikan_history.map((edu, idx) => (<div key={idx} style={dynamicRowStyle}><input style={inputForm} placeholder="Jenjang" value={edu.jenjang} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'jenjang', e.target.value)} /><input style={inputForm} placeholder="Nama Institusi" value={edu.nama_sekolah} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'nama_sekolah', e.target.value)} /><input style={inputForm} placeholder="Jurusan" value={edu.jurusan} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'jurusan', e.target.value)} /><div style={{display:'flex', gap:'5px'}}><input style={inputForm} placeholder="Thn Masuk" value={edu.thn_awal} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'thn_awal', e.target.value)} /><input style={inputForm} placeholder="Thn Lulus" value={edu.thn_akhir} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'thn_akhir', e.target.value)} /></div><button type="button" onClick={() => removeArrayItem('pendidikan_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button></div>))}{formData.pendidikan_history.length === 0 && <div style={emptyArrayText}>Belum ada riwayat pendidikan.</div>}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>III. Pengalaman Kerja</h3><button type="button" onClick={() => addArrayItem('kerja_history', { nama_perusahaan: '', jenis_pekerjaan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' })} style={btnAddArray}>+ Tambah Pekerjaan</button></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>{formData.kerja_history.map((job, idx) => (<div key={idx} style={dynamicRowStyle}><input style={inputForm} placeholder="Nama Perusahaan" value={job.nama_perusahaan} onChange={(e) => handleArrayChange('kerja_history', idx, 'nama_perusahaan', e.target.value)} /><input style={inputForm} placeholder="Posisi" value={job.jenis_pekerjaan} onChange={(e) => handleArrayChange('kerja_history', idx, 'jenis_pekerjaan', e.target.value)} /><div style={{display:'flex', gap:'5px'}}><input style={inputForm} placeholder="Thn Masuk" value={job.thn_awal} onChange={(e) => handleArrayChange('kerja_history', idx, 'thn_awal', e.target.value)} /><input style={inputForm} placeholder="Thn Keluar" value={job.thn_akhir} onChange={(e) => handleArrayChange('kerja_history', idx, 'thn_akhir', e.target.value)} /></div><button type="button" onClick={() => removeArrayItem('kerja_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button></div>))}{formData.kerja_history.length === 0 && <div style={emptyArrayText}>Belum ada pengalaman kerja.</div>}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>IV. Kontak Keluarga</h3><button type="button" onClick={() => addArrayItem('keluarga_history', { hubungan: '', nama: '', pendapatan: '', alamat: '', no_hp: '', tipe: 'DARURAT' })} style={btnAddArray}>+ Tambah Keluarga</button></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>{formData.keluarga_history.map((fam, idx) => (<div key={idx} style={dynamicRowStyle}><input style={inputForm} placeholder="Hubungan" value={fam.hubungan} onChange={(e) => handleArrayChange('keluarga_history', idx, 'hubungan', e.target.value)} /><input style={inputForm} placeholder="Nama" value={fam.nama} onChange={(e) => handleArrayChange('keluarga_history', idx, 'nama', e.target.value)} /><input style={inputForm} placeholder="Pekerjaan / Penghasilan" value={fam.pendapatan} onChange={(e) => handleArrayChange('keluarga_history', idx, 'pendapatan', e.target.value)} /><input style={inputForm} placeholder="No HP" value={fam.no_hp} onChange={(e) => handleArrayChange('keluarga_history', idx, 'no_hp', e.target.value)} /><button type="button" onClick={() => removeArrayItem('keluarga_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button></div>))}{formData.keluarga_history.length === 0 && <div style={emptyArrayText}>Belum ada data keluarga.</div>}</div>
                                <div style={{ display: 'flex', gap: '15px', borderTop: '2px solid #e2e8f0', paddingTop: '25px' }}><button type="button" onClick={resetForm} style={{ padding: '16px 30px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Batal</button><button type="submit" disabled={isSubmitting} style={{ flex: 1, background: brandNavy, color: 'white', padding: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>{isSubmitting ? <Loader2 className="animate-spin" /> : editingId ? 'Simpan Koreksi' : 'Daftarkan Siswa (+1 Poin)'}</button></div>
                            </form>
                        </div>
                    ) : (
                        /* ================== TABEL DATA ================== */
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thStyle}>Identitas Siswa</th>
                                        <th style={thStyle}>Status Tahapan</th>
                                        {activeTab === 'SELEKSI' && <th style={thStyle}>Status MCU</th>}
                                        {activeTab === 'DIKLAT' && <th style={thStyle}>Nilai Bahasa</th>}
                                        {activeTab === 'PEMANGGILAN' && <th style={thStyle}>Keterangan Panggilan</th>}
                                        <th style={{...thStyle, textAlign: 'center'}}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px auto' }} /> Memuat data...</td></tr> : filteredStudents.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 600 }}>Tidak ada data siswa.</td></tr> : filteredStudents.map((student) => (
                                        <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{student.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>NIK: {student.nik} | {student.telepon || 'No HP (-) '}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: '#e0e7ff', color: '#3730a3' }}>{student.tahap_sekarang}</span>
                                            </td>
                                            
                                            {activeTab === 'SELEKSI' && <td style={tdStyle}><span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: student.medical_checkup_status === 'FIT' ? '#dcfce7' : (student.medical_checkup_status === 'UNFIT' ? '#fee2e2' : '#fef3c7'), color: student.medical_checkup_status === 'FIT' ? '#166534' : (student.medical_checkup_status === 'UNFIT' ? '#991b1b' : '#92400e') }}>{student.medical_checkup_status || 'PENDING'}</span></td>}
                                            {activeTab === 'DIKLAT' && <td style={tdStyle}><span style={{ fontWeight: 800, fontSize: '1.1rem', color: brandNavy }}>{student.nilai_bahasa || '-'}</span> / 100</td>}
                                            {activeTab === 'PEMANGGILAN' && (
                                                <td style={tdStyle}>
                                                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: student.status_akhir === 'BELUM DAPAT JOB' ? '#fee2e2' : '#f1f5f9', color: student.status_akhir === 'BELUM DAPAT JOB' ? '#991b1b' : '#475569' }}>
                                                        {student.status_akhir === 'BELUM DAPAT JOB' ? 'Tanggungan (Belum Dapat Job)' : 'Menunggu Job (Available)'}
                                                    </span>
                                                </td>
                                            )}
                                            
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    {activeTab === 'PENDAFTARAN' && (<><button onClick={() => handleEditInit(student)} style={actionBtn('#3b82f6')} title="Edit"><Edit3 size={18}/></button><button onClick={() => setUploadModalId(student.id)} style={actionBtn('#10b981')} title="Foto"><Camera size={18}/></button><button onClick={() => updateStage(student.id, student.nama_lengkap, 'SELEKSI AWAL', 'Dipindah ke Seleksi')} style={{...btnAction, background: brandNavy, color: 'white'}}>Proses Seleksi</button></>)}
                                                    {activeTab === 'SELEKSI' && (<><button onClick={() => openEvalModal(student)} style={actionBtn('#f59e0b')} title="Input MCU"><ClipboardList size={18}/></button><button onClick={() => handleHubungiSiswa(student.nama_lengkap, student.telepon, 'SELEKSI')} style={{...actionBtn('#10b981'), background: '#ecfdf5'}} title="Panggil via WA"><MessageCircle size={18} color="#10b981"/></button><button onClick={() => updateStage(student.id, student.nama_lengkap, 'PENDIDIKAN REGULER', 'Masuk Kelas')} style={{...btnAction, background: brandNavy, color: 'white'}}>Masuk Kelas</button></>)}
                                                    {activeTab === 'DIKLAT' && (<><button onClick={() => openEvalModal(student)} style={actionBtn('#f59e0b')} title="Input Nilai"><ClipboardList size={18}/></button><button onClick={() => updateStage(student.id, student.nama_lengkap, 'AVAILABLE', 'Diset Available')} style={{...btnAction, background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '5px'}}><CheckCircle size={16}/> Set Available</button></>)}
                                                    {activeTab === 'PEMANGGILAN' && (
                                                        <button onClick={() => handleHubungiSiswa(student.nama_lengkap, student.telepon, 'INTERVIEW')} style={{...btnAction, background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                            <MessageCircle size={16}/> Panggil Interview (WA)
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {uploadModalId && ( <div style={modalOverlay}><div style={modalContent}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>Unggah Foto Siswa</h3><button onClick={() => setUploadModalId(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}><X size={20} /></button></div><RegistrationPhotoUpload studentId={uploadModalId} onUploadSuccess={() => { setUploadModalId(null); fetchStudents(); }} /></div></div> )}
                {evalModal && ( <div style={modalOverlay}><form onSubmit={handleEvalSubmit} style={modalContent}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}><div><h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>Input Evaluasi</h3><p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{evalModal.nama_lengkap}</p></div><button type="button" onClick={() => setEvalModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X size={20} /></button></div><div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' }}>{activeTab === 'SELEKSI' && (<div><label style={labelForm}>Status Medical Check-Up (MCU)</label><select value={evalFormData.medical_checkup_status} onChange={(e) => setEvalFormData({...evalFormData, medical_checkup_status: e.target.value})} style={{...inputForm, border: '2px solid #cbd5e1'}}><option value="">-- Belum Ada Hasil --</option><option value="FIT">✅ FIT (Lulus)</option><option value="UNFIT">❌ UNFIT (Gagal)</option></select></div>)}{activeTab === 'DIKLAT' && (<div><label style={labelForm}>Nilai Bahasa Jepang (0-100)</label><input type="number" min="0" max="100" value={evalFormData.nilai_bahasa} onChange={(e) => setEvalFormData({...evalFormData, nilai_bahasa: e.target.value})} style={{...inputForm, border: '2px solid #cbd5e1', fontSize: '1.2rem', fontWeight: 800}} /></div>)}</div><button type="submit" disabled={isSubmitting} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Evaluasi'}</button></form></div> )}

            </main>
        </div>
    );
}

// ── STYLE OBJECTS ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 800, fontSize: '0.95rem' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem', transition: '0.2s' };
const sectionTitle = { fontSize: '1.2rem', color: '#1e293b', fontWeight: 800, margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' };
const labelForm = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputForm = { width: '100%', padding: '12px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const dynamicRowStyle = { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const btnAddArray = { background: '#dbeafe', color: brandNavy, border: `1px solid ${brandNavy}`, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: '0.2s' };
const btnRemoveArray = { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const emptyArrayText = { textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1' };
const thStyle = { padding: '15px 20px', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px 20px', fontSize: '0.95rem', color: '#334155' };
const actionBtn = (color) => ({ background: 'white', border: `1px solid ${color}40`, color: color, cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s' });
const btnAction = { padding: '8px 12px', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '35px', borderRadius: '15px', width: '450px', maxWidth: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };