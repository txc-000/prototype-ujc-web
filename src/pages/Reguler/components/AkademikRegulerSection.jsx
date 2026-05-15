import React, { useState } from 'react';
import { regulerService } from '../../../services/regulerService';
import { UserCircle, Building2, FileSearch, Edit3, BookA, ArrowRightCircle, Loader2, X, Award, BrainCircuit, Save, Activity } from 'lucide-react';

const brandNavy = '#101869';

export default function AkademikRegulerSection({ students, onRefresh, onLogActivity, userProfile, setReviewStudentModal, isLoading }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal Evaluasi Harian
    const [isEduEvalOpen, setIsEduEvalOpen] = useState(false);
    const [eduEvalStudent, setEduEvalStudent] = useState(null);
    const [eduEvalForm, setEduEvalForm] = useState({ jenis_tes: 'UJIAN BAB', nilai: '', catatan: '' });

    // Modal Raport
    const [isRaportOpen, setIsRaportOpen] = useState(false);
    const [raportStudent, setRaportStudent] = useState(null);
    const [raportData, setRaportData] = useState({});
    const [raportPendidikanList, setRaportPendidikanList] = useState([]);

    const parseHistory = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        try { return JSON.parse(data); } catch { return []; }
    };

    const updateStage = async (id, nama, newStage, successMsg) => {
        if (!window.confirm(`Pindahkan ${nama} ke tahap ${newStage}?`)) return;
        try {
            await regulerService.updateStudentFields(id, { tahap_sekarang: newStage, status_akhir: 'Proses', updated_at: new Date() });
            if(successMsg) alert(successMsg); 
            await onLogActivity(`Update status ${nama} ke ${newStage}`); 
            onRefresh();
        } catch (error) { alert("Gagal: " + error.message); }
    };

    const handleEduEvalSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const dateStr = new Date().toLocaleDateString('id-ID');
            const newRecord = { tanggal: dateStr, jenis_tes: eduEvalForm.jenis_tes, nilai: Number(eduEvalForm.nilai), catatan: eduEvalForm.catatan, instruktur: userProfile?.nama_lengkap };
            
            const currentHistory = parseHistory(eduEvalStudent.nilai_history);
            const updatedHistory = [...currentHistory, newRecord];
            const totalNilai = updatedHistory.reduce((sum, item) => sum + item.nilai, 0);
            const avgNilai = Math.round(totalNilai / updatedHistory.length);

            await regulerService.updateStudentFields(eduEvalStudent.id, { nilai_history: updatedHistory, nilai_bahasa: avgNilai });
            await onLogActivity(`Input evaluasi harian: ${eduEvalStudent.nama_lengkap}`);
            alert("Nilai evaluasi harian berhasil disimpan!"); setIsEduEvalOpen(false); onRefresh();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const openRaportModal = (student) => {
        setRaportStudent(student);
        const parsedRaport = typeof student.data_raport === 'string' ? JSON.parse(student.data_raport || '{}') : (student.data_raport || {});
        setRaportPendidikanList(parseHistory(student.pendidikan_history));
        setRaportData({
            kotoba: parsedRaport.kotoba || 0, bunpo: parsedRaport.bunpo || 0, dokkai: parsedRaport.dokkai || 0, choukai: parsedRaport.choukai || 0, kaiwa: parsedRaport.kaiwa || 0,
            kecerdasan: parsedRaport.kecerdasan || 'B', kedisiplinan: parsedRaport.kedisiplinan || 'B', kerapihan: parsedRaport.kerapihan || 'B', perilaku: parsedRaport.perilaku || 'B',
            kepribadian: parsedRaport.kepribadian || 'B', teamwork: parsedRaport.teamwork || 'B', inisiatif: parsedRaport.inisiatif || 'B', fisik: parsedRaport.fisik || 'B'
        });
        setIsRaportOpen(true);
    };

    const saveRaportForm = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const totAkad = Number(raportData.kotoba) + Number(raportData.bunpo) + Number(raportData.dokkai) + Number(raportData.choukai) + Number(raportData.kaiwa);
            const finalAvg = Math.round(totAkad / 5);

            await regulerService.updateStudentFields(raportStudent.id, { data_raport: raportData, pendidikan_history: raportPendidikanList, nilai_bahasa: finalAvg });
            await onLogActivity(`Input raport akhir: ${raportStudent.nama_lengkap}`);
            alert(`Raport disimpan. Nilai rata-rata final ditetapkan menjadi ${finalAvg}.`); setIsRaportOpen(false); onRefresh();
        } catch (err) { alert('Gagal: ' + err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <>
            <div style={tableContainer}>
                <table style={tableS}>
                    <thead style={theadS}>
                        <tr>
                            <th style={thStyle}>Identitas Siswa</th>
                            <th style={thStyle}>Nilai Akademik & Tes Terakhir</th>
                            <th style={thStyle}>Status Kelas</th>
                            <th style={{...thStyle, textAlign: 'center'}}>Aksi / Update Alur</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? <tr><td colSpan="4" style={{textAlign:'center', padding:'40px'}}><Loader2 size={30} className="animate-spin" style={{margin:'0 auto'}}/></td></tr> : 
                         students.length === 0 ? <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>Tidak ada data.</td></tr> : 
                         students.map((student) => {
                            const history = parseHistory(student.nilai_history);
                            const lastRecord = history.length > 0 ? history[history.length - 1] : null;
                            return (
                            <tr key={student.id} style={trS}>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 800, color: '#1e293b' }}>{student.nama_lengkap}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{student.telepon || '-'}</div>
                                    {student.lpk_asal && student.lpk_asal.trim() !== '' ? (
                                        <div style={badgeMitra}><Building2 size={12}/> Mitra: {student.lpk_asal}</div>
                                    ) : ( <div style={badgeReguler}><UserCircle size={12}/> Reguler UJC</div> )}
                                    <button onClick={() => setReviewStudentModal(student)} style={btnLink}><FileSearch size={14}/> Review Profil Lengkap</button>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: brandNavy }}>{student.nilai_bahasa || 0}</span> / 100
                                    {lastRecord ? <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}><b>Tes:</b> {lastRecord.jenis_tes} ({lastRecord.nilai})</div> : <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>Belum ada tes</div>}
                                </td>
                                <td style={tdStyle}><span style={badgeS}>{student.tahap_sekarang}</span></td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button onClick={() => { setEduEvalStudent(student); setEduEvalForm({ jenis_tes: 'UJIAN BAB', nilai: '', catatan: '' }); setIsEduEvalOpen(true); }} style={actionBtn('#f59e0b')} title="Input Evaluasi Harian"><Edit3 size={16}/></button>
                                        <button onClick={() => openRaportModal(student)} style={actionBtn('#8b5cf6')} title="Input Raport Akhir"><BookA size={16}/></button>
                                        <button onClick={() => updateStage(student.id, student.nama_lengkap, 'PENDIDIKAN DIKLAT', 'Siswa naik ke kelas Diklat!')} style={btnUpgrade}>Ke Diklat <ArrowRightCircle size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            {/* MODAL EDUKASI */}
            {isEduEvalOpen && eduEvalStudent && (
                <div style={modalOverlay}>
                    <form onSubmit={handleEduEvalSubmit} style={{...modalContent, width: '400px'}}>
                        <div style={modalHeader}>
                            <div><h3 style={{ margin: 0, fontWeight: 900 }}>Evaluasi Harian</h3><p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{eduEvalStudent.nama_lengkap}</p></div>
                            <button type="button" onClick={() => setIsEduEvalOpen(false)} style={closeBtn}><X /></button>
                        </div>
                        <div style={{ marginBottom: '15px' }}><label style={labelForm}>Jenis Tes</label><select required style={inputForm} value={eduEvalForm.jenis_tes} onChange={(e) => setEduEvalForm({...eduEvalForm, jenis_tes: e.target.value})}><option value="UJIAN BAB">Ujian Bab (Harian)</option><option value="TRYOUT JLPT">Tryout JLPT / JFT</option><option value="UJIAN FISIK">Ujian Fisik / FMD</option><option value="SIKAP ATTITUDE">Penilaian Sikap</option></select></div>
                        <div style={{ marginBottom: '15px' }}><label style={labelForm}>Nilai (0-100)</label><input type="number" min="0" max="100" required style={{...inputForm, fontSize: '1.2rem', fontWeight: 800, color: brandNavy}} value={eduEvalForm.nilai} onChange={(e) => setEduEvalForm({...eduEvalForm, nilai: e.target.value})} /></div>
                        <div style={{ marginBottom: '25px' }}><label style={labelForm}>Catatan Instruktur</label><textarea rows="3" style={{...inputForm, resize: 'vertical'}} value={eduEvalForm.catatan} onChange={(e) => setEduEvalForm({...eduEvalForm, catatan: e.target.value})}></textarea></div>
                        <button type="submit" disabled={isSubmitting} style={submitBtn}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'Simpan Evaluasi'}</button>
                    </form>
                </div>
            )}

            {/* MODAL RAPORT */}
            {isRaportOpen && raportStudent && (
                <div style={modalOverlay}>
                    <form onSubmit={saveRaportForm} style={{...modalContent, width: '900px'}}>
                        <div style={modalHeader}>
                            <div><h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Award size={22} color={brandNavy}/> Input Raport Akhir</h3><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Siswa: <span style={{color: '#1e293b'}}>{raportStudent.nama_lengkap}</span></p></div>
                            <button type="button" onClick={() => setIsRaportOpen(false)} style={closeBtn}><X size={18}/></button>
                        </div>
                        <h4 style={{ fontSize: '1rem', color: '#1e293b', margin: '0 0 10px 0' }}><BrainCircuit size={18}/> Nilai Akademik Bahasa</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px' }}>
                            <div><label style={labelForm}>Kotoba</label><input type="number" required min="0" max="100" style={inputForm} value={raportData.kotoba} onChange={(e) => setRaportData({...raportData, kotoba: e.target.value})} /></div>
                            <div><label style={labelForm}>Bunpo</label><input type="number" required min="0" max="100" style={inputForm} value={raportData.bunpo} onChange={(e) => setRaportData({...raportData, bunpo: e.target.value})} /></div>
                            <div><label style={labelForm}>Dokkai</label><input type="number" required min="0" max="100" style={inputForm} value={raportData.dokkai} onChange={(e) => setRaportData({...raportData, dokkai: e.target.value})} /></div>
                            <div><label style={labelForm}>Choukai</label><input type="number" required min="0" max="100" style={inputForm} value={raportData.choukai} onChange={(e) => setRaportData({...raportData, choukai: e.target.value})} /></div>
                            <div><label style={labelForm}>Kaiwa</label><input type="number" required min="0" max="100" style={inputForm} value={raportData.kaiwa} onChange={(e) => setRaportData({...raportData, kaiwa: e.target.value})} /></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsRaportOpen(false)} style={cancelBtn}>Batal</button>
                            <button type="submit" disabled={isSubmitting} style={saveBtn}><Save size={18}/> Simpan Raport</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}

