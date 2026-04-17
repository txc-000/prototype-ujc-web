import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    BookOpen, GraduationCap, ClipboardList, Search, Loader2, 
    UserCircle, Edit3, X, Award, CheckCircle, BarChart2, BookA 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

export default function DashboardPendidikan() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('KELAS_REGULER'); // KELAS_REGULER, KELAS_DIKLAT, REKAP_NILAI
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE MODAL EVALUASI ──
    const [isEvalOpen, setIsEvalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evalForm, setEvalForm] = useState({ jenis_tes: 'UJIAN_BAB', nilai: '', catatan: '' });

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchUserProfile(user.id);
        };
        initData();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [activeTab]);

    const fetchUserProfile = async (userId) => {
        try {
            const { data } = await supabase.from('employees').select('nama_lengkap, id_karyawan, poin_pendaftaran, master_role(nama_role)').eq('id', userId).maybeSingle();
            if (data) { setUserProfile(data); setMyPoints(data.poin_pendaftaran || 0); }
        } catch (err) {}
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            let stageFilter = [];
            if (activeTab === 'KELAS_REGULER') stageFilter = ['PENDIDIKAN REGULER'];
            if (activeTab === 'KELAS_DIKLAT') stageFilter = ['PENDIDIKAN DIKLAT'];
            if (activeTab === 'REKAP_NILAI') stageFilter = ['PENDIDIKAN REGULER', 'PENDIDIKAN DIKLAT', 'AVAILABLE'];

            const { data, error } = await supabase
                .from('students')
                .select('id, nik, nama_lengkap, tahap_sekarang, nilai_bahasa, nilai_history, asal_sekolah')
                .in('tahap_sekarang', stageFilter)
                .order('nama_lengkap', { ascending: true });

            if (error) throw error;
            
            // Format nilai_history yang mungkin null menjadi array
            const formattedData = (data || []).map(s => ({
                ...s,
                nilai_history: Array.isArray(s.nilai_history) ? s.nilai_history : 
                              (typeof s.nilai_history === 'string' ? JSON.parse(s.nilai_history || '[]') : [])
            }));
            
            setStudents(formattedData);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const logActivity = async (actionDesc) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if(user) await supabase.from('activity_logs').insert([{ user_id: user.id, keterangan: actionDesc }]);
        } catch (err) {}
    };

    const incrementPoint = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const newPoint = myPoints + 1;
            await supabase.from('employees').update({ poin_pendaftaran: newPoint }).eq('id', user.id);
            setMyPoints(newPoint);
        } catch (err) {}
    };

    // ── HANDLER EVALUASI (INPUT NILAI) ──
    const openEvalModal = (student) => {
        setSelectedStudent(student);
        setEvalForm({ jenis_tes: 'UJIAN BAB', nilai: '', catatan: '' });
        setIsEvalOpen(true);
    };

    const handleEvalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dateStr = new Date().toLocaleDateString('id-ID');
            const newRecord = {
                tanggal: dateStr,
                jenis_tes: evalForm.jenis_tes,
                nilai: Number(evalForm.nilai),
                catatan: evalForm.catatan,
                instruktur: userProfile?.nama_lengkap
            };

            const currentHistory = selectedStudent.nilai_history || [];
            const updatedHistory = [...currentHistory, newRecord];
            
            // Kalkulasi ulang rata-rata untuk update kolom nilai_bahasa utama
            const totalNilai = updatedHistory.reduce((sum, item) => sum + item.nilai, 0);
            const avgNilai = Math.round(totalNilai / updatedHistory.length);

            const { error } = await supabase.from('students')
                .update({ 
                    nilai_history: updatedHistory, 
                    nilai_bahasa: avgNilai,
                    updated_at: new Date()
                })
                .eq('id', selectedStudent.id);

            if (error) throw error;

            await logActivity(`Menginput nilai ${evalForm.jenis_tes} untuk ${selectedStudent.nama_lengkap}`);
            await incrementPoint();

            alert("Nilai berhasil disimpan!");
            setIsEvalOpen(false);
            fetchStudents();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const handleLulusKelas = async (id, nama) => {
        if(!window.confirm(`Luluskan ${nama} dari kelas ini? Status akan diset AVAILABLE (Siap Interview)`)) return;
        try {
            const { error } = await supabase.from('students').update({ tahap_sekarang: 'AVAILABLE' }).eq('id', id);
            if (error) throw error;
            await logActivity(`Meluluskan kelas: ${nama}`);
            fetchStudents();
        } catch (err) { alert(err.message); }
    };

    const filteredStudents = students.filter(s => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Divisi Pendidikan</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Pelatihan & Evaluasi</p>
                </div>
                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><Award size={20}/></div>
                    <div><div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>POIN MENGAJAR</div><div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{myPoints}</div></div>
                </div>
                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <button onClick={() => setActiveTab('KELAS_REGULER')} style={activeTab === 'KELAS_REGULER' ? activeMenuS : inactiveMenuS}><BookOpen size={18} /> Kelas Reguler (Dasar)</button>
                    <button onClick={() => setActiveTab('KELAS_DIKLAT')} style={activeTab === 'KELAS_DIKLAT' ? activeMenuS : inactiveMenuS}><GraduationCap size={18} /> Kelas Diklat (Pematangan)</button>
                    <button onClick={() => setActiveTab('REKAP_NILAI')} style={activeTab === 'REKAP_NILAI' ? activeMenuS : inactiveMenuS}><BarChart2 size={18} /> Rekap Nilai Siswa</button>
                </nav>
                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <UserCircle size={32} color={brandNavy} />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile?.nama_lengkap || 'Memuat...'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>INSTRUKTUR / SENSEI</div>
                        </div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '8px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Keluar</button>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>
                            {activeTab === 'KELAS_REGULER' ? 'Manajemen Kelas Reguler' : activeTab === 'KELAS_DIKLAT' ? 'Manajemen Kelas Diklat' : 'Rekapitulasi Evaluasi Siswa'}
                        </h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Input absensi, materi, dan nilai evaluasi siswa secara berkala.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                        <input type="text" placeholder="Cari Nama Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }} />
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {activeTab !== 'REKAP_NILAI' ? (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thS}>Siswa</th>
                                        <th style={thS}>Rata-Rata Nilai</th>
                                        <th style={thS}>Riwayat Tes Terakhir</th>
                                        <th style={{...thS, textAlign: 'center'}}>Aksi Evaluasi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? <tr><td colSpan="4" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" style={{margin:'0 auto'}}/></td></tr> : filteredStudents.map(s => {
                                        const lastRecord = s.nilai_history.length > 0 ? s.nilai_history[s.nilai_history.length - 1] : null;
                                        return (
                                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={tdS}>
                                                    <div style={{fontWeight:800, color: '#1e293b'}}>{s.nama_lengkap}</div>
                                                    <div style={{fontSize:'0.75rem', color:'#64748b'}}>{s.nik}</div>
                                                </td>
                                                <td style={tdS}>
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: brandNavy }}>{s.nilai_bahasa || 0}</span> / 100
                                                </td>
                                                <td style={tdS}>
                                                    {lastRecord ? (
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{lastRecord.jenis_tes}: <span style={{color: '#10b981'}}>{lastRecord.nilai}</span></div>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{lastRecord.tanggal} | {lastRecord.catatan}</div>
                                                        </div>
                                                    ) : <span style={{color: '#94a3b8', fontSize: '0.8rem'}}>Belum ada tes</span>}
                                                </td>
                                                <td style={{...tdS, textAlign: 'center'}}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button onClick={() => openEvalModal(s)} style={btnA('#f59e0b')} title="Input Nilai Baru"><Edit3 size={18}/></button>
                                                        <button onClick={() => handleLulusKelas(s.id, s.nama_lengkap)} style={{...btnA('#10b981'), background: '#ecfdf5', fontWeight: 700, fontSize: '0.8rem'}} title="Luluskan Kelas">Luluskan</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredStudents.length === 0 && !isLoading && <tr><td colSpan="4" style={{padding:'40px', textAlign:'center', color:'#94a3b8', fontWeight:600}}>Tidak ada siswa di kelas ini.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {filteredStudents.map(s => (
                                <div key={s.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama_lengkap}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.tahap_sekarang}</div>
                                        </div>
                                        <div style={{ background: '#eff6ff', color: brandNavy, padding: '8px', borderRadius: '8px', fontWeight: 900, fontSize: '1.2rem' }}>{s.nilai_bahasa || 0}</div>
                                    </div>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                                        {s.nilai_history.length === 0 ? <div style={{fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '10px 0'}}>Belum ada riwayat tes</div> : s.nilai_history.map((h, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
                                                <div><div style={{fontWeight: 700, color: '#334155'}}>{h.jenis_tes}</div><div style={{color: '#64748b', fontSize: '0.7rem'}}>{h.tanggal}</div></div>
                                                <div style={{fontWeight: 800, color: '#10b981'}}>{h.nilai}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── MODAL EVALUASI ── */}
                {isEvalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900 }}>Evaluasi Pembelajaran</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{selectedStudent.nama_lengkap}</p>
                                </div>
                                <button onClick={() => setIsEvalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>

                            <form onSubmit={handleEvalSubmit}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelS}>Jenis Tes / Penilaian</label>
                                    <select required style={inputS} value={evalForm.jenis_tes} onChange={(e) => setEvalForm({...evalForm, jenis_tes: e.target.value})}>
                                        <option value="UJIAN BAB">Ujian Bab (Harian)</option>
                                        <option value="TRYOUT JLPT">Tryout JLPT / JFT</option>
                                        <option value="UJIAN FISIK">Ujian Fisik / FMD</option>
                                        <option value="SIKAP ATTITUDE">Penilaian Sikap (Attitude)</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelS}>Nilai Angka (0 - 100)</label>
                                    <input type="number" min="0" max="100" required style={{...inputS, fontSize: '1.2rem', fontWeight: 800, color: brandNavy}} value={evalForm.nilai} onChange={(e) => setEvalForm({...evalForm, nilai: e.target.value})} placeholder="Contoh: 85" />
                                </div>
                                <div style={{ marginBottom: '25px' }}>
                                    <label style={labelS}>Catatan Instruktur</label>
                                    <textarea rows="3" style={{...inputS, resize: 'vertical'}} value={evalForm.catatan} onChange={(e) => setEvalForm({...evalForm, catatan: e.target.value})} placeholder="Kekurangan/kelebihan siswa pada materi ini..."></textarea>
                                </div>
                                <button type="submit" disabled={isSubmitting} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Evaluasi'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── STYLE OBJECTS ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', fontWeight: 800, width: '100%', textAlign: 'left', cursor: 'pointer' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 700, width: '100%', textAlign: 'left', cursor: 'pointer' };
const thS = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdS = { padding: '15px 20px', fontSize: '0.9rem' };
const btnA = (c) => ({ background: 'white', border: `1px solid ${c}40`, color: c, padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' });
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const labelS = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' };
const inputS = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#f8fafc' };