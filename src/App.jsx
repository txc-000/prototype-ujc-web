import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VisiMisi from './pages/About/VisiMisi';
import LatarBelakang from './pages/About/LatarBelakang';
import Legalitas from './pages/About/Legalitas';
import AdminGate from './pages/AdminGate';

// ── IMPORT KOMPONEN BERITA ──
import NewsDetail from './pages/News/NewsDetail';

// ── IMPORT KOMPONEN PUBLIK BARU ──
import EtalaseKandidat from './pages/Public/EtalaseKandidat';

// ── IMPORT KOMPONEN AUTH ──
import LoginPage from './pages/Auth/LoginPage';
import UbahPassword from './pages/Auth/UbahPassword'; 

// ── IMPORT KOMPONEN DIVISI (SOP BARU) ──
import DashboardReguler from './pages/Reguler/DashboardReguler';
import DashboardRekrutmen from './pages/Rekrutmen/DashboardRekrutmen';
import DashboardDokumen from './pages/Dokumen/DashboardDokumen';
import DashboardPendidikan from './pages/Pendidikan/DashboardPendidikan';
import DashboardAdministrasi from './pages/Administrasi/DashboardAdministrasi';

// ── IMPORT KOMPONEN SUPERVISOR, DIREKTUR, & SUPER ADMIN ──
import DashboardSupervisor from './pages/Supervisor/DashboardSupervisor';
import DashboardDirektur from './pages/Direktur/DashboardDirektur';
import DashboardSuperAdmin from './pages/AdminGate/DashboardSuperAdmin';

// ── IMPORT KOMPONEN ALUMNI ──
import DashboardAlumni from './pages/Alumni/DashboardAlumni';

// ── IMPORT KOMPONEN MITRA ──
import DashboardMitra from './pages/Mitra/DashboardMitra';

// ── IMPORT KOMPONEN CETAK CV ──
import PrintRirekisho from './components/PrintRirekisho'; 

// ── IMPORT KOMPONEN NOTIFIKASI GLOBAL ──
import NotificationAlert from './components/NotificationAlert';

function ProtectedRoute({ userRole, allowedRoles, children }) {
  if (!userRole) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(userRole) && userRole !== 'SUPER ADMIN') return <Navigate to="/unauthorized" replace />;
  return children;
}

