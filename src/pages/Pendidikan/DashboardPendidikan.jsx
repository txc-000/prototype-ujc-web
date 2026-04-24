import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    BookOpen, GraduationCap, Search, Loader2, UserCircle, Edit3, X, Award, 
    BarChart2, BookA, BrainCircuit, Activity, Save, Trash2, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

export default function DashboardPendidikan() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('KELAS_REGULER'); 
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE MODAL EVALUASI ──
    const [isEvalOpen, setIsEvalOpen] = useState(false);
    const [evalForm, setEvalForm] = useState({ jenis_tes: 'UJIAN_BAB', nilai: '', catatan: '' });

    // ── STATE MODAL RAPORT ──
    const [isRaportOpen, setIsRaportOpen] = useState(false);
    const [pendidikanList, setPendidikanList] = useState([]); 
    const [raportData, setRaportData] = useState({
        kotoba: 0, bunpo: 0, dokkai: 0, choukai: 0, kaiwa: 0,
        kecerdasan: 'B', kedisiplinan: 'B', kerapihan: 'B', perilaku: 'B',
        kepribadian: 'B', teamwork: 'B', inisiatif: 'B', fisik: 'B'
    });

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── HELPER JSON AMAN ──
    const safeParse = (data, fallback) => {
        if (!data) return fallback;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return fallback; }
        }
        return data;
    };

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
            if (activeTab === 'REKAP_NILAI') stageFilter = ['PENDIDIKAN REGULER', 'PENDIDIKAN DIKLAT', 'AVAILABLE', 'ALUMNI', 'SIAP BERANGKAT'];

            // PERBAIKAN: BENAR-BENAR MENGGUNAKAN BINTANG (*) AGAR ERROR 400 HILANG
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .in('tahap_sekarang', stageFilter)
                .order('nama_lengkap', { ascending: true });

            if (error) throw error;
            
            const formattedData = (data || []).map(s => ({
                ...s,
                nilai_history: safeParse(s.nilai_history, []),
                pendidikan_history: safeParse(s.pendidikan_history, []),
                data_raport: safeParse(s.data_raport, {})
            }));
            
            setStudents(formattedData);
        } catch (error) { 
            console.error("Error fetching students:", error); 
        } finally { 
            setIsLoading(false); 
        }
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
                tanggal: dateStr, jenis_tes: evalForm.jenis_tes,
                nilai: Number(evalForm.nilai), catatan: evalForm.catatan, instruktur: userProfile?.nama_lengkap
            };

            const currentHistory = selectedStudent.nilai_history || [];
            const updatedHistory = [...currentHistory, newRecord];
            const totalNilai = updatedHistory.reduce((sum, item) => sum + item.nilai, 0);
            const avgNilai = Math.round(totalNilai / updatedHistory.length);

            const { error } = await supabase.from('students')
                .update({ nilai_history: updatedHistory, nilai_bahasa: avgNilai, updated_at: new Date() })
                .eq('id', selectedStudent.id);

            if (error) throw error;
            await logActivity(`Input nilai ${evalForm.jenis_tes} untuk ${selectedStudent.nama_lengkap}`);
            await incrementPoint();

            alert("Nilai evaluasi harian berhasil disimpan!");
            setIsEvalOpen(false);
            fetchStudents();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const openRaportModal = (student) => {
        setSelectedStudent(student);
        const parsedRaport = student.data_raport || {};
        const parsedPendidikan = student.pendidikan_history || [];
        
        setPendidikanList(Array.isArray(parsedPendidikan) ? parsedPendidikan : []);
        setRaportData({
            kotoba: parsedRaport.kotoba || 0, bunpo: parsedRaport.bunpo || 0,
            dokkai: parsedRaport.dokkai || 0, choukai: parsedRaport.choukai || 0, kaiwa: parsedRaport.kaiwa || 0,
            kecerdasan: parsedRaport.kecerdasan || 'B', kedisiplinan: parsedRaport.kedisiplinan || 'B',
            kerapihan: parsedRaport.kerapihan || 'B', perilaku: parsedRaport.perilaku || 'B',
            kepribadian: parsedRaport.kepribadian || 'B', teamwork: parsedRaport.teamwork || 'B',
            inisiatif: parsedRaport.inisiatif || 'B', fisik: parsedRaport.fisik || 'B'
        });
        setIsRaportOpen(true);
    };

    const handleRaportChange = (e) => {
        const { name, value, type } = e.target;
        setRaportData({ ...raportData, [name]: type === 'number' ? Number(value) : value });
    };

    const addPendidikan = () => setPendidikanList([...pendidikanList, { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' }]);
    const updatePendidikan = (index, field, value) => { const newArr = [...pendidikanList]; newArr[index][field] = value; setPendidikanList(newArr); };
    const removePendidikan = (index) => setPendidikanList(pendidikanList.filter((_, i) => i !== index));

    const saveRaportForm = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('students')
                .update({ data_raport: raportData, pendidikan_history: pendidikanList, updated_at: new Date() })
                .eq('id', selectedStudent.id);

            if (error) throw error;
            await logActivity(`Update raport & history pendidikan: ${selectedStudent.nama_lengkap}`);
            alert('Data Raport & History Pendidikan berhasil disimpan!');
            setIsRaportOpen(false);
            fetchStudents();
        } catch (err) { alert('Gagal menyimpan: ' + err.message); } finally { setIsSubmitting(false); }
    };

    const handleLulusKelas = async (id, nama) => {
        if(!window.confirm(`Luluskan ${nama} dari kelas ini? Status akan diset AVAILABLE`)) return;
        try {
            const { error } = await supabase.from('students').update({ tahap_sekarang: 'AVAILABLE', updated_at: new Date() }).eq('id', id);
            if (error) throw error;
            await logActivity(`Meluluskan kelas: ${nama}`);
            fetchStudents();
        } catch (err) { alert(err.message); }
    };

    const filteredStudents = students.filter(s => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalAkademik = Number(raportData.kotoba) + Number(raportData.bunpo) + Number(raportData.dokkai) + Number(raportData.choukai) + Number(raportData.kaiwa);
    const rataRataRaport = (totalAkademik / 5).toFixed(1);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Div. Pendidikan</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Akademik & Karakter</p>
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
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Input absensi, ujian harian, dan pencetakan raport akhir siswa.</p>
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
                                        <th style={thS}>Rata-Rata Tes Harian</th>
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
                                                    <div style={{fontSize:'0.75rem', color:'#64748b'}}>{s.nik || '-'}</div>
                                                    {s.perusahaan_tujuan && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ec4899', marginTop: '4px' }}>📍 {s.perusahaan_tujuan}</div>}
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
                                                        <button onClick={() => openEvalModal(s)} style={btnA('#f59e0b')} title="Input Ujian Harian/Tryout"><Edit3 size={18}/></button>
                                                        <button onClick={() => openRaportModal(s)} style={btnA('#8b5cf6')} title="Input Raport Akhir & History"><BookA size={18}/></button>
                                                        <button onClick={() => window.open(`/print-sertifikat/${s.id}`, '_blank')} style={btnA('#ec4899')} title="Cetak Sertifikat Lulus"><Printer size={18}/></button>
                                                        <button onClick={() => handleLulusKelas(s.id, s.nama_lengkap)} style={{...btnA('#10b981'), background: '#ecfdf5', fontWeight: 700, fontSize: '0.8rem'}} title="Luluskan Siswa">Luluskan</button>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {filteredStudents.map(s => {
                                const raport = s.data_raport || {};
                                const hasRaport = Object.keys(raport).length > 0;
                                const totAkad = Number(raport.kotoba||0) + Number(raport.bunpo||0) + Number(raport.dokkai||0) + Number(raport.choukai||0) + Number(raport.kaiwa||0);
                                const avgRaport = totAkad > 0 ? (totAkad / 5).toFixed(1) : 0;

                                return (
                                    <div key={s.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.tahap_sekarang}</div>
                                            </div>
                                            <div style={{ background: '#eff6ff', color: brandNavy, padding: '8px', borderRadius: '8px', fontWeight: 900, fontSize: '1.2rem', textAlign: 'center' }}>
                                                {s.nilai_bahasa || 0}
                                                <div style={{fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase'}}>Rata² Harian</div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>RAPORT AKHIR (SERTIFIKAT)</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {hasRaport ? <span style={{color: '#10b981'}}>Rata²: {avgRaport}</span> : <span style={{color: '#ef4444'}}>Belum Diisi</span>}
                                                    <button onClick={() => window.open(`/print-sertifikat/${s.id}`, '_blank')} style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', padding: 0 }} title="Cetak Sertifikat Lulus"><Printer size={16}/></button>
                                                </div>
                                            </div>
                                            {hasRaport ? (
                                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    <div><span style={{color: '#64748b'}}>Sikap:</span> <b style={{color: '#1e293b'}}>{raport.perilaku}</b></div>
                                                    <div><span style={{color: '#64748b'}}>Disiplin:</span> <b style={{color: '#1e293b'}}>{raport.kedisiplinan}</b></div>
                                                    <div><span style={{color: '#64748b'}}>Teamwork:</span> <b style={{color: '#1e293b'}}>{raport.teamwork}</b></div>
                                                    <div><span style={{color: '#64748b'}}>Fisik:</span> <b style={{color: '#1e293b'}}>{raport.fisik}</b></div>
                                                </div>
                                            ) : (
                                                <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', color: '#991b1b', textAlign: 'center' }}>
                                                    Data Raport belum dimasukkan.
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '8px' }}>HISTORY TES HARIAN</div>
                                            <div style={{ maxHeight: '100px', overflowY: 'auto', paddingRight: '5px' }}>
                                                {s.nilai_history.length === 0 ? <div style={{fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic'}}>Belum ada riwayat tes harian</div> : s.nilai_history.map((h, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                        <div><div style={{fontWeight: 700, color: '#334155'}}>{h.jenis_tes}</div><div style={{color: '#64748b', fontSize: '0.7rem'}}>{h.tanggal}</div></div>
                                                        <div style={{fontWeight: 800, color: '#3b82f6'}}>{h.nilai}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ── MODAL EVALUASI HARIAN ── */}
                {isEvalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div><h3 style={{ margin: 0, fontWeight: 900 }}>Evaluasi Pembelajaran</h3><p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{selectedStudent.nama_lengkap}</p></div>
                                <button onClick={() => setIsEvalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>
                            <form onSubmit={handleEvalSubmit}>
                                <div style={{ marginBottom: '15px' }}><label style={labelS}>Jenis Tes</label><select required style={inputS} value={evalForm.jenis_tes} onChange={(e) => setEvalForm({...evalForm, jenis_tes: e.target.value})}><option value="UJIAN BAB">Ujian Bab (Harian)</option><option value="TRYOUT JLPT">Tryout JLPT / JFT</option><option value="UJIAN FISIK">Ujian Fisik / FMD</option><option value="SIKAP ATTITUDE">Penilaian Sikap</option></select></div>
                                <div style={{ marginBottom: '15px' }}><label style={labelS}>Nilai (0-100)</label><input type="number" min="0" max="100" required style={{...inputS, fontSize: '1.2rem', fontWeight: 800, color: brandNavy}} value={evalForm.nilai} onChange={(e) => setEvalForm({...evalForm, nilai: e.target.value})} /></div>
                                <div style={{ marginBottom: '25px' }}><label style={labelS}>Catatan Instruktur</label><textarea rows="3" style={{...inputS, resize: 'vertical'}} value={evalForm.catatan} onChange={(e) => setEvalForm({...evalForm, catatan: e.target.value})}></textarea></div>
                                <button type="submit" disabled={isSubmitting} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Simpan Evaluasi</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── MODAL RAPORT AKHIR & HISTORY PENDIDIKAN ── */}
                {isRaportOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <form onSubmit={saveRaportForm} style={{...modalContent, width: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', position: 'sticky', top: '-30px', background: 'white', zIndex: 10 }}>
                                <div><h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Award size={22} color={brandNavy}/> Input Raport Akhir & History</h3><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Siswa: <span style={{color: '#1e293b'}}>{selectedStudent.nama_lengkap}</span></p></div>
                                <button type="button" onClick={() => setIsRaportOpen(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18}/></button>
                            </div>
                            
                            <div style={{ padding: '0 5px' }}>
                                {/* SEGMEN 1: RIWAYAT PENDIDIKAN */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h4 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}><GraduationCap size={18}/> Riwayat Pendidikan</h4><button type="button" onClick={addPendidikan} style={{ background: '#dbeafe', color: brandNavy, border: `1px solid ${brandNavy}`, padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>+ Tambah Pendidikan</button></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                                    {pendidikanList.map((edu, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'end', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div><label style={labelS}>Jenjang</label><input style={inputS} value={edu.jenjang} onChange={e => updatePendidikan(idx, 'jenjang', e.target.value)} placeholder="SD/SMP/SMA" /></div>
                                            <div><label style={labelS}>Nama Sekolah</label><input style={inputS} value={edu.nama_sekolah} onChange={e => updatePendidikan(idx, 'nama_sekolah', e.target.value)} /></div>
                                            <div><label style={labelS}>Jurusan</label><input style={inputS} value={edu.jurusan} onChange={e => updatePendidikan(idx, 'jurusan', e.target.value)} placeholder="IPA/IPS" /></div>
                                            <div><label style={labelS}>Masuk</label><div style={{display:'flex', gap:'5px'}}><input style={inputS} placeholder="Bln" value={edu.bln_awal} onChange={e => updatePendidikan(idx, 'bln_awal', e.target.value)} /><input style={inputS} placeholder="Thn" value={edu.thn_awal} onChange={e => updatePendidikan(idx, 'thn_awal', e.target.value)} /></div></div>
                                            <div><label style={labelS}>Lulus</label><div style={{display:'flex', gap:'5px'}}><input style={inputS} placeholder="Bln" value={edu.bln_akhir} onChange={e => updatePendidikan(idx, 'bln_akhir', e.target.value)} /><input style={inputS} placeholder="Thn" value={edu.thn_akhir} onChange={e => updatePendidikan(idx, 'thn_akhir', e.target.value)} /></div></div>
                                            <button type="button" onClick={() => removePendidikan(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {pendidikanList.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>Belum ada data pendidikan...</div>}
                                </div>

                                {/* SEGMEN 2: NILAI AKADEMIK */}
                                <h4 style={sectionTitle}><BrainCircuit size={18}/> Nilai Akademik Bahasa Jepang</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                    <div><label style={labelS}>Kotoba</label><input type="number" required min="0" max="100" style={inputS} name="kotoba" value={raportData.kotoba} onChange={handleRaportChange} /></div>
                                    <div><label style={labelS}>Bunpo</label><input type="number" required min="0" max="100" style={inputS} name="bunpo" value={raportData.bunpo} onChange={handleRaportChange} /></div>
                                    <div><label style={labelS}>Dokkai</label><input type="number" required min="0" max="100" style={inputS} name="dokkai" value={raportData.dokkai} onChange={handleRaportChange} /></div>
                                    <div><label style={labelS}>Choukai</label><input type="number" required min="0" max="100" style={inputS} name="choukai" value={raportData.choukai} onChange={handleRaportChange} /></div>
                                    <div><label style={labelS}>Kaiwa</label><input type="number" required min="0" max="100" style={inputS} name="kaiwa" value={raportData.kaiwa} onChange={handleRaportChange} /></div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', background: '#f8fafc', padding: '15px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                                    <div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>JUMLAH NILAI</div><div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>{totalAkademik}</div></div>
                                    <div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>RATA-RATA</div><div style={{ fontSize: '1.5rem', fontWeight: 900, color: brandNavy }}>{rataRataRaport}</div></div>
                                </div>

                                {/* SEGMEN 3: NILAI SIKAP / KARAKTER */}
                                <h4 style={sectionTitle}><Activity size={18}/> Nilai Sikap & Kepribadian</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                                    <div><label style={labelS}>Kecerdasan</label><select style={inputS} name="kecerdasan" value={raportData.kecerdasan} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                                    <div><label style={labelS}>Kedisiplinan</label><select style={inputS} name="kedisiplinan" value={raportData.kedisiplinan} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                                    <div><label style={labelS}>Kerapihan</label><select style={inputS} name="kerapihan" value={raportData.kerapihan} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                                    <div><label style={labelS}>Perilaku / Dewasa</label><select style={inputS} name="perilaku" value={raportData.perilaku} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                                    <div><label style={labelS}>Kepribadian</label><select style={inputS} name="kepribadian" value={raportData.kepribadian} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                                    <div><label style={labelS}>Team Work</label><select style={inputS} name="teamwork" value={raportData.teamwork} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                                    <div><label style={labelS}>Inisiatif</label><select style={inputS} name="inisiatif" value={raportData.inisiatif} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                                    <div><label style={labelS}>Ketahanan Fisik</label><select style={inputS} name="fisik" value={raportData.fisik} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                                </div>
                            </div>
                            <div style={{ position: 'sticky', bottom: '-30px', background: 'white', padding: '15px 0 0 0', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setIsRaportOpen(false)} style={{ padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 25px', background: brandNavy, border: 'none', color: 'white', fontWeight: 800, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={18}/> Simpan Raport</button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── STYLE OBJECTS ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', fontWeight: 800, width: '100%', textAlign: 'left', cursor: 'pointer' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 700, width: '100%', textAlign: 'left', cursor: 'pointer', transition: '0.2s' };
const thS = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdS = { padding: '15px 20px', fontSize: '0.9rem' };
const btnA = (c) => ({ background: 'white', border: `1px solid ${c}40`, color: c, padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' });
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const labelS = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' };
const inputS = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#f8fafc' };
const badgeS = { fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: '#e0e7ff', color: '#3730a3', fontWeight: 800 };
const sectionTitle = { fontSize: '0.9rem', color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' };