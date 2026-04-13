import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { ArrowLeft, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function NewsDetail({ lang }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [news, setNews] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
    window.scrollTo(0, 0); 
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: 'var(--ink)' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: 'var(--red)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontWeight: 800, letterSpacing: '1px' }}>MEMUAT ARTIKEL...</span>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px', background: '#f8fafc' }}>
        <AlertCircle size={64} color="var(--red)" />
        <h2 style={{ color: '#1e293b', fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>{error}</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '12px 25px', background: 'var(--ink)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', marginTop: '10px' }}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const displayContent = (lang === 'JP' && news.content_jp?.full_body) ? news.content_jp : news.content_id;
  
  const formattedDate = new Date(news.created_at).toLocaleDateString(lang === 'JP' ? 'ja-JP' : 'id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* STICKY NAV BAR KHUSUS DETAIL BERITA */}
      <nav style={{ position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '15px 5%', zIndex: 50, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--ink)', fontWeight: 800, cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: '0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = 'var(--red)' }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink)' }}>
          <ArrowLeft size={20} /> {lang === 'JP' ? 'ニュース一覧に戻る' : 'Kembali ke Beranda'}
        </button>
      </nav>

      {/* KOTAK ARTIKEL UTAMA */}
      <main style={{ maxWidth: '900px', margin: '40px auto 0', background: 'white', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

        {/* HEADER ARTIKEL (JUDUL & METADATA) */}
        <div style={{ padding: '50px 60px 40px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
                <span style={{ background: '#fef2f2', color: 'var(--red)', padding: '6px 14px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '1px' }}>
                    <Tag size={12} strokeWidth={3} /> {news.tag || 'UMUM'}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Calendar size={14} /> {formattedDate}
                </span>
            </div>

            <h1 style={{ fontSize: '3rem', color: '#0f172a', fontWeight: 900, lineHeight: 1.2, marginBottom: '20px', fontFamily: 'var(--font-serif)', letterSpacing: '-0.5px' }}>
                {displayContent?.title || 'Judul Tidak Tersedia'}
            </h1>
            
            <p style={{ fontSize: '1.25rem', color: '#64748b', lineHeight: 1.6, fontWeight: 500, margin: 0, borderLeft: '4px solid #e2e8f0', paddingLeft: '20px' }}>
                {displayContent?.excerpt}
            </p>
        </div>

        {/* GAMBAR BANNER UTAMA */}
        {news.image_url && (
          <div style={{ width: '100%', height: '500px', background: '#f1f5f9', position: 'relative' }}>
            <img src={news.image_url} alt="Cover Berita" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* ISI BERITA (FULL BODY) DENGAN PARSER GAMBAR */}
        <article style={{ padding: '50px 60px', fontSize: '1.15rem', color: '#334155', lineHeight: 1.9, fontWeight: 400 }}>
          {displayContent?.full_body ? (
            displayContent.full_body.split('\n').map((item, index) => {
                const trimmedItem = item.trim();
                if (trimmedItem === '') return null; 

                // Deteksi format gambar markdown: ![] (URL)
                if (trimmedItem.startsWith('![](') && trimmedItem.endsWith(')')) {
                    const imageUrl = trimmedItem.match(/\((.*?)\)/)?.[1];
                    
                    if (imageUrl) {
                        return (
                            <div key={index} style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                padding: '20px 0', 
                                margin: '10px 0' 
                            }}>
                                <img 
                                    src={imageUrl} 
                                    alt={`Ilustrasi ${index}`} 
                                    style={{ 
                                        maxWidth: '100%', 
                                        height: 'auto', 
                                        borderRadius: '8px', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)' 
                                    }} 
                                />
                            </div>
                        );
                    }
                }

                // Default output teks paragraf
                return (
                    <p key={index} style={{ marginBottom: '25px', textAlign: 'justify' }}>
                        {item}
                    </p>
                );
            })
          ) : (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>Konten berita lengkap belum ditambahkan oleh administrator.</p>
          )}
        </article>

        {/* FOOTER ARTIKEL (SHARE) DENGAN TEKS */}
        <div style={{ background: '#f8fafc', padding: '30px 60px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {lang === 'JP' ? 'この記事をシェア' : 'Bagikan Artikel'}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')} style={shareTextBtnStyle}>
                    Bagikan ke Facebook
                </button>
                <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${displayContent?.title}`, '_blank')} style={shareTextBtnStyle}>
                    Bagikan ke X (Twitter)
                </button>
                <button onClick={handleCopyLink} style={{...shareTextBtnStyle, position: 'relative', background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)'}}>
                    {copied ? 'Tautan Tersalin!' : 'Salin Tautan'}
                </button>
            </div>
        </div>

      </main>
    </div>
  );
}

const shareTextBtnStyle = {
    padding: '8px 16px', borderRadius: '6px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
};