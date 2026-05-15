import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, GraduationCap, Search, UserCircle, Award, BarChart2, Archive, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORT STYLES SENTRAL
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

// IMPORT KOMPONEN ANAK
import TabKelas from './tabs/TabKelas';
import TabRekapNilai from './tabs/TabRekapNilai';
import TabBukuInduk from './tabs/TabBukuInduk';
import ModalEvaluasi from './modals/ModalEvaluasi';
import ModalRaport from './modals/ModalRaport';

export default function DashboardPendidikan() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('KELAS_REGULER'); 
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE FILTER BUKU INDUK ──
    const [filterTahun, setFilterTahun] = useState('');
    const [filterProgram, setFilterProgram] = useState('');

    // ── KONTROL MODAL ──
    const [activeModal, setActiveModal] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // ── HELPER JSON AMAN ──
    const safeParse = (data, fallback) => {
        if (!data) return fallback;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return fallback; }
        }
        return data;
    };

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchUserProfile(user.id);
        };
        initData();
    }, []);

    useEffect(() => { fetchStudents(); }, [activeTab]);

    const fetchUserProfile = async (userId) => {
        try {
            const { data } = await supabase.from('employees').select('nama_lengkap, id_karyawan, poin_pendaftaran, master_role(nama_role)').eq('id', userId).maybeSingle();
            if (data) { setUserProfile(data); setMyPoints(data.poin_pendaftaran || 0); }
        } catch (err) {}
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('students').select('*').order('nama_lengkap', { ascending: true });

            if (activeTab === 'KELAS_REGULER') query = query.in('tahap_sekarang', ['PENDIDIKAN REGULER']);
            else if (activeTab === 'KELAS_DIKLAT') query = query.in('tahap_sekarang', ['PENDIDIKAN DIKLAT']);
            else if (activeTab === 'REKAP_NILAI') query = query.in('tahap_sekarang', ['PENDIDIKAN REGULER', 'PENDIDIKAN DIKLAT', 'AVAILABLE', 'ALUMNI', 'SIAP BERANGKAT']);
            else if (activeTab === 'BUKU_INDUK') query = query.neq('tahap_sekarang', 'REGISTRASI').neq('tahap_sekarang', 'SELEKSI AWAL');

            const { data, error } = await query;
            if (error) throw error;
            
            const formattedData = (data || []).map(s => ({
                ...s,
                nilai_history: safeParse(s.nilai_history, []),
                pendidikan_history: safeParse(s.pendidikan_history, []),
                data_raport: safeParse(s.data_raport, {})
            }));
            setStudents(formattedData);
        } catch (error) { console.error("Error fetching students:", error); } finally { setIsLoading(false); }
    };

    const logActivity = async (actionDesc) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if(user) await supabase.from('activity_logs').insert([{ user_id: user.id, keterangan: actionDesc }]);
        } catch (err) {}
    };

    const incrementPoint = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const newPoint = myPoints + 1;
            await supabase.from('employees').update({ poin_pendaftaran: newPoint }).eq('id', user.id);
            setMyPoints(newPoint);
        } catch (err) {}
    };

    const handleLulusKelas = async (id, nama) => {
        if(!window.confirm(`Luluskan ${nama} dari kelas ini? Status akan diset AVAILABLE`)) return;
        try {
            const { error } = await supabase.from('students').update({ tahap_sekarang: 'AVAILABLE', updated_at: new Date() }).eq('id', id);
            if (error) throw error;
            await logActivity(`Meluluskan kelas: ${nama}`);
            fetchStudents();
        } catch (err) { alert(err.message); }
    };

    const openModal = (type, student) => { setSelectedStudent(student); setActiveModal(type); };
    const closeModal = () => { setActiveModal(null); setSelectedStudent(null); };

    const filteredStudents = students.filter(s => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Data Ekstra untuk Buku Induk
    const uniqueTahun = [...new Set(students.map(s => new Date(s.created_at).getFullYear()))].sort((a,b) => b-a);
    const uniqueProgram = [...new Set(students.map(s => s.program).filter(Boolean))].sort();

    const filteredBukuInduk = filteredStudents.filter(s => {
        const tahunMatch = filterTahun ? new Date(s.created_at).getFullYear().toString() === filterTahun : true;
        const programMatch = filterProgram ? s.program === filterProgram : true;
        return tahunMatch && programMatch;
    });

    const handleExportCSV = () => {
        const headers = ['Nama Lengkap', 'NIK', 'Program', 'Tahun', 'Status Pipeline', 'Nilai Rata-Rata', 'Kotoba', 'Bunpo', 'Dokkai', 'Choukai', 'Kaiwa', 'Sikap', 'Disiplin', 'Teamwork', 'Kecerdasan'];
        const rows = filteredBukuInduk.map(s => {
            const r = s.data_raport || {};
            const tahun = new Date(s.created_at).getFullYear();
            return [ `"${s.nama_lengkap}"`, `"${s.nik || '-'}"`, `"${s.program || '-'}"`, `"${tahun}"`, `"${s.tahap_sekarang}"`, s.nilai_bahasa || 0, r.kotoba || 0, r.bunpo || 0, r.dokkai || 0, r.choukai || 0, r.kaiwa || 0, `"${r.perilaku || '-'}"`, `"${r.kedisiplinan || '-'}"`, `"${r.teamwork || '-'}"`, `"${r.kecerdasan || '-'}"` ].join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Buku_Induk_Nilai_UJC_${new Date().getFullYear()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR ── */}
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Div. Pendidikan</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Akademik & Karakter</p>
                </div>
                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={styles.sidebarLabel}>AKADEMIK AKTIF</div>
                    <button onClick={() => setActiveTab('KELAS_REGULER')} style={activeTab === 'KELAS_REGULER' ? styles.activeMenuS : styles.inactiveMenuS}><BookOpen size={18} /> Kelas Reguler (Dasar)</button>
                    <button onClick={() => setActiveTab('KELAS_DIKLAT')} style={activeTab === 'KELAS_DIKLAT' ? styles.activeMenuS : styles.inactiveMenuS}><GraduationCap size={18} /> Kelas Diklat (Pematangan)</button>
                    <button onClick={() => setActiveTab('REKAP_NILAI')} style={activeTab === 'REKAP_NILAI' ? styles.activeMenuS : styles.inactiveMenuS}><BarChart2 size={18} /> Evaluasi Kartu Siswa</button>
                    
                    <div style={styles.sidebarLabel}>ARSIP & PEMBUKUAN</div>
                    <button onClick={() => setActiveTab('BUKU_INDUK')} style={activeTab === 'BUKU_INDUK' ? styles.activeMenuS : styles.inactiveMenuS}><Archive size={18} /> Buku Induk Nilai</button>
                </nav>
                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <UserCircle size={32} color={brandNavy} />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile?.nama_lengkap || 'Memuat...'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>INSTRUKTUR / SENSEI</div>
                        </div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '8px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Keluar</button>
                </div>
            </aside>

            {/* ── KONTEN UTAMA ── */}
            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>
                            {activeTab === 'KELAS_REGULER' ? 'Manajemen Kelas Reguler' : 
                             activeTab === 'KELAS_DIKLAT' ? 'Manajemen Kelas Diklat' : 
                             activeTab === 'REKAP_NILAI' ? 'Rekapitulasi Evaluasi Siswa' : 'Buku Induk & Pembukuan Raport'}
                        </h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
                            {activeTab === 'BUKU_INDUK' ? 'Arsip seluruh nilai dan data akademik siswa lintas angkatan.' : 'Input absensi, ujian harian, dan pencetakan raport akhir siswa.'}
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                            <input type="text" placeholder="Cari Nama Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px', width: '250px' }} />
                        </div>
                        {activeTab === 'BUKU_INDUK' && (
                            <button onClick={handleExportCSV} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Download size={18}/> Ekspor Excel/CSV
                            </button>
                        )}
                    </div>
                </header>

                <div className="fade-in" style={{ flex: 1, overflowY: 'auto' }}>
                    {activeTab === 'KELAS_REGULER' || activeTab === 'KELAS_DIKLAT' ? (
                        <TabKelas 
                            isLoading={isLoading} filteredStudents={filteredStudents} 
                            openEvalModal={(s) => openModal('EVALUASI', s)} 
                            openRaportModal={(s) => openModal('RAPORT', s)} 
                            handleLulusKelas={handleLulusKelas} 
                        />
                    ) : activeTab === 'REKAP_NILAI' ? (
                        <TabRekapNilai filteredStudents={filteredStudents} />
                    ) : (
                        <TabBukuInduk 
                            isLoading={isLoading} filteredBukuInduk={filteredBukuInduk}
                            filterTahun={filterTahun} setFilterTahun={setFilterTahun}
                            filterProgram={filterProgram} setFilterProgram={setFilterProgram}
                            uniqueTahun={uniqueTahun} uniqueProgram={uniqueProgram}
                            openRaportModal={(s) => openModal('RAPORT', s)}
                        />
                    )}
                </div>

                {/* ── RENDER MODAL DINAMIS ── */}
                {activeModal === 'EVALUASI' && <ModalEvaluasi student={selectedStudent} userProfile={userProfile} onClose={closeModal} onSuccess={() => { closeModal(); fetchStudents(); }} logActivity={logActivity} incrementPoint={incrementPoint} />}
                {activeModal === 'RAPORT' && <ModalRaport student={selectedStudent} onClose={closeModal} onSuccess={() => { closeModal(); fetchStudents(); }} logActivity={logActivity} />}

            </main>
        </div>
    );
}