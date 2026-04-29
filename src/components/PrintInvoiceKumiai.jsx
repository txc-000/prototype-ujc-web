import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PrintInvoiceKumiai() {
    const { id } = useParams();
    const location = useLocation();
    
    // Deteksi apakah tombol yang diklik adalah "Detail + Foto"
    const queryParams = new URLSearchParams(location.search);
    const withPhoto = queryParams.get('foto') === 'true';

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
                if (error) throw error;
                setInvoice(data);
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
    const details = invoice.detail_tagihan || [];

    return (
        <div style={{ fontFamily: '"MS Mincho", "Noto Sans JP", sans-serif', padding: '40px', maxWidth: '1000px', margin: '0 auto', color: '#000', backgroundColor: '#fff', minHeight: '100vh' }}>
            <style>{`
                @media print { @page { margin: 10mm; size: A4 landscape; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } }
                table, th, td { border: 1px solid black; border-collapse: collapse; }
                th, td { padding: 6px 10px; font-size: 12px; vertical-align: middle; }
                th { background-color: #f1f5f9; text-align: center; }
            `}</style>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', letterSpacing: '10px', borderBottom: '2px solid #000', display: 'inline-block', paddingBottom: '5px', margin: 0 }}>御請求書</h1>
                <div style={{ fontSize: '12px', letterSpacing: '5px', marginTop: '5px' }}>INVOICE</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ width: '45%' }}>
                    <div style={{ fontSize: '14px', marginBottom: '5px' }}>お客様 :</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>{invoice.kumiai_name} 御中</div>
                    <div style={{ fontSize: '14px' }}>下記の通りご請求申し上げます。</div>
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

            <table style={{ width: '100%', marginBottom: '30px' }}>
                <thead>
                    <tr>
                        <th style={{ width: '5%' }}>NO</th>
                        <th style={{ width: '15%' }}>項目 (Item)</th>
                        {/* Render header foto jika dipilih */}
                        {withPhoto && <th style={{ width: '10%' }}>写真 (Foto)</th>}
                        <th style={{ width: withPhoto ? '15%' : '25%' }}>名前 (Nama Siswa)</th>
                        <th style={{ width: '15%' }}>実習先 (Perusahaan)</th>
                        <th style={{ width: '10%' }}>単価 (Harga)</th>
                        <th style={{ width: '10%' }}>数量 (Qty)</th>
                        <th style={{ width: '10%' }}>単位 (Satuan)</th>
                        <th style={{ width: '10%' }}>金額 (Subtotal)</th>
                    </tr>
                </thead>
                <tbody>
                    {details.length > 0 ? (
                        details.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                <td>管理費 (Kanri-hi)</td>
                                {/* Render data foto jika dipilih */}
                                {withPhoto && (
                                    <td style={{ textAlign: 'center' }}>
                                        {item.foto ? (
                                            <img src={item.foto} alt="foto" style={{ width: '30px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                            <div style={{ width: '30px', height: '40px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', margin: '0 auto' }}>No Pic</div>
                                        )}
                                    </td>
                                )}
                                <td>{item.nama_lengkap}</td>
                                <td>{item.perusahaan}</td>
                                <td style={{ textAlign: 'right' }}>¥{Number(item.nominal).toLocaleString()}</td>
                                <td style={{ textAlign: 'center' }}>{item.kuantitas}</td>
                                <td style={{ textAlign: 'center' }}>{item.satuan}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>¥{(item.nominal * item.kuantitas).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={withPhoto ? 9 : 8} style={{ textAlign: 'center' }}>Tidak ada rincian siswa (Format Lama)</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={withPhoto ? 8 : 7} style={{ textAlign: 'right', fontWeight: 'bold' }}>小計 (Subtotal)</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>¥ {Number(invoice.subtotal || invoice.total_amount).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colSpan={withPhoto ? 8 : 7} style={{ textAlign: 'right', fontWeight: 'bold' }}>消費税 (PPN 11%)</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>¥ {Number(invoice.tax_amount || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colSpan={withPhoto ? 8 : 7} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px', backgroundColor: '#f1f5f9' }}>合計 (Total Amount)</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px', backgroundColor: '#f1f5f9' }}>¥ {Number(invoice.total_amount).toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                    上記の明細をご確認後、下記の口座にお振込み手数料をお客様ご負担で、お振込みをお願い致します。<br/>
                    <span style={{ fontSize: '10px', color: '#555' }}>(Harap transfer ke rekening di bawah ini setelah memeriksa rincian. Biaya transfer ditanggung oleh klien.)</span>
                </div>
                <table style={{ width: '60%', fontSize: '12px', lineHeight: '1.8' }}>
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