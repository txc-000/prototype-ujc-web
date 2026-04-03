import { t } from '../translations';
import NewsSection from '../components/NewsSection';

export default function Home({ lang, newsData }) {
  const text = t[lang];

  return (
    <>
      {/* ── 1. HERO SECTION (INDUSTRIAL BANNER) ── */}
      <section style={{ 
        position: 'relative', 
        minHeight: '85vh', 
        display: 'flex', 
        alignItems: 'center', 
        background: 'var(--ink)', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to right, rgba(26,18,16,0.95) 0%, rgba(26,18,16,0.4) 100%), url("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80") center/cover' 
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{ color: 'var(--white)', maxWidth: '850px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--red-light)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 500 }}>
              {text.hero_tag || "未来を創る"}
            </div>
            
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '4.8rem', fontWeight: 600, lineHeight: 1.1, marginBottom: '1.5rem' }}>
              {text.hero_title}<br/>
              <em style={{ color: 'var(--red-light)', fontStyle: 'italic' }}>{text.hero_title_em}</em>
            </h1>
            
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.85)', maxWidth: '700px', marginBottom: '3.5rem', lineHeight: 1.8 }}>
              {text.hero_desc}
            </p>

            <div style={{ display: 'flex', gap: '20px' }}>
              <button style={{ background: 'var(--red)', color: 'white', padding: '1.2rem 2.5rem', borderRadius: '4px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(198,40,40,0.3)' }}>
                {lang === 'ID' ? 'Daftar Sekarang' : '今すぐ登録'}
              </button>
              <button style={{ background: 'transparent', color: 'white', padding: '1.2rem 2.5rem', borderRadius: '4px', border: '2px solid white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                {lang === 'ID' ? 'Lihat Program' : 'プログラムを見る'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. QUICK STATS ── */}
      <section style={{ background: 'var(--red)', color: 'var(--white)', padding: '3.5rem 5%', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 700 }}>1,250+</div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', opacity: 0.9, textTransform: 'uppercase' }}>{text.stat_alumni}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 700 }}>95%</div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', opacity: 0.9, textTransform: 'uppercase' }}>{text.stat_jlpt}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 700 }}>45+</div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', opacity: 0.9, textTransform: 'uppercase' }}>{text.stat_mitra}</div>
        </div>
      </section>

      {/* ── 3. PROGRAM SECTION ── */}
      <section style={{ padding: '80px 5%', background: '#fcfcfc', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--ink)', marginBottom: '15px' }}>
              {lang === 'ID' ? 'Program Pelatihan & Penempatan' : '研修および配置プログラム'}
            </h2>
            <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
              {lang === 'ID' ? 'Pilih jalur yang paling sesuai untuk membangun masa depan dan karir profesional Anda di Jepang.' : '日本でのプロフェッショナルな未来とキャリアを築くために最適なパスを選択してください。'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            
            {/* Tokutei Ginou */}
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', borderTop: '4px solid var(--red)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--ink)', marginBottom: '15px' }}>Tokutei Ginou (SSW)</h3>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '20px', fontSize: '0.95rem' }}>
                {lang === 'ID' ? 'Program visa kerja untuk tenaga ahli spesifik dengan standar gaji, bonus, dan hak setara pekerja lokal Jepang.' : '日本の現地労働者と同等の給与基準、ボーナス、権利を持つ、特定技能労働者向けの就労ビザプログラム。'}
              </p>
              <ul style={{ color: '#555', paddingLeft: '20px', lineHeight: 1.8, fontSize: '0.9rem' }}>
                <li>Konstruksi (Tobi, Bekisting, dll)</li>
                <li>Manufaktur (Pengolahan Logam)</li>
                <li>Perhotelan / Restoran</li>
                <li>Pertanian / Perkebunan</li>
              </ul>
            </div>

            {/* Magang */}
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', borderTop: '4px solid var(--ink)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--ink)', marginBottom: '15px' }}>Program Magang Kenshusei</h3>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '20px', fontSize: '0.95rem' }}>
                {lang === 'ID' ? 'Program pemagangan teknis ke Jepang untuk mempelajari keterampilan secara langsung sambil bekerja dan mendapatkan uang saku.' : '働きながら手当をもらい、実践的にスキルを学ぶための日本への技能実習プログラム。'}
              </p>
              <ul style={{ color: '#555', paddingLeft: '20px', lineHeight: 1.8, fontSize: '0.9rem' }}>
                <li>Kontrak 3 hingga 5 tahun</li>
                <li>Fasilitas Asrama disediakan</li>
                <li>Sertifikasi Resmi JITCO/OTIT</li>
                <li>Dukungan dan monitoring penuh LPK</li>
              </ul>
            </div>

            {/* Kelas Bahasa */}
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', borderTop: '4px solid #3b82f6', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--ink)', marginBottom: '15px' }}>Kelas Bahasa Jepang</h3>
              <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '20px', fontSize: '0.95rem' }}>
                {lang === 'ID' ? 'Kelas persiapan bahasa Jepang komprehensif dari nol hingga menguasai level N4 / JFT Basic sebagai syarat bekerja.' : '就労の条件であるN4 / JFT Basicレベルを習得するための、ゼロからの総合的な日本語準備クラス。'}
              </p>
              <ul style={{ color: '#555', paddingLeft: '20px', lineHeight: 1.8, fontSize: '0.9rem' }}>
                <li>Sensei (Pengajar) Berpengalaman</li>
                <li>Materi lengkap dan aplikatif</li>
                <li>Simulasi Wawancara Kerja</li>
                <li>Try Out JLPT & JFT Berkala</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. KOMPONEN BERITA ── */}
      <NewsSection lang={lang} newsData={newsData || []} />
    </>
  );
}