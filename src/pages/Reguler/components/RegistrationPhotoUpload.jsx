import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase'; // Sesuaikan path

export default function RegistrationPhotoUpload({ studentId, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    // FIX MEMORY LEAK: Hapus preview dari memory browser saat unmount / berubah
    useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview); };
    }, [preview]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith('image/')) return alert('Harap unggah file gambar (JPG/PNG).');
        if (selectedFile.size > 2 * 1024 * 1024) return alert('Ukuran foto maksimal 2MB.');

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleUpload = async () => {
        if (!file || !studentId) return;
        setUploading(true);

        try {
            // FIX EXTENSION: Ambil ekstensi asli dari file yang diupload
            const ext = file.name.split('.').pop();
            const fileName = `${studentId}.${ext}`;

            const { error } = await supabase.storage
                .from('registration_photos')
                .upload(fileName, file, { cacheControl: '3600', upsert: true });

            if (error) throw error;
            alert('Foto berhasil diunggah!');
            if (onUploadSuccess) onUploadSuccess();
            
        } catch (error) {
            console.error(error);
            alert('Gagal mengunggah foto.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Unggah Pas Foto</h4>
            <div style={{ width: '120px', height: '160px', background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {preview ? <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>Preview</span>}
            </div>
            <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} style={{ fontSize: '0.8rem', color: '#64748b', width: '100%' }} />
            <button type="button" onClick={handleUpload} disabled={!file || uploading} style={{ width: '100%', background: (!file || uploading) ? '#94a3b8' : '#101869', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: (!file || uploading) ? 'not-allowed' : 'pointer' }}>
                {uploading ? 'Mengunggah...' : 'Simpan Foto'}
            </button>
        </div>
    );
}