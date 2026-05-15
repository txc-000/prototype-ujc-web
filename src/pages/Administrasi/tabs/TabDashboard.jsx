import React from 'react';
import { BookOpen, Filter, UserCircle, PlaneTakeoff, CalendarDays } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function TabDashboard({ 
    dashFilterProgram, setDashFilterProgram, uniqueDashProgram, 
    dashFilterPerusahaan, setDashFilterPerusahaan, uniqueDashPerusahaan, 
    filteredAlumniDash, formatTanggal, getPeriodeString 
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '1.1rem' }}>Peta Persebaran Alumni & Tagihan</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Data digenerate otomatis berdasarkan relasi Kumiai, Perusahaan, dan Tanggal Entri master.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div>
                        <label style={styles.lb}><BookOpen size={14}/> Program</label>
                        <select style={{...styles.inpSm, cursor: 'pointer'}} value={dashFilterProgram} onChange={(e) => setDashFilterProgram(e.target.value)}>
                            <option value="">Semua Program</option>
                            {uniqueDashProgram.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.lb}><Filter size={14}/> Perusahaan</label>
                        <select style={{...styles.inpSm, cursor: 'pointer'}} value={dashFilterPerusahaan} onChange={(e) => setDashFilterPerusahaan(e.target.value)}>
                            <option value="">Semua Perusahaan</option>
                            {uniqueDashPerusahaan.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            {Object.entries(
                filteredAlumniDash.reduce((acc, s) => {
                    const kumiai = s.kumiai_inferred || 'TANPA KUMIAI (TIDAK TERIDENTIFIKASI)';
                    const kaisha = s.perusahaan_tujuan || 'TANPA PERUSAHAAN';
                    if (!acc[kumiai]) acc[kumiai] = {};
                    if (!acc[kumiai][kaisha]) acc[kumiai][kaisha] = [];
                    acc[kumiai][kaisha].push(s);
                    return acc;
                }, {})
            ).sort(([a], [b]) => a.localeCompare(b)).map(([kumiaiName, kaishas]) => (
                <div key={kumiaiName} style={{ background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '15px 20px', background: brandNavy, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🇯🇵 {kumiaiName}</div>
                        <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>{Object.keys(kaishas).length} Perusahaan</div>
                    </div>
                    <div style={{ padding: '15px' }}>
                        {Object.entries(kaishas).sort(([a], [b]) => a.localeCompare(b)).map(([kaishaName, siswas]) => (
                            <div key={kaishaName} style={{ marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ padding: '12px 15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>🏢 {kaishaName}</span>
                                    <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>{siswas.length} Siswa Aktif</span>
                                </div>
                                <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', background: 'white' }}>
                                    {siswas.sort((a,b) => a.nama_lengkap.localeCompare(b.nama_lengkap)).map(s => (
                                        <div key={s.id} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <UserCircle size={28} color="#94a3b8"/>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase' }}>{s.nama_lengkap}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>Status: AKTIF</div>
                                                </div>
                                                <div style={{ marginLeft: 'auto' }}>
                                                    <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontWeight: 800 }}>{s.program || 'Reguler'}</span>
                                                </div>
                                            </div>
                                            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <PlaneTakeoff size={12}/> <b>Tgl Entri:</b> {formatTanggal(s.tanggal_entri)}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <CalendarDays size={12}/> <b>Periode:</b> {getPeriodeString(s.tanggal_entri)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}