import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, CheckCircle, XCircle, Edit3, Save, X, Search, Loader2, ClipboardList, Plus, History, RotateCcw } from 'lucide-react';

export default function DashboardPelatihan() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ANTREAN'); // 'ANTREAN' atau 'RIWAYAT'
    const [selectedStudent, setSelectedStudent] = useState(null); // Modal Raport
    
    // State Input Nilai Baru
    const [newNilai, setNewNilai] = useState({ materi: '', skor: '' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('students').select('*');

            if (activeTab === 'ANTREAN') {
                // Siswa yang sedang dalam masa pelatihan
                query = query.eq('tahap_sekarang', 'TRAINING').eq('status_akhir', 'PROSES');
            } else {
                // Siswa yang sudah lulus pelatihan (pindah ke penempatan) atau gagal (DO)
                query = query.or('tahap_sekarang.eq.PENEMPATAN,status_akhir.eq.GAGAL');
            }

            const { data, error } = await query.order('updated_at', { ascending: false });
            if (error) throw error;
            if (data) setStudents(data);
        } catch (err) {
            console.error("Error fetch:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [activeTab]);

    // FUNGSI TAMBAH NILAI (RAPORT)
    const handleAddNilai = async () => {
        if (!newNilai.materi || !newNilai.skor) return alert("Isi materi dan nilai, Tuanku.");
        
        const entry = {
            id: Date.now(),
            materi: newNilai.materi,
            skor: Number(newNilai.skor),
            status: Number(newNilai.skor) < 75 ? 'REMED' : 'LULUS',
            tanggal: new Date().toLocaleDateString('id-ID')
        };

        const updatedHistory = [...(selectedStudent.nilai_history || []), entry];

        try {
            const { error } = await supabase.from('students')
                .update({ nilai_history: updatedHistory, updated_at: new Date() })
                .eq('id', selectedStudent.id);

            if (error) throw error;
            
            setSelectedStudent({ ...selectedStudent, nilai_history: updatedHistory });
            setNewNilai({ materi: '', skor: '' });
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleAction = async (id, actionType) => {
        let payload = {};
        if (actionType === 'LULUS_PELATIHAN') {
            payload = { tahap_sekarang: 'PENEMPATAN', updated_at: new Date() };
        } else if (actionType === 'GAGAL') {
            if (!window.confirm("Yakin ingin men-Drop Out siswa ini?")) return;
            payload = { status_akhir: 'GAGAL', updated_at: new Date() };
        } else if (actionType === 'REVERT') {
            payload = { tahap_sekarang: 'TRAINING', status_akhir: 'PROSES', updated_at: new Date() };
        }

        await supabase.from('students').update(payload).eq('id', id);
        fetchData();
        alert("Status berhasil diperbarui!");
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
                    <BookOpen size={18} /> Pelatihan Bahasa
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main style={{ flex: 1, padding: '40px' }}>
                <header style={{ marginBottom: '30px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '15px' }}>Pusat Pelatihan</h1>
                        <div style={{ display: 'flex', gap: '10px', background: '#e2e8f0', padding: '5px', borderRadius: '8px' }}>
                            <button onClick={() => setActiveTab('ANTREAN')} style={tabStyle(activeTab === 'ANTREAN')}><BookOpen size={16}/> Antrean Kelas</button>
                            <button onClick={() => setActiveTab('RIWAYAT')} style={tabStyle(activeTab === 'RIWAYAT')}><History size={16}/> Riwayat Pelatihan</button>
                        </div>
                    </div>
                    <input type="text" placeholder="Cari Nama/NIK..." onChange={(e) => setSearchTerm(e.target.value)} style={searchStyle} />
                </header>

                {/* MODAL RAPORT (HISTORY NILAI) */}
                {selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
                                <h3>📊 Raport & History: {selectedStudent.nama_lengkap}</h3>
                                <button onClick={() => setSelectedStudent(null)} style={{border:'none', background:'none', cursor:'pointer'}}><X/></button>
                            </div>

                            {/* Form Input Nilai Baru (Hanya tampil di tab Antrean) */}
                            {activeTab === 'ANTREAN' && (
                                <div style={{ display:'flex', gap:'10px', marginBottom:'25px', background:'#f8fafc', padding:'15px', borderRadius:'8px' }}>
                                    <input type="text" placeholder="Materi (Contoh: Kanji)" value={newNilai.materi} onChange={e => setNewNilai({...newNilai, materi: e.target.value})} style={inputStyle} />
                                    <input type="number" placeholder="Nilai" value={newNilai.skor} onChange={e => setNewNilai({...newNilai, skor: e.target.value})} style={inputStyle} />
                                    <button onClick={handleAddNilai} style={btnStyle('#3b82f6')}><Plus size={18}/> Tambah Nilai</button>
                                </div>
                            )}

                            {/* Tabel History Nilai */}
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{background:'#f1f5f9', position: 'sticky', top: 0}}>
                                        <tr><th style={thS}>Tanggal</th><th style={thS}>Materi</th><th style={thS}>Skor</th><th style={thS}>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        {(selectedStudent.nilai_history || []).length === 0 ? (
                                            <tr><td colSpan="4" style={{padding:'20px', textAlign:'center', color:'#888'}}>Belum ada catatan nilai.</td></tr>
                                        ) : (
                                            selectedStudent.nilai_history.map(h => (
                                                <tr key={h.id} style={{borderBottom:'1px solid #eee'}}>
                                                    <td style={tdS}>{h.tanggal}</td>
                                                    <td style={tdS}><b>{h.materi}</b></td>
                                                    <td style={tdS}>{h.skor}</td>
                                                    <td style={tdS}>
                                                        <span style={{ color: h.status === 'REMED' ? '#ef4444' : '#059669', fontWeight: 700, fontSize: '0.75rem' }}>{h.status}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TABEL UTAMA */}
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr><th style={thStyle}>Siswa</th><th style={thStyle}>Aksi Pelatihan</th></tr>
                        </thead>
                        <tbody>
                            {isLoading ? <tr><td colSpan="2" style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin"/></td></tr> :
                            filteredStudents.length === 0 ? <tr><td colSpan="2" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>Data tidak ditemukan.</td></tr> :
                            filteredStudents.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 600 }}>{s.nama_lengkap}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NIK: {s.nik} | {s.asal_sekolah}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setSelectedStudent(s)} style={btnStyle('#6366f1')}><ClipboardList size={16}/> Raport / History</button>
                                            
                                            {activeTab === 'ANTREAN' ? (
                                                <>
                                                    <button onClick={() => handleAction(s.id, 'LULUS_PELATIHAN')} style={btnStyle('#059669')}>Lulus Kelas</button>
                                                    <button onClick={() => handleAction(s.id, 'GAGAL')} style={btnStyle('#ef4444')}>Drop Out</button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleAction(s.id, 'REVERT')} style={btnStyle('#64748b')}><RotateCcw size={16}/> Kembalikan ke Kelas</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

// STYLES
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '30px', borderRadius: '12px', width: '650px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const thS = { padding: '12px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' };
const tdS = { padding: '12px', fontSize: '0.9rem' };
const tabStyle = (active) => ({ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: active ? 'white' : 'transparent', fontWeight: 700, color: active ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' });
const btnStyle = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.85rem' });
const thStyle = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' };
const tdStyle = { padding: '15px 20px' };
const inputStyle = { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' };
const searchStyle = { padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '250px', outline: 'none' };