import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PlaneTakeoff, X, Loader2 } from 'lucide-react';
import { styles } from '../../Reguler/components/dashboardStyles';

export default function ModalTerbang({ student, onClose, onSuccess, logActivity, incrementPoint }) {
    const [flyDate, setFlyDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFlySubmit = async (e) => {
        e.preventDefault();
        if(!window.confirm(`Konfirmasi final: Siswa ${student.nama_lengkap} akan diterbangkan pada tanggal ${flyDate}?`)) return;
        
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('students').update({ 
                tahap_sekarang: 'ALUMNI', 
                status_alumni: 'AKTIF',
                status_akhir: 'AKTIF BEKERJA', 
                tanggal_entri: flyDate,
                updated_at: new Date() 
            }).eq('id', student.id);
            
            if (error) throw error;
            await logActivity(`Menerbangkan siswa ${student.nama_lengkap} ke Jepang. Tgl Entri: ${flyDate}`);
            await incrementPoint();
            alert("Keberangkatan berhasil dicatat! Siswa resmi menjadi ALUMNI dan tagihan diaktifkan.");
            onSuccess();
        } catch (err) { alert("Gagal melaporkan: " + err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div style={styles.modalOverlay}>
            <form onSubmit={handleFlySubmit} style={{...styles.modalContent, width: '500px', padding: 0}}>
                <div style={styles.modalHeader}>
                    <div>
                        <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><PlaneTakeoff size={20} color="#10b981" /> Laporan Keberangkatan</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{student.nama_lengkap}</p>
                    </div>
                    <button type="button" onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>
                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={styles.lb}>Tanggal Tiba di Jepang (Entri) *</label>
                        <input type="date" required value={flyDate} onChange={(e) => setFlyDate(e.target.value)} style={{...styles.inp, border: '2px solid #cbd5e1'}} />
                        <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '10px', fontWeight: 700}}>
                            Perhatian: Tanggal ini akan otomatis diteruskan ke Divisi Keuangan dan menjadi acuan hitungan draf invoice penagihan bulanan untuk Kumiai.
                        </p>
                    </div>
                </div>
                <div style={{ padding: '20px 25px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
                    <button type="button" onClick={onClose} style={styles.cancelBtn}>Batal</button>
                    <button type="submit" disabled={isSubmitting} style={{...styles.btnPrimary, background: '#10b981'}}>
                        {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Terbangkan Siswa'}
                    </button>
                </div>
            </form>
        </div>
    );
}