// -- STYLES --
const tableContainer = { background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const tableS = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const theadS = { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
const thStyle = { padding: '15px 20px', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' };
const tdStyle = { padding: '15px 20px', fontSize: '0.95rem', color: '#334155' };
const trS = { borderBottom: '1px solid #f1f5f9' };
const badgeMitra = { padding: '4px 10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', marginTop: '5px' };
const badgeReguler = { padding: '4px 10px', background: '#f0fdf4', color: '#16a34a', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', marginTop: '5px' };
const badgeS = { fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: '#e0e7ff', color: '#3730a3', fontWeight: 800, display: 'inline-block' };
const actionBtn = (color) => ({ background: 'white', border: `1px solid ${color}40`, color: color, cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', fontSize: '0.8rem', fontWeight: 700 });
const btnUpgrade = { padding: '8px 12px', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', background: '#8b5cf6', color: 'white' };
const btnLink = { border:'none', background:'none', color:'#059669', fontWeight:800, padding:0, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.75rem', marginTop: '8px' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '35px', borderRadius: '15px', maxWidth: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' };
const closeBtn = { border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const labelForm = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' };
const inputForm = { width: '100%', padding: '12px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const submitBtn = { width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center' };
const cancelBtn = { padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' };
const saveBtn = { padding: '10px 25px', background: brandNavy, border: 'none', color: 'white', fontWeight: 800, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };