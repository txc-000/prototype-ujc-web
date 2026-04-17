import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
    GraduationCap, Search, AlertTriangle, CheckCircle2, 
    Clock, MoreVertical, Edit, ArrowLeft, Plane, Building2 
} from 'lucide-react';

const brandNavy = '#101869';

export default function DashboardAlumni() {
    const navigate = useNavigate();
    const [alumni, setAlumni] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAlumni, setSelectedAlumni] = useState(null);
    const [updateForm, setUpdateForm] = useState({ status_akhir: '', catatan: '' });

    useEffect(() => {
        function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAlumni = async () => {
        setIsLoading(true);
        try {
            // Mengambil siswa yang sudah di tahap keberangkatan atau sudah menjadi alumni
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .in('tahap_sekarang', ['SIAP BERANGKAT', 'ALUMNI'])
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setAlumni(data || []);
        } catch (error) {
            console.error('Gagal memuat data alumni:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAlumni(); }, []);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('students')
                .update({
                    tahap_sekarang: 'ALUMNI',
                    status_akhir: updateForm.status_akhir,
                    // Opsional: Jika Anda punya kolom catatan di database, bisa dimasukkan di sini
                })
                .eq('id', selectedAlumni.id);

            if (error) throw error;
            
            // Catat ke log aktivitas (Audit Trail)
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('activity_logs').insert([{
                user_id: user.id,
                keterangan: `Memperbarui status alumni ${selectedAlumni.nama_lengkap} menjadi ${updateForm.status_akhir}`
            }]);

            alert('Status Alumni berhasil diperbarui!');
            setIsModalOpen(false);
            fetchAlumni();
        } catch (error) {
            alert('Gagal memperbarui status: ' + error.message);
        }
    };

    const openUpdateModal = (siswa) => {
        setSelectedAlumni(siswa);
        setUpdateForm({ status_akhir: siswa.status_akhir || 'AKTIF BEKERJA', catatan: '' });
        setIsModalOpen(true);
        setActiveDropdown(null);
    };

    // Fungsi Kalkulasi Sisa Kontrak (Asumsi default kontrak 3 tahun dari waktu update terakhir)
    const calculateContract = (dateString) => {
        if (!dateString) return { text: 'Tidak diketahui', isWarning: false };
        const start = new Date(dateString);
        const end = new Date(start.setFullYear(start.getFullYear() + 3)); // Kontrak 3 Tahun
        const now = new Date();
        const diffTime = Math.abs(end - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.round(diffDays / 30);

        if (now > end) return { text: 'Kontrak Habis', isWarning: true, color: '#ef4444' };
        if (diffMonths <= 3) return { text: `Sisa ${diffMonths} Bulan`, isWarning: true, color: '#f59e0b' };
        return { text: `Sisa ${diffMonths} Bulan`, isWarning: false, color: '#10b981' };
    };

    const filteredData = alumni.filter(a => {
        const matchSearch = (a.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.perusahaan_tujuan || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterStatus === 'ALL' ? true : (a.status_akhir || '').toUpperCase() === filterStatus;
        return matchSearch && matchFilter;
    });

    const statAktif = alumni.filter(a => (a.status_akhir || '').toUpperCase() === 'AKTIF BEKERJA').length;
    const statBermasalah = alumni.filter(a => ['KABUR', 'PULANG AWAL'].includes((a.status_akhir || '').toUpperCase())).length;

    return (
        <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            {/* ── HEADER ── */}
            <div style={{ background: brandNavy, padding: '20px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => window.history.back()} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><GraduationCap size={24}/> Manajemen Alumni Pasca-Terbang</h1>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Tracking masa kontrak dan status tenaga kerja di Jepang</p>
                    </div>
                </div>
            </div>

            <div style={{ padding: '40px' }}>
                {/* ── KPI CARDS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid ${brandNavy}` }}>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Diberangkatkan</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', margin: '5px 0' }}>{alumni.length}</div>
                    </div>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid #10b981` }}>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Aktif Bekerja (Jepang)</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', margin: '5px 0' }}>{statAktif}</div>
                    </div>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid #ef4444` }}>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Insiden (Kabur / Pulang)</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444', margin: '5px 0' }}>{statBermasalah}</div>
                    </div>
                </div>

                {/* ── MAIN TABLE ── */}
                <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                            <input type="text" placeholder="Cari Nama / Kaisha..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '300px', background: '#f8fafc' }} />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontWeight: 600, color: '#475569' }}>
                            <option value="ALL">Semua Status</option>
                            <option value="AKTIF BEKERJA">Aktif Bekerja</option>
                            <option value="PINDAH KAISHA">Pindah Kaisha</option>
                            <option value="SELESAI KONTRAK">Selesai Kontrak</option>
                            <option value="PULANG AWAL">Pulang Lebih Awal</option>
                            <option value="KABUR">Kabur (Runaway)</option>
                        </select>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={thStyle}>Identitas Alumni</th>
                                <th style={thStyle}>Perusahaan (Kaisha)</th>
                                <th style={thStyle}>Estimasi Kontrak</th>
                                <th style={thStyle}>Status Terkini</th>
                                <th style={{...thStyle, textAlign: 'center'}}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat data alumni...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Tidak ada data alumni ditemukan.</td></tr>
                            ) : (
                                filteredData.map(a => {
                                    const contract = calculateContract(a.updated_at);
                                    const st = (a.status_akhir || 'AKTIF BEKERJA').toUpperCase();
                                    
                                    return (
                                        <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{a.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{a.nik || '-'}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: brandNavy }}><Building2 size={16}/> {a.perusahaan_tujuan || 'Belum Terdata'}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: contract.color }}>
                                                    {contract.isWarning ? <AlertTriangle size={16}/> : <Clock size={16}/>}
                                                    {contract.text}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ 
                                                    background: st === 'AKTIF BEKERJA' ? '#dcfce7' : st === 'KABUR' ? '#fee2e2' : '#f1f5f9', 
                                                    color: st === 'AKTIF BEKERJA' ? '#166534' : st === 'KABUR' ? '#991b1b' : '#475569', 
                                                    padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 
                                                }}>
                                                    {st}
                                                </span>
                                            </td>
                                            <td style={{...tdStyle, textAlign: 'center', position: 'relative'}}>
                                                <button onClick={() => setActiveDropdown(activeDropdown === a.id ? null : a.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                                    <MoreVertical size={20} />
                                                </button>
                                                {activeDropdown === a.id && (
                                                    <div ref={dropdownRef} style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '180px', zIndex: 50, padding: '5px', textAlign: 'left' }}>
                                                        <button onClick={() => openUpdateModal(a)} style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}><Edit size={14} /> Update Status</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODAL UPDATE STATUS ALUMNI ── */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleUpdateStatus} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>Update Status Pasca-Terbang</h2>
                        
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 800, color: brandNavy }}>{selectedAlumni?.nama_lengkap}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedAlumni?.perusahaan_tujuan}</div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Status Saat Ini di Jepang</label>
                            <select 
                                required 
                                value={updateForm.status_akhir} 
                                onChange={e => setUpdateForm({...updateForm, status_akhir: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700 }}
                            >
                                <option value="AKTIF BEKERJA">✅ Aktif Bekerja (Aman)</option>
                                <option value="PINDAH KAISHA">🔄 Pindah Perusahaan</option>
                                <option value="SELESAI KONTRAK">🎓 Selesai Kontrak (Lulus)</option>
                                <option value="PULANG AWAL">⚠️ Pulang Lebih Awal</option>
                                <option value="KABUR">🚨 KABUR (Runaway)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                            <button type="submit" style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Simpan Status</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: '15px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px 20px', fontSize: '0.9rem', color: '#334155', verticalAlign: 'middle' };