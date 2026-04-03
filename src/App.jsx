import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VisiMisi from './pages/About/VisiMisi';
import LatarBelakang from './pages/About/LatarBelakang';
import Legalitas from './pages/About/Legalitas';
import AdminGate from './pages/AdminGate';

// ── IMPORT KOMPONEN PIPELINE (SISTEM PEGAWAI) ──
import DashboardPendaftaran from './pages/Pendaftaran/DashboardPendaftaran';
import DashboardKeuangan from './pages/Keuangan/DashboardKeuangan';
import DashboardDokumen from './pages/Dokumen/DashboardDokumen';
import DashboardPelatihan from './pages/Pelatihan/DashboardPelatihan';
import DashboardSupervisor from './pages/Supervisor/DashboardSupervisor';

// ── IMPORT KOMPONEN CETAK CV ──
import PrintRirekisho from './components/PrintRirekisho'; 

function ProtectedRoute({ userRole, allowedRoles, children }) {
  if (!userRole) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(userRole)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function AppContent() {
  const [lang, setLang] = useState('ID');
  const [newsData, setNewsData] = useState([]);
  const location = useLocation();

  // ── MOCK USER ──
  const [userRole, setUserRole] = useState('SUPERVISOR'); 

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

  // Tambahkan '/print-cv' agar Navbar dan Footer tidak muncul saat mencetak CV
  const isSystemRoute = ['/pendaftaran', '/keuangan', '/dokumen', '/pelatihan', '/supervisor', '/print-cv'].some(route => location.pathname.startsWith(route));

  return (
    <>
      {!isSystemRoute && <Navbar lang={lang} setLang={setLang} />}
      <main>
        <Routes>
          <Route path="/" element={<Home lang={lang} newsData={newsData} />} />
          <Route path="/visi-misi" element={<VisiMisi lang={lang} />} />
          <Route path="/latar-belakang" element={<LatarBelakang lang={lang} />} />
          <Route path="/legalitas" element={<Legalitas lang={lang} />} />
          <Route path="/ujc-admin-gate-2026" element={<AdminGate newsData={newsData} setNewsData={setNewsData} lang={lang} />} />

          {/* ── RUTE CONVEYOR ── */}
          <Route path="/pendaftaran/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['PENDAFTARAN', 'DIREKTUR']}><DashboardPendaftaran /></ProtectedRoute>} />
          <Route path="/keuangan/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['KEUANGAN', 'DIREKTUR']}><DashboardKeuangan /></ProtectedRoute>} />
          <Route path="/dokumen/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DOKUMEN', 'DIREKTUR']}><DashboardDokumen /></ProtectedRoute>} />
          <Route path="/pelatihan/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['PELATIHAN', 'DIREKTUR']}><DashboardPelatihan /></ProtectedRoute>} />
          <Route path="/supervisor/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR']}><DashboardSupervisor /></ProtectedRoute>} />

          {/* ── RUTE CETAK CV (TAB BARU) ── */}
          <Route path="/print-cv/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR']}><PrintRirekisho /></ProtectedRoute>} />

          <Route path="/unauthorized" element={<div style={{ padding: '100px', textAlign: 'center' }}><h2>Akses Ditolak.</h2></div>} />
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