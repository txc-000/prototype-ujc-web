import React from 'react';

export default function SummaryTable({ summary }) {
    const totalMagang = summary.rincian.reduce((sum, item) => sum + (item.MAGANG || 0), 0);
    const total3Go = summary.rincian.reduce((sum, item) => sum + (item['3 GO'] || 0), 0);
    const totalTg = summary.rincian.reduce((sum, item) => sum + (item.TG || 0), 0);
    const totalEngineer = summary.rincian.reduce((sum, item) => sum + (item.ENGINEER || 0), 0);

    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#1e3a8a', color: 'white', padding: '10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>RINGKASAN KEBERANGKATAN PER BULAN</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                <thead style={{ background: '#1e3a8a', color: 'white' }}>
                    <tr>
                        <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>BULAN</th>
                        <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>MAGANG</th>
                        <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>3 GO</th>
                        <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>TG</th>
                        <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>ENGINEER</th>
                        <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>JUMLAH SISWA</th>
                    </tr>
                </thead>
                <tbody>
                    {summary.rincian.map((row, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                            <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{row.BULAN}</td>
                            <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{row.MAGANG || '-'}</td>
                            <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{row['3 GO'] || '-'}</td>
                            <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{row.TG || '-'}</td>
                            <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{row.ENGINEER || '-'}</td>
                            <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{row['JUMLAH SISWA'] || '-'}</td>
                        </tr>
                    ))}
                    <tr style={{ background: '#1e3a8a', color: 'white', fontWeight: 'bold' }}>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>TOTAL</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{totalMagang}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{total3Go}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{totalTg}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{totalEngineer}</td>
                        <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{summary.totalBerangkat}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}