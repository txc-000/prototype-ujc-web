import React from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function TabBukuKas({ totalMasuk, totalKeluar, saldoAkhir, transactions }) {
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{fontSize: '0.8rem', fontWeight: 800, color: '#64748b'}}>TOTAL MASUK & MENGGANTUNG</div>
                    <div style={{fontSize: '1.8rem', fontWeight: 900, color: '#10b981'}}>Rp {totalMasuk.toLocaleString()}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{fontSize: '0.8rem', fontWeight: 800, color: '#64748b'}}>TOTAL UANG KELUAR</div>
                    <div style={{fontSize: '1.8rem', fontWeight: 900, color: '#ef4444'}}>Rp {totalKeluar.toLocaleString()}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: `5px solid ${brandNavy}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{fontSize: '0.8rem', fontWeight: 800, color: '#64748b'}}>SALDO KAS SAAT INI</div>
                    <div style={{fontSize: '1.8rem', fontWeight: 900, color: brandNavy}}>Rp {saldoAkhir.toLocaleString()}</div>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.tableS}>
                    <thead style={styles.theadS}>
                        <tr><th style={styles.thStyle}>Tgl & Tipe</th><th style={styles.thStyle}>Kategori & Keterangan</th><th style={{...styles.thStyle, textAlign: 'right'}}>Nominal</th></tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id} style={styles.trS}>
                                <td style={styles.tdStyle}>
                                    <div style={{fontWeight:800}}>{new Date(t.tanggal).toLocaleDateString('id-ID')}</div>
                                    <div style={{ fontSize:'0.75rem', fontWeight:800, color: t.tipe==='KELUAR' ? '#ef4444' : t.tipe==='DANA_MENGGANTUNG' ? '#eab308' : '#10b981', display:'flex', alignItems:'center', gap:'4px', marginTop: '2px' }}>
                                        {t.tipe==='MASUK' ? <ArrowDownCircle size={14}/> : <ArrowUpCircle size={14}/>} {t.tipe.replace('_', ' ')}
                                    </div>
                                </td>
                                <td style={styles.tdStyle}>
                                    <div style={{fontWeight:800, color: '#1e293b'}}>{t.kategori}</div>
                                    <div style={{fontSize:'0.8rem', color:'#64748b', fontWeight: 600}}>{t.keterangan}</div>
                                </td>
                                <td style={{...styles.tdStyle, textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: t.tipe==='KELUAR' ? '#ef4444' : t.tipe==='DANA_MENGGANTUNG' ? '#eab308' : '#10b981'}}>
                                    {t.tipe==='KELUAR' ? '-' : '+'} {Number(t.nominal).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:'40px', color:'#94a3b8', fontWeight:700}}>Riwayat kas kosong.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}