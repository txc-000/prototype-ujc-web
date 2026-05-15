import React, { useState } from 'react';
import { UserCircle, Building2, FileSearch, Edit3, BookA, Printer, CheckCircle, Loader2, X, Award, BrainCircuit, Save } from 'lucide-react';
import { regulerService } from '../../../services/regulerService';

// IMPORT STYLES
import { styles, brandNavy } from './dashboardStyles';

export default function KelasDiklatSection({ 
    students, 
    onRefresh, 
    onLogActivity, 
    userProfile, 
    setReviewStudentModal, 
    isLoading,
    updateStage // Helper sentral dari parent
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // ── STATE EVALUASI HARIAN ──
    const [isEduEvalOpen, setIsEduEvalOpen] = useState(false);
    const [eduEvalStudent, setEduEvalStudent] = useState(null);
    const [eduEvalForm, setEduEvalForm] = useState({ jenis_tes: 'UJIAN BAB', nilai: '', catatan: '' });

    // ── STATE RAPORT AKHIR ──
    const [isRaportOpen, setIsRaportOpen] = useState(false);
    const [raportStudent, setRaportStudent] = useState(null);
    const [raportData, setRaportData] = useState({});

    // Helper Aman untuk Parsing
    const parseData = (data, fallback = []) => {
        if (!data) return fallback;
        if (typeof data === 'object') return data;
        try { return JSON.parse(data); } catch { return fallback; }
    };

    const handleEduEvalSubmit = async (e) => {
        e.preventDefault(); 
        setIsSubmitting(true);
        try {
            const dateStr = new Date().toLocaleDateString('id-ID');
            const newRecord = { 
                tanggal: dateStr, 
                jenis_tes: eduEvalForm.jenis_tes, 
                nilai: Number(eduEvalForm.nilai), 
                catatan: eduEvalForm.catatan, 
                instruktur: userProfile?.nama_lengkap 
            };
            
            const currentHistory = parseData(eduEvalStudent.nilai_history);
            const updatedHistory = [...currentHistory, newRecord];
            const totalNilai = updatedHistory.reduce((sum, item) => sum + item.nilai, 0);
            const avgNilai = Math.round(totalNilai / updatedHistory.length);

            await regulerService.updateStudentFields(eduEvalStudent.id, { 
                nilai_history: updatedHistory, 
                nilai_bahasa: avgNilai 
            });
            
            await onLogActivity(`Input evaluasi harian: ${eduEvalStudent.nama_lengkap} (${eduEvalForm.jenis_tes})`);
            alert("Nilai evaluasi harian berhasil disimpan!"); 
            setIsEduEvalOpen(false); 
            onRefresh();
        } catch (err) { 
            alert(err.message); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const openRaportModal = (student) => {
        setRaportStudent(student);
        const raport = parseData(student.data_raport, {});
        setRaportData({
            kotoba: raport.kotoba || 0, bunpo: raport.bunpo || 0, dokkai: raport.dokkai || 0, 
            choukai: raport.choukai || 0, kaiwa: raport.kaiwa || 0,
            kecerdasan: raport.kecerdasan || 'B', kedisiplinan: raport.kedisiplinan || 'B', 
            kerapihan: raport.kerapihan || 'B', perilaku: raport.perilaku || 'B',
            kepribadian: raport.kepribadian || 'B', teamwork: raport.teamwork || 'B', 
            inisiatif: raport.inisiatif || 'B', fisik: raport.fisik || 'B'
        });
        setIsRaportOpen(true);
    };

    const saveRaportForm = async (e) => {
        e.preventDefault(); 
        setIsSubmitting(true);
        try {
            const totAkad = Number(raportData.kotoba) + Number(raportData.bunpo) + Number(raportData.dokkai) + Number(raportData.choukai) + Number(raportData.kaiwa);
            const finalAvg = Math.round(totAkad / 5);

            await regulerService.updateStudentFields(raportStudent.id, { 
                data_raport: raportData, 
                nilai_bahasa: finalAvg 
            });
            
            await onLogActivity(`Input raport akhir: ${raportStudent.nama_lengkap}`);
            alert(`Raport disimpan. Nilai final: ${finalAvg}`); 
            setIsRaportOpen(false); 
            onRefresh();
        } catch (err) { 
            alert('Gagal: ' + err.message); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    return (
        <>
            <div style={styles.tableContainer}>
                <table style={styles.tableS}>
                    <thead style={styles.theadS}>
                        <tr>
                            <th style={styles.thStyle}>Identitas Siswa</th>
                            <th style={styles.thStyle}>Akademik & Tes Terakhir</th>
                            <th style={styles.thStyle}>Status</th>
                            <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi / Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'40px'}}><Loader2 size={30} className="animate-spin" color={brandNavy} style={{margin:'0 auto'}}/></td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>Tidak ada data siswa di kelas Diklat.</td></tr>
                        ) : students.map((student) => {
                            const history = parseData(student.nilai_history);
                            const lastRecord = history.length > 0 ? history[history.length - 1] : null;
                            return (
                                <tr key={student.id} style={styles.trS}>
                                    <td style={styles.tdStyle}>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{student.nama_lengkap}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{student.telepon || '-'}</div>
                                        {student.lpk_asal ? (
                                            <div style={styles.badgeMitra}><Building2 size={12}/> Mitra: {student.lpk_asal}</div>
                                        ) : ( 
                                            <div style={styles.badgeReguler}><UserCircle size={12}/> Reguler UJC</div> 
                                        )}
                                        <button onClick={() => setReviewStudentModal?.(student)} style={styles.btnLink('#059669')}>
                                            <FileSearch size={14}/> Review Profil
                                        </button>
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: brandNavy }}>{student.nilai_bahasa || 0}</span> / 100
                                        {lastRecord ? (
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}><b>Tes:</b> {lastRecord.jenis_tes} ({lastRecord.nilai})</div>
                                        ) : (
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>Belum ada tes</div>
                                        )}
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <span style={styles.badgeS}>{student.tahap_sekarang}</span>
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button onClick={() => { setEduEvalStudent(student); setEduEvalForm({ jenis_tes: 'UJIAN BAB', nilai: '', catatan: '' }); setIsEduEvalOpen(true); }} style={styles.btnA('#f59e0b')} title="Evaluasi Harian"><Edit3 size={16}/></button>
                                            <button onClick={() => openRaportModal(student)} style={styles.btnA('#8b5cf6')} title="Input Raport"><BookA size={16}/></button>
                                            <button onClick={() => window.open(`/print-sertifikat/${student.id}`, '_blank')} style={styles.btnA('#ec4899')} title="Cetak Sertifikat"><Printer size={16}/></button>
                                            <button onClick={() => updateStage(student.id, student.nama_lengkap, 'AVAILABLE', `Selamat! ${student.nama_lengkap} lulus diklat dan siap masuk bursa Job Matching.`)} style={{...styles.btnA('#10b981'), background: '#dcfce7'}}><CheckCircle size={16}/> Lulus</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── MODAL EDUKASI ── */}
            {isEduEvalOpen && eduEvalStudent && (
                <div style={styles.modalOverlay}>
                    <form onSubmit={handleEduEvalSubmit} style={{...styles.modalContent, width: '400px'}}>
                        <div style={styles.modalHeader}>
                            <div><h3 style={{ margin: 0, fontWeight: 900 }}>Evaluasi Harian</h3><p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{eduEvalStudent.nama_lengkap}</p></div>
                            <button type="button" onClick={() => setIsEduEvalOpen(false)} style={styles.closeBtn}><X size={20}/></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                            <div>
                                <label style={styles.lb}>Jenis Tes</label>
                                <select required style={styles.inp} value={eduEvalForm.jenis_tes} onChange={(e) => setEduEvalForm({...eduEvalForm, jenis_tes: e.target.value})}>
                                    <option value="UJIAN BAB">Ujian Bab (Harian)</option>
                                    <option value="TRYOUT JLPT">Tryout JLPT / JFT</option>
                                    <option value="UJIAN FISIK">Ujian Fisik / FMD</option>
                                    <option value="SIKAP ATTITUDE">Penilaian Sikap</option>
                                </select>
                            </div>
                            <div>
                                <label style={styles.lb}>Nilai (0-100)</label>
                                <input type="number" min="0" max="100" required style={{...styles.inp, fontSize: '1.2rem', fontWeight: 800, color: brandNavy}} value={eduEvalForm.nilai} onChange={(e) => setEduEvalForm({...eduEvalForm, nilai: e.target.value})} />
                            </div>
                            <div>
                                <label style={styles.lb}>Catatan Instruktur</label>
                                <textarea rows="3" style={{...styles.inp, resize: 'none'}} value={eduEvalForm.catatan} onChange={(e) => setEduEvalForm({...eduEvalForm, catatan: e.target.value})}></textarea>
                            </div>
                        </div>
                        <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : 'Simpan Evaluasi'}</button>
                    </form>
                </div>
            )}

            {/* ── MODAL RAPORT (Diringkas Identitasnya) ── */}
            {isRaportOpen && raportStudent && (
                <div style={styles.modalOverlay}>
                    <form onSubmit={saveRaportForm} style={{...styles.modalContent, width: '800px'}}>
                        <div style={styles.modalHeader}>
                            <div><h3 style={{ margin: 0, fontWeight: 900 }}>Input Raport Akhir</h3><p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{raportStudent.nama_lengkap}</p></div>
                            <button type="button" onClick={() => setIsRaportOpen(false)} style={styles.closeBtn}><X size={20}/></button>
                        </div>
                        <h4 style={styles.sectionTitle}><BrainCircuit size={18}/> Nilai Akademik</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '25px' }}>
                            {['kotoba', 'bunpo', 'dokkai', 'choukai', 'kaiwa'].map(key => (
                                <div key={key}>
                                    <label style={styles.lb}>{key}</label>
                                    <input type="number" required min="0" max="100" style={styles.inp} value={raportData[key]} onChange={(e) => setRaportData({...raportData, [key]: e.target.value})} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsRaportOpen(false)} style={styles.cancelBtn}>Batal</button>
                            <button type="submit" disabled={isSubmitting} style={styles.saveBtn || styles.submitBtn}><Save size={18}/> Simpan Raport</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}