import React from 'react';
import { UserCircle, Building2, FileSearch, ClipboardList, Loader2, ArrowRightCircle } from 'lucide-react';

// IMPORT STYLES
import { styles, brandNavy } from './dashboardStyles';

export default function PascaInterviewSection({ 
    students, 
    setReviewStudentModal, 
    setViewRaportStudent, 
    isLoading,
    updateStage // Helper sentral dari parent
}) {
    
    return (
        <div style={styles.tableContainer}>
            <table style={styles.tableS}>
                <thead style={styles.theadS}>
                    <tr>
                        <th style={styles.thStyle}>Identitas Siswa</th>
                        <th style={styles.thStyle}>Perusahaan Tujuan</th>
                        <th style={styles.thStyle}>Tahap Seleksi</th>
                        <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi / Update Alur</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="4" style={{textAlign:'center', padding:'40px'}}><Loader2 size={30} className="animate-spin" color={brandNavy} style={{margin:'0 auto'}}/></td></tr>
                    ) : students.length === 0 ? (
                        <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>Tidak ada data pasca wawancara.</td></tr>
                    ) : students.map((student) => (
                        <tr key={student.id} style={styles.trS}>
                            <td style={styles.tdStyle}>
                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{student.nama_lengkap}</div>
                                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>NIK: {student.nik} | {student.telepon || '-'}</div>
                                
                                {student.lpk_asal && student.lpk_asal.trim() !== '' ? (
                                    <div style={styles.badgeMitra}><Building2 size={12}/> Mitra: {student.lpk_asal}</div>
                                ) : ( 
                                    <div style={styles.badgeReguler}><UserCircle size={12}/> Reguler UJC</div> 
                                )}
                                
                                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                                    {setViewRaportStudent && (
                                        <button onClick={() => setViewRaportStudent(student)} style={styles.btnLink(brandNavy)}>
                                            <ClipboardList size={14}/> Detail Raport
                                        </button>
                                    )}
                                    {setReviewStudentModal && (
                                        <button onClick={() => setReviewStudentModal(student)} style={styles.btnLink('#059669')}>
                                            <FileSearch size={14}/> Review Profil
                                        </button>
                                    )}
                                </div>
                            </td>
                            
                            <td style={{...styles.tdStyle, fontWeight: 700, color: '#ec4899'}}>
                                {student.perusahaan_tujuan || '-'}
                            </td>
                            
                            <td style={styles.tdStyle}>
                                <div style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: '#eff6ff', color: '#2563eb', fontWeight: 800, display: 'inline-block' }}>
                                    {student.tahap_sekarang}
                                </div>
                            </td>
                            
                            <td style={styles.tdStyle}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {student.tahap_sekarang === 'MATCHED' && (
                                        <button 
                                            onClick={() => updateStage(student.id, student.nama_lengkap, 'MCU_LANJUTAN', `Siswa diarahkan untuk MCU Tahap 2`)} 
                                            style={{...styles.btnA('#f59e0b'), background: '#f59e0b', color: 'white'}}
                                        >
                                            Arahkan MCU 2
                                        </button>
                                    )}
                                    {student.tahap_sekarang === 'MCU_LANJUTAN' && (
                                        <button 
                                            onClick={() => updateStage(student.id, student.nama_lengkap, 'PEMBERKASAN', `Siswa dilempar ke Divisi Dokumen`)} 
                                            style={{...styles.btnA('#8b5cf6'), background: '#8b5cf6', color: 'white'}}
                                        >
                                            Ke Div. Dokumen <ArrowRightCircle size={16}/>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}