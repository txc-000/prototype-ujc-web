import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, Users, FileSignature, CheckSquare, Search, Loader2, UserCheck, UserCircle, ArrowRightCircle, Plus, X, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── IMPORT KOMPONEN DETAIL JO DARI FOLDER SUPERVISOR ──
import JobOrderDetail from '../Supervisor/JobOrderDetail';

const brandNavy = '#101869';

export default function DashboardRekrutmen() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('KANDIDAT'); 
    const [candidates, setCandidates] = useState([]);
    const [jobOrders, setJobOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE UNTUK DETAIL JOB ORDER ──
    const [selectedJobOrder, setSelectedJobOrder] = useState(null);

    // ── STATE MODAL JO BARU ──
    const [isJoModalOpen, setIsJoModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joFormData, setJoFormData] = useState({
        nama_job: '', perusahaan_kaisha: '', kumiai: '', lokasi: '', kuota: '', keterangan: '', status_jo: 'OPEN'
    });

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchUserProfile(user.id);
        };
        initData();
    }, []);

    // ── TRIGGER FETCH BERDASARKAN TAB ──
    useEffect(() => {
        setSelectedJobOrder(null); // Reset tampilan jika ganti tab
        if (activeTab === 'JOB_ORDER') {
            fetchJobOrders();
        } else {
            fetchCandidates();
        }
    }, [activeTab]);

    const fetchUserProfile = async (userId) => {
        try {
            const { data } = await supabase.from('employees').select('nama_lengkap, id_karyawan, poin_pendaftaran, master_role(nama_role)').eq('id', userId).maybeSingle();
            if (data) {
                setUserProfile(data);
                setMyPoints(data.poin_pendaftaran || 0); // Kita gunakan kolom yang sama agar poin terakumulasi
            }
        } catch (err) { console.error(err); }
    };

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            let stageFilter = [];
            if (activeTab === 'KANDIDAT') stageFilter = ['AVAILABLE'];
            if (activeTab === 'INTERVIEW') stageFilter = ['PRA-MENSETSU', 'INTERVIEW'];
            if (activeTab === 'MATCHED') stageFilter = ['MATCHED'];

            const { data, error } = await supabase
                .from('students')
                .select('id, nik, nama_lengkap, tahap_sekarang, status_akhir, telepon, nilai_bahasa, created_at, asal_sekolah')
                .in('tahap_sekarang', stageFilter)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCandidates(data || []);
        } catch (error) {
            console.error("Gagal menarik data kandidat:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJobOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('job_orders').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setJobOrders(data || []);
        } catch (error) {
            console.error("Gagal menarik data JO:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ── FUNGSI ACTIVITY & POIN ──
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
        } catch (err) { console.error("Gagal update poin:", err); }
    };

    const handleJoSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('job_orders').insert([joFormData]);
            if (error) throw error;
            
            await logActivity(`Membuat Job Order baru: ${joFormData.nama_job}`);
            await incrementPoint(); // Tambah Poin

            alert("Job Order Berhasil Dipublikasikan!");
            setIsJoModalOpen(false);
            setJoFormData({ nama_job: '', perusahaan_kaisha: '', kumiai: '', lokasi: '', kuota: '', keterangan: '', status_jo: 'OPEN' });
            fetchJobOrders();
        } catch (err) {
            alert("Gagal simpan JO: " + err.message);
        } finally { setIsSubmitting(false); }
    };

    const handleUpdateStatus = async (id, nama, newStatus) => {
        if(!window.confirm(`Pindahkan ${nama} ke tahap ${newStatus}?`)) return;
        try {
            const { error } = await supabase.from('students').update({ tahap_sekarang: newStatus }).eq('id', id);
            if (error) throw error;
            
            await logActivity(`Mengubah status ${nama} menjadi ${newStatus}`);
            await incrementPoint(); // Tambah Poin

            alert(`Status ${nama} berhasil diupdate!`);
            fetchCandidates();
        } catch (err) { alert('Error: ' + err.message); }
    };

    const filteredCandidates = candidates.filter(c => 
        (c.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nik || '').includes(searchTerm)
    );

    const filteredJO = jobOrders.filter(j => 
        (j.nama_job || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (j.perusahaan_kaisha || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── JIKA ADA JO YANG DIPILIH, TAMPILKAN KOMPONEN DARI SUPERVISOR ──
    if (selectedJobOrder) {
        return <JobOrderDetail jobOrder={selectedJobOrder} onBack={() => { setSelectedJobOrder(null); fetchJobOrders(); }} />;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR ── */}
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Divisi Rekrutmen</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Penempatan & Matching JO</p>
                </div>

                {/* LEADERBOARD / POIN BADGE */}
                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><Award size={20}/></div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Poin Keaktifan Anda</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{myPoints} <span style={{fontSize:'0.8rem', color:'#64748b'}}>Aksi</span></div>
                    </div>
                </div>

                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <button onClick={() => setActiveTab('KANDIDAT')} style={activeTab === 'KANDIDAT' ? activeMenuS : inactiveMenuS}><Users size={18} /> Kandidat Available</button>
                    <button onClick={() => setActiveTab('JOB_ORDER')} style={activeTab === 'JOB_ORDER' ? activeMenuS : inactiveMenuS}><Briefcase size={18} /> Master Job Order</button>
                    <button onClick={() => setActiveTab('INTERVIEW')} style={activeTab === 'INTERVIEW' ? activeMenuS : inactiveMenuS}><UserCheck size={18} /> Proses Interview</button>
                    <button onClick={() => setActiveTab('MATCHED')} style={activeTab === 'MATCHED' ? activeMenuS : inactiveMenuS}><CheckSquare size={18} /> Lulus Interview (Matched)</button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: brandNavy }}><UserCircle size={24} /></div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile ? userProfile.nama_lengkap : 'Memuat...'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{userProfile?.master_role?.nama_role || 'Staf'}</div>
                        </div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '10px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Keluar Sistem</button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900 }}>
                            {activeTab === 'KANDIDAT' ? 'Kandidat Siap Kerja (Available)' : activeTab === 'JOB_ORDER' ? 'Manajemen Job Order' : activeTab === 'INTERVIEW' ? 'Proses Seleksi User' : 'Siswa Lulus (Matched)'}
                        </h1>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>
                            {activeTab === 'KANDIDAT' ? 'Daftar siswa yang sudah disetujui Divisi Reguler untuk dipasarkan.' : activeTab === 'JOB_ORDER' ? 'Kelola daftar permintaan tenaga kerja dari perusahaan Jepang.' : 'Kelola alur wawancara dan pembuatan CV Rirekisho.'}
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                            <input type="text" placeholder="Cari NIK / Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }} />
                        </div>
                        {activeTab === 'JOB_ORDER' && (
                            <button onClick={() => setIsJoModalOpen(true)} style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <Plus size={18}/> Tambah JO
                            </button>
                        )}
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                    {activeTab === 'JOB_ORDER' ? (
                        /* ================== TABEL JOB ORDER ================== */
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thStyle}>Job & Perusahaan</th>
                                        <th style={thStyle}>Lokasi</th>
                                        <th style={thStyle}>Kuota</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? <tr><td colSpan="5" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" style={{margin:'0 auto'}}/></td></tr> : filteredJO.map(jo => (
                                        <tr key={jo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdStyle}>
                                                <div style={{fontWeight:800, color: '#1e293b'}}>{jo.nama_job}</div>
                                                <div style={{fontSize:'0.75rem', color:'#64748b', fontWeight: 600}}>{jo.perusahaan_kaisha} • {jo.kumiai}</div>
                                            </td>
                                            <td style={tdStyle}>{jo.lokasi || '-'}</td>
                                            <td style={tdStyle}><span style={{fontWeight:800}}>{jo.kuota}</span> Orang</td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: jo.status_jo === 'OPEN' ? '#dcfce7' : '#fee2e2', color: jo.status_jo === 'OPEN' ? '#166534' : '#991b1b' }}>
                                                    {jo.status_jo || 'OPEN'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <button onClick={() => setSelectedJobOrder(jo)} style={{border:'none', background:'#eff6ff', color:brandNavy, fontWeight:800, padding: '8px 15px', borderRadius: '8px', cursor: 'pointer'}}>
                                                    Kelola Seleksi
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredJO.length === 0 && !isLoading && <tr><td colSpan="5" style={{padding:'40px', textAlign:'center', color:'#94a3b8', fontWeight:600}}>Tidak ada data Job Order.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* ================== TABEL KANDIDAT ================== */
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thStyle}>Kandidat</th>
                                        <th style={thStyle}>Tahapan Sistem</th>
                                        <th style={thStyle}>Nilai Bahasa</th>
                                        <th style={thStyle}>Keterangan (Status Akhir)</th>
                                        <th style={{...thStyle, textAlign: 'center'}}>Aksi Rekrutmen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px auto' }} /> Memuat data...</td></tr>
                                    ) : filteredCandidates.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 600 }}>Tidak ada data di tahap ini.</td></tr>
                                    ) : (
                                        filteredCandidates.map((c) => (
                                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: 800, color: '#1e293b' }}>{c.nama_lengkap}</div>
                                                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>NIK: {c.nik} | {c.asal_sekolah || '-'}</div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: '#e0e7ff', color: '#3730a3' }}>{c.tahap_sekarang}</span>
                                                </td>
                                                <td style={tdStyle}><span style={{ fontWeight: 800, color: brandNavy, fontSize: '1.05rem' }}>{c.nilai_bahasa || '-'}</span> / 100</td>
                                                <td style={tdStyle}>
                                                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                                                        {c.status_akhir || 'Siap Disalurkan'}
                                                    </span>
                                                </td>
                                                <td style={{...tdStyle, textAlign: 'center'}}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button onClick={() => navigate(`/print-cv/${c.id}`)} style={actionBtn('#3b82f6')} title="Print Rirekisho (CV Jepang)"><FileSignature size={18}/></button>
                                                        
                                                        {activeTab === 'KANDIDAT' && <button onClick={() => handleUpdateStatus(c.id, c.nama_lengkap, 'PRA-MENSETSU')} style={{...btnAction, background: brandNavy, color: 'white'}}>Set Pra-Mensetsu</button>}
                                                        {activeTab === 'INTERVIEW' && (
                                                            <>
                                                                {c.tahap_sekarang === 'PRA-MENSETSU' && <button onClick={() => handleUpdateStatus(c.id, c.nama_lengkap, 'INTERVIEW')} style={{...btnAction, background: '#f59e0b', color: 'white'}}>Maju Interview</button>}
                                                                {c.tahap_sekarang === 'INTERVIEW' && <button onClick={() => handleUpdateStatus(c.id, c.nama_lengkap, 'MATCHED')} style={{...btnAction, background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '5px'}}><CheckSquare size={16}/> Lulus (Matched)</button>}
                                                            </>
                                                        )}
                                                        {activeTab === 'MATCHED' && (
                                                            <button onClick={() => handleUpdateStatus(c.id, c.nama_lengkap, 'PENGUMPULAN BERKAS')} style={{...btnAction, background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                                Serahkan ke Dokumen <ArrowRightCircle size={16}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── MODAL TAMBAH JOB ORDER ── */}
                {isJoModalOpen && (
                    <div style={modalOverlay}>
                        <form onSubmit={handleJoSubmit} style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Publikasi Job Order Baru</h3>
                                <button type="button" onClick={() => setIsJoModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div><label style={labelS}>Nama Pekerjaan</label><input required style={inputS} value={joFormData.nama_job} onChange={e => setJoFormData({...joFormData, nama_job: e.target.value})} placeholder="Contoh: Pengelasan" /></div>
                                <div><label style={labelS}>Nama Kaisha (Perusahaan)</label><input required style={inputS} value={joFormData.perusahaan_kaisha} onChange={e => setJoFormData({...joFormData, perusahaan_kaisha: e.target.value})} /></div>
                                <div><label style={labelS}>Nama Kumiai</label><input style={inputS} value={joFormData.kumiai} onChange={e => setJoFormData({...joFormData, kumiai: e.target.value})} /></div>
                                <div><label style={labelS}>Lokasi (Prefektur)</label><input style={inputS} value={joFormData.lokasi} onChange={e => setJoFormData({...joFormData, lokasi: e.target.value})} /></div>
                                <div><label style={labelS}>Kuota Peserta</label><input type="number" style={inputS} value={joFormData.kuota} onChange={e => setJoFormData({...joFormData, kuota: e.target.value})} /></div>
                                <div><label style={labelS}>Status</label><select style={inputS} value={joFormData.status_jo} onChange={e => setJoFormData({...joFormData, status_jo: e.target.value})}><option value="OPEN">OPEN</option><option value="CLOSED">CLOSED</option></select></div>
                            </div>
                            <button type="submit" disabled={isSubmitting} style={{ width: '100%', background: brandNavy, color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                                {isSubmitting ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── STYLES ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 800, fontSize: '0.95rem' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem', transition: '0.2s' };
const thStyle = { padding: '15px 20px', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px 20px', fontSize: '0.95rem', color: '#334155' };
const actionBtn = (color) => ({ background: 'white', border: `1px solid ${color}40`, color: color, cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s' });
const btnAction = { padding: '8px 12px', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const labelS = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '5px', textTransform: 'uppercase' };
const inputS = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#f8fafc' };