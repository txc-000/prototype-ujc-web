import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
    GraduationCap, Search, AlertTriangle, Clock, MoreVertical, 
    Edit, ArrowLeft, Plane, Building2, Filter, PieChart, Users, Loader2
} from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function DashboardAlumni() {
    const navigate = useNavigate();
    
    const [rawAlumni, setRawAlumni] = useState([]);
    const [alumni, setAlumni] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // FILTER STATE
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterKaisha, setFilterKaisha] = useState('');
    const [filterKumiai, setFilterKumiai] = useState('');
    
    // MASTER DATA UNTUK FILTER
    const [masterKaisha, setMasterKaisha] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);

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

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [resKaisha, resKumiai] = await Promise.all([
                    supabase.from('master_kaisha').select('nama_perusahaan, nama_kaisha'),
                    supabase.from('master_kumiai').select('nama_kumiai')
                ]);
                if (resKaisha.data) setMasterKaisha(resKaisha.data);
                if (resKumiai.data) setMasterKumiai(resKumiai.data);
            } catch (err) {}
        };
        fetchMasterData();
        fetchAlumni();
    }, []);

    const fetchAlumni = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .in('tahap_sekarang', ['SIAP BERANGKAT', 'ALUMNI'])
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setRawAlumni(data || []);
            setAlumni(data || []);
        } catch (error) {
            console.error('Gagal memuat data alumni:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // PROSES FILTERING CLIENT-SIDE
    useEffect(() => {
        let result = [...rawAlumni];

        if (searchTerm) {
            result = result.filter(a => (a.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        if (filterStatus !== 'ALL') {
            result = result.filter(a => (a.status_akhir || '').toUpperCase() === filterStatus);
        }

        if (filterKaisha) {
            result = result.filter(a => a.perusahaan_tujuan === filterKaisha);
        }

        if (filterKumiai) {
            result = result.filter(a => {
                const otit = typeof a.data_otit === 'string' ? JSON.parse(a.data_otit || '{}') : (a.data_otit || {});
                return otit.nama_kumiai === filterKumiai;
            });
        }

        setAlumni(result);
    }, [searchTerm, filterStatus, filterKaisha, filterKumiai, rawAlumni]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('students')
                .update({
                    tahap_sekarang: 'ALUMNI',
                    status_akhir: updateForm.status_akhir,
                })
                .eq('id', selectedAlumni.id);

            if (error) throw error;
            
            const { data: { user } } = await supabase.auth.getUser();
            if(user) {
                await supabase.from('activity_logs').insert([{
                    user_id: user.id,
                    keterangan: `Memperbarui status alumni ${selectedAlumni.nama_lengkap} menjadi ${updateForm.status_akhir}`
                }]);
            }

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

    const calculateContract = (dateString) => {
        if (!dateString) return { text: 'Tidak diketahui', isWarning: false };
        const start = new Date(dateString);
        const end = new Date(start.setFullYear(start.getFullYear() + 3)); 
        const now = new Date();
        const diffTime = Math.abs(end - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.round(diffDays / 30);

        if (now > end) return { text: 'Kontrak Habis', isWarning: true, color: '#ef4444' };
        if (diffMonths <= 3) return { text: `Sisa ${diffMonths} Bulan`, isWarning: true, color: '#f59e0b' };
        return { text: `Sisa ${diffMonths} Bulan`, isWarning: false, color: '#10b981' };
    };

    const statAktif = alumni.filter(a => (a.status_akhir || '').toUpperCase() === 'AKTIF BEKERJA').length;
    const statBermasalah = alumni.filter(a => ['KABUR', 'PULANG AWAL'].includes((a.status_akhir || '').toUpperCase())).length;
    const statSelesai = alumni.filter(a => (a.status_akhir || '').toUpperCase() === 'SELESAI KONTRAK').length;

    return (
        <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            {/* ── HEADER ── */}
            <div style={{ background: brandNavy, padding: '20px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => window.history.back()} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Plane size={24}/> Pantauan Alumni (Eks-Jepang)</h1>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Tracking masa kontrak, status tenaga kerja, dan riwayat kumiai di Jepang</p>
                    </div>
                </div>
            </div>

            <div style={{ padding: '40px' }}>
                
                {/* ── FILTER GLOBAL DASHBOARD ── */}
                <div style={{ display: 'flex', gap: '15px', background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '30px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 2 }}>
                        <div style={filterLabel}>Cari Nama Siswa</div>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                            <input type="text" placeholder="Ketik nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '100%', fontSize: '0.9rem' }} />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={filterLabel}><Building2 size={12} style={{display:'inline', marginBottom:'-2px'}}/> Perusahaan (Kaisha)</div>
                        <select style={filterInput} value={filterKaisha} onChange={(e) => setFilterKaisha(e.target.value)}>
                            <option value="">Semua Kaisha</option>
                            {masterKaisha.map((k,i) => <option key={i} value={k.nama_perusahaan || k.nama_kaisha}>{k.nama_perusahaan || k.nama_kaisha}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={filterLabel}><Users size={12} style={{display:'inline', marginBottom:'-2px'}}/> Asosiasi (Kumiai)</div>
                        <select style={filterInput} value={filterKumiai} onChange={(e) => setFilterKumiai(e.target.value)}>
                            <option value="">Semua Kumiai</option>
                            {masterKumiai.map((k,i) => <option key={i} value={k.nama_kumiai}>{k.nama_kumiai}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={filterLabel}><Filter size={12} style={{display:'inline', marginBottom:'-2px'}}/> Status Siswa</div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterInput}>
                            <option value="ALL">Semua Status</option>
                            <option value="AKTIF BEKERJA">Aktif Bekerja</option>
                            <option value="PINDAH KAISHA">Pindah Kaisha</option>
                            <option value="SELESAI KONTRAK">Selesai Kontrak</option>
                            <option value="PULANG AWAL">Pulang Lebih Awal</option>
                            <option value="KABUR">Kabur (Runaway)</option>
                        </select>
                    </div>
                </div>

                {/* ── KPI CARDS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid ${brandNavy}` }}>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Ditampilkan</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', margin: '5px 0' }}>{alumni.length}</div>
                    </div>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid #10b981` }}>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Aktif Bekerja (Jepang)</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', margin: '5px 0' }}>{statAktif}</div>
                    </div>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid #3b82f6` }}>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Selesai Kontrak (Lulus)</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3b82f6', margin: '5px 0' }}>{statSelesai}</div>
                    </div>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: `4px solid #ef4444` }}>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Insiden (Kabur/Pulang)</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444', margin: '5px 0' }}>{statBermasalah}</div>
                    </div>
                </div>

                {/* ── MAIN TABLE ── */}
                <div style={{ background: 'white', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={thStyle}>Identitas Alumni</th>
                                <th style={thStyle}>Penempatan (Kaisha & Kumiai)</th>
                                <th style={thStyle}>Estimasi Kontrak</th>
                                <th style={thStyle}>Status Terkini</th>
                                <th style={{...thStyle, textAlign: 'center'}}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" style={{ padding: '50px', textAlign: 'center' }}><Loader2 className="animate-spin" size={30} color={brandNavy} style={{margin:'0 auto'}}/></td></tr>
                            ) : alumni.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Tidak ada data alumni yang sesuai filter.</td></tr>
                            ) : (
                                alumni.map(a => {
                                    const contract = calculateContract(a.tanggal_entri || a.updated_at);
                                    const st = (a.status_akhir || 'AKTIF BEKERJA').toUpperCase();
                                    const otit = typeof a.data_otit === 'string' ? JSON.parse(a.data_otit || '{}') : (a.data_otit || {});
                                    
                                    return (
                                        <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.05rem' }}>{a.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>NIK: {a.nik || '-'}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: brandNavy, marginBottom: '4px' }}>
                                                    <Building2 size={16}/> {a.perusahaan_tujuan || 'Belum Terdata'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                    <Users size={12}/> {otit.nama_kumiai || '-'}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: contract.color }}>
                                                    {contract.isWarning ? <AlertTriangle size={16}/> : <Clock size={16}/>}
                                                    {contract.text}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                                                    Mulai: {a.tanggal_entri ? new Date(a.tanggal_entri).toLocaleDateString('id-ID') : 'Belum diisi'}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ 
                                                    background: st === 'AKTIF BEKERJA' ? '#dcfce7' : st === 'KABUR' ? '#fee2e2' : '#f1f5f9', 
                                                    color: st === 'AKTIF BEKERJA' ? '#166534' : st === 'KABUR' ? '#991b1b' : '#475569', 
                                                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900 
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
                    <form onSubmit={handleUpdateStatus} style={{ background: 'white', padding: '35px', borderRadius: '20px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>Update Status Pekerja</h2>
                        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b' }}>Perbarui kondisi terkini alumni di Jepang.</p>
                        
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 900, color: brandNavy, fontSize: '1.1rem' }}>{selectedAlumni?.nama_lengkap}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>📍 {selectedAlumni?.perusahaan_tujuan || 'Perusahaan tidak diketahui'}</div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Status Kondisi Saat Ini</label>
                            <select 
                                required 
                                value={updateForm.status_akhir} 
                                onChange={e => setUpdateForm({...updateForm, status_akhir: e.target.value})}
                                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px solid #cbd5e1', outline: 'none', fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}
                            >
                                <option value="AKTIF BEKERJA">✅ Aktif Bekerja (Aman)</option>
                                <option value="PINDAH KAISHA">🔄 Pindah Perusahaan</option>
                                <option value="SELESAI KONTRAK">🎓 Selesai Kontrak (Lulus)</option>
                                <option value="PULANG AWAL">⚠️ Pulang Lebih Awal</option>
                                <option value="KABUR">🚨 KABUR (Runaway)</option>
                            </select>
                            
                            {updateForm.status_akhir === 'KABUR' && (
                                <p style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <AlertTriangle size={14}/> Perhatian: Status KABUR akan mempengaruhi rating lembaga.
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 20px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Batal</button>
                            <button type="submit" style={{ padding: '12px 25px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 }}>Simpan Pembaruan</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: '18px 25px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '18px 25px', fontSize: '0.95rem', color: '#334155', verticalAlign: 'middle' };
const filterLabel = { fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' };
const filterInput = { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem', color: '#1e293b', background: '#f8fafc', width: '100%', fontWeight: 600 };