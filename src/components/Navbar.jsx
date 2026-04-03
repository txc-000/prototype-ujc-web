import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Lock, ChevronDown } from 'lucide-react';
import { t } from '../translations';

export default function Navbar({ lang, setLang }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const text = t[lang];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <>
      {/* ── 1. TOPBAR (Hanya Akses Utilitas & Portal) ── */}
      <div style={{ 
        background: 'var(--ink)', color: 'var(--mist)', fontSize: '0.75rem', 
        padding: '0.6rem 5%', display: 'flex', justifyContent: 'flex-end', 
        alignItems: 'center', position: 'relative', zIndex: 1100 
      }}>
        {/* Kumpulan Akses Internal & Portal */}
        <div style={{ display: 'flex', gap: '20px', fontWeight: 600, alignItems: 'center' }}>
          <Link to="/mitra" style={{ color: 'var(--mist)', textDecoration: 'none', transition: '0.2s' }}>
            {lang === 'ID' ? 'MITRA' : 'パートナー'}
          </Link>
          <Link to="/portal-pegawai" style={{ color: 'var(--mist)', textDecoration: 'none', transition: '0.2s' }}>
            {lang === 'ID' ? 'PEGAWAI' : 'スタッフ'}
          </Link>
          <Link to="/alumni" style={{ color: 'var(--mist)', textDecoration: 'none', transition: '0.2s' }}>
            {lang === 'ID' ? 'ALUMNI' : '卒業生'}
          </Link>
          <Link to="/login" style={{ 
            background: 'var(--red)', 
            color: 'var(--white)', 
            padding: '5px 12px', 
            borderRadius: '4px', 
            textDecoration: 'none',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 10px rgba(198,40,40,0.3)',
            transition: '0.2s'
          }}>
            <Lock size={12} /> {lang === 'ID' ? 'LOGIN SISWA' : '学生ログイン'}
          </Link>
        </div>
      </div>

      {/* ── 2. MAIN NAVBAR (Navigasi Publik) ── */}
      <header style={{ 
        background: 'var(--white)', borderBottom: '2px solid var(--red)', 
        boxShadow: '0 4px 20px var(--shadow)', position: 'sticky', 
        top: 0, zIndex: 1000 
      }}>
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '1rem 5%', maxWidth: '1400px', margin: '0 auto' 
        }}>
          
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
            <div style={{ 
              width: '45px', height: '45px', borderRadius: '50%', background: 'var(--red)', 
              color: 'var(--white)', display: 'grid', placeItems: 'center', 
              fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700 
            }}>桜</div>
            <div style={{ lineHeight: 1.1 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                {text.lpk_name || 'Universal Japan Course'}
              </h1>
              <p style={{ fontSize: '0.65rem', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, margin: 0 }}>
                {text.lpk_sub || 'Japan Vocational Training'}
              </p>
            </div>
          </Link>

          <nav>
            <ul style={{ 
              display: 'flex', gap: '2rem', listStyle: 'none', 
              alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, margin: 0, padding: 0 
            }}>
              <li><Link to="/" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{text.home}</Link></li>
              
              <li 
                ref={dropdownRef}
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative', cursor: 'pointer', padding: '10px 0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ink)' }}>
                  {lang === 'ID' ? 'Profil LPK' : '会社概要'} <ChevronDown size={14} />
                </div>

                {isDropdownOpen && (
                  <ul style={{ 
                    position: 'absolute', top: '100%', left: '-10px', background: 'white', 
                    minWidth: '220px', listStyle: 'none', padding: '10px 0', margin: 0,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderTop: '3px solid var(--red)',
                    borderRadius: '0 0 8px 8px', animation: 'fadeInDown 0.2s ease-out'
                  }}>
                    <li><Link to="/visi-misi" className="dropdown-link">{lang === 'ID' ? 'Visi & Misi' : 'ビジョンとミッション'}</Link></li>
                    <li><Link to="/latar-belakang" className="dropdown-link">{lang === 'ID' ? 'Latar Belakang' : '沿革'}</Link></li>
                    <li><Link to="/legalitas" className="dropdown-link">{lang === 'ID' ? 'Legalitas' : '法人認可'}</Link></li>
                  </ul>
                )}
              </li>

              <li><Link to="/program" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{text.program}</Link></li>
              <li><Link to="/kontak" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{text.contact}</Link></li>
            </ul>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => setLang(lang === 'ID' ? 'JP' : 'ID')}
              style={{ 
                background: 'var(--cream)', border: '1px solid var(--mist)', 
                borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.8rem', 
                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', 
                cursor: 'pointer', color: 'var(--ink)', transition: '0.2s'
              }}
            >
              <Globe size={14} /> {lang === 'ID' ? '🇯🇵 JP' : '🇮🇩 ID'}
            </button>
          </div>
        </div>
      </header>

      <style>{`
        .dropdown-link { display: block; padding: 12px 20px; text-decoration: none; color: var(--ink); font-size: 0.85rem; font-weight: 500; transition: all 0.2s ease; }
        .dropdown-link:hover { background: var(--cream); color: var(--red); padding-left: 25px; }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}