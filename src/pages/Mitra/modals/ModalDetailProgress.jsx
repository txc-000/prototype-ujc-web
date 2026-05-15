import React from 'react';
import { X, Stethoscope, Building2, PlaneTakeoff, Award } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalDetailProgress({ detailModal, onClose }) {
    if (!detailModal) return null;

    const raport = typeof detailModal.data_raport === 'string' ? JSON.parse(detailModal.data_raport || '{}') : (detailModal.data_raport || {});
    const hasRaport = Object.keys(raport).length > 0;

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '800px', maxWidth: '95vw', padding: 0}}>
                <div style={{ background: brandNavy, color: 'white', padding: '25px 30px', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Detail Evaluasi & Progress Kandidat</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#cbd5e1' }}>{detailModal.nama_lengkap} • {detailModal.program}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
                </div>

                <div style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        
                        {/* STATUS MCU */}
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ padding: '8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '8px' }}><Stethoscope size={20}/></div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>Medical Check-Up</h4>
                            </div>
                            {detailModal.medical_checkup_status ? (
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: detailModal.medical_checkup_status === 'FIT' ? '#10b981' : '#ef4444' }}>
                                    {detailModal.medical_checkup_status === 'FIT' ? '✅ FIT (Lulus)' : '❌ UNFIT (Gagal)'}
                                </div>
                            ) : (
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>⏳ Sedang Menunggu Hasil</div>
                            )}
                        </div>

                        {/* STATUS PENEMPATAN */}
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ padding: '8px', background: '#fce7f3', color: '#be185d', borderRadius: '8px' }}><Building2 size={20}/></div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>Penempatan (Job Order)</h4>
                            </div>
                            {detailModal.perusahaan_tujuan ? (
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#db2777' }}>🏢 {detailModal.perusahaan_tujuan}</div>
                                    {detailModal.tanggal_entri ? (
                                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#10b981', fontWeight: 800 }}>
                                            <PlaneTakeoff size={16}/> Jadwal Terbang: {new Date(detailModal.tanggal_entri).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Dokumen sedang diproses (Menunggu COE/Visa).</div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b' }}>Siswa belum di-matching dengan Kaisha (Perusahaan).</div>
                            )}
                        </div>
                    </div>

                    {/* NILAI AKADEMIK & RAPORT */}
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} color={brandNavy}/> Evaluasi Akademik (Diklat)</h4>
                    <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>Rata-rata Tes Bahasa:</span>
                            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: brandNavy }}>{detailModal.nilai_bahasa || 0}</span>
                        </div>

                        {!hasRaport ? (
                            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Raport akhir belum diterbitkan oleh Instruktur UJC.</div>
                        ) : (
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Rincian Aspek Bahasa</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '20px' }}>
                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Kotoba</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.kotoba || 0}</div></div>
                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Bunpo</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.bunpo || 0}</div></div>
                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Dokkai</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.dokkai || 0}</div></div>
                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Choukai</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.choukai || 0}</div></div>
                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Kaiwa</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.kaiwa || 0}</div></div>
                                </div>

                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Sikap & Karakter</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#b45309'}}>Perilaku</div><div style={{fontWeight:900, color: '#d97706'}}>{raport.perilaku || '-'}</div></div>
                                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#b45309'}}>Disiplin</div><div style={{fontWeight:900, color: '#d97706'}}>{raport.kedisiplinan || '-'}</div></div>
                                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#b45309'}}>Teamwork</div><div style={{fontWeight:900, color: '#d97706'}}>{raport.teamwork || '-'}</div></div>
                                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#b45309'}}>Fisik</div><div style={{fontWeight:900, color: '#d97706'}}>{raport.fisik || '-'}</div></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={onClose} style={{ padding: '12px 30px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Tutup Detail</button>
                    </div>
                </div>
            </div>
        </div>
    );
}