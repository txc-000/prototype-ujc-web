import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    FileCheck, ClipboardCheck, PlaneTakeoff, Send, Search, Loader2, 
    UserCircle, CheckCircle2, MessageCircle, MoreHorizontal, X, Award 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

export default function DashboardDokumen() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('PEMBERKASAN'); // PEMBERKASAN, KONTRAK, COE_VISA, KEBERANGKATAN
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE MODAL CHECKLIST ──
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [checklist, setChecklist] = useState({});

    const docItems = [
        { id: 'ktp', label: 'KTP Asli & Copy' },
        { id: 'kk', label: 'KK Asli & Copy' },
        { id: 'akta', label: 'Akta Lahir Asli' },
        { id: 'paspor', label: 'Paspor (Berlaku > 2 Thn)' },
        { id: 'ijazah', label: 'Ijazah Terakhir' },
        { id: 'mcu_final', label: 'Hasil MCU Akhir (FIT)' },
        { id: 'skck', label: 'SKCK Polda' },
        { id: 'foto', label: 'Pas Foto 3x4 & 4x6' }
    ];

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchUserProfile(user.id);
        };
        initData();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [activeTab]);

    const fetchUserProfile = async (userId) => {
        try {
            const { data } = await supabase.from('employees').select('nama_lengkap, id_karyawan, poin_pendaftaran, master_role(nama_role)').eq('id', userId).maybeSingle();
            if (data) { setUserProfile(data); setMyPoints(data.poin_pendaftaran || 0); }
        } catch (err) { console.error(err); }
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            let stageFilter = [];
            if (activeTab === 'PEMBERKASAN') stageFilter = ['MATCHED', 'PENGUMPULAN BERKAS'];
            if (activeTab === 'KONTRAK') stageFilter = ['TTD KONTRAK'];
            if (activeTab === 'COE_VISA') stageFilter = ['APPLY COE', 'APPLY VISA'];
            if (activeTab === 'KEBERANGKATAN') stageFilter = ['SIAP BERANGKAT'];

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .in('tahap_sekarang', stageFilter)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setStudents(data || []);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const logActivity = async (actionDesc) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('activity_logs').insert([{ user_id: user.id, keterangan: actionDesc }]);
        } catch (err) {}
    };

    const incrementPoint = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const newPoint = myPoints + 1;
            await supabase.from('employees').update({ poin_pendaftaran: newPoint }).eq('id', user.id);
            setMyPoints(newPoint);
        } catch (err) {}
    };

    // ── LOGIKA CHECKLIST & PROGRES ──
    const openChecklist = (student) => {
        setSelectedStudent(student);
        // Load data checklist dari JSONB 'attachments' atau field lain. 
        // Sementara kita simpan di state lokal (dalam riilnya ini disimpan di DB)
        setChecklist(student.pemberkasan_status || {}); 
        setIsModalOpen(true);
    };

    const handleCheckItem = (id) => {
        setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const saveChecklist = async () => {
        try {
            const { error } = await supabase
                .from('students')
                .update({ pemberkasan_status: checklist, updated_at: new Date() })
                .eq('id', selectedStudent.id);
            
            if (error) throw error;
            await logActivity(`Update checklist dokumen: ${selectedStudent.nama_lengkap}`);
            alert("Progres Dokumen Disimpan!");
            setIsModalOpen(false);
            fetchStudents();
        } catch (err) { alert(err.message); }
    };

    const handleUpdateStage = async (id, nama, newStage) => {
        if(!window.confirm(`Pindahkan ${nama} ke tahap ${newStage}?`)) return;
        try {
            const { error } = await supabase.from('students').update({ tahap_sekarang: newStage, updated_at: new Date() }).eq('id', id);
            if (error) throw error;
            await logActivity(`Memindahkan ${nama} ke tahap ${newStage}`);
            await incrementPoint();
            alert("Status Diperbarui!");
            fetchStudents();
        } catch (err) { alert(err.message); }
    };

    const handleWA = (nama, telp, konteks) => {
        let msg = `Halo ${nama}, ini dari Divisi Dokumen UJC. `;
        if (konteks === 'KONTRAK') msg += `Mohon kehadirannya di kantor untuk Tanda Tangan Kontrak Kerja.`;
        else if (konteks === 'BERKAS') msg += `Mohon segera melengkapi kekurangan berkas fisik Anda.`;
        
        let phone = telp?.replace(/[^0-9]/g, '');
        if (phone?.startsWith('0')) phone = '62' + phone.substring(1);
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const filtered = students.filter(s => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR ── */}
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Divisi Dokumen</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Legalitas & Administrasi</p>
                </div>

                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><Award size={20}/></div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Poin Keaktifan</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{myPoints} <span style={{fontSize:'0.8rem', color:'#64748b'}}>Aksi</span></div>
                    </div>
                </div>

                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <button onClick={() => setActiveTab('PEMBERKASAN')} style={activeTab === 'PEMBERKASAN' ? activeMenuS : inactiveMenuS}><ClipboardCheck size={18} /> Pemberkasan Awal</button>
                    <button onClick={() => setActiveTab('KONTRAK')} style={activeTab === 'KONTRAK' ? activeMenuS : inactiveMenuS}><FileCheck size={18} /> Kontrak Kerja</button>
                    <button onClick={() => setActiveTab('COE_VISA')} style={activeTab === 'COE_VISA' ? activeMenuS : inactiveMenuS}><Send size={18} /> Proses CoE & Visa</button>
                    <button onClick={() => setActiveTab('KEBERANGKATAN')} style={activeTab === 'KEBERANGKATAN' ? activeMenuS : inactiveMenuS}><PlaneTakeoff size={18} /> Keberangkatan</button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <UserCircle size={32} color={brandNavy} />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile?.nama_lengkap || 'Memuat...'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>STAF DOKUMEN</div>
                        </div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '8px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Keluar</button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>{activeTab.replace('_', ' & ')}</h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Pantau kelengkapan berkas dan alur imigrasi siswa.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                        <input type="text" placeholder="Cari Nama Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }} />
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <tr>
                                    <th style={thS}>Siswa</th>
                                    <th style={thS}>Status Pipeline</th>
                                    <th style={thS}>Progres Dokumen</th>
                                    <th style={{...thS, textAlign: 'center'}}>Aksi Dokumen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? <tr><td colSpan="4" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" /></td></tr> : filtered.map(s => {
                                    const doneCount = Object.values(s.pemberkasan_status || {}).filter(v => v === true).length;
                                    const progress = Math.round((doneCount / docItems.length) * 100);
                                    
                                    return (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdS}>
                                                <div style={{fontWeight:800}}>{s.nama_lengkap}</div>
                                                <div style={{fontSize:'0.75rem', color:'#64748b'}}>{s.id_karyawan || s.nik}</div>
                                            </td>
                                            <td style={tdS}>
                                                <span style={badgeS}>{s.tahap_sekarang}</span>
                                            </td>
                                            <td style={tdS}>
                                                <div style={{ width: '100%', background: '#e2e8f0', height: '8px', borderRadius: '10px', overflow: 'hidden', marginBottom: '5px' }}>
                                                    <div style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : brandNavy, height: '100%', transition: '0.3s' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: progress === 100 ? '#10b981' : '#64748b' }}>{progress}% Lengkap</span>
                                            </td>
                                            <td style={{...tdS, textAlign: 'center'}}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button onClick={() => openChecklist(s)} style={btnA('#3b82f6')} title="Checklist Berkas"><ClipboardCheck size={18}/></button>
                                                    
                                                    {activeTab === 'PEMBERKASAN' && (
                                                        <>
                                                            <button onClick={() => handleWA(s.nama_lengkap, s.telepon, 'BERKAS')} style={btnA('#10b981')}><MessageCircle size={18}/></button>
                                                            <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'TTD KONTRAK')} style={btnGo}>Maju TTD Kontrak</button>
                                                        </>
                                                    )}
                                                    {activeTab === 'KONTRAK' && (
                                                        <>
                                                            <button onClick={() => handleWA(s.nama_lengkap, s.telepon, 'KONTRAK')} style={btnA('#10b981')}><MessageCircle size={18}/></button>
                                                            <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'APPLY COE')} style={btnGo}>Maju Apply CoE</button>
                                                        </>
                                                    )}
                                                    {activeTab === 'COE_VISA' && (
                                                        <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'SIAP BERANGKAT')} style={btnGo}>Visa Terbit (Siap Berangkat)</button>
                                                    )}
                                                    {activeTab === 'KEBERANGKATAN' && (
                                                        <button style={{...btnGo, background: '#10b981'}}>Laporkan Terbang ✈️</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── MODAL CHECKLIST BERKAS ── */}
                {isModalOpen && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900 }}>Checklist Dokumen Fisik</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{selectedStudent?.nama_lengkap}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                                {docItems.map(item => (
                                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={checklist[item.id] || false} onChange={() => handleCheckItem(item.id)} style={{ width: '18px', height: '18px' }} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <button onClick={saveChecklist} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                                Simpan Rekap Data Dokumen
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── STYLE OBJECTS ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', fontWeight: 800, width: '100%', textAlign: 'left', cursor: 'pointer' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 700, width: '100%', textAlign: 'left', cursor: 'pointer' };
const thS = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdS = { padding: '15px 20px', fontSize: '0.9rem' };
const badgeS = { fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: '#e0e7ff', color: '#3730a3', fontWeight: 800 };
const btnA = (c) => ({ background: 'white', border: `1px solid ${c}40`, color: c, padding: '8px', borderRadius: '8px', cursor: 'pointer' });
const btnGo = { padding: '8px 12px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };