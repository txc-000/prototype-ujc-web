import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintShoushiki1_20() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            const { data } = await supabase.from('students').select('*').eq('id', id).single();
            if (data) setStudent(data);
        };
        fetchStudent();
    }, [id]);

    if (!student) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Memuat Dokumen 1-20...</div>;

    const bidangKerja = student.minat_bidang || '(                                )';

    return (
        <div style={{ backgroundColor: '#cbd5e1', minHeight: '100vh', paddingBottom: '40px', fontFamily: '"MS Mincho", "Times New Roman", serif' }}>
            <div className="no-print" style={{ background: '#0f172a', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', color: 'white', position: 'sticky', top: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => window.close()} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DOKUMEN OTIT</div><div style={{ fontWeight: 700 }}>Shoushiki 1-20 (Pernyataan Siswa)</div></div>
                </div>
                <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px' }}><Printer size={18} /> Print</button>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print { @page { size: A4; margin: 20mm; } body { background: white !important; } .no-print { display: none !important; } .a4-paper { margin: 0 !important; box-shadow: none !important; border: none !important; } .page-break { page-break-before: always; } }
                .a4-paper { background: white; width: 210mm; min-height: 297mm; margin: 30px auto; padding: 20mm; box-sizing: border-box; color: black; line-height: 1.4; border: 1px solid #cbd5e1; }
                .jp-text { font-size: 11pt; font-weight: bold; margin-bottom: 4px; margin-top: 15px; }
                .id-text { font-size: 10pt; font-family: "Arial", sans-serif; margin-bottom: 15px; color: #333; text-align: justify; }
            `}} />

            <div className="a4-paper">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt' }}>
                    <span>参考様式第1-20号(規則第8条第18号関係) インドネシア語</span>
                    <span>(日本工業規格A列4)</span>
                </div>
                
                <h2 style={{ textAlign: 'center', fontSize: '16pt', marginTop: '20px', marginBottom: '5px' }}>技能実習生の申告書</h2>
                <h3 style={{ textAlign: 'center', fontSize: '12pt', fontFamily: 'Arial, sans-serif', marginTop: 0, marginBottom: '20px' }}>Surat Pernyataan Peserta Pemagangan</h3>
                
                <div className="jp-text">下記の事項を申告します。</div>
                <div className="id-text" style={{marginBottom: '20px'}}>Menyatakan hal-hal dibawah ini.</div>
                
                <h3 style={{ textAlign: 'center', fontSize: '14pt', margin: '15px 0' }}>記</h3>
                
                <div className="jp-text">本国における技能実習制度の趣旨が、開発途上地域等への技能等の移動による国際協力の推進であることを承知しています。</div>
                <div className="id-text">Saya memahami bahwa tujuan dari program pemagangan di negara Jepang adalah untuk mendorong dan menjalankan kerjasama internasional dengan memindahkan keterampilan ke negara - negara berkembang.</div>

                <div className="jp-text">私の国である インドネシア では修得等が困難である <u>{bidangKerja}</u> に係る技能等について修得等をし、技能実習の修了後に帰国した際には、帰国後復職することにより、本国への技能等の移動に努めたいと考えています。</div>
                <div className="id-text">Saya ingin memperoleh keterampilan yang berhubungan dengan <u>{bidangKerja}</u> yang mana di negara saya INDONESIA sulit untuk memperolehnya dan saat pulang ke negara asal setelah selesai pemagangan, saya akan mengupayakan untuk memindahkan keterampilan yang telah diperoleh ke negara saya setelah kembali bekerja.</div>

                <div className="jp-text">日本国で技能実習を行うに当たり、私や私と関係のある人が、誰かに保証金を預ける契約を結んでいません。また、今後結ぶ予定もありません。</div>
                <div className="id-text">Saat melakukan pemagangan di Jepang, saya dan orang yang memiliki hubungan dengan saya tidak menjalin kontrak dengan memberikan uang jaminan kepada seseorang. Selanjutnyapun saya tidak ada rencana untuk menjalin kontrak seperti itu.</div>

                <div className="jp-text">日本国で技能実習を行うに当たり、私や私と関係のある人が、誰かに金銭などの財産を管理されることとはなっていません。また、今後管理される予定もありません。</div>
                <div className="id-text">Saat melakukan pemagangan di Jepang, saya dan orang yang memiliki hubungan dengan saya tidak menyerahkan pengelolaan aset seperti uang dsb kepada seseorang. Selanjutnyapun saya tidak ada rencana untuk menyerahkan pengelolaan aset seperti itu.</div>

                <div className="jp-text">日本国で技能実習を行うに当たり、私や私と関係のある人が、誰かと、所定の技能実習を計画とおり修了しなかったなど技能実習に係る契約の不履行があった場合に違約金を支払う契約を結んでいません。また、今後結ぶ予定もありません。</div>
                <div className="id-text">Saat melakukan pemagangan di Jepang, saya dan orang yang memiliki hubungan dengan saya tidak menjalin kontrak kewajiban membayar uang denda kepada seseorang jika kontrak yang berhubungan dengan pemagangan tidak terlaksana seperti tidak selesai sesuai dengan perjanjian pemagangan yang telah ditentukan, selanjutnyapun saya tidak ada rencana untuk menjalin kontrak seperti itu.</div>

                <div className="jp-text" style={{marginTop: '30px'}}>上記の記載内容は、事実と相違ありません。</div>
                <div className="id-text">Isi pernyataan diatas sesuai dengan fakta dan tidak ada perbedaan dengan faktanya.</div>

                <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '12pt' }}>
                    <div style={{ marginBottom: '30px', width: '250px' }}>
                        ______年 ______月 ______日
                    </div>
                    <div style={{ width: '250px', marginBottom: '5px' }}>
                        技能実習生の署名 <br/>
                        <span style={{fontSize: '10pt', fontFamily: 'Arial, sans-serif'}}>Tanda tangan Peserta</span>
                    </div>
                    <div style={{ width: '250px', fontWeight: 'bold', fontSize: '14pt', borderBottom: '1px solid black', paddingBottom: '5px', marginTop: '30px' }}>
                        {student.nama_lengkap}
                    </div>
                </div>
            </div>
        </div>
    );
}