function AppContent() {
  const [lang, setLang] = useState('ID');
  const [newsData, setNewsData] = useState([]);
  const location = useLocation();

  // ── STATE AUTH DINAMIS (REAL DATABASE) ──
  const [userRole, setUserRole] = useState(null); 
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ── LISTENER OTENTIKASI ──
  useEffect(() => {
    const fetchSessionRole = async (session) => {
      if (session) {
        // 1. Cek apakah user adalah Pegawai Internal
        const { data: emp } = await supabase
          .from('employees')
          .select('master_role(nama_role)')
          .eq('id', session.user.id)
          .maybeSingle(); 
        
        if (emp && emp.master_role) {
          setUserRole(emp.master_role.nama_role.toUpperCase());
          setIsAuthLoading(false);
          return;
        }

        // 2. Jika bukan pegawai, cek apakah user adalah Mitra
        const { data: mitra } = await supabase
          .from('master_mitra_lokal')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (mitra) {
          setUserRole('MITRA');
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setIsAuthLoading(false);
    };

    // Cek sesi saat pertama kali dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionRole(session);
    });

    // Dengarkan perubahan sesi (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      fetchSessionRole(session);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      if (data) {
        setNewsData(data.map(item => ({
            id: item.id,
            date: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            tag: item.tag, image_url: item.image_url, content: { ID: item.content_id, JP: item.content_jp }
        })));
      }
    } catch (err) { console.error(err.message); }
  }, []);

  useEffect(() => { fetchNews(); }, [location.pathname, fetchNews]);

  // Sesuaikan pengecualian rute sistem dengan SOP baru.
  // URL '/etalase' TIDAK dimasukkan ke sini agar Navbar utama tetap muncul di halaman tersebut.
  const isSystemRoute = ['/reguler', '/rekrutmen', '/administrasi', '/dokumen', '/pendidikan', '/supervisor', '/direktur', '/superadmin', '/alumni', '/print-cv', '/login', '/ubah-password', '/mitra'].some(route => location.pathname.startsWith(route));

  // Pengecualian tambahan: Jangan tampilkan loading screen saat di halaman login atau ubah password
  if (isAuthLoading && isSystemRoute && location.pathname !== '/login' && location.pathname !== '/ubah-password') {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#101869', fontWeight: 800 }}>Memeriksa Akses...</div>;
  }

  return (
    <>
      {!isSystemRoute && <Navbar lang={lang} setLang={setLang} />}
      
      {/* ── NOTIFIKASI POP-UP GLOBAL AKAN MUNCUL DI SINI ── */}
      <NotificationAlert />

      <main>
        <Routes>
          {/* ── RUTE PUBLIK ── */}
          <Route path="/" element={<Home lang={lang} newsData={newsData} />} />
          <Route path="/visi-misi" element={<VisiMisi lang={lang} />} />
          <Route path="/latar-belakang" element={<LatarBelakang lang={lang} />} />
          <Route path="/legalitas" element={<Legalitas lang={lang} />} />
          <Route path="/ujc-admin-gate-2026" element={<AdminGate newsData={newsData} setNewsData={setNewsData} lang={lang} />} />
          <Route path="/berita/:id" element={<NewsDetail lang={lang} />} /> 
          <Route path="/etalase" element={<EtalaseKandidat lang={lang} setLang={setLang} />} /> 

          {/* ── RUTE AUTHENTICATION ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ubah-password" element={<UbahPassword />} /> 

          {/* ── RUTE COMMAND CENTER SUPER ADMIN ── */}
          <Route path="/superadmin/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPER ADMIN']}><DashboardSuperAdmin /></ProtectedRoute>} />

          {/* ── RUTE DIVISI (SOP BARU) ── */}
          <Route path="/reguler/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['REGULER', 'DIREKTUR', 'SUPERVISOR']}><DashboardReguler /></ProtectedRoute>} />
          <Route path="/rekrutmen/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['REKRUTMEN', 'DIREKTUR', 'SUPERVISOR']}><DashboardRekrutmen /></ProtectedRoute>} />
          <Route path="/administrasi/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['ADMINISTRASI', 'DIREKTUR', 'SUPERVISOR']}><DashboardAdministrasi /></ProtectedRoute>} />
          <Route path="/dokumen/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DOKUMEN', 'DIREKTUR', 'SUPERVISOR']}><DashboardDokumen /></ProtectedRoute>} />
          <Route path="/pendidikan/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['PENDIDIKAN', 'DIREKTUR', 'SUPERVISOR']}><DashboardPendidikan /></ProtectedRoute>} />
          
          {/* ── RUTE SUPERVISOR ── */}
          <Route path="/supervisor/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR']}><DashboardSupervisor /></ProtectedRoute>} />

          {/* ── RUTE DIREKTUR ── */}
          <Route path="/direktur/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DIREKTUR', 'SUPERVISOR']}><DashboardDirektur /></ProtectedRoute>} />

          {/* ── RUTE PANTAUAN ALUMNI ── */}
          <Route path="/alumni/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DIREKTUR', 'SUPERVISOR', 'DOKUMEN']}><DashboardAlumni /></ProtectedRoute>} />

          {/* ── RUTE MITRA (AGENSI/SEKOLAH LOKAL) ── */}
          <Route path="/mitra/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['MITRA']}><DashboardMitra /></ProtectedRoute>} />

          {/* ── RUTE CETAK CV ── */}
          <Route path="/print-cv/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR', 'DOKUMEN', 'REKRUTMEN']}><PrintRirekisho /></ProtectedRoute>} />

          <Route path="/unauthorized" element={<div style={{ padding: '100px', textAlign: 'center' }}><h2>Akses Ditolak. Anda tidak memiliki izin ke halaman ini.</h2><button onClick={() => window.history.back()} style={{ padding: '10px 20px', background: '#101869', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>Kembali</button></div>} />
        </Routes>
      </main>
      {!isSystemRoute && (
        <footer style={{ background: 'var(--ink)', color: 'rgba(255,255,255,0.7)', padding: '3rem 5%', textAlign: 'center', fontSize: '0.85rem' }}>
          <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--white)', fontSize: '1.5rem', marginBottom: '10px' }}>Universal Japan Course</p>
          <p>© 2026 Universal Japan Course Semarang.</p>
        </footer>
      )}
    </>
  );
}

export default function App() { return <Router><AppContent /></Router>; }