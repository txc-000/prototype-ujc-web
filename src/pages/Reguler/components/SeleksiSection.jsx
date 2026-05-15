import React, { useState } from 'react';
import { CheckCircle, XCircle, Activity, FileSearch, X, Loader2 } from 'lucide-react';
import { regulerService } from '../../../services/regulerService';

// IMPORT STYLES
import { styles, brandNavy } from './dashboardStyles';

export default function SeleksiSection({ 
    students, 
    onRefresh, 
    onLogActivity, 
    setReviewStudentModal,
    updateStage // Helper sentral dari parent
}) {
    const [isMcuOpen, setIsMcuOpen] = useState(false);
    const [mcuStudent, setMcuStudent] = useState(null);
    const [mcuForm, setMcuForm] = useState({ status: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleMcuSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            let payload = { medical_checkup_status: mcuForm.status, catatan: mcuForm.notes };
            if (mcuForm.status === 'UNFIT') { 
                payload.tahap_sekarang = 'ARSIP / GAGAL'; 
                payload.status_akhir = 'Gagal MCU 1 (Ada Penyakit)'; 
            }
            await regulerService.updateStudentFields(mcuStudent.id, payload);
            await onLogActivity(`Update MCU 1 ${mcuStudent.nama_lengkap} -> ${mcuForm.status}`);
            
            if (mcuForm.status === 'UNFIT') {
                alert(`Siswa otomatis diarsipkan (GAGAL) karena MCU UNFIT.`);
            } else {
                alert('Hasil MCU berhasil disimpan!');
            }
            setIsMcuOpen(false); onRefresh();
        } catch (err) { alert('Gagal: ' + err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
                Menampilkan {students.length} Kandidat Seleksi
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.tableS}>
                    <thead style={styles.theadS}>
                        <tr>
                            <th style={styles.thStyle}>Kandidat</th>
                            <th style={styles.thStyle}>Program / Asal</th>
                            <th style={styles.thStyle}>Status MCU 1</th>
                            <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi & Keputusan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>Tidak ada data.</td></tr> : students.map(s => (
                            <tr key={s.id} style={styles.trS}>
                                <td style={styles.tdStyle}>
                                    <div style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama_lengkap}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NIK: {s.nik}</div>
                                    <button onClick={() => setReviewStudentModal?.(s)} style={styles.btnLink('#059669')}>
                                        <FileSearch size={14}/> Review Profil Lengkap
                                    </button>
                                </td>
                                <td style={styles.tdStyle}>
                                    <div style={{ fontWeight: 700 }}>{s.program}</div>
                                    <div style={{ fontSize: '0.75rem', color: s.lpk_asal ? '#3b82f6' : '#10b981', fontWeight: 800 }}>
                                        {s.lpk_asal ? `Mitra: ${s.lpk_asal}` : 'Internal UJC'}
                                    </div>
                                </td>
                                <td style={styles.tdStyle}>
                                    {s.medical_checkup_status === 'FIT' ? <span style={{...styles.badgeS, background: '#dcfce7', color: '#166534'}}>✅ FIT</span> : s.medical_checkup_status === 'UNFIT' ? <span style={{...styles.badgeS, background: '#fee2e2', color: '#991b1b'}}>❌ UNFIT</span> : <span style={{...styles.badgeS, background: '#fef3c7', color: '#92400e'}}>⏳ PENDING</span>}
                                </td>
                                <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button onClick={() => { setMcuStudent(s); setMcuForm({ status: s.medical_checkup_status || '', notes: s.catatan || '' }); setIsMcuOpen(true); }} style={styles.btnA('#f59e0b')} title="Input MCU">
                                            <Activity size={16}/> Input MCU
                                        </button>
                                        
                                        <button 
                                            onClick={() => {
                                                if (s.medical_checkup_status !== 'FIT' && !window.confirm(`⚠️ MCU belum FIT. Lanjutkan Lulus?`)) return;
                                                const nextTahap = s.lpk_asal ? 'PENDIDIKAN DIKLAT' : 'PENDIDIKAN REGULER';
                                                updateStage(s.id, s.nama_lengkap, nextTahap, `${s.nama_lengkap} LULUS Seleksi.`);
                                            }} 
                                            style={{...styles.btnA(brandNavy), color: 'white', background: brandNavy}}
                                        >
                                            <CheckCircle size={16}/> Lulus
                                        </button>
                                        
                                        <button 
                                            onClick={() => updateStage(s.id, s.nama_lengkap, 'ARSIP / GAGAL', `${s.nama_lengkap} telah digagalkan.`)} 
                                            style={{...styles.btnA('#ef4444'), background: '#fee2e2', color: '#ef4444'}}
                                        >
                                            <XCircle size={16}/> Gagal
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isMcuOpen && mcuStudent && (
                <div style={styles.modalOverlay}>
                    <form onSubmit={handleMcuSubmit} style={{...styles.modalContent, width: '450px'}}>
                        <div style={styles.modalHeader}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>Input Hasil MCU 1</h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{mcuStudent.nama_lengkap}</p>
                            </div>
                            <button type="button" onClick={() => setIsMcuOpen(false)} style={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' }}>
                            <div>
                                <label style={styles.lb}>Status Kesehatan (MCU 1)</label>
                                <select value={mcuForm.status} required onChange={(e) => setMcuForm({...mcuForm, status: e.target.value})} style={styles.inp}>
                                    <option value="">-- Belum Ada Hasil --</option>
                                    <option value="FIT">✅ FIT (Lulus)</option>
                                    <option value="UNFIT">❌ UNFIT (Gagal)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Simpan Hasil MCU'}
                        </button>
                    </form>
                </div> 
            )}
        </div>
    );
}