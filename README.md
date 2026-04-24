📘 DOKUMENTASI TEKNIS: SISTEM ERP LPK UJC
1. Deskripsi Proyek
Sistem Informasi Manajemen Terpadu (ERP) berbasis web yang dirancang khusus untuk Lembaga Pelatihan Kerja (LPK) Universal Japan Course. Sistem ini mengotomatisasi seluruh siklus hidup trainee, mulai dari pendaftaran (hulu) hingga pemantauan pasca-keberangkatan di Jepang (hilir).

2. Tech Stack (Infrastruktur)
Frontend: React.js (via Vite)

Routing: React Router DOM v6

UI/Icons: Lucide React & Custom CSS (Tanpa framework berat untuk menjaga performa)

Backend as a Service (BaaS): Supabase

Supabase Auth (Sistem Login & Manajemen Sesi)

Supabase PostgreSQL (Relational Database)

Supabase Storage (Penyimpanan File/Scan Dokumen)

Utilitas: XLSX (Export Laporan ke Excel)

3. Arsitektur Role-Based Access Control (RBAC)
Sistem menggunakan Smart Authentication yang mendeteksi role pengguna saat login dan mengarahkannya ke modul (dashboard) yang terisolasi:

Super Admin: Akses penuh ke konfigurasi sistem dan Command Center.

Direktur & Supervisor: Akses Executive Dashboard, KPI Real-time, pantauan produktivitas staf, dan Job Order Kaisha.

Divisi Reguler: Input data pendaftaran dan CS awal.

Divisi Rekrutmen: Seleksi, Pra-Mensetsu, Interview, dan penjodohan (Matching) dengan Job Order.

Divisi Pendidikan: Input nilai, presensi, dan evaluasi Diklat bahasa/fisik.

Divisi Dokumen: Verifikasi kelengkapan berkas fisik & digital, pengurusan CoE, dan Visa.

Divisi Administrasi: Pencatatan keuangan dan pembayaran.

Mitra Lokal (B2B): Portal khusus bagi SMK/Agensi daerah untuk mengajukan (submit) kandidat siswa mereka secara mandiri ke LPK UJC.

4. Modul Utama & Fitur Unggulan
Pipeline Conveyor Terpusat: Memantau pergerakan siswa di 11 tahap wajib (Pendaftaran ➡️ Wawancara ➡️ Dokumen ➡️ Terbang).

Sistem Pagar Logika (Strict Validation): Siswa tidak dapat dipindahkan ke tahap selanjutnya jika data esensial (seperti NIK, NIS, Job Order, atau 100% kelengkapan dokumen) belum terpenuhi.

Etalase Kandidat Publik: Katalog online bergaya e-commerce untuk memamerkan profil siswa (tersedia & sudah terikat Kaisha) guna mendongkrak visibilitas LPK.

Modul Manajemen Alumni: Pemantauan masa kontrak (3-5 tahun), peringatan sisa visa, dan pelaporan insiden (kabur/pulang awal) untuk tenaga kerja di Jepang.

Generator CV (Rirekisho): Format CV standar Jepang yang ditarik otomatis dari database.

Audit Trail: Pelacakan aktivitas (log) seluruh staf secara real-time.

5. Keamanan & Database
Kunci Primer (Primary Key): Menggunakan standar UUID (Universally Unique Identifier) pada tabel krusial untuk mencegah manipulasi URL (Insecure Direct Object Reference / IDOR).

Identitas Internal: Penggunaan NIS (Nomor Induk Siswa) tersendiri untuk administrasi pencatatan fisik dan digital yang memiliki status UNIQUE.

6. Tahapan Selanjutnya (Pending / To-Do)
[ ] UAT (User Acceptance Testing): Pengujian alur sistem oleh pengguna akhir (Staf & Manajemen).

[ ] Database Hardening: Mengaktifkan Row Level Security (RLS) di Supabase agar akses SELECT, INSERT, UPDATE, DELETE hanya bisa dilakukan oleh user yang memiliki token Auth valid.

[ ] Production Deployment: Konfigurasi .env pada server hosting (Vercel/Netlify) dan integrasi custom domain (lpkujc.id / .com).