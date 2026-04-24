import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintSertifikatLulus() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            const { data } = await supabase.from('students').select('*').eq('id', id).single();
            if (data) setStudent(data);
        };
        fetchStudent();
    }, [id]);

    if (!student) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Memuat Sertifikat...</div>;

    // Helper Format Tanggal Indonesia (Contoh: 21 APRIL 2004)
    const formatTanggalIndo = (dateString) => {
        if (!dateString) return '-';
        const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
        const d = new Date(dateString);
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // Helper Format Tanggal Jepang (Contoh: 2004年04月21日)
    const formatTanggalJepang = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
    };

    const fotoUrl = supabase.storage.from('registration_photos').getPublicUrl(`${student.id}.jpg`).data.publicUrl;
    const nomorSertifikat = `/Serf/LPK-UJC/I/${new Date().getFullYear()}`;

    return (
        <div style={{ backgroundColor: '#cbd5e1', minHeight: '100vh', paddingBottom: '40px', fontFamily: '"MS Mincho", "Times New Roman", serif' }}>
            
            <div className="no-print" style={{ background: '#0f172a', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => window.close()} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DOKUMEN PENDIDIKAN</div><div style={{ fontWeight: 700 }}>Sertifikat Lulus - {student.nama_lengkap}</div></div>
                </div>
                <button onClick={() => window.print()} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px', fontWeight: 'bold' }}><Printer size={18} /> Print Kertas</button>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print { 
                    @page { size: A4 portrait; margin: 0; } 
                    body { background: white !important; -webkit-print-color-adjust: exact; } 
                    .no-print { display: none !important; } 
                    .a4-paper { margin: 0 !important; box-shadow: none !important; border: none !important; } 
                }
                .a4-paper { background: white; width: 210mm; min-height: 297mm; margin: 30px auto; padding: 20mm; box-sizing: border-box; color: black; line-height: 1.5; position: relative; }
                .cert-border { position: absolute; top: 15mm; bottom: 15mm; left: 15mm; right: 15mm; border: 4px double #101869; padding: 10mm; }
                .cert-table { width: 100%; border-collapse: collapse; margin-top: 30px; margin-bottom: 30px; }
                .cert-table td { padding: 12px 5px; vertical-align: top; }
                .td-label { width: 40%; font-weight: bold; }
                .td-colon { width: 5%; text-align: center; font-weight: bold; }
                .td-value { width: 55%; font-weight: bold; }
                .jp-text { font-size: 12pt; }
                .id-text { font-size: 11pt; font-family: "Arial", sans-serif; color: #333; }
                .value-jp { font-size: 14pt; margin-bottom: 5px; }
                .value-id { font-size: 12pt; font-family: "Arial", sans-serif; text-transform: uppercase; }
            `}} />

            <div className="a4-paper">
                <div className="cert-border">
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '24pt', margin: '0 0 5px 0', letterSpacing: '4px' }}>証明書</h1>
                        <h2 style={{ fontSize: '20pt', margin: '0 0 20px 0', letterSpacing: '2px', fontFamily: '"Arial", sans-serif' }}>CERTIFICATE</h2>
                        <h3 style={{ fontSize: '18pt', margin: '0 0 5px 0' }}>LPK UNIVERSAL JAPAN COURSE</h3>
                        <p style={{ margin: 0, fontSize: '12pt', fontFamily: '"Arial", sans-serif' }}>{nomorSertifikat}</p>
                    </div>

                    <table className="cert-table">
                        <tbody>
                            <tr>
                                <td className="td-label">
                                    <div className="jp-text">氏名</div>
                                    <div className="id-text">NAMA</div>
                                </td>
                                <td className="td-colon">:</td>
                                <td className="td-value">
                                    <div className="value-jp">{student.nama_jepang || '---'}</div>
                                    <div className="value-id">{student.nama_lengkap}</div>
                                </td>
                            </tr>
                            <tr>
                                <td className="td-label">
                                    <div className="jp-text">出身地、生年月日</div>
                                    <div className="id-text">TEMPAT TANGGAL LAHIR</div>
                                </td>
                                <td className="td-colon">:</td>
                                <td className="td-value">
                                    <div className="value-jp">{student.tempat_lahir ? `${student.tempat_lahir}、` : ''}{formatTanggalJepang(student.tanggal_lahir)}</div>
                                    <div className="value-id">{student.tempat_lahir ? `${student.tempat_lahir}, ` : ''}{formatTanggalIndo(student.tanggal_lahir)}</div>
                                </td>
                            </tr>
                            <tr>
                                <td className="td-label">
                                    <div className="jp-text">講習種目</div>
                                    <div className="id-text">BIDANG PEMBELAJARAN</div>
                                </td>
                                <td className="td-colon">:</td>
                                <td className="td-value">
                                    <div className="value-jp" style={{fontSize: '12pt'}}>事前技能実習の日本語・日本文化講習</div>
                                    <div className="value-id" style={{fontSize: '10pt'}}>PELATIHAN PRA PEMBERANGKATAN PEMAGANGAN,<br/>BAHASA, DAN BUDAYA JEPANG</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ textAlign: 'justify', marginBottom: '20px' }}>
                        <p className="jp-text" style={{ textIndent: '20px', marginBottom: '15px' }}>
                            上記の者はユニバーサルジャーパンコース学校で約564時間もしくは3ヶ月の講習を修了した、ということで日本で3年間技能実習プログラムに資格を保有する者で <span style={{border: '1px solid black', padding: '2px 8px', borderRadius: '50%'}}>有</span> / 無 ことを証明します。
                        </p>
                        <p className="id-text" style={{ textIndent: '20px', lineHeight: '1.6' }}>
                            Sertifikat ini menyatakan bahwa peserta di atas telah menyelesaikan pembelajaran selama 564 jam atau 3 bulan di LPK UNIVERSAL JAPAN COURSE Semarang Indonesia, serta <strong><u>LAYAK</u> / <strike>TIDAK LAYAK</strike></strong> untuk mengikuti program pemagangan di Jepang selama 3 tahun.
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '50px' }}>
                        <div style={{ width: '3cm', height: '4cm', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px' }}>
                            <img src={fotoUrl} alt="foto 3x4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = 'foto<br/>3x4'; }} />
                        </div>
                        <div style={{ textAlign: 'center', width: '250px' }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '11pt', fontFamily: '"Arial", sans-serif' }}>Semarang, {formatTanggalIndo(new Date())}</p>
                            <p style={{ margin: '0 0 60px 0', fontSize: '11pt', fontFamily: '"Arial", sans-serif' }}>Pimpinan LPK UJC</p>
                            <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline', fontSize: '12pt', fontFamily: '"Arial", sans-serif' }}>(ARIS SUTIKNO, SS.)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}