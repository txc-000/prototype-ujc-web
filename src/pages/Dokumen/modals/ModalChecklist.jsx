import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, CheckSquare, Save } from 'lucide-react';
import { styles } from '../../Reguler/components/dashboardStyles';

export default function ModalChecklist({ student, docItems, onClose, onSuccess, logActivity }) {
    const [checklist, setChecklist] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (student) {
            const parsedStatus = typeof student.pemberkasan_status === 'string' ? JSON.parse(student.pemberkasan_status || '{}') : (student.pemberkasan_status || {});
            setChecklist(parsedStatus);
        }
    }, [student]);

    const handleCheckItem = (id) => setChecklist(prev => ({ ...prev, [id]: !prev[id] }));

    const saveChecklist = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('students').update({ pemberkasan_status: checklist, updated_at: new Date() }).eq('id', student.id);
            if (error) throw error;
            await logActivity(`Update checklist dokumen fisik: ${student.nama_lengkap}`);
            alert("Progres Dokumen Fisik Disimpan!");
            onSuccess();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '500px', padding: 0}}>
                <div style={styles.modalHeader}>
                    <div><h3 style={{ margin: 0, fontWeight: 900 }}>Checklist Dokumen Fisik</h3><p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{student.nama_lengkap}</p></div>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>
                <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {docItems.map(doc => (
                        <div key={doc.id} onClick={() => handleCheckItem(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: `2px solid ${checklist[doc.id] ? '#10b981' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', background: checklist[doc.id] ? '#ecfdf5' : 'white', transition: '0.2s' }}>
                            {checklist[doc.id] ? <CheckSquare size={20} color="#10b981"/> : <div style={{ width: '18px', height: '18px', border: '2px solid #cbd5e1', borderRadius: '4px' }}></div>}
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: checklist[doc.id] ? '#065f46' : '#475569' }}>{doc.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '20px 25px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
                    <button onClick={onClose} style={styles.cancelBtn}>Batal</button>
                    <button onClick={saveChecklist} disabled={isSubmitting} style={styles.btnPrimary}><Save size={18}/> {isSubmitting ? 'Menyimpan...' : 'Simpan Checklist'}</button>
                </div>
            </div>
        </div>
    );
}