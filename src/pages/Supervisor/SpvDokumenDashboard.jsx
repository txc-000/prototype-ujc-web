import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
    LayoutDashboard, Activity, LogOut, ShieldCheck, FileText, 
    ClipboardCheck, FileCheck, Send, PlaneTakeoff, Archive, Search, X, Printer
} from 'lucide-react';

// IMPORT STYLES
import { styles, brandNavy, menuS } from '../Reguler/components/dashboardStyles';

// IMPORT KOMPONEN SPV (Analitik, Pipeline, Monitoring Lapangan)
import SpvAnalitik from './components/SpvAnalitik';
import SpvManajemenSiswa from './components/SpvManajemenSiswa';
import SpvMonitoring from './components/SpvMonitoring';

// IMPORT KOMPONEN OPERASIONAL DOKUMEN (Dari Folder Dokumen yang sudah Tuan buat)
import TabDokumenTable from '../Dokumen/tabs/TabDokumenTable';
import ModalOtit from '../Dokumen/modals/ModalOtit';
import ModalChecklist from '../Dokumen/modals/ModalChecklist';
import ModalTerbang from '../Dokumen/modals/ModalTerbang';
import ModalBerkas from '../Dokumen/modals/ModalBerkas';

const brandYellow = '#fdfb06';

export default function SpvDokumenDashboard() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('ANALITIK');
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // ── STATE DATA ──
    const [allStudents, setAllStudents] = useState([]);
    const [jobOrders, setJobOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [masterMitra, setMasterMitra] = useState([]);
    const [masterKaisha, setMasterKaisha] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);
    const [masterBidang, setMasterBidang] = useState([]);

    // ── KONTROL MODAL OPERASIONAL ──
    const [activeModal, setActiveModal] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const docItems = [
        { id: 'ktp', label: 'KTP Asli & Copy' }, { id: 'kk', label: 'KK Asli & Copy' },
        { id: 'akta', label: 'Akta Lahir Asli' }, { id: 'paspor', label: 'Paspor (Berlaku > 2 Thn)' },
        { id: 'ijazah', label: 'Ijazah Terakhir' }, { id: 'mcu_final', label: 'Hasil MCU Akhir (FIT)' },
        { id: 'skck', label: 'SKCK Polda' }, { id: 'foto', label: 'Pas Foto 3x4 & 4x6' }
    ];

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('employees').select('nama_lengkap, id, master_role(nama_role)').eq('id', user.id).single();
                setUserProfile(data);
            }
            fetchAllData();
        };
        initData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            // 1. Tarik Semua Siswa Dokumen
            const { data: stdData } = await supabase.from('students')
                .select('*')
                .in('tahap_sekarang', ['MATCHED', 'MCU_LANJUTAN', 'PEMBERKASAN', 'PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA', 'PENDIDIKAN DIKLAT', 'SIAP BERANGKAT', 'ALUMNI'])
                .order('updated_at', { ascending: false });
            setAllStudents(stdData || []);

            // 2. Tarik Job Orders & Logs SPV
            const { data: joData } = await supabase.from('job_orders').select('*');
            setJobOrders(joData || []);

            const { data: logData } = await supabase.from('activity_logs').select('*, user:employees(nama_lengkap, master_role(nama_role))').order('created_at', { ascending: false }).limit(300);
            setLogs(logData || []);

            // 3. Tarik Master Data
            const { data: bidang } = await supabase.from('master_bidang').select('nama_bidang');
            setMasterBidang(bidang || []);
            const { data: kaisha } = await supabase.from('master_kaisha').select('*');
            setMasterKaisha(kaisha || []);
            const { data: kumiai } = await supabase.from('master_kumiai').select('*');
            setMasterKumiai(kumiai || []);
            const { data: mitra } = await supabase.from('master_mitra').select('*');
            setMasterMitra(mitra || []);

        } catch (error) { console.error("Gagal menarik data SPV Dokumen:", error.message); } finally { setIsLoading(false); }
    };

    // ── FUNGSI OPERASIONAL STAF (BISA DILAKUKAN OLEH SPV) ──
    const logActivity = async (actionDesc) => {
        try {
            await supabase.from('activity_logs').insert([{ user_id: userProfile.id, keterangan: actionDesc }]);
        } catch (err) {}
    };

    const handleUpdateStage = async (id, nama, newStage) => {
        if(!window.confirm(`Pindahkan ${nama} ke tahap ${newStage}?`)) return;
        try {
            await supabase.from('students').update({ tahap_sekarang: newStage, updated_at: new Date() }).eq('id', id);
            await logActivity(`(SPV) Memindahkan ${nama} ke tahap ${newStage}`);
            fetchAllData();
        } catch (err) { alert(err.message); }
    };

    const openModal = (type, student) => { setSelectedStudent(student); setActiveModal(type); };
    const closeModal = () => { setActiveModal(null); setSelectedStudent(null); };

    const initModalTerbang = (siswa) => {
        const parsedStatus = typeof siswa.pemberkasan_status === 'string' ? JSON.parse(siswa.pemberkasan_status || '{}') : (siswa.pemberkasan_status || {});
        const doneCount = Object.values(parsedStatus).filter(v => v === true).length;
        if (doneCount < docItems.length) return alert(`⛔ KEBERANGKATAN DITOLAK!\nDokumen fisik belum 100% lengkap.`);
        if (!siswa.nik || !siswa.tempat_lahir || !siswa.tanggal_lahir || !siswa.tinggi_badan || !siswa.berat_badan) return alert(`⛔ KEBERANGKATAN DITOLAK!\nData diri dasar belum lengkap.`);
        openModal('TERBANG', siswa);
    };

    // ── FILTER DATA UNTUK TAB OPERASIONAL ──
    let currentTabStudents = [];
    if (activeTab === 'PEMBERKASAN') currentTabStudents = allStudents.filter(s => ['MATCHED', 'MCU_LANJUTAN', 'PEMBERKASAN', 'PENGUMPULAN BERKAS', 'PENDIDIKAN DIKLAT'].includes(s.tahap_sekarang));
    else if (activeTab === 'KONTRAK') currentTabStudents = allStudents.filter(s => ['TTD KONTRAK', 'PENDIDIKAN DIKLAT'].includes(s.tahap_sekarang));
    else if (activeTab === 'COE_VISA') currentTabStudents = allStudents.filter(s => ['APPLY COE', 'APPLY VISA', 'PENDIDIKAN DIKLAT'].includes(s.tahap_sekarang));
    else if (activeTab === 'KEBERANGKATAN') currentTabStudents = allStudents.filter(s => ['SIAP BERANGKAT'].includes(s.tahap_sekarang));
    else if (activeTab === 'SELESAI') currentTabStudents = allStudents.filter(s => ['ALUMNI'].includes(s.tahap_sekarang));

    const operasionalFiltered = currentTabStudents.filter(s => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()));

    // ── RENDER ENGINE ──
    const renderContent = () => {
        if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><div className="animate-spin text-blue-600">Memuat Data SPV...</div></div>;

        if (['ANALITIK', 'PIPELINE', 'MONITORING'].includes(activeTab)) {
            // RENDER FITUR SPV
            switch (activeTab) {
                case 'ANALITIK': return <SpvAnalitik rawStudents={allStudents} rawJobOrders={jobOrders} spvType="DOKUMEN" masterKaisha={masterKaisha} masterKumiai={masterKumiai} />;
                case 'PIPELINE': return <SpvManajemenSiswa students={allStudents} refreshData={fetchAllData} />;
                case 'MONITORING': return <SpvMonitoring logs={logs} />;
                default: return null;
            }
        } else {
            // RENDER FITUR OPERASIONAL (Ditarik dari file Dokumen)
            return (
                <div className="fade-in">
                    <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>Operasional: {activeTab.replace('_', ' & ')}</h2>
                            <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Bantu staf melakukan eksekusi langsung dari level SPV.</p>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                            <input type="text" placeholder="Cari Nama Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px', width: '250px' }} />
                        </div>
                    </header>
                    <TabDokumenTable 
                        activeTab={activeTab} isLoading={isLoading} filtered={operasionalFiltered} docItems={docItems}
                        openChecklistModal={(s) => openModal('CHECKLIST', s)} openOtitModal={(s) => openModal('OTIT', s)}
                        initModalTerbang={initModalTerbang} handleUpdateStage={handleUpdateStage}
                    openBerkasDigital={(s) => openModal('BERKAS', s)} 
                    openPrintMenu={(s) => openModal('PRINT', s)}
                    />
            </div>
        );
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR GOD MODE ── */}
            <aside style={{ width: '280px', background: brandNavy, display: 'flex', flexDirection: 'column', color: 'white', boxShadow: '4px 0 10px rgba(0,0,0,0.1)', zIndex: 50 }}>
                <div style={{ padding: '30px 25px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}><ShieldCheck size={28} color={brandYellow} /></div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '1px' }}>SPV DOKUMEN</h2>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>God Mode</p>
                    </div>
                </div>

                <nav style={{ padding: '25px 15px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', paddingLeft: '15px', marginBottom: '5px', letterSpacing: '1px', marginTop: '10px' }}>CONTROL PANEL SPV</div>
                    <button onClick={() => setActiveTab('ANALITIK')} style={menuS(activeTab === 'ANALITIK')}><LayoutDashboard size={20} /> Dashboard Analitik</button>
                    <button onClick={() => setActiveTab('PIPELINE')} style={menuS(activeTab === 'PIPELINE')}><FileText size={20} /> Interaktif Pipeline</button>
                    <button onClick={() => setActiveTab('MONITORING')} style={menuS(activeTab === 'MONITORING')}><Activity size={20} /> Monitor Lapangan (Log)</button>
                    
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', paddingLeft: '15px', marginBottom: '5px', letterSpacing: '1px', marginTop: '20px' }}>BANTUAN OPERASIONAL</div>
                    <button onClick={() => setActiveTab('PEMBERKASAN')} style={menuS(activeTab === 'PEMBERKASAN')}><ClipboardCheck size={20} /> Pemberkasan Awal</button>
                    <button onClick={() => setActiveTab('KONTRAK')} style={menuS(activeTab === 'KONTRAK')}><FileCheck size={20} /> Kontrak Kerja</button>
                    <button onClick={() => setActiveTab('COE_VISA')} style={menuS(activeTab === 'COE_VISA')}><Send size={20} /> Proses CoE & Visa</button>
                    <button onClick={() => setActiveTab('KEBERANGKATAN')} style={menuS(activeTab === 'KEBERANGKATAN')}><PlaneTakeoff size={20} /> Berangkatkan Siswa</button>
                    <button onClick={() => setActiveTab('SELESAI')} style={menuS(activeTab === 'SELESAI')}><Archive size={20} /> Arsip Keberangkatan</button>
                </nav>

                <div style={{ padding: '25px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: brandYellow, color: brandNavy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>{userProfile?.nama_lengkap ? userProfile.nama_lengkap.charAt(0).toUpperCase() : 'S'}</div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{userProfile?.nama_lengkap || 'Memuat...'}</div>
                            <div style={{ fontSize: '0.75rem', color: brandYellow, fontWeight: 700 }}>SUPERVISOR DOKUMEN</div>
                        </div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}>
                        <LogOut size={16} /> Keluar Sistem
                    </button>
                </div>
            </aside>

            {/* ── KONTEN UTAMA ── */}
            <main style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
                <div style={{ padding: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {renderContent()}
                </div>
            </main>

            {/* ── MODALS (Ditarik dari File Anak) ── */}
            {activeModal === 'OTIT' && <ModalOtit student={selectedStudent} masterMitra={masterMitra} masterKaisha={masterKaisha} masterKumiai={masterKumiai} masterBidang={masterBidang} onClose={closeModal} onSuccess={() => { closeModal(); fetchAllData(); }} />}
            {activeModal === 'CHECKLIST' && <ModalChecklist student={selectedStudent} docItems={docItems} onClose={closeModal} onSuccess={() => { closeModal(); fetchAllData(); }} logActivity={logActivity} />}
            {activeModal === 'TERBANG' && <ModalTerbang student={selectedStudent} onClose={closeModal} onSuccess={() => { closeModal(); fetchAllData(); }} logActivity={logActivity} incrementPoint={() => {}} />}

            {activeModal === 'PRINT' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '20px', background: brandNavy, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Printer size={18} /> Menu Cetak Dokumen</h3>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={() => window.open(`/print-cv/${selectedStudent?.id}`, '_blank')} style={{ padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Cetak Rirekisho (CV)</button>
                            <button onClick={() => window.open(`/print-shoushiki-10/${selectedStudent?.id}`, '_blank')} style={{ padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Cetak Shoushiki 1-10</button>
                            <button onClick={() => window.open(`/print-shoushiki-20/${selectedStudent?.id}`, '_blank')} style={{ padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Cetak Shoushiki 1-20</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'BERKAS' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '20px', background: '#f59e0b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> Berkas Digital Scan</h3>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
                        </div>
                        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            <FileText size={48} color="#cbd5e1" style={{ marginBottom: '15px', margin: '0 auto' }} />
                            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>{selectedStudent?.nama_lengkap}</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Fitur pengunggahan ke cloud Supabase Storage (File Paspor, KTP, dll) akan diaktifkan di tahap final.</p>
                            <button onClick={closeModal} style={{ marginTop: '20px', padding: '10px 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Tutup Info</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}