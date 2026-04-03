import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FolderCheck, Search, Loader2, FileText, Activity, History, RotateCcw, CheckCircle } from 'lucide-react';

export default function DashboardDokumen() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('PEMBERKASAN'); // 'PEMBERKASAN' atau 'HISTORY'

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('students').select('id, nik, nama_lengkap, medical_checkup_status, paspor_tersedia, tahap_sekarang');
            
            // Antrean aktif: Siswa yang berada di tahap PEMBERKASAN
            if (activeTab === 'PEMBERKASAN') {
                query = query.eq('tahap_sekarang', 'PEMBERKASAN');
            } 
            // Riwayat: Siswa yang sudah dilempar ke tahap TRAINING atau PENEMPATAN
            else {
                query = query.in('tahap_sekarang', ['TRAINING', 'PENEMPATAN']);
            }

            const { data, error } = await query.order('updated_at', { ascending: false });
            if (error) throw error;
            if (data) setStudents(data);
        } catch (err) {
            console.error("Gagal menarik data:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Simpan perubahan form (tanpa memindahkan tahap)
    const handleSaveData = async (studentId, field, value) => {
        try {
            const { error } = await supabase.from('students')
                .update({ [field]: value, updated_at: new Date() })
                .eq('id', studentId);
            if (error) throw error;
            // Kita fetch ulang senyap untuk sinkronisasi state
            fetchData(); 
        } catch (err) {
            alert("Gagal menyimpan: " + err.message);
        }
    };

    // Pindahkan siswa ke tahap PELATIHAN (TRAINING)
    const handleAdvanceToTraining = async (studentId, medStatus, pasporStatus) => {
        if (medStatus !== 'FIT') {
            return alert("Siswa belum dinyatakan FIT (Sehat). Tidak bisa lanjut ke Pelatihan.");
        }
        if (!pasporStatus) {
            const confirm = window.confirm("Paspor belum tersedia. Yakin ingin melanjutkan ke Pelatihan?");
            if (!confirm) return;
        }

        setIsUpdating(true);
        try {
            const { error } = await supabase.from('students')
                .update({ tahap_sekarang: 'TRAINING', updated_at: new Date() })
                .eq('id', studentId);
            if (error) throw error;
            
            alert("Berkas Selesai! Siswa diteruskan ke Divisi Pelatihan.");
            fetchData();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // Batalkan pengiriman (Tarik kembali dari Pelatihan ke Dokumen)
    const handleRevert = async (studentId) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase.from('students')
                .update({ tahap_sekarang: 'PEMBERKASAN', updated_at: new Date() })
                .eq('id', studentId);
            if (error) throw error;
            
            alert("Data ditarik kembali ke antrean Pemberkasan.");
            fetchData();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredStudents = students.filter(s => 
        s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) || s.nik.includes(searchTerm)
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '250px', background: '#0f172a', color: 'white', padding: '30px 20px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '40px', color: '#fbbf24', fontFamily: 'var(--font-serif)' }}>UJC CONVEYOR</h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>DIVISI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontWeight: 600 }}>
                    <FolderCheck size={18} /> Dokumen & MCU
                </div>
            </aside>

            {/* MAIN */}
            <main style={{ flex: 1, padding: '40px' }}>
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '15px' }}>Pusat Pemberkasan</h1>
                        <div style={{ display: 'flex', gap: '10px', background: '#e2e8f0', padding: '5px', borderRadius: '8px' }}>
                            <button onClick={() => setActiveTab('PEMBERKASAN')} style={tabStyle(activeTab === 'PEMBERKASAN')}><FileText size={16}/> Antrean Berkas</button>
                            <button onClick={() => setActiveTab('HISTORY')} style={tabStyle(activeTab === 'HISTORY')}><History size={16}/> Selesai / Dikirim</button>
                        </div>
                    </div>
                    <input type="text" placeholder="Cari Nama/NIK..." onChange={(e) => setSearchTerm(e.target.value)} style={searchStyle} />
                </header>

                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={thStyle}>Siswa</th>
                                <th style={thStyle}><div style={{display:'flex', alignItems:'center', gap:'5px'}}><Activity size={16}/> Hasil MCU</div></th>
                                <th style={thStyle}><div style={{display:'flex', alignItems:'center', gap:'5px'}}><FolderCheck size={16}/> Status Paspor</div></th>
                                <th style={thStyle}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /></td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada antrean.</td></tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{s.nama_lengkap}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NIK: {s.nik}</div>
                                        </td>
                                        
                                        {/* KOLOM MEDICAL CHECKUP */}
                                        <td style={tdStyle}>
                                            <select 
                                                value={s.medical_checkup_status} 
                                                onChange={(e) => handleSaveData(s.id, 'medical_checkup_status', e.target.value)}
                                                disabled={activeTab === 'HISTORY'}
                                                style={{...selectStyle, color: s.medical_checkup_status === 'FIT' ? '#059669' : s.medical_checkup_status === 'UNFIT' ? '#ef4444' : '#64748b'}}
                                            >
                                                <option value="PENDING">Menunggu Hasil</option>
                                                <option value="FIT">FIT (Sehat)</option>
                                                <option value="UNFIT">UNFIT (Gagal)</option>
                                            </select>
                                        </td>

                                        {/* KOLOM PASPOR */}
                                        <td style={tdStyle}>
                                            <select 
                                                value={s.paspor_tersedia ? 'ADA' : 'BELUM'} 
                                                onChange={(e) => handleSaveData(s.id, 'paspor_tersedia', e.target.value === 'ADA')}
                                                disabled={activeTab === 'HISTORY'}
                                                style={selectStyle}
                                            >
                                                <option value="BELUM">Belum Ada</option>
                                                <option value="ADA">Sudah Ada Paspor</option>
                                            </select>
                                        </td>

                                        {/* KOLOM AKSI (KONVEYOR) */}
                                        <td style={tdStyle}>
                                            {activeTab === 'PEMBERKASAN' ? (
                                                <button 
                                                    onClick={() => handleAdvanceToTraining(s.id, s.medical_checkup_status, s.paspor_tersedia)}
                                                    disabled={isUpdating}
                                                    style={btnStyle(s.medical_checkup_status === 'FIT' ? '#059669' : '#94a3b8')}
                                                >
                                                    <CheckCircle size={16}/> Kirim ke Pelatihan
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleRevert(s.id)}
                                                    disabled={isUpdating}
                                                    style={btnStyle('#ef4444')}
                                                >
                                                    <RotateCcw size={16}/> Tarik Kembali
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

const tabStyle = (active) => ({ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: active ? 'white' : 'transparent', fontWeight: 700, color: active ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' });
const btnStyle = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', transition: 'background 0.3s' });
const thStyle = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '15px 20px' };
const selectStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 600, background: '#fff' };
const searchStyle = { padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '250px', outline: 'none' };