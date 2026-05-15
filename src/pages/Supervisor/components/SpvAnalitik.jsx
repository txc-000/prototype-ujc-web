import React, { useState, useEffect } from 'react';
import { PieChart, Filter, ShieldCheck, Activity, X, Users, Building2 } from 'lucide-react';

// IMPORT STYLES SENTRAL 
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles'; 

const brandYellow = '#fdfb06';

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

export default function SpvAnalitik({ rawStudents, rawJobOrders, spvType, masterKaisha, masterKumiai }) {
    const [dashFilters, setDashFilters] = useState({ bulan: '', tahun: new Date().getFullYear().toString(), kaisha: '', kumiai: '' });
    
    const [rekStats, setRekStats] = useState({ joAktif: 0, totalKuota: 0, sisaKuota: 0, siswaAvailable: 0 });
    const [rekChart, setRekChart] = useState([]);
    const [dokStats, setDokStats] = useState({ totalMatched: 0, prosesCOE: 0, prosesVisa: 0, siapTerbang: 0 });
    const [dokChart, setDokChart] = useState([]);
    const [pipelineCounts, setPipelineCounts] = useState({ max: 1 });
    
    // ── STATE BARU UNTUK MODAL DETAIL PIPELINE ──
    const [detailModal, setDetailModal] = useState(null);

    useEffect(() => {
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

        const joOpen = fj.filter(j => j.status === 'OPEN' || j.status === 'AKTIF');
        const tKuota = joOpen.reduce((acc, curr) => acc + (curr.kuota || 0), 0);
        const tTerisi = joOpen.reduce((acc, curr) => acc + (curr.terisi || 0), 0);
        
        setRekStats({ joAktif: joOpen.length, totalKuota: tKuota, sisaKuota: tKuota - tTerisi, siswaAvailable: counts['AVAILABLE']?.count || 0 });
        setRekChart(joOpen.map(j => ({ label: j.perusahaan.length > 15 ? j.perusahaan.substring(0, 15) + '...' : j.perusahaan, value: (j.kuota || 0) - (j.terisi || 0), color: '#3b82f6' })).sort((a, b) => b.value - a.value).slice(0, 5));

        setDokStats({ totalMatched: (counts['MATCHED']?.count || 0) + (counts['PENGUMPULAN BERKAS']?.count || 0), prosesCOE: counts['APPLY COE']?.count || 0, prosesVisa: counts['APPLY VISA']?.count || 0, siapTerbang: counts['SIAP BERANGKAT']?.count || 0 });
        setDokChart([
            { label: 'Pemberkasan', value: counts['PENGUMPULAN BERKAS']?.count || 0, color: '#8b5cf6' },
            { label: 'Proses COE', value: counts['APPLY COE']?.count || 0, color: '#f59e0b' },
            { label: 'Proses VISA', value: counts['APPLY VISA']?.count || 0, color: '#ec4899' },
            { label: 'Siap Terbang', value: counts['SIAP BERANGKAT']?.count || 0, color: '#10b981' }
        ]);
    }, [rawStudents, rawJobOrders, dashFilters]);

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900 }}>Dashboard Analitik SPV {spvType}</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>Ringkasan performa dan metrik operasional terpadu.</p>
                </div>
                
                {/* FILTER GLOBAL */}
                <div style={{ display: 'flex', gap: '10px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div>
                        <div style={styles.lb}><Filter size={12} style={{display:'inline', marginBottom:'-2px'}}/> Bulan</div>
                        <select style={{...styles.inpSm, minWidth: '100px'}} value={dashFilters.bulan} onChange={(e) => setDashFilters({...dashFilters, bulan: e.target.value})}>
                            <option value="">Semua</option>
                            {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'].map((b,i) => <option key={i+1} value={i+1}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={styles.lb}>Tahun</div>
                        <select style={{...styles.inpSm, minWidth: '100px'}} value={dashFilters.tahun} onChange={(e) => setDashFilters({...dashFilters, tahun: e.target.value})}>
                            <option value="">Semua</option>
                            {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={styles.lb}>Kaisha</div>
                        <select style={{...styles.inpSm, minWidth: '150px'}} value={dashFilters.kaisha} onChange={(e) => setDashFilters({...dashFilters, kaisha: e.target.value})}>
                            <option value="">Semua Kaisha</option>
                            {masterKaisha.map((k,i) => <option key={i} value={k.nama_perusahaan}>{k.nama_perusahaan}</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={styles.lb}>Kumiai</div>
                        <select style={{...styles.inpSm, minWidth: '150px'}} value={dashFilters.kumiai} onChange={(e) => setDashFilters({...dashFilters, kumiai: e.target.value})}>
                            <option value="">Semua Kumiai</option>
                            {masterKumiai.map((k,i) => <option key={i} value={k.nama_kumiai}>{k.nama_kumiai}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            {/* KPI CARDS */}
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

            {/* GRAFIK & INFO */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {spvType === 'REKRUTMEN' ? (
                    <HorizontalBarChart data={rekChart} title="Top 5 Kaisha (Sisa Kuota)" subtitle="Prioritaskan penempatan siswa ke perusahaan berikut." />
                ) : (
                    <HorizontalBarChart data={dokChart} title="Distribusi Tahapan Dokumen" subtitle="Pantau penumpukan (bottleneck) siswa di setiap tahap legalitas." />
                )}
                <div style={{ background: brandNavy, padding: '30px', borderRadius: '15px', color: 'white', flex: '0 0 350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <ShieldCheck size={40} color={brandYellow} style={{ marginBottom: '20px' }} />
                    <h3 style={{ fontSize: '1.4rem', margin: '0 0 10px 0', fontWeight: 900 }}>Filter Terintegrasi</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.6' }}>Filter Bulan, Tahun, Kaisha, dan Kumiai di atas akan secara otomatis mengubah seluruh hitungan tabel pipeline dan statistik di halaman ini secara spesifik.</p>
                </div>
            </div>

            {/* PIPELINE TABEL */}
            <div style={styles.tableContainer}>
                <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} color={brandNavy} /> Master Pipeline Siswa (End-to-End)</h3>
                        <p style={{ margin: '5px 0 0 30px', fontSize: '0.85rem', color: '#64748b' }}>Klik pada baris tahapan untuk melihat daftar siswa secara detail.</p>
                    </div>
                </div>
                <table style={styles.tableS}>
                    <thead style={styles.theadS}>
                        <tr>
                            <th style={styles.thStyle}>Grup Divisi</th>
                            <th style={styles.thStyle}>Tahapan Proses (Pipeline)</th>
                            <th style={styles.thStyle}>Kepadatan Siswa</th>
                            <th style={{...styles.thStyle, textAlign: 'right'}}>Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        {FULL_PIPELINE.map((stage) => {
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
                                <tr 
                                    key={stage.id} 
                                    style={{ ...styles.trS, cursor: 'pointer', transition: 'background 0.2s' }} 
                                    onClick={() => setDetailModal({ title: stage.label, data: dataStage.students, color: bgCol })}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    title="Klik untuk melihat daftar siswa"
                                >
                                    <td style={{...styles.tdStyle, fontSize: '0.75rem', fontWeight: 800, color: bgCol}}>{stage.group}</td>
                                    <td style={{...styles.tdStyle, fontWeight: 800, color: '#475569'}}>{stage.label}</td>
                                    <td style={{...styles.tdStyle, width: '40%'}}>
                                        <div style={{ width: '100%', background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, background: bgCol, height: '100%', borderRadius: '5px', transition: 'width 1s ease-out' }}></div>
                                        </div>
                                    </td>
                                    <td style={{...styles.tdStyle, textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: '#1e293b'}}>{count}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── MODAL POPUP: DETAIL SISWA DI PIPELINE ── */}
            {detailModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, width: '650px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
                        <div style={{ background: detailModal.color, padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ color: 'white' }}>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Users size={24} /> Daftar Siswa
                                </h2>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                                    Tahap: <b>{detailModal.title}</b> ({detailModal.data.length} Orang)
                                </p>
                            </div>
                            <button type="button" onClick={() => setDetailModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={26} />
                            </button>
                        </div>
                        
                        <div style={{ padding: '20px 30px', overflowY: 'auto', background: '#f8fafc', flex: 1 }}>
                            {detailModal.data.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 700, border: '2px dashed #cbd5e1', borderRadius: '12px' }}>
                                    Kosong. Belum ada siswa di tahap ini.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {detailModal.data.map((s, i) => (
                                        <div key={s.id || i} style={{ background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <div>
                                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.05rem', marginBottom: '2px' }}>{i + 1}. {s.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>{s.nama_jepang || '(Nama Jepang belum diisi)'}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {s.perusahaan_tujuan ? (
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                                        <Building2 size={12} /> {s.perusahaan_tujuan}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Belum ada Kaisha</div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>{s.program || '-'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '15px 30px', background: 'white', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                            <button onClick={() => setDetailModal(null)} style={styles.cancelBtn}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// KHUSUS KPI
const kpiCard = { background: 'white', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const kpiLabel = { fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', marginBottom: '8px', letterSpacing: '1px' };
const kpiValue = (color) => ({ fontSize: '2.5rem', fontWeight: 900, color: color, lineHeight: '1' });
const kpiSub = { fontSize: '0.9rem', color: '#64748b', fontWeight: 700 };