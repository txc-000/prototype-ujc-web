import React from 'react';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintShoushiki1_13() {
    return (
        <div style={{ backgroundColor: '#cbd5e1', minHeight: '100vh', paddingBottom: '40px', fontFamily: '"MS Mincho", "Times New Roman", serif' }}>
            <div className="no-print" style={{ background: '#0f172a', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', color: 'white', position: 'sticky', top: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => window.close()} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DOKUMEN OTIT</div><div style={{ fontWeight: 700 }}>Shoushiki 1-13 (Profil LPK)</div></div>
                </div>
                <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px' }}><Printer size={18} /> Print</button>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print { @page { size: A4; margin: 20mm; } body { background: white !important; } .no-print { display: none !important; } .a4-paper { margin: 0 !important; box-shadow: none !important; } }
                .a4-paper { background: white; width: 210mm; min-height: 297mm; margin: 30px auto; padding: 20mm; box-sizing: border-box; color: black; line-height: 1.5; }
                table.info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                table.info-table th, table.info-table td { border: 1px solid black; padding: 8px; font-size: 10pt; }
            `}} />

            <div className="a4-paper">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt' }}>
                    <span>参考様式第1-13号(規則第8条第12号関係)</span>
                    <span>(日本工業規格A列4)</span>
                </div>
                
                <h2 style={{ textAlign: 'center', fontSize: '16pt', margin: '20px 0' }}>外国の準備機関の概要書及び誓約書</h2>

                <table className="info-table">
                    <tbody>
                        <tr><td width="25%">① 機関名</td><td>LPK. UNIVERSAL JAPAN COURSE</td></tr>
                        <tr><td>② 代表者の氏名</td><td>ARIS SUTIKNO</td></tr>
                        <tr>
                            <td>③ 所在地</td>
                            <td>
                                JL. KLIPANG RAYA, KPA GOLF VIEW BLOK D 5, SENDANGMULYO, TEMBALANG, SEMARANG, JAWA TENGAH 50272 - INDONESIA<br/>
                                (電話: +62-24-7674-0536) <br/> (E-mail: ujcgakkou33@gmail.com)
                            </td>
                        </tr>
                        <tr><td>④ 設立年月日</td><td>2005年 8月 28日</td></tr>
                        <tr><td>⑤ 技能実習生との関係</td><td>入国前講習の事実に関与する者 その他</td></tr>
                        <tr><td>⑥ 業種、主要製品<br/>及び主要業務</td><td>☑ 海外への労働者派遣業</td></tr>
                        <tr><td>⑦ 資本金</td><td>300.000.000 Rp (約 2.850.000円)</td></tr>
                        <tr><td>⑧ 売上げ(直近年度)</td><td>690.000.000 Rp (約 6.555.000円)</td></tr>
                        <tr><td>⑨ 労働職員数</td><td>22 人</td></tr>
                    </tbody>
                </table>

                <p style={{ fontSize: '10pt', marginTop: '15px' }}>(注意) ⑦及び⑧は、現地通貨又は米ドルで記載し、括弧書きで日本円に換算した金額を記載すること。</p>

                <p style={{ fontSize: '11pt', marginTop: '20px', textAlign: 'justify' }}>
                    上記の記載内容は、事実と相違ありません。また、技能実習の準備に関し、技能実習に関する法令に違反することは、決していたしません。
                </p>

                <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '11pt' }}>
                    <div style={{ marginBottom: '15px', width: '300px' }}>______年 ______月 ______日</div>
                    <div style={{ width: '300px', marginBottom: '5px' }}>外国の準備機関の名称</div>
                    <div style={{ width: '300px', fontWeight: 'bold', marginBottom: '20px' }}>LPK. UNIVERSAL JAPAN COURSE</div>
                    <div style={{ width: '300px' }}>作成責任者 役職・氏名</div>
                    <div style={{ width: '300px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>ARIS SUTIKNO</span> <span>印</span>
                    </div>
                </div>
            </div>
        </div>
    );
}