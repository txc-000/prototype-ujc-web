import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { ArrowLeft, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function NewsDetail({ lang }) {
  const { id } = useParams(); // Mengambil ID dari URL (/berita/:id)
  const navigate = useNavigate();
  
  const [news, setNews] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ambil data spesifik 1 berita dari database
    const fetchNewsDetail = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setNews(data);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Berita tidak ditemukan atau telah dihapus.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewsDetail();
    window.scrollTo(0, 0); // Pastikan layar mulai dari atas saat dibuka
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#101869', fontWeight: 800 }}>
        Memuat konten berita...
      </div>
    );
  }

  if (error || !news) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <AlertCircle size={48} color="#ef4444" />
        <h2 style={{ color: '#1e293b' }}>{error}</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#101869', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Menentukan konten berdasarkan bahasa (Fallback ke ID jika JP kosong)
  const displayContent = (lang === 'JP' && news.content_jp?.full_body) ? news.content_jp : news.content_id;
  
  const formattedDate = new Date(news.created_at).toLocaleDateString(lang === 'JP' ? 'ja-JP' : 'id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', paddingTop: '40px' }}>
      
      {/* KOTAK ARTIKEL UTAMA */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '50px', background: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>

        {/* TOMBOL KEMBALI */}
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#101869', fontWeight: 700, cursor: 'pointer', marginBottom: '30px', padding: 0, fontSize: '1rem', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#101869'}>
          <ArrowLeft size={20} /> {lang === 'JP' ? '戻る' : 'Kembali'}
        </button>

        {/* TAG & TANGGAL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ background: '#fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Tag size={14} /> {news.tag || 'Umum'}
          </span>
          <span style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
            <Calendar size={14} /> {formattedDate}
          </span>
        </div>

        {/* JUDUL BERITA */}
        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', fontWeight: 900, lineHeight: 1.3, marginBottom: '30px', fontFamily: 'var(--font-serif)' }}>
          {displayContent?.title || 'Judul Tidak Tersedia'}
        </h1>

        {/* GAMBAR BERITA */}
        {news.image_url && (
          <div style={{ width: '100%', height: 'auto', maxHeight: '450px', borderRadius: '12px', overflow: 'hidden', marginBottom: '40px', background: '#f1f5f9' }}>
            <img src={news.image_url} alt="Cover Berita" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* ISI BERITA (FULL BODY) */}
        <div style={{ fontSize: '1.1rem', color: '#334155', lineHeight: 1.8 }}>
          {displayContent?.full_body ? (
            // Memisahkan paragraf berdasarkan tombol 'Enter' dari database
            displayContent.full_body.split('\n').map((paragraph, index) => (
              <p key={index} style={{ marginBottom: '20px', textAlign: 'justify' }}>
                {paragraph}
              </p>
            ))
          ) : (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Konten berita lengkap belum ditambahkan.</p>
          )}
        </div>

      </main>
    </div>
  );
}