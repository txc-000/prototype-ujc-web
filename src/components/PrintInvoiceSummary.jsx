import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PrintInvoiceSummary() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
                if (error) throw error;
                setInvoice(data);
                
                // Auto-print
                setTimeout(() => { window.print(); }, 800);
            } catch (err) {
                alert('Data Invoice tidak ditemukan!');
            } finally { setLoading(false); }
        };
        if (id) fetchInvoice();
    }, [id]);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat Dokumen 領収書...</div>;
    if (!invoice) return null;

    const tglBuat = new Date(invoice.created_at);
    const tglJepang = `${tglBuat.getFullYear()}年${tglBuat.getMonth() + 1}月${tglBuat.getDate()}日`;
    
    // ALGORITMA GROUPING (Merekap total per perusahaan beserta daftar nama siswa)
    const details = invoice.detail_tagihan || [];
    
    const summaryData = details.reduce((acc, item) => {
        // Menggunakan key kombinasi agar Kaisha dengan nominal berbeda tidak tercampur
        const key = `${item.perusahaan}_${item.nominal}_${item.satuan}`;
        if (!acc[key]) {
            acc[key] = { 
                perusahaan: item.perusahaan || 'Lainnya',
                names: [],
                nominal: Number(item.nominal), 
                satuan: item.satuan, 
                kuantitas: 0, 
                total: 0 
            };
        }
        acc[key].names.push(item.nama_lengkap); // Kumpulkan nama siswa
        acc[key].kuantitas += Number(item.kuantitas);
        acc[key].total += (Number(item.nominal) * Number(item.kuantitas));
        return acc;
    }, {});
    
    // Proses Object menjadi Array dan format string deskripsinya (dengan Smart Naming)
    const summaryArray = Object.values(summaryData).map(group => {
        // Logika Smart Naming
        const firstNamesCount = {};
        group.names.forEach(name => {
            const firstName = (name || '').trim().split(' ')[0].toLowerCase();
            firstNamesCount[firstName] = (firstNamesCount[firstName] || 0) + 1;
        });

        const smartNames = group.names.map(name => {
            const words = (name || '').trim().split(' ');
            const firstName = words[0].toLowerCase();
            if (firstNamesCount[firstName] > 1 && words.length > 1) {
                return words.slice(1).join(' '); // Ambil kata kedua dst jika kembar
            }
            return name;
        });

        const joinedNames = smartNames.join(', ');
        
        return {
            deskripsi: `技能実習管理費 (${group.perusahaan} - ${joinedNames})`,
            nominal: group.nominal,
            satuan: group.satuan,
            kuantitas: group.kuantitas,
            total: group.total
        };
    });

    return (
        <div style={{ fontFamily: '"MS Mincho", "Noto Sans JP", serif', padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#000', backgroundColor: '#fff', minHeight: '100vh' }}>
            <style>{`
                @media print { 
                    @page { margin: 15mm; size: A4 portrait; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } 
                }
                table, th, td { border: 1px solid black; border-collapse: collapse; }
                th, td { padding: 10px; font-size: 14px; }
            `}</style>

            <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                <h1 style={{ fontSize: '28px', letterSpacing: '15px', margin: 0 }}>領収書</h1>
                <div style={{ fontSize: '14px', letterSpacing: '5px' }}>RECEIPT / KWITANSI</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <div style={{ fontSize: '16px', marginBottom: '5px' }}>お客様 :</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '5px', minWidth: '300px' }}>
                        {invoice.kumiai_name} 様
                    </div>
                </div>
                <div style={{ fontSize: '14px', textAlign: 'right' }}>
                    {/* Mengubah INV menjadi RY (Ryoshusho) */}
                    <div><strong>No:</strong> {invoice.invoice_no.replace('INV', 'RY')}</div>
                    <div><strong>日付:</strong> {tglJepang}</div>
                </div>
            </div>

            <table style={{ width: '100%', marginBottom: '50px' }}>
                <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr>
                        <th style={{ width: '5%' }}>No</th>
                        <th style={{ width: '45%', textAlign: 'left' }}>内容 (Description)</th>
                        <th style={{ width: '10%' }}>数 (Qty)</th>
                        <th style={{ width: '15%' }}>価格 (Price)</th>
                        <th style={{ width: '25%' }}>金額 (Amount)</th>
                    </tr>
                </thead>
                <tbody>
                    {summaryArray.length > 0 ? (
                        summaryArray.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                <td>{item.deskripsi}</td>
                                <td style={{ textAlign: 'center' }}>{item.kuantitas} {item.satuan}</td>
                                <td style={{ textAlign: 'right' }}>¥{item.nominal.toLocaleString()}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>¥{item.total.toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td style={{ textAlign: 'center' }}>1</td>
                            <td>技能実習管理費 ({invoice.kumiai_name})</td>
                            <td style={{ textAlign: 'center' }}>-</td>
                            <td style={{ textAlign: 'right' }}>-</td>
                            <td style={{ textAlign: 'right' }}>¥{Number(invoice.subtotal || invoice.total_amount).toLocaleString()}</td>
                        </tr>
                    )}
                    
                    {/* Baris Tambahan untuk PPN (Jika Ada) */}
                    {Number(invoice.tax_amount) > 0 && (
                        <tr>
                            <td style={{ border: 'none' }}></td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', border: 'none' }} colSpan="3">消費税 (PPN 11%)</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>¥{Number(invoice.tax_amount).toLocaleString()}</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>合計金額 (Total)</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '18px', backgroundColor: '#f1f5f9', color: '#101869' }}>
                            ¥{Number(invoice.total_amount).toLocaleString()}
                        </td>
                    </tr>
                </tfoot>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '50px' }}>
                <div style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>LPK Universal Japan Course</div>
                    <div>〒50272</div>
                    <div>Ruko Klipang Golf View Kav. 5/16</div>
                    <div>Sendangmulyo, Semarang</div>
                    <div>Indonesia</div>
                    <div>Telp. +62-24-7674-0536</div>
                </div>
            </div>
        </div>
    );
}