import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileCheck, ClipboardCheck, PlaneTakeoff, Send, Search, UserCircle, Award, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { styles, brandNavy } from '../Reguler/components/dashboardStyles';
import TabDokumenTable from './tabs/TabDokumenTable';

// IMPORT SEMUA MODAL YANG SUDAH KITA PECAH
import ModalOtit from './modals/ModalOtit';
import ModalChecklist from './modals/ModalChecklist';
import ModalTerbang from './modals/ModalTerbang';

export default function DashboardDokumen() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('PEMBERKASAN'); 
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE MASTER DATA UNTUK DROPDOWN ──
    const [masterMitra, setMasterMitra] = useState([]);
    const [masterKaisha, setMasterKaisha] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);
    const [masterBidang, setMasterBidang] = useState([]);

    // ── KONTROL MODAL TERPUSAT ──
    // Menyimpan tipe modal aktif: null, 'OTIT', 'CHECKLIST', 'TERBANG', 'BERKAS', 'PRINT'
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
            if (user) fetchUserProfile(user.id);
        };
        initData();
        fetchMasterData(); 
    }, []);

    useEffect(() => { fetchStudents(); }, [activeTab]);

    const fetchMasterData = async () => {
        try {
            const { data: bidangData } = await supabase.from('master_bidang').select('nama_bidang').order('nama_bidang');
            if (bidangData) setMasterBidang(bidangData);
            const { data: kumiaiData } = await supabase.from('master_kumiai').select('*');
            if (kumiaiData) setMasterKumiai(kumiaiData);
            const { data: kaishaData } = await supabase.from('master_kaisha').select('*');
            if (kaishaData) setMasterKaisha(kaishaData);
            const { data: mitraData } = await supabase.from('master_mitra').select('*');
            if (mitraData) setMasterMitra(mitraData);
        } catch (err) { console.warn(err); }
    };

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
            if (activeTab === 'PEMBERKASAN') stageFilter = ['MATCHED', 'MCU_LANJUTAN', 'PEMBERKASAN', 'PENGUMPULAN BERKAS'];
            if (activeTab === 'KONTRAK') stageFilter = ['TTD KONTRAK'];
            if (activeTab === 'COE_VISA') stageFilter = ['APPLY COE', 'APPLY VISA'];
            if (activeTab === 'KEBERANGKATAN') stageFilter = ['SIAP BERANGKAT']; 
            if (activeTab === 'SELESAI') stageFilter = ['ALUMNI']; 

            const { data, error } = await supabase.from('students').select('*').in('tahap_sekarang', stageFilter).order('updated_at', { ascending: false });
            if (error) throw error;
            setStudents(data || []);
        } catch (error) {} finally { setIsLoading(false); }
    };

    const logActivity = async (actionDesc) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('activity_logs').insert([{ user_id: user.id, keterangan: actionDesc }]);
        } catch (err) {}
    };

    const incrementPoint = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const newPoint = myPoints + 1;
            await supabase.from('employees').update({ poin_pendaftaran: newPoint }).eq('id', user.id);
            setMyPoints(newPoint);
        } catch (err) {}
    };

    const handleUpdateStage = async (id, nama, newStage) => {
        if(!window.confirm(`Pindahkan ${nama} ke tahap ${newStage}?`)) return;
        try {
            await supabase.from('students').update({ tahap_sekarang: newStage, updated_at: new Date() }).eq('id', id);
            await logActivity(`Memindahkan ${nama} ke tahap ${newStage}`);
            await incrementPoint();
            fetchStudents();
        } catch (err) { alert(err.message); }
    };

    const openModal = (type, student) => { setSelectedStudent(student); setActiveModal(type); };
    const closeModal = () => { setActiveModal(null); setSelectedStudent(null); };

    const initModalTerbang = (siswa) => {
        const totalDocs = docItems.length;
        const parsedStatus = typeof siswa.pemberkasan_status === 'string' ? JSON.parse(siswa.pemberkasan_status || '{}') : (siswa.pemberkasan_status || {});
        const doneCount = Object.values(parsedStatus).filter(v => v === true).length;
        
        if (doneCount < totalDocs) return alert(`⛔ KEBERANGKATAN DITOLAK!\nDokumen fisik belum 100% lengkap.`);
        if (!siswa.nik || !siswa.tempat_lahir || !siswa.tanggal_lahir || !siswa.tinggi_badan || !siswa.berat_badan) return alert(`⛔ KEBERANGKATAN DITOLAK!\nData diri dasar belum lengkap.`);
        
        openModal('TERBANG', siswa);
    };

    const filtered = students.filter(s => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Divisi Dokumen</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Legalitas & Administrasi</p>
                </div>

                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><Award size={20}/></div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Poin Keaktifan</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{myPoints} <span style={{fontSize:'0.8rem', color:'#64748b'}}>Aksi</span></div>
                    </div>
                </div>

                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <button onClick={() => setActiveTab('PEMBERKASAN')} style={activeTab === 'PEMBERKASAN' ? styles.activeMenuS : styles.inactiveMenuS}><ClipboardCheck size={18} /> Pemberkasan Awal</button>
                    <button onClick={() => setActiveTab('KONTRAK')} style={activeTab === 'KONTRAK' ? styles.activeMenuS : styles.inactiveMenuS}><FileCheck size={18} /> Kontrak Kerja</button>
                    <button onClick={() => setActiveTab('COE_VISA')} style={activeTab === 'COE_VISA' ? styles.activeMenuS : styles.inactiveMenuS}><Send size={18} /> Proses CoE & Visa</button>
                    <button onClick={() => setActiveTab('KEBERANGKATAN')} style={activeTab === 'KEBERANGKATAN' ? styles.activeMenuS : styles.inactiveMenuS}><PlaneTakeoff size={18} /> Laporan Keberangkatan</button>
                    <div style={{ margin: '10px 0', borderBottom: '2px solid #f1f5f9' }}></div>
                    <button onClick={() => setActiveTab('SELESAI')} style={activeTab === 'SELESAI' ? {...styles.activeMenuS, background: '#fef2f2', color: '#ef4444'} : styles.inactiveMenuS}><Archive size={18} /> Arsip Keberangkatan</button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <UserCircle size={32} color={brandNavy} />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{userProfile?.nama_lengkap || 'Memuat...'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>STAF DOKUMEN</div>
                        </div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '8px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Keluar</button>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>{activeTab === 'SELESAI' ? 'Arsip Riwayat Keberangkatan' : activeTab.replace('_', ' & ')}</h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Pantau kelengkapan berkas fisik, digital, dan alur imigrasi siswa.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                        <input type="text" placeholder="Cari Nama Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px', width: '250px' }} />
                    </div>
                </header>

                <div className="fade-in" style={{ flex: 1, overflowY: 'auto' }}>
                    <TabDokumenTable 
                        activeTab={activeTab} isLoading={isLoading} filtered={filtered} docItems={docItems}
                        openChecklistModal={(s) => openModal('CHECKLIST', s)}
                        openOtitModal={(s) => openModal('OTIT', s)}
                        initModalTerbang={initModalTerbang}
                        handleUpdateStage={handleUpdateStage}
                        openBerkasDigital={() => alert("Fitur Berkas Digital dikelola di Tab lain untuk efisiensi.")} // Bisa diimplementasi ulang dengan mudah
                        openPrintMenu={() => alert("Fitur Cetak sedang dalam perbaikan.")}
                    />
                </div>

                {/* ── RENDER MODAL DINAMIS ── */}
                {activeModal === 'OTIT' && <ModalOtit student={selectedStudent} masterMitra={masterMitra} masterKaisha={masterKaisha} masterKumiai={masterKumiai} masterBidang={masterBidang} onClose={closeModal} onSuccess={() => { closeModal(); fetchStudents(); }} />}
                {activeModal === 'CHECKLIST' && <ModalChecklist student={selectedStudent} docItems={docItems} onClose={closeModal} onSuccess={() => { closeModal(); fetchStudents(); }} logActivity={logActivity} />}
                {activeModal === 'TERBANG' && <ModalTerbang student={selectedStudent} onClose={closeModal} onSuccess={() => { closeModal(); fetchStudents(); }} logActivity={logActivity} incrementPoint={incrementPoint} />}
            </main>
        </div>
    );
}