import React from 'react';
import { Printer } from 'lucide-react';
import { brandNavy } from '../../Reguler/components/dashboardStyles';

export default function TabRekapNilai({ filteredStudents }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredStudents.map(s => {
                const raport = s.data_raport || {};
                const hasRaport = Object.keys(raport).length > 0;
                const totAkad = Number(raport.kotoba||0) + Number(raport.bunpo||0) + Number(raport.dokkai||0) + Number(raport.choukai||0) + Number(raport.kaiwa||0);
                const avgRaport = totAkad > 0 ? (totAkad / 5).toFixed(1) : 0;

                return (
                    <div key={s.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                            <div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.05rem' }}>{s.nama_lengkap}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>{s.tahap_sekarang}</div>
                            </div>
                            <div style={{ background: '#eff6ff', color: brandNavy, padding: '8px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '1.3rem', textAlign: 'center' }}>
                                {s.nilai_bahasa || 0}
                                <div style={{fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase'}}>Rata² Harian</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>RAPORT AKHIR (SERTIFIKAT)</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {hasRaport ? <span style={{color: '#10b981'}}>Rata²: {avgRaport}</span> : <span style={{color: '#ef4444'}}>Belum Diisi</span>}
                                    <button onClick={() => window.open(`/print-sertifikat/${s.id}`, '_blank')} style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', padding: 0 }} title="Cetak Sertifikat Lulus"><Printer size={16}/></button>
                                </div>
                            </div>
                            {hasRaport ? (
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', border: '1px solid #e2e8f0' }}>
                                    <div><span style={{color: '#64748b', fontWeight: 600}}>Sikap:</span> <b style={{color: '#1e293b', fontWeight: 800}}>{raport.perilaku}</b></div>
                                    <div><span style={{color: '#64748b', fontWeight: 600}}>Disiplin:</span> <b style={{color: '#1e293b', fontWeight: 800}}>{raport.kedisiplinan}</b></div>
                                    <div><span style={{color: '#64748b', fontWeight: 600}}>Teamwork:</span> <b style={{color: '#1e293b', fontWeight: 800}}>{raport.teamwork}</b></div>
                                    <div><span style={{color: '#64748b', fontWeight: 600}}>Fisik:</span> <b style={{color: '#1e293b', fontWeight: 800}}>{raport.fisik}</b></div>
                                </div>
                            ) : (
                                <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', color: '#991b1b', textAlign: 'center', fontWeight: 700 }}>
                                    Data Raport belum dimasukkan.
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', marginBottom: '10px' }}>HISTORY TES HARIAN</div>
                            <div style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '5px' }}>
                                {s.nilai_history.length === 0 ? <div style={{fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 600}}>Belum ada riwayat tes harian</div> : s.nilai_history.map((h, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <div><div style={{fontWeight: 800, color: '#334155'}}>{h.jenis_tes}</div><div style={{color: '#64748b', fontSize: '0.7rem', fontWeight: 600}}>{h.tanggal}</div></div>
                                        <div style={{fontWeight: 900, color: '#3b82f6', fontSize: '1rem'}}>{h.nilai}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })}
            {filteredStudents.length === 0 && <div style={{gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 700}}>Data tidak ditemukan.</div>}
        </div>
    );
}