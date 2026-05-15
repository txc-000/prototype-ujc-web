import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalEvaluasi({ student, userProfile, onClose, onSuccess, logActivity, incrementPoint }) {
    const [evalForm, setEvalForm] = useState({ jenis_tes: 'UJIAN BAB', nilai: '', catatan: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEvalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dateStr = new Date().toLocaleDateString('id-ID');
            const newRecord = {
                tanggal: dateStr, jenis_tes: evalForm.jenis_tes,
                nilai: Number(evalForm.nilai), catatan: evalForm.catatan, instruktur: userProfile?.nama_lengkap
            };

            const currentHistory = student.nilai_history || [];
            const updatedHistory = [...currentHistory, newRecord];
            const totalNilai = updatedHistory.reduce((sum, item) => sum + item.nilai, 0);
            const avgNilai = Math.round(totalNilai / updatedHistory.length);

            const { error } = await supabase.from('students')
                .update({ nilai_history: updatedHistory, nilai_bahasa: avgNilai, updated_at: new Date() })
                .eq('id', student.id);

            if (error) throw error;
            await logActivity(`Input nilai ${evalForm.jenis_tes} untuk ${student.nama_lengkap}`);
            await incrementPoint();

            alert("Nilai evaluasi harian berhasil disimpan!");
            onSuccess();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '450px', padding: 0}}>
                <div style={styles.modalHeader}>
                    <div><h3 style={{ margin: 0, fontWeight: 900 }}>Evaluasi Pembelajaran</h3><p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{student.nama_lengkap}</p></div>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20}/></button>
                </div>
                <form onSubmit={handleEvalSubmit}>
                    <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div><label style={styles.lb}>Jenis Tes</label><select required style={styles.inp} value={evalForm.jenis_tes} onChange={(e) => setEvalForm({...evalForm, jenis_tes: e.target.value})}><option value="UJIAN BAB">Ujian Bab (Harian)</option><option value="TRYOUT JLPT">Tryout JLPT / JFT</option><option value="UJIAN FISIK">Ujian Fisik / FMD</option><option value="SIKAP ATTITUDE">Penilaian Sikap</option></select></div>
                        <div><label style={styles.lb}>Nilai (0-100)</label><input type="number" min="0" max="100" required style={{...styles.inp, fontSize: '1.2rem', fontWeight: 900, color: brandNavy}} value={evalForm.nilai} onChange={(e) => setEvalForm({...evalForm, nilai: e.target.value})} /></div>
                        <div><label style={styles.lb}>Catatan Instruktur</label><textarea rows="3" style={{...styles.inp, resize: 'vertical'}} value={evalForm.catatan} onChange={(e) => setEvalForm({...evalForm, catatan: e.target.value})}></textarea></div>
                    </div>
                    <div style={{ padding: '20px 25px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={styles.cancelBtn}>Batal</button>
                        <button type="submit" disabled={isSubmitting} style={styles.btnPrimary}>{isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Simpan Evaluasi'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}