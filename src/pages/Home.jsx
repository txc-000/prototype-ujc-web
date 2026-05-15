import { t } from '../translations';
import NewsSection from '../components/NewsSection';
import { useNavigate } from 'react-router-dom';
import { LogIn, Users } from 'lucide-react'; 

// IMPORT LOGO SECARA LANGSUNG (Pastikan file logo.png ada di folder src/assets/)
import logoUJC from '../assets/logo.png';

export default function Home({ lang, newsData }) {
  const text = t[lang];
  const navigate = useNavigate();

  // BRAND COLORS UJC
  const brandNavy = '#101869';
  const brandYellow = '#fdfb06';

  return (
    <>
      {/* ── 1. HERO SECTION & NAVBAR ── */}
      <section style={{ 
        position: 'relative', 
        minHeight: '85vh', 
        display: 'flex', 
        alignItems: 'center', 
        background: brandNavy,
        overflow: 'hidden' 
      }}>
        {/* Background Image Overlay */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: `linear-gradient(to right, rgba(16,24,105,0.95) 0%, rgba(16,24,105,0.4) 100%), url("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80") center/cover` 
        }}></div>
        
        {/* ── NAVBAR (LOGO & TOMBOL LOGIN) ── */}
        <nav style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', 
          padding: '25px 5%', zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src={logoUJC} alt="UJC Logo" style={{ height: '55px', objectFit: 'contain' }} />
            <div style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              UNIVERSAL JAPAN COURSE
            </div>
          </div>

          {/* Tombol Login Baru */}
          <button 
            onClick={() => navigate('/login')}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)',
                padding: '8px 16px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer',
                transition: '0.3s'
            }}
          >
            <LogIn size={18} /> Login Sistem
          </button>
        </nav>
        
        {/* ── HERO KONTEN ── */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '80px 5% 0' }}>
          <div style={{ color: 'white', maxWidth: '850px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: brandYellow,
              letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>
              {text.hero_tag || "未来を創る"}
            </div>
            
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '4.8rem', fontWeight: 600, lineHeight: 1.1, marginBottom: '1.5rem', color: 'white' }}>
              {text.hero_title}<br/>
              <em style={{ color: brandYellow, fontStyle: 'italic' }}>{text.hero_title_em}</em>
            </h1>
            
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', maxWidth: '700px', marginBottom: '3.5rem', lineHeight: 1.8 }}>
              {text.hero_desc}
            </p>

            {/* ── GRUP TOMBOL CTA ── */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <button style={{ background: brandYellow, color: brandNavy, padding: '1.2rem 2.5rem', borderRadius: '4px', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: `0 10px 30px rgba(253, 251, 6, 0.3)` }}>
                {lang === 'ID' ? 'Daftar Sekarang' : '今すぐ登録'}
              </button>
              
              <button style={{ background: 'transparent', color: brandYellow, padding: '1.2rem 2.5rem', borderRadius: '4px', border: `2px solid ${brandYellow}`, fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
                {lang === 'ID' ? 'Lihat Program' : 'プログラムを見る'}
              </button>
              
              {/* ── TOMBOL ETALASE KANDIDAT ── */}
              <button 
                onClick={() => navigate('/etalase')}
                style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', color: 'white', padding: '1.2rem 2.5rem', 
                    borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.3)', fontWeight: 800, 
                    fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                    backdropFilter: 'blur(5px)', transition: 'all 0.3s ease'
                }}
              >
                <Users size={20} />
                {lang === 'ID' ? 'Etalase Kandidat' : '候補者ショーケース'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. QUICK STATS ── */}
      <section style={{ background: '#0a0f44', color: brandYellow,
        padding: '3.5rem 5%', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem', borderBottom: `2px solid ${brandYellow}` }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 900 }}>1,250+</div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', color: 'white', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600 }}>{text.stat_alumni}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 900 }}>95%</div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', color: 'white', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600 }}>{text.stat_jlpt}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 900 }}>45+</div>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', color: 'white', opacity: 0.9, textTransform: 'uppercase', fontWeight: 600 }}>{text.stat_mitra}</div>
        </div>
      </section>

      {/* ── 3. PROGRAM SECTION ── */}
      <section style={{ padding: '80px 5%', background: '#f8fafc', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.8rem', color: brandNavy,
              marginBottom: '15px', fontWeight: 700 }}>
              {lang === 'ID' ? 'Program Pelatihan & Penempatan' : '研修および配置プログラム'}
            </h2>
            <p style={{ color: '#475569', fontSize: '1.15rem', maxWidth: '750px', margin: '0 auto', lineHeight: 1.7 }}>
              {lang === 'ID' ? 'Pilih jalur yang paling sesuai untuk membangun masa depan dan karir profesional Anda di Jepang.' : '日本でのプロフェッショナルな未来とキャリアを築くために最適なパスを選択してください。'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', borderTop: `6px solid ${brandYellow}`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.04)', transition: '0.3s' }}>
              <h3 style={{ fontSize: '1.5rem', color: brandNavy, marginBottom: '15px', fontWeight: 800 }}>Tokutei Ginou (SSW)</h3>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '25px', fontSize: '0.95rem' }}>
                {lang === 'ID' ? 'Program visa kerja untuk tenaga ahli spesifik dengan standar gaji, bonus, dan hak setara pekerja lokal Jepang.' : '日本の現地労働者と同等の給与基準、ボーナス、権利を持つ、特定技能労働者向けの就労ビザプログラム。'}
              </p>
              <ul style={{ color: '#334155', paddingLeft: '20px', lineHeight: 1.9, fontSize: '0.9rem', fontWeight: 500 }}>
                <li>Konstruksi (Tobi, Bekisting, dll)</li>
                <li>Manufaktur (Pengolahan Logam)</li>
                <li>Perhotelan / Restoran</li>
                <li>Pertanian / Perkebunan</li>
              </ul>
            </div>

            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', borderTop: `6px solid ${brandNavy}`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.04)', transition: '0.3s' }}>
              <h3 style={{ fontSize: '1.5rem', color: brandNavy, marginBottom: '15px', fontWeight: 800 }}>Program Magang Kenshusei</h3>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '25px', fontSize: '0.95rem' }}>
                {lang === 'ID' ? 'Program pemagangan teknis ke Jepang untuk mempelajari keterampilan secara langsung sambil bekerja dan mendapatkan uang saku.' : '働きながら手当をもらい、実践的にスキルを学ぶための日本への技能実習プログラム。'}
              </p>
              <ul style={{ color: '#334155', paddingLeft: '20px', lineHeight: 1.9, fontSize: '0.9rem', fontWeight: 500 }}>
                <li>Kontrak 3 hingga 5 tahun</li>
                <li>Fasilitas Asrama disediakan</li>
                <li>Sertifikasi Resmi JITCO/OTIT</li>
                <li>Dukungan dan monitoring penuh LPK</li>
              </ul>
            </div>

            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', borderTop: `6px solid ${brandNavy}`,
               boxShadow: '0 10px 40px rgba(0,0,0,0.04)', transition: '0.3s' }}>
              <h3 style={{ fontSize: '1.5rem', color: brandNavy, marginBottom: '15px', fontWeight: 800 }}>Kelas Bahasa Jepang</h3>
              <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '25px', fontSize: '0.95rem' }}>
                {lang === 'ID' ? 'Kelas persiapan bahasa Jepang komprehensif dari nol hingga menguasai level N4 / JFT Basic sebagai syarat bekerja.' : '就労の条件であるN4 / JFT Basicレベルを習得するための、ゼロからの総合的な日本語準備クラス。'}
              </p>
              <ul style={{ color: '#334155', paddingLeft: '20px', lineHeight: 1.9, fontSize: '0.9rem', fontWeight: 500 }}>
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