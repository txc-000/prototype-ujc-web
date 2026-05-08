import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    FileCheck, ClipboardCheck, PlaneTakeoff, Send, Search, Loader2, 
    UserCircle, CheckSquare, MessageCircle, Eye, X, Award, FileText, 
    Save, CalendarDays, GraduationCap, History, UserCog, Building2, Trash2, Archive, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

export default function DashboardDokumen() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('PEMBERKASAN'); 
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE MASTER DATA UNTUK DROPDOWN ──
    const [masterMitra, setMasterMitra] = useState([]);
    const [masterKaisha, setMasterKaisha] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);
    const [masterBidang, setMasterBidang] = useState([]);

    // ── STATE MODAL ──
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [isBerkasModalOpen, setIsBerkasModalOpen] = useState(false);
    const [isOtitModalOpen, setIsOtitModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false); 
    // State Modal Terbang
    const [flyModal, setFlyModal] = useState(null);
    const [flyDate, setFlyDate] = useState('');

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── DATA STATE ──
    const [checklist, setChecklist] = useState({});
    const [pendidikanList, setPendidikanList] = useState([]); 
    const [otitData, setOtitData] = useState({
        nik: '', nama_lengkap: '', nama_jepang: '', tempat_lahir: '', tanggal_lahir: '',
        jenis_kelamin: '', agama: '', telepon: '', alamat: '', tinggi_badan: '', berat_badan: '', golongan_darah: '',
        posisi_siswa: '', group_suisen: '', jumlah_peserta_suisen: '',
        mulai_belajar: '', selesai_belajar: '', rencana_berangkat: '', tgl_cetak_cv: '',
        nama_kumiai: '', perusahaan_penerima: '', perusahaan_haken: '',
        program_jepang: '', lpk_mitra: '', kelompok_pekerjaan: '', sub_kelompok_pekerjaan: '',
        is_eks_jepang: 'Tidak', eks_dari: '', eks_sampai: '', eks_status_tinggal: '',
        masa_pulang_dari: '', masa_pulang_sampai: '',
        eks_kapal_bangunan: 'Tidak', masa_pulang_kapal_dari: '', masa_pulang_kapal_sampai: '',
        eks_magang_tipe: '', eks_epa: 'Tidak'
    });

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
        fetchMasterData(); 
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [activeTab]);

    const fetchMasterData = async () => {
        try {
            const { data: bidangData } = await supabase.from('master_bidang').select('nama_bidang').order('nama_bidang');
            if (bidangData) setMasterBidang(bidangData);

            const { data: kumiaiData } = await supabase.from('master_kumiai').select('*');
            if (kumiaiData) setMasterKumiai(kumiaiData);

            const { data: kaishaData } = await supabase.from('master_kaisha').select('*');
            if (kaishaData) setMasterKaisha(kaishaData);

            const { data: mitraData } = await supabase.from('master_mitra').select('*');
            if (mitraData) setMasterMitra(mitraData);
        } catch (err) {
            console.warn("Beberapa tabel master belum terbuat, menggunakan array kosong.", err);
        }
    };

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
            // Menyesuaikan ulang tahapan agar sinkron dengan alur
            if (activeTab === 'PEMBERKASAN') stageFilter = ['MATCHED', 'MCU_LANJUTAN', 'PEMBERKASAN', 'PENGUMPULAN BERKAS'];
            if (activeTab === 'KONTRAK') stageFilter = ['TTD KONTRAK'];
            if (activeTab === 'COE_VISA') stageFilter = ['APPLY COE', 'APPLY VISA'];
            if (activeTab === 'KEBERANGKATAN') stageFilter = ['SIAP BERANGKAT']; 
            if (activeTab === 'SELESAI') stageFilter = ['ALUMNI']; 

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

    const openChecklistModal = (student) => {
        setSelectedStudent(student);
        const parsedStatus = typeof student.pemberkasan_status === 'string' ? JSON.parse(student.pemberkasan_status || '{}') : (student.pemberkasan_status || {});
        setChecklist(parsedStatus); 
        setIsChecklistModalOpen(true);
    };

    const handleCheckItem = (id) => {
        setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const saveChecklist = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('students')
                .update({ pemberkasan_status: checklist, updated_at: new Date() })
                .eq('id', selectedStudent.id);
            
            if (error) throw error;
            await logActivity(`Update checklist dokumen fisik: ${selectedStudent.nama_lengkap}`);
            alert("Progres Dokumen Fisik Disimpan!");
            setIsChecklistModalOpen(false);
            fetchStudents();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const openBerkasDigital = (student) => {
        setSelectedStudent(student);
        setIsBerkasModalOpen(true);
    };

    const openPrintMenu = (student) => { 
        setSelectedStudent(student); 
        setIsPrintModalOpen(true); 
    };

    const openOtitModal = (student) => {
        setSelectedStudent(student);
        const parsedOtit = typeof student.data_otit === 'string' ? JSON.parse(student.data_otit || '{}') : (student.data_otit || {});
        
        const parsedPendidikan = typeof student.pendidikan_history === 'string' ? JSON.parse(student.pendidikan_history || '[]') : (student.pendidikan_history || []);
        setPendidikanList(Array.isArray(parsedPendidikan) ? parsedPendidikan : []);

        setOtitData({
            nik: student.nik || '', nama_lengkap: student.nama_lengkap || '', nama_jepang: student.nama_jepang || '', 
            tempat_lahir: student.tempat_lahir || '', tanggal_lahir: student.tanggal_lahir || '', jenis_kelamin: student.jenis_kelamin || '', 
            agama: student.agama || '', telepon: student.telepon || student.no_telp || '', alamat: student.alamat || '', 
            tinggi_badan: student.tinggi_badan || '', berat_badan: student.berat_badan || '', golongan_darah: student.golongan_darah || '',
            
            posisi_siswa: parsedOtit.posisi_siswa || '', group_suisen: parsedOtit.group_suisen || '', jumlah_peserta_suisen: parsedOtit.jumlah_peserta_suisen || '',
            mulai_belajar: parsedOtit.mulai_belajar || '', selesai_belajar: parsedOtit.selesai_belajar || '', rencana_berangkat: parsedOtit.rencana_berangkat || '', tgl_cetak_cv: parsedOtit.tgl_cetak_cv || '',
            nama_kumiai: parsedOtit.nama_kumiai || '', perusahaan_penerima: parsedOtit.perusahaan_penerima || '', perusahaan_haken: parsedOtit.perusahaan_haken || '',
            program_jepang: parsedOtit.program_jepang || '', lpk_mitra: parsedOtit.lpk_mitra || '', kelompok_pekerjaan: parsedOtit.kelompok_pekerjaan || '', sub_kelompok_pekerjaan: parsedOtit.sub_kelompok_pekerjaan || '',
            
            is_eks_jepang: parsedOtit.is_eks_jepang || 'Tidak', eks_dari: parsedOtit.eks_dari || '', eks_sampai: parsedOtit.eks_sampai || '',
            eks_status_tinggal: parsedOtit.eks_status_tinggal || '', masa_pulang_dari: parsedOtit.masa_pulang_dari || '', masa_pulang_sampai: parsedOtit.masa_pulang_sampai || '',
            eks_kapal_bangunan: parsedOtit.eks_kapal_bangunan || 'Tidak', masa_pulang_kapal_dari: parsedOtit.masa_pulang_kapal_dari || '', masa_pulang_kapal_sampai: parsedOtit.masa_pulang_kapal_sampai || '',
            eks_magang_tipe: parsedOtit.eks_magang_tipe || '', eks_epa: parsedOtit.eks_epa || 'Tidak'
        });
        setIsOtitModalOpen(true);
    };

    const handleOtitChange = (e) => setOtitData({ ...otitData, [e.target.name]: e.target.value });

    const addPendidikan = () => setPendidikanList([...pendidikanList, { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' }]);
    const updatePendidikan = (index, field, value) => { const newArr = [...pendidikanList]; newArr[index][field] = value; setPendidikanList(newArr); };
    const removePendidikan = (index) => setPendidikanList(pendidikanList.filter((_, i) => i !== index));

    const saveOtitForm = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const mainColumnsPayload = {
                nik: otitData.nik, nama_lengkap: otitData.nama_lengkap, nama_jepang: otitData.nama_jepang,
                tempat_lahir: otitData.tempat_lahir, tanggal_lahir: otitData.tanggal_lahir, jenis_kelamin: otitData.jenis_kelamin,
                agama: otitData.agama, telepon: otitData.telepon, alamat: otitData.alamat,
                tinggi_badan: otitData.tinggi_badan ? parseInt(otitData.tinggi_badan) : null,
                berat_badan: otitData.berat_badan ? parseInt(otitData.berat_badan) : null,
                golongan_darah: otitData.golongan_darah, pendidikan_history: pendidikanList, updated_at: new Date()
            };

            const otitJsonPayload = {
                posisi_siswa: otitData.posisi_siswa, group_suisen: otitData.group_suisen, jumlah_peserta_suisen: otitData.jumlah_peserta_suisen,
                mulai_belajar: otitData.mulai_belajar, selesai_belajar: otitData.selesai_belajar, rencana_berangkat: otitData.rencana_berangkat, tgl_cetak_cv: otitData.tgl_cetak_cv,
                nama_kumiai: otitData.nama_kumiai, perusahaan_penerima: otitData.perusahaan_penerima, perusahaan_haken: otitData.perusahaan_haken,
                program_jepang: otitData.program_jepang, lpk_mitra: otitData.lpk_mitra, kelompok_pekerjaan: otitData.kelompok_pekerjaan, sub_kelompok_pekerjaan: otitData.sub_kelompok_pekerjaan,
                is_eks_jepang: otitData.is_eks_jepang, eks_dari: otitData.eks_dari, eks_sampai: otitData.eks_sampai,
                eks_status_tinggal: otitData.eks_status_tinggal, masa_pulang_dari: otitData.masa_pulang_dari, masa_pulang_sampai: otitData.masa_pulang_sampai,
                eks_kapal_bangunan: otitData.eks_kapal_bangunan, masa_pulang_kapal_dari: otitData.masa_pulang_kapal_dari, masa_pulang_kapal_sampai: otitData.masa_pulang_kapal_sampai,
                eks_magang_tipe: otitData.eks_magang_tipe, eks_epa: otitData.eks_epa
            };

            const { error } = await supabase.from('students').update({ ...mainColumnsPayload, data_otit: otitJsonPayload }).eq('id', selectedStudent.id);
            if (error) throw error;
            alert('Data Lengkap Siswa, Pendidikan, & Formulir OTIT berhasil disimpan!');
            setIsOtitModalOpen(false);
            fetchStudents();
        } catch (err) { alert('Gagal menyimpan: ' + err.message); } finally { setIsSubmitting(false); }
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

    // FUNGSI BARU: INIT MODAL TERBANG
    const initModalTerbang = (siswa) => {
        const totalDocs = docItems.length;
        const parsedStatus = typeof siswa.pemberkasan_status === 'string' ? JSON.parse(siswa.pemberkasan_status || '{}') : (siswa.pemberkasan_status || {});
        const doneCount = Object.values(parsedStatus).filter(v => v === true).length;
        
        if (doneCount < totalDocs) {
            alert(`⛔ KEBERANGKATAN DITOLAK!\n\nDokumen fisik ${siswa.nama_lengkap} belum 100% lengkap (${doneCount}/${totalDocs}). Silakan lengkapi Checklist Berkas terlebih dahulu.`);
            return; 
        }

        if (!siswa.nik || !siswa.tempat_lahir || !siswa.tanggal_lahir || !siswa.tinggi_badan || !siswa.berat_badan) {
            alert(`⛔ KEBERANGKATAN DITOLAK!\n\nData diri dasar ${siswa.nama_lengkap} belum lengkap (NIK, Tempat/Tgl Lahir, Postur Fisik ada yang kosong).`);
            return; 
        }

        setFlyModal(siswa);
        setFlyDate('');
    };

    // FUNGSI BARU: EKSEKUSI TERBANG + INJECT TANGGAL ENTRI
    const handleFlySubmit = async (e) => {
        e.preventDefault();
        if(!window.confirm(`Konfirmasi final: Siswa ${flyModal.nama_lengkap} akan diterbangkan pada tanggal ${flyDate}? Data akan diteruskan ke Keuangan.`)) return;
        
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('students').update({ 
                tahap_sekarang: 'ALUMNI', 
                status_alumni: 'AKTIF', // Dinyalakan agar ditagih Finance
                status_akhir: 'AKTIF BEKERJA', 
                tanggal_entri: flyDate, // INJEKSI TANGGAL ENTRI
                updated_at: new Date() 
            }).eq('id', flyModal.id);
            
            if (error) throw error;
            
            await logActivity(`Menerbangkan siswa ${flyModal.nama_lengkap} ke Jepang. Tgl Entri: ${flyDate}`);
            await incrementPoint();
            alert("Keberangkatan berhasil dicatat! Siswa resmi menjadi ALUMNI dan tagihan diaktifkan.");
            setFlyModal(null);
            fetchStudents();
        } catch (err) { alert("Gagal melaporkan: " + err.message); } finally { setIsSubmitting(false); }
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
                    <button onClick={() => setActiveTab('KEBERANGKATAN')} style={activeTab === 'KEBERANGKATAN' ? activeMenuS : inactiveMenuS}><PlaneTakeoff size={18} /> Laporan Keberangkatan</button>
                    
                    <div style={{ margin: '10px 0', borderBottom: '2px solid #f1f5f9' }}></div>
                    <button onClick={() => setActiveTab('SELESAI')} style={activeTab === 'SELESAI' ? {...activeMenuS, background: '#fef2f2', color: '#ef4444'} : inactiveMenuS}><Archive size={18} /> Arsip Keberangkatan</button>
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

            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>
                            {activeTab === 'SELESAI' ? 'Arsip Riwayat Keberangkatan' : activeTab.replace('_', ' & ')}
                        </h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
                            {activeTab === 'SELESAI' ? 'Daftar siswa yang sudah selesai proses dokumen dan telah menjadi Alumni.' : 'Pantau kelengkapan berkas fisik, digital, dan alur imigrasi siswa.'}
                        </p>
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
                                    <th style={thS}>Progres Fisik</th>
                                    <th style={{...thS, textAlign: 'center'}}>Aksi Dokumen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? <tr><td colSpan="4" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" /></td></tr> : filtered.length === 0 ? <tr><td colSpan="4" style={{padding:'40px', textAlign:'center', color:'#94a3b8', fontWeight:600}}>Tidak ada siswa di tahap ini.</td></tr> : filtered.map(s => {
                                    const parsedStatus = typeof s.pemberkasan_status === 'string' ? JSON.parse(s.pemberkasan_status || '{}') : (s.pemberkasan_status || {});
                                    const doneCount = Object.values(parsedStatus).filter(v => v === true).length;
                                    const progress = Math.round((doneCount / docItems.length) * 100);
                                    
                                    return (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: activeTab === 'SELESAI' ? '#f8fafc' : 'white' }}>
                                            <td style={tdS}>
                                                <div style={{fontWeight:800}}>{s.nama_lengkap}</div>
                                                <div style={{fontSize:'0.75rem', color:'#64748b'}}>{s.nis || s.nik || '-'}</div>
                                            </td>
                                            <td style={tdS}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '5px' }}>📍 {s.perusahaan_tujuan || 'Belum Ada Kaisha'}</div>
                                                <div style={{...badgeS, display: 'inline-block', marginTop: '6px'}}>{s.tahap_sekarang}</div>
                                            </td>
                                            <td style={tdS}>
                                                <div style={{ width: '100%', background: '#e2e8f0', height: '8px', borderRadius: '10px', overflow: 'hidden', marginBottom: '5px' }}>
                                                    <div style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : brandNavy, height: '100%', transition: '0.3s' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: progress === 100 ? '#10b981' : '#64748b' }}>{progress}% Lengkap</span>
                                            </td>
                                            <td style={{...tdS, textAlign: 'center'}}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                    
                                                    {/* TOMBOL BACA/CEK */}
                                                    <button onClick={() => openBerkasDigital(s)} style={btnA('#f59e0b')} title="Lihat Berkas Digital Scan"><Eye size={18}/></button>
                                                    <button onClick={() => openChecklistModal(s)} style={btnA('#3b82f6')} title="Checklist Fisik"><ClipboardCheck size={18}/></button>
                                                    
                                                    {/* TOMBOL FORMULIR OTIT */}
                                                    <button onClick={() => openOtitModal(s)} style={{...btnA('#10b981'), background: '#ecfdf5'}} title="Form OTIT, Pendidikan & Identitas">
                                                        <FileText size={18} color="#065f46" />
                                                    </button>
                                                    
                                                    {/* TOMBOL CETAK DOKUMEN OTIT */}
                                                    <button onClick={() => openPrintMenu(s)} style={{...btnA('#8b5cf6'), background: '#f5f3ff'}} title="Cetak Dokumen Imigrasi/OTIT">
                                                        <Printer size={18} color="#6d28d9" />
                                                    </button>

                                                    {activeTab === 'PEMBERKASAN' && (
                                                        <>
                                                            <button onClick={() => handleWA(s.nama_lengkap, s.telepon, 'BERKAS')} style={btnA('#10b981')} title="Hubungi Siswa via WA"><MessageCircle size={18}/></button>
                                                            <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'TTD KONTRAK')} style={btnGo}>Maju TTD Kontrak</button>
                                                        </>
                                                    )}
                                                    {activeTab === 'KONTRAK' && (
                                                        <>
                                                            <button onClick={() => handleWA(s.nama_lengkap, s.telepon, 'KONTRAK')} style={btnA('#10b981')} title="Hubungi Siswa via WA"><MessageCircle size={18}/></button>
                                                            <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'APPLY COE')} style={btnGo}>Maju Apply CoE</button>
                                                        </>
                                                    )}
                                                    {activeTab === 'COE_VISA' && (
                                                        <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'SIAP BERANGKAT')} style={btnGo}>Visa Terbit (Siap Terbang)</button>
                                                    )}
                                                    {activeTab === 'KEBERANGKATAN' && (
                                                        // ── PERUBAHAN: MEMBUKA MODAL TERBANG, BUKAN LANGSUNG EKSEKUSI ──
                                                        <button onClick={() => initModalTerbang(s)} style={{...btnGo, background: '#10b981', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                            <PlaneTakeoff size={14}/> Set Jadwal Terbang
                                                        </button>
                                                    )}
                                                    {activeTab === 'SELESAI' && (
                                                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800, padding: '6px 12px', background: '#dcfce7', borderRadius: '6px', border: '1px solid #10b981' }}>✔️ Selesai Proses</span>
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

                {/* ── MODAL TERBANG (INPUT TGL ENTRI) ── */}
                {flyModal && (
                    <div style={modalOverlay}>
                        <form onSubmit={handleFlySubmit} style={modalContent}>
                            <div style={modalHeader}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><PlaneTakeoff size={20} color="#10b981" /> Laporan Keberangkatan</h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{flyModal.nama_lengkap}</p>
                                </div>
                                <button type="button" onClick={() => setFlyModal(null)} style={btnDismis}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={labelS}>Tanggal Tiba di Jepang (Entri) *</label>
                                    <input type="date" required value={flyDate} onChange={(e) => setFlyDate(e.target.value)} style={{...inputS, border: '2px solid #cbd5e1'}} />
                                    <p style={{fontSize: '0.75rem', color: '#ef4444', marginTop: '10px', fontWeight: 700}}>
                                        Perhatian: Tanggal ini akan otomatis diteruskan ke Divisi Keuangan dan menjadi acuan hitungan draf invoice penagihan bulanan untuk Kumiai.
                                    </p>
                                </div>
                            </div>
                            <div style={modalFooter}>
                                <button type="button" onClick={() => setFlyModal(null)} style={btnCancel}>Batal</button>
                                <button type="submit" disabled={isSubmitting} style={{...btnSubmit, background: '#10b981'}}>
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Terbangkan Siswa'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── MODAL 1: CHECKLIST BERKAS FISIK ── */}
                {isChecklistModalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <div style={modalHeader}>
                                <div><h3 style={{ margin: 0, fontWeight: 900 }}>Checklist Dokumen Fisik</h3><p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{selectedStudent.nama_lengkap}</p></div>
                                <button onClick={() => setIsChecklistModalOpen(false)} style={btnDismis}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {docItems.map(doc => (
                                    <div key={doc.id} onClick={() => handleCheckItem(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: `2px solid ${checklist[doc.id] ? '#10b981' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', background: checklist[doc.id] ? '#ecfdf5' : 'white', transition: '0.2s' }}>
                                        {checklist[doc.id] ? <CheckSquare size={20} color="#10b981"/> : <div style={{ width: '18px', height: '18px', border: '2px solid #cbd5e1', borderRadius: '4px' }}></div>}
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: checklist[doc.id] ? '#065f46' : '#475569' }}>{doc.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={modalFooter}>
                                <button onClick={() => setIsChecklistModalOpen(false)} style={btnCancel}>Batal</button>
                                <button onClick={saveChecklist} disabled={isSubmitting} style={btnSubmit}><Save size={18}/> {isSubmitting ? 'Menyimpan...' : 'Simpan Checklist'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODAL 2: FORMULIR OTIT FULL (DENGAN DROPDOWN MASTER) ── */}
                {isOtitModalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <form onSubmit={saveOtitForm} style={{...modalContent, width: '1000px', maxHeight: '90vh'}}>
                            <div style={{...modalHeader, position: 'sticky', top: 0, zIndex: 10}}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FileText size={22} color={brandNavy}/> Verifikasi Data OTIT & Dokumen Siswa
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Atas Nama: <span style={{color: '#1e293b'}}>{selectedStudent.nama_lengkap}</span></p>
                                </div>
                                <button type="button" onClick={() => setIsOtitModalOpen(false)} style={btnDismis}><X size={20} /></button>
                            </div>
                            
                            <div style={{ padding: '25px', overflowY: 'auto' }}>
                                
                                <h4 style={sectionTitle}><UserCog size={18}/> Identitas Dasar (Sesuai KTP/Paspor)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <div><label style={labelS}>NIK</label><input required style={inputS} name="nik" value={otitData.nik} onChange={handleOtitChange} /></div>
                                    <div><label style={labelS}>Nama Lengkap Sesuai Dokumen</label><input required style={inputS} name="nama_lengkap" value={otitData.nama_lengkap} onChange={handleOtitChange} /></div>
                                    <div><label style={labelS}>Nama Jepang (Katakana)</label><input style={inputS} name="nama_jepang" value={otitData.nama_jepang} onChange={handleOtitChange} /></div>
                                    <div><label style={labelS}>Tempat Lahir</label><input required style={inputS} name="tempat_lahir" value={otitData.tempat_lahir} onChange={handleOtitChange} /></div>
                                    <div><label style={labelS}>Tanggal Lahir</label><input type="date" required style={inputS} name="tanggal_lahir" value={otitData.tanggal_lahir} onChange={handleOtitChange} /></div>
                                    <div>
                                        <label style={labelS}>Jenis Kelamin</label>
                                        <select required style={inputS} name="jenis_kelamin" value={otitData.jenis_kelamin} onChange={handleOtitChange}>
                                            <option value="">Pilih...</option><option value="L">Laki-Laki</option><option value="P">Perempuan</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div><label style={labelS}>Gol. Darah</label><select style={inputS} name="golongan_darah" value={otitData.golongan_darah} onChange={handleOtitChange}><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select></div>
                                        <div><label style={labelS}>TB (cm)</label><input type="number" style={inputS} name="tinggi_badan" value={otitData.tinggi_badan} onChange={handleOtitChange} /></div>
                                        <div><label style={labelS}>BB (kg)</label><input type="number" style={inputS} name="berat_badan" value={otitData.berat_badan} onChange={handleOtitChange} /></div>
                                    </div>
                                    <div>
                                        <label style={labelS}>Agama</label>
                                        <select style={inputS} name="agama" value={otitData.agama} onChange={handleOtitChange}>
                                            <option value="">Pilih...</option><option value="Islam">Islam</option><option value="Kristen">Kristen Protestan</option><option value="Katolik">Kristen Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={labelS}>No. Telepon / WhatsApp</label><input required style={inputS} name="telepon" value={otitData.telepon} onChange={handleOtitChange} /></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={labelS}>Alamat Lengkap Sesuai KTP</label><textarea required style={{...inputS, resize: 'vertical'}} rows="2" name="alamat" value={otitData.alamat} onChange={handleOtitChange}></textarea></div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h4 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}><GraduationCap size={18}/> Riwayat Pendidikan</h4>
                                    <button type="button" onClick={addPendidikan} style={{ background: '#dbeafe', color: brandNavy, border: `1px solid ${brandNavy}`, padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>+ Tambah Pendidikan</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                                    {pendidikanList.map((edu, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'end', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div><label style={labelS}>Jenjang</label><input style={inputS} value={edu.jenjang} onChange={e => updatePendidikan(idx, 'jenjang', e.target.value)} placeholder="SD/SMP/SMA" /></div>
                                            <div><label style={labelS}>Nama Sekolah</label><input style={inputS} value={edu.nama_sekolah} onChange={e => updatePendidikan(idx, 'nama_sekolah', e.target.value)} /></div>
                                            <div><label style={labelS}>Jurusan</label><input style={inputS} value={edu.jurusan} onChange={e => updatePendidikan(idx, 'jurusan', e.target.value)} placeholder="IPA/IPS/Mesin" /></div>
                                            <div>
                                                <label style={labelS}>Masuk</label>
                                                <div style={{display:'flex', gap:'5px'}}><input style={inputS} placeholder="Bln" value={edu.bln_awal} onChange={e => updatePendidikan(idx, 'bln_awal', e.target.value)} /><input style={inputS} placeholder="Thn" value={edu.thn_awal} onChange={e => updatePendidikan(idx, 'thn_awal', e.target.value)} /></div>
                                            </div>
                                            <div>
                                                <label style={labelS}>Lulus</label>
                                                <div style={{display:'flex', gap:'5px'}}><input style={inputS} placeholder="Bln" value={edu.bln_akhir} onChange={e => updatePendidikan(idx, 'bln_akhir', e.target.value)} /><input style={inputS} placeholder="Thn" value={edu.thn_akhir} onChange={e => updatePendidikan(idx, 'thn_akhir', e.target.value)} /></div>
                                            </div>
                                            <button type="button" onClick={() => removePendidikan(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {pendidikanList.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>Belum ada data pendidikan...</div>}
                                </div>

                                <h4 style={sectionTitle}><UserCircle size={18}/> Status Penempatan & Grup</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                                    <div><label style={labelS}>Posisi Siswa Saat Ini</label><select style={inputS} name="posisi_siswa" value={otitData.posisi_siswa} onChange={handleOtitChange}><option value="">Pilih Posisi...</option><option value="Report 3 Gou">Report 3 Gou</option><option value="Belum Terbang">Belum Terbang</option></select></div>
                                    <div><label style={labelS}>Group Suisen</label><input style={inputS} name="group_suisen" value={otitData.group_suisen} onChange={handleOtitChange} /></div>
                                    <div><label style={labelS}>Jumlah Peserta Lain Suisen</label><input type="number" style={inputS} name="jumlah_peserta_suisen" value={otitData.jumlah_peserta_suisen} onChange={handleOtitChange} /></div>
                                </div>

                                <h4 style={sectionTitle}><Building2 size={18}/> Program, Perusahaan & Mitra OTIT</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                                    <div>
                                        <label style={labelS}>Program Ke Jepang</label>
                                        <select required style={inputS} name="program_jepang" value={otitData.program_jepang} onChange={handleOtitChange}>
                                            <option value="">-- Pilih Program --</option>
                                            <option value="Pemagangan (Jisshusei)">Pemagangan (Jisshusei)</option>
                                            <option value="Tokutei Ginou (TG)">Tokutei Ginou (TG)</option>
                                            <option value="Engineering (Gijinkoku)">Engineering (Gijinkoku)</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelS}>Nama LPK Mitra</label>
                                        <select style={inputS} name="lpk_mitra" value={otitData.lpk_mitra} onChange={handleOtitChange}>
                                            <option value="">-- Tidak Ada / Mandiri --</option>
                                            {masterMitra.map(m => <option key={m.id} value={m.nama_mitra}>{m.nama_mitra}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelS}>Nama Kumiai</label>
                                        <select style={inputS} name="nama_kumiai" value={otitData.nama_kumiai} onChange={handleOtitChange}>
                                            <option value="">-- Pilih Kumiai --</option>
                                            {masterKumiai.map(k => <option key={k.id} value={k.nama_kumiai}>{k.nama_kumiai}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelS}>Perusahaan Penerima (Jepang)</label>
                                        <select style={inputS} name="perusahaan_penerima" value={otitData.perusahaan_penerima} onChange={handleOtitChange}>
                                            <option value="">-- Pilih Kaisha --</option>
                                            {masterKaisha.map(k => <option key={k.id} value={k.nama_perusahaan || k.nama_kaisha}>{k.nama_perusahaan || k.nama_kaisha}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelS}>Perusahaan Asal / Haken</label>
                                        <select style={inputS} name="perusahaan_haken" value={otitData.perusahaan_haken} onChange={handleOtitChange}>
                                            <option value="">-- Tidak Ada / Langsung --</option>
                                            {masterKaisha.map(k => <option key={k.id} value={k.nama_perusahaan || k.nama_kaisha}>{k.nama_perusahaan || k.nama_kaisha}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{flex: 1}}>
                                            <label style={labelS}>Kelompok Jenis Pekerjaan</label>
                                            <select style={inputS} name="kelompok_pekerjaan" value={otitData.kelompok_pekerjaan} onChange={handleOtitChange}>
                                                <option value="">-- Pilih Bidang --</option>
                                                {masterBidang.map(b => <option key={b.id} value={b.nama_bidang}>{b.nama_bidang}</option>)}
                                            </select>
                                        </div>
                                        <div style={{flex: 1}}>
                                            <label style={labelS}>Sub Kelompok (Opsional)</label>
                                            <input style={inputS} name="sub_kelompok_pekerjaan" value={otitData.sub_kelompok_pekerjaan} onChange={handleOtitChange} placeholder="Tulis sub pekerjaan..." />
                                        </div>
                                    </div>
                                </div>

                                <h4 style={sectionTitle}><CalendarDays size={18}/> Jadwal Pendidikan & Keberangkatan</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                                    <div><label style={labelS}>Mulai Belajar Nihongo</label><input type="date" required style={inputS} name="mulai_belajar" value={otitData.mulai_belajar} onChange={handleOtitChange} /></div>
                                    <div><label style={labelS}>Selesai Belajar</label><input type="date" required style={inputS} name="selesai_belajar" value={otitData.selesai_belajar} onChange={handleOtitChange} /></div>
                                    <div><label style={labelS}>Tgl Cetak CV/Surat</label><input type="date" style={inputS} name="tgl_cetak_cv" value={otitData.tgl_cetak_cv} onChange={handleOtitChange} /></div>
                                    <div><label style={labelS}><PlaneTakeoff size={14} style={{display:'inline', marginBottom:'-2px'}}/> Rencana Berangkat</label><input type="date" required style={{...inputS, border: '2px solid #3b82f6'}} name="rencana_berangkat" value={otitData.rencana_berangkat} onChange={handleOtitChange} /></div>
                                </div>

                                <h4 style={sectionTitle}><History size={18}/> Riwayat Pengalaman di Jepang (Eks-Jepang)</h4>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={labelS}>Apakah ada pengalaman ke Jepang sebelumnya?</label>
                                        <select style={{...inputS, width: '200px', fontWeight: 800, color: otitData.is_eks_jepang === 'Ya' ? brandNavy : '#64748b'}} name="is_eks_jepang" value={otitData.is_eks_jepang} onChange={handleOtitChange}>
                                            <option value="Tidak">Tidak Ada</option>
                                            <option value="Ya">Ya, Pernah</option>
                                        </select>
                                    </div>

                                    {otitData.is_eks_jepang === 'Ya' && (
                                        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
                                            
                                            <div><label style={labelS}>Pengalaman Dari (Bulan/Tahun)</label><input type="month" style={inputS} name="eks_dari" value={otitData.eks_dari} onChange={handleOtitChange} /></div>
                                            <div><label style={labelS}>Pengalaman Sampai (Bulan/Tahun)</label><input type="month" style={inputS} name="eks_sampai" value={otitData.eks_sampai} onChange={handleOtitChange} /></div>
                                            
                                            <div style={{gridColumn: '1 / -1', display: 'flex', gap: '15px'}}>
                                                <div style={{flex: 1}}><label style={labelS}>Status Tinggal Jisshusei</label><select style={inputS} name="eks_status_tinggal" value={otitData.eks_status_tinggal} onChange={handleOtitChange}><option value="">Pilih...</option><option value="Jisshusei">Ya (Jisshusei)</option><option value="Jisshu Igai">Jisshu Igai</option><option value="Lainnya">Lainnya</option></select></div>
                                                <div style={{flex: 1}}><label style={labelS}>Masa Pulang Jisshu Dari</label><input type="month" style={inputS} name="masa_pulang_dari" value={otitData.masa_pulang_dari} onChange={handleOtitChange} /></div>
                                                <div style={{flex: 1}}><label style={labelS}>Masa Pulang Jisshu Sampai</label><input type="month" style={inputS} name="masa_pulang_sampai" value={otitData.masa_pulang_sampai} onChange={handleOtitChange} /></div>
                                            </div>

                                            <div style={{gridColumn: '1 / -1', display: 'flex', gap: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px'}}>
                                                <div style={{flex: 1}}><label style={labelS}>Ada Pengalaman Kapal / Bangunan?</label><select style={inputS} name="eks_kapal_bangunan" value={otitData.eks_kapal_bangunan} onChange={handleOtitChange}><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select></div>
                                                <div style={{flex: 1}}><label style={labelS}>Masa Pulang Kapal Dari</label><input type="month" style={inputS} name="masa_pulang_kapal_dari" value={otitData.masa_pulang_kapal_dari} onChange={handleOtitChange} disabled={otitData.eks_kapal_bangunan === 'Tidak'} /></div>
                                                <div style={{flex: 1}}><label style={labelS}>Masa Pulang Kapal Sampai</label><input type="month" style={inputS} name="masa_pulang_kapal_sampai" value={otitData.masa_pulang_kapal_sampai} onChange={handleOtitChange} disabled={otitData.eks_kapal_bangunan === 'Tidak'} /></div>
                                            </div>

                                            <div><label style={labelS}>Magang Tipe Berapa?</label><select style={inputS} name="eks_magang_tipe" value={otitData.eks_magang_tipe} onChange={handleOtitChange}><option value="">Pilih...</option><option value="Magang Tipe 1">Magang Tipe 1</option><option value="Magang Tipe 2">Magang Tipe 2</option><option value="Magang Tipe 3">Magang Tipe 3</option></select></div>
                                            <div><label style={labelS}>Pengalaman EPA?</label><select style={inputS} name="eks_epa" value={otitData.eks_epa} onChange={handleOtitChange}><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{...modalFooter, position: 'sticky', bottom: 0, zIndex: 10}}>
                                <button type="button" onClick={() => setIsOtitModalOpen(false)} style={btnCancel}>Tutup</button>
                                <button type="submit" disabled={isSubmitting} style={btnSubmit}><Save size={18}/> {isSubmitting ? 'Menyimpan...' : 'Simpan Data OTIT & Identitas'}</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── MODAL 3: LIHAT BERKAS DIGITAL (Scan Lampiran) ── */}
                {isBerkasModalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={{ ...modalContent, width: '600px' }}>
                            <div style={modalHeader}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FileText size={20} color="#f59e0b" /> Berkas Digital (Scan)
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{selectedStudent?.nama_lengkap}</p>
                                </div>
                                <button onClick={() => setIsBerkasModalOpen(false)} style={btnDismis}><X size={20} /></button>
                            </div>

                            <div style={{ padding: '25px', maxHeight: '60vh', overflowY: 'auto' }}>
                                {(!selectedStudent.attachments || (Array.isArray(selectedStudent.attachments) && selectedStudent.attachments.length === 0)) ? (
                                    <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', border: '2px dashed #e2e8f0', fontWeight: 600 }}>
                                        Siswa ini belum mengunggah lampiran digital apa pun saat pendaftaran.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                        {Array.isArray(selectedStudent.attachments) ? (
                                            selectedStudent.attachments.map((file, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{file.name || `Dokumen Lampiran ${idx + 1}`}</div>
                                                        {file.notes && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{file.notes}</div>}
                                                    </div>
                                                    {file.url ? (
                                                        <button onClick={() => window.open(file.url, '_blank')} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <Eye size={16} /> Lihat
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>URL Kosong</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '15px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem' }}>Format lampiran tidak didukung (string lama). Buka dari menu Edit Rirekisho.</div>
                                        )}
                                    </div>
                                )}
                                
                                <div style={{ marginTop: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', color: '#1e3a8a', fontSize: '0.8rem', lineHeight: '1.5' }}>
                                    <strong>Info:</strong> Dokumen di atas adalah hasil scan (PDF/JPG) yang diunggah secara digital ke dalam Storage Supabase. Jika ingin menambahkan scan dokumen baru, silakan hubungi tim Rekrutmen (Edit Profil).
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODAL 4: MENU CETAK DOKUMEN OTIT / IMIGRASI ── */}
                {isPrintModalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={{ ...modalContent, width: '450px' }}>
                            <div style={modalHeader}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Printer size={20} color="#8b5cf6" /> Cetak Dokumen Imigrasi
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{selectedStudent.nama_lengkap}</p>
                                </div>
                                <button onClick={() => setIsPrintModalOpen(false)} style={btnDismis}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                
                                <button onClick={() => window.open(`/print-cv/${selectedStudent.id}`, '_blank')} style={btnPrintOption}>
                                    📄 Cetak Rirekisho (CV Siswa)
                                </button>
                                
                                <button onClick={() => window.open(`/print-shoushiki-10/${selectedStudent.id}`, '_blank')} style={btnPrintOption}>
                                    📑 Shoushiki 1-10 (Ikrar LPK)
                                </button>
                                
                                <button onClick={() => window.open(`/print-shoushiki-13`, '_blank')} style={btnPrintOption}>
                                    🏢 Shoushiki 1-13 (Profil & Struktur LPK)
                                </button>
                                
                                <button onClick={() => window.open(`/print-shoushiki-20/${selectedStudent.id}`, '_blank')} style={btnPrintOption}>
                                    ✍️ Shoushiki 1-20 (Surat Pernyataan Siswa)
                                </button>

                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

// ── STYLE OBJECTS ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', fontWeight: 800, width: '100%', textAlign: 'left', cursor: 'pointer' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 700, width: '100%', textAlign: 'left', cursor: 'pointer', transition: '0.2s' };
const thS = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdS = { padding: '15px 20px', verticalAlign: 'middle', fontSize: '0.95rem' };
const badgeS = { fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: '#e0e7ff', color: '#3730a3', fontWeight: 800 };
const btnA = (c) => ({ background: 'white', border: `1px solid ${c}40`, color: c, padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' });
const btnGo = { padding: '8px 12px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', borderRadius: '15px', width: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', position: 'relative' };
const modalHeader = { padding: '25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' };
const modalFooter = { padding: '20px 25px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' };
const btnDismis = { background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const btnCancel = { padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' };
const btnSubmit = { padding: '10px 25px', background: brandNavy, border: 'none', color: 'white', fontWeight: 800, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const sectionTitle = { fontSize: '0.9rem', color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: '20px' };
const labelS = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputS = { width: '100%', padding: '12px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: 'white' };
const btnPrintOption = { padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: '#1e293b', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s', fontSize: '0.95rem' };