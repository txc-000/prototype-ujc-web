import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import { FileCheck, ClipboardCheck, PlaneTakeoff, Send, Search, UserCircle, Award, Archive, X, Printer, BarChart2, Upload, Trash2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { styles, brandNavy } from '../Reguler/components/dashboardStyles';
import TabDokumenTable from './tabs/TabDokumenTable';

// --- IMPORT MODAL DOKUMEN ---
import ModalOtit from './modals/ModalOtit';
import ModalChecklist from './modals/ModalChecklist';
import ModalTerbang from './modals/ModalTerbang';
import ModalBerkas from './modals/ModalBerkas';

// --- IMPORT KOMPONEN STATISTIK EXCEL (Pastikan path ini sesuai dengan folder Tuan) ---
import HeaderSection from '../Direktur/components/HeaderSection';
import KpiCardGroup from '../Direktur/components/KpiCardGroup';
import ChartContainer from '../Direktur/components/ChartContainer';
import HighlightExtremes from '../Direktur/components/HighlightExtremes';
import SummaryTable from '../Direktur/components/SummaryTable';
import IllustrationCard from '../Direktur/components/IllustrationCard';

export default function DashboardDokumen() {
    const navigate = useNavigate();
    
    // ── STATE DOKUMEN (SUPABASE) ──
    const [activeTab, setActiveTab] = useState('PEMBERKASAN'); 
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    const [masterMitra, setMasterMitra] = useState([]);
    const [masterKaisha, setMasterKaisha] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);
    const [masterBidang, setMasterBidang] = useState([]);

    const [activeModal, setActiveModal] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const docItems = [
        { id: 'ktp', label: 'KTP Asli & Copy' }, { id: 'kk', label: 'KK Asli & Copy' },
        { id: 'akta', label: 'Akta Lahir Asli' }, { id: 'paspor', label: 'Paspor (Berlaku > 2 Thn)' },
        { id: 'ijazah', label: 'Ijazah Terakhir' }, { id: 'mcu_final', label: 'Hasil MCU Akhir (FIT)' },
        { id: 'skck', label: 'SKCK Polda' }, { id: 'foto', label: 'Pas Foto 3x4 & 4x6' }
    ];

    // ── STATE STATISTIK EXCEL (LOCAL STORAGE) ──
    const [isExcelLoading, setIsExcelLoading] = useState(false);
    const [excelFileName, setExcelFileName] = useState('');
    const fileInputRef = useRef(null);
    const [rawExcelData, setRawExcelData] = useState(() => {
        const savedData = localStorage.getItem('UJC_Keberangkatan_Data');
        return savedData ? JSON.parse(savedData) : [];
    });
    const [excelSummary, setExcelSummary] = useState(null);


    // ==========================================
    //      HOOKS & EFFECT DOKUMEN SUPABASE
    // ==========================================
    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchUserProfile(user.id);
        };
        initData();
        fetchMasterData(); 
    }, []);

    useEffect(() => { 
        if (activeTab !== 'STATISTIK') fetchStudents(); 
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
        } catch (err) { console.warn(err); }
    };

    const fetchUserProfile = async (userId) => {
        try {
            const { data } = await supabase.from('employees').select('nama_lengkap, id_karyawan, poin_pendaftaran, master_role(nama_role)').eq('id', userId).maybeSingle();
            if (data) { setUserProfile(data); setMyPoints(data.poin_pendaftaran || 0); }
        } catch (err) {}
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            let stageFilter = [];
            if (activeTab === 'PEMBERKASAN') stageFilter = ['MATCHED', 'MCU_LANJUTAN', 'PEMBERKASAN', 'PENGUMPULAN BERKAS', 'PENDIDIKAN DIKLAT'];
            if (activeTab === 'KONTRAK') stageFilter = ['TTD KONTRAK', 'PENDIDIKAN DIKLAT'];
            if (activeTab === 'COE_VISA') stageFilter = ['APPLY COE', 'APPLY VISA', 'PENDIDIKAN DIKLAT'];
            if (activeTab === 'KEBERANGKATAN') stageFilter = ['SIAP BERANGKAT']; 
            if (activeTab === 'SELESAI') stageFilter = ['ALUMNI']; 

            const { data, error } = await supabase.from('students').select('*').in('tahap_sekarang', stageFilter).order('updated_at', { ascending: false });
            if (error) throw error;
            setStudents(data || []);
        } catch (error) {} finally { setIsLoading(false); }
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

    const handleUpdateStage = async (id, nama, newStage) => {
        if(!window.confirm(`Pindahkan ${nama} ke tahap ${newStage}?`)) return;
        try {
            await supabase.from('students').update({ tahap_sekarang: newStage, updated_at: new Date() }).eq('id', id);
            await logActivity(`Memindahkan ${nama} ke tahap ${newStage}`);
            await incrementPoint();
            fetchStudents();
        } catch (err) { alert(err.message); }
    };

    const openModal = (type, student) => { setSelectedStudent(student); setActiveModal(type); };
    const closeModal = () => { setActiveModal(null); setSelectedStudent(null); };

    const initModalTerbang = (siswa) => {
        const totalDocs = docItems.length;
        const parsedStatus = typeof siswa.pemberkasan_status === 'string' ? JSON.parse(siswa.pemberkasan_status || '{}') : (siswa.pemberkasan_status || {});
        const doneCount = Object.values(parsedStatus).filter(v => v === true).length;
        
        if (doneCount < totalDocs) return alert(`⛔ KEBERANGKATAN DITOLAK!\nDokumen fisik belum 100% lengkap.`);
        if (!siswa.nik || !siswa.tempat_lahir || !siswa.tanggal_lahir || !siswa.tinggi_badan || !siswa.berat_badan) return alert(`⛔ KEBERANGKATAN DITOLAK!\nData diri dasar belum lengkap.`);
        
        openModal('TERBANG', siswa);
    };


    // ==========================================
    //      ENGINE STATISTIK EXCEL (AUTO-SWAP)
    // ==========================================
    useEffect(() => {
        if (rawExcelData.length === 0) {
            setExcelSummary(null);
            return;
        }

        const grouped = {};
        const namaBulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        rawExcelData.forEach(item => {
            const bulan = item.bulan;
            const program = item.program;

            if (!grouped[bulan]) grouped[bulan] = { BULAN: bulan, MAGANG: 0, '3 GO': 0, TG: 0, ENGINEER: 0, 'JUMLAH SISWA': 0 };

            if (program === '3 GO') grouped[bulan]['3 GO'] += 1;
            else if (program === 'TG') grouped[bulan].TG += 1;
            else if (program === 'ENGINEER') grouped[bulan].ENGINEER += 1;
            else grouped[bulan].MAGANG += 1; 

            grouped[bulan]['JUMLAH SISWA'] += 1;
        });

        const rincian = Object.values(grouped);
        rincian.sort((a, b) => namaBulanIndo.indexOf(a.BULAN) - namaBulanIndo.indexOf(b.BULAN));

        const totalBerangkat = rincian.reduce((sum, item) => sum + (item['JUMLAH SISWA'] || 0), 0);
        const bulanIni = rincian.length > 0 ? rincian[rincian.length - 1]['JUMLAH SISWA'] : 0;
        const bulanIniNama = rincian.length > 0 ? rincian[rincian.length - 1]['BULAN'] : 'N/A';
        const rataRata = totalBerangkat > 0 ? (totalBerangkat / rincian.length) : 0;
        const periode = rincian.length > 0 ? `${rincian[0]['BULAN']} - ${rincian[rincian.length - 1]['BULAN']}` : 'N/A';

        const sortedByJumlah = [...rincian].sort((a, b) => (a['JUMLAH SISWA'] || 0) - (b['JUMLAH SISWA'] || 0));
        const bulanTersedikit = sortedByJumlah[0] || { BULAN: '-', 'JUMLAH SISWA': 0 };
        const bulanTerbanyak = sortedByJumlah[sortedByJumlah.length - 1] || { BULAN: '-', 'JUMLAH SISWA': 0 };

        setExcelSummary({
            kpi: { totalSiswa: totalBerangkat, bulanIni, bulanIniNama, rataRata: rataRata.toFixed(1), periode, periodeBulan: rincian.length },
            rincian,
            totalBerangkat,
            bulanTerbanyak: { bulan: bulanTerbanyak.BULAN, siswa: bulanTerbanyak['JUMLAH SISWA'], persen: totalBerangkat > 0 ? ((bulanTerbanyak['JUMLAH SISWA'] / totalBerangkat) * 100).toFixed(1) : 0 },
            bulanTersedikit: { bulan: bulanTersedikit.BULAN, siswa: bulanTersedikit['JUMLAH SISWA'], persen: totalBerangkat > 0 ? ((bulanTersedikit['JUMLAH SISWA'] / totalBerangkat) * 100).toFixed(1) : 0 },
            periodeLengkap: periode !== 'N/A' ? `1 ${periode.split(' - ')[0]} - 30 ${periode.split(' - ')[1] || periode.split(' - ')[0]} 2026` : '2026'
        });
    }, [rawExcelData]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setExcelFileName(file.name);
        setIsExcelLoading(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const upperFileName = file.name.toUpperCase();
                const refBulan = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
                let bulanDariFile = 'Tidak Diketahui';

                const matchBulan = refBulan.find(b => upperFileName.includes(b));
                if (matchBulan) bulanDariFile = matchBulan.charAt(0) + matchBulan.slice(1).toLowerCase(); 

                if (bulanDariFile === 'Tidak Diketahui') throw new Error("Gagal mendeteksi bulan dari nama file.");

                const data = new Uint8Array(evt.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                
                const rawSheet = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                if (rawSheet.length < 2) throw new Error("Data di dalam file kosong.");

                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(10, rawSheet.length); i++) {
                    const rowText = rawSheet[i].join(' ').toLowerCase();
                    if (rowText.includes('nama') || rowText.includes('nik') || rowText.includes('peserta')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                const rawDataExcelArray = XLSX.utils.sheet_to_json(ws, { header: headerRowIndex === 0 ? undefined : headerRowIndex + 1, defval: "" });
                const extractedNewData = [];

                const getVal = (rowObj, keywords) => {
                    for (let keyword of keywords) {
                        let foundKey = Object.keys(rowObj).find(k => k.trim().toLowerCase() === keyword);
                        if (!foundKey) foundKey = Object.keys(rowObj).find(k => k.trim().toLowerCase().includes(keyword));
                        if (foundKey && rowObj[foundKey] !== undefined && rowObj[foundKey] !== '') return rowObj[foundKey];
                    }
                    return '';
                };

                rawDataExcelArray.forEach(row => {
                    let namaRaw = getVal(row, ['nama peserta', 'nama pmi', 'nama tki', 'nama lengkap', 'nama']);
                    let nikRaw = getVal(row, ['nik', 'no. ktp', 'ktp', 'identitas', 'paspor']);
                    
                    if (!namaRaw && !nikRaw) return;

                    let namaUpper = String(namaRaw).toUpperCase().trim();
                    let nikStr = String(nikRaw).toUpperCase().trim();

                    // AUTO-SWAP JIKA TERTUKAR
                    if (/^\d{10,}$/.test(namaUpper) && !/^\d{10,}$/.test(nikStr)) {
                        const temp = namaUpper;
                        namaUpper = nikStr;
                        nikStr = temp;
                    }

                    // FILTER ANTI-HANTU & BARIS TOTAL
                    if (/^\d{1,5}$/.test(namaUpper)) return; 
                    if (namaUpper.includes('TOTAL') || namaUpper.includes('JUMLAH') || namaUpper === 'NAMA PESERTA' || namaUpper === 'NAMA') return;
                    if (!namaUpper || namaUpper === '') return;

                    const programJabatan = String(getVal(row, ['program pemagangan', 'program', 'jabatan', 'kejuruan'])).toUpperCase();
                    const kelompokKerja = String(getVal(row, ['kelompok jenis kerja', 'jenis kerja'])).toUpperCase();
                    const subKerja = String(getVal(row, ['sub jenis kerja', 'sub bidang'])).toUpperCase();
                    
                    let finalProgram = 'MAGANG'; 
                    if (programJabatan.includes('JISSHUUSEI')) finalProgram = 'MAGANG';
                    else if (programJabatan.includes('3 GO') || programJabatan.includes('3GO') || kelompokKerja.includes('3 GO') || subKerja.includes('3 GO')) finalProgram = '3 GO';
                    else if (programJabatan.includes('TG') || programJabatan.includes('TOKUTEI') || kelompokKerja.includes('TOKUTEI') || subKerja.includes('TOKUTEI')) finalProgram = 'TG';
                    else if (programJabatan.includes('ENGINEER') || kelompokKerja.includes('ENGINEER') || subKerja.includes('ENGINEER')) finalProgram = 'ENGINEER';

                    extractedNewData.push({
                        id: nikStr ? nikStr : `${namaUpper}_${bulanDariFile}`, 
                        nama: namaUpper,
                        nik: nikStr,
                        bulan: bulanDariFile,
                        program: finalProgram
                    });
                });

                if (extractedNewData.length === 0) throw new Error("Tidak ada data siswa yang valid.");

                const existingMap = new Map(rawExcelData.map(item => [item.id, item]));
                extractedNewData.forEach(item => existingMap.set(item.id, item));

                const combinedData = Array.from(existingMap.values());
                setRawExcelData(combinedData);
                localStorage.setItem('UJC_Keberangkatan_Data', JSON.stringify(combinedData));

            } catch (error) {
                alert("Error: " + error.message);
            } finally {
                setIsExcelLoading(false);
            }
        };
        reader.readAsArrayBuffer(file); 
    };

    const handleClearExcelData = () => {
        if (window.confirm("Peringatan: Grafik statistik akan di-reset. Lanjutkan?")) {
            localStorage.removeItem('UJC_Keberangkatan_Data');
            setRawExcelData([]);
            setExcelFileName('');
        }
    };


    // ==========================================
    //               RENDER UTAMA
    // ==========================================
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
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', paddingLeft: '10px', marginBottom: '5px' }}>DASHBOARD DOKUMEN</div>
                    <button onClick={() => setActiveTab('PEMBERKASAN')} style={activeTab === 'PEMBERKASAN' ? styles.activeMenuS : styles.inactiveMenuS}><ClipboardCheck size={18} /> Pemberkasan Awal</button>
                    <button onClick={() => setActiveTab('KONTRAK')} style={activeTab === 'KONTRAK' ? styles.activeMenuS : styles.inactiveMenuS}><FileCheck size={18} /> Kontrak Kerja</button>
                    <button onClick={() => setActiveTab('COE_VISA')} style={activeTab === 'COE_VISA' ? styles.activeMenuS : styles.inactiveMenuS}><Send size={18} /> Proses CoE & Visa</button>
                    <button onClick={() => setActiveTab('KEBERANGKATAN')} style={activeTab === 'KEBERANGKATAN' ? styles.activeMenuS : styles.inactiveMenuS}><PlaneTakeoff size={18} /> Laporan Keberangkatan</button>
                    
                    <div style={{ margin: '15px 0', borderBottom: '2px solid #f1f5f9' }}></div>
                    
                    {/* MENU BARU: STATISTIK EXCEL */}
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', paddingLeft: '10px', marginBottom: '5px' }}>LAPORAN EXCEL KEMENAKER</div>
                    <button onClick={() => setActiveTab('STATISTIK')} style={activeTab === 'STATISTIK' ? {...styles.activeMenuS, background: '#e0e7ff', color: '#4338ca'} : styles.inactiveMenuS}>
                        <BarChart2 size={18} /> Statistik Keberangkatan
                    </button>
                    
                    <div style={{ margin: '15px 0', borderBottom: '2px solid #f1f5f9' }}></div>

                    <button onClick={() => setActiveTab('SELESAI')} style={activeTab === 'SELESAI' ? {...styles.activeMenuS, background: '#fef2f2', color: '#ef4444'} : styles.inactiveMenuS}><Archive size={18} /> Arsip Keberangkatan</button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <UserCircle size={32} color={brandNavy} />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{userProfile?.nama_lengkap || 'Memuat...'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>STAF DOKUMEN</div>
                        </div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '8px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Keluar</button>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                
                {/* ── KONTEN TAB STATISTIK EXCEL ── */}
                {activeTab === 'STATISTIK' ? (
                    <div className="fade-in">
                        <HeaderSection summary={excelSummary} />
                        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                                <button onClick={() => fileInputRef.current.click()} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Upload size={18} /> Tambah File Kemenaker (.xlsx/.csv)
                                </button>
                                {excelFileName && <span style={{color: '#64748b', fontSize: '0.9rem'}}>Baru diunggah: <b>{excelFileName}</b></span>}
                            </div>
                            {rawExcelData.length > 0 && (
                                <button onClick={handleClearExcelData} style={{ background: 'white', color: '#dc2626', border: '1px solid #dc2626', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Trash2 size={18} /> Kosongkan Statistik
                                </button>
                            )}
                        </div>

                        {isExcelLoading ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#1e3a8a', fontWeight: 800 }}>
                                <Activity className="animate-spin" size={30} style={{marginRight: '10px', verticalAlign: 'middle'}}/> Memproses Data...
                            </div>
                        ) : excelSummary ? (
                            <div className="fade-in">
                                <KpiCardGroup kpi={excelSummary.kpi} />
                                <ChartContainer summary={excelSummary} />
                                <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 0.7fr', gap: '25px', marginBottom: '30px' }}>
                                    <HighlightExtremes summary={excelSummary} />
                                    <SummaryTable summary={excelSummary} />
                                    <IllustrationCard />
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '50px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                                <h3 style={{color: '#475569'}}>Belum ada data grafik. Silakan unggah file Excel keberangkatan.</h3>
                                <p style={{color: '#94a3b8'}}>Sistem kebal baris kosong dan bisa mendeteksi format otomatis.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // ── KONTEN TAB DOKUMEN SUPABASE ──
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>{activeTab === 'SELESAI' ? 'Arsip Riwayat Keberangkatan' : activeTab.replace('_', ' & ')}</h1>
                                <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Pantau kelengkapan berkas fisik, digital, dan alur imigrasi siswa.</p>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                                <input type="text" placeholder="Cari Nama Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px', width: '250px' }} />
                            </div>
                        </header>

                        <div style={{ flex: 1 }}>
                            <TabDokumenTable 
                                activeTab={activeTab} isLoading={isLoading} filtered={filtered} docItems={docItems}
                                openChecklistModal={(s) => openModal('CHECKLIST', s)}
                                openOtitModal={(s) => openModal('OTIT', s)}
                                initModalTerbang={initModalTerbang}
                                handleUpdateStage={handleUpdateStage}
                                openBerkasDigital={(s) => openModal('BERKAS', s)}
                                openPrintMenu={(s) => openModal('PRINT', s)}
                            />
                        </div>
                    </div>
                )}

                {/* ── RENDER MODAL DINAMIS DOKUMEN ── */}
                {activeModal === 'OTIT' && <ModalOtit student={selectedStudent} masterMitra={masterMitra} masterKaisha={masterKaisha} masterKumiai={masterKumiai} masterBidang={masterBidang} onClose={closeModal} onSuccess={() => { closeModal(); fetchStudents(); }} />}
                {activeModal === 'CHECKLIST' && <ModalChecklist student={selectedStudent} docItems={docItems} onClose={closeModal} onSuccess={() => { closeModal(); fetchStudents(); }} logActivity={logActivity} />}
                {activeModal === 'TERBANG' && <ModalTerbang student={selectedStudent} onClose={closeModal} onSuccess={() => { closeModal(); fetchStudents(); }} logActivity={logActivity} incrementPoint={incrementPoint} />}
                {activeModal === 'BERKAS' && <ModalBerkas student={selectedStudent} onClose={closeModal} onSuccess={() => { fetchStudents(); }} />}

                {activeModal === 'PRINT' && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                            <div style={{ padding: '20px', background: brandNavy, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Printer size={18} /> Menu Cetak Dokumen</h3>
                                <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button onClick={() => window.open(`/print-cv/${selectedStudent?.id}`, '_blank')} style={{ padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Cetak Rirekisho (CV)</button>
                                <button onClick={() => window.open(`/print-shoushiki-10/${selectedStudent?.id}`, '_blank')} style={{ padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Cetak Shoushiki 1-10</button>
                                <button onClick={() => window.open(`/print-shoushiki-20/${selectedStudent?.id}`, '_blank')} style={{ padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Cetak Shoushiki 1-20</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}