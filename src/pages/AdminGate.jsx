import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Save, Globe, ArrowLeft, Loader2, Trash2, Edit3, XCircle, ImagePlus } from 'lucide-react';
import translate from "translate";

export default function AdminGate({ newsData, setNewsData, lang }) {
    const navigate = useNavigate();
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [imageFile, setImageFile] = useState(null); // State untuk file gambar baru

    const [formData, setFormData] = useState({
        titleID: '', excerptID: '',
        titleJP: '', excerptJP: '',
        tag: 'PENGUMUMAN',
        image_url: '' // Tambahan state image_url
    });

    translate.engine = "google";

    const resetForm = () => {
        setEditingId(null);
        setImageFile(null);
        setFormData({ titleID: '', excerptID: '', titleJP: '', excerptJP: '', tag: 'PENGUMUMAN', image_url: '' });
    };

    const handleAutoTranslate = async () => {
        if (!formData.titleID || !formData.excerptID) return alert("Isi konten Indonesia dulu, Tuan.");
        setIsTranslating(true);
        try {
            const tTitle = await translate(formData.titleID, { from: "id", to: "ja" });
            const tExcerpt = await translate(formData.excerptID, { from: "id", to: "ja" });
            setFormData({ ...formData, titleJP: tTitle, excerptJP: tExcerpt });
        } catch (err) {
            alert("Gagal koneksi ke layanan translate.");
        } finally {
            setIsTranslating(false);
        }
    };

    // Fungsi khusus untuk handle upload ke Supabase Storage
    const uploadImage = async () => {
        if (!imageFile) return formData.image_url; // Kembalikan URL lama jika tidak ada file baru

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('news-images')
            .upload(filePath, imageFile);

        if (uploadError) throw new Error(`Gagal upload gambar: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
            .from('news-images')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // 1. Upload gambar dulu (jika ada) dan dapatkan URL-nya
            const finalImageUrl = await uploadImage();

            const payload = {
                tag: formData.tag,
                image_url: finalImageUrl, // Masukkan URL gambar ke payload
                content_id: { title: formData.titleID, excerpt: formData.excerptID },
                content_jp: { title: formData.titleJP, excerpt: formData.excerptJP }
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
        setImageFile(null); // Reset input file saat edit
        setFormData({
            titleID: item.content.ID.title,
            excerptID: item.content.ID.excerpt,
            titleJP: item.content.JP.title,
            excerptJP: item.content.JP.excerpt,
            tag: item.tag,
            image_url: item.image_url || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div style={{ padding: '50px 5%', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={labelStyle}>TAG / KATEGORI</label>
                                <select value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })} style={inputStyle}>
                                    <option value="PENGUMUMAN">PENGUMUMAN</option>
                                    <option value="PENTING">PENTING</option>
                                    <option value="PELEPASAN">PELEPASAN</option>
                                </select>
                            </div>
                            
                            {/* INPUT GAMBAR */}
                            <div>
                                <label style={labelStyle}>GAMBAR BANNER BERITA</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label style={{ ...inputStyle, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: '#fafafa' }}>
                                        <ImagePlus size={18} color="#666" />
                                        <span style={{ fontSize: '0.85rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {imageFile ? imageFile.name : formData.image_url ? 'Gambar Tersimpan (Klik untuk ganti)' : 'Pilih File Gambar...'}
                                        </span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => setImageFile(e.target.files[0])} 
                                            style={{ display: 'none' }} 
                                        />
                                    </label>
                                    {/* Preview Thumbnail Kecil */}
                                    {(imageFile || formData.image_url) && (
                                        <img 
                                            src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url} 
                                            alt="Preview" 
                                            style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>🇮🇩 Judul Indonesia</label>
                                <input type="text" value={formData.titleID} onChange={(e) => setFormData({ ...formData, titleID: e.target.value })} style={inputStyle} required />
                                <label style={labelStyle}>🇮🇩 Konten Indonesia</label>
                                <textarea rows="4" value={formData.excerptID} onChange={(e) => setFormData({ ...formData, excerptID: e.target.value })} style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>🇯🇵 Judul Jepang (Auto)</label>
                                <input type="text" value={formData.titleJP} onChange={(e) => setFormData({ ...formData, titleJP: e.target.value })} style={{ ...inputStyle, background: '#fafafa' }} required />
                                <label style={labelStyle}>🇯🇵 Konten Jepang (Auto)</label>
                                <textarea rows="4" value={formData.excerptJP} onChange={(e) => setFormData({ ...formData, excerptJP: e.target.value })} style={{ ...inputStyle, background: '#fafafa' }} required />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={handleAutoTranslate} disabled={isTranslating} style={{ flex: 1, padding: '15px', background: 'var(--ink)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                {isTranslating ? <Loader2 className="animate-spin" /> : <Globe size={20} />}
                                {isTranslating ? 'Menerjemahkan...' : 'Translate Otomatis'}
                            </button>
                            <button type="submit" disabled={isSaving} style={{ flex: 1, padding: '15px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                {editingId ? 'Simpan Perubahan' : 'Publish Berita'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} style={{ padding: '15px', background: '#888', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                    <XCircle size={20} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 700 }}>Daftar Konten Terbit</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '12px' }}>Gambar</th>
                                    <th style={{ padding: '12px' }}>Tanggal</th>
                                    <th style={{ padding: '12px' }}>Judul Berita (ID)</th>
                                    <th style={{ padding: '12px' }}>Tag</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newsData.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Belum ada data berita.</td></tr>
                                ) : (
                                    newsData.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="thumbnail" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px', display: 'grid', placeItems: 'center', fontSize: '0.6rem', color: '#999' }}>No Img</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>{item.date}</td>
                                            <td style={{ padding: '12px', fontWeight: 600, color: 'var(--ink)' }}>{item.content.ID.title}</td>
                                            <td style={{ padding: '12px' }}><span style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontWeight: 700 }}>{item.tag}</span></td>
                                            <td style={{ padding: '12px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                                <button onClick={() => handleEditInit(item)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit3 size={18} /></button>
                                                <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={18} /></button>
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

const inputStyle = { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' };