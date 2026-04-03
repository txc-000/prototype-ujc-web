import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase'; 
import { Printer, Download, ArrowLeft } from 'lucide-react';

export default function PrintRirekisho() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
            if (data) {
                setStudent(data);
            }
            if (error) console.error("Error fetching CV:", error);
        };
        fetchStudent();
    }, [id]);

    if (!student) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>Memuat Dokumen Rirekisho...</div>;

    const getAge = (dob) => {
        if (!dob) return '-';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    // Parsing JSONB secara aman
    const safeParse = (data) => {
        if (!data) return [];
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return []; }
        }
        return Array.isArray(data) ? data : [];
    };

    const pendidikan = safeParse(student.pendidikan_history);
    const kerja = safeParse(student.kerja_history);
    const keluarga = safeParse(student.keluarga_history);
    const lampiran = safeParse(student.attachments);

    // Filter kategori keluarga
    const kelDarurat = keluarga.filter(k => k.tipe === 'DARURAT');
    const kelIndo = keluarga.filter(k => k.tipe === 'INDONESIA');
    const kelJepang = keluarga.filter(k => k.tipe === 'JEPANG');

    return (
        <div style={{ backgroundColor: '#cbd5e1', minHeight: '100vh', paddingBottom: '40px', fontFamily: 'sans-serif' }}>
            
            {/* ── TOP ACTION BAR (TIDAK IKUT TERCETAK/TER-DOWNLOAD) ── */}
            <div className="no-print" style={{ background: '#0f172a', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => window.close()} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Document Viewer</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Rirekisho - {student.nama_lengkap}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <Printer size={18} /> Print Kertas
                    </button>
                    <button onClick={() => window.print()} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <Download size={18} /> Download PDF
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; margin: 0; background-color: white !important; }
                    .no-print { display: none !important; }
                    .cv-paper { margin: 0 !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; }
                }
                table { border-color: #0072BC; width: 100%; border-collapse: collapse; }
                table tr td, table tr th { word-wrap: break-word; font-size: 12px; border: 1px solid #0072BC; padding: 4px; vertical-align: top; }
                .td-titikdua { border-left: none; border-right: none; }
                .td-hilangkiri { border-left: none; }
                .td-hilangkanan { border-right: none; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                h5 { font-size: 1.2rem; margin-bottom: 5px; margin-top: 10px; font-weight: bold; }
                
                @font-face { font-family: 'MPLUSRounded1c'; src: url('http://lpkujcso.com/static/fonts/MPLUSRounded1c-Medium.ttf') format("truetype"); }
                @font-face { font-family: 'MPLUSRounded1c'; src: url('http://lpkujcso.com/static/fonts/MPLUSRounded1c-Bold.ttf') format("truetype"); font-weight: bold; }
                @font-face { font-family: 'Robotox'; src: url('http://lpkujcso.com/static/fonts/Roboto-Medium.ttf') format("truetype"); }
                @font-face { font-family: 'Robotox'; src: url('http://lpkujcso.com/static/fonts/Roboto-Bold.ttf') format("truetype"); font-weight: bold; }
                @font-face { font-family: 'MPLUS1p'; src: url('http://lpkujcso.com/static/fonts/MPLUS1p-Medium.ttf') format("truetype"); }
                @font-face { font-family: 'MPLUS1p'; src: url('http://lpkujcso.com/static/fonts/MPLUS1p-Bold.ttf') format("truetype"); font-weight: bold; }
                
                .cv-font { font-family: 'MPLUS1p', 'MPLUSRounded1c', 'Robotox', sans-serif; }
                .page_break { page-break-before: always; }
                .img-fluid { width: 100%; }
                .text-teal { color: #008080; }
                .japan { font-size: 10px; color: #555; }
            `}} />

            {/* ── AREA KERTAS A4 ── */}
            <div className="cv-paper cv-font" style={{ backgroundColor: 'white', color: 'black', padding: '10mm', width: '210mm', minHeight: '297mm', margin: '30px auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <center>
                    <div style={{ fontSize: '18px', margin: '0px' }} className="japan">履歴書</div>
                    <div style={{ fontSize: '18px', margin: '0px', fontWeight: 'bold' }}>BIODATA - CV</div>
                </center>

                <table border="1" cellSpacing="0" cellPadding="2" className="table table-condensed table-bordered table-data-diri" style={{ tableLayout: 'fixed', marginTop: '10px' }}>
                    <tbody>
                        <tr>
                            <td className="td-label td-hilangkanan" width="120px">
                                Nama:
                                <div className="japan">氏名</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="4">
                                {student.nama_lengkap}
                                <div className="japan">{student.nama_jepang || '---'}</div>
                            </td>
                            <td className="td-label td-hilangkanan">
                                <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}></div>
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Tanggal Lahir:
                                <div className="japan">生年月日</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="2">
                                {student.tanggal_lahir ? new Date(student.tanggal_lahir).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, ' 年 ').replace('年 ', '年 ').concat(' 日') : '---'}
                            </td>
                            <td className="td-label td-hilangkanan" width="120px">
                                Umur:
                                <div className="japan">年齢</div>
                            </td>
                            <td className="td-value td-hilangkiri">
                                {getAge(student.tanggal_lahir)} Tahun
                                <div className="japan">{getAge(student.tanggal_lahir)} 歳</div>
                            </td>
                            <td rowSpan="3" style={{ width: '2.3cm', padding: '0px', verticalAlign: 'middle', textAlign: 'center' }}>
                                <img className="card-img-top img-fluid" src={supabase.storage.from('registration_photos').getPublicUrl(`${student.id}.jpg`).data.publicUrl} alt="Foto Profil" style={{ maxHeight: '110px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Jenis Kelamin:
                                <div className="japan">性別</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="2">
                                {student.jenis_kelamin === 'L' ? '男性' : student.jenis_kelamin === 'P' ? '女性' : '---'}
                            </td>
                            <td className="td-label td-hilangkanan">
                                Status Pernikahan:
                                <div className="japan">配偶者</div>
                            </td>
                            <td className="td-value td-hilangkiri">
                                {student.status_pernikahan === 'Belum Menikah' ? '未婚' : student.status_pernikahan === 'Menikah' ? '既婚' : '---'}
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Alamat Rumah:
                                <div className="japan">本国の住所地</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="4">
                                {student.alamat || '---'}
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Tempat Lahir:
                                <div className="japan">出生地</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="2">
                                {student.tempat_lahir || '---'}
                            </td>
                            <td className="td-label td-hilangkanan">
                                No Telp:
                                <div className="japan">電話番号</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="2">
                                {student.no_telp || '---'}
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Agama
                                <span className="japan">宗教</span>:
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="5">
                                {student.agama === 'Hindu' ? 'ヒンズー教' : student.agama === 'Islam' ? 'イスラム教' : student.agama === 'Kristen' ? 'キリスト教' : student.agama || '---'}
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan" width="100">
                                Tinggi Badan:
                                <div className="japan">身長</div>
                            </td>
                            <td className="td-value td-hilangkiri" width="150">
                                {student.tinggi_badan || '---'} Cm
                            </td>
                            <td className="td-label td-hilangkanan" width="100">
                                Berat Badan:
                                <div className="japan">体重</div>
                            </td>
                            <td className="td-value td-hilangkiri" width="150">
                                {student.berat_badan || '---'} Kg
                            </td>
                            <td className="td-label td-hilangkanan">
                                Golongan Darah:
                                <div className="japan">血液型</div>
                            </td>
                            <td className="td-value td-hilangkiri" width="200">
                                {student.golongan_darah || '---'}
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Ukuran Sepatu:
                                <div className="japan">靴サイズ</div>
                            </td>
                            <td className="td-value td-hilangkiri">
                                {student.ukuran_sepatu || '---'} Cm
                            </td>
                            <td className="td-label td-hilangkanan">
                                Ukuran Pinggang:
                                <div className="japan">ウエスト</div>
                            </td>
                            <td className="td-value td-hilangkiri">
                                {student.ukuran_pinggang || '---'} Cm
                            </td>
                            <td className="td-label td-hilangkanan">
                                Ukuran Kepala:
                                <div className="japan">頭のサイズ</div>
                            </td>
                            <td className="td-value td-hilangkiri">
                                {student.ukuran_kepala || '---'} Cm
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Merokok:
                                <div className="japan">タバコ</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="2">
                                <table border="0" width="100%" cellPadding="0" style={{border: 'none'}}>
                                    <tbody>
                                        <tr>
                                            <td style={{border:'none', width:'90px'}}>Saat Ini <span className="japan">現在</span></td>
                                            <td style={{border:'none', width:'10px'}}>:</td>
                                            <td style={{border:'none'}}>{student.merokok_sekarang || '吸いません。'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{border:'none'}}>Di Jepang <span className="japan">今後</span></td>
                                            <td style={{border:'none'}}>:</td>
                                            <td style={{border:'none'}}>{student.merokok_jepang || '吸いません。'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td className="td-label td-hilangkanan">
                                Minum Sake:
                                <div className="japan">飲酒</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="2">
                                {student.minum_sake || '全然酒を飲みません'}
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Vision:
                                <div className="japan">視力</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="2">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><span className="japan">右</span> Kanan</span>
                                    <span>{student.mata_kanan || '1.0'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><span className="japan">左</span> Kiri</span>
                                    <span>{student.mata_kiri || '1.0'}</span>
                                </div>
                            </td>
                            <td className="td-label td-hilangkanan">
                                Penggunaan Tangan
                                <span className="japan">利き手</span>:
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="2">
                                {student.tangan_dominan === 'Kanan' ? '右利き' : student.tangan_dominan === 'Kiri' ? '左利き' : '右利き'}
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Hobi:
                                <div className="japan">趣味</div>
                            </td>
                            <td className="td-value td-hilangkiri">
                                {student.hobi || 'ガーデニング'}
                            </td>
                            <td className="td-label td-hilangkanan">
                                Bakat Khusus:
                                <div className="japan">特技</div>
                            </td>
                            <td className="td-value td-hilangkiri">
                                {student.bakat || '調理'}
                            </td>
                            <td className="td-label td-hilangkanan">
                                Buta Warna:
                                <div className="japan">色覚障害</div>
                            </td>
                            <td className="td-value td-hilangkiri">
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <span>
                                        <input type="checkbox" checked={student.buta_warna === 'Ya'} readOnly /> 有
                                    </span>
                                    <span><span className="japan">色:</span></span>
                                    <span>
                                        <input type="checkbox" checked={student.buta_warna !== 'Ya'} readOnly /> 無
                                    </span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label" colSpan="6">
                                Kelebihan & Kekurangan
                                <span className="japan">自己の長所と短所</span>:
                                <div>長所 <b>Kelebihan:</b><br />{student.kelebihan || 'チームワークが得意;向上心がある;自信がある'}</div>
                                <br />
                                <div>短所 <b>Kekurangan:</b><br />{student.kekurangan || '心配しやすい'}</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Tujuan ke Jepang:
                                <div className="japan">日本へ行く目的</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="5">
                                {student.tujuan_jepang || '日本でさまざまな経験を積み、日本語のスキルも向上させながら働きたいです。将来は八百屋を経営し、ココアやバナナの栽培を始めたいと思っています。そのため、日本にいる間はしっかり貯金します。'}
                            </td>
                        </tr>
                        <tr>
                            <td className="td-label td-hilangkanan">
                                Target Menabung:
                                <div className="japan">日本で３年間貯金目標</div>
                            </td>
                            <td className="td-value td-hilangkiri" colSpan="5">
                                {student.target_menabung || 'Rp 250.000.000 (約　2,500,000円)'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ── ARRAY PENDIDIKAN DINAMIS ── */}
                <br />
                <h5 className="font-weight-bold">PENDIDIKAN <span className="text-teal">学歴</span></h5>
                <table border="1" cellSpacing="0" cellPadding="2">
                    <thead>
                        <tr>
                            <th className="text-center" colSpan="2">MASUK SEKOLAH <span className="text-teal">入学</span></th>
                            <th className="text-center" colSpan="2">LULUS SEKOLAH <span className="text-teal">卒業</span></th>
                            <th className="text-center" rowSpan="2">NAMA SEKOLAH <span className="text-teal">学校名</span></th>
                            <th className="text-center" rowSpan="2">JURUSAN <span className="text-teal">学校学科専門</span></th>
                        </tr>
                        <tr>
                            <th className="text-center">THN <span className="text-teal">年</span></th>
                            <th className="text-center">BLN <span className="text-teal">月</span></th>
                            <th className="text-center">THN <span className="text-teal">年</span></th>
                            <th className="text-center">BLN <span className="text-teal">月</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendidikan.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">--- Belum ada data ---</td></tr>
                        ) : (
                            pendidikan.map((p, index) => (
                                <tr key={index}>
                                    <td className="text-center">{p.thn_awal || '-'}</td>
                                    <td className="text-center">{p.bln_awal || '-'}</td>
                                    <td className="text-center">{p.thn_akhir || '-'}</td>
                                    <td className="text-center">{p.bln_akhir || '-'}</td>
                                    <td>{p.nama_sekolah || '-'}</td>
                                    <td className="text-teal text-center">{p.jenjang || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* ── ARRAY PENGALAMAN KERJA DINAMIS ── */}
                <br />
                <h5 className="font-weight-bold">RIWAYAT/PENGALAMAN KERJA <span className="text-teal">職業歴</span></h5>
                <table border="1" cellSpacing="0" cellPadding="2">
                    <thead>
                        <tr>
                            <th className="text-center" colSpan="2">DARI <span className="text-teal">から</span></th>
                            <th className="text-center" colSpan="2">SAMPAI <span className="text-teal">まで</span></th>
                            <th className="text-center" rowSpan="2">NAMA PERUSAHAAN <span className="text-teal">会社名</span></th>
                            <th className="text-center" rowSpan="2">JENIS PEKERJAAN <span className="text-teal">職業内容</span></th>
                        </tr>
                        <tr>
                            <th className="text-center">THN <span className="text-teal">年</span></th>
                            <th className="text-center">BLN <span className="text-teal">月</span></th>
                            <th className="text-center">THN <span className="text-teal">年</span></th>
                            <th className="text-center">BLN <span className="text-teal">月</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {kerja.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">--- Belum ada data ---</td></tr>
                        ) : (
                            kerja.map((k, index) => (
                                <tr key={index}>
                                    <td className="text-center">{k.thn_awal || '-'}</td>
                                    <td className="text-center">{k.bln_awal || '-'}</td>
                                    <td className="text-center">{k.thn_akhir || '-'}</td>
                                    <td className="text-center">{k.bln_akhir || '-'}</td>
                                    <td>{k.nama_perusahaan || '-'}</td>
                                    <td>{k.jenis_pekerjaan || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="page_break"></div>

                {/* ── ARRAY KONTAK KELUARGA DARURAT DINAMIS ── */}
                <h5 className="font-weight-bold">KELUARGA YANG BISA DIHUBUNGI <span className="text-teal">連絡する家族</span></h5>
                <table border="1" cellSpacing="0" cellPadding="2" style={{marginBottom: '20px'}}>
                    <tbody>
                        {kelDarurat.length === 0 ? (
                            <tr><td className="text-center" colSpan="3">Belum ada kontak darurat terdaftar</td></tr>
                        ) : (
                            kelDarurat.map((k, index) => (
                                <React.Fragment key={index}>
                                    <tr>
                                        <td className="td-hilangkanan" width="200">Nama <span className="text-teal">本国の連絡先名</span></td>
                                        <td className="td-titikdua" width="10">:</td>
                                        <td className="td-hilangkiri" style={{fontWeight: 600}}>{k.nama || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">Alamat <span className="text-teal">本国の連絡先地</span></td>
                                        <td className="td-titikdua">:</td>
                                        <td className="td-hilangkiri">{k.alamat || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">No. HP <span className="text-teal">電話番号</span></td>
                                        <td className="td-titikdua">:</td>
                                        <td className="td-hilangkiri">{k.no_hp || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">Penghasilan Keluarga <span className="text-teal">家族の1ヶ月の収入</span></td>
                                        <td className="td-titikdua">:</td>
                                        <td className="td-hilangkiri">Rp {k.pendapatan || '0'}</td>
                                    </tr>
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>

                {/* ── ARRAY KELUARGA INDONESIA DINAMIS ── */}
                <h5 className="font-weight-bold mt-3">KELUARGA DI INDONESIA <span className="text-teal">インドネシアでの家族</span></h5>
                <table border="1" cellSpacing="0" cellPadding="2" style={{marginBottom: '20px'}}>
                    <thead>
                        <tr>
                            <th className="text-center">NAMA <span className="text-teal">氏名</span></th>
                            <th className="text-center">UMUR / NO HP <span className="text-teal">年齢</span></th>
                            <th className="text-center">HUBUNGAN <span className="text-teal">続柄</span></th>
                            <th className="text-center">PEKERJAAN / PENGHASILAN <span className="text-teal">職業</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {kelIndo.length === 0 ? (
                            <tr><td colSpan="4" className="text-center">--- Belum ada data ---</td></tr>
                        ) : (
                            kelIndo.map((k, idx) => (
                                <tr key={idx}>
                                    <td className="text-center">{k.nama || '-'}</td>
                                    <td className="text-center">{k.no_hp || '-'}</td>
                                    <td className="text-center">{k.hubungan || '-'}</td>
                                    <td className="text-center">{k.pendapatan ? `Rp ${k.pendapatan}` : '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* ── ARRAY KELUARGA JEPANG DINAMIS ── */}
                <h5 className="font-weight-bold mt-3">KELUARGA/SAUDARA/TEMAN DI JEPANG JIKA ADA <span className="text-teal">在日家族・友達</span></h5>
                <table border="1" cellSpacing="0" cellPadding="2" style={{marginBottom: '20px'}}>
                    <thead>
                        <tr>
                            <th className="text-center">NAMA <span className="text-teal">氏名</span></th>
                            <th className="text-center">UMUR / NO HP <span className="text-teal">年齢</span></th>
                            <th className="text-center">HUBUNGAN <span className="text-teal">続柄</span></th>
                            <th className="text-center">PEKERJAAN / ALAMAT <span className="text-teal">職業</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {kelJepang.length === 0 ? (
                            <tr><td colSpan="4" className="text-center">--- Belum ada data ---</td></tr>
                        ) : (
                            kelJepang.map((k, idx) => (
                                <tr key={idx}>
                                    <td className="text-center">{k.nama || '-'}</td>
                                    <td className="text-center">{k.no_hp || '-'}</td>
                                    <td className="text-center">{k.hubungan || '-'}</td>
                                    <td className="text-center">{k.alamat || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* ── ARRAY ATTACHMENT DINAMIS ── */}
                <h5 className="font-weight-bold mt-3">ATTACHMENT <span className="text-teal">添付ファイル</span></h5>
                <table border="1" cellSpacing="0" cellPadding="2">
                    <thead>
                        <tr>
                            <th className="text-center">NAMA <span className="text-teal">ファイルネーム</span></th>
                            <th className="text-center">FILE <span className="text-teal">ファイル</span></th>
                            <th className="text-center">CATATAN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lampiran.length === 0 ? (
                            <tr><td colSpan="3" className="text-center">--- Belum ada lampiran ---</td></tr>
                        ) : (
                            lampiran.map((l, idx) => (
                                <tr key={idx}>
                                    <td className="text-center">{l.name || '-'}</td>
                                    <td className="text-center">
                                        {l.url ? <a href={l.url} target="_blank" rel="noreferrer" style={{color: '#3b82f6', textDecoration: 'none'}}>📥 Lihat Dokumen</a> : '-'}
                                    </td>
                                    <td className="text-center">{l.notes || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

            </div>
        </div>
    );
}