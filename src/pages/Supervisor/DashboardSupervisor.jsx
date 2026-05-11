import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import EditProfileModal from './EditProfileModal';
import JobOrderDetail from './JobOrderDetail';
import MasterMitra from './MasterMitra';
import MasterKaisha from './MasterKaisha';
import MasterKumiai from './MasterKumiai';
import MasterPengguna from './MasterPengguna';
import MasterBidang from './MasterBidang'; 
import { useNavigate, useLocation } from 'react-router-dom';

import {
    FileSignature, Eye, Search, LayoutDashboard,
    X, Activity, ArrowRight, Building2, Briefcase,
    Layers, Archive, LogOut, MoreVertical, Table as TableIcon,
    LayoutGrid, List, Plus, Trash2, ChevronDown, HelpCircle, Users, Plane, ShieldCheck, FileText, Loader2, Save, PieChart, Filter, Clock
} from 'lucide-react';

const cleanStr = (str) => str ? str.toString().trim().toLowerCase() : '';
const safeString = (val) => val ? String(val).toLowerCase() : '';
const isProses = (s) => cleanStr(s.status_akhir) === 'proses' || !s.status_akhir;

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

const PIPELINE_STAGES = [
    'PENDIDIKAN REGULER', 'AVAILABLE', 'PRA_MENSETSU', 'INTERVIEW', 'MATCHED',
    'PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA',
    'PENDIDIKAN DIKLAT', 'SIAP BERANGKAT'
];

// ── DAFTAR LENGKAP PIPELINE DARI AWAL SAMPAI TERBANG ──
const FULL_PIPELINE = [
    { id: 'REGISTRASI', label: '1. Registrasi Awal', group: 'PENDAFTARAN' },
    { id: 'SELEKSI AWAL', label: '2. Seleksi & MCU 1', group: 'PENDAFTARAN' },
    { id: 'PENDIDIKAN REGULER', label: '3. Diklat Reguler', group: 'PENDIDIKAN' },
    { id: 'AVAILABLE', label: '4. Siap Match (Available)', group: 'PENDIDIKAN' },
    { id: 'PRA_MENSETSU', label: '5. Pra-Mensetsu', group: 'REKRUTMEN' },
    { id: 'INTERVIEW', label: '6. Interview Kaisha', group: 'REKRUTMEN' },
    { id: 'MATCHED', label: '7. Lulus (Matched)', group: 'REKRUTMEN' },
    { id: 'MCU_LANJUTAN', label: '8. MCU Lanjutan', group: 'DOKUMEN' },
    { id: 'PENGUMPULAN BERKAS', label: '9. Pemberkasan', group: 'DOKUMEN' },
    { id: 'TTD KONTRAK', label: '10. TTD Kontrak', group: 'DOKUMEN' },
    { id: 'APPLY COE', label: '11. Apply COE', group: 'DOKUMEN' },
    { id: 'APPLY VISA', label: '12. Apply Visa', group: 'DOKUMEN' },
    { id: 'PENDIDIKAN DIKLAT', label: '13. Pemantapan Diklat', group: 'FINALISASI' },
    { id: 'SIAP BERANGKAT', label: '14. Siap Terbang', group: 'FINALISASI' },
    { id: 'ALUMNI', label: '15. Tiba di Jepang (Alumni)', group: 'SELESAI' }
];

const DOC_ITEMS = [
    { id: 'ktp', label: 'KTP' }, { id: 'kk', label: 'KK' }, { id: 'akta', label: 'Akta' },
    { id: 'paspor', label: 'Paspor' }, { id: 'ijazah', label: 'Ijazah' }, { id: 'mcu_final', label: 'MCU' },
    { id: 'skck', label: 'SKCK' }, { id: 'foto', label: 'Foto' }
];

// ── KOMPONEN GRAFIK HORIZONTAL BERSIH ──
const HorizontalBarChart = ({ data, title, subtitle }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', flex: 1 }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><PieChart size={20} color={brandNavy}/> {title}</h3>
            <p style={{ margin: '0 0 25px 0', fontSize: '0.85rem', color: '#64748b' }}>{subtitle}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {data.map((item, idx) => {
                    const pct = (item.value / maxVal) * 100;
                    return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '130px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.label}>{item.label}</div>
                            <div style={{ flex: 1, background: '#f1f5f9', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '6px', transition: 'width 1s ease-out' }}></div>
                            </div>
                            <div style={{ width: '40px', fontSize: '0.9rem', fontWeight: 900, color: '#1e293b', textAlign: 'right' }}>{item.value}</div>
                        </div>
                    );
                })}
                {data.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '20px 0' }}>Belum ada data visual.</div>}
            </div>
        </div>
    );
};

