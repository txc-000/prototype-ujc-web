import React from 'react';
import { X, FileSearch } from 'lucide-react';

// STYLES DARI HELPER
import { styles, brandNavy } from './dashboardStyles';

export default function RegulerModals({
    reviewStudentModal, 
    setReviewStudentModal,
    viewRaportStudent,
    setViewRaportStudent
}) {

    // Helper aman untuk parsing JSON array
    const parseHistory = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        try { return JSON.parse(data); } catch { return []; }
    };

    // Jika tidak ada modal yang sedang aktif, jangan render apapun (menghemat memory)
    if (!reviewStudentModal && !viewRaportStudent) return null;

    return (
        <>
            {/* ── 1. MODAL REVIEW PROFIL KANDIDAT ── */}
            {reviewStudentModal && (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modalContent, width: '850px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <div style={{ background: brandNavy, padding: '25px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileSearch size={22}/> Review Profil Kandidat
                                </h3>
                                <p style={{ margin: '5px 0 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                    {reviewStudentModal.nama_lengkap} • {reviewStudentModal.program}
                                </p>
                            </div>
                            <button onClick={() => setReviewStudentModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24}/>
                            </button>
                        </div>
                        <div style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto', background: '#f8fafc' }}>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: brandNavy, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>IDENTITAS DASAR</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div><span style={styles.revLabel}>NIK:</span> <span style={styles.revVal}>{reviewStudentModal.nik}</span></div>
                                    <div><span style={styles.revLabel}>Tempat, Tgl Lahir:</span> <span style={styles.revVal}>{reviewStudentModal.tempat_lahir}, {new Date(reviewStudentModal.tanggal_lahir).toLocaleDateString('id-ID')}</span></div>
                                    <div><span style={styles.revLabel}>Telepon / Email:</span> <span style={styles.revVal}>{reviewStudentModal.telepon} / {reviewStudentModal.email || '-'}</span></div>
                                    <div><span style={styles.revLabel}>LPK Asal (Mitra):</span> <span style={{...styles.revVal, color: reviewStudentModal.lpk_asal ? '#3b82f6' : '#1e293b'}}>{reviewStudentModal.lpk_asal || 'Reguler UJC'}</span></div>
                                </div>
                            </div>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: brandNavy, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>RIWAYAT PENDIDIKAN</h4>
                                {parseHistory(reviewStudentModal.pendidikan_history).length === 0 ? <p style={styles.revEmpty}>Tidak ada riwayat pendidikan yang dicantumkan.</p> : (
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155' }}>
                                        {parseHistory(reviewStudentModal.pendidikan_history).map((edu, i) => (
                                            <li key={i} style={{ marginBottom: '8px' }}>
                                                <b>{edu.jenjang} - {edu.nama_sekolah}</b> ({edu.jurusan || '-'})<br/>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tahun: {edu.thn_awal} s/d {edu.thn_akhir}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 2. MODAL VIEW RAPORT (READ-ONLY) ── */}
            {viewRaportStudent && (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modalContent, width: '600px'}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>Detail Raport & Karakter</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{viewRaportStudent.nama_lengkap}</p>
                            </div>
                            <button onClick={() => setViewRaportStudent(null)} style={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        {Object.keys(viewRaportStudent.data_raport || {}).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#ef4444', fontWeight: 700, background: '#fef2f2', borderRadius: '8px' }}>
                                Divisi Pendidikan belum menginput raport akhir untuk siswa ini.
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 900, marginBottom: '10px' }}>NILAI AKADEMIK (Rata-rata: {viewRaportStudent.nilai_bahasa})</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div><div style={{fontSize:'0.7rem', color:'#64748b'}}>Kotoba</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1.1rem'}}>{viewRaportStudent.data_raport.kotoba || 0}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#64748b'}}>Bunpo</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1.1rem'}}>{viewRaportStudent.data_raport.bunpo || 0}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#64748b'}}>Dokkai</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1.1rem'}}>{viewRaportStudent.data_raport.dokkai || 0}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#64748b'}}>Choukai</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1.1rem'}}>{viewRaportStudent.data_raport.choukai || 0}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#64748b'}}>Kaiwa</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1.1rem'}}>{viewRaportStudent.data_raport.kaiwa || 0}</div></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 900, marginBottom: '10px' }}>KARAKTER & SIKAP (A - D)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#fffbeb', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div><div style={{fontSize:'0.7rem', color:'#b45309'}}>Perilaku</div><div style={{fontWeight:900, color: '#d97706'}}>{viewRaportStudent.data_raport.perilaku || '-'}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#b45309'}}>Disiplin</div><div style={{fontWeight:900, color: '#d97706'}}>{viewRaportStudent.data_raport.kedisiplinan || '-'}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#b45309'}}>Teamwork</div><div style={{fontWeight:900, color: '#d97706'}}>{viewRaportStudent.data_raport.teamwork || '-'}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#b45309'}}>Fisik</div><div style={{fontWeight:900, color: '#d97706'}}>{viewRaportStudent.data_raport.fisik || '-'}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#b45309'}}>Kecerdasan</div><div style={{fontWeight:900, color: '#d97706'}}>{viewRaportStudent.data_raport.kecerdasan || '-'}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#b45309'}}>Kerapihan</div><div style={{fontWeight:900, color: '#d97706'}}>{viewRaportStudent.data_raport.kerapihan || '-'}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#b45309'}}>Kepribadian</div><div style={{fontWeight:900, color: '#d97706'}}>{viewRaportStudent.data_raport.kepribadian || '-'}</div></div>
                                        <div><div style={{fontSize:'0.7rem', color:'#b45309'}}>Inisiatif</div><div style={{fontWeight:900, color: '#d97706'}}>{viewRaportStudent.data_raport.inisiatif || '-'}</div></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}