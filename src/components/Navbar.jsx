import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Lock, ChevronDown, Menu, X } from 'lucide-react';
import { t } from '../translations';

// IMPORT LOGO UJC
import logoUJC from '../assets/logo.png';

export default function Navbar({ lang, setLang }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // STATE BARU UNTUK MENU HP
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false); // STATE DROPDOWN DI HP
  const dropdownRef = useRef(null);
  const text = t[lang];
  const location = useLocation();

  // BRAND COLORS UJC
  const brandNavy = '#101869';
  const brandYellow = '#fdfb06';

  // Tutup menu mobile jika user berpindah halaman
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

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
          
          {/* TOMBOL "MITRA" DIHAPUS KARENA SMART LOGIN SUDAH MENG-COVERNYA */}
          
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
            <Lock size={12} /> {lang === 'ID' ? 'LOGIN SISTEM' : 'ログイン'}
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
            <img src={logoUJC} alt="UJC Logo" className="logo-img" />
            
            <div style={{ lineHeight: 1.1 }}>
              <h1 className="logo-text">
                {text.lpk_name || 'UNIVERSAL JAPAN COURSE'}
              </h1>
              <p className="logo-subtext">
                {text.lpk_sub || 'Japan Vocational Training'}
              </p>
            </div>
          </Link>

          {/* ── MENU DESKTOP (AKAN HILANG DI HP) ── */}
          <nav className="desktop-menu">
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
              <li><Link to="/etalase" className="nav-link">{lang === 'ID' ? 'Etalase Kandidat' : '候補者'}</Link></li>
              <li><Link to="/kontak" className="nav-link">{text.contact}</Link></li>
            </ul>
          </nav>

          {/* ── TOMBOL BAHASA (DESKTOP) ── */}
          <div className="desktop-menu" style={{ alignItems: 'center' }}>
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

          {/* ── HAMBURGER BUTTON (HANYA MUNCUL DI HP) ── */}
          <button 
            className="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: brandNavy, padding: '5px' }}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

        </div>

        {/* ── MOBILE MENU (TAMPIL KETIKA HAMBURGER DIKLIK) ── */}
        {isMobileMenuOpen && (
          <div className="mobile-menu" style={{ 
            background: 'white', borderTop: '1px solid #f1f5f9', 
            padding: '20px 5%', display: 'flex', flexDirection: 'column', gap: '15px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.05)', position: 'absolute', width: '100%', zIndex: 999
          }}>
            <Link to="/" className="mobile-nav-link">{text.home}</Link>
            
            <div 
                onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)} 
                className="mobile-nav-link" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                {lang === 'ID' ? 'Profil LPK' : '会社概要'} 
                <ChevronDown size={18} style={{ transform: isMobileDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s' }} />
            </div>

            {isMobileDropdownOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '15px', borderLeft: `2px solid ${brandYellow}`, marginLeft: '5px' }}>
                    <Link to="/visi-misi" className="mobile-nav-sublink">{lang === 'ID' ? 'Visi & Misi' : 'ビジョンとミッション'}</Link>
                    <Link to="/latar-belakang" className="mobile-nav-sublink">{lang === 'ID' ? 'Latar Belakang' : '沿革'}</Link>
                    <Link to="/legalitas" className="mobile-nav-sublink">{lang === 'ID' ? 'Legalitas' : '法人認可'}</Link>
                </div>
            )}

            <Link to="/program" className="mobile-nav-link">{text.program}</Link>
            <Link to="/etalase" className="mobile-nav-link">{lang === 'ID' ? 'Etalase Kandidat' : '候補者'}</Link>
            <Link to="/kontak" className="mobile-nav-link">{text.contact}</Link>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginTop: '5px' }}>
                <button 
                  onClick={() => {
                      setLang(lang === 'ID' ? 'JP' : 'ID');
                      setIsMobileMenuOpen(false);
                  }}
                  style={{ 
                    background: brandNavy, border: 'none', width: '100%', justifyContent: 'center',
                    borderRadius: '8px', padding: '12px', fontSize: '0.9rem', 
                    fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', 
                    cursor: 'pointer', color: 'white'
                  }}
                >
                  <Globe size={18} color={brandYellow} /> {lang === 'ID' ? 'Ubah ke Bahasa Jepang (JP)' : 'インドネシア語に変更 (ID)'}
                </button>
            </div>
          </div>
        )}
      </header>

      {/* ── STYLING KHUSUS DENGAN MEDIA QUERIES ── */}
      <style>{`
        .topbar-link { color: rgba(255,255,255,0.8); text-decoration: none; transition: 0.2s; }
        .topbar-link:hover { color: #fdfb06; }
        
        .nav-link { color: #1e293b; text-decoration: none; transition: 0.2s; }
        .nav-link:hover { color: #101869; }
        
        .dropdown-link { display: block; padding: 12px 20px; text-decoration: none; color: #334155; font-size: 0.85rem; font-weight: 600; transition: all 0.2s ease; }
        .dropdown-link:hover { background: #f8fafc; color: #101869; padding-left: 25px; border-left: 3px solid #fdfb06; }
        
        .mobile-nav-link { color: #1e293b; text-decoration: none; font-weight: 700; font-size: 1rem; padding: 8px 0; display: block; cursor: pointer; }
        .mobile-nav-sublink { color: #475569; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 5px 0; display: block; }

        .logo-img { height: 45px; object-fit: contain; }
        .logo-text { font-family: var(--font-serif); font-size: 1.3rem; font-weight: 800; color: #101869; margin: 0; letter-spacing: 0.5px; }
        .logo-subtext { font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; margin: 0; }

        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* ── MEDIA QUERIES UNTUK HP (MOBILE RESPONSIVE) ── */
        .mobile-toggle { display: none; }

        @media (max-width: 768px) {
            .desktop-menu { display: none !important; }
            .mobile-toggle { display: block; }
            
            /* Mengecilkan logo sedikit saat di HP */
            .logo-img { height: 35px; }
            .logo-text { font-size: 1rem; }
            .logo-subtext { font-size: 0.5rem; letter-spacing: 0.1em; }
        }
      `}</style>
    </>
  );
}