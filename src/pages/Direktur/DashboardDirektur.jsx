import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

import { Activity, LogOut, Upload, Trash2 } from 'lucide-react';
import { brandNavy } from '../Reguler/components/dashboardStyles'; 

// --- IMPORT KOMPONEN UTAMA ---
import HeaderSection from './components/HeaderSection';
import KpiCardGroup from './components/KpiCardGroup';
import ChartContainer from './components/ChartContainer';
import HighlightExtremes from './components/HighlightExtremes';
import SummaryTable from './components/SummaryTable';
import IllustrationCard from './components/IllustrationCard';

// --- IMPORT MODALS ---
import ModalDaftarSiswaPerBulan from './modals/ModalDaftarSiswaPerBulan';
import ModalDetailProgramKeberangkatan from './modals/ModalDetailProgramKeberangkatan';

export default function DashboardDirektur() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);

    // ── STATE PENYIMPANAN PERSISTEN (LOCAL STORAGE) ──
    const [rawData, setRawData] = useState(() => {
        const savedData = localStorage.getItem('UJC_Keberangkatan_Data');
        return savedData ? JSON.parse(savedData) : [];
    });
    const [summary, setSummary] = useState(null);

    const [siswaBulanModal, setSiswaBulanModal] = useState(null);
    const [programModal, setProgramModal] = useState(null);

    // ── ENGINE PENGHITUNG OTOMATIS ──
    useEffect(() => {
        if (rawData.length === 0) {
            setSummary(null);
            return;
        }

        const grouped = {};
        const namaBulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        rawData.forEach(item => {
            const bulanKeberangkatan = item.bulan;
            const programStr = item.program;

            if (!grouped[bulanKeberangkatan]) {
                grouped[bulanKeberangkatan] = { BULAN: bulanKeberangkatan, MAGANG: 0, '3 GO': 0, TG: 0, ENGINEER: 0, 'JUMLAH SISWA': 0 };
            }

            if (programStr === '3 GO') grouped[bulanKeberangkatan]['3 GO'] += 1;
            else if (programStr === 'TG') grouped[bulanKeberangkatan].TG += 1;
            else if (programStr === 'ENGINEER') grouped[bulanKeberangkatan].ENGINEER += 1;
            else grouped[bulanKeberangkatan].MAGANG += 1; 

            grouped[bulanKeberangkatan]['JUMLAH SISWA'] += 1;
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

        setSummary({
            kpi: { totalSiswa: totalBerangkat, bulanIni, bulanIniNama, rataRata: rataRata.toFixed(1), periode, periodeBulan: rincian.length },
            rincian,
            totalBerangkat,
            bulanTerbanyak: { bulan: bulanTerbanyak.BULAN, siswa: bulanTerbanyak['JUMLAH SISWA'], persen: totalBerangkat > 0 ? ((bulanTerbanyak['JUMLAH SISWA'] / totalBerangkat) * 100).toFixed(1) : 0 },
            bulanTersedikit: { bulan: bulanTersedikit.BULAN, siswa: bulanTersedikit['JUMLAH SISWA'], persen: totalBerangkat > 0 ? ((bulanTersedikit['JUMLAH SISWA'] / totalBerangkat) * 100).toFixed(1) : 0 },
            periodeLengkap: periode !== 'N/A' ? `1 ${periode.split(' - ')[0]} - 30 ${periode.split(' - ')[1] || periode.split(' - ')[0]} 2026` : '2026'
        });
    }, [rawData]);

    // ── FUNGSI UPLOAD (DENGAN AUTO-SWAP KOLOM TERTUKAR) ──
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);
        setLoading(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const upperFileName = file.name.toUpperCase();
                const refBulan = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
                let bulanDariFile = 'Tidak Diketahui';

                const matchBulan = refBulan.find(b => upperFileName.includes(b));
                if (matchBulan) {
                    bulanDariFile = matchBulan.charAt(0) + matchBulan.slice(1).toLowerCase(); 
                }

                if (bulanDariFile === 'Tidak Diketahui') {
                    throw new Error("Gagal mendeteksi bulan. Pastikan nama file mengandung nama bulan (contoh: '... MEI 2026.csv').");
                }

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

                const rawDataExcel = XLSX.utils.sheet_to_json(ws, { header: headerRowIndex === 0 ? undefined : headerRowIndex + 1, defval: "" });
                const extractedNewData = [];

                const getVal = (rowObj, keywords) => {
                    for (let keyword of keywords) {
                        let foundKey = Object.keys(rowObj).find(k => k.trim().toLowerCase() === keyword);
                        if (!foundKey) foundKey = Object.keys(rowObj).find(k => k.trim().toLowerCase().includes(keyword));
                        if (foundKey && rowObj[foundKey] !== undefined && rowObj[foundKey] !== '') return rowObj[foundKey];
                    }
                    return '';
                };

                rawDataExcel.forEach(row => {
                    let namaRaw = getVal(row, ['nama peserta', 'nama pmi', 'nama tki', 'nama lengkap', 'nama']);
                    let nikRaw = getVal(row, ['nik', 'no. ktp', 'ktp', 'identitas', 'paspor']);
                    
                    if (!namaRaw && !nikRaw) return;

                    let namaUpper = String(namaRaw).toUpperCase().trim();
                    let nikStr = String(nikRaw).toUpperCase().trim();

                    // 🛑 AUTO-SWAP: Tukar kembali jika kolom Nama isinya NIK (angka 10+ digit) dan NIK isinya Nama
                    if (/^\d{10,}$/.test(namaUpper) && !/^\d{10,}$/.test(nikStr)) {
                        const temp = namaUpper;
                        namaUpper = nikStr;
                        nikStr = temp;
                    }

                    // 🛑 FILTER BARIS HANTU: Abaikan jika 'nama' isinya cuma angka pendek (contoh: 1, 2, 3 dari kolom urutan)
                    if (/^\d{1,5}$/.test(namaUpper)) return; 
                    
                    // Filter baris total
                    if (namaUpper.includes('TOTAL') || namaUpper.includes('JUMLAH') || namaUpper === 'NAMA PESERTA' || namaUpper === 'NAMA') return;

                    if (!namaUpper || namaUpper === '') return;

                    const programJabatan = String(getVal(row, ['program pemagangan', 'program', 'jabatan', 'kejuruan'])).toUpperCase();
                    const kelompokKerja = String(getVal(row, ['kelompok jenis kerja', 'jenis kerja'])).toUpperCase();
                    const subKerja = String(getVal(row, ['sub jenis kerja', 'sub bidang'])).toUpperCase();
                    
                    let finalProgram = 'MAGANG'; 
                    
                    if (programJabatan.includes('JISSHUUSEI')) {
                        finalProgram = 'MAGANG';
                    } else if (programJabatan.includes('3 GO') || programJabatan.includes('3GO') || kelompokKerja.includes('3 GO') || subKerja.includes('3 GO')) {
                        finalProgram = '3 GO';
                    } else if (programJabatan.includes('TG') || programJabatan.includes('TOKUTEI') || kelompokKerja.includes('TOKUTEI') || subKerja.includes('TOKUTEI')) {
                        finalProgram = 'TG';
                    } else if (programJabatan.includes('ENGINEER') || kelompokKerja.includes('ENGINEER') || subKerja.includes('ENGINEER')) {
                        finalProgram = 'ENGINEER';
                    }

                    extractedNewData.push({
                        id: nikStr ? nikStr : `${namaUpper}_${bulanDariFile}`, 
                        nama: namaUpper,
                        nik: nikStr,
                        bulan: bulanDariFile,
                        program: finalProgram
                    });
                });

                if (extractedNewData.length === 0) {
                    throw new Error("Tidak ada data siswa yang valid. Pastikan file tidak kosong.");
                }

                // MERGE 
                const existingMap = new Map(rawData.map(item => [item.id, item]));
                extractedNewData.forEach(item => existingMap.set(item.id, item));

                const combinedData = Array.from(existingMap.values());
                
                setRawData(combinedData);
                localStorage.setItem('UJC_Keberangkatan_Data', JSON.stringify(combinedData));

            } catch (error) {
                alert("Error: " + error.message);
                console.error("Excel parsing error:", error);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file); 
    };

    const handleClearData = () => {
        if (window.confirm("Peringatan: Dasbor akan di-reset. Semua data akumulasi akan terhapus dari memori. Lanjutkan?")) {
            localStorage.removeItem('UJC_Keberangkatan_Data');
            setRawData([]);
            setFileName('');
        }
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const handleOpenSiswaBulanModal = useCallback((bulan) => {
        if (!summary) return;
        const siswaBulanIni = summary.rincian.filter(r => r.BULAN === bulan);
        setSiswaBulanModal({ bulan, siswa: siswaBulanIni });
    }, [summary]);

    const handleOpenProgramModal = useCallback((program, bulan) => {
        if (!summary) return;
        const siswaProgram = summary.rincian
            .filter(r => r.BULAN === bulan && r[program] > 0)
            .map(r => ({ nama_lengkap: `Siswa ${program}`, bulan: r.BULAN, perusahaan: '-' })); 
        setProgramModal({ program, siswa: siswaProgram });
    }, [summary]);

    return (
        <div className="fade-in" style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f1f5f9', minHeight: '100vh' }}>
            <HeaderSection summary={summary} />
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                    <button onClick={() => fileInputRef.current.click()} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Upload size={18} /> Tambahkan File Data (.xlsx/.csv)
                    </button>
                    {fileName && <span style={{color: '#64748b', fontSize: '0.9rem'}}>Baru diunggah: <b>{fileName}</b></span>}
                </div>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    {rawData.length > 0 && (
                        <button onClick={handleClearData} style={{ background: 'white', color: '#dc2626', border: '1px solid #dc2626', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Trash2 size={18} /> Kosongkan Dasbor
                        </button>
                    )}
                    <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LogOut size={18} /> Keluar
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '50px', textAlign: 'center', color: '#1e3a8a', fontWeight: 800 }}>
                    <Activity className="animate-spin" size={30} style={{marginRight: '10px', verticalAlign: 'middle'}}/> Menggabungkan & Memproses Data...
                </div>
            ) : summary ? (
                <div className="fade-in">
                    <KpiCardGroup kpi={summary.kpi} />
                    <ChartContainer summary={summary} />
                    <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 0.7fr', gap: '25px', marginBottom: '30px' }}>
                        <HighlightExtremes summary={summary} />
                        <SummaryTable summary={summary} />
                        <IllustrationCard />
                    </div>
                    <footer style={{marginTop: '30px', fontSize: '0.8rem', color: '#64748b'}}>
                        Catatan: Dasbor ini memuat data akumulatif. Total siswa berangkat periode {summary.kpi.periode} = {summary.totalBerangkat} orang. Data tersimpan di memori peramban Anda.
                    </footer>
                </div>
            ) : (
                <div style={{ padding: '50px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                    <h3 style={{color: '#475569'}}>Belum ada data. Silakan unggah file Excel keberangkatan pertama Anda.</h3>
                    <p style={{color: '#94a3b8'}}>Pastikan nama file mengandung bulan (contoh: "Data - Januari.csv").</p>
                </div>
            )}

            <ModalDaftarSiswaPerBulan modalData={siswaBulanModal} onClose={() => setSiswaBulanModal(null)} />
            <ModalDetailProgramKeberangkatan modalData={programModal} onClose={() => setProgramModal(null)} />
        </div>
    );
}