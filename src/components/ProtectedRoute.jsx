import { Navigate } from 'react-router-dom';

// Komponen penahan akses halaman berdasarkan Role
export default function ProtectedRoute({ user, allowedRoles, children }) {
  // Jika belum login, lempar ke halaman login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika role pegawai tidak ada di daftar yang diizinkan, tolak akses
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}