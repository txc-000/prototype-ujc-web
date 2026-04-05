import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

import { 
    TrendingUp, Users, Building2, Briefcase, 
    CheckCircle2, BarChart, Target, Activity, Clock, PieChart, LogOut
} from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function DashboardDirektur() {
    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState({
        totalSiswa: 0, siswaLulus: 0, konversiRate: 0, totalKaisha: 0, totalJobAktif: 0, totalKebutuhan: 0, totalTerpenuhi: 0
    });
    const [pipeline, setPipeline] = useState([]);
    const [topKaisha, setTopKaisha] = useState([]);
    const [employeeList, setEmployeeList] = useState([]);
    const [productivity, setProductivity] = useState([]);
    const [chartData, setChartData] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchHelicopterData();
    }, []);

    const fetchHelicopterData = async () => {
        setLoading(true);
        try {
            const { data: students } = await supabase.from('students').select('id, tahap_sekarang, status_akhir, perusahaan_tujuan, job_order_id, created_at, created_by');
            const { data: jobs } = await supabase.from('job_orders').select('id, kuota, status, perusahaan');
            const { data: employees } = await supabase.from('employees').select('id, id_karyawan, nama_lengkap, status, is_online, last_seen, master_role (nama_role)').order('is_online', { ascending: false }).order('last_seen', { ascending: false });
            
            // Ambil data log aktivitas (tidak masalah jika masih kosong/error)
            const { data: logs } = await supabase.from('activity_logs').select('user_id');
            
            if (students && jobs) {
                const total = students.length;
                const lulus = students.filter(s => s.status_akhir?.toLowerCase() === 'lulus').length;
                const rate = total > 0 ? Math.round((lulus / total) * 100) : 0;

                const jobsAktif = jobs.filter(j => j.status?.toLowerCase() !== 'selesai' && j.status?.toLowerCase() !== 'cancel');
                const kaishaUnik = new Set(jobs.map(j => j.perusahaan)).size;

                const totalDemand = jobsAktif.reduce((sum, j) => sum + (j.kuota || 0), 0);
                const totalSupply = students.filter(s => s.status_akhir?.toLowerCase() === 'lulus' && (s.job_order_id != null || s.perusahaan_tujuan != null)).length;

                setKpi({ totalSiswa: total, siswaLulus: lulus, konversiRate: rate, totalKaisha: kaishaUnik, totalJobAktif: jobsAktif.length, totalKebutuhan: totalDemand, totalTerpenuhi: totalSupply });

                setPipeline(['Pemberkasan', 'Keuangan', 'Pelatihan', 'Penempatan'].map(stage => ({
                    label: stage, count: students.filter(s => s.tahap_sekarang?.toLowerCase() === stage.toLowerCase() && s.status_akhir?.toLowerCase() === 'proses').length
                })));

                const gagalCount = students.filter(s => s.status_akhir?.toLowerCase() === 'gagal').length;
                const prosesCount = students.filter(s => s.status_akhir?.toLowerCase() === 'proses').length;
                
                setChartData([
                    { label: 'Proses Aktif', value: prosesCount, color: brandNavy },
                    { label: 'Berhasil (Lulus)', value: lulus, color: '#10b981' },
                    { label: 'Gagal / Mundur', value: gagalCount, color: '#ef4444' }
                ]);

                const kaishaCount = students.filter(s => s.status_akhir?.toLowerCase() === 'lulus' && s.perusahaan_tujuan).reduce((acc, curr) => { 
                    acc[curr.perusahaan_tujuan] = (acc[curr.perusahaan_tujuan] || 0) + 1; 
                    return acc; 
                }, {});
                setTopKaisha(Object.entries(kaishaCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 3));
            }

            if (employees) {
                setEmployeeList(employees);
                
                // 1. FILTER: Hapus Direktur, Admin, dan Super Admin dari daftar produktivitas
                const operationalStaff = employees.filter(emp => {
                    const role = emp.master_role?.nama_role?.toUpperCase() || '';
                    return !['DIREKTUR', 'ADMIN', 'SUPER ADMIN'].includes(role);
                });

                // 2. HITUNG AKTIVITAS
                let inputCounts = {};
                
                if (logs && logs.length > 0) {
                    // Gunakan data Activity Log yang sebenarnya (Semua divisi)
                    inputCounts = logs.reduce((acc, curr) => { 
                        if(curr.user_id) acc[curr.user_id] = (acc[curr.user_id] || 0) + 1; 
                        return acc; 
                    }, {});
                } else if (students) {
                    // Fallback: Jika tabel log masih kosong, gunakan pendaftaran sementara
                    inputCounts = students.reduce((acc, curr) => { 
                        if(curr.created_by) acc[curr.created_by] = (acc[curr.created_by] || 0) + 1; 
                        return acc; 
                    }, {});
                }
                
                const prodData = operationalStaff.map(emp => ({
                    nama: emp.nama_lengkap, 
                    role: emp.master_role?.nama_role || 'Tidak ada role', 
                    jumlahInput: inputCounts[emp.id] || 0
                })).sort((a, b) => b.jumlahInput - a.jumlahInput);
                
                setProductivity(prodData);
            }
        } catch (error) { 
            console.error("Gagal memuat data Executive Dashboard:", error); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleLogout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await supabase.from('employees').update({ is_online: false, last_seen: new Date() }).eq('id', user.id);
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error logout:', error);
            navigate('/login');
        }
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

    if (loading) return <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}><h2 style={{color: brandNavy}}>Menyusun Laporan Eksekutif...</h2></div>;

    const jobFulfillmentRate = kpi.totalKebutuhan > 0 ? Math.round((kpi.totalTerpenuhi / kpi.totalKebutuhan) * 100) : 0;
    const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 1) : 1;

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
            
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: brandNavy, margin: '0 0 5px 0', fontWeight: 900 }}>Executive Dashboard</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '1.1rem' }}>Helicopter View: Ringkasan Performa & Kinerja SDM LPK</p>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontWeight: 700, color: '#1e293b' }}>
                        📅 {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </div>
                    
                    <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fecaca'} onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}>
                        <LogOut size={18} /> Keluar Sistem
                    </button>
                </div>
            </header>

            {/* --- ROW 1: PRIMARY KPIs --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <KpiCard icon={<Users size={28} color="#3b82f6"/>} title="Total Pendaftar" value={kpi.totalSiswa} subtitle="Sepanjang waktu" borderTop="#3b82f6" />
                <KpiCard icon={<CheckCircle2 size={28} color="#10b981"/>} title="Berhasil Lulus / Terbang" value={kpi.siswaLulus} subtitle={`Tingkat Konversi: ${kpi.konversiRate}%`} borderTop="#10b981" />
                <KpiCard icon={<Building2 size={28} color="#f59e0b"/>} title="Mitra Kaisha Aktif" value={kpi.totalKaisha} subtitle="Perusahaan di Jepang" borderTop="#f59e0b" />
                <KpiCard icon={<Briefcase size={28} color="#8b5cf6"/>} title="Job Order Aktif" value={kpi.totalJobAktif} subtitle="Permintaan rekrutmen" borderTop="#8b5cf6" />
            </div>

            {/* --- ROW 2: DIAGRAM ANALISIS & PIPELINE FUNNEL --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '30px' }}>
                
                {/* DIAGRAM BAR: Distribusi Status Siswa */}
                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><PieChart size={20}/> Distribusi Status Siswa</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '30px' }}>Perbandingan akumulasi performa operasional saat ini.</p>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '220px', paddingBottom: '10px' }}>
                        {chartData.map((data, idx) => {
                            const heightPct = data.value === 0 ? 5 : (data.value / maxChartValue) * 100;
                            return (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative' }}>
                                    <div style={{ marginBottom: '10px', fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>{data.value}</div>
                                    <div style={{ width: '100%', background: data.color, height: `${heightPct}%`, borderRadius: '6px 6px 0 0', transition: 'height 1s ease', opacity: data.value === 0 ? 0.2 : 1 }}></div>
                                    <div style={{ position: 'absolute', bottom: '-25px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textAlign: 'center', width: '100%' }}>{data.label}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* DIAGRAM FUNNEL: Pipeline Operasional */}
                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><BarChart size={20}/> Makro Pipeline & Bottleneck Indikator</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Sebaran siswa aktif. Batang yang tinggi menunjukkan antrean/bottleneck pada tahap tersebut.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                        {pipeline.map((p, idx) => {
                            const maxPipe = Math.max(...pipeline.map(x => x.count), 1);
                            const widthPct = maxPipe === 0 ? 0 : (p.count / maxPipe) * 100;
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '100px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>{p.label}</div>
                                    <div style={{ flex: 1, height: '30px', background: '#f1f5f9', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ width: `${widthPct}%`, height: '100%', background: `linear-gradient(90deg, ${brandNavy}, #3b82f6)`, borderRadius: '15px', transition: 'width 1s ease-in-out', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px', color: 'white', fontWeight: 900, fontSize: '0.85rem' }}>
                                            {p.count > 0 ? p.count : ''}
                                        </div>
                                    </div>
                                    <div style={{ width: '30px', fontWeight: 900, color: '#1e293b' }}>{p.count}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* --- ROW 3: TARGET PEMENUHAN & TOP KAISHA --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><Target size={20}/> Target Pemenuhan Kuota Job Order (Real-Time)</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginTop: '30px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 700, color: '#1e293b' }}>
                                <span>Total Permintaan Kaisha (Demand): {kpi.totalKebutuhan} Orang</span>
                                <span style={{color: '#10b981'}}>Siswa Ditempatkan (Supply): {kpi.totalTerpenuhi} Orang</span>
                            </div>
                            <div style={{ width: '100%', height: '24px', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ width: `${jobFulfillmentRate}%`, height: '100%', background: jobFulfillmentRate >= 100 ? '#10b981' : brandNavy, transition: 'width 1s ease-in-out' }}></div>
                            </div>
                            <p style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b', marginTop: '8px', fontWeight: 700 }}>{jobFulfillmentRate}% Terpenuhi dari keseluruhan Job Order Aktif</p>
                        </div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><TrendingUp size={20}/> Top 3 Penempatan Kaisha</h3>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {topKaisha.length === 0 ? <p style={{ color: '#94a3b8', fontSize:'0.9rem' }}>Belum ada data penempatan lulusan ke Kaisha.</p> : 
                            topKaisha.map((kaisha, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ background: brandYellow, color: brandNavy, width: '24px', height: '24px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>{idx + 1}</div>
                                        {kaisha.name}
                                    </div>
                                    <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1.1rem' }}>{kaisha.count}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* --- ROW 4: KINERJA & KEHADIRAN KARYAWAN --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={cardStyle}>
                    <h3 style={cardHeaderStyle}><Activity size={20}/> Status Kehadiran Karyawan</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Memantau aktivitas login karyawan di sistem.</p>
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
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{emp.master_role?.nama_role} ({emp.id_karyawan})</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {emp.is_online ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}><div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 5px #10b981' }}></div> Online</span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}><Clock size={12}/> {timeAgo(emp.last_seen)}</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div style={cardStyle}>
                    {/* UPDATE: Judul diganti karena sekarang mengakomodir semua divisi */}
                    <h3 style={cardHeaderStyle}><TrendingUp size={20}/> Produktivitas Kinerja Operasional</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Peringkat karyawan operasional berdasarkan jumlah aktivitas pemrosesan data.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                        {productivity.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Belum ada data aktivitas.</p>
                        ) : productivity.map((prod, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: idx < 3 ? brandNavy : '#94a3b8', width: '20px' }}>#{idx + 1}</div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{prod.nama}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{prod.role}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: prod.jumlahInput === 0 ? '#ef4444' : '#10b981' }}>{prod.jumlahInput} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Aktivitas</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}

// --- Komponen Bantuan ---
const KpiCard = ({ icon, title, value, subtitle, borderTop }) => (
    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid ${borderTop}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '10px' }}>{icon}</div>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', margin: '5px 0' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{subtitle}</div>
    </div>
);

const cardStyle = { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const cardHeaderStyle = { margin: '0 0 10px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '1.2rem' };