import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PrintInvoiceKumiai() {
    const { id } = useParams();
    
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
                if (error) throw error;
                setInvoice(data);
                
                // Auto-print setelah data selesai dirender
                setTimeout(() => { window.print(); }, 800);
            } catch (err) {
                alert('Data Invoice tidak ditemukan!');
            } finally { setLoading(false); }
        };
        if (id) fetchInvoice();
    }, [id]);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat Dokumen 請求書...</div>;
    if (!invoice) return null;

    const tglBuat = new Date(invoice.created_at);
    const tglJepang = `${tglBuat.getFullYear()}年${tglBuat.getMonth() + 1}月${tglBuat.getDate()}日`;
    const rawDetails = invoice.detail_tagihan || [];

    // ==========================================
    // 1. LOGIKA AUTO-SWITCH
    // ==========================================
    
    // Hitung jumlah perusahaan unik dalam tagihan ini
    const uniqueCompanies = [...new Set(rawDetails.map(d => d.perusahaan))];
    
    // Auto-Switch: Jika Kaisha > 10, gunakan Mode Ringkas. Jika <= 10, Mode Detail.
    const isModeRingkas = uniqueCompanies.length > 10;

    // ==========================================
    // 2. PEMETAAN DATA BERDASARKAN MODE CETAK
    // ==========================================
    
    let displayData = [];

    if (isModeRingkas) {
        // MODE RINGKAS (Gelondongan)
        uniqueCompanies.forEach(company => {
            const companyStudents = rawDetails.filter(d => d.perusahaan === company);
            
            // Langsung menggunakan nama lengkap asli
            const fullNames = companyStudents.map(s => s.nama_lengkap || '-');
            const total = companyStudents.reduce((sum, s) => sum + (Number(s.nominal) * Number(s.kuantitas)), 0);
            
            // Ambil No Entri master sebagai representasi
            const noEntri = companyStudents[0]?.no_entri || companyStudents[0]?.tanggal_entri || '-'; 

            displayData.push({
                perusahaan: company,
                siswa_list: fullNames.join(', '),
                no_entri: noEntri,
                total_tagihan: total
            });
        });
    } else {
        // MODE DETAIL (Rincian per Siswa)
        uniqueCompanies.forEach(company => {
            const companyStudents = rawDetails.filter(d => d.perusahaan === company);
            
            companyStudents.forEach(student => {
                displayData.push({
                    ...student,
                    // Langsung menggunakan nama lengkap asli
                    display_name: (student.nama_lengkap || '-').toUpperCase()
                });
            });
        });
    }

    return (
        <div style={{ fontFamily: '"MS Mincho", "Noto Sans JP", sans-serif', padding: '40px', maxWidth: '1000px', margin: '0 auto', color: '#000', backgroundColor: '#fff', minHeight: '100vh' }}>
            <style>{`
                @media print { 
                    @page { margin: 10mm; size: A4 landscape; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } 
                }
                table, th, td { border: 1px solid black; border-collapse: collapse; }
                th, td { padding: 6px 10px; font-size: 11px; vertical-align: middle; }
                th { background-color: #f1f5f9; text-align: center; font-weight: bold; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
            `}</style>

            {/* HEADER INVOICE B2B */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', letterSpacing: '10px', borderBottom: '2px solid #000', display: 'inline-block', paddingBottom: '5px', margin: 0 }}>御請求書</h1>
                <div style={{ fontSize: '12px', letterSpacing: '5px', marginTop: '5px' }}>INVOICE</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ width: '45%' }}>
                    <div style={{ fontSize: '14px', marginBottom: '5px' }}>お客様 :</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>{invoice.kumiai_name} 御中</div>
                    <div style={{ fontSize: '14px' }}>下記の通りご請求申し上げます。</div>
                    {isModeRingkas && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>※ Note: Format Ringkas (Akumulasi &gt; 10 Perusahaan)</div>}
                </div>
                <div style={{ width: '45%', fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>No. Faktur:</span> <span>{invoice.invoice_no}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>日付 (Date):</span> <span>{tglJepang}</span></div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#101869' }}>LPK UNIVERSAL JAPAN COURSE</div>
                    <div>RUKO KLIPANG GOLF VIEW KAV. 5/16, SENDANGMULYO</div>
                    <div>SEMARANG-INDONESIA, 〒50272</div>
                    <div>TELP: +62-24-7674-0536</div>
                </div>
            </div>

            {/* RENDER TABEL DINAMIS (DETAIL VS RINGKAS) */}
            <table style={{ width: '100%', marginBottom: '30px' }}>
                <thead>
                    {isModeRingkas ? (
                        <tr>
                            <th style={{ width: '5%' }}>NO</th>
                            <th style={{ width: '20%' }}>実習先 (Perusahaan)</th>
                            <th style={{ width: '45%' }}>実習生一覧 (Daftar Nama Siswa)</th>
                            <th style={{ width: '15%' }}>入国日 (No. Entri)</th>
                            <th style={{ width: '15%' }}>金額 (Total Tagihan)</th>
                        </tr>
                    ) : (
                        <tr>
                            <th style={{ width: '4%' }}>NO</th>
                            <th style={{ width: '18%' }}>実習先 (Perusahaan)</th>
                            <th style={{ width: '16%' }}>名前 (Nama Siswa)</th>
                            <th style={{ width: '12%' }}>入国日 (No. Entri)</th>
                            <th style={{ width: '15%' }}>期間 (Periode)</th>
                            <th style={{ width: '10%' }}>給与 (Gaji)</th>
                            <th style={{ width: '10%' }}>チケット (Tiket)</th>
                            <th style={{ width: '15%' }}>金額 (Nominal)</th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {displayData.length > 0 ? (
                        displayData.map((item, idx) => (
                            <tr key={idx}>
                                <td className="text-center">{idx + 1}</td>
                                
                                {isModeRingkas ? (
                                    <>
                                        {/* Row Mode Ringkas */}
                                        <td style={{ fontWeight: 'bold' }}>{item.perusahaan}</td>
                                        <td>{item.siswa_list}</td>
                                        <td className="text-center">{item.no_entri}</td>
                                        <td className="text-right" style={{ fontWeight: 'bold' }}>¥{Number(item.total_tagihan).toLocaleString()}</td>
                                    </>
                                ) : (
                                    <>
                                        {/* Row Mode Detail */}
                                        <td>{item.perusahaan}</td>
                                        <td style={{ fontWeight: 'bold' }}>{item.display_name}</td>
                                        <td className="text-center">{item.no_entri || item.tanggal_entri || '-'}</td>
                                        <td className="text-center" style={{ fontSize: '10px' }}>{item.periode || invoice.billing_period}</td>
                                        <td className="text-right">{item.jumlah_gaji ? `¥${Number(item.jumlah_gaji).toLocaleString()}` : '-'}</td>
                                        <td className="text-right">{item.tiket ? `¥${Number(item.tiket).toLocaleString()}` : '-'}</td>
                                        <td className="text-right" style={{ fontWeight: 'bold' }}>¥{(item.nominal * item.kuantitas).toLocaleString()}</td>
                                    </>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={isModeRingkas ? 5 : 8} className="text-center">Tidak ada rincian tagihan</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={isModeRingkas ? 4 : 7} className="text-right" style={{ fontWeight: 'bold' }}>小計 (Subtotal)</td>
                        <td className="text-right" style={{ fontWeight: 'bold' }}>¥ {Number(invoice.subtotal || invoice.total_amount).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colSpan={isModeRingkas ? 4 : 7} className="text-right" style={{ fontWeight: 'bold' }}>消費税 (PPN 11%)</td>
                        <td className="text-right" style={{ fontWeight: 'bold' }}>¥ {Number(invoice.tax_amount || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colSpan={isModeRingkas ? 4 : 7} className="text-right" style={{ fontWeight: 'bold', fontSize: '14px', backgroundColor: '#f1f5f9' }}>合計 (Total Amount)</td>
                        <td className="text-right" style={{ fontWeight: 'bold', fontSize: '16px', backgroundColor: '#f1f5f9', color: '#101869' }}>¥ {Number(invoice.total_amount).toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            {/* FOOTER INFORMASI BANK */}
            <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                    上記の明細をご確認後、下記の口座にお振込み手数料をお客様ご負担で、お振込みをお願い致します。<br/>
                    <span style={{ fontSize: '10px', color: '#555' }}>(Harap transfer ke rekening di bawah ini setelah memeriksa rincian. Biaya transfer ditanggung oleh klien.)</span>
                </div>
                <table style={{ width: '60%', fontSize: '12px', lineHeight: '1.8', border: '1px solid black' }}>
                    <tbody>
                        <tr><td style={{ width: '30%', backgroundColor: '#f8fafc', fontWeight: 'bold' }}>振込先銀行 (Bank Name)</td><td>BANK NEGARA INDONESIA (BNI)</td></tr>
                        <tr><td style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>SWIFT CODE</td><td>BNINIDJA</td></tr>
                        <tr><td style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>支店名 (Branch Name)</td><td>KCP GAYAMSARI (261)</td></tr>
                        <tr><td style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>口座番号 (Account No)</td><td style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>094 607 9758 「IDR」</td></tr>
                        <tr><td style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>口座名義 (Account Name)</td><td style={{ fontWeight: 'bold' }}>LPK UNIVERSAL JAPAN COURSE</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}