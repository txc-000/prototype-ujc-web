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

// ── IMPORT KOMPONEN DIVISI ──
import DashboardReguler from './pages/Reguler/DashboardReguler';
import DashboardDokumen from './pages/Dokumen/DashboardDokumen';
import DashboardPendidikan from './pages/Pendidikan/DashboardPendidikan';
import DashboardAdministrasi from './pages/Administrasi/DashboardAdministrasi';

// ── IMPORT KOMPONEN SUPERVISOR, DIREKTUR, & SUPER ADMIN ──
import DashboardSupervisor from './pages/Supervisor/DashboardSupervisor';
import DashboardDirektur from './pages/Direktur/DashboardDirektur';
import DashboardSuperAdmin from './pages/AdminGate/DashboardSuperAdmin';

// ── IMPORT KOMPONEN MASTER DATA ──
import MasterKumiai from './pages/Supervisor/MasterKumiai'; // <-- SESUAIKAN PATH FOLDER TUAN
import MasterKaisha from './pages/Supervisor/MasterKaisha'; // <-- SESUAIKAN PATH FOLDER TUAN

// ── IMPORT KOMPONEN ALUMNI ──
import DashboardAlumni from './pages/Alumni/DashboardAlumni';

// ── IMPORT KOMPONEN MITRA ──
import DashboardMitra from './pages/Mitra/DashboardMitra';

// ── IMPORT KOMPONEN CETAK DOKUMEN ──
import PrintRirekisho from './components/PrintRirekisho'; 
import PrintLaporanKaisha from './components/PrintLaporanKaisha';

// ── IMPORT RUTE INVOICE & KWITANSI (DARI FOLDER COMPONENTS) ──
import PrintInvoiceKumiai from './components/PrintInvoiceKumiai';
import PrintInvoiceSummary from './components/PrintInvoiceSummary'; 
import PrintKwitansiSiswa from './components/PrintKwitansiSiswa'; 

// ── IMPORT KOMPONEN SHOUSHIKI & SERTIFIKAT ──
import PrintShoushiki1_10 from './components/PrintShoushiki1_10';
import PrintShoushiki1_13 from './components/PrintShoushiki1_13';
import PrintShoushiki1_20 from './components/PrintShoushiki1_20';
import PrintSertifikatLulus from './components/PrintSertifikatLulus'; 

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

  // Daftar rute sistem (navbar dinonaktifkan di sini) - PERHATIKAN PENAMBAHAN ROUTE MASTER
  const isSystemRoute = ['/reguler', '/administrasi', '/dokumen', '/pendidikan', '/supervisor', '/direktur', '/superadmin', '/master-kumiai', '/master-kaisha', '/alumni', '/print-cv', '/print-laporan-kaisha', '/print-invoice-detail', '/print-invoice-summary', '/print-kwitansi-siswa', '/print-shoushiki', '/print-sertifikat', '/login', '/ubah-password', '/mitra'].some(route => location.pathname.startsWith(route));

  if (isAuthLoading && isSystemRoute && location.pathname !== '/login' && location.pathname !== '/ubah-password') {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#101869', fontWeight: 800 }}>Memeriksa Akses...</div>;
  }

  return (
    <>
      {!isSystemRoute && <Navbar lang={lang} setLang={setLang} />}
      
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

          {/* ── RUTE MASTER DATA (DIBUKA UNTUK REGULER & SUPERVISOR/DIREKTUR) ── */}
          <Route path="/master-kumiai" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPER ADMIN', 'REGULER', 'SUPERVISOR', 'DIREKTUR']}><MasterKumiai /></ProtectedRoute>} />
          <Route path="/master-kaisha" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPER ADMIN', 'REGULER', 'SUPERVISOR', 'DIREKTUR']}><MasterKaisha /></ProtectedRoute>} />

          {/* ── RUTE DIVISI PUSAT PENGENDALI ── */}
          <Route path="/reguler/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['REGULER', 'DIREKTUR', 'SUPERVISOR']}><DashboardReguler /></ProtectedRoute>} />
          <Route path="/administrasi/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['ADMINISTRASI', 'DIREKTUR', 'SUPERVISOR']}><DashboardAdministrasi /></ProtectedRoute>} />
          <Route path="/dokumen/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DOKUMEN', 'DIREKTUR', 'SUPERVISOR']}><DashboardDokumen /></ProtectedRoute>} />
          <Route path="/pendidikan/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['PENDIDIKAN', 'DIREKTUR', 'SUPERVISOR']}><DashboardPendidikan /></ProtectedRoute>} />
          
          {/* ── RUTE SUPERVISOR & DIREKTUR ── */}
          <Route path="/supervisor/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR']}><DashboardSupervisor /></ProtectedRoute>} />
          <Route path="/direktur/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DIREKTUR', 'SUPERVISOR']}><DashboardDirektur /></ProtectedRoute>} />

          {/* ── RUTE PANTAUAN ALUMNI ── */}
          <Route path="/alumni/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['DIREKTUR', 'SUPERVISOR', 'DOKUMEN']}><DashboardAlumni /></ProtectedRoute>} />

          {/* ── RUTE MITRA ── */}
          <Route path="/mitra/dashboard" element={<ProtectedRoute userRole={userRole} allowedRoles={['MITRA']}><DashboardMitra /></ProtectedRoute>} />

          {/* ── RUTE CETAK DOKUMEN ── */}
          <Route path="/print-cv/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR', 'DOKUMEN', 'REGULER']}><PrintRirekisho /></ProtectedRoute>} />
          <Route path="/print-laporan-kaisha/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['SUPERVISOR', 'DIREKTUR', 'REGULER', 'DOKUMEN']}><PrintLaporanKaisha /></ProtectedRoute>} />
          
          {/* ── RUTE INVOICE & KWITANSI (KEUANGAN) ── */}
          <Route path="/print-invoice-detail/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['ADMINISTRASI', 'SUPERVISOR', 'DIREKTUR']}><PrintInvoiceKumiai /></ProtectedRoute>} />
          <Route path="/print-invoice-summary/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['ADMINISTRASI', 'SUPERVISOR', 'DIREKTUR']}><PrintInvoiceSummary /></ProtectedRoute>} />
          <Route path="/print-kwitansi-siswa/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['ADMINISTRASI', 'SUPERVISOR', 'DIREKTUR']}><PrintKwitansiSiswa /></ProtectedRoute>} /> 
          
          {/* ── RUTE LAINNYA ── */}
          <Route path="/print-shoushiki-10/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['DOKUMEN', 'SUPERVISOR', 'DIREKTUR', 'REGULER']}><PrintShoushiki1_10 /></ProtectedRoute>} />
          <Route path="/print-shoushiki-13" element={<ProtectedRoute userRole={userRole} allowedRoles={['DOKUMEN', 'SUPERVISOR', 'DIREKTUR', 'REGULER']}><PrintShoushiki1_13 /></ProtectedRoute>} />
          <Route path="/print-shoushiki-20/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['DOKUMEN', 'SUPERVISOR', 'DIREKTUR', 'REGULER']}><PrintShoushiki1_20 /></ProtectedRoute>} />
          <Route path="/print-sertifikat/:id" element={<ProtectedRoute userRole={userRole} allowedRoles={['PENDIDIKAN', 'SUPERVISOR', 'DIREKTUR']}><PrintSertifikatLulus /></ProtectedRoute>} />

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