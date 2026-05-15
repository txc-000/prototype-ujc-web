import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { supervisorService } from '../../services/supervisorService';
import { useNavigate, useLocation } from 'react-router-dom';

// ── IMPORT KOMPONEN EKSTERNAL ──
import EditProfileModal from './EditProfileModal';
import JobOrderDetail from './JobOrderDetail';
import MasterMitra from './MasterMitra';
import MasterKaisha from './MasterKaisha';
import MasterKumiai from './MasterKumiai';
import MasterPengguna from './MasterPengguna';
import MasterBidang from './MasterBidang'; 
import LaporanEvaluasiMitra from './LaporanEvaluasiMitra'; 

// ── IMPORT KOMPONEN PECAHAN ──
import SpvAnalitik from './components/SpvAnalitik';
import SpvMonitoring from './components/SpvMonitoring';
import SpvJobOrder from './components/SpvJobOrder';
import SpvManajemenSiswa from './components/SpvManajemenSiswa';

import { 
    LayoutDashboard, Activity, Plane, Briefcase, ChevronDown, 
    Archive, Layers, HelpCircle, LogOut, Loader2, ShieldCheck 
} from 'lucide-react';

// Import gaya utama saja untuk menghindari bentrok deklarasi
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

const brandYellow = '#fdfb06';

