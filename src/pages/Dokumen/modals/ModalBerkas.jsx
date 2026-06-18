import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, FileText, UploadCloud, CheckCircle2, Loader2, Eye, Trash2, Circle } from 'lucide-react';
import { styles } from '../../Reguler/components/dashboardStyles';

const DOC_TYPES = [
    { id: 'ktp', label: 'KTP Asli & Copy' },
    { id: 'kk', label: 'Kartu Keluarga' },
    { id: 'akta', label: 'Akta Kelahiran' },
    { id: 'paspor', label: 'Paspor Resmi' },
    { id: 'ijazah', label: 'Ijazah Terakhir' },
    { id: 'mcu_final', label: 'Hasil MCU (FIT)' },
    { id: 'skck', label: 'SKCK Kepolisian' },
    { id: 'foto', label: 'Pas Foto Resmi' }
];

export default function ModalBerkas({ student, onClose, onSuccess }) {
    const [berkas, setBerkas] = useState({});
    const [checklistFisik, setChecklistFisik] = useState({});
    const [uploading, setUploading] = useState(null);

    useEffect(() => {
        if (student) {
            const parsedBerkas = typeof student.berkas_digital === 'string' ? JSON.parse(student.berkas_digital || '{}') : (student.berkas_digital || {});
            const parsedFisik = typeof student.pemberkasan_status === 'string' ? JSON.parse(student.pemberkasan_status || '{}') : (student.pemberkasan_status || {});
            setBerkas(parsedBerkas);
            setChecklistFisik(parsedFisik);
        }
    }, [student]);

    const saveToDatabase = async (newBerkas) => {
        try {
            const { error } = await supabase.from('students').update({ berkas_digital: newBerkas }).eq('id', student.id);
            if (error) throw error;
            setBerkas(newBerkas);
            if(onSuccess) onSuccess();
        } catch (err) {
            alert('Gagal menyimpan referensi berkas: ' + err.message);
        }
    };

    const toggleFisik = async (docId) => {
        const newChecklist = { ...checklistFisik, [docId]: !checklistFisik[docId] };
        setChecklistFisik(newChecklist);
        try {
            await supabase.from('students').update({ pemberkasan_status: newChecklist }).eq('id', student.id);
            if(onSuccess) onSuccess();
        } catch (err) { alert('Gagal menyimpan status fisik: ' + err.message); }
    };

    const handleUpload = async (e, docId) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal adalah 2MB.');
            return;
        }

        setUploading(docId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${docId}_${Date.now()}.${fileExt}`;
            const filePath = `${student.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('berkas_siswa').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('berkas_siswa').getPublicUrl(filePath);

            const newBerkas = { ...berkas, [docId]: publicUrl };
            await saveToDatabase(newBerkas);
        } catch (err) {
            alert('Gagal mengunggah file. Pastikan Anda telah membuat Storage Bucket bernama "berkas_siswa" di Supabase dan mengaturnya ke Public.\n\nError: ' + err.message);
        } finally {
            setUploading(null);
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Yakin ingin menghapus referensi berkas ini?')) return;
        const newBerkas = { ...berkas };
        delete newBerkas[docId];
        await saveToDatabase(newBerkas);
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '850px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'}}>
                <div style={{ padding: '20px 30px', background: '#2563eb', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900 }}><FileText size={20} /> Manajemen Dokumen (Fisik & Digital)</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>Ceklis hardcopy dan unggah softcopy untuk: <b>{student?.nama_lengkap}</b></p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}><X size={20}/></button>
                </div>

                <div style={{ padding: '20px 30px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {DOC_TYPES.map(doc => {
                            const hasFile = !!berkas[doc.id];
                            const hasFisik = !!checklistFisik[doc.id];
                            const isUploading = uploading === doc.id;
                            const isComplete = hasFile && hasFisik;
                            
                            return (
                                <div key={doc.id} style={{ background: 'white', padding: '15px 20px', borderRadius: '12px', border: `1px solid ${isComplete ? '#10b981' : '#e2e8f0'}`, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', alignItems: 'center', gap: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s' }}>
                                    
                                    {/* Kolom 1: Nama Dokumen */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {isComplete ? <CheckCircle2 size={20} color="#10b981" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div>}
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{doc.label}</div>
                                    </div>
                                    
                                    {/* Kolom 2: Status Fisik (Map) */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button onClick={() => toggleFisik(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', borderRadius: '20px', border: `1px solid ${hasFisik ? '#10b981' : '#cbd5e1'}`, background: hasFisik ? '#ecfdf5' : '#f8fafc', color: hasFisik ? '#059669' : '#64748b', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', transition: '0.2s' }}>
                                            {hasFisik ? <CheckCircle2 size={16}/> : <Circle size={16}/>}
                                            {hasFisik ? 'Fisik Diterima' : 'Ceklis Fisik'}
                                        </button>
                                    </div>

                                    {/* Kolom 3: Status Scan (Digital) */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        {hasFile ? (
                                            <><button onClick={() => window.open(berkas[doc.id], '_blank')} style={{ padding: '8px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700 }}><Eye size={14}/> Lihat</button><button onClick={() => handleDelete(doc.id)} style={{ padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }} title="Hapus Berkas"><Trash2 size={14}/></button></>
                                        ) : (
                                            <div style={{ position: 'relative' }}>
                                                <input type="file" accept="image/*,.pdf" onChange={(e) => handleUpload(e, doc.id)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} disabled={isUploading} />
                                                <button disabled={isUploading} style={{ padding: '8px 15px', background: 'white', color: '#475569', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, pointerEvents: 'none' }}>{isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14}/>} {isUploading ? 'Mengunggah...' : 'Upload Scan'}</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                
                <div style={{ padding: '20px 30px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: 'white' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}>Tutup Selesai</button>
                </div>
            </div>
        </div>
    );
}