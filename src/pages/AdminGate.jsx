import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Save, Globe, ArrowLeft, Loader2, Trash2, Edit3, XCircle, ImagePlus, ImageIcon } from 'lucide-react';
import translate from "translate";

export default function AdminGate({ newsData, setNewsData, lang }) {
    const navigate = useNavigate();
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingInline, setIsUploadingInline] = useState(false); // State untuk loading upload gambar dalam teks
    const [editingId, setEditingId] = useState(null);
    const [imageFile, setImageFile] = useState(null); 
    const textAreaRef = useRef(null); // Referensi untuk kotak teks agar tahu posisi kursor

    const [formData, setFormData] = useState({
        titleID: '', excerptID: '', fullBodyID: '',
        titleJP: '', excerptJP: '', fullBodyJP: '',
        tag: 'PENGUMUMAN',
        image_url: '' 
    });

    translate.engine = "google";

    const resetForm = () => {
        setEditingId(null);
        setImageFile(null);
        setFormData({ titleID: '', excerptID: '', fullBodyID: '', titleJP: '', excerptJP: '', fullBodyJP: '', tag: 'PENGUMUMAN', image_url: '' });
    };

    const handleAutoTranslate = async () => {
        if (!formData.titleID || !formData.excerptID || !formData.fullBodyID) return alert("Isi semua konten (Judul, Ringkasan, Isi Lengkap) Indonesia dulu, Tuan.");
        setIsTranslating(true);
        try {
            const tTitle = await translate(formData.titleID, { from: "id", to: "ja" });
            const tExcerpt = await translate(formData.excerptID, { from: "id", to: "ja" });
            const tFullBody = await translate(formData.fullBodyID, { from: "id", to: "ja" });
            
            setFormData({ ...formData, titleJP: tTitle, excerptJP: tExcerpt, fullBodyJP: tFullBody });
        } catch (err) {
            alert("Gagal koneksi ke layanan translate. Periksa koneksi internet.");
        } finally {
            setIsTranslating(false);
        }
    };

    // Fungsi upload gambar banner utama (dipertahankan)
    const uploadImage = async () => {
        if (!imageFile) return formData.image_url; 

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('news-images')
            .upload(filePath, imageFile);

        if (uploadError) throw new Error(`Gagal upload gambar banner: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
            .from('news-images')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    // FUNGSI BARU: Upload gambar khusus untuk disisipkan ke dalam isi teks
    const handleInsertInlineImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingInline(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `inline-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `public/${fileName}`;

            // Upload ke storage
            const { error: uploadError } = await supabase.storage
                .from('news-images')
                .upload(filePath, file);

            if (uploadError) throw new Error(uploadError.message);

            // Dapatkan URL Publik
            const { data: publicUrlData } = supabase.storage
                .from('news-images')
                .getPublicUrl(filePath);

            const imageUrl = publicUrlData.publicUrl;
            const markdownImageStr = `\n\n![](${imageUrl})\n\n`;

            // Sisipkan ke dalam teks yang sedang aktif (di posisi kursor jika memungkinkan)
            const currentText = formData.fullBodyID;
            let newText = currentText + markdownImageStr; // Default: tambah di akhir

            if (textAreaRef.current) {
                const startPos = textAreaRef.current.selectionStart;
                const endPos = textAreaRef.current.selectionEnd;
                if (startPos !== undefined && endPos !== undefined) {
                    newText = currentText.substring(0, startPos) + markdownImageStr + currentText.substring(endPos, currentText.length);
                }
            }

            setFormData({ ...formData, fullBodyID: newText });

        } catch (err) {
            alert(`Gagal upload gambar sisipan: ${err.message}`);
        } finally {
            setIsUploadingInline(false);
            // Reset input file agar bisa pilih file yang sama lagi jika perlu
            e.target.value = null; 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const finalImageUrl = await uploadImage();

            const payload = {
                tag: formData.tag,
                image_url: finalImageUrl, 
                content_id: { title: formData.titleID, excerpt: formData.excerptID, full_body: formData.fullBodyID },
                content_jp: { title: formData.titleJP, excerpt: formData.excerptJP, full_body: formData.fullBodyJP }
            };

            if (editingId) {
                const { error } = await supabase.from('news').update(payload).eq('id', editingId);
                if (error) throw error;

                setNewsData(newsData.map(item => item.id === editingId
                    ? { ...item, tag: payload.tag, image_url: payload.image_url, content: { ID: payload.content_id, JP: payload.content_jp } }
                    : item
                ));
                alert("Berita Berhasil Diperbarui!");
            } else {
                const { data, error } = await supabase.from('news').insert([payload]).select();
                if (error) throw error;

                const newEntry = {
                    id: data[0].id,
                    date: new Date().toLocaleDateString('id-ID'),
                    tag: data[0].tag,
                    image_url: data[0].image_url,
                    content: { ID: data[0].content_id, JP: data[0].content_jp }
                };
                setNewsData([newEntry, ...newsData]);
                alert("Berita Berhasil Terbit!");
            }
            resetForm();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tuan yakin ingin menghapus berita ini secara permanen?")) {
            try {
                const { error } = await supabase.from('news').delete().eq('id', id);
                if (error) throw error;
                setNewsData(newsData.filter(item => item.id !== id));
            } catch (err) {
                alert("Gagal menghapus: " + err.message);
            }
        }
    };

    const handleEditInit = (item) => {
        setEditingId(item.id);
        setImageFile(null); 
        setFormData({
            titleID: item.content.ID?.title || '',
            excerptID: item.content.ID?.excerpt || '',
            fullBodyID: item.content.ID?.full_body || '', 
            titleJP: item.content.JP?.title || '',
            excerptJP: item.content.JP?.excerpt || '',
            fullBodyJP: item.content.JP?.full_body || '', 
            tag: item.tag,
            image_url: item.image_url || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div style={{ padding: '50px 5%', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)' }}>
                            {editingId ? '📝 Edit Berita' : '🚀 Publish Berita Baru'}
                        </h2>
                        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)' }}>
                            <ArrowLeft size={18} /> Kembali ke Web
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div>
                                <label style={labelStyle}>TAG / KATEGORI</label>
                                <select value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })} style={inputStyle}>
                                    <option value="PENGUMUMAN">PENGUMUMAN</option>
                                    <option value="PENTING">PENTING</option>
                                    <option value="PELEPASAN">PELEPASAN</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style={labelStyle}>GAMBAR BANNER BERITA (MAX 2MB)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <label style={{ ...inputStyle, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: 'white', flex: 1 }}>
                                        <ImagePlus size={18} color="#3b82f6" />
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {imageFile ? imageFile.name : formData.image_url ? 'Gambar Sudah Ada (Klik untuk ganti)' : 'Pilih File Gambar (.jpg, .png)'}
                                        </span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => setImageFile(e.target.files[0])} 
                                            style={{ display: 'none' }} 
                                        />
                                    </label>
                                    {(imageFile || formData.image_url) && (
                                        <img 
                                            src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url} 
                                            alt="Preview" 
                                            style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* GRID KOLOM KIRI (ID) DAN KANAN (JP) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            
                            {/* KOLOM INDONESIA */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={labelStyle}>🇮🇩 Judul Berita</label>
                                    <input type="text" placeholder="Masukkan judul..." value={formData.titleID} onChange={(e) => setFormData({ ...formData, titleID: e.target.value })} style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>🇮🇩 Ringkasan (Tampil di Beranda)</label>
                                    <textarea rows="3" placeholder="Satu atau dua kalimat pembuka..." value={formData.excerptID} onChange={(e) => setFormData({ ...formData, excerptID: e.target.value })} style={{...inputStyle, resize: 'vertical'}} required />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                        <label style={{...labelStyle, marginBottom: 0}}>🇮🇩 Isi Berita Lengkap</label>
                                        
                                        {/* TOMBOL SISIPKAN GAMBAR DI TENGAH TEKS */}
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', border: '1px solid #bfdbfe' }}>
                                            {isUploadingInline ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                            {isUploadingInline ? 'Mengunggah...' : 'Sisipkan Gambar'}
                                            <input type="file" accept="image/*" onChange={handleInsertInlineImage} disabled={isUploadingInline} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                    
                                    <textarea 
                                        ref={textAreaRef}
                                        rows="15" 
                                        placeholder="Ketik isi artikel. Anda dapat klik 'Sisipkan Gambar' di atas untuk menaruh gambar di tengah teks." 
                                        value={formData.fullBodyID} 
                                        onChange={(e) => setFormData({ ...formData, fullBodyID: e.target.value })} 
                                        style={{...inputStyle, resize: 'vertical'}} 
                                        required 
                                    />
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '5px' }}>* Format gambar di dalam teks akan terlihat seperti: <b>![] (https://...)</b>. Jangan dihapus.</div>
                                </div>
                            </div>

                            {/* KOLOM JEPANG */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={labelStyle}>🇯🇵 Judul Jepang (Auto)</label>
                                    <input type="text" value={formData.titleJP} onChange={(e) => setFormData({ ...formData, titleJP: e.target.value })} style={{ ...inputStyle, background: '#f8fafc' }} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>🇯🇵 Ringkasan Jepang (Auto)</label>
                                    <textarea rows="3" value={formData.excerptJP} onChange={(e) => setFormData({ ...formData, excerptJP: e.target.value })} style={{ ...inputStyle, background: '#f8fafc', resize: 'vertical' }} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>🇯🇵 Isi Berita Jepang (Auto)</label>
                                    <textarea rows="15" value={formData.fullBodyJP} onChange={(e) => setFormData({ ...formData, fullBodyJP: e.target.value })} style={{ ...inputStyle, background: '#f8fafc', resize: 'vertical' }} required />
                                </div>
                            </div>
                        </div>

                        {/* TOMBOL AKSI */}
                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', borderTop: '2px solid #f1f5f9', paddingTop: '25px' }}>
                            <button type="button" onClick={handleAutoTranslate} disabled={isTranslating} style={{ flex: 1, padding: '16px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 700, transition: '0.2s' }}>
                                {isTranslating ? <Loader2 className="animate-spin" /> : <Globe size={20} color="#3b82f6" />}
                                {isTranslating ? 'Menerjemahkan...' : 'Translate Otomatis (ID -> JP)'}
                            </button>
                            <button type="submit" disabled={isSaving} style={{ flex: 1, padding: '16px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: '0.2s', boxShadow: '0 4px 6px rgba(220, 38, 38, 0.2)' }}>
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                {editingId ? 'Simpan Perubahan Berita' : 'Publish Berita ke Sistem'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} style={{ padding: '16px 20px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                    Batal Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* TABEL DAFTAR BERITA */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Daftar Berita yang Telah Terbit</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                    <th style={{ padding: '15px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Cover</th>
                                    <th style={{ padding: '15px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Tgl. Publish</th>
                                    <th style={{ padding: '15px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Judul & Ringkasan</th>
                                    <th style={{ padding: '15px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Tag</th>
                                    <th style={{ padding: '15px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newsData.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Belum ada data berita yang dipublikasikan.</td></tr>
                                ) : (
                                    newsData.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="thumbnail" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                                ) : (
                                                    <div style={{ width: '60px', height: '40px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, border: '1px dashed #cbd5e1' }}>No Img</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '15px', fontSize: '0.85rem', color: '#475569', fontWeight: 600, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{item.date}</td>
                                            <td style={{ padding: '15px', verticalAlign: 'middle', maxWidth: '400px' }}>
                                                <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content.ID?.title || '(Tanpa Judul)'}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content.ID?.excerpt || '-'}</div>
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'middle', textAlign: 'center' }}><span style={{ fontSize: '0.7rem', padding: '4px 10px', background: '#fef3c7', color: '#b45309', borderRadius: '20px', fontWeight: 800 }}>{item.tag}</span></td>
                                            <td style={{ padding: '15px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleEditInit(item)} style={{ background: '#eff6ff', border: 'none', color: '#3b82f6', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit Berita"><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id)} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Hapus Permanen"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

const inputStyle = { width: '100%', padding: '14px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', color: '#1e293b', fontSize: '0.95rem' };
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' };