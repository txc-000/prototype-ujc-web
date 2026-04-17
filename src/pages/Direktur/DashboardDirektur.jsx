import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

// IMPOR FUNGSI EKSPOR EXCEL (Pastikan file ini sudah dibuat)
import { exportToExcel } from '../../utils/excelExport';

import { 
    TrendingUp, Users, Building2, Briefcase, 
    CheckCircle2, BarChart, Target, Activity, Clock, PieChart, LogOut, X, MessageSquare, Send, Calendar, FileText, Bookmark, List, Plane
} from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

const cleanStr = (str) => str ? str.toString().trim().toLowerCase() : '';
const isProses = (s) => cleanStr(s.status_akhir) === 'proses' || !s.status_akhir;

export default function DashboardDirektur() {
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
    const [filteredStudents, setFilteredStudents] = useState([]); // Menyimpan data spesifik bulan ini untuk diekspor

    // ── STATE MODAL DRILL-DOWN, PESAN & PELACAKAN AKTIVITAS ──
    const [detailModal, setDetailModal] = useState(null); 
    const [kumiaiDetailModal, setKumiaiDetailModal] = useState(null); 
    const [msgModal, setMsgModal] = useState(null); 
    const [msgText, setMsgText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // State Pelacakan Aktivitas
    const [activityModal, setActivityModal] = useState(null);
    const [employeeActivities, setEmployeeActivities] = useState([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);

    const navigate = useNavigate();

    // 1. FETCH SEMUA DATA SAAT PERTAMA KALI RENDER
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
            } catch (error) { 
                console.error("Gagal memuat data Mentah:", error); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchAllData();
    }, []);

    // 2. PROSES FILTER SETIAP KALI FILTER / DATA BERUBAH
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
        setFilteredStudents(resultStudents); // Simpan untuk fungsi Ekspor Excel
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
            acc[curr.perusahaan_tujuan] = (acc[curr.perusahaan_tujuan] || 0) + 1; 
            return acc; 
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
        
        const sortedKumiai = Object.values(kumiaiGroup).sort((a, b) => b.count - a.count).slice(0, 4);
        setTopKumiai(sortedKumiai);

        if (rawEmployees) {
            setEmployeeList(rawEmployees);
            const operationalStaff = rawEmployees.filter(emp => {
                const role = emp.master_role?.nama_role?.toUpperCase() || '';
                return !['DIREKTUR', 'ADMIN', 'SUPER ADMIN'].includes(role);
            });
            const prodData = operationalStaff.map(emp => ({
                id: emp.id, nama: emp.nama_lengkap, role: emp.master_role?.nama_role || 'Tidak ada role', jumlahInput: emp.poin_pendaftaran || 0
            })).sort((a, b) => b.jumlahInput - a.jumlahInput);
            
            setProductivity(prodData);
        }

    }, [filterMonth, filterYear, rawStudents, rawJobs, rawEmployees]);

    // ── FUNGSI FETCH AKTIVITAS KARYAWAN (TRACKING) ──
    const fetchUserActivities = async (userId, userName, roleName) => {
        setIsLoadingActivities(true);
        setActivityModal({ id: userId, nama_lengkap: userName, role: roleName });
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('keterangan, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(30); 

            if (error) throw error;
            setEmployeeActivities(data || []);
        } catch (err) {
            alert('Gagal mengambil data aktivitas.');
            console.error(err);
        } finally {
            setIsLoadingActivities(false);
        }
    };

    // ── HANDLER LAINNYA ──
    const handleSendMessage = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: dir } = await supabase.from('employees').select('nama_lengkap').eq('id', user.id).single();
            
            const payload = { user_id: msgModal.id, sender_name: dir?.nama_lengkap || 'Direktur', message: msgText };
            const { error } = await supabase.from('notifications').insert([payload]);
            if (error) throw error;

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

    const formatActivityDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}><h2 style={{color: brandNavy}}><Activity className="animate-spin" size={30} style={{marginRight: '15px', verticalAlign: 'middle'}}/> Menyusun Laporan Eksekutif...</h2></div>;

    const jobFulfillmentRate = kpi.totalKebutuhan > 0 ? Math.round((kpi.totalTerpenuhi / kpi.totalKebutuhan) * 100) : 0;
    const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 1) : 1;

    const monthNames = { '01':'Januari', '02':'Februari', '03':'Maret', '04':'April', '05':'Mei', '06':'Juni', '07':'Juli', '08':'Agustus', '09':'September', '10':'Oktober', '11':'November', '12':'Desember' };
    const filterText = filterMonth === 'ALL' && filterYear === 'ALL' ? 'Sepanjang Waktu (All Time)' : `${filterMonth === 'ALL' ? 'Semua Bulan' : monthNames[filterMonth]} Tahun ${filterYear}`;

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
            <style>{`.hover-scale { transition: transform 0.2s ease, filter 0.2s ease; cursor: pointer; } .hover-scale:hover { transform: scale(1.02); filter: brightness(0.9); }`}</style>

            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: brandNavy, margin: '0 0 5px 0', fontWeight: 900 }}>Executive Dashboard</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '1.1rem' }}>Helicopter View: Ringkasan Performa & Kinerja SDM LPK</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button 
                        onClick={() => navigate('/alumni/dashboard')} 
                        style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                    >
                        <Plane size={18} /> Pantauan Alumni
                    </button>
                    <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <LogOut size={18} /> Keluar
                    </button>
                </div>
            </header>

            {/* ── FILTER, REKAP LAPORAN & TOMBOL EKSPOR ── */}
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
                                {['2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: 800, marginBottom: '10px' }}><FileText size={20}/> Ringkasan Kinerja Auto-Generated</div>
                    <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6', color: '#334155' }}>
                        Pada periode <strong>{filterText}</strong>, LPK UJC mencatat <strong>{kpi.totalSiswa}</strong> pendaftar baru dan mengakuisisi <strong>{kpi.totalJobAktif}</strong> Job Order Aktif dari perusahaan Jepang.
                        Dari total pendaftar tersebut, sebanyak <strong>{kpi.siswaLulus} siswa</strong> (Tingkat Konversi: <strong>{kpi.konversiRate}%</strong>) telah berhasil lulus dan diproses penempatannya untuk memenuhi total kebutuhan pasar sebanyak <strong>{kpi.totalKebutuhan} pekerja</strong>.
                    </p>
                </div>
                
                {/* ── TOMBOL EKSPOR EXCEL ── */}
                <div style={{ flexShrink: 0, borderLeft: '1px solid #e2e8f0', paddingLeft: '40px', display: 'flex', alignItems: 'center' }}>
                    <button 
                        onClick={() => exportToExcel(filteredStudents, `Laporan_Siswa_UJC_${filterMonth}_${filterYear}`, 'Data_Siswa')}
                        style={{ 
                            background: '#10b981', 
                            color: 'white', 
                            border: 'none', 
                            padding: '15px 25px', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontWeight: 800, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(16, 185, 129, 0.5)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.4)';
                        }}
                    >
                        <FileText size={20} /> Unduh Format .XLSX
                    </button>
                </div>
            </div>

            {/* --- ROW 1: PRIMARY KPIs --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <KpiCard icon={<Users size={28} color="#3b82f6"/>} title="Total Pendaftar" value={kpi.totalSiswa} subtitle={`Periode: ${filterText}`} borderTop="#3b82f6" />
                <KpiCard icon={<CheckCircle2 size={28} color="#10b981"/>} title="Berhasil Lulus" value={kpi.siswaLulus} subtitle={`Tingkat Konversi: ${kpi.konversiRate}%`} borderTop="#10b981" />
                <KpiCard icon={<Building2 size={28} color="#f59e0b"/>} title="Mitra Kaisha (Job)" value={kpi.totalKaisha} subtitle="Kaisha Unik" borderTop="#f59e0b" />
                <KpiCard icon={<Briefcase size={28} color="#8b5cf6"/>} title="Job Order Aktif" value={kpi.totalJobAktif} subtitle="Permintaan rekrutmen" borderTop="#8b5cf6" />
            </div>

            {/* --- ROW 2: DIAGRAM ANALISIS & PIPELINE FUNNEL --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '30px' }}>
                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><PieChart size={20}/> Distribusi Status Siswa</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '30px' }}>Klik pada diagram batang untuk melihat detail siswa.</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '220px', paddingBottom: '10px' }}>
                        {chartData.map((data, idx) => {
                            const heightPct = data.value === 0 ? 5 : (data.value / maxChartValue) * 100;
                            return (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative' }}>
                                    <div style={{ marginBottom: '10px', fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>{data.value}</div>
                                    <div className="hover-scale" onClick={() => data.value > 0 && setDetailModal(data)} style={{ width: '100%', background: data.color, height: `${heightPct}%`, borderRadius: '6px 6px 0 0', opacity: data.value === 0 ? 0.2 : 1 }}></div>
                                    <div style={{ position: 'absolute', bottom: '-25px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textAlign: 'center', width: '100%' }}>{data.label}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><BarChart size={20}/> Makro Pipeline & Bottleneck Indikator</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Sebaran siswa aktif di tiap Divisi. Klik pada baris untuk melihat detail.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                        {pipeline.map((p, idx) => {
                            const pCount = p.items.length;
                            const maxPipe = Math.max(...pipeline.map(x => x.items.length), 1);
                            const widthPct = maxPipe === 0 ? 0 : (pCount / maxPipe) * 100;
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '140px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>{p.label}</div>
                                    <div style={{ flex: 1, height: '30px', background: '#f1f5f9', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                                        <div className="hover-scale" onClick={() => pCount > 0 && setDetailModal({ label: p.label, items: p.items })} style={{ width: `${widthPct}%`, height: '100%', background: `linear-gradient(90deg, ${brandNavy}, #3b82f6)`, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px', color: 'white', fontWeight: 900, fontSize: '0.85rem' }}>
                                            {pCount > 0 ? pCount : ''}
                                        </div>
                                    </div>
                                    <div style={{ width: '30px', fontWeight: 900, color: '#1e293b' }}>{pCount}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* --- ROW 3: TARGET, TOP KAISHA & KUMIAI REPEAT ORDER --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><Target size={20}/> Target Pemenuhan Kuota</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginTop: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                                <span>Permintaan (Demand): {kpi.totalKebutuhan}</span>
                                <span style={{color: '#10b981'}}>Siswa (Supply): {kpi.totalTerpenuhi}</span>
                            </div>
                            <div style={{ width: '100%', height: '24px', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ width: `${jobFulfillmentRate}%`, height: '100%', background: jobFulfillmentRate >= 100 ? '#10b981' : brandNavy, transition: 'width 1s ease-in-out' }}></div>
                            </div>
                            <p style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b', marginTop: '8px', fontWeight: 700 }}>{jobFulfillmentRate}% Terpenuhi</p>
                        </div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><Building2 size={20}/> Top Penempatan Kaisha</h3>
                    <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {topKaisha.length === 0 ? <p style={{ color: '#94a3b8', fontSize:'0.8rem' }}>Belum ada data.</p> : 
                            topKaisha.map((kaisha, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                        <div style={{ background: brandYellow, color: brandNavy, width: '20px', height: '20px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.7rem' }}>{idx + 1}</div>
                                        {kaisha.name.length > 15 ? kaisha.name.substring(0, 15) + '...' : kaisha.name}
                                    </div>
                                    <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1rem' }}>{kaisha.count}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                <div style={{...cardStyle, borderTop: `4px solid ${brandYellow}`}}>
                    <h3 style={cardHeaderStyle}><Bookmark size={20} color="#d97706"/> Loyalitas Kumiai</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>Klik nama Kumiai untuk rincian.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {topKumiai.length === 0 ? <p style={{ color: '#94a3b8', fontSize:'0.8rem' }}>Belum ada data Kumiai.</p> : 
                            topKumiai.map((kumiai, idx) => (
                                <div key={idx} onClick={() => setKumiaiDetailModal(kumiai)} className="hover-scale" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a', cursor: 'pointer' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.85rem' }}>{kumiai.name.length > 15 ? kumiai.name.substring(0, 15) + '...' : kumiai.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>{kumiai.totalKuota} Total Kuota</div>
                                    </div>
                                    <div style={{ fontWeight: 900, color: '#d97706', fontSize: '1.1rem' }}>
                                        {kumiai.count} <span style={{fontSize: '0.65rem'}}>Order</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* --- ROW 4: KINERJA & KEHADIRAN KARYAWAN --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><Activity size={20}/> Status Kehadiran Karyawan (Real-Time)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                        {employeeList.map(emp => {
                            const isAktif = emp.status === 'Aktif' || !emp.status;
                            const statusColor = emp.is_online ? '#10b981' : '#cbd5e1';
                            
                            return (
                                <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: isAktif ? '#f8fafc' : '#f1f5f9', borderRadius: '8px', borderLeft: `4px solid ${isAktif ? statusColor : '#ef4444'}`, opacity: isAktif ? 1 : 0.6 }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {emp.nama_lengkap} 
                                            {!isAktif && <span style={{background: '#fee2e2', color: '#991b1b', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'}}>{emp.status}</span>}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{emp.master_role?.nama_role}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {emp.is_online ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}><div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 5px #10b981' }}></div> Online</span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}><Clock size={12}/> {timeAgo(emp.last_seen)}</span>
                                        )}
                                        <button onClick={() => fetchUserActivities(emp.id, emp.nama_lengkap, emp.master_role?.nama_role)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Lacak Aktivitas Pekerjaan"><List size={16}/></button>
                                        <button onClick={() => {setMsgModal({ id: emp.id, nama_lengkap: emp.nama_lengkap }); setMsgText('');}} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Kirim Instruksi"><MessageSquare size={16}/></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><TrendingUp size={20}/> Produktivitas Kinerja Operasional (All-Time)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                        {productivity.map((prod, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: idx < 3 ? brandNavy : '#94a3b8', width: '20px' }}>#{idx + 1}</div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{prod.nama}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{prod.role}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: prod.jumlahInput === 0 ? '#ef4444' : '#10b981', marginRight: '10px' }}>{prod.jumlahInput} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Poin</span></div>
                                    <button onClick={() => fetchUserActivities(prod.id, prod.nama, prod.role)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Lacak Aktivitas Pekerjaan"><List size={16}/></button>
                                    <button onClick={() => {setMsgModal({ id: prod.id, nama_lengkap: prod.nama }); setMsgText('');}} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Kirim Instruksi"><MessageSquare size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── MODAL DRILL-DOWN DATA SISWA ── */}
            {detailModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '15px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '20px 25px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color={brandNavy}/> Rincian Data: {detailModal.label}</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total: {detailModal.items.length} Siswa</p>
                            </div>
                            <button onClick={() => setDetailModal(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18}/></button>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '10px 25px 25px 25px', flex: 1 }}>
                            {detailModal.items.map((s, idx) => (
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

            {/* ── MODAL DRILL-DOWN KUMIAI (REPEAT ORDER) ── */}
            {kumiaiDetailModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '15px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '20px 25px', background: '#fffbeb', borderRadius: '15px 15px 0 0' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#92400e', display: 'flex', alignItems: 'center', gap: '10px' }}><Bookmark size={20} color="#d97706"/> Riwayat Job: {kumiaiDetailModal.name}</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>Total Repeat Order: {kumiaiDetailModal.count} | Akumulasi Kuota: {kumiaiDetailModal.totalKuota}</p>
                            </div>
                            <button onClick={() => setKumiaiDetailModal(null)} style={{ border: 'none', background: '#fde68a', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#92400e' }}><X size={18}/></button>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '15px 25px 25px 25px', flex: 1 }}>
                            {kumiaiDetailModal.jobs.map((job, idx) => (
                                <div key={idx} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '15px', background: '#f8fafc', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{job.perusahaan}</div>
                                        <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: cleanStr(job.status) === 'aktif' ? '#dcfce7' : '#f1f5f9', color: cleanStr(job.status) === 'aktif' ? '#166534' : '#64748b' }}>
                                            {job.status || 'N/A'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 600 }}>
                                        <span><Briefcase size={12} style={{marginRight: '4px'}}/> {job.bidang || 'Bidang Tidak Disebutkan'}</span>
                                        <span><Users size={12} style={{marginRight: '4px'}}/> Kuota: {job.kuota} Orang</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '10px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                                        Dibuat pada: {new Date(job.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL KIRIM INSTRUKSI KE KARYAWAN ── */}
            {msgModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleSendMessage} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20}/> Kirim Instruksi</h3>
                            <button type="button" onClick={() => setMsgModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20}/></button>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>Kepada:</label>
                            <div style={{ background: '#f1f5f9', padding: '10px 15px', borderRadius: '8px', fontWeight: 800, color: '#1e293b' }}>{msgModal.nama_lengkap}</div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>Isi Pesan / Teguran:</label>
                            <textarea required rows="4" value={msgText} onChange={(e) => setMsgText(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Ketik instruksi di sini..."></textarea>
                        </div>

                        <button type="submit" disabled={isSending} style={{ width: '100%', background: brandNavy, color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            {isSending ? 'Mengirim...' : <><Send size={18}/> Kirim Sekarang</>}
                        </button>
                    </form>
                </div>
            )}

            {/* ── MODAL TRACKING AKTIVITAS KARYAWAN ── */}
            {activityModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '15px', width: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '20px 25px', background: '#f8fafc', borderRadius: '15px 15px 0 0' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: brandNavy, display: 'flex', alignItems: 'center', gap: '10px' }}><List size={20}/> Log Aktivitas Karyawan</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{activityModal.nama_lengkap} ({activityModal.role})</p>
                            </div>
                            <button onClick={() => setActivityModal(null)} style={{ border: 'none', background: '#e2e8f0', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#475569' }}><X size={18}/></button>
                        </div>
                        
                        <div style={{ overflowY: 'auto', padding: '25px', flex: 1 }}>
                            {isLoadingActivities ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><Activity className="animate-spin" size={30} style={{margin: '0 auto 10px'}}/> Sedang menarik data log...</div>
                            ) : employeeActivities.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600, border: '2px dashed #cbd5e1', borderRadius: '12px' }}>Karyawan ini belum mencatat aktivitas apa pun di sistem.</div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    {/* Garis vertikal timeline */}
                                    <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {employeeActivities.map((act, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                                                {/* Titik Timeline */}
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: `3px solid ${brandNavy}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: '8px', height: '8px', background: brandNavy, borderRadius: '50%' }}></div>
                                                </div>
                                                {/* Konten Log */}
                                                <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '5px' }}>{formatActivityDate(act.created_at)}</div>
                                                    <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, lineHeight: '1.4' }}>{act.keterangan}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const KpiCard = ({ icon, title, value, subtitle, borderTop }) => (
    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid ${borderTop}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}><div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '10px' }}>{icon}</div></div>
        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', margin: '5px 0' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{subtitle}</div>
    </div>
);

const cardStyle = { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const cardHeaderStyle = { margin: '0 0 10px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '1.2rem' };