export default function DashboardSupervisor() {
    const navigate = useNavigate();
    const location = useLocation();

    const [userProfile, setUserProfile] = useState({ id: null, inisial: 'U', nama: 'Memuat...', email: 'memuat...', role: 'Memuat...' });
    const [spvType, setSpvType] = useState(location.state?.spvType || 'REKRUTMEN'); 
    const [isLoading, setIsLoading] = useState(true);
    
    const [activeMenu, setActiveMenu] = useState('DASHBOARD');
    const [openSubMenu, setOpenSubMenu] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    // ── RAW DATA UNTUK FILTERING ──
    const [rawStudents, setRawStudents] = useState([]);
    const [rawJobOrders, setRawJobOrders] = useState([]);

    // ── FILTER STATE UNTUK DASHBOARD ANALITIK ──
    const [dashFilters, setDashFilters] = useState({
        bulan: '',
        tahun: new Date().getFullYear().toString(),
        kaisha: '',
        kumiai: ''
    });

    // ── METRIK HASIL FILTER ──
    const [rekStats, setRekStats] = useState({ joAktif: 0, totalKuota: 0, sisaKuota: 0, siswaAvailable: 0 });
    const [rekChart, setRekChart] = useState([]);
    const [dokStats, setDokStats] = useState({ totalMatched: 0, prosesCOE: 0, prosesVisa: 0, siapTerbang: 0 });
    const [dokChart, setDokChart] = useState([]);
    const [pipelineCounts, setPipelineCounts] = useState({ max: 1 });
    const [chartDetailModal, setChartDetailModal] = useState(null);

    // STATE LAINNYA
    const [students, setStudents] = useState([]); 
    const [activeTab, setActiveTab] = useState('SEMUA');
    const [selectedCV, setSelectedCV] = useState(null);
    const [viewMode, setViewMode] = useState('TABLE');
    const [activeJobOrder, setActiveJobOrder] = useState(null);
    const [isJobOrderModalOpen, setIsJobOrderModalOpen] = useState(false);
    const [jobOrders, setJobOrders] = useState([]); 
    const [masterBidang, setMasterBidang] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);
    const [masterKaisha, setMasterKaisha] = useState([]);
    const [isSubmittingJO, setIsSubmittingJO] = useState(false);
    
    // ── PENAMBAHAN PROGRAM & DURASI DI INITIAL STATE ──
    const [newJobOrder, setNewJobOrder] = useState({ 
        job_id: '', perusahaan: '', bidang: '', kumiai: '', kuota: 0, terisi: 0, 
        status: 'AKTIF', catatan: '', program: '', durasi_kontrak: '' 
    });

    useEffect(() => {
        if (location.state?.spvType) {
            setSpvType(location.state.spvType);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: employee } = await supabase.from('employees').select('id, nama_lengkap, email_pribadi, master_role(nama_role)').eq('id', user.id).maybeSingle();
                    if (employee) {
                        setUserProfile({ id: employee.id, inisial: employee.nama_lengkap ? employee.nama_lengkap.charAt(0).toUpperCase() : 'A', nama: employee.nama_lengkap || 'User Tanpa Nama', email: employee.email_pribadi || user.email, role: employee.master_role?.nama_role?.toUpperCase() || 'TIDAK ADA ROLE' });
                        
                        if (!location.state?.spvType) {
                            if (employee.nama_lengkap?.toLowerCase().includes('dokumen')) setSpvType('DOKUMEN');
                            else setSpvType('REKRUTMEN');
                        }
                    } else {
                        setUserProfile({ id: user.id, inisial: user.email ? user.email.charAt(0).toUpperCase() : 'U', nama: 'Admin Utama', email: user.email, role: 'SUPER ADMIN' });
                    }
                }
            } catch (error) {}
        };
        fetchUserProfile();
        
        const fetchDropdowns = async () => {
            try {
                const [bidangRes, kumiaiRes, kaishaRes] = await Promise.all([
                    supabase.from('master_bidang').select('nama_bidang'),
                    supabase.from('master_kumiai').select('nama_kumiai'),
                    supabase.from('master_kaisha').select('*')
                ]);
                if (bidangRes.data) setMasterBidang(bidangRes.data);
                if (kumiaiRes.data) setMasterKumiai(kumiaiRes.data);
                if (kaishaRes.data) setMasterKaisha(kaishaRes.data);
            } catch (error) {}
        };
        fetchDropdowns();
        fetchRawData();
    }, [location.state]);

    const fetchRawData = async () => {
        setIsLoading(true);
        try {
            const [resSiswa, resJO] = await Promise.all([
                supabase.from('students').select('*').order('created_at', { ascending: false }),
                supabase.from('job_orders').select('*')
            ]);
            setRawStudents(resSiswa.data || []);
            setRawJobOrders(resJO.data || []);
        } catch (err) {} finally { setIsLoading(false); }
    };

    useEffect(() => {
        if (rawStudents.length > 0 || rawJobOrders.length > 0) {
            processDashboardMetrics();
        }
    }, [rawStudents, rawJobOrders, dashFilters, spvType]);

    const processDashboardMetrics = () => {
        let fs = [...rawStudents];
        let fj = [...rawJobOrders];

        if (dashFilters.tahun) {
            fs = fs.filter(s => new Date(s.created_at).getFullYear().toString() === dashFilters.tahun);
            fj = fj.filter(j => new Date(j.created_at).getFullYear().toString() === dashFilters.tahun);
        }
        if (dashFilters.bulan) {
            fs = fs.filter(s => (new Date(s.created_at).getMonth() + 1).toString() === dashFilters.bulan);
            fj = fj.filter(j => (new Date(j.created_at).getMonth() + 1).toString() === dashFilters.bulan);
        }

        if (dashFilters.kaisha) {
            fs = fs.filter(s => s.perusahaan_tujuan === dashFilters.kaisha);
            fj = fj.filter(j => j.perusahaan === dashFilters.kaisha);
        }
        if (dashFilters.kumiai) {
            fs = fs.filter(s => {
                const otit = typeof s.data_otit === 'string' ? JSON.parse(s.data_otit || '{}') : (s.data_otit || {});
                return otit.nama_kumiai === dashFilters.kumiai;
            });
            fj = fj.filter(j => j.kumiai === dashFilters.kumiai);
        }

        const counts = {};
        let maxInPipeline = 1;
        FULL_PIPELINE.forEach(stage => {
            const items = fs.filter(s => s.tahap_sekarang === stage.id);
            counts[stage.id] = { count: items.length, students: items };
            if (items.length > maxInPipeline) maxInPipeline = items.length;
        });
        counts.max = maxInPipeline;
        setPipelineCounts(counts);

        const joOpen = fj.filter(j => j.status === 'OPEN');
        const tKuota = joOpen.reduce((acc, curr) => acc + (curr.kuota || 0), 0);
        const tTerisi = joOpen.reduce((acc, curr) => acc + (curr.terisi || 0), 0);
        setRekStats({
            joAktif: joOpen.length, totalKuota: tKuota, sisaKuota: tKuota - tTerisi,
            siswaAvailable: counts['AVAILABLE']?.count || 0
        });
        setRekChart(joOpen.map(j => ({
            label: j.perusahaan.length > 15 ? j.perusahaan.substring(0, 15) + '...' : j.perusahaan,
            value: (j.kuota || 0) - (j.terisi || 0), color: '#3b82f6'
        })).sort((a, b) => b.value - a.value).slice(0, 5));

        setDokStats({
            totalMatched: (counts['MATCHED']?.count || 0) + (counts['PENGUMPULAN BERKAS']?.count || 0),
            prosesCOE: counts['APPLY COE']?.count || 0,
            prosesVisa: counts['APPLY VISA']?.count || 0,
            siapTerbang: counts['SIAP BERANGKAT']?.count || 0
        });
        setDokChart([
            { label: 'Pemberkasan', value: counts['PENGUMPULAN BERKAS']?.count || 0, color: '#8b5cf6' },
            { label: 'Proses COE', value: counts['APPLY COE']?.count || 0, color: '#f59e0b' },
            { label: 'Proses VISA', value: counts['APPLY VISA']?.count || 0, color: '#ec4899' },
            { label: 'Siap Terbang', value: counts['SIAP BERANGKAT']?.count || 0, color: '#10b981' }
        ]);
    };

    const openPipelineDetail = (stageId, stageLabel) => {
        if (!pipelineCounts[stageId] || pipelineCounts[stageId].count === 0) return;
        setChartDetailModal({
            label: stageLabel,
            value: pipelineCounts[stageId].count,
            items: pipelineCounts[stageId].students
        });
    };

    useEffect(() => {
        function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchMasterData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                let filteredData = data;
                if (activeTab === 'LULUS') filteredData = data.filter(s => cleanStr(s.status_akhir) === 'lulus');
                else if (activeTab === 'GAGAL') filteredData = data.filter(s => cleanStr(s.status_akhir) === 'gagal');
                else if (activeTab === 'REGULER') filteredData = data.filter(s => ['PENDIDIKAN REGULER', 'AVAILABLE'].includes(s.tahap_sekarang) && isProses(s));
                else if (activeTab === 'REKRUTMEN') filteredData = data.filter(s => ['PRA_MENSETSU', 'INTERVIEW', 'MATCHED'].includes(s.tahap_sekarang) && isProses(s));
                else if (activeTab === 'DOKUMEN') filteredData = data.filter(s => ['PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA'].includes(s.tahap_sekarang) && isProses(s));
                else if (activeTab === 'KEBERANGKATAN') filteredData = data.filter(s => ['PENDIDIKAN DIKLAT', 'SIAP BERANGKAT'].includes(s.tahap_sekarang) && isProses(s));
                else filteredData = data.filter(isProses);
                setStudents(filteredData);
            }
        } catch (err) {} finally { setIsLoading(false); }
    };

    const fetchJobOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('job_orders').select('*');
            if (error) throw error;
            if (data) setJobOrders(data);
        } catch (err) {} finally { setIsLoading(false); }
    };

    useEffect(() => {
        if (['MASTER_CV', 'LAPORAN_LULUS', 'LAPORAN_GAGAL', 'LAPORAN_PERUSAHAAN', 'MONITORING'].includes(activeMenu)) fetchMasterData();
        if (activeMenu === 'JOB_ORDER' || activeMenu === 'MONITORING') fetchJobOrders();
    }, [activeMenu, activeTab, spvType]);

    // ── PENYIMPANAN JOB ORDER BARU DENGAN PROGRAM & DURASI ──
    const handleAddJobOrder = async (e) => {
        e.preventDefault(); 
        setIsSubmittingJO(true);
        try {
            const payload = { 
                ...newJobOrder, 
                job_id: newJobOrder.job_id || `JO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                durasi_kontrak: newJobOrder.durasi_kontrak ? parseInt(newJobOrder.durasi_kontrak) : null
            };
            const { error } = await supabase.from('job_orders').insert([payload]);
            if (error) throw error;
            
            alert('Job Order berhasil ditambahkan!'); 
            setIsJobOrderModalOpen(false); 
            setNewJobOrder({ job_id: '', perusahaan: '', bidang: '', kumiai: '', kuota: 0, terisi: 0, status: 'AKTIF', catatan: '', program: '', durasi_kontrak: '' }); 
            fetchJobOrders(); 
            fetchRawData();
        } catch (error) { alert(`Gagal: ${error.message}`); } finally { setIsSubmittingJO(false); }
    };

    const handleDeleteJobOrder = async (id, namaPerusahaan) => {
        if (!window.confirm(`Yakin ingin menghapus Job Order untuk ${namaPerusahaan}?`)) return;
        try {
            const { error } = await supabase.from('job_orders').delete().eq('id', id);
            if (error) throw error; alert('Job Order dihapus!'); setActiveDropdown(null); fetchJobOrders(); fetchRawData();
        } catch (error) { alert(`Gagal: ${error.message}`); }
    };

    const handleSaveCV = async (e, finalDataDariModal) => {
        e.preventDefault();
        const payload = finalDataDariModal ? { ...finalDataDariModal } : { ...selectedCV };
        if (!payload || !payload.id) { alert("Error: ID Siswa tidak ditemukan!"); return; }
        const cleanArray = (arr) => { if (!arr) return []; if (Array.isArray(arr)) return arr; if (typeof arr === 'string') { try { return JSON.parse(arr); } catch { return []; } } return []; };
        const dataToSave = {
            ...payload,
            tinggi_badan: payload.tinggi_badan === "" ? null : payload.tinggi_badan, berat_badan: payload.berat_badan === "" ? null : payload.berat_badan,
            ukuran_sepatu: payload.ukuran_sepatu === "" ? null : payload.ukuran_sepatu, ukuran_pinggang: payload.ukuran_pinggang === "" ? null : payload.ukuran_pinggang,
            ukuran_kepala: payload.ukuran_kepala === "" ? null : payload.ukuran_kepala, mata_kanan: payload.mata_kanan === "" ? null : payload.mata_kanan, mata_kiri: payload.mata_kiri === "" ? null : payload.mata_kiri,
            pendidikan_history: cleanArray(payload.pendidikan_history), kerja_history: cleanArray(payload.kerja_history), keluarga_history: cleanArray(payload.keluarga_history), attachments: cleanArray(payload.attachments),
        };
        try {
            const { error } = await supabase.from('students').update(dataToSave).eq('id', dataToSave.id);
            if (error) throw error; alert("Data Berhasil Diperbarui!"); setSelectedCV(null); fetchMasterData(); fetchRawData();
        } catch (err) { alert(`Gagal: ${err.message}`); }
    };

    const handleNextStage = async (id, currentStage, perusahaanTujuan) => {
        const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
        if (currentIndex >= PIPELINE_STAGES.indexOf('MATCHED') && (!perusahaanTujuan || perusahaanTujuan.trim() === '')) {
            alert("⛔ DITOLAK: Siswa ini belum terikat dengan Perusahaan (Kaisha) manapun!\n\nSilakan klik 'Edit Data Rirekisho' dan isi kolom Perusahaan Tujuan terlebih dahulu sebelum melanjutkan ke tahap pengurusan berkas terbang."); setActiveDropdown(null); return;
        }
        if (currentIndex >= 0 && currentIndex < PIPELINE_STAGES.length - 1) {
            const nextStage = PIPELINE_STAGES[currentIndex + 1];
            if (!window.confirm(`Pindahkan siswa ke tahap selanjutnya: ${nextStage}?`)) return;
            try { await supabase.from('students').update({ tahap_sekarang: nextStage, updated_at: new Date() }).eq('id', id); fetchMasterData(); fetchRawData(); setActiveDropdown(null); } catch (err) {}
        } else { alert("Siswa sudah berada di tahap paling akhir."); setActiveDropdown(null); }
    };

    const toggleSubMenu = (menuName) => setOpenSubMenu(openSubMenu === menuName ? '' : menuName);
    
    const filteredStudents = students.filter(s => safeString(s.nama_lengkap).includes(searchTerm.toLowerCase()) || safeString(s.nama_jepang).includes(searchTerm.toLowerCase()) || safeString(s.perusahaan_tujuan).includes(searchTerm.toLowerCase()));
    const filteredJO = jobOrders.filter(jo => safeString(jo.perusahaan).includes(searchTerm.toLowerCase()) || safeString(jo.bidang).includes(searchTerm.toLowerCase()));

    const docStages = ['MATCHED', 'MCU_LANJUTAN', 'PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA', 'SIAP BERANGKAT'];
    const filteredDocsForDashboard = students.filter(s => docStages.includes(s.tahap_sekarang) && (s.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredJOForDashboard = jobOrders.filter(j => j.status === 'OPEN' && (j.perusahaan.toLowerCase().includes(searchTerm.toLowerCase()) || j.bidang.toLowerCase().includes(searchTerm.toLowerCase())));

    const handleLogout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) { await supabase.from('employees').update({ is_online: false }).eq('id', user.id); }
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) { navigate('/login'); }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            <style>{`
                @keyframes pulse-blink { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.98); } 100% { opacity: 1; transform: scale(1); } }
                .status-blink { animation: pulse-blink 1.5s ease-in-out infinite; display: inline-block; }
                .hover-row:hover { background: #f8fafc; cursor: pointer; }
                .hover-row:hover td { color: #1e293b; }
            `}</style>

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
                                <ShieldCheck size={12} /> KEMBALI KE PORTAL
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
                            <button onClick={() => navigate('/reguler/dashboard')} style={subMenuS(false)}><div style={subDot(false)}></div> Pendaftaran Baru</button>                        </div>
                    </div>

                    <div>
                        <button onClick={() => toggleSubMenu('LAPORAN')} style={menuDropdownBtn(openSubMenu === 'LAPORAN')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Archive size={18} /> Laporan <small style={smallKanjiList}>報告</small></div>
                            <ChevronDown size={16} style={{ transform: openSubMenu === 'LAPORAN' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </button>
                        <div style={subMenuContainer(openSubMenu === 'LAPORAN')}>
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

                    <div>
                        <button onClick={() => toggleSubMenu('BANTUAN')} style={menuDropdownBtn(openSubMenu === 'BANTUAN')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><HelpCircle size={18} /> Bantuan <small style={smallKanjiList}>ヘルプ</small></div>
                            <ChevronDown size={16} style={{ transform: openSubMenu === 'BANTUAN' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </button>
                        <div style={subMenuContainer(openSubMenu === 'BANTUAN')}>
                            <button style={subMenuS(false)}><div style={subDot(false)}></div> Pusat Bantuan</button>
                            <button style={subMenuS(false)}><div style={subDot(false)}></div> Tentang Aplikasi</button>
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
                        <JobOrderDetail jobOrder={activeJobOrder} onBack={() => { setActiveJobOrder(null); fetchJobOrders(); fetchRawData(); }} />
                    </div>
                ) : !isLoading && (
                    <>
                        {/* ── DASHBOARD (BERANDA ANALITIK) ── */}
                        {activeMenu === 'DASHBOARD' && (
                            <div className="fade-in">
                                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900 }}>
                                            Dashboard Analitik SPV {spvType}
                                        </h1>
                                        <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>
                                            Ringkasan performa dan metrik operasional terpadu.
                                        </p>
                                    </div>
                                    
                                    {/* ── FILTER GLOBAL DASHBOARD ── */}
                                    <div style={{ display: 'flex', gap: '10px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                        <div>
                                            <div style={filterLabel}><Filter size={12} style={{display:'inline', marginBottom:'-2px'}}/> Bulan</div>
                                            <select style={filterInput} value={dashFilters.bulan} onChange={(e) => setDashFilters({...dashFilters, bulan: e.target.value})}>
                                                <option value="">Semua</option>
                                                {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'].map((b,i) => <option key={i+1} value={i+1}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <div style={filterLabel}>Tahun</div>
                                            <select style={filterInput} value={dashFilters.tahun} onChange={(e) => setDashFilters({...dashFilters, tahun: e.target.value})}>
                                                <option value="">Semua</option>
                                                {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <div style={filterLabel}>Kaisha</div>
                                            <select style={filterInput} value={dashFilters.kaisha} onChange={(e) => setDashFilters({...dashFilters, kaisha: e.target.value})}>
                                                <option value="">Semua Kaisha</option>
                                                {masterKaisha.map((k,i) => <option key={i} value={k.nama_perusahaan}>{k.nama_perusahaan}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <div style={filterLabel}>Kumiai</div>
                                            <select style={filterInput} value={dashFilters.kumiai} onChange={(e) => setDashFilters({...dashFilters, kumiai: e.target.value})}>
                                                <option value="">Semua Kumiai</option>
                                                {masterKumiai.map((k,i) => <option key={i} value={k.nama_kumiai}>{k.nama_kumiai}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </header>

                                {/* ── KPI CARDS ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                                    {spvType === 'REKRUTMEN' ? (
                                        <>
                                            <div style={kpiCard}><div style={kpiLabel}>JOB ORDER AKTIF</div><div style={kpiValue(brandNavy)}>{rekStats.joAktif} <span style={kpiSub}>Kaisha</span></div></div>
                                            <div style={kpiCard}><div style={kpiLabel}>TOTAL KUOTA DIMINTA</div><div style={kpiValue('#8b5cf6')}>{rekStats.totalKuota} <span style={kpiSub}>Orang</span></div></div>
                                            <div style={kpiCard}><div style={kpiLabel}>SISA KUOTA (BELUM TERISI)</div><div style={kpiValue('#ef4444')}>{rekStats.sisaKuota} <span style={kpiSub}>Kursi</span></div></div>
                                            <div style={kpiCard}><div style={kpiLabel}>SISWA AVAILABLE (SIAP MATCH)</div><div style={kpiValue('#10b981')}>{rekStats.siswaAvailable} <span style={kpiSub}>Siswa</span></div></div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={kpiCard}><div style={kpiLabel}>TOTAL MATCHED</div><div style={kpiValue(brandNavy)}>{dokStats.totalMatched} <span style={kpiSub}>Siswa</span></div></div>
                                            <div style={kpiCard}><div style={kpiLabel}>PROSES COE</div><div style={kpiValue('#f59e0b')}>{dokStats.prosesCOE} <span style={kpiSub}>Siswa</span></div></div>
                                            <div style={kpiCard}><div style={kpiLabel}>PROSES VISA</div><div style={kpiValue('#ec4899')}>{dokStats.prosesVisa} <span style={kpiSub}>Siswa</span></div></div>
                                            <div style={kpiCard}><div style={kpiLabel}>SIAP TERBANG</div><div style={kpiValue('#10b981')}>{dokStats.siapTerbang} <span style={kpiSub}>Siswa</span></div></div>
                                        </>
                                    )}
                                </div>

                                {/* ── GRAFIK HORIZONTAL BERSIH ── */}
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                                    {spvType === 'REKRUTMEN' ? (
                                        <HorizontalBarChart data={rekChart} title="Top 5 Kaisha (Sisa Kuota Terbanyak)" subtitle="Prioritaskan penempatan siswa ke perusahaan berikut." />
                                    ) : (
                                        <HorizontalBarChart data={dokChart} title="Distribusi Tahapan Dokumen" subtitle="Pantau penumpukan (bottleneck) siswa di setiap tahap legalitas." />
                                    )}
                                    
                                    <div style={{ background: brandNavy, padding: '30px', borderRadius: '15px', color: 'white', flex: '0 0 350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <ShieldCheck size={40} color={brandYellow} style={{ marginBottom: '20px' }} />
                                        <h3 style={{ fontSize: '1.4rem', margin: '0 0 10px 0', fontWeight: 900 }}>Filter Terintegrasi</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            Filter Bulan, Tahun, Kaisha, dan Kumiai di atas akan secara otomatis mengubah seluruh hitungan tabel pipeline dan statistik di halaman ini secara spesifik.
                                        </p>
                                    </div>
                                </div>

                                {/* ── TABEL MASTER PIPELINE END-TO-END (CLICKABLE) ── */}
                                <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                                    <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} color={brandNavy} /> Master Pipeline Siswa (End-to-End)</h3>
                                            <p style={{ margin: '5px 0 0 30px', fontSize: '0.85rem', color: '#64748b' }}>Klik pada baris tabel untuk melihat detail nama siswa yang menumpuk di tahapan tersebut.</p>
                                        </div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr>
                                                <th style={thP}>Grup Divisi</th>
                                                <th style={thP}>Tahapan Proses (Pipeline)</th>
                                                <th style={thP}>Kepadatan Siswa</th>
                                                <th style={{...thP, textAlign: 'right'}}>Jumlah</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {FULL_PIPELINE.map((stage, idx) => {
                                                const dataStage = pipelineCounts[stage.id] || { count: 0, students: [] };
                                                const count = dataStage.count;
                                                const pct = pipelineCounts.max > 0 ? (count / pipelineCounts.max) * 100 : 0;
                                                
                                                let bgCol = '#cbd5e1';
                                                if(stage.group === 'PENDAFTARAN') bgCol = '#3b82f6';
                                                if(stage.group === 'PENDIDIKAN') bgCol = '#10b981';
                                                if(stage.group === 'REKRUTMEN') bgCol = '#f59e0b';
                                                if(stage.group === 'DOKUMEN') bgCol = '#8b5cf6';
                                                if(stage.group === 'FINALISASI') bgCol = '#ec4899';
                                                if(stage.group === 'SELESAI') bgCol = '#14b8a6';

                                                return (
                                                    <tr key={stage.id} className="hover-row" onClick={() => openPipelineDetail(stage.id, stage.label)} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                                                        <td style={{...tdP, fontSize: '0.75rem', fontWeight: 800, color: bgCol}}>{stage.group}</td>
                                                        <td style={{...tdP, fontWeight: 800, color: '#475569', transition: '0.2s'}}>{stage.label}</td>
                                                        <td style={{...tdP, width: '40%'}}>
                                                            <div style={{ width: '100%', background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${pct}%`, background: bgCol, height: '100%', borderRadius: '5px', transition: 'width 1s ease-out' }}></div>
                                                            </div>
                                                        </td>
                                                        <td style={{...tdP, textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: '#1e293b'}}>{count}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── TABEL MONITORING SPV KHUSUS ── */}
                        {activeMenu === 'MONITORING' && (
                            <div className="fade-in">
                                <header style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontWeight: 900, fontSize: '2rem' }}>Monitoring Detail: {spvType}</h2>
                                        <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>Pantau pergerakan data dari staf di lapangan.</p>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px' }} color="#94a3b8" />
                                        <input placeholder="Cari nama / data..." style={{ padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }} onChange={e => setSearchTerm(e.target.value)} />
                                    </div>
                                </header>

                                <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    {spvType === 'REKRUTMEN' ? (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                                                <tr><th style={thP}>Perusahaan & ID</th><th style={thP}>Bidang</th><th style={thP}>Kuota Terisi</th><th style={thP}>Status</th></tr>
                                            </thead>
                                            <tbody>
                                                {filteredJOForDashboard.map(j => {
                                                    const pct = j.kuota > 0 ? (j.terisi / j.kuota) * 100 : 0;
                                                    return (
                                                        <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={tdP}>
                                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{j.perusahaan}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                                                    {j.job_id} {j.program ? `• ${j.program}` : ''} {j.durasi_kontrak ? `(${j.durasi_kontrak} Bln)` : ''}
                                                                </div>
                                                            </td>
                                                            <td style={tdP}>{j.bidang}</td>
                                                            <td style={tdP}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ flex: 1, background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '100px' }}>
                                                                        <div style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : '#10b981', height: '100%' }}></div>
                                                                    </div>
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>{j.terisi}/{j.kuota}</span>
                                                                </div>
                                                            </td>
                                                            <td style={tdP}><span style={tagS(j.status)}>{j.status}</span></td>
                                                        </tr>
                                                    )
                                                })}
                                                {filteredJOForDashboard.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Data kosong atau Job Order tidak ditemukan.</td></tr>}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                                                <tr><th style={thP}>Identitas Siswa</th><th style={thP}>Status Berkas Fisik</th><th style={thP}>Item Belum Lengkap</th><th style={thP}>Tahapan</th></tr>
                                            </thead>
                                            <tbody>
                                                {filteredDocsForDashboard.map(s => {
                                                    const parsed = typeof s.pemberkasan_status === 'string' ? JSON.parse(s.pemberkasan_status || '{}') : (s.pemberkasan_status || {});
                                                    const missing = DOC_ITEMS.filter(d => !parsed[d.id]).map(d => d.label);
                                                    const done = DOC_ITEMS.length - missing.length;
                                                    return (
                                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={tdP}>
                                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama_lengkap}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kaisha: <span style={{color: '#ec4899', fontWeight: 700}}>{s.perusahaan_tujuan || '-'}</span></div>
                                                            </td>
                                                            <td style={tdP}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{ width: '100px', background: '#e2e8f0', height: '6px', borderRadius: '3px' }}>
                                                                        <div style={{ width: `${(done/DOC_ITEMS.length)*100}%`, background: done === DOC_ITEMS.length ? '#10b981' : '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                                                                    </div>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{done}/{DOC_ITEMS.length}</span>
                                                                </div>
                                                            </td>
                                                            <td style={tdP}>
                                                                {missing.length === 0 ? <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem' }}>LENGKAP</span> : (
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                        {missing.map(m => <span key={m} style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{m}</span>)}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={tdP}><span style={tagS('CETAK')}>{s.tahap_sekarang}</span></td>
                                                        </tr>
                                                    );
                                                })}
                                                {filteredDocsForDashboard.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Data kosong atau Siswa tidak ditemukan.</td></tr>}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── MASTER MITRA, KAISHA, KUMIAI, BIDANG ── */}
                        {activeMenu === 'MASTER_MITRA' && <MasterMitra />}
                        {activeMenu === 'MASTER_KAISHA' && <MasterKaisha />}
                        {activeMenu === 'MASTER_KUMIAI' && <MasterKumiai />}
                        {activeMenu === 'MASTER_BIDANG' && <MasterBidang />}
                        {activeMenu === 'MASTER_PENGGUNA' && <MasterPengguna />}

                        {/* ── MANAJEMEN SISWA & LAPORAN ── */}
                        {['MASTER_CV', 'LAPORAN_LULUS', 'LAPORAN_GAGAL', 'LAPORAN_PERUSAHAAN'].includes(activeMenu) && (
                            <div className="fade-in">
                                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '15px', fontWeight: 900 }}>
                                            {activeMenu === 'MASTER_CV' ? 'Manajemen Siswa LPK' : activeMenu === 'LAPORAN_LULUS' ? 'Laporan Kelulusan' : activeMenu === 'LAPORAN_PERUSAHAAN' ? 'Laporan Penempatan Perusahaan' : 'Laporan Gagal/Mundur'}
                                        </h1>
                                        {activeMenu === 'MASTER_CV' && (
                                            <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '10px' }}>
                                                {['SEMUA', 'REGULER', 'REKRUTMEN', 'DOKUMEN', 'KEBERANGKATAN'].map(tab => (
                                                    <button key={tab} onClick={() => setActiveTab(tab)} style={tabS(activeTab === tab)}>{tab}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                                            <input type="text" placeholder="Cari Nama / Kaisha..." onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '300px', fontSize: '0.9rem' }} />
                                        </div>
                                        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                                            <button onClick={() => setViewMode('CARD')} style={viewBtnS(viewMode === 'CARD')} title="Bentuk Card"><LayoutGrid size={18} /></button>
                                            <button onClick={() => setViewMode('TABLE')} style={viewBtnS(viewMode === 'TABLE')} title="Bentuk Label"><List size={18} /></button>
                                        </div>
                                    </div>
                                </header>

                                {filteredStudents && filteredStudents.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', background: 'white', borderRadius: '15px' }}>Belum ada data di tahapan ini.</div>
                                ) : viewMode === 'TABLE' ? (
                                    <div style={{ background: 'white', borderRadius: '15px', overflow: 'visible', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr><th style={thP}>Identitas Siswa</th><th style={thP}>Tahap / Posisi</th><th style={thP}>Status Akhir</th><th style={{ ...thP, textAlign: 'center' }}>Aksi</th></tr>
                                            </thead>
                                            <tbody>
                                                {filteredStudents.map(s => (
                                                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={tdP}>
                                                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama_lengkap}</div>
                                                            <div style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>{s.nama_jepang || '(Nama Jepang Belum Diisi)'}</div>
                                                        </td>
                                                        <td style={tdP}>
                                                            <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>{s.tahap_sekarang}</span>
                                                            {s.perusahaan_tujuan && ['LAPORAN_LULUS', 'LAPORAN_PERUSAHAAN'].includes(activeMenu) && (
                                                                <div style={{ fontSize: '0.75rem', color: '#ec4899', marginTop: '4px', fontWeight: 800 }}>📍 {s.perusahaan_tujuan}</div>
                                                            )}
                                                        </td>
                                                        <td style={tdP}>
                                                            <span style={tagS(s.status_akhir)}>{s.status_akhir || 'Proses'}</span>
                                                        </td>
                                                        <td style={{ ...tdP, textAlign: 'center', position: 'relative' }}>
                                                            <button onClick={() => setActiveDropdown(activeDropdown === s.id ? null : s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '5px' }}>
                                                                <MoreVertical size={20} />
                                                            </button>
                                                            {activeDropdown === s.id && (
                                                                <div ref={dropdownRef} style={dropdownContainer}>
                                                                    <button onClick={() => { window.open(`/print-cv/${s.id}`, '_blank'); setActiveDropdown(null); }} style={dropdownItemS}><Eye size={16} /> Preview Rirekisho</button>
                                                                    <button onClick={() => { setSelectedCV(s); setActiveDropdown(null); }} style={dropdownItemS}><FileSignature size={16} /> Edit Data Rirekisho</button>
                                                                    {isProses(s) && <div style={{ borderTop: '1px solid #f1f5f9', margin: '5px 0' }}></div>}
                                                                    {isProses(s) && <button onClick={() => handleNextStage(s.id, s.tahap_sekarang, s.perusahaan_tujuan)} style={{ ...dropdownItemS, color: '#059669' }}><ArrowRight size={16} /> Lanjut Tahap</button>}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                        {filteredStudents.map(s => (
                                            <div key={s.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                                    <div style={{ paddingRight: '10px' }}>
                                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem', lineHeight: '1.2', marginBottom: '4px' }}>{s.nama_lengkap}</div>
                                                        <div style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>{s.nama_jepang || '(Nama Jepang Kosong)'}</div>
                                                    </div>
                                                    <button onClick={() => setActiveDropdown(activeDropdown === s.id ? null : s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', alignSelf: 'flex-start' }}>
                                                        <MoreVertical size={20} />
                                                    </button>

                                                    {activeDropdown === s.id && (
                                                        <div ref={dropdownRef} style={{ ...dropdownContainer, right: '15px', top: '40px' }}>
                                                            <button onClick={() => { window.open(`/print-cv/${s.id}`, '_blank'); setActiveDropdown(null); }} style={dropdownItemS}><Eye size={16} /> Preview Rirekisho</button>
                                                            <button onClick={() => { setSelectedCV(s); setActiveDropdown(null); }} style={dropdownItemS}><FileSignature size={16} /> Edit Data Rirekisho</button>
                                                            {isProses(s) && <div style={{ borderTop: '1px solid #f1f5f9', margin: '5px 0' }}></div>}
                                                            {isProses(s) && <button onClick={() => handleNextStage(s.id, s.tahap_sekarang, s.perusahaan_tujuan)} style={{ ...dropdownItemS, color: '#059669' }}><ArrowRight size={16} /> Lanjut Tahap</button>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Tahap Saat Ini</div>
                                                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>{s.tahap_sekarang}</div>
                                                    {s.perusahaan_tujuan && (
                                                        <div style={{ fontSize: '0.8rem', color: '#ec4899', marginTop: '6px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Building2 size={14} /> {s.perusahaan_tujuan}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>ID: {s.id.substring(0, 6)}...</span>
                                                    <span style={tagS(s.status_akhir)}>{s.status_akhir || 'Proses'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── JOB ORDER (KAISHA) ── */}
                        {activeMenu === 'JOB_ORDER' && (
                            <div className="fade-in">
                                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0', fontWeight: 900 }}>Job Order (Kaisha)</h1>
                                        <p style={{ color: '#64748b', margin: 0 }}>Daftar permintaan tenaga kerja dari perusahaan Jepang.</p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                                            <input type="text" placeholder="Cari Perusahaan..." onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '0.9rem' }} />
                                        </div>
                                        <button onClick={() => {
                                            setNewJobOrder({ job_id: `JO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`, perusahaan: '', bidang: '', kumiai: '', kuota: 0, terisi: 0, status: 'AKTIF', catatan: '', program: '', durasi_kontrak: '' });
                                            setIsJobOrderModalOpen(true);
                                        }} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Plus size={18} /> Tambah Job
                                        </button>
                                        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                                            <button onClick={() => setViewMode('CARD')} style={viewBtnS(viewMode === 'CARD')} title="Bentuk Card"><LayoutGrid size={18} /></button>
                                            <button onClick={() => setViewMode('TABLE')} style={viewBtnS(viewMode === 'TABLE')} title="Bentuk Label"><List size={18} /></button>
                                        </div>
                                    </div>
                                </header>

                                {filteredJO.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', background: 'white', borderRadius: '15px' }}>Tidak ada Job Order yang ditemukan. Silakan tambah data baru.</div>
                                ) : viewMode === 'TABLE' ? (
                                    <div style={{ background: 'white', borderRadius: '15px', overflow: 'visible', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr><th style={thP}>ID & Perusahaan</th><th style={thP}>Bidang</th><th style={thP}>Progress Kuota</th><th style={thP}>Status</th><th style={{ ...thP, textAlign: 'center' }}>Aksi</th></tr>
                                            </thead>
                                            <tbody>
                                                {filteredJO.map(jo => {
                                                    const pct = jo.kuota > 0 ? (jo.terisi / jo.kuota) * 100 : 0;
                                                    const statusAtas = cleanStr(jo.status).toUpperCase();
                                                    const isBlinking = !['SELESAI', 'CANCEL', 'PENUH'].includes(statusAtas);

                                                    return (
                                                        <tr key={jo.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                            <td style={{ ...tdP, cursor: 'pointer' }} onClick={() => setActiveJobOrder(jo)}>
                                                                <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={16} color={brandNavy} /> {jo.perusahaan}</div>
                                                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>
                                                                    {jo.job_id} {jo.program ? `• ${jo.program}` : ''} {jo.durasi_kontrak ? `(${jo.durasi_kontrak} Bln)` : ''}
                                                                </div>
                                                            </td>
                                                            <td style={{ ...tdP, cursor: 'pointer' }} onClick={() => setActiveJobOrder(jo)}><div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem' }}><Briefcase size={14} color="#94a3b8" /> {jo.bidang}</div></td>
                                                            <td style={{ ...tdP, cursor: 'pointer' }} onClick={() => setActiveJobOrder(jo)}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ flex: 1, background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : '#10b981', height: '100%' }}></div></div><span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', width: '40px' }}>{jo.terisi}/{jo.kuota}</span></div></td>
                                                            <td style={{ ...tdP, cursor: 'pointer' }} onClick={() => setActiveJobOrder(jo)}>
                                                                <span className={isBlinking ? 'status-blink' : ''} style={tagS(jo.status)}>{jo.status}</span>
                                                            </td>
                                                            <td style={{ ...tdP, textAlign: 'center', position: 'relative' }}>
                                                                <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === jo.id ? null : jo.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '5px' }}>
                                                                    <MoreVertical size={20} />
                                                                </button>
                                                                {activeDropdown === jo.id && (
                                                                    <div ref={dropdownRef} style={dropdownContainer}>
                                                                        <button onClick={(e) => { e.stopPropagation(); window.open(`/print-laporan-kaisha/${jo.id}`, '_blank'); setActiveDropdown(null); }} style={{ ...dropdownItemS, color: brandNavy }}><FileText size={16} /> Cetak Laporan</button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteJobOrder(jo.id, jo.perusahaan); }} style={{ ...dropdownItemS, color: '#ef4444' }}><Trash2 size={16} /> Hapus Job Order</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                        {filteredJO.map(jo => {
                                            const pct = jo.kuota > 0 ? (jo.terisi / jo.kuota) * 100 : 0;
                                            const statusAtas = cleanStr(jo.status).toUpperCase();
                                            const isBlinking = !['SELESAI', 'CANCEL', 'PENUH'].includes(statusAtas);

                                            return (
                                                <div key={jo.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', position: 'relative' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                                        <div onClick={() => setActiveJobOrder(jo)} style={{ cursor: 'pointer', flex: 1 }}>
                                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', marginBottom: '4px' }}>{jo.perusahaan}</div>
                                                            <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px' }}>
                                                                <Briefcase size={12} /> {jo.bidang}
                                                                {jo.program && <><span style={{color:'#cbd5e1'}}>|</span> <span style={{fontWeight: 700}}>{jo.program}</span></>}
                                                                {jo.durasi_kontrak && <><span style={{color:'#cbd5e1'}}>|</span> ⏳ {jo.durasi_kontrak} Bln</>}
                                                            </div>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === jo.id ? null : jo.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                                                            <MoreVertical size={20} />
                                                        </button>

                                                        {activeDropdown === jo.id && (
                                                            <div ref={dropdownRef} style={{ ...dropdownContainer, right: '15px', top: '40px' }}>
                                                                <button onClick={(e) => { e.stopPropagation(); window.open(`/print-laporan-kaisha/${jo.id}`, '_blank'); setActiveDropdown(null); }} style={{ ...dropdownItemS, color: brandNavy }}><FileText size={16} /> Cetak Laporan</button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteJobOrder(jo.id, jo.perusahaan); }} style={{ ...dropdownItemS, color: '#ef4444' }}><Trash2 size={16} /> Hapus Job Order</button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div onClick={() => setActiveJobOrder(jo)} style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                            <span className={isBlinking ? 'status-blink' : ''} style={tagS(jo.status)}>{jo.status}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>
                                                            <span>Progress Kuota</span>
                                                            <span>{jo.terisi} / {jo.kuota} Peserta</span>
                                                        </div>
                                                        <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : '#10b981', height: '100%' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                    </>
                )}
            </main>

            {/* ── MODAL DETAIL DIAGRAM (DRILL DOWN PIPELINE) ── */}
            {chartDetailModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div className="fade-in" style={{ background: 'white', borderRadius: '15px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '20px 25px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color={brandNavy} /> Tahap: {chartDetailModal.label}</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Terdapat {chartDetailModal.value} Siswa di tahap ini.</p>
                            </div>
                            <button onClick={() => setChartDetailModal(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '10px 25px 25px 25px', flex: 1 }}>
                            {chartDetailModal.items.map((s, idx) => (
                                <div key={idx} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{s.nama_lengkap}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{s.nik || 'NIK Kosong'} {s.perusahaan_tujuan ? `• Kaisha: ${s.perusahaan_tujuan}` : ''}</div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: brandNavy, background: '#e0e7ff', padding: '6px 12px', borderRadius: '20px' }}>
                                        {s.status_akhir || 'Proses'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL TAMBAH JOB ORDER ── */}
            {isJobOrderModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleAddJobOrder} style={{ background: 'white', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative', width: '700px', padding: 0 }}>
                        <div style={{ background: brandNavy, padding: '20px 25px', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'white', fontWeight: 900 }}>Tambah Job Order Baru</h2>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>Publikasikan kebutuhan tenaga kerja Kaisha</p>
                            </div>
                            <button type="button" onClick={() => setIsJobOrderModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={22} /></button>
                        </div>
                        
                        <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelForm}>ID Job Order</label>
                                <input style={inputForm} required value={newJobOrder.job_id} onChange={(e) => setNewJobOrder({ ...newJobOrder, job_id: e.target.value })} />
                            </div>
                            
                            <div>
                                <label style={labelForm}>Nama Perusahaan (Kaisha) *</label>
                                <input style={inputForm} required placeholder="Contoh: TOYOTA CORP" value={newJobOrder.perusahaan} onChange={(e) => setNewJobOrder({ ...newJobOrder, perusahaan: e.target.value })} />
                            </div>
                            
                            {/* ── FIELD BARU: PROGRAM ── */}
                            <div>
                                <label style={{...labelForm, color: '#10b981'}}>Program Kaisha *</label>
                                <select style={{...inputForm, border: '2px solid #a7f3d0'}} required value={newJobOrder.program} onChange={(e) => setNewJobOrder({ ...newJobOrder, program: e.target.value })}>
                                    <option value="">-- Pilih Program --</option>
                                    <option value="Pemagangan (Jisshusei)">Pemagangan (Jisshusei)</option>
                                    <option value="Tokutei Ginou (TG)">Tokutei Ginou (TG)</option>
                                    <option value="Engineering (Gijinkoku)">Engineering (Gijinkoku)</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            {/* ── FIELD BARU: DURASI KONTRAK ── */}
                            <div>
                                <label style={{...labelForm, color: '#f59e0b'}}><Clock size={12} style={{display:'inline', marginBottom:'-2px'}}/> Durasi Kontrak (Bulan) *</label>
                                <input style={{...inputForm, border: '2px solid #fde68a'}} type="number" required min="1" placeholder="Cth: 36, 60..." value={newJobOrder.durasi_kontrak} onChange={(e) => setNewJobOrder({ ...newJobOrder, durasi_kontrak: e.target.value })} />
                            </div>
                            
                            <div>
                                <label style={labelForm}>Bidang / Jenis Job *</label>
                                <select style={inputForm} required value={newJobOrder.bidang} onChange={(e) => setNewJobOrder({ ...newJobOrder, bidang: e.target.value })}>
                                    <option value="">-- Pilih Bidang --</option>
                                    {masterBidang.map((b, idx) => {
                                        const namaVal = b.nama_bidang || b.bidang || b.nama || b.name || Object.values(b)[1];
                                        return <option key={`bidang-${idx}`} value={namaVal}>{namaVal}</option>;
                                    })}
                                </select>
                            </div>

                            <div>
                                <label style={labelForm}>Nama Kumiai (Pengawas) *</label>
                                <select style={inputForm} required value={newJobOrder.kumiai} onChange={(e) => setNewJobOrder({ ...newJobOrder, kumiai: e.target.value })}>
                                    <option value="">-- Pilih Kumiai --</option>
                                    {masterKumiai.map((k, idx) => {
                                        const namaVal = k.nama_kumiai || k.kumiai || k.nama || k.name || Object.values(k)[1];
                                        return <option key={`kumiai-${idx}`} value={namaVal}>{namaVal}</option>;
                                    })}
                                </select>
                            </div>

                            <div>
                                <label style={{...labelForm, color: '#ec4899'}}>Kuota Dibutuhkan *</label>
                                <input style={{...inputForm, fontSize: '1.2rem', fontWeight: 800, border: '2px solid #fbcfe8', color: '#be185d'}} type="number" required min="1" value={newJobOrder.kuota} onChange={(e) => setNewJobOrder({ ...newJobOrder, kuota: parseInt(e.target.value) })} />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelForm}>Status Job Order</label>
                                <select style={{...inputForm, background: '#f8fafc'}} value={newJobOrder.status} onChange={(e) => setNewJobOrder({ ...newJobOrder, status: e.target.value })}>
                                    <option value="AKTIF">AKTIF (Recruiting)</option>
                                    <option value="PENUH">PENUH (Full)</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelForm}>Catatan / Persyaratan (Opsional)</label>
                                <textarea style={{...inputForm, resize: 'vertical'}} rows="2" value={newJobOrder.catatan} onChange={(e) => setNewJobOrder({ ...newJobOrder, catatan: e.target.value })} placeholder="Cth: Butuh Laki-laki usia maks 25th..."></textarea>
                            </div>
                        </div>

                        <div style={{ padding: '20px 25px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsJobOrderModalOpen(false)} style={{ padding: '12px 20px', background: 'white', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Batal</button>
                            <button type="submit" disabled={isSubmittingJO} style={{ padding: '12px 25px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: isSubmittingJO ? 'not-allowed' : 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isSubmittingJO ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Publikasi Job Order</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* MODAL EDIT CV (Hanya untuk Transaksi Master) */}
            <EditProfileModal selectedCV={selectedCV} setSelectedCV={setSelectedCV} handleSaveCV={handleSaveCV} />
        </div>
    );
}

// ── STYLE OBJECTS ──
const menuS = (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: isActive ? brandYellow : 'rgba(255, 255, 255, 0.7)', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', transition: '0.3s' });
const menuDropdownBtn = (isOpen) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: isOpen ? 'white' : 'rgba(255, 255, 255, 0.7)', border: 'none', borderRadius: isOpen ? '10px 10px 0 0' : '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', transition: '0.3s' });
const subMenuContainer = (isOpen) => ({ maxHeight: isOpen ? '300px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '0 0 10px 10px', marginTop: '-5px', paddingBottom: isOpen ? '10px' : '0' });
const subMenuS = (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px 10px 40px', background: 'transparent', color: isActive ? brandYellow : 'rgba(255, 255, 255, 0.6)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', transition: '0.2s' });
const subDot = (isActive) => ({ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? brandYellow : 'rgba(255, 255, 255, 0.4)', transition: '0.2s' });
const smallKanjiList = { color: '#cbd5e1', fontSize: '0.65rem', fontWeight: 800, marginLeft: 'auto' };
const labelForm = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputForm = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc', transition: 'border-color 0.2s' };
const tabS = (active) => ({ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: active ? brandNavy : 'transparent', fontWeight: 700, color: active ? 'white' : '#64748b', fontSize: '0.8rem', transition: '0.2s' });
const viewBtnS = (active) => ({ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: active ? 'white' : 'transparent', color: active ? brandNavy : '#94a3b8', transition: '0.2s', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' });
const thP = { padding: '15px 25px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', fontWeight: 800 };
const tdP = { padding: '15px 25px', verticalAlign: 'middle', fontSize: '0.9rem', color: '#334155' };
const dropdownContainer = { position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '180px', zIndex: 50, padding: '5px', textAlign: 'left' };
const dropdownItemS = { width: '100%', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', borderRadius: '6px', transition: 'background 0.2s' };
const tagS = (st) => {
    const s = cleanStr(st).toUpperCase();
    let bg = '#fef3c7', col = '#92400e';
    if (['LULUS', 'AKTIF', 'OPEN'].includes(s)) { bg = '#dcfce7'; col = '#166534'; }
    else if (['GAGAL', 'PENUH', 'CANCEL'].includes(s)) { bg = '#fee2e2'; col = '#991b1b'; }
    else if (['CETAK', 'WAWANCARA'].includes(s)) { bg = '#dbeafe'; col = brandNavy; }
    return { padding: '5px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900, background: bg, color: col };
};
const kpiCard = { background: 'white', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const kpiLabel = { fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', marginBottom: '8px', letterSpacing: '1px' };
const kpiValue = (color) => ({ fontSize: '2.5rem', fontWeight: 900, color: color, lineHeight: '1' });
const kpiSub = { fontSize: '0.9rem', color: '#64748b', fontWeight: 700 };
const filterLabel = { fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' };
const filterInput = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem', color: '#1e293b', background: '#f8fafc', width: '100%', minWidth: '120px' };