export default function DashboardSupervisor() {
    const navigate = useNavigate();
    const location = useLocation();

    // State Autentikasi & Routing Internal
    const [userProfile, setUserProfile] = useState({ id: null, inisial: 'U', nama: 'Memuat...', email: 'memuat...', role: 'Memuat...' });
    
    // PATENKAN KE REKRUTMEN
    const [spvType, setSpvType] = useState(location.state?.spvType || 'REKRUTMEN'); 
    const [isLoading, setIsLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('DASHBOARD');
    const [openSubMenu, setOpenSubMenu] = useState('');
    const [activeTab, setActiveTab] = useState('SEMUA'); 

    // Data Master & Global State
    const [rawStudents, setRawStudents] = useState([]);
    const [rawJobOrders, setRawJobOrders] = useState([]);
    const [masterDropdowns, setMasterDropdowns] = useState({ bidang: [], kumiai: [], kaisha: [] });

    // Modals
    const [activeJobOrder, setActiveJobOrder] = useState(null);
    const [selectedCV, setSelectedCV] = useState(null);

    useEffect(() => {
        if (location.state?.spvType) setSpvType(location.state.spvType);
    }, [location.state]);

    useEffect(() => {
        const initDashboard = async () => {
            setIsLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: employee } = await supabase.from('employees').select('id, nama_lengkap, email_pribadi, master_role(nama_role)').eq('id', user.id).maybeSingle();
                    if (employee) {
                        setUserProfile({ 
                            id: employee.id, 
                            inisial: employee.nama_lengkap ? employee.nama_lengkap.charAt(0).toUpperCase() : 'A', 
                            nama: employee.nama_lengkap || 'User Tanpa Nama', 
                            email: employee.email_pribadi || user.email, 
                            role: employee.master_role?.nama_role?.toUpperCase() || 'TIDAK ADA ROLE' 
                        });
                        
                        // FOKUS 100% REKRUTMEN KARENA DOKUMEN SUDAH DIPISAH
                        if (!location.state?.spvType) {
                            setSpvType('REKRUTMEN');
                        }
                    } else {
                        setUserProfile({ id: user.id, inisial: user.email ? user.email.charAt(0).toUpperCase() : 'U', nama: 'Admin Utama', email: user.email, role: 'SUPER ADMIN' });
                    }
                }
                
                // Ambil Data Dropdown & Raw Data via Service
                const dropdowns = await supervisorService.getMasterDropdowns();
                setMasterDropdowns(dropdowns);
                
                await handleRefreshRawData();

            } catch (error) {
                console.error("Error inisialisasi:", error);
            } finally {
                setIsLoading(false);
            }
        };
        initDashboard();
    }, [location.state]);

    const handleRefreshRawData = async () => {
        const raw = await supervisorService.getRawData();
        setRawStudents(raw.students);
        setRawJobOrders(raw.jobOrders);
    };

    const toggleSubMenu = (menuName) => setOpenSubMenu(openSubMenu === menuName ? '' : menuName);

    const handleLogout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await supabase.from('employees').update({ is_online: false }).eq('id', user.id);
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) { navigate('/login'); }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR UJC BRANDED ── */}
            <aside style={{ width: '280px', background: brandNavy, color: 'white', padding: '25px 15px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', overflowY: 'auto', zIndex: 100, boxShadow: '4px 0 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', padding: '10px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: brandYellow, color: brandNavy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, flexShrink: 0 }}>
                        {userProfile.inisial}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userProfile.nama}</div>
                        <div style={{ fontSize: '0.7rem', color: brandYellow, fontWeight: 800, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SPV {spvType}</div>
                        
                        {userProfile.role === 'SUPER ADMIN' && (
                            <button onClick={() => navigate('/superadmin/dashboard')} style={{ marginTop: '10px', background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <ShieldCheck size={12} /> KEMBALI PORTAL
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', marginLeft: '10px' }}>Menu Navigasi</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <button onClick={() => { setActiveMenu('DASHBOARD'); setActiveJobOrder(null); }} style={menuS(activeMenu === 'DASHBOARD')}><LayoutDashboard size={18} /> Beranda Analitik</button>
                    <button onClick={() => { setActiveMenu('MONITORING'); setActiveJobOrder(null); }} style={menuS(activeMenu === 'MONITORING')}><Activity size={18} /> Monitoring Lapangan</button>
                    <button onClick={() => navigate('/alumni/dashboard')} style={menuS(false)}><Plane size={18} /> Pantauan Alumni</button>

                    <div>
                        <button onClick={() => toggleSubMenu('TRANSAKSI')} style={menuDropdownBtn(openSubMenu === 'TRANSAKSI')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Briefcase size={18} /> Transaksi <small style={smallKanjiList}>取引</small></div>
                            <ChevronDown size={16} style={{ transform: openSubMenu === 'TRANSAKSI' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </button>
                        <div style={subMenuContainer(openSubMenu === 'TRANSAKSI')}>
                            <button onClick={() => { setActiveMenu('JOB_ORDER'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'JOB_ORDER')}><div style={subDot(activeMenu === 'JOB_ORDER')}></div> Job Order Kaisha</button>
                            <button onClick={() => navigate('/reguler/dashboard')} style={subMenuS(false)}><div style={subDot(false)}></div> Pendaftaran Baru</button> 
                        </div>
                    </div>

                    <div>
                        <button onClick={() => toggleSubMenu('LAPORAN')} style={menuDropdownBtn(openSubMenu === 'LAPORAN')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Archive size={18} /> Laporan <small style={smallKanjiList}>報告</small></div>
                            <ChevronDown size={16} style={{ transform: openSubMenu === 'LAPORAN' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </button>
                        <div style={subMenuContainer(openSubMenu === 'LAPORAN')}>
                            <button onClick={() => { setActiveMenu('EVALUASI_MITRA'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'EVALUASI_MITRA')}><div style={subDot(activeMenu === 'EVALUASI_MITRA')}></div> Evaluasi Mitra LPK</button>
                            <button onClick={() => { setActiveMenu('LAPORAN_LULUS'); setActiveTab('LULUS'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'LAPORAN_LULUS')}><div style={subDot(activeMenu === 'LAPORAN_LULUS')}></div> Daftar Peserta Lolos</button>
                            <button onClick={() => { setActiveMenu('LAPORAN_GAGAL'); setActiveTab('GAGAL'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'LAPORAN_GAGAL')}><div style={subDot(activeMenu === 'LAPORAN_GAGAL')}></div> Laporan Gagal</button>
                            <button onClick={() => { setActiveMenu('LAPORAN_PERUSAHAAN'); setActiveTab('LULUS'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'LAPORAN_PERUSAHAAN')}><div style={subDot(activeMenu === 'LAPORAN_PERUSAHAAN')}></div> Sebaran Penempatan</button>
                        </div>
                    </div>

                    <div>
                        <button onClick={() => toggleSubMenu('MASTER')} style={menuDropdownBtn(openSubMenu === 'MASTER')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Layers size={18} /> Master <small style={smallKanjiList}>マスター</small></div>
                            <ChevronDown size={16} style={{ transform: openSubMenu === 'MASTER' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </button>
                        <div style={subMenuContainer(openSubMenu === 'MASTER')}>
                            <button onClick={() => { setActiveMenu('MASTER_MITRA'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'MASTER_MITRA')}><div style={subDot(activeMenu === 'MASTER_MITRA')}></div> Mitra Lokal</button>
                            <button onClick={() => { setActiveMenu('MASTER_KAISHA'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'MASTER_KAISHA')}><div style={subDot(activeMenu === 'MASTER_KAISHA')}></div> Perusahaan (Kaisha)</button>
                            <button onClick={() => { setActiveMenu('MASTER_KUMIAI'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'MASTER_KUMIAI')}><div style={subDot(activeMenu === 'MASTER_KUMIAI')}></div> Asosiasi (Kumiai)</button>
                            <button onClick={() => { setActiveMenu('MASTER_BIDANG'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'MASTER_BIDANG')}><div style={subDot(activeMenu === 'MASTER_BIDANG')}></div> Bidang & Jurusan</button>
                            <button onClick={() => { setActiveMenu('MASTER_CV'); setActiveTab('SEMUA'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'MASTER_CV')}><div style={subDot(activeMenu === 'MASTER_CV')}></div> Siswa LPK</button>
                            <button onClick={() => { setActiveMenu('MASTER_PENGGUNA'); setActiveJobOrder(null); }} style={subMenuS(activeMenu === 'MASTER_PENGGUNA')}><div style={subDot(activeMenu === 'MASTER_PENGGUNA')}></div> Pengguna Internal</button>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px' }}>
                    <button onClick={handleLogout} style={{ ...menuS(false), color: '#ef4444' }}><LogOut size={18} /> Keluar <small style={{ ...smallKanjiList, color: '#ef4444' }}>外出</small></button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, marginLeft: '280px', padding: '40px', overflowY: 'auto' }}>

                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <Loader2 className="animate-spin" size={40} color={brandNavy} />
                    </div>
                )}

                {activeJobOrder && !isLoading ? (
                    <div className="fade-in">
                        <JobOrderDetail jobOrder={activeJobOrder} onBack={() => { setActiveJobOrder(null); handleRefreshRawData(); }} />
                    </div>
                ) : !isLoading && (
                    <>
                        {/* PANGGILAN KOMPONEN PECAHAN BERDASARKAN MENU */}
                        {activeMenu === 'DASHBOARD' && <SpvAnalitik rawStudents={rawStudents} rawJobOrders={rawJobOrders} spvType={spvType} masterKaisha={masterDropdowns.kaisha} masterKumiai={masterDropdowns.kumiai} />}
                        
                        {activeMenu === 'MONITORING' && <SpvMonitoring rawStudents={rawStudents} rawJobOrders={rawJobOrders} spvType={spvType} onSelectJobOrder={setActiveJobOrder} />}
                        
                        {activeMenu === 'JOB_ORDER' && <SpvJobOrder rawJobOrders={rawJobOrders} masterDropdowns={masterDropdowns} onRefresh={handleRefreshRawData} onSelectJobOrder={setActiveJobOrder} />}
                        
                        {['MASTER_CV', 'LAPORAN_LULUS', 'LAPORAN_GAGAL', 'LAPORAN_PERUSAHAAN'].includes(activeMenu) && (
                            <SpvManajemenSiswa 
                                activeMenu={activeMenu} activeTab={activeTab} setActiveTab={setActiveTab} 
                                rawStudents={rawStudents} setSelectedCV={setSelectedCV} onRefresh={handleRefreshRawData} 
                            />
                        )}

                        {/* MASTER DATA */}
                        {activeMenu === 'EVALUASI_MITRA' && <LaporanEvaluasiMitra />}
                        {activeMenu === 'MASTER_MITRA' && <MasterMitra />}
                        {activeMenu === 'MASTER_KAISHA' && <MasterKaisha />}
                        {activeMenu === 'MASTER_KUMIAI' && <MasterKumiai />}
                        {activeMenu === 'MASTER_BIDANG' && <MasterBidang />}
                        {activeMenu === 'MASTER_PENGGUNA' && <MasterPengguna />}
                    </>
                )}

            </main>

            {/* MODAL GLOBAL (Edit CV) */}
            {selectedCV && (
                <EditProfileModal 
                    selectedCV={selectedCV} 
                    setSelectedCV={setSelectedCV} 
                    handleSaveCV={async (e, finalData) => {
                        e.preventDefault();
                        const payload = finalData || selectedCV;
                        try {
                            await supervisorService.updateStudentCV(payload.id, payload);
                            alert("Data Rirekisho Berhasil Diperbarui!");
                            setSelectedCV(null);
                            handleRefreshRawData();
                        } catch (err) { alert(err.message); }
                    }} 
                />
            )}
        </div>
    );
}

// ── STYLE OBJECTS (Menu Sidebar) ──
const menuS = (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: isActive ? brandYellow : 'rgba(255, 255, 255, 0.7)', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', transition: '0.3s' });
const menuDropdownBtn = (isOpen) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: isOpen ? 'white' : 'rgba(255, 255, 255, 0.7)', border: 'none', borderRadius: isOpen ? '10px 10px 0 0' : '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', transition: '0.3s' });
const subMenuContainer = (isOpen) => ({ maxHeight: isOpen ? '300px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '0 0 10px 10px', marginTop: '-5px', paddingBottom: isOpen ? '10px' : '0' });
const subMenuS = (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px 10px 40px', background: 'transparent', color: isActive ? brandYellow : 'rgba(255, 255, 255, 0.6)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', transition: '0.2s' });
const subDot = (isActive) => ({ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? brandYellow : 'rgba(255, 255, 255, 0.4)', transition: '0.2s' });
const smallKanjiList = { color: '#cbd5e1', fontSize: '0.65rem', fontWeight: 800, marginLeft: 'auto' };