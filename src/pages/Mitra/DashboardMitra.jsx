import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserPlus, FileText, CheckCircle2, Clock, XCircle, Send, Building, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

export default function DashboardMitra() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [mitraProfile, setMitraProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('INPUT'); // 'INPUT' atau 'RIWAYAT'
    const [riwayatSiswa, setRiwayatSiswa] = useState([]);

    const [formData, setFormData] = useState({
        nama_lengkap: '', nik: '', jenis_kelamin: 'L', no_hp: '', tempat_lahir: '', tanggal_lahir: ''
    });

    useEffect(() => {
        const initDashboard = async () => {
            setIsLoading(true);
            const profile = await fetchMitraProfile();
            if (profile) {
                await fetchRiwayatPengajuan(profile.id);
            }
            setIsLoading(false);
        };
        initDashboard();
    }, []);

    const fetchMitraProfile = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) { navigate('/login'); return null; }

            const { data: profile, error: profileError } = await supabase
                .from('master_mitra_lokal')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle(); 

            if (profileError) throw profileError;

            if (profile) {
                const mp = { id: profile.id, nama: profile.nama_institusi, jenis: profile.jenis_institusi };
                setMitraProfile(mp);
                return mp;
            } else {
                const dummy = { id: session.user.id, nama: 'Profil Mitra Belum Lengkap', jenis: 'Instansi' };
                setMitraProfile(dummy);
                return dummy;
            }
        } catch (error) {
            console.error("Gagal memuat profil mitra:", error.message);
            return null;
        }
    };

    const fetchRiwayatPengajuan = async (mitraId) => {
        try {
            // Menarik data siswa yang 'didaftarkan' oleh ID Mitra ini
            const { data, error } = await supabase
                .from('students')
                .select('id, nama_lengkap, jenis_kelamin, tahap_sekarang, status_akhir, created_at')
                .eq('created_by', mitraId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRiwayatSiswa(data || []);
        } catch (error) {
            console.error("Error fetching riwayat:", error.message);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmitPengajuan = async (e) => {
        e.preventDefault();
        
        if (!window.confirm(`Kirim pengajuan kandidat atas nama ${formData.nama_lengkap} ke LPK UJC?`)) return;
        
        setIsSubmitting(true);
        try {
            // ========================================================
            // INJEKSI BLUEPRINT MODUL 3: AUTO-PRICING & STATUS
            // ========================================================
            const payload = {
                ...formData,
                created_by: mitraProfile.id,
                lpk_asal: mitraProfile.nama, // Inject otomatis nama mitra
                tahap_sekarang: 'WAWANCARA MITRA', // Sesuai Blueprint: Status awal ditahan di wawancara
                status_akhir: 'MENUNGGU REVIEW',
                total_bayar: 33000000 // Sesuai Blueprint: Tagihan reguler hangus (Rp 0), sisa tagihan Diklat saja
            };

            const { error } = await supabase.from('students').insert([payload]);
            if (error) throw error;

            alert("Kandidat berhasil diajukan! Tim UJC akan segera melakukan verifikasi.");
            setFormData({ nama_lengkap: '', nik: '', jenis_kelamin: 'L', no_hp: '', tempat_lahir: '', tanggal_lahir: '' });
            setActiveTab('RIWAYAT');
            await fetchRiwayatPengajuan(mitraProfile.id);

        } catch (err) {
            alert("Gagal melakukan pengajuan: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Helper anti-crash
    const cleanStr = (str) => (str || '').toLowerCase().trim();

    if (isLoading && !mitraProfile) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', color: brandNavy }}>
                <Loader2 size={40} className="animate-spin" style={{ marginBottom: '15px' }} />
                <h2 style={{ margin: 0, fontWeight: 800 }}>Mempersiapkan Portal Mitra...</h2>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR ── */}
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Portal Mitra</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Universal Japan Course</p>
                </div>
                
                <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px' }}>Instansi Pengirim</div>
                    <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '5px', lineHeight: '1.3' }}>
                        {mitraProfile?.nama || 'Mitra LPK'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Building size={14} /> {mitraProfile?.jenis || 'Agensi'}
                    </div>
                </div>

                <nav style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '10px 0 5px 5px' }}>Menu Utama</div>
                    <button onClick={() => setActiveTab('INPUT')} style={activeTab === 'INPUT' ? activeMenuS : inactiveMenuS}>
                        <UserPlus size={18} /> Formulir Pengajuan
                    </button>
                    <button onClick={() => setActiveTab('RIWAYAT')} style={activeTab === 'RIWAYAT' ? activeMenuS : inactiveMenuS}>
                        <FileText size={18} /> Status Kandidat
                    </button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
                        Keluar
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                
                {/* ── TAB: INPUT PENGAJUAN ── */}
                {activeTab === 'INPUT' && (
                    <div className="fade-in" style={{ maxWidth: '800px' }}>
                        <header style={{ marginBottom: '30px' }}>
                            <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900, letterSpacing: '-0.5px' }}>Formulir Pengajuan Kandidat</h1>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Info size={16}/> Daftarkan siswa/lulusan Anda untuk mengikuti seleksi di LPK UJC.
                            </p>
                        </header>

                        <form onSubmit={handleSubmitPengajuan} style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: '0 0 25px 0', color: brandNavy, fontWeight: 800, borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>Identitas Dasar Siswa</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={labelForm}>Nama Lengkap (Sesuai KTP) *</label>
                                        <input required name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} style={inputForm} placeholder="Masukkan nama lengkap" />
                                    </div>
                                    <div>
                                        <label style={labelForm}>Nomor NIK KTP *</label>
                                        <input required name="nik" type="number" value={formData.nik} onChange={handleInputChange} style={inputForm} placeholder="16 digit NIK" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={labelForm}>Jenis Kelamin *</label>
                                        <select required name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} style={inputForm}>
                                            <option value="L">Laki-laki</option>
                                            <option value="P">Perempuan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelForm}>No. Handphone / WA *</label>
                                        <input required name="no_hp" type="number" value={formData.no_hp} onChange={handleInputChange} style={inputForm} placeholder="Contoh: 08123456789" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={labelForm}>Tempat Lahir</label>
                                        <input name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} style={inputForm} placeholder="Kota/Kabupaten kelahiran" />
                                    </div>
                                    <div>
                                        <label style={labelForm}>Tanggal Lahir</label>
                                        <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} style={inputForm} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#eff6ff', padding: '15px 20px', borderRadius: '8px', border: '1px dashed #93c5fd', marginTop: '30px', color: '#1e3a8a', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                <strong>Pemberitahuan:</strong> Pastikan data yang dimasukkan valid. Setelah diajukan, tim seleksi UJC akan memeriksa berkas dan menghubungi kandidat untuk proses wawancara awal/evaluasi.
                            </div>

                            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" disabled={isSubmitting} style={{ padding: '14px 30px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(16,24,105,0.25)', transition: '0.2s', opacity: isSubmitting ? 0.7 : 1 }}>
                                    {isSubmitting ? 'Mengirim Data...' : <>Ajukan Kandidat <Send size={18}/></>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── TAB: RIWAYAT PENGAJUAN ── */}
                {activeTab === 'RIWAYAT' && (
                    <div className="fade-in">
                        <header style={{ marginBottom: '30px', flexShrink: 0 }}>
                            <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900, letterSpacing: '-0.5px' }}>Status Kandidat Anda</h1>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>Pantau status penerimaan siswa yang telah Anda ajukan ke UJC.</p>
                        </header>

                        <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thP}>Nama Siswa</th>
                                        <th style={thP}>Waktu Pengajuan</th>
                                        <th style={thP}>Posisi / Tahap</th>
                                        <th style={thP}>Status UJC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat riwayat...</td></tr>
                                    ) : riwayatSiswa.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Anda belum mengajukan kandidat sama sekali.</td></tr>
                                    ) : (
                                        riwayatSiswa.map(siswa => {
                                            const status = cleanStr(siswa.status_akhir);
                                            const tahap = cleanStr(siswa.tahap_sekarang);
                                            
                                            // Logika Pewarnaan Label
                                            let icon = <Clock size={16} color="#d97706" />;
                                            let bg = '#fef3c7', col = '#92400e';
                                            
                                            if (tahap === 'wawancara mitra' || status === 'menunggu review') {
                                                bg = '#fef3c7'; col = '#92400e'; icon = <Clock size={16} color="#92400e" />;
                                            } else if (status === 'ditolak' || status === 'gagal') {
                                                bg = '#fee2e2'; col = '#991b1b'; icon = <XCircle size={16} color="#991b1b" />;
                                            } else {
                                                // Jika sudah di-acc dan masuk reguler
                                                bg = '#dcfce7'; col = '#166534'; icon = <CheckCircle2 size={16} color="#166534" />;
                                            }

                                            return (
                                                <tr key={siswa.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={tdP}>
                                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{siswa.nama_lengkap}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>{siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                                                    </td>
                                                    <td style={tdP}>
                                                        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                                            {new Date(siswa.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td style={tdP}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: brandNavy }}>{siswa.tahap_sekarang}</span>
                                                    </td>
                                                    <td style={tdP}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: bg, color: col, padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                            {icon} {siswa.status_akhir || 'PROSES'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── STYLES ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 800, fontSize: '0.95rem' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem', transition: '0.2s' };

const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' };
const inputForm = { width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };

const thP = { padding: '18px 25px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', fontWeight: 800 };
const tdP = { padding: '18px 25px', verticalAlign: 'middle' };