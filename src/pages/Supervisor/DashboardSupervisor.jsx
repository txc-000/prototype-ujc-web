import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import EditProfileModal from './EditProfileModal';
import JobOrderDetail from './JobOrderDetail';
import MasterMitra from './MasterMitra';
import MasterKaisha from './MasterKaisha';
import MasterKumiai from './MasterKumiai';
import MasterPengguna from './MasterPengguna';
import { useNavigate } from 'react-router-dom';

import {
    FileSignature, Eye, Search, LayoutDashboard,
    BarChart3, X, ChevronRight, Activity, ArrowRight, Building2, Briefcase,
    Layers, Archive, LogOut, MoreVertical,
    LayoutGrid, List, Plus, Trash2, ChevronDown, HelpCircle, Users, Plane, ShieldCheck
} from 'lucide-react';

const cleanStr = (str) => str ? str.toString().trim().toLowerCase() : '';
const safeString = (val) => val ? String(val).toLowerCase() : '';
const isProses = (s) => cleanStr(s.status_akhir) === 'proses' || !s.status_akhir;

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

const PIPELINE_STAGES = [
    'PENDIDIKAN REGULER', 'AVAILABLE', 'PRA-MENSETSU', 'INTERVIEW', 'MATCHED',
    'PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA',
    'PENDIDIKAN DIKLAT', 'SIAP BERANGKAT'
];

const CircleProgress = ({ percentage, color, title, value, subtitle }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{percentage}%</div>
            </div>
            <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', lineHeight: 1.2, marginTop: '5px' }}>{value}</div>
                {subtitle && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', fontWeight: 600 }}>{subtitle}</div>}
            </div>
        </div>
    );
};

