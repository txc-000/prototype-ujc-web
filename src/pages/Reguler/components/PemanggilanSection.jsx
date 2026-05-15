import React from 'react';
import { UserCircle, Building2, FileSearch, ClipboardList, Loader2 } from 'lucide-react';

// IMPORT STYLES
import { styles, brandNavy } from './dashboardStyles';

export default function PemanggilanSection({ 
    students, 
    setReviewStudentModal, 
    setViewRaportStudent, 
    isLoading 
}) {
    return (
        <div style={styles.tableContainer}>
            <table style={styles.tableS}>
                <thead style={styles.theadS}>
                    <tr>
                        <th style={styles.thStyle}>Identitas Siswa</th>
                        <th style={styles.thStyle}>Status Tahapan</th>
                        <th style={styles.thStyle}>Keterangan Panggilan</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="3" style={{textAlign:'center', padding:'40px'}}><Loader2 size={30} className="animate-spin" color={brandNavy} style={{margin:'0 auto'}}/></td></tr>
                    ) : students.length === 0 ? (
                        <tr><td colSpan="3" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>Tidak ada data siswa yang perlu dipanggil.</td></tr>
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
                            <td style={styles.tdStyle}>
                                <div style={styles.badgeS}>{student.tahap_sekarang}</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', marginTop:'4px' }}>{student.program}</div>
                            </td>
                            <td style={styles.tdStyle}>
                                <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: student.status_akhir === 'BELUM DAPAT JOB' ? '#fee2e2' : '#f1f5f9', color: student.status_akhir === 'BELUM DAPAT JOB' ? '#991b1b' : '#475569' }}>
                                    {student.status_akhir === 'BELUM DAPAT JOB' ? 'Tanggungan' : 'Available'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}