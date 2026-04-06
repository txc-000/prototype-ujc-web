import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VisiMisi from './pages/About/VisiMisi';
import LatarBelakang from './pages/About/LatarBelakang';
import Legalitas from './pages/About/Legalitas';
import AdminGate from './pages/AdminGate';

// ── IMPORT KOMPONEN BERITA (BARU) ──
import NewsDetail from './pages/News/NewsDetail';

// ── IMPORT KOMPONEN AUTH ──
import LoginPage from './pages/Auth/LoginPage';
import UbahPassword from './pages/Auth/UbahPassword'; 

// ── IMPORT KOMPONEN PIPELINE (SISTEM PEGAWAI) ──
import DashboardPendaftaran from './pages/Pendaftaran/DashboardPendaftaran';
import DashboardKeuangan from './pages/Keuangan/DashboardKeuangan';
import DashboardDokumen from './pages/Dokumen/DashboardDokumen';
import DashboardPelatihan from './pages/Pelatihan/DashboardPelatihan';

// ── IMPORT KOMPONEN SUPERVISOR & DIREKTUR ──
import DashboardSupervisor from './pages/Supervisor/DashboardSupervisor';
import ManajemenRole from './pages/Supervisor/ManajemenRole';
import DashboardDirektur from './pages/Direktur/DashboardDirektur';

// ── IMPORT KOMPONEN CETAK CV ──
import PrintRirekisho from './components/PrintRirekisho'; 

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
        const { data: emp } = await supabase
          .from('employees')
          .select('master_role(nama_role)')
          .eq('id', session.user.id)
          .single();
        
        if (emp && emp.master_role) {
          setUserRole(emp.master_role.nama_role.toUpperCase());
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

  // Tambahkan /ubah-password agar dianggap sebagai rute sistem (tidak menampilkan navbar/footer publik)
  const isSystemRoute = ['/pendaftaran', '/keuangan', '/dokumen', '/pelatihan', '/supervisor', '/direktur', '/print-cv', '/login', '/ubah-password'].some(route => location.pathname.startsWith(route));

  // Pengecualian tambahan: Jangan tampilkan loading screen saat di halaman login atau ubah password
  if (isAuthLoading && isSystemRoute && location.pathname !== '/login' && location.pathname !== '/ubah-password') {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#101869', fontWeight: 800 }}>Memeriksa Akses...</div>;
  }

  return (
    <>
      {!isSystemRoute && <Navbar lang={lang} setLang={setLang} />}
      <main>
        <Routes>
          {/* ── RUTE PUBLIK ── */}
          <Route path="/" element={<Home lang={lang} newsData={newsData} />} />
          <Route path="/visi-misi" element={<VisiMisi lang={lang} />} />
          <Route path="/latar-belakang" element={<LatarBelakang lang={lang} />} />
          <Route path="/legalitas" element={<Legalitas lang={lang} />} />
          <Route path="/ujc-admin-gate-2026" element={<AdminGate newsData={newsData} setNewsData={setNewsData} lang={lang} />} />
          <Route path="/berita/:id" element={<NewsDetail lang={lang} />} /> {/* <-- RUTE BERITA BARU */}

          {/* ── RUTE AUTHENTICATION ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ubah-password" element={<UbahPassword />} /> 

          {/* ── RUTE CONVEYOR ── */}
          <Route path="/pendaftaran/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['PENDAFTARAN', 'DIREKTUR', 'SUPERVISOR']}><DashboardPendaftaran /></ProtectedRoute>} />
          <Route path="/keuangan/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['KEUANGAN', 'DIREKTUR', 'SUPERVISOR']}><DashboardKeuangan /></ProtectedRoute>} />
          <Route path="/dokumen/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DOKUMEN', 'DIREKTUR', 'SUPERVISOR']}><DashboardDokumen /></ProtectedRoute>} />
          <Route path="/pelatihan/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['PELATIHAN', 'DIREKTUR', 'SUPERVISOR']}><DashboardPelatihan /></ProtectedRoute>} />
          
          {/* ── RUTE SUPERVISOR ── */}
          <Route path="/supervisor/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR']}><DashboardSupervisor /></ProtectedRoute>} />
          <Route path="/supervisor/manajemen-role" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR']}><ManajemenRole /></ProtectedRoute>} />

          {/* ── RUTE DIREKTUR ── */}
          <Route path="/direktur/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DIREKTUR', 'SUPERVISOR']}><DashboardDirektur /></ProtectedRoute>} />

          {/* ── RUTE CETAK CV ── */}
          <Route path="/print-cv/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR', 'DOKUMEN']}><PrintRirekisho /></ProtectedRoute>} />

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