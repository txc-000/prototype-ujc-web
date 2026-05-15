import React from 'react';
import { UserCircle, Building2, FileSearch, FileText, Loader2 } from 'lucide-react';

// IMPORT STYLES
import { styles, brandNavy } from './dashboardStyles';

export default function MatchingSection({ 
    students, 
    jobOrders, 
    onRefresh, 
    onLogActivity, 
    setReviewStudentModal, 
    isLoading,
    updateStage // Menggunakan helper sentral dari parent
}) {
    
    // Hanya menampilkan Kaisha yang memiliki Job Order berstatus OPEN
    const activeJONames = jobOrders 
        ? jobOrders.filter(j => j.status === 'OPEN').map(j => j.perusahaan)
        : [];

    const assignToJO = async (id, nama, namaPerusahaan) => {
        if(!window.confirm(`Masukkan ${nama} ke daftar Pramensetsu untuk Kaisha ${namaPerusahaan}?`)) return;
        try {
            // Kita gunakan logic updateStage tapi dengan tambahan field perusahaan_tujuan
            // Karena updateStage di parent hanya update stage & status_akhir, 
            // khusus untuk Assign JO kita panggil service manual agar field perusahaan terisi.
            const { regulerService } = await import('../../../services/regulerService');
            await regulerService.updateStudentFields(id, { 
                tahap_sekarang: 'PRA_MENSETSU', 
                perusahaan_tujuan: namaPerusahaan, 
                updated_at: new Date() 
            });
            
            await onLogActivity(`Assign ${nama} ke Job Order: ${namaPerusahaan}`);
            alert(`Berhasil! ${nama} dijadwalkan Pramensetsu di ${namaPerusahaan}`);
            onRefresh();
        } catch (err) { 
            alert(err.message); 
        }
    };

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
                        <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>Tidak ada data di tahap Matching.</td></tr>
                    ) : students.map((student) => (
                        <tr key={student.id} style={styles.trS}>
                            <td style={styles.tdStyle}>
                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{student.nama_lengkap}</div>
                                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>NIK: {student.nik}</div>
                                
                                {student.lpk_asal && student.lpk_asal.trim() !== '' ? (
                                    <div style={styles.badgeMitra}><Building2 size={12}/> Mitra: {student.lpk_asal}</div>
                                ) : ( 
                                    <div style={styles.badgeReguler}><UserCircle size={12}/> Reguler UJC</div> 
                                )}
                                
                                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                                    <button onClick={() => window.open(`/print-cv/${student.id}`, '_blank')} style={styles.btnLink('#ec4899')}>
                                        <FileText size={14}/> Generate CV
                                    </button>
                                    <button onClick={() => setReviewStudentModal?.(student)} style={styles.btnLink('#059669')}>
                                        <FileSearch size={14}/> Review Profil
                                    </button>
                                </div>
                            </td>
                            
                            <td style={{...styles.tdStyle, fontWeight: 700, color: student.perusahaan_tujuan ? '#ec4899' : '#94a3b8'}}>
                                {student.perusahaan_tujuan || 'Belum Di-Assign'}
                            </td>

                            <td style={styles.tdStyle}>
                                <div style={{ ...styles.badgeS, background: '#eff6ff', color: '#2563eb' }}>
                                    {student.tahap_sekarang}
                                </div>
                            </td>

                            <td style={styles.tdStyle}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {/* LOGIKA FLOW MATCHING */}
                                    {student.tahap_sekarang === 'AVAILABLE' && (
                                        <select 
                                            style={{padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'}} 
                                            onChange={(e) => { if(e.target.value) assignToJO(student.id, student.nama_lengkap, e.target.value); e.target.value=''; }}
                                        >
                                            <option value="">+ Assign ke Job Order</option>
                                            {activeJONames.map((jo, i) => <option key={i} value={jo}>{jo}</option>)}
                                        </select>
                                    )}

                                    {student.tahap_sekarang === 'PRA_MENSETSU' && (
                                        <button 
                                            onClick={() => updateStage(student.id, student.nama_lengkap, 'INTERVIEW', `Status ${student.nama_lengkap} naik ke Tahap Interview.`)} 
                                            style={styles.btnA('#f59e0b')}
                                        >
                                            Mulai Interview
                                        </button>
                                    )}

                                    {student.tahap_sekarang === 'INTERVIEW' && (
                                        <>
                                            <button 
                                                onClick={() => updateStage(student.id, student.nama_lengkap, 'MATCHED', `Selamat! Siswa ${student.nama_lengkap} dinyatakan MATCHED.`)} 
                                                style={{...styles.btnA('#10b981'), background: '#dcfce7'}}
                                            >
                                                Lulus
                                            </button>
                                            <button 
                                                onClick={() => updateStage(student.id, student.nama_lengkap, 'AVAILABLE', `Siswa ${student.nama_lengkap} gagal interview dan kembali ke status Available.`)} 
                                                style={{...styles.btnA('#ef4444'), background: '#fee2e2'}}
                                            >
                                                Gagal
                                            </button>
                                        </>
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