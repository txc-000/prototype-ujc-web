import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintShoushiki1_10() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            const { data } = await supabase.from('students').select('*').eq('id', id).single();
            if (data) setStudent(data);
        };
        fetchStudent();
    }, [id]);

    if (!student) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Memuat Dokumen 1-10...</div>;

    const otitData = typeof student.data_otit === 'string' ? JSON.parse(student.data_otit || '{}') : (student.data_otit || {});

    return (
        <div style={{ backgroundColor: '#cbd5e1', minHeight: '100vh', paddingBottom: '40px', fontFamily: '"MS Mincho", "Times New Roman", serif' }}>
            <div className="no-print" style={{ background: '#0f172a', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', color: 'white', position: 'sticky', top: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => window.close()} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DOKUMEN OTIT</div><div style={{ fontWeight: 700 }}>Shoushiki 1-10 (Ikrar LPK)</div></div>
                </div>
                <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px' }}><Printer size={18} /> Print</button>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print { @page { size: A4; margin: 20mm; } body { background: white !important; } .no-print { display: none !important; } .a4-paper { margin: 0 !important; box-shadow: none !important; } }
                .a4-paper { background: white; width: 210mm; min-height: 297mm; margin: 30px auto; padding: 20mm; box-sizing: border-box; color: black; line-height: 1.6; }
                table.otit-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                table.otit-table th, table.otit-table td { border: 1px solid black; padding: 10px; font-size: 11pt; }
            `}} />

            <div className="a4-paper">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt' }}>
                    <span>参考様式第1-10号(規則第8条第8号関係)</span>
                    <span>(日本工業規格A列4)</span>
                </div>
                
                <h2 style={{ textAlign: 'center', fontSize: '16pt', marginTop: '30px', marginBottom: '20px' }}>技能実習計画の認定に関する取次送出機関の誓約書</h2>
                
                <p style={{ fontSize: '11pt' }}>次の申請者の次の技能実習生に係る団体監理型技能実習を取り次ぐに当たり、下記の事項を誓約します。</p>

                <table className="otit-table">
                    <tbody>
                        <tr>
                            <td width="35%">申請者(実習実施者)<br/>の氏名又は名称</td>
                            <td>{otitData.perusahaan_penerima || '_______________________'}</td>
                        </tr>
                        <tr>
                            <td>監理団体の名称</td>
                            <td>{otitData.nama_kumiai || '_______________________'}</td>
                        </tr>
                        <tr>
                            <td>技能実習生の氏名<br/>(国籍)</td>
                            <td>{student.nama_lengkap} <br/> (インドネシア)</td>
                        </tr>
                    </tbody>
                </table>

                <h3 style={{ textAlign: 'center', marginTop: '30px' }}>記</h3>
                <h4 style={{ margin: '10px 0' }}>【誓約事項】</h4>
                
                <ol style={{ paddingLeft: '20px', fontSize: '11pt', textAlign: 'justify' }}>
                    <li style={{marginBottom: '10px'}}>保証金の徴収その他名目のいかんを問わず、団体監理型技能実習生又はその親族その他の関係者の財産を管理することは、決していたしません。</li>
                    <li style={{marginBottom: '10px'}}>団体監理型技能実習生が技能実習に係る契約を履行しなかった場合について、団体監理型技能実習生、団体監理型実習実施者、監理団体又は外国の準備機関との間で、違約金等の制裁を定めることは、決していたしません。</li>
                    <li style={{marginBottom: '10px'}}>団体監理型技能実習生等が団体監理型技能実習の申込みの取次ぎ又は外国における団体監理型技能実習の準備に関して当機関に支払う費用について、団体監理型技能実習生等にその額及び内訳を十分に理解させた上で合意しています。</li>
                    <li style={{marginBottom: '10px'}}>上記のほか、技能実習に関する法令に違反することは、決していたしません。</li>
                </ol>

                <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '12pt' }}>
                    <div style={{ marginBottom: '20px', width: '300px' }}>
                        ______年 ______月 ______日
                    </div>
                    <div style={{ width: '300px', marginBottom: '10px' }}>
                        作成責任者 役職・氏名
                    </div>
                    <div style={{ width: '300px', fontWeight: 'bold' }}>
                        LPK UNIVERSAL JAPAN COURSE<br/>
                        ARIS SUTIKNO
                    </div>
                </div>
            </div>
        </div>
    );
}