export default function DashboardSupervisor() {
    const navigate = useNavigate();

    const [userProfile, setUserProfile] = useState({ inisial: 'U', nama: 'Memuat...', email: 'memuat...', role: 'Memuat...' });
    const [activeMenu, setActiveMenu] = useState('DASHBOARD');
    const [openSubMenu, setOpenSubMenu] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [stats, setStats] = useState({ aktif: 0, lulus: 0, gagal: 0, totalTerdaftar: 0, persenLulus: 0 });
    const [pipelineData, setPipelineData] = useState([]);
    const [activeChart, setActiveChart] = useState('ALL');
    const [chartData, setChartData] = useState([]);
    const [chartDetailModal, setChartDetailModal] = useState(null);

    const [students, setStudents] = useState([]);
    const [activeTab, setActiveTab] = useState('SEMUA');
    const [selectedCV, setSelectedCV] = useState(null);
    const [viewMode, setViewMode] = useState('TABLE');
    const [activeJobOrder, setActiveJobOrder] = useState(null);
    const [isJobOrderModalOpen, setIsJobOrderModalOpen] = useState(false);
    const [jobOrders, setJobOrders] = useState([]);
    const [newJobOrder, setNewJobOrder] = useState({ job_id: '', perusahaan: '', bidang: '', kumiai: '', kuota: 0, terisi: 0, status: 'AKTIF', catatan: '' });

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: employee } = await supabase.from('employees').select('nama_lengkap, email_pribadi, master_role(nama_role)').eq('id', user.id).single();
                    if (employee) {
                        setUserProfile({ inisial: employee.nama_lengkap ? employee.nama_lengkap.charAt(0).toUpperCase() : 'A', nama: employee.nama_lengkap || 'User Tanpa Nama', email: employee.email_pribadi || user.email, role: employee.master_role?.nama_role?.toUpperCase() || 'TIDAK ADA ROLE' });
                    } else {
                        setUserProfile({ inisial: user.email ? user.email.charAt(0).toUpperCase() : 'U', nama: 'Admin Utama', email: user.email, role: 'SUPER ADMIN' });
                    }
                }
            } catch (error) { setUserProfile({ inisial: 'A', nama: 'Administrator', email: 'admin@ujc.co.id', role: 'ADMIN' }); }
        };
        fetchUserProfile();
    }, []);

    useEffect(() => {
        function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data, error } = await supabase.from('students').select('*');
            if (error) throw error;
            if (data) {
                const countByGroup = (stages) => data.filter(s => stages.includes(s.tahap_sekarang) && isProses(s)).length;
                const lulusCount = data.filter(s => cleanStr(s.status_akhir) === 'lulus').length;
                const gagalCount = data.filter(s => cleanStr(s.status_akhir) === 'gagal').length;
                const aktifCount = data.filter(isProses).length;
                const totalSiswa = data.length;

                setPipelineData([
                    { step: 'Reguler (Persiapan)', count: countByGroup(['PENDIDIKAN REGULER', 'AVAILABLE']), color: brandNavy },
                    { step: 'Rekrutmen (Seleksi)', count: countByGroup(['PRA-MENSETSU', 'INTERVIEW', 'MATCHED']), color: '#f59e0b' },
                    { step: 'Dokumen (Legal)', count: countByGroup(['PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA']), color: '#8b5cf6' },
                    { step: 'Diklat & Terbang', count: countByGroup(['PENDIDIKAN DIKLAT', 'SIAP BERANGKAT']), color: '#10b981' },
                ]);

                setStats({ aktif: aktifCount, lulus: lulusCount, gagal: gagalCount, totalTerdaftar: totalSiswa, persenLulus: totalSiswa > 0 ? Math.round((lulusCount / totalSiswa) * 100) : 0 });
                generateChartData(data, activeChart);
            }
        } catch (err) { console.error(err); }
    };

    const generateChartData = (allData, chartType) => {
        const getMonthName = (dateString) => dateString ? new Date(dateString).toLocaleString('id-ID', { month: 'short', year: 'numeric' }) : 'Unk';

        if (chartType === 'ALL') {
            setChartData(PIPELINE_STAGES.map(stage => {
                const items = allData.filter(s => s.tahap_sekarang === stage && isProses(s));
                return { label: stage.replace('PENDIDIKAN', '').trim(), value: items.length, color: brandNavy, items: items };
            }));
        } else if (chartType === 'MONTHLY_TREND') {
            const grouped = allData.reduce((acc, curr) => {
                const dateObj = curr.created_at ? new Date(curr.created_at) : new Date();
                const m = dateObj.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
                const sortKey = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime();
                if (!acc[sortKey]) acc[sortKey] = { label: m, items: [] };
                acc[sortKey].items.push(curr);
                return acc;
            }, {});

            const sortedKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).slice(-6);
            if (sortedKeys.length === 0) setChartData([{ label: 'Belum Ada Data', value: 0, color: '#cbd5e1', items: [] }]);
            else setChartData(sortedKeys.map(k => ({ label: grouped[k].label, value: grouped[k].items.length, color: '#3b82f6', items: grouped[k].items })));

        } else if (chartType === 'RESULT') {
            const lulusItems = allData.filter(s => cleanStr(s.status_akhir) === 'lulus');
            const gagalItems = allData.filter(s => cleanStr(s.status_akhir) === 'gagal');
            setChartData([
                { label: 'Siswa Lulus', value: lulusItems.length, color: '#10b981', items: lulusItems },
                { label: 'Siswa Gagal', value: gagalItems.length, color: '#ef4444', items: gagalItems }
            ]);
        } else if (chartType === 'COMPANY_SPREAD') {
            const lulusan = allData.filter(s => cleanStr(s.status_akhir) === 'lulus' && s.perusahaan_tujuan);
            const grouped = lulusan.reduce((acc, curr) => {
                const comp = curr.perusahaan_tujuan || 'Belum Ditentukan';
                if (!acc[comp]) acc[comp] = []; acc[comp].push(curr);
                return acc;
            }, {});
            if (Object.keys(grouped).length === 0) setChartData([{ label: 'Belum Ada Data', value: 0, color: '#cbd5e1', items: [] }]);
            else setChartData(Object.keys(grouped).map(comp => ({ label: comp.length > 15 ? comp.substring(0, 15) + '...' : comp, value: grouped[comp].length, color: brandYellow, items: grouped[comp] })).sort((a, b) => b.value - a.value).slice(0, 6));
        } else {
            const stageData = allData.filter(s => s.tahap_sekarang === chartType && isProses(s));
            const grouped = stageData.reduce((acc, curr) => {
                const m = getMonthName(curr.updated_at || curr.created_at);
                if (!acc[m]) acc[m] = []; acc[m].push(curr);
                return acc;
            }, {});
            if (Object.keys(grouped).length === 0) setChartData([{ label: 'Belum Ada Data', value: 0, color: '#cbd5e1', items: [] }]);
            else setChartData(Object.keys(grouped).map(k => ({ label: k, value: grouped[k].length, color: '#8b5cf6', items: grouped[k] })));
        }
    };

    const fetchMasterData = async () => {
        try {
            const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                let filteredData = data;
                if (activeTab === 'LULUS') filteredData = data.filter(s => cleanStr(s.status_akhir) === 'lulus');
                else if (activeTab === 'GAGAL') filteredData = data.filter(s => cleanStr(s.status_akhir) === 'gagal');
                else if (activeTab === 'REGULER') filteredData = data.filter(s => ['PENDIDIKAN REGULER', 'AVAILABLE'].includes(s.tahap_sekarang) && isProses(s));
                else if (activeTab === 'REKRUTMEN') filteredData = data.filter(s => ['PRA-MENSETSU', 'INTERVIEW', 'MATCHED'].includes(s.tahap_sekarang) && isProses(s));
                else if (activeTab === 'DOKUMEN') filteredData = data.filter(s => ['PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA'].includes(s.tahap_sekarang) && isProses(s));
                else if (activeTab === 'KEBERANGKATAN') filteredData = data.filter(s => ['PENDIDIKAN DIKLAT', 'SIAP BERANGKAT'].includes(s.tahap_sekarang) && isProses(s));
                else filteredData = data.filter(isProses);
                setStudents(filteredData);
            }
        } catch (err) { console.error(err); }
    };

    const fetchJobOrders = async () => {
        try {
            const { data, error } = await supabase.from('job_orders').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setJobOrders(data);
        } catch (err) { console.error("Gagal memuat Job Orders:", err); }
    };

    useEffect(() => {
        if (activeMenu === 'DASHBOARD') fetchDashboardData();
        if (['MASTER_CV', 'LAPORAN_LULUS', 'LAPORAN_GAGAL', 'LAPORAN_PERUSAHAAN'].includes(activeMenu)) fetchMasterData();
        if (activeMenu === 'JOB_ORDER') fetchJobOrders();
    }, [activeMenu, activeTab, activeChart]);

    const handleAddJobOrder = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('job_orders').insert([newJobOrder]);
            if (error) throw error;
            alert('Job Order berhasil ditambahkan!');
            setIsJobOrderModalOpen(false);
            setNewJobOrder({ job_id: '', perusahaan: '', bidang: '', kumiai: '', kuota: 0, terisi: 0, status: 'AKTIF', catatan: '' });
            fetchJobOrders();
        } catch (error) { alert(`Gagal menyimpan: ${error.message}`); }
    };

    const handleDeleteJobOrder = async (id, namaPerusahaan) => {
        if (!window.confirm(`Yakin ingin menghapus Job Order untuk ${namaPerusahaan}?`)) return;
        try {
            const { error } = await supabase.from('job_orders').delete().eq('id', id);
            if (error) throw error;
            alert('Job Order berhasil dihapus!');
            setActiveDropdown(null);
            fetchJobOrders();
        } catch (error) { alert(`Gagal menghapus: ${error.message}`); }
    };

    const handleSaveCV = async (e, finalDataDariModal) => {
        e.preventDefault();
        const payload = finalDataDariModal ? { ...finalDataDariModal } : { ...selectedCV };
        if (!payload || !payload.id) { alert("Error: ID Siswa tidak ditemukan!"); return; }
        const cleanArray = (arr) => {
            if (!arr) return [];
            if (Array.isArray(arr)) return arr;
            if (typeof arr === 'string') { try { return JSON.parse(arr); } catch { return []; } }
            return [];
        };
        const dataToSave = {
            ...payload,
            tinggi_badan: payload.tinggi_badan === "" ? null : payload.tinggi_badan, berat_badan: payload.berat_badan === "" ? null : payload.berat_badan,
            ukuran_sepatu: payload.ukuran_sepatu === "" ? null : payload.ukuran_sepatu, ukuran_pinggang: payload.ukuran_pinggang === "" ? null : payload.ukuran_pinggang,
            ukuran_kepala: payload.ukuran_kepala === "" ? null : payload.ukuran_kepala, mata_kanan: payload.mata_kanan === "" ? null : payload.mata_kanan, mata_kiri: payload.mata_kiri === "" ? null : payload.mata_kiri,
            pendidikan_history: cleanArray(payload.pendidikan_history), kerja_history: cleanArray(payload.kerja_history),
            keluarga_history: cleanArray(payload.keluarga_history), attachments: cleanArray(payload.attachments),
        };
        try {
            const { error } = await supabase.from('students').update(dataToSave).eq('id', dataToSave.id);
            if (error) throw error;
            alert("Data Master Rirekisho Berhasil Diperbarui!");
            setSelectedCV(null);
            fetchMasterData();
        } catch (err) { alert(`Gagal menyimpan data.\nDetail: ${err.message}`); }
    };

    const handleNextStage = async (id, currentStage) => {
        const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
        if (currentIndex >= 0 && currentIndex < PIPELINE_STAGES.length - 1) {
            const nextStage = PIPELINE_STAGES[currentIndex + 1];
            if (!window.confirm(`Pindahkan siswa ke tahap selanjutnya: ${nextStage}?`)) return;
            const updates = { tahap_sekarang: nextStage, updated_at: new Date() };
            try { await supabase.from('students').update(updates).eq('id', id); fetchMasterData(); setActiveDropdown(null); fetchDashboardData(); } catch (err) { alert("Gagal memperbarui status."); }
        } else {
            alert("Siswa sudah berada di tahap paling akhir."); setActiveDropdown(null);
        }
    };

    const toggleSubMenu = (menuName) => setOpenSubMenu(openSubMenu === menuName ? '' : menuName);
    const filteredStudents = students.filter(s => safeString(s.nama_lengkap).includes(searchTerm.toLowerCase()) || safeString(s.nama_jepang).includes(searchTerm.toLowerCase()) || safeString(s.perusahaan_tujuan).includes(searchTerm.toLowerCase()));
    const filteredJO = jobOrders.filter(jo => safeString(jo.perusahaan).includes(searchTerm.toLowerCase()) || safeString(jo.bidang).includes(searchTerm.toLowerCase()));
    const maxChartCount = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 1) : 1;

    const handleLogout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) { await supabase.from('employees').update({ is_online: false }).eq('id', user.id); }
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) { navigate('/login'); }
    };

    if (activeJobOrder) return <JobOrderDetail jobOrder={activeJobOrder} onBack={() => { setActiveJobOrder(null); fetchJobOrders(); }} />;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>

            <style>{`
                @keyframes pulse-blink { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.98); } 100% { opacity: 1; transform: scale(1); } }
                .status-blink { animation: pulse-blink 1.5s ease-in-out infinite; display: inline-block; }
                .chart-bar:hover { filter: brightness(0.9); }
            `}</style>

            {/* ── SIDEBAR UJC BRANDED ── */}
            <aside style={{ width: '280px', background: brandNavy, color: 'white', padding: '25px 15px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', overflowY: 'auto', zIndex: 100, boxShadow: '4px 0 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', padding: '10px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: brandYellow, color: brandNavy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, flexShrink: 0 }}>
                        {userProfile.inisial}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userProfile.nama}</div>
                        <div style={{ fontSize: '0.7rem', color: brandYellow, fontWeight: 800, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{userProfile.role}</div>
                        
                        {/* ── TOMBOL KHUSUS SUPER ADMIN ── */}
                        {userProfile.role === 'SUPER ADMIN' && (
                            <button 
                                onClick={() => navigate('/superadmin/dashboard')}
                                style={{ 
                                    marginTop: '10px', 
                                    background: '#ef4444', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '5px 10px', 
                                    borderRadius: '6px', 
                                    fontSize: '0.65rem', 
                                    fontWeight: 900, 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <ShieldCheck size={12} /> KEMBALI KE PORTAL
                            </button>
                        )}
                        
                    </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', marginLeft: '10px' }}>Menu Navigasi</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <button onClick={() => setActiveMenu('DASHBOARD')} style={menuS(activeMenu === 'DASHBOARD')}><LayoutDashboard size={18} /> Beranda</button>

                    {/* ── PINTASAN PANTAUAN ALUMNI ── */}
                    <button onClick={() => navigate('/alumni/dashboard')} style={menuS(false)}>
                        <Plane size={18} /> Pantauan Alumni
                    </button>

                    <div>
                        <button onClick={() => toggleSubMenu('TRANSAKSI')} style={menuDropdownBtn(openSubMenu === 'TRANSAKSI')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Briefcase size={18} /> Transaksi <small style={smallKanjiList}>取引</small></div>
                            <ChevronDown size={16} style={{ transform: openSubMenu === 'TRANSAKSI' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </button>
                        <div style={subMenuContainer(openSubMenu === 'TRANSAKSI')}>
                            <button onClick={() => setActiveMenu('JOB_ORDER')} style={subMenuS(activeMenu === 'JOB_ORDER')}><div style={subDot(activeMenu === 'JOB_ORDER')}></div> Job Order Kaisha</button>
                            <button onClick={() => navigate('/reguler/dashboard')} style={subMenuS(false)}><div style={subDot(false)}></div> Pendaftaran Baru</button>                        </div>
                    </div>

                    <div>
                        <button onClick={() => toggleSubMenu('LAPORAN')} style={menuDropdownBtn(openSubMenu === 'LAPORAN')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Archive size={18} /> Laporan <small style={smallKanjiList}>報告</small></div>
                            <ChevronDown size={16} style={{ transform: openSubMenu === 'LAPORAN' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </button>
                        <div style={subMenuContainer(openSubMenu === 'LAPORAN')}>
                            <button onClick={() => { setActiveMenu('LAPORAN_LULUS'); setActiveTab('LULUS'); }} style={subMenuS(activeMenu === 'LAPORAN_LULUS')}><div style={subDot(activeMenu === 'LAPORAN_LULUS')}></div> Daftar Peserta Lolos</button>
                            <button onClick={() => { setActiveMenu('LAPORAN_GAGAL'); setActiveTab('GAGAL'); }} style={subMenuS(activeMenu === 'LAPORAN_GAGAL')}><div style={subDot(activeMenu === 'LAPORAN_GAGAL')}></div> Laporan Gagal</button>
                            <button onClick={() => { setActiveMenu('LAPORAN_PERUSAHAAN'); setActiveTab('LULUS'); }} style={subMenuS(activeMenu === 'LAPORAN_PERUSAHAAN')}><div style={subDot(activeMenu === 'LAPORAN_PERUSAHAAN')}></div> Sebaran Penempatan</button>
                        </div>
                    </div>

                    <div>
                        <button onClick={() => toggleSubMenu('MASTER')} style={menuDropdownBtn(openSubMenu === 'MASTER')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Layers size={18} /> Master <small style={smallKanjiList}>マスター</small></div>
                            <ChevronDown size={16} style={{ transform: openSubMenu === 'MASTER' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </button>
                        <div style={subMenuContainer(openSubMenu === 'MASTER')}>
                            <button onClick={() => setActiveMenu('MASTER_MITRA')} style={subMenuS(activeMenu === 'MASTER_MITRA')}><div style={subDot(activeMenu === 'MASTER_MITRA')}></div> Mitra Lokal</button>
                            <button onClick={() => setActiveMenu('MASTER_KAISHA')} style={subMenuS(activeMenu === 'MASTER_KAISHA')}><div style={subDot(activeMenu === 'MASTER_KAISHA')}></div> Perusahaan (Kaisha)</button>
                            <button onClick={() => setActiveMenu('MASTER_KUMIAI')} style={subMenuS(activeMenu === 'MASTER_KUMIAI')}><div style={subDot(activeMenu === 'MASTER_KUMIAI')}></div> Asosiasi (Kumiai)</button>
                            <button onClick={() => { setActiveMenu('MASTER_CV'); setActiveTab('SEMUA'); }} style={subMenuS(activeMenu === 'MASTER_CV')}><div style={subDot(activeMenu === 'MASTER_CV')}></div> Siswa LPK</button>
                            <button onClick={() => setActiveMenu('MASTER_PENGGUNA')} style={subMenuS(activeMenu === 'MASTER_PENGGUNA')}><div style={subDot(activeMenu === 'MASTER_PENGGUNA')}></div> Pengguna Internal</button>
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

                {/* ── DASHBOARD ── */}
                {activeMenu === 'DASHBOARD' && (
                    <div className="fade-in">
                        <header style={{ marginBottom: '30px' }}><h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 10px 0' }}>Beranda Operasional (Real-Time)</h1><p style={{ color: '#64748b', margin: 0 }}>Pantau distribusi dan metrik data siswa dari seluruh Divisi.</p></header>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                            <CircleProgress percentage={Math.min(100, Math.round((stats.aktif / Math.max(1, stats.totalTerdaftar)) * 100))} color={brandNavy} title="Pendaftaran (Aktif)" value={stats.aktif} subtitle={`Dari total ${stats.totalTerdaftar} pendaftar`} />
                            <CircleProgress percentage={stats.persenLulus} color="#10b981" title="Kelulusan" value={stats.lulus} subtitle="Siswa berhasil ditempatkan" />
                            <CircleProgress percentage={Math.min(100, Math.round((stats.gagal / Math.max(1, stats.totalTerdaftar)) * 100))} color="#ef4444" title="Siswa Gagal" value={stats.gagal} subtitle="Siswa gagal/mengundurkan diri" />
                        </div>

                        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '30px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}><BarChart3 size={22} color={brandNavy} /> Analisis Grafik Interaktif</h3>
                                    <p style={{ margin: '5px 0 0 32px', fontSize: '0.8rem', color: '#94a3b8' }}>Klik diagram batang (bar) untuk melihat detail nama siswa.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                                    <button onClick={() => setActiveChart('MONTHLY_TREND')} style={tabS(activeChart === 'MONTHLY_TREND')}>Tren Bulanan</button>
                                    <button onClick={() => setActiveChart('ALL')} style={tabS(activeChart === 'ALL')}>Semua Tahap</button>
                                    <button onClick={() => setActiveChart('RESULT')} style={tabS(activeChart === 'RESULT')}>Lulus/Gagal</button>
                                    <button onClick={() => setActiveChart('COMPANY_SPREAD')} style={{ ...tabS(activeChart === 'COMPANY_SPREAD'), background: activeChart === 'COMPANY_SPREAD' ? '#ec4899' : 'transparent', color: activeChart === 'COMPANY_SPREAD' ? 'white' : '#64748b' }}>🌍 Sebaran Kaisha</button>
                                    <span style={{ borderLeft: '2px solid #cbd5e1', margin: '0 5px' }}></span>
                                    {PIPELINE_STAGES.slice(0, 5).map(stage => (
                                        <button key={stage} onClick={() => setActiveChart(stage)} style={tabS(activeChart === stage)}>{stage.substring(0, 10)}...</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '280px', paddingBottom: '20px', paddingX: '20px' }}>
                                {chartData.map((data, i) => {
                                    const heightPct = data.value === 0 ? 5 : (data.value / maxChartCount) * 100;
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: `calc(${100 - heightPct}% - 30px)`, background: '#1e293b', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, transition: 'top 0.4s ease' }}>{data.value}</div>
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', padding: '0 10%' }}>
                                                <div
                                                    className="chart-bar"
                                                    onClick={() => data.value > 0 && setChartDetailModal(data)}
                                                    style={{ width: '100%', background: data.color, height: `${heightPct}%`, borderRadius: '6px 6px 0 0', transition: 'all 0.4s ease', opacity: data.value === 0 ? 0.3 : 1, cursor: data.value > 0 ? 'pointer' : 'default' }}
                                                    title={data.value > 0 ? "Klik untuk lihat detail siswa" : ""}
                                                ></div>
                                            </div>
                                            <div style={{ position: 'absolute', bottom: '-25px', width: '100%', textAlign: 'center', fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>{data.label}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 25px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}><Activity size={22} color="#10b981" /> Pipeline Conveyor Terpusat</h3>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {pipelineData.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: `5px solid ${item.color}`, borderRadius: '10px', padding: '25px 10px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '5px' }}>{item.count}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{item.step}</div>
                                        </div>
                                        {index < pipelineData.length - 1 && <div style={{ padding: '0 10px', color: '#cbd5e1' }}><ChevronRight size={28} /></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MASTER MITRA, KAISHA, KUMIAI ── */}
                {activeMenu === 'MASTER_MITRA' && <MasterMitra />}
                {activeMenu === 'MASTER_KAISHA' && <MasterKaisha />}
                {activeMenu === 'MASTER_KUMIAI' && <MasterKumiai />}
                {activeMenu === 'MASTER_PENGGUNA' && <MasterPengguna />}

                {/* ── MANAJEMEN SISWA & LAPORAN ── */}
                {['MASTER_CV', 'LAPORAN_LULUS', 'LAPORAN_GAGAL', 'LAPORAN_PERUSAHAAN'].includes(activeMenu) && (
                    <div className="fade-in">
                        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '15px' }}>
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
                                                            {isProses(s) && <button onClick={() => handleNextStage(s.id, s.tahap_sekarang)} style={{ ...dropdownItemS, color: '#059669' }}><ArrowRight size={16} /> Lanjut Tahap</button>}
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
                                                    {isProses(s) && <button onClick={() => handleNextStage(s.id, s.tahap_sekarang)} style={{ ...dropdownItemS, color: '#059669' }}><ArrowRight size={16} /> Lanjut Tahap</button>}
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
                                <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0' }}>Job Order (Kaisha)</h1>
                                <p style={{ color: '#64748b', margin: 0 }}>Daftar permintaan tenaga kerja dari perusahaan Jepang.</p>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                                    <input type="text" placeholder="Cari Perusahaan..." onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '0.9rem' }} />
                                </div>
                                <button onClick={() => setIsJobOrderModalOpen(true)} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>{jo.job_id}</div>
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
                                                    <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Briefcase size={12} /> {jo.bidang}</div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === jo.id ? null : jo.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                                                    <MoreVertical size={20} />
                                                </button>

                                                {activeDropdown === jo.id && (
                                                    <div ref={dropdownRef} style={{ ...dropdownContainer, right: '15px', top: '40px' }}>
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
            </main>

            {/* ── MODAL DETAIL DIAGRAM (DRILL DOWN) ── */}
            {chartDetailModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '15px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '20px 25px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color={brandNavy} /> Data: {chartDetailModal.label}</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total: {chartDetailModal.value} Siswa Ditemukan</p>
                            </div>
                            <button onClick={() => setChartDetailModal(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '10px 25px 25px 25px', flex: 1 }}>
                            {chartDetailModal.items.map((s, idx) => (
                                <div key={idx} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{s.nama_lengkap}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{s.nik || 'NIK Kosong'} &nbsp;•&nbsp; {s.tahap_sekarang}</div>
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

            {/* MODAL EDIT CV */}
            <EditProfileModal selectedCV={selectedCV} setSelectedCV={setSelectedCV} handleSaveCV={handleSaveCV} />

            {/* MODAL TAMBAH JOB ORDER */}
            {isJobOrderModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleAddJobOrder} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>Tambah Job Order Baru</h2>
                            <button type="button" onClick={() => setIsJobOrderModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                            <div>
                                <label style={labelForm}>ID Job Order</label>
                                <input style={inputForm} required placeholder="Contoh: JO-2026-01" value={newJobOrder.job_id} onChange={(e) => setNewJobOrder({ ...newJobOrder, job_id: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelForm}>Nama Perusahaan</label>
                                <input style={inputForm} required placeholder="Contoh: AGRI FRONTIER FUKUDA" value={newJobOrder.perusahaan} onChange={(e) => setNewJobOrder({ ...newJobOrder, perusahaan: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelForm}>Bidang / Jenis Job</label>
                                <input style={inputForm} required placeholder="Contoh: PERTANIAN" value={newJobOrder.bidang} onChange={(e) => setNewJobOrder({ ...newJobOrder, bidang: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelForm}>Nama Kumiai</label>
                                <input style={inputForm} required placeholder="Nama pihak Kumiai" value={newJobOrder.kumiai} onChange={(e) => setNewJobOrder({ ...newJobOrder, kumiai: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelForm}>Kuota Dibutuhkan</label>
                                    <input style={inputForm} type="number" required min="1" value={newJobOrder.kuota} onChange={(e) => setNewJobOrder({ ...newJobOrder, kuota: parseInt(e.target.value) })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelForm}>Status</label>
                                    <select style={inputForm} value={newJobOrder.status} onChange={(e) => setNewJobOrder({ ...newJobOrder, status: e.target.value })}>
                                        <option value="AKTIF">AKTIF (Recruiting)</option>
                                        <option value="PENUH">PENUH (Full)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsJobOrderModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                            <button type="submit" style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Simpan Job Order</button>
                        </div>
                    </form>
                </div>
            )}
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

const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' };
const inputForm = { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };

const tabS = (active) => ({ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: active ? brandNavy : 'transparent', fontWeight: 700, color: active ? 'white' : '#64748b', fontSize: '0.8rem', transition: '0.2s' });
const viewBtnS = (active) => ({ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: active ? 'white' : 'transparent', color: active ? brandNavy : '#94a3b8', transition: '0.2s', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' });
const thP = { padding: '18px 25px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', fontWeight: 800 };
const tdP = { padding: '18px 25px', verticalAlign: 'middle' };
const dropdownContainer = { position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '180px', zIndex: 50, padding: '5px', textAlign: 'left' };
const dropdownItemS = { width: '100%', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', borderRadius: '6px', transition: 'background 0.2s' };

const tagS = (st) => {
    const s = cleanStr(st).toUpperCase();
    let bg = '#fef3c7', col = '#92400e';
    if (['LULUS', 'AKTIF', 'SELESAI'].includes(s)) { bg = '#dcfce7'; col = '#166534'; }
    else if (['GAGAL', 'PENUH', 'CANCEL'].includes(s)) { bg = '#fee2e2'; col = '#991b1b'; }
    else if (['RECRUITING', 'CETAK', 'PELATIHAN', 'WAWANCARA'].includes(s)) { bg = '#dbeafe'; col = brandNavy; }
    return { padding: '5px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900, background: bg, color: col };
};