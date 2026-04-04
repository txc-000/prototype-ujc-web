import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Lock, ChevronDown } from 'lucide-react';
import { t } from '../translations';

// IMPORT LOGO UJC
import logoUJC from '../assets/logo.png';

export default function Navbar({ lang, setLang }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const text = t[lang];

  // BRAND COLORS UJC
  const brandNavy = '#101869';
  const brandYellow = '#fdfb06';

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
      {/* ── 1. TOPBAR (Akses Utilitas & Portal) ── */}
      <div style={{ 
        background: brandNavy, color: 'white', fontSize: '0.75rem', 
        padding: '0.6rem 5%', display: 'flex', justifyContent: 'flex-end', 
        alignItems: 'center', position: 'relative', zIndex: 1100 
      }}>
        {/* Kumpulan Akses Internal & Portal */}
        <div style={{ display: 'flex', gap: '20px', fontWeight: 700, alignItems: 'center' }}>
          <Link to="/mitra" className="topbar-link">
            {lang === 'ID' ? 'MITRA' : 'パートナー'}
          </Link>
          <Link to="/portal-pegawai" className="topbar-link">
            {lang === 'ID' ? 'PEGAWAI' : 'スタッフ'}
          </Link>
          <Link to="/login" style={{ 
            background: brandYellow, 
            color: brandNavy, 
            padding: '6px 14px', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 800,
            boxShadow: `0 4px 10px rgba(253, 251, 6, 0.2)`,
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <Lock size={12} /> {lang === 'ID' ? 'LOGIN SISWA' : '学生ログイン'}
          </Link>
        </div>
      </div>

      {/* ── 2. MAIN NAVBAR (Navigasi Publik) ── */}
      <header style={{ 
        background: 'white', 
        borderBottom: `3px solid ${brandYellow}`, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
        position: 'sticky', 
        top: 0, zIndex: 1000 
      }}>
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '1rem 5%', maxWidth: '1400px', margin: '0 auto' 
        }}>
          
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
            {/* LOGO UJC */}
            <img src={logoUJC} alt="UJC Logo" style={{ height: '45px', objectFit: 'contain' }} />
            
            <div style={{ lineHeight: 1.1 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, color: brandNavy, margin: 0, letterSpacing: '0.5px' }}>
                {text.lpk_name || 'UNIVERSAL JAPAN COURSE'}
              </h1>
              <p style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, margin: 0 }}>
                {text.lpk_sub || 'Japan Vocational Training'}
              </p>
            </div>
          </Link>

          <nav>
            <ul style={{ 
              display: 'flex', gap: '2rem', listStyle: 'none', 
              alignItems: 'center', fontSize: '0.85rem', fontWeight: 700, margin: 0, padding: 0 
            }}>
              <li><Link to="/" className="nav-link">{text.home}</Link></li>
              
              <li 
                ref={dropdownRef}
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative', cursor: 'pointer', padding: '10px 0' }}
              >
                <div className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {lang === 'ID' ? 'Profil LPK' : '会社概要'} <ChevronDown size={14} />
                </div>

                {isDropdownOpen && (
                  <ul style={{ 
                    position: 'absolute', top: '100%', left: '-10px', background: 'white', 
                    minWidth: '220px', listStyle: 'none', padding: '10px 0', margin: 0,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderTop: `3px solid ${brandNavy}`,
                    borderRadius: '0 0 8px 8px', animation: 'fadeInDown 0.2s ease-out'
                  }}>
                    <li><Link to="/visi-misi" className="dropdown-link">{lang === 'ID' ? 'Visi & Misi' : 'ビジョンとミッション'}</Link></li>
                    <li><Link to="/latar-belakang" className="dropdown-link">{lang === 'ID' ? 'Latar Belakang' : '沿革'}</Link></li>
                    <li><Link to="/legalitas" className="dropdown-link">{lang === 'ID' ? 'Legalitas' : '法人認可'}</Link></li>
                  </ul>
                )}
              </li>

              <li><Link to="/program" className="nav-link">{text.program}</Link></li>
              <li><Link to="/kontak" className="nav-link">{text.contact}</Link></li>
            </ul>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Tombol Ganti Bahasa */}
            <button 
              onClick={() => setLang(lang === 'ID' ? 'JP' : 'ID')}
              style={{ 
                background: brandNavy, border: 'none', 
                borderRadius: '20px', padding: '0.5rem 1.2rem', fontSize: '0.8rem', 
                fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', 
                cursor: 'pointer', color: 'white', transition: '0.2s',
                boxShadow: '0 2px 5px rgba(16,24,105,0.2)'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
              onMouseLeave={e => e.currentTarget.style.opacity = 1}
            >
              <Globe size={14} color={brandYellow} /> {lang === 'ID' ? '🇯🇵 JP' : '🇮🇩 ID'}
            </button>
          </div>
        </div>
      </header>

      {/* ── STYLING KHUSUS (HOVER) ── */}
      <style>{`
        .topbar-link { color: rgba(255,255,255,0.8); text-decoration: none; transition: 0.2s; }
        .topbar-link:hover { color: #fdfb06; }
        
        .nav-link { color: #1e293b; text-decoration: none; transition: 0.2s; }
        .nav-link:hover { color: #101869; }
        
        .dropdown-link { display: block; padding: 12px 20px; text-decoration: none; color: #334155; font-size: 0.85rem; font-weight: 600; transition: all 0.2s ease; }
        .dropdown-link:hover { background: #f8fafc; color: #101869; padding-left: 25px; border-left: 3px solid #fdfb06; }
        
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}