import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { regulerService } from '../../services/regulerService';
import { 
    UserCircle, Users, Briefcase, Target, 
    Building2, Activity, GraduationCap, PhoneOutgoing, FileCheck, PieChart,
    Search, Award, Loader2
} from 'lucide-react';

// COMPONENTS
import PendaftaranSection from './components/PendaftaranSection';
import SeleksiSection from './components/SeleksiSection';
import KelasDiklatSection from './components/KelasDiklatSection'; 
import PemanggilanSection from './components/PemanggilanSection'; 
import JobOrderSection from './components/JobOrderSection';
import MatchingSection from './components/MatchingSection';
import PascaInterviewSection from './components/PascaInterviewSection';
import LaporanEvaluasiMitra from '../Supervisor/LaporanEvaluasiMitra'; 
import RegulerModals from './components/RegulerModals'; 

// ✅ IMPORT DISESUAIKAN KE FOLDER SUPERVISOR
import JobOrderDetail from '../Supervisor/JobOrderDetail'; 

// STYLES
import { styles, brandNavy } from './components/dashboardStyles';

export default function DashboardReguler() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('PENDAFTARAN');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAsal, setFilterAsal] = useState('SEMUA');
    
    // ── STATE DATA ──
    const [students, setStudents] = useState([]);
    const [jobOrders, setJobOrders] = useState([]);
    const [masterData, setMasterData] = useState({ bidang: [], kumiai: [], kaisha: [] });
    
    // ── STATE MODAL & SELEKSI JOB ORDER ──
    const [reviewStudentModal, setReviewStudentModal] = useState(null);
    const [viewRaportStudent, setViewRaportStudent] = useState(null); 
    const [selectedJobOrder, setSelectedJobOrder] = useState(null);

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            try {
                // ✅ PERBAIKAN: Menggunakan getSession() untuk mencegah error "Lock was stolen"
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                
                if (user) {
                    const profile = await regulerService.getUserProfile(user.id);
                    if(profile) { setUserProfile(profile); setMyPoints(profile.poin_pendaftaran || 0); }
                }
                const masters = await regulerService.getMasterData();
                setMasterData(masters);
                const jobs = await regulerService.getJobOrders();
                setJobOrders(jobs);
            } catch (err) { console.error("Error Init:", err); } 
            finally { setIsLoading(false); }
        };
        initData();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            if (activeTab === 'JOB_ORDER' || activeTab === 'EVALUASI_MITRA') return;
            setIsLoading(true);
            try {
                const dataSiswa = await regulerService.getStudentsByTab(activeTab);
                setStudents(dataSiswa);
            } catch (err) { console.error("Error Fetch Students:", err); }
            finally { setIsLoading(false); }
        };
        fetchStudents();
    }, [activeTab]);

    const handleRefreshStudents = async () => {
        const dataSiswa = await regulerService.getStudentsByTab(activeTab);
        setStudents(dataSiswa);
    };

    const handleLogActivity = async (actionDesc) => {
        if (!userProfile) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (user) {
                const newPoint = await regulerService.logActivityAndAddPoint(user.id, myPoints, actionDesc);
                setMyPoints(newPoint);
            }
        } catch (err) { console.error(err); }
    };

    const updateStage = async (id, nama, newStage, successMsg) => {
        if (!window.confirm(`Pindahkan ${nama} ke tahap ${newStage}?`)) return;
        try {
            await regulerService.updateStudentFields(id, { tahap_sekarang: newStage, status_akhir: 'Proses', updated_at: new Date() });
            if (successMsg) alert(successMsg); 
            await handleLogActivity(`Update status ${nama} ke ${newStage}`); 
            handleRefreshStudents();
        } catch (error) { alert("Gagal: " + error.message); }
    };

    const displayedStudents = students.filter(s => {
        const matchSearch = (s.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.nik || '').includes(searchTerm);
        if (!matchSearch) return false;
        if (filterAsal === 'SEMUA') return true;
        const isMitra = s.lpk_asal && s.lpk_asal.trim() !== '';
        return filterAsal === 'REGULER' ? !isMitra : isMitra;
    });

    const subTabS = (active) => ({ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', background: active ? 'white' : 'transparent', color: active ? brandNavy : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s', boxShadow: active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            {/* ── SIDEBAR ── */}
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Div. Reguler</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Pusat Pendaftaran & Akademik</p>
                </div>
                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><Award size={20}/></div>
                    <div><div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Poin Keaktifan</div><div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{myPoints} <span style={{fontSize:'0.8rem', color:'#64748b'}}>Aksi</span></div></div>
                </div>
                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                    
                    <div style={styles.sidebarLabel}>FASE AWAL (INTERNAL)</div>
                    <button onClick={() => setActiveTab('PENDAFTARAN')} style={activeTab === 'PENDAFTARAN' ? styles.activeMenuS : styles.inactiveMenuS}><Users size={18} /> Pendaftaran Baru</button>
                    <button onClick={() => setActiveTab('SELEKSI')} style={activeTab === 'SELEKSI' ? styles.activeMenuS : styles.inactiveMenuS}><Activity size={18} /> Seleksi Internal & MCU</button>
                    
                    <div style={styles.sidebarLabel}>FASE JOB ORDER & USER</div>
                    <button onClick={() => { setActiveTab('JOB_ORDER'); setSelectedJobOrder(null); }} style={activeTab === 'JOB_ORDER' ? styles.activeMenuS : styles.inactiveMenuS}><Briefcase size={18} /> Manajemen Job Order</button>
                    <button onClick={() => setActiveTab('MATCHING')} style={activeTab === 'MATCHING' ? styles.activeMenuS : styles.inactiveMenuS}><Target size={18} /> Matching & Wawancara</button>
                    <button onClick={() => setActiveTab('PASCA_INTERVIEW')} style={activeTab === 'PASCA_INTERVIEW' ? styles.activeMenuS : styles.inactiveMenuS}><FileCheck size={18} /> Hasil Wawancara User</button>

                    <div style={styles.sidebarLabel}>FASE DIKLAT & TERBANG</div>
                    <button onClick={() => setActiveTab('KELAS_DIKLAT')} style={activeTab === 'KELAS_DIKLAT' ? styles.activeMenuS : styles.inactiveMenuS}><GraduationCap size={18} /> Pendidikan Diklat</button>
                    <button onClick={() => setActiveTab('PEMANGGILAN')} style={activeTab === 'PEMANGGILAN' ? styles.activeMenuS : styles.inactiveMenuS}><PhoneOutgoing size={18} /> Pemberkasan & Terbang</button>
                    
                    <div style={styles.sidebarLabel}>LAPORAN & EVALUASI</div>
                    <button onClick={() => setActiveTab('EVALUASI_MITRA')} style={activeTab === 'EVALUASI_MITRA' ? styles.activeMenuS : styles.inactiveMenuS}><PieChart size={18} /> Evaluasi Mitra</button>
                </nav>
                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: brandNavy }}><UserCircle size={24} /></div>
                        <div style={{ overflow: 'hidden' }}><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap' }}>{userProfile?.nama_lengkap || 'Admin'}</div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>{userProfile?.master_role?.nama_role || 'Staf'}</div></div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '10px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Keluar Sistem</button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {activeTab !== 'EVALUASI_MITRA' && !selectedJobOrder && (
                    <header style={{ marginBottom: '25px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
                            <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>{activeTab.replace('_', ' ')}</h1>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                                <input type="text" placeholder="Cari di tab ini..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.inputSearch} />
                            </div>
                        </div>
                        {['PENDAFTARAN', 'SELEKSI', 'MATCHING', 'PASCA_INTERVIEW', 'KELAS_DIKLAT', 'PEMANGGILAN'].includes(activeTab) && (
                            <div style={{ display: 'flex', background: '#e2e8f0', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                                <button onClick={() => setFilterAsal('SEMUA')} style={subTabS(filterAsal === 'SEMUA')}><Users size={16}/> Semua Asal</button>
                                <button onClick={() => setFilterAsal('REGULER')} style={subTabS(filterAsal === 'REGULER')}><UserCircle size={16} color={filterAsal === 'REGULER' ? '#10b981' : 'currentColor'} /> Reguler UJC</button>
                                <button onClick={() => setFilterAsal('MITRA')} style={subTabS(filterAsal === 'MITRA')}><Building2 size={16} color={filterAsal === 'MITRA' ? '#3b82f6' : 'currentColor'} /> Titipan Mitra</button>
                            </div>
                        )}
                    </header>
                )}

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {isLoading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader2 size={40} className="animate-spin" color={brandNavy} /></div> : (
                        <>
                            {activeTab === 'PENDAFTARAN' && <PendaftaranSection students={displayedStudents} masterBidang={masterData.bidang} onRefresh={handleRefreshStudents} onLogActivity={handleLogActivity} currentUser={userProfile} updateStage={updateStage} />}
                            
                            {activeTab === 'SELEKSI' && <SeleksiSection students={displayedStudents} onRefresh={handleRefreshStudents} onLogActivity={handleLogActivity} setReviewStudentModal={setReviewStudentModal} updateStage={updateStage} />}
                            
                            {activeTab === 'JOB_ORDER' && (
                                !selectedJobOrder ? (
                                    <JobOrderSection 
                                        jobOrders={jobOrders} 
                                        setJobOrders={setJobOrders} 
                                        masterData={masterData} 
                                        onLogActivity={handleLogActivity} 
                                        currentUser={userProfile} 
                                        setSelectedJobOrder={setSelectedJobOrder} 
                                    />
                                ) : (
                                    <JobOrderDetail 
                                        jobOrder={selectedJobOrder} 
                                        onBack={() => setSelectedJobOrder(null)} 
                                    />
                                )
                            )}
                            
                            {activeTab === 'MATCHING' && <MatchingSection students={displayedStudents} masterData={masterData} onRefresh={handleRefreshStudents} onLogActivity={handleLogActivity} setReviewStudentModal={setReviewStudentModal} updateStage={updateStage} />}
                            
                            {activeTab === 'PASCA_INTERVIEW' && <PascaInterviewSection students={displayedStudents} onRefresh={handleRefreshStudents} onLogActivity={handleLogActivity} setReviewStudentModal={setReviewStudentModal} setViewRaportStudent={setViewRaportStudent} updateStage={updateStage} />}

                            {activeTab === 'KELAS_DIKLAT' && <KelasDiklatSection students={displayedStudents} onRefresh={handleRefreshStudents} onLogActivity={handleLogActivity} userProfile={userProfile} setReviewStudentModal={setReviewStudentModal} isLoading={isLoading} updateStage={updateStage} />}
                            
                            {activeTab === 'PEMANGGILAN' && <PemanggilanSection students={displayedStudents} onRefresh={handleRefreshStudents} onLogActivity={handleLogActivity} setReviewStudentModal={setReviewStudentModal} setViewRaportStudent={setViewRaportStudent} />}
                            
                            {activeTab === 'EVALUASI_MITRA' && <LaporanEvaluasiMitra students={students} />}
                        </>
                    )}
                </div>
                
                <RegulerModals 
                    reviewStudentModal={reviewStudentModal} 
                    setReviewStudentModal={setReviewStudentModal} 
                    viewRaportStudent={viewRaportStudent}
                    setViewRaportStudent={setViewRaportStudent}
                />
            </main>
        </div>
    );
}