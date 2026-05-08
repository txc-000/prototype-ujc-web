import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PrintKwitansiSiswa() {
    const { id } = useParams();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper: Fungsi Auto-Terbilang Bahasa Indonesia
    const terbilang = (angka) => {
        const bilangan = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan','Sepuluh','Sebelas'];
        if (angka < 12) return bilangan[angka];
        if (angka < 20) return terbilang(angka - 10) + ' Belas ';
        if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10);
        if (angka < 200) return 'Seratus ' + terbilang(angka - 100);
        if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100);
        if (angka < 2000) return 'Seribu ' + terbilang(angka - 1000);
        if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000);
        if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000);
        if (angka < 1000000000000) return terbilang(Math.floor(angka / 1000000000)) + ' Milyar ' + terbilang(angka % 1000000000);
        return '';
    };

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                // Tarik data pembayaran sekaligus join dengan data siswa
                const { data, error } = await supabase
                    .from('student_payments')
                    .select('*, students(nama_lengkap, nik, program)')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                setPayment(data);
                
                setTimeout(() => { window.print(); }, 800);
            } catch (err) {
                alert('Data Kwitansi tidak ditemukan!');
            } finally { setLoading(false); }
        };
        if (id) fetchPayment();
    }, [id]);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat Kwitansi...</div>;
    if (!payment) return null;

    const tglBayar = new Date(payment.tanggal_bayar || payment.created_at);
    const formatTgl = tglBayar.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const nominalAngka = Number(payment.nominal);
    const nominalTerbilang = terbilang(nominalAngka).trim() + ' Rupiah';

    // Nomor Kwitansi Otomatis (Format: UJC-KWT/Tahun/Bulan/ID)
    const noKwitansi = `UJC-KWT/${tglBayar.getFullYear()}/${String(tglBayar.getMonth()+1).padStart(2, '0')}/${String(payment.id).slice(0,4).toUpperCase()}`;

    return (
        <div style={{ fontFamily: '"Arial", sans-serif', color: '#000', backgroundColor: '#fff', minHeight: '100vh', padding: '20px' }}>
            <style>{`
                @media print { 
                    @page { margin: 10mm; size: A5 landscape; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } 
                }
            `}</style>

            <div style={{ maxWidth: '800px', margin: '0 auto', border: '2px solid #000', padding: '30px', position: 'relative' }}>
                
                {/* HEADER / KOP */}
                <div style={{ display: 'flex', borderBottom: '3px solid #101869', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '24px', color: '#101869', fontWeight: 900 }}>LPK UNIVERSAL JAPAN COURSE</h1>
                        <div style={{ fontSize: '12px', marginTop: '5px' }}>Ruko Klipang Golf View Kav. 5/16, Sendangmulyo, Semarang</div>
                        <div style={{ fontSize: '12px' }}>Telp: +62-24-7674-0536 | Email: info@universaljapancourse.com</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ margin: 0, fontSize: '28px', letterSpacing: '2px', color: '#1e293b' }}>KWITANSI</h2>
                        <div style={{ fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>No: {noKwitansi}</div>
                    </div>
                </div>

                {/* BODY KWITANSI */}
                <table style={{ width: '100%', fontSize: '14px', lineHeight: '2' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '25%', verticalAlign: 'top' }}>Telah terima dari</td>
                            <td style={{ width: '2%', verticalAlign: 'top' }}>:</td>
                            <td style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px dotted #000' }}>
                                {payment.students?.nama_lengkap?.toUpperCase()}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ verticalAlign: 'top' }}>Uang Sejumlah</td>
                            <td style={{ verticalAlign: 'top' }}>:</td>
                            <td style={{ background: '#f1f5f9', padding: '5px 10px', fontStyle: 'italic', fontWeight: 'bold', border: '1px solid #cbd5e1' }}>
                                "{nominalTerbilang}"
                            </td>
                        </tr>
                        <tr>
                            <td style={{ verticalAlign: 'top' }}>Untuk Pembayaran</td>
                            <td style={{ verticalAlign: 'top' }}>:</td>
                            <td style={{ borderBottom: '1px dotted #000' }}>
                                {payment.keterangan || 'Pembayaran Tagihan LPK'} 
                                {payment.students?.program ? ` (Program: ${payment.students.program})` : ''}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ verticalAlign: 'top' }}>Metode Pembayaran</td>
                            <td style={{ verticalAlign: 'top' }}>:</td>
                            <td style={{ borderBottom: '1px dotted #000' }}>
                                {payment.metode_pembayaran}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* FOOTER & TTD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', alignItems: 'flex-end' }}>
                    <div style={{ background: '#101869', color: 'white', padding: '10px 25px', fontSize: '22px', fontWeight: 'bold', borderRadius: '5px' }}>
                        Rp {nominalAngka.toLocaleString('id-ID')}
                    </div>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <div style={{ fontSize: '14px', marginBottom: '60px' }}>Semarang, {formatTgl}</div>
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Bagian Keuangan</div>
                        <div style={{ fontSize: '12px' }}>LPK Universal Japan Course</div>
                    </div>
                </div>

            </div>
        </div>
    );
}