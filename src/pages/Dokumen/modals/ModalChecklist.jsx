import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, CheckSquare, Save, FileText, CheckCircle2, Circle } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

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

    // Kalkulasi Progress
    const checkedCount = Object.values(checklist).filter(v => v === true).length;
    const progress = Math.round((checkedCount / docItems.length) * 100);
    const isComplete = progress === 100;

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '600px', padding: 0, overflow: 'hidden'}}>
                
                {/* HEADER MODAL */}
                <div style={{ padding: '25px 30px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={22} color={brandNavy} /> Checklist Dokumen Fisik
                        </h3>
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Siswa: <span style={{color: '#1e293b'}}>{student?.nama_lengkap}</span></p>
                    </div>
                    <button onClick={onClose} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b', transition: '0.2s' }}><X size={20} /></button>
                </div>

                {/* PROGRESS BAR SECTION */}
                <div style={{ padding: '20px 30px', background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>Progres Kelengkapan</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: isComplete ? '#10b981' : brandNavy }}>{checkedCount} / {docItems.length} Dokumen ({progress}%)</span>
                    </div>
                    <div style={{ width: '100%', background: '#e2e8f0', height: '10px', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, background: isComplete ? '#10b981' : brandNavy, height: '100%', transition: 'all 0.4s ease' }}></div>
                    </div>
                </div>

                {/* CHECKLIST ITEMS */}
                <div style={{ padding: '25px 30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxHeight: '50vh', overflowY: 'auto', background: '#f8fafc' }}>
                    {docItems.map(doc => (
                        <div key={doc.id} onClick={() => handleCheckItem(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', border: `2px solid ${checklist[doc.id] ? '#10b981' : 'transparent'}`, borderRadius: '12px', cursor: 'pointer', background: checklist[doc.id] ? '#ecfdf5' : 'white', boxShadow: checklist[doc.id] ? '0 4px 6px rgba(16, 185, 129, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}>
                            {checklist[doc.id] ? <CheckCircle2 size={24} color="#10b981" /> : <Circle size={24} color="#cbd5e1" />}
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: checklist[doc.id] ? '#065f46' : '#334155' }}>{doc.label}</span>
                        </div>
                    ))}
                </div>

                {/* FOOTER ACTIONS */}
                <div style={{ padding: '20px 30px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'white' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>Tutup</button>
                    <button onClick={saveChecklist} disabled={isSubmitting} style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1, transition: '0.2s' }}><Save size={18}/> {isSubmitting ? 'Menyimpan...' : 'Simpan Checklist'}</button>
                </div>
            </div>
        </div>
    );
}