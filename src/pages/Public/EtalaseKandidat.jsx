import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Star, CheckCircle2, Building2, MapPin, User, ArrowRight, Award } from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function EtalaseKandidat({ lang }) {
    const [kandidat, setKandidat] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('TERSEDIA'); // 'TERSEDIA' atau 'TERPILIH'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchKandidat = async () => {
            setIsLoading(true);
            try {
                // Tarik data siswa, abaikan yang berstatus GAGAL
                const { data, error } = await supabase
                    .from('students')
                    .select('id, nama_lengkap, jenis_kelamin, tanggal_lahir, tinggi_badan, berat_badan, pendidikan_history, perusahaan_tujuan, status_akhir, tahap_sekarang')
                    .neq('status_akhir', 'gagal')
                    .neq('status_akhir', 'GAGAL')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setKandidat(data || []);
            } catch (err) {
                console.error("Gagal memuat etalase:", err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchKandidat();
    }, []);

    // Fungsi Hitung Umur
    const getAge = (dob) => {
        if (!dob) return '-';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    // Filter Logika "Shopee"
    const filteredData = kandidat.filter(k => {
        const isMatchSearch = (k.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase());
        const hasCompany = k.perusahaan_tujuan && k.perusahaan_tujuan.trim() !== '';
        
        if (activeTab === 'TERSEDIA') {
            return isMatchSearch && !hasCompany;
        } else {
            return isMatchSearch && hasCompany;
        }
    });

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            {/* Navbar dihapus dari sini karena sudah dirender oleh App.jsx */}

            {/* ── BANNER HERO ── */}
            <div style={{ background: `linear-gradient(135deg, ${brandNavy} 0%, #1e3a8a 100%)`, padding: '60px 20px', textAlign: 'center', color: 'white' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 15px 0', letterSpacing: '-1px' }}>
                    Etalase Kandidat LPK UJC
                </h1>
                <p style={{ fontSize: '1.1rem', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                    Temukan talenta-talenta terbaik yang telah dididik kedisiplinan, bahasa, dan budaya Jepang. Siap berkontribusi untuk perusahaan Anda.
                </p>

                {/* ── SEARCH BAR ── */}
                <div style={{ maxWidth: '500px', margin: '30px auto 0 auto', position: 'relative' }}>
                    <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder="Cari nama kandidat..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '16px 20px 16px 50px', borderRadius: '30px', border: 'none', outline: 'none', fontSize: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                    />
                </div>
            </div>

            {/* ── TABS (TERSEDIA vs TERPILIH) ── */}
            <div style={{ maxWidth: '1200px', margin: '-25px auto 30px auto', display: 'flex', justifyContent: 'center', gap: '10px', position: 'relative', zIndex: 10 }}>
                <button 
                    onClick={() => setActiveTab('TERSEDIA')}
                    style={{ ...tabStyle, background: activeTab === 'TERSEDIA' ? brandYellow : 'white', color: activeTab === 'TERSEDIA' ? brandNavy : '#64748b', boxShadow: activeTab === 'TERSEDIA' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.05)' }}
                >
                    <User size={18} /> Kandidat Tersedia
                </button>
                <button 
                    onClick={() => setActiveTab('TERPILIH')}
                    style={{ ...tabStyle, background: activeTab === 'TERPILIH' ? '#10b981' : 'white', color: activeTab === 'TERPILIH' ? 'white' : '#64748b', boxShadow: activeTab === 'TERPILIH' ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : '0 4px 6px rgba(0,0,0,0.05)' }}
                >
                    <Award size={18} /> Telah Terpilih (Sold Out)
                </button>
            </div>

            {/* ── GRID ETALASE (SHOPEE STYLE) ── */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px 20px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8', fontWeight: 600 }}>Memuat daftar kandidat...</div>
                ) : filteredData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px', background: 'white', borderRadius: '20px', color: '#94a3b8', fontWeight: 600, border: '2px dashed #cbd5e1' }}>
                        Tidak ada kandidat di kategori ini.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
                        {filteredData.map((siswa) => {
                            const photoUrl = supabase.storage.from('registration_photos').getPublicUrl(`${siswa.id}.jpg`).data.publicUrl;
                            
                            return (
                                <div key={siswa.id} className="hover-lift" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                    
                                    {/* AREA FOTO */}
                                    <div style={{ width: '100%', height: '280px', background: '#e2e8f0', position: 'relative' }}>
                                        <img 
                                            src={photoUrl} 
                                            alt={siswa.nama_lengkap} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + siswa.nama_lengkap + '&background=0D8ABC&color=fff&size=300'; }}
                                        />
                                        
                                        <div style={{ position: 'absolute', top: '15px', left: '15px', background: activeTab === 'TERSEDIA' ? 'rgba(255, 255, 255, 0.9)' : '#10b981', color: activeTab === 'TERSEDIA' ? brandNavy : 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(4px)' }}>
                                            {activeTab === 'TERSEDIA' ? <><Star size={14} color="#f59e0b" fill="#f59e0b" /> Siap Wawancara</> : <><CheckCircle2 size={14}/> Terpilih</>}
                                        </div>
                                    </div>

                                    {/* INFO KANDIDAT */}
                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: 800, lineHeight: '1.3' }}>
                                                {siswa.nama_lengkap}
                                            </h3>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                            <span style={badgeStyle}>{siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                                            <span style={badgeStyle}>{getAge(siswa.tanggal_lahir)} Tahun</span>
                                            {(siswa.tinggi_badan || siswa.berat_badan) && (
                                                <span style={badgeStyle}>{siswa.tinggi_badan || '-'}cm / {siswa.berat_badan || '-'}kg</span>
                                            )}
                                        </div>

                                        {activeTab === 'TERPILIH' && (
                                            <div style={{ marginTop: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px dashed #cbd5e1' }}>
                                                <Building2 size={18} color="#10b981" />
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Diterima di</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 800 }}>{siswa.perusahaan_tujuan}</div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'TERSEDIA' && (
                                            <button style={{ marginTop: 'auto', width: '100%', background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                                            >
                                                Lihat Profil <ArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04) !important; }
            `}</style>
        </div>
    );
}

const tabStyle = { padding: '12px 25px', borderRadius: '30px', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' };
const badgeStyle = { background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 };