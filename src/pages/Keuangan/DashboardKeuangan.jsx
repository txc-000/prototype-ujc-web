import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet, CheckCircle, Clock, Search, Loader2, PiggyBank, PlusCircle, History, RotateCcw } from 'lucide-react';

export default function DashboardKeuangan() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('PEMBAYARAN'); 
    const [tabunganInput, setTabunganInput] = useState({});

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('students').select('*');
            
            if (activeTab === 'PEMBAYARAN') {
                query = query.eq('status_lunas', false);
            } else if (activeTab === 'HISTORY') {
                query = query.eq('status_lunas', true);
            }
            // Tab TABUNGAN menampilkan semua siswa (tidak difilter status lunas)

            const { data, error } = await query.order('updated_at', { ascending: false });
            
            if (error) throw error;
            if (data) setStudents(data);
        } catch (err) {
            console.error("Gagal menarik data keuangan:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleUpdatePayment = async (studentId, amount, isLunas) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase.from('students').update({ 
                total_bayar: amount, 
                status_lunas: isLunas,
                // Pipeline: Jika lunas geser ke PEMBERKASAN, jika batal balik ke PEMBAYARAN
                tahap_sekarang: isLunas ? 'PEMBERKASAN' : 'PEMBAYARAN',
                updated_at: new Date()
            }).eq('id', studentId);

            if (error) throw error;
            
            alert(isLunas ? "Pembayaran Berhasil Diverifikasi!" : "Status Lunas Dibatalkan.");
            fetchData();
        } catch (err) {
            alert("Gagal update: " + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddTabungan = async (studentId, currentTotal) => {
        const amountToAdd = Number(tabunganInput[studentId] || 0);
        if (amountToAdd <= 0) return alert("Nominal tidak valid.");

        setIsUpdating(true);
        try {
            const { error } = await supabase.from('students')
                .update({ 
                    total_tabungan: (currentTotal || 0) + amountToAdd,
                    updated_at: new Date() 
                })
                .eq('id', studentId);

            if (error) throw error;
            setTabunganInput({ ...tabunganInput, [studentId]: '' });
            fetchData();
            alert("Tabungan berhasil ditambahkan.");
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontWeight: 600 }}>
                    <Wallet size={18} /> Keuangan
                </div>
            </aside>

            {/* MAIN */}
            <main style={{ flex: 1, padding: '40px' }}>
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '15px' }}>Pusat Keuangan</h1>
                        <div style={{ display: 'flex', gap: '10px', background: '#e2e8f0', padding: '5px', borderRadius: '8px' }}>
                            <button onClick={() => setActiveTab('PEMBAYARAN')} style={tabStyle(activeTab === 'PEMBAYARAN')}><Wallet size={16}/> Tagihan</button>
                            <button onClick={() => setActiveTab('TABUNGAN')} style={tabStyle(activeTab === 'TABUNGAN')}><PiggyBank size={16}/> Tabungan</button>
                            <button onClick={() => setActiveTab('HISTORY')} style={tabStyle(activeTab === 'HISTORY')}><History size={16}/> Riwayat Lunas</button>
                        </div>
                    </div>
                    <input type="text" placeholder="Cari Siswa..." onChange={(e) => setSearchTerm(e.target.value)} style={searchStyle} />
                </header>

                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={thStyle}>Siswa</th>
                                <th style={thStyle}>{activeTab === 'TABUNGAN' ? 'Saldo Tabungan' : 'Nominal (Rp)'}</th>
                                <th style={thStyle}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /></td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Data tidak ditemukan.</td></tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{s.nama_lengkap}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NIK: {s.nik}</div>
                                        </td>

                                        {activeTab === 'TABUNGAN' ? (
                                            <>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Rp {(s.total_tabungan || 0).toLocaleString()}</div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <input type="number" placeholder="Setor..." value={tabunganInput[s.id] || ''} onChange={(e) => setTabunganInput({...tabunganInput, [s.id]: e.target.value})} style={smallInput} />
                                                        <button onClick={() => handleAddTabungan(s.id, s.total_tabungan || 0)} style={btnStyle('#3b82f6')}><PlusCircle size={18}/></button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={tdStyle}>
                                                    <input type="number" defaultValue={s.total_bayar} onBlur={(e) => handleUpdatePayment(s.id, e.target.value, s.status_lunas)} style={smallInput} />
                                                </td>
                                                <td style={tdStyle}>
                                                    {activeTab === 'PEMBAYARAN' ? (
                                                        <button onClick={() => handleUpdatePayment(s.id, s.total_bayar, true)} style={btnStyle('#059669')}>Konfirmasi Lunas</button>
                                                    ) : (
                                                        <button onClick={() => handleUpdatePayment(s.id, s.total_bayar, false)} style={btnStyle('#ef4444')}><RotateCcw size={16}/> Batal Lunas</button>
                                                    )}
                                                </td>
                                            </>
                                        )}
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
const btnStyle = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' });
const thStyle = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '15px 20px' };
const smallInput = { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '150px', outline: 'none' };
const searchStyle = { padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '250px', outline: 'none' };