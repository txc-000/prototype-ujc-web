import React from 'react';
import { Loader2, Edit3, BookA, Printer } from 'lucide-react';
import { styles, brandNavy, actionBtn } from '../../Reguler/components/dashboardStyles';

export default function TabKelas({ isLoading, filteredStudents, openEvalModal, openRaportModal, handleLulusKelas }) {
    return (
        <div style={styles.tableContainer}>
            <table style={styles.tableS}>
                <thead style={styles.theadS}>
                    <tr>
                        <th style={styles.thStyle}>Siswa</th>
                        <th style={styles.thStyle}>Rata-Rata Tes Harian</th>
                        <th style={styles.thStyle}>Riwayat Tes Terakhir</th>
                        <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi Evaluasi</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? <tr><td colSpan="4" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" style={{margin:'0 auto'}} color={brandNavy} size={30}/></td></tr> : filteredStudents.map(s => {
                        const lastRecord = s.nilai_history.length > 0 ? s.nilai_history[s.nilai_history.length - 1] : null;
                        return (
                            <tr key={s.id} style={styles.trS}>
                                <td style={styles.tdStyle}>
                                    <div style={{fontWeight:900, color: '#1e293b'}}>{s.nama_lengkap}</div>
                                    <div style={{fontSize:'0.75rem', color:'#64748b', fontWeight: 600}}>{s.nik || '-'}</div>
                                    {s.perusahaan_tujuan && <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ec4899', marginTop: '4px' }}>📍 {s.perusahaan_tujuan}</div>}
                                </td>
                                <td style={styles.tdStyle}>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: brandNavy }}>{s.nilai_bahasa || 0}</span> <span style={{fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8'}}>/ 100</span>
                                </td>
                                <td style={styles.tdStyle}>
                                    {lastRecord ? (
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#334155' }}>{lastRecord.jenis_tes}: <span style={{color: '#10b981'}}>{lastRecord.nilai}</span></div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{lastRecord.tanggal} | {lastRecord.catatan}</div>
                                        </div>
                                    ) : <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600}}>Belum ada tes</span>}
                                </td>
                                <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button onClick={() => openEvalModal(s)} style={actionBtn('#f59e0b')} title="Input Ujian Harian/Tryout"><Edit3 size={18}/></button>
                                        <button onClick={() => openRaportModal(s)} style={actionBtn('#8b5cf6')} title="Input Raport Akhir & History"><BookA size={18}/></button>
                                        <button onClick={() => window.open(`/print-sertifikat/${s.id}`, '_blank')} style={actionBtn('#ec4899')} title="Cetak Sertifikat Lulus"><Printer size={18}/></button>
                                        <button onClick={() => handleLulusKelas(s.id, s.nama_lengkap)} style={{...actionBtn('#10b981'), background: '#ecfdf5', fontWeight: 800, fontSize: '0.8rem', padding: '6px 12px'}} title="Luluskan Siswa">Luluskan</button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                    {filteredStudents.length === 0 && !isLoading && <tr><td colSpan="4" style={{padding:'40px', textAlign:'center', color:'#94a3b8', fontWeight:700}}>Tidak ada siswa di kelas ini.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}