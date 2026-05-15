import React, { useState, useEffect } from 'react';
import { supervisorService } from '../../services/supervisorService'; 
import { Building2, Loader2, Printer, PieChart } from 'lucide-react';
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

export default function LaporanEvaluasiMitra() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [evalMonth, setEvalMonth] = useState(new Date().toISOString().slice(0, 7)); // Default YYYY-MM

    useEffect(() => {
        fetchDataMitra();
    }, []);

    const fetchDataMitra = async () => {
        setIsLoading(true);
        try {
            const data = await supervisorService.getMitraEvaluationData();
            setStudents(data);
        } catch (error) {
            console.error("Gagal menarik data evaluasi:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ── LOGIKA KALKULASI LAPORAN EVALUASI MITRA (BERDASARKAN BULAN) ──
    const getEvaluasiMitraData = () => {
        return students
            .filter(s => s.created_at && s.created_at.startsWith(evalMonth))
            .reduce((acc, s) => {
                const mitra = s.lpk_asal;
                if (!acc[mitra]) acc[mitra] = { total: 0, lolos: 0, terbang: 0, gagal: 0, proses: 0 };
                
                acc[mitra].total++;

                const isTerbang = s.tahap_sekarang === 'SIAP BERANGKAT';
                const isLolos = s.medical_checkup_status === 'FIT' || ['PENDIDIKAN DIKLAT', 'AVAILABLE', 'PRA_MENSETSU', 'INTERVIEW', 'MATCHED', 'MCU_LANJUTAN', 'PEMBERKASAN'].includes(s.tahap_sekarang);
                const isGagal = s.status_akhir === 'GAGAL SELEKSI' || s.tahap_sekarang === 'ARSIP / GAGAL' || s.medical_checkup_status === 'UNFIT';

                if (isTerbang) acc[mitra].terbang++;
                else if (isGagal) acc[mitra].gagal++;
                else if (isLolos) acc[mitra].lolos++;
                else acc[mitra].proses++;

                return acc;
            }, {});
    };

    const evalData = getEvaluasiMitraData();

    // ── FUNGSI CETAK PDF LAPORAN ──
    const handlePrintEvaluasi = () => {
        const printWindow = window.open('', '_blank');
        const rows = Object.entries(evalData).map(([mitra, data]) => `
            <tr>
                <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">${mitra}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${data.total}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; color: #16a34a; font-weight: bold;">${data.lolos}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; color: #8b5cf6; font-weight: bold;">${data.terbang}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; color: #dc2626; font-weight: bold;">${data.gagal}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; color: #d97706; font-weight: bold;">${data.proses}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Laporan Evaluasi Mitra LPK - ${evalMonth}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        h2 { text-align: center; color: #101869; margin-bottom: 5px; }
                        .subtitle { text-align: center; margin-bottom: 30px; color: #64748b; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 12px; color: #475569; border: 1px solid #cbd5e1; padding: 12px; }
                        .footer { margin-top: 50px; text-align: right; font-size: 12px; color: #64748b; }
                    </style>
                </head>
                <body>
                    <h2>LAPORAN EVALUASI KINERJA MITRA LPK</h2>
                    <div class="subtitle">Periode Pendaftaran: <b>Bulan ${evalMonth}</b></div>
                    <table>
                        <thead>
                            <tr>
                                <th>Nama Mitra / LPK Asal</th>
                                <th>Total Pengajuan (Orang)</th>
                                <th>Lolos Seleksi (Diklat/Match)</th>
                                <th>Berhasil Terbang (Jepang)</th>
                                <th>Gagal Seleksi (Arsip)</th>
                                <th>Masih Proses Seleksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows || '<tr><td colspan="6" style="text-align:center; padding:20px;">Tidak ada data pendaftaran Mitra pada periode ini.</td></tr>'}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Dicetak secara otomatis oleh Sistem LPK Universal Japan Course</p>
                        <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    };

    return (
        <div className="fade-in" style={{ padding: '30px', background: '#f8fafc', minHeight: '100%', borderRadius: '15px' }}>
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PieChart size={28} color={brandNavy}/> Evaluasi Kinerja Mitra
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '5px', fontSize: '1rem' }}>
                        Rekap performa pengajuan dan kelulusan siswa titipan LPK per bulan.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div>
                        <label style={styles.lb}>Pilih Bulan Pendaftaran</label>
                        <input 
                            type="month" 
                            value={evalMonth} 
                            onChange={(e) => setEvalMonth(e.target.value)} 
                            style={{ ...styles.inpSm, width: '180px' }} 
                        />
                    </div>
                    <button 
                        onClick={handlePrintEvaluasi} 
                        style={{ padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', height: '42px', marginTop: '20px' }}
                    >
                        <Printer size={18}/> Cetak PDF
                    </button>
                </div>
            </header>

            <div style={styles.tableContainer}>
                <table style={styles.tableS}>
                    <thead style={styles.theadS}>
                        <tr>
                            <th style={styles.thStyle}>Nama Mitra LPK Asal</th>
                            <th style={{...styles.thStyle, textAlign:'center'}}>Total Pengajuan</th>
                            <th style={{...styles.thStyle, textAlign:'center'}}>Lolos Seleksi<br/><span style={{fontSize:'0.65rem', color:'#94a3b8'}}>(Diklat / Match)</span></th>
                            <th style={{...styles.thStyle, textAlign:'center'}}>Berhasil Terbang<br/><span style={{fontSize:'0.65rem', color:'#94a3b8'}}>(Ke Jepang)</span></th>
                            <th style={{...styles.thStyle, textAlign:'center'}}>Gagal Seleksi<br/><span style={{fontSize:'0.65rem', color:'#94a3b8'}}>(Arsip/Unfit)</span></th>
                            <th style={{...styles.thStyle, textAlign:'center'}}>Masih Proses<br/><span style={{fontSize:'0.65rem', color:'#94a3b8'}}>(Seleksi / MCU)</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'50px'}}><Loader2 className="animate-spin" size={30} style={{margin:'0 auto', color: brandNavy}}/></td></tr>
                        ) : Object.keys(evalData).length === 0 ? (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'40px', color:'#94a3b8', fontWeight:700}}>Tidak ada data pengajuan mitra pada bulan {evalMonth}.</td></tr>
                        ) : Object.entries(evalData).sort((a, b) => b[1].total - a[1].total).map(([mitra, data]) => (
                            <tr key={mitra} style={styles.trS}>
                                <td style={{...styles.tdStyle, fontWeight: 800, color: brandNavy}}>
                                    <Building2 size={16} style={{display:'inline', marginBottom:'-3px', marginRight:'5px', color: '#3b82f6'}}/> 
                                    {mitra}
                                </td>
                                <td style={{...styles.tdStyle, textAlign:'center', fontWeight: 900, fontSize:'1.1rem'}}>{data.total}</td>
                                <td style={{...styles.tdStyle, textAlign:'center', fontWeight: 900, fontSize:'1.1rem', color:'#10b981'}}>{data.lolos}</td>
                                <td style={{...styles.tdStyle, textAlign:'center', fontWeight: 900, fontSize:'1.1rem', color:'#8b5cf6'}}>{data.terbang}</td>
                                <td style={{...styles.tdStyle, textAlign:'center', fontWeight: 900, fontSize:'1.1rem', color:'#ef4444'}}>{data.gagal}</td>
                                <td style={{...styles.tdStyle, textAlign:'center', fontWeight: 900, fontSize:'1.1rem', color:'#f59e0b'}}>{data.proses}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}