import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

// IMPOR FUNGSI EKSPOR EXCEL
import { exportToExcel } from '../../utils/excelExport';

import { Activity, LogOut, Calendar, FileText, Plane } from 'lucide-react';
import { brandNavy } from '../Reguler/components/dashboardStyles';

// IMPOR KOMPONEN ANAK
import DirekturKpiCards from './components/DirekturKpiCards';
import DirekturCharts from './components/DirekturCharts';
import DirekturTargets from './components/DirekturTargets';
import DirekturEmployees from './components/DirekturEmployees';

// IMPOR MODAL
import ModalDetailSiswa from './modals/ModalDetailSiswa';
import ModalDetailKumiai from './modals/ModalDetailKumiai';
import ModalPesanDirektur from './modals/ModalPesanDirektur';
import ModalAktivitasKaryawan from './modals/ModalAktivitasKaryawan';

const cleanStr = (str) => str ? str.toString().trim().toLowerCase() : '';
const isProses = (s) => cleanStr(s.status_akhir) === 'proses' || !s.status_akhir;

export default function DashboardDirektur() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // ── DATA MENTAH DARI DATABASE ──
    const [rawStudents, setRawStudents] = useState([]);
    const [rawJobs, setRawJobs] = useState([]);
    const [rawEmployees, setRawEmployees] = useState([]);

    // ── STATE FILTER ──
    const currentYear = new Date().getFullYear().toString();
    const [filterMonth, setFilterMonth] = useState('ALL'); 
    const [filterYear, setFilterYear] = useState(currentYear); 

    // ── DATA HASIL FILTER ──
    const [kpi, setKpi] = useState({ totalSiswa: 0, siswaLulus: 0, konversiRate: 0, totalKaisha: 0, totalJobAktif: 0, totalKebutuhan: 0, totalTerpenuhi: 0 });
    const [pipeline, setPipeline] = useState([]);
    const [topKaisha, setTopKaisha] = useState([]);
    const [topKumiai, setTopKumiai] = useState([]); 
    const [employeeList, setEmployeeList] = useState([]);
    const [productivity, setProductivity] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);

    // ── STATE MODAL ──
    const [detailModal, setDetailModal] = useState(null); 
    const [kumiaiDetailModal, setKumiaiDetailModal] = useState(null); 
    const [msgModal, setMsgModal] = useState(null); 
    const [msgText, setMsgText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // State Pelacakan Aktivitas
    const [activityModal, setActivityModal] = useState(null);
    const [employeeActivities, setEmployeeActivities] = useState([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const { data: students } = await supabase.from('students').select('id, nik, nama_lengkap, tahap_sekarang, status_akhir, perusahaan_tujuan, job_order_id, created_at, created_by').order('nama_lengkap', { ascending: true });
                const { data: jobs } = await supabase.from('job_orders').select('id, kuota, status, perusahaan, kumiai, bidang, created_at');
                const { data: employees } = await supabase.from('employees').select('id, id_karyawan, nama_lengkap, status, is_online, last_seen, poin_pendaftaran, master_role (nama_role)').order('is_online', { ascending: false }).order('last_seen', { ascending: false });
                
                if (students) setRawStudents(students);
                if (jobs) setRawJobs(jobs);
                if (employees) setRawEmployees(employees);
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        if (rawStudents.length === 0 && rawJobs.length === 0) return;

        const filterDataByTime = (dataArray) => {
            return dataArray.filter(item => {
                if (filterMonth === 'ALL' && filterYear === 'ALL') return true;
                const d = new Date(item.created_at);
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                const y = d.getFullYear().toString();
                if (filterYear !== 'ALL' && filterYear !== y) return false;
                if (filterMonth !== 'ALL' && filterMonth !== m) return false;
                return true;
            });
        };

        const resultStudents = filterDataByTime(rawStudents);
        setFilteredStudents(resultStudents); 
        const filteredJobs = filterDataByTime(rawJobs);

        const total = resultStudents.length;
        const lulus = resultStudents.filter(s => cleanStr(s.status_akhir) === 'lulus').length;
        const rate = total > 0 ? Math.round((lulus / total) * 100) : 0;

        const jobsAktif = filteredJobs.filter(j => cleanStr(j.status) !== 'selesai' && cleanStr(j.status) !== 'cancel');
        const kaishaUnik = new Set(filteredJobs.map(j => j.perusahaan)).size;

        const totalDemand = jobsAktif.reduce((sum, j) => sum + (j.kuota || 0), 0);
        const totalSupply = resultStudents.filter(s => cleanStr(s.status_akhir) === 'lulus' && (s.job_order_id != null || s.perusahaan_tujuan != null)).length;

        setKpi({ totalSiswa: total, siswaLulus: lulus, konversiRate: rate, totalKaisha: kaishaUnik, totalJobAktif: jobsAktif.length, totalKebutuhan: totalDemand, totalTerpenuhi: totalSupply });

        const filterByGroup = (stages) => resultStudents.filter(s => stages.includes(s.tahap_sekarang) && isProses(s));
        setPipeline([
            { label: 'Pendidikan Reguler', items: filterByGroup(['PENDIDIKAN REGULER', 'AVAILABLE']) },
            { label: 'Seleksi Interview', items: filterByGroup(['PRA-MENSETSU', 'INTERVIEW', 'MATCHED']) },
            { label: 'Pengurusan Dokumen', items: filterByGroup(['PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA']) },
            { label: 'Diklat & Terbang', items: filterByGroup(['PENDIDIKAN DIKLAT', 'SIAP BERANGKAT']) }
        ]);

        const gagalItems = resultStudents.filter(s => cleanStr(s.status_akhir) === 'gagal');
        const prosesItems = resultStudents.filter(isProses);
        const lulusItems = resultStudents.filter(s => cleanStr(s.status_akhir) === 'lulus');
        
        setChartData([
            { label: 'Proses Aktif', value: prosesItems.length, color: brandNavy, items: prosesItems },
            { label: 'Berhasil (Lulus)', value: lulusItems.length, color: '#10b981', items: lulusItems },
            { label: 'Gagal / Mundur', value: gagalItems.length, color: '#ef4444', items: gagalItems }
        ]);

        const kaishaCount = lulusItems.filter(s => s.perusahaan_tujuan).reduce((acc, curr) => { 
            acc[curr.perusahaan_tujuan] = (acc[curr.perusahaan_tujuan] || 0) + 1; return acc; 
        }, {});
        setTopKaisha(Object.entries(kaishaCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 4));

        const kumiaiGroup = filteredJobs.reduce((acc, curr) => {
            const kName = curr.kumiai || 'Kumiai Belum Diisi';
            if (!acc[kName]) acc[kName] = { name: kName, count: 0, totalKuota: 0, jobs: [] };
            acc[kName].count += 1;
            acc[kName].totalKuota += (curr.kuota || 0);
            acc[kName].jobs.push(curr);
            return acc;
        }, {});
        setTopKumiai(Object.values(kumiaiGroup).sort((a, b) => b.count - a.count).slice(0, 4));

        if (rawEmployees) {
            setEmployeeList(rawEmployees);
            const operationalStaff = rawEmployees.filter(emp => {
                const role = emp.master_role?.nama_role?.toUpperCase() || '';
                return !['DIREKTUR', 'ADMIN', 'SUPER ADMIN'].includes(role);
            });
            setProductivity(operationalStaff.map(emp => ({
                id: emp.id, nama: emp.nama_lengkap, role: emp.master_role?.nama_role || 'Tidak ada role', jumlahInput: emp.poin_pendaftaran || 0
            })).sort((a, b) => b.jumlahInput - a.jumlahInput));
        }

    }, [filterMonth, filterYear, rawStudents, rawJobs, rawEmployees]);

    const fetchUserActivities = async (userId, userName, roleName) => {
        setIsLoadingActivities(true);
        setActivityModal({ id: userId, nama_lengkap: userName, role: roleName });
        try {
            const { data, error } = await supabase.from('activity_logs').select('keterangan, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(30); 
            if (error) throw error;
            setEmployeeActivities(data || []);
        } catch (err) { alert('Gagal mengambil data aktivitas.'); } finally { setIsLoadingActivities(false); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: dir } = await supabase.from('employees').select('nama_lengkap').eq('id', user.id).single();
            const payload = { user_id: msgModal.id, sender_name: dir?.nama_lengkap || 'Direktur', message: msgText };
            await supabase.from('notifications').insert([payload]);
            alert(`Instruksi berhasil dikirim ke ${msgModal.nama_lengkap}.`);
            setMsgModal(null); setMsgText('');
        } catch (err) { alert('Gagal mengirim pesan: ' + err.message); } finally { setIsSending(false); }
    };

    const handleLogout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await supabase.from('employees').update({ is_online: false, last_seen: new Date() }).eq('id', user.id);
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) { navigate('/login'); }
    };

    const timeAgo = (dateString) => {
        if (!dateString) return 'Belum pernah login';
        const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
        if (seconds < 60) return "Baru saja";
        const intervals = { tahun: 31536000, bulan: 2592000, hari: 86400, jam: 3600, menit: 60 };
        for (let [name, secs] of Object.entries(intervals)) {
            let interval = seconds / secs;
            if (interval >= 1) return Math.floor(interval) + ` ${name} lalu`;
        }
    };

    const formatActivityDate = (isoString) => new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    if (loading) return <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}><h2 style={{color: brandNavy}}><Activity className="animate-spin" size={30} style={{marginRight: '15px', verticalAlign: 'middle'}}/> Menyusun Laporan Eksekutif...</h2></div>;

    const jobFulfillmentRate = kpi.totalKebutuhan > 0 ? Math.round((kpi.totalTerpenuhi / kpi.totalKebutuhan) * 100) : 0;
    const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 1) : 1;
    const monthNames = { '01':'Januari', '02':'Februari', '03':'Maret', '04':'April', '05':'Mei', '06':'Juni', '07':'Juli', '08':'Agustus', '09':'September', '10':'Oktober', '11':'November', '12':'Desember' };
    const filterText = filterMonth === 'ALL' && filterYear === 'ALL' ? 'Sepanjang Waktu (All Time)' : `${filterMonth === 'ALL' ? 'Semua Bulan' : monthNames[filterMonth]} Tahun ${filterYear}`;

    return (
        <div className="fade-in" style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f1f5f9', minHeight: '100vh' }}>
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: brandNavy, margin: '0 0 5px 0', fontWeight: 900 }}>Executive Dashboard</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '1.1rem' }}>Helicopter View: Ringkasan Performa & Kinerja SDM LPK</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/alumni/dashboard')} style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plane size={18} /> Pantauan Alumni
                    </button>
                    <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LogOut size={18} /> Keluar
                    </button>
                </div>
            </header>

            {/* FILTER & EXPORT BAR */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', display: 'flex', gap: '40px', alignItems: 'center' }}>
                <div style={{ width: '350px', flexShrink: 0, borderRight: '1px solid #e2e8f0', paddingRight: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: 800, marginBottom: '15px' }}><Calendar size={20}/> Filter Laporan (Kohort)</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>Bulan</label>
                            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontWeight: 600 }}>
                                <option value="ALL">Semua Bulan</option>
                                {Object.entries(monthNames).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>Tahun</label>
                            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontWeight: 600 }}>
                                <option value="ALL">Semua Tahun</option>
                                {['2024', '2025', '2026', '2027', '2028', '2029'].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: 800, marginBottom: '10px' }}><FileText size={20}/> Ringkasan Kinerja Auto-Generated</div>
                    <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6', color: '#334155' }}>
                        Pada periode <strong>{filterText}</strong>, LPK UJC mencatat <strong>{kpi.totalSiswa}</strong> pendaftar baru dan mengakuisisi <strong>{kpi.totalJobAktif}</strong> Job Order Aktif. Dari total pendaftar tersebut, sebanyak <strong>{kpi.siswaLulus} siswa</strong> (Tingkat Konversi: <strong>{kpi.konversiRate}%</strong>) berhasil lulus dan memenuhi kebutuhan pasar sebanyak <strong>{kpi.totalKebutuhan} pekerja</strong>.
                    </p>
                </div>
                <div style={{ flexShrink: 0, borderLeft: '1px solid #e2e8f0', paddingLeft: '40px' }}>
                    <button onClick={() => exportToExcel(filteredStudents, `Laporan_Siswa_UJC_${filterMonth}_${filterYear}`, 'Data_Siswa')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '15px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} /> Unduh Laporan (.XLSX)
                    </button>
                </div>
            </div>

            {/* RENDER KOMPONEN ANAK */}
            <DirekturKpiCards kpi={kpi} filterText={filterText} />
            <DirekturCharts chartData={chartData} pipeline={pipeline} maxChartValue={maxChartValue} setDetailModal={setDetailModal} />
            <DirekturTargets kpi={kpi} jobFulfillmentRate={jobFulfillmentRate} topKaisha={topKaisha} topKumiai={topKumiai} setKumiaiDetailModal={setKumiaiDetailModal} />
            <DirekturEmployees employeeList={employeeList} productivity={productivity} timeAgo={timeAgo} fetchUserActivities={fetchUserActivities} setMsgModal={setMsgModal} setMsgText={setMsgText} />

            {/* RENDER MODAL */}
            <ModalDetailSiswa detailModal={detailModal} onClose={() => setDetailModal(null)} />
            <ModalDetailKumiai kumiaiDetailModal={kumiaiDetailModal} onClose={() => setKumiaiDetailModal(null)} />
            <ModalPesanDirektur msgModal={msgModal} msgText={msgText} setMsgText={setMsgText} handleSendMessage={handleSendMessage} isSending={isSending} onClose={() => setMsgModal(null)} />
            <ModalAktivitasKaryawan activityModal={activityModal} isLoadingActivities={isLoadingActivities} employeeActivities={employeeActivities} formatActivityDate={formatActivityDate} onClose={() => setActivityModal(null)} />

        </div>
    );
}