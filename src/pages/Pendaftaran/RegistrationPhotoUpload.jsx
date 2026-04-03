import { useState } from 'react';
import { supabase } from "../../lib/supabase"; // Sesuaikan path

export default function RegistrationPhotoUpload({ studentId, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validasi ekstensi dan ukuran (Maksimal 2MB)
        if (!selectedFile.type.startsWith('image/')) {
            alert('Harap unggah file gambar (JPG/PNG).');
            return;
        }
        if (selectedFile.size > 2 * 1024 * 1024) {
            alert('Ukuran foto maksimal 2MB.');
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleUpload = async () => {
        if (!file || !studentId) return;
        setUploading(true);

        try {
            // Nama file di-set menggunakan ID Siswa (.jpg) sesuai standar Dashboard SPV
            const fileName = `${studentId}.jpg`;

            const { error } = await supabase.storage
                .from('registration_photos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true // Menimpa file lama jika siswa update foto
                });

            if (error) throw error;

            alert('Foto 3x4 berhasil diunggah!');
            if (onUploadSuccess) onUploadSuccess();
            
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Terjadi kesalahan saat mengunggah foto.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <h3 className="font-bold text-slate-700">Unggah Foto 3x4</h3>
            
            {/* Area Preview */}
            <div className="w-32 h-40 bg-slate-200 border border-slate-400 flex items-center justify-center overflow-hidden">
                {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xs text-slate-400 text-center px-2">Preview Foto</span>
                )}
            </div>

            <input 
                type="file" 
                accept="image/jpeg, image/png" 
                onChange={handleFileChange}
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            <button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {uploading ? 'Mengunggah...' : 'Simpan Foto'}
            </button>
        </div>
    );
}