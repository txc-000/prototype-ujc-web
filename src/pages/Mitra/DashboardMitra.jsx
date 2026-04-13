import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, UserPlus, CheckCircle2, FileText, ChevronRight, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

export default function DashboardMitra() {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCandidates, setSelectedCandidates] = useState([]);

    const [mitraProfile, setMitraProfile] = useState(null);

    useEffect(() => {
        const initDashboard = async () => {
            setIsLoading(true);
            await fetchMitraProfile();
            await fetchCandidates();
            setIsLoading(false);
        };
        initDashboard();
    }, []);

    const fetchMitraProfile = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                navigate('/login');
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('master_mitra_lokal')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle(); 

            if (profileError) throw profileError;

            if (profile) {
                setMitraProfile({
                    id: profile.id,
                    nama: profile.nama_institusi,
                    jenis: profile.jenis_institusi,
                    kuota_tersisa: 15
                });
            } else {
                setMitraProfile({
                    id: session.user.id,
                    nama: 'Profil Belum Lengkap (Hubungi Admin)',
                    jenis: 'Mitra',
                    kuota_tersisa: 0
                });
            }

        } catch (error) {
            console.error("Gagal memuat profil mitra:", error.message);
        }
    };

    const fetchCandidates = async () => {
        try {
            const allowedStatuses = [
                'Tersedia', 'TERSEDIA', 'tersedia',
                'Sedang Pelatihan', 'SEDANG PELATIHAN', 'sedang pelatihan',
                'Aktif', 'AKTIF', 'aktif',
                'PROSES', 'Proses', 'proses',
                'AVAILABLE', 'Available', 'available',
                'masih proses', 'Masih Proses', 'MASIH PROSES',
                null
            ];

            const { data, error } = await supabase
                .from('students')
                // 👇 HANYA MEMANGGIL KOLOM YANG PASTI ADA (Pendidikan dihapus sementara) 👇
                .select('id, nama_lengkap, jenis_kelamin, tinggi_badan, berat_badan, tahap_sekarang, status_akhir')
                .in('status_akhir', allowedStatuses) 
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCandidates(data || []);
        } catch (error) {
            console.error("Error fetching candidates:", error.message);
        }
    };

    const toggleSelection = (candidateId) => {
        if (!mitraProfile || mitraProfile.kuota_tersisa === 0) {
            alert("Profil Anda belum lengkap atau kuota habis. Silakan hubungi Administrator.");
            return;
        }

        if (selectedCandidates.includes(candidateId)) {
            setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
        } else {
            if (selectedCandidates.length >= mitraProfile.kuota_tersisa) {
                alert(`Maksimal pengajuan adalah ${mitraProfile.kuota_tersisa} kandidat berdasarkan sisa kuota Anda.`);
                return;
            }
            setSelectedCandidates([...selectedCandidates, candidateId]);
        }
    };

    const handleAjukanKandidat = async () => {
        if (selectedCandidates.length === 0) return alert("Pilih minimal 1 kandidat terlebih dahulu.");
        
        const confirm = window.confirm(`Anda akan mengajukan ${selectedCandidates.length} kandidat untuk proses selanjutnya. Lanjutkan?`);
        if (!confirm) return;

        alert("Pengajuan berhasil! Tim UJC akan segera menghubungi Anda untuk proses interview.");
        setSelectedCandidates([]);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const filteredCandidates = candidates.filter(c => 
        (c.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Portal Mitra</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Universal Japan Course</p>
                </div>
                
                <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px' }}>Profil Instansi</div>
                    <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '5px', lineHeight: '1.3' }}>
                        {mitraProfile?.nama || 'Mitra LPK'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                        {mitraProfile?.jenis || 'Agensi'}
                    </div>
                </div>

                <nav style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '10px 0 5px 5px' }}>Menu Utama</div>
                    <button style={activeMenuS}><UserPlus size={18} /> Cari Kandidat</button>
                    <button style={inactiveMenuS}><FileText size={18} /> Riwayat Pengajuan</button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
                        Keluar
                    </button>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900, letterSpacing: '-0.5px' }}>Katalog Kandidat</h1>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Info size={16}/> Pilih siswa yang tersedia untuk diajukan ke program Anda.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                            <input 
                                type="text" 
                                placeholder="Cari nama kandidat..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '300px', fontSize: '0.95rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} 
                            />
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}>Memuat daftar siswa...</div>
                    ) : filteredCandidates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 600 }}>
                            Tidak ada kandidat yang tersedia saat ini atau pencarian tidak ditemukan.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {filteredCandidates.map(candidate => {
                                const isSelected = selectedCandidates.includes(candidate.id);
                                const isReady = ['AVAILABLE', 'TERSEDIA'].includes((candidate.status_akhir || '').toUpperCase());
                                
                                return (
                                    <div 
                                        key={candidate.id} 
                                        onClick={() => toggleSelection(candidate.id)}
                                        style={{ 
                                            background: 'white', 
                                            borderRadius: '16px', 
                                            padding: '25px', 
                                            boxShadow: isSelected ? `0 0 0 2px ${brandNavy}, 0 10px 20px rgba(16,24,105,0.15)` : '0 4px 10px rgba(0,0,0,0.03)', 
                                            border: `1px solid ${isSelected ? brandNavy : '#e2e8f0'}`, 
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                                            {isSelected ? <CheckCircle2 size={26} color={brandNavy} fill="#eff6ff" /> : <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #cbd5e1' }}></div>}
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                                            <div style={{ width: '55px', height: '55px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#64748b', fontSize: '1.4rem' }}>
                                                {candidate.nama_lengkap?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.15rem' }}>{candidate.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{candidate.jenis_kelamin === 'L' ? 'Laki-laki' : candidate.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '15px', borderRadius: '10px', marginBottom: '20px', flex: 1 }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Fisik</div>
                                                <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>{candidate.tinggi_badan || '-'}cm / {candidate.berat_badan || '-'}kg</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Pendidikan</div>
                                                {/* Dihardcode jadi "-" dulu sampai Tuan menemukan nama kolom aslinya */}
                                                <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>-</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                            <button onClick={(e) => { e.stopPropagation(); window.open(`/print-cv/${candidate.id}`, '_blank'); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Detail CV &rarr;</button>
                                            
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                padding: '5px 12px', 
                                                borderRadius: '20px', 
                                                fontWeight: 800,
                                                background: isReady ? '#dcfce7' : '#fef9c3', 
                                                color: isReady ? '#166534' : '#854d0e',
                                                border: `1px solid ${isReady ? '#bbf7d0' : '#fef08a'}`,
                                                textTransform: 'capitalize'
                                            }}>
                                                {candidate.status_akhir ? candidate.status_akhir.toLowerCase() : 'Tersedia'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedCandidates.length > 0 && mitraProfile && (
                    <div style={{ background: 'white', padding: '20px 30px', borderRadius: '15px', boxShadow: '0 -10px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, animation: 'slideUp 0.3s ease-out' }}>
                        <style>{`@keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
                        <div>
                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e293b' }}>{selectedCandidates.length} Kandidat Dipilih</span>
                            <span style={{ margin: '0 12px', color: '#cbd5e1' }}>|</span>
                            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Sisa Kuota: <b style={{color: brandNavy}}>{mitraProfile.kuota_tersisa - selectedCandidates.length}</b></span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => setSelectedCandidates([])} style={{ padding: '12px 25px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>Batal</button>
                            <button onClick={handleAjukanKandidat} style={{ padding: '12px 35px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(16,24,105,0.25)', transition: '0.2s' }}>Ajukan Kandidat <ChevronRight size={18}/></button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 800, fontSize: '0.95rem' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem', transition: '0.2s' };