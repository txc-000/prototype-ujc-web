import { Link } from 'react-router-dom';

export default function NewsSection({ lang, newsData }) {
  const labels = {
    ID: { 
      title: "Berita & Pengumuman", 
      sub: "Informasi terbaru dari Universal Japan Course", 
      btn: "Baca Selengkapnya",
      empty: "Belum ada berita yang diterbitkan.",
      older: "Berita Terdahulu"
    },
    JP: { 
      title: "ニュースと発表", 
      sub: "ユニバーサル・ジャパン・コースからの最新情報", 
      btn: "続きを読む",
      empty: "公開されたニュースはありません。",
      older: "過去のニュース"
    }
  };

  const content = labels[lang] || labels['ID'];

  if (!newsData || newsData.length === 0) {
    return (
      <div style={{ padding: '100px 5%', textAlign: 'center', color: '#888' }}>
        <p>{content.empty}</p>
      </div>
    );
  }

  // PISAHKAN DATA: 3 Terbaru untuk Card Grid, sisanya untuk List memanjang
  const topNews = newsData.slice(0, 3);
  const olderNews = newsData.slice(3);

  return (
    <section style={{ padding: '80px 5%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <div style={{ borderLeft: '5px solid var(--red)', paddingLeft: '20px', marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--ink)', marginBottom: '10px' }}>
          {content.title}
        </h2>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>{content.sub}</p>
      </div>

      {/* 3 BERITA TERBARU: BENTUK CARD (GRID) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '30px',
        marginBottom: olderNews.length > 0 ? '50px' : '0' 
      }}>
        {topNews.map((news) => {
          const activeContent = news.content[lang] || news.content['ID'];
          return (
            <div key={news.id} style={{ 
              background: 'var(--white)', border: '1px solid var(--mist)', borderRadius: '12px', 
              overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s', display: 'flex', flexDirection: 'column'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              
              <div style={{ height: '220px', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
                {news.image_url ? (
                  <img src={news.image_url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', opacity: 0.2 }}>🌸</div>
                )}
                <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'var(--red)', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {news.tag}
                </div>
              </div>
              
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px', fontWeight: 500 }}>📅 {news.date}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--ink)', marginBottom: '12px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {activeContent.title}
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
                  {activeContent.excerpt}
                </p>
                <button style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}>
                  {content.btn} →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BERITA TERDAHULU: BENTUK LIST MEMANJANG KE BAWAH */}
      {olderNews.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--ink)', borderBottom: '2px solid var(--mist)', paddingBottom: '15px', marginBottom: '25px' }}>
            {content.older}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {olderNews.map((news) => {
              const activeContent = news.content[lang] || news.content['ID'];
              return (
                <div key={news.id} style={{ 
                  display: 'flex', gap: '20px', background: 'var(--white)', padding: '15px', 
                  borderRadius: '10px', border: '1px solid #eee', alignItems: 'center', transition: 'all 0.2s' 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.background = 'var(--white)'; }}>
                  
                  {/* Thumbnail List */}
                  <div style={{ width: '130px', height: '90px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', background: '#eee', position: 'relative' }}>
                    {news.image_url ? (
                      <img src={news.image_url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', opacity: 0.2 }}>🌸</div>
                    )}
                  </div>

                  {/* Konten List */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.65rem', background: '#f0f0f0', color: '#555', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.05em' }}>
                        {news.tag}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>📅 {news.date}</span>
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--ink)', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeContent.title}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeContent.excerpt}
                    </p>
                  </div>
                  
                  {/* Tombol Baca (Desktop Only) */}
                  <div style={{ padding: '0 10px', display: 'none' }} className="read-more-btn">
                    <span style={{ color: 'var(--red)', fontSize: '1.2rem' }}>→</span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </section>
  );
}