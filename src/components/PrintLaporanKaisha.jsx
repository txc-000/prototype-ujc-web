import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoUJC from '../assets/logo.png'; 
import { Printer, ArrowLeft, CheckSquare, Square } from 'lucide-react';

const brandNavy = '#101869';

export default function PrintLaporanKaisha() {
    const { id } = useParams();
    const [jobData, setJobData] = useState(null);
    const [allCandidates, setAllCandidates] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: job, error: jobErr } = await supabase.from('job_orders').select('*').eq('id', id).single();
                if (jobErr) throw jobErr;
                setJobData(job);

                const { data: students, error: stdErr } = await supabase
                    .from('students')
                    .select('*')
                    .eq('perusahaan_tujuan', job.perusahaan)
                    .order('nama_lengkap', { ascending: true });
                
                if (stdErr) throw stdErr;
                if (students) {
                    setAllCandidates(students);
                    setSelectedIds(students.map(s => s.id));
                }
            } catch (err) {
                console.error("Gagal memuat data cetak:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const getAge = (dob) => {
        if (!dob) return '-';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    const safeParse = (data) => {
        if (!data) return [];
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return []; }
        }
        return Array.isArray(data) ? data : [];
    };

    const toggleSelection = (studentId) => {
        setSelectedIds(prev => 
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}>Memuat Dokumen Laporan...</div>;
    if (!jobData) return <div style={{ padding: '50px', textAlign: 'center' }}>Data Job Order tidak ditemukan.</div>;

    const candidatesToPrint = allCandidates.filter(c => selectedIds.includes(c.id));

    return (
        <div style={{ backgroundColor: '#cbd5e1', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            
            {/* ── PANEL PENGATURAN (NO-PRINT) ── */}
            <div className="no-print" style={{ background: '#0f172a', padding: '15px 30px', color: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '210mm', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => window.close()} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800 }}>REPORT BUNDLING</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{jobData.perusahaan}</div>
                        </div>
                    </div>
                    <button onClick={() => window.print()} disabled={candidatesToPrint.length === 0} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Printer size={18} /> Cetak {candidatesToPrint.length} Dokumen
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; margin: 0; background-color: white !important; }
                    .no-print { display: none !important; }
                    .cv-paper { margin: 0 !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; border: none !important; }
                    .page_break { page-break-after: always; border: none !important; }
                }
                
                .print-container { width: 210mm; margin: 30px auto; background: transparent; }
                .cv-paper { background-color: white; color: black; padding: 10mm; width: 210mm; min-height: 297mm; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); box-sizing: border-box; }
                
                table { border-color: #0072BC; width: 100%; border-collapse: collapse; }
                table tr td, table tr th { word-wrap: break-word; font-size: 12px; border: 1px solid #0072BC; padding: 4px; vertical-align: top; }
                .td-hilangkanan { border-right: none; }
                .td-hilangkiri { border-left: none; }
                .text-center { text-align: center; }
                .japan { font-size: 10px; color: #555; font-family: 'MS Mincho', 'Hiragino Mincho Pro', serif; }
                .text-teal { color: #008080; }
                h5 { font-size: 1.1rem; margin-bottom: 5px; margin-top: 15px; font-weight: bold; }
                
                .cover-page { display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; height: 260mm; font-family: 'MS Mincho', serif; }
                .cover-logo { width: 420px; margin: 60px 0; }
                .cover-top-title { font-size: 24px; margin-bottom: 10px; }
                .cover-main-title { font-size: 28pt; font-weight: bold; margin-bottom: 50px; text-decoration: none; }
                .cover-kaisha { font-size: 24pt; font-weight: bold; margin: 15px 0; }
                .cover-kumiai { font-size: 20pt; font-weight: bold; margin-bottom: 60px; }
            `}} />

            <div className="print-container">
                
                {/* ── HALAMAN 1: COVER (SUDAH DIUBAH KE BAHASA JEPANG) ── */}
                <div className="cv-paper page_break">
                    <div className="cover-page">
                        <div className="cover-top-title japan">面接会</div>
                        <h1 className="cover-main-title">候補者リスト及び履歴書</h1>
                        
                        <div className="cover-kaisha">{jobData.perusahaan} 様</div>
                        <div className="cover-kumiai">{jobData.kumiai || '協同組合'} 様</div>
                        
                        <img src={logoUJC} alt="UJC Logo" className="cover-logo" />
                        
                        <div style={{marginTop: 'auto', width: '100%'}}>
                            <h3 style={{fontSize: '18pt', fontWeight: 'bold'}}>職種: {jobData.bidang}</h3>
                            <h3 style={{fontSize: '16pt', fontWeight: 'bold', margin: '10px 0'}}>作業: {jobData.catatan || '-'}</h3>
                            <h2 style={{fontSize: '20pt', fontWeight: '900', marginTop: '40px', fontFamily: 'serif'}}>LPK UNIVERSAL JAPAN COURSE</h2>
                        </div>
                    </div>
                </div>

                {/* ── HALAMAN 2: DAFTAR KANDIDAT ── */}
                <div className="cv-paper page_break">
                    <center>
                        <div className="japan" style={{fontSize: '16px'}}>候補者リスト</div>
                        <h2 style={{margin: '5px 0 30px 0'}}>DAFTAR KANDIDAT</h2>
                    </center>
                    <table border="1">
                        <thead style={{background: '#f0f7ff'}}>
                            <tr>
                                <th width="40">No</th>
                                <th>Nama Siswa <br/><small className="japan">氏名</small></th>
                                <th width="150">Tanggal Lahir <br/><small className="japan">生年月日</small></th>
                                <th>Domisili <br/><small className="japan">住所</small></th>
                                <th width="50">Umur <br/><small className="japan">年齢</small></th>
                                <th width="80">Photo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidatesToPrint.map((s, idx) => (
                                <tr key={s.id}>
                                    <td className="text-center">{idx + 1}</td>
                                    <td><b>{s.nama_lengkap}</b><div className="japan">{s.nama_jepang || '-'}</div></td>
                                    <td className="text-center">{s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, ' 年 ').concat(' 日') : '-'}</td>
                                    <td>{s.tempat_lahir}</td>
                                    <td className="text-center">{getAge(s.tanggal_lahir)}</td>
                                    <td className="text-center">
                                        <img src={supabase.storage.from('registration_photos').getPublicUrl(`${s.id}.jpg`).data.publicUrl} style={{width: '55px', height: '70px', objectFit: 'cover'}} alt="foto" onError={(e) => e.target.style.display='none'}/>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── HALAMAN 3+: LOOPING CV (IDENTIK DENGAN PRINT RIREKISHO) ── */}
                {candidatesToPrint.map((student, index) => {
                    const pendidikan = safeParse(student.pendidikan_history);
                    const kerja = safeParse(student.kerja_history);
                    const keluarga = safeParse(student.keluarga_history);
                    const kelIndo = keluarga.filter(k => k.lokasi === 'INDONESIA' || !k.lokasi);
                    const kelJepang = keluarga.filter(k => k.lokasi === 'JEPANG');

                    return (
                        <div key={student.id} className="cv-paper page_break">
                            <center>
                                <div style={{ fontSize: '18px' }} className="japan">履歴書 (No. {index + 1})</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>BIODATA - CV</div>
                            </center>

                            <table style={{ tableLayout: 'fixed', marginTop: '10px' }}>
                                <tbody>
                                    <tr>
                                        <td className="td-hilangkanan" width="120px">Nama:<div className="japan">氏名</div></td>
                                        <td className="td-hilangkiri" colSpan="4">
                                            <b style={{fontSize: '14px'}}>{student.nama_lengkap}</b>
                                            <div className="japan">{student.nama_jepang || '---'}</div>
                                        </td>
                                        <td rowSpan="3" style={{ width: '2.3cm', padding: '0px', verticalAlign: 'middle', textAlign: 'center' }}>
                                            <img src={supabase.storage.from('registration_photos').getPublicUrl(`${student.id}.jpg`).data.publicUrl} alt="Foto" style={{ maxHeight: '110px', objectFit: 'cover' }} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">Tanggal Lahir:<div className="japan">生年月日</div></td>
                                        <td className="td-hilangkiri" colSpan="2">{student.tanggal_lahir ? new Date(student.tanggal_lahir).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, ' 年 ').concat(' 日') : '---'}</td>
                                        <td className="td-hilangkanan" width="100px">Umur:<div className="japan">年齢</div></td>
                                        <td className="td-hilangkiri">{getAge(student.tanggal_lahir)} 歳</td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">Jenis Kelamin:<div className="japan">性別</div></td>
                                        <td className="td-hilangkiri" colSpan="2">{student.jenis_kelamin === 'L' ? '男性' : '女性'}</td>
                                        <td className="td-hilangkanan">Status Pernikahan:<div className="japan">配偶者</div></td>
                                        <td className="td-hilangkiri">{student.status_pernikahan || '未婚'}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">Alamat Rumah:<div className="japan">本国の住所地</div></td>
                                        <td className="td-hilangkiri" colSpan="5">{student.alamat || '---'}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">Tinggi Badan:<div className="japan">身長</div></td>
                                        <td className="td-hilangkiri">{student.tinggi_badan || '---'} Cm</td>
                                        <td className="td-hilangkanan">Berat Badan:<div className="japan">体重</div></td>
                                        <td className="td-hilangkiri">{student.berat_badan || '---'} Kg</td>
                                        <td className="td-hilangkanan">Darah:<div className="japan">血液型</div></td>
                                        <td className="td-hilangkiri">{student.golongan_darah || '---'}</td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">Ukuran Sepatu:<div className="japan">靴サイズ</div></td>
                                        <td className="td-hilangkiri">{student.ukuran_sepatu || '---'} Cm</td>
                                        <td className="td-hilangkanan">Lingkar Perut:<div className="japan">ウエスト</div></td>
                                        <td className="td-hilangkiri">{student.ukuran_pinggang || '---'} Cm</td>
                                        <td className="td-hilangkanan">Ukuran Kepala:<div className="japan">頭のサイズ</div></td>
                                        <td className="td-hilangkiri">{student.ukuran_kepala || '---'} Cm</td>
                                    </tr>
                                    <tr>
                                        <td className="td-hilangkanan">Merokok:<div className="japan">タバコ</div></td>
                                        <td className="td-hilangkiri" colSpan="2">Sekarang: {student.merokok_sekarang} / Nanti: {student.merokok_jepang}</td>
                                        <td className="td-hilangkanan">Minum Sake:<div className="japan">飲酒</div></td>
                                        <td className="td-hilangkiri" colSpan="2">{student.minum_sake}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="6" style={{padding: '8px'}}>
                                            <div className="japan">自己の長所と短所 (Kelebihan & Kekurangan):</div>
                                            <b>Kelebihan:</b> {student.kelebihan} <br/>
                                            <b>Kekurangan:</b> {student.kekurangan}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="6" style={{padding: '8px'}}>
                                            <div className="japan">日本へ行く目的 (Tujuan ke Jepang):</div>
                                            <div style={{fontSize: '11px', lineHeight: '1.4'}}>{student.tujuan_jepang}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <h5>PENDIDIKAN <span className="text-teal">学歴</span></h5>
                            <table border="1">
                                <thead style={{background: '#f8fafc'}}>
                                    <tr>
                                        <th colSpan="2">Masuk <span className="japan">入学</span></th>
                                        <th colSpan="2">Lulus <span className="japan">卒業</span></th>
                                        <th>Nama Sekolah <span className="japan">学校名</span></th>
                                        <th>Jurusan <span className="japan">専門</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendidikan.map((p, i) => (
                                        <tr key={i}>
                                            <td className="text-center">{p.thn_awal}</td><td className="text-center">{p.bln_awal}</td>
                                            <td className="text-center">{p.thn_akhir}</td><td className="text-center">{p.bln_akhir}</td>
                                            <td>{p.nama_sekolah}</td><td className="text-center">{p.jurusan}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h5>RIWAYAT KERJA <span className="text-teal">職業歴</span></h5>
                            <table border="1">
                                <tbody>
                                    {kerja.length === 0 ? <tr><td colSpan="5" className="text-center">---</td></tr> : kerja.map((k, idx) => (
                                        <tr key={idx}>
                                            <td className="text-center" width="50">{k.thn_awal}</td><td className="text-center" width="30">{k.bln_awal}</td>
                                            <td className="text-center" width="50">{k.thn_akhir}</td><td className="text-center" width="30">{k.bln_akhir}</td>
                                            <td>{k.nama_perusahaan} ({k.jenis_pekerjaan})</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h5>KELUARGA DI INDONESIA <span className="text-teal">インドネシアでの家族</span></h5>
                            <table border="1">
                                <thead>
                                    <tr><th>Nama</th><th>Hubungan</th><th>Umur</th><th>Pekerjaan</th></tr>
                                </thead>
                                <tbody>
                                    {kelIndo.map((k, idx) => (
                                        <tr key={idx}>
                                            <td>{k.nama}</td><td className="text-center">{k.hubungan}</td>
                                            <td className="text-center">{k.umur}</td><td>{k.pendapatan}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}