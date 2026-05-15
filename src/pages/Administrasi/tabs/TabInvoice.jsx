import React from 'react';
import { SearchIcon, Printer } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function TabInvoice({ invoices, searchTerm, updateInvoiceStatus, setViewInvoice }) {
    return (
        <div style={styles.tableContainer}>
            <table style={styles.tableS}>
                <thead style={styles.theadS}>
                    <tr><th style={styles.thStyle}>No. Invoice & Tanggal</th><th style={styles.thStyle}>Kumiai / Termin</th><th style={styles.thStyle}>Periode Tagihan</th><th style={styles.thStyle}>Total (Yen)</th><th style={{...styles.thStyle, textAlign: 'center'}}>Status & Opsi Cetak</th></tr>
                </thead>
                <tbody>
                    {invoices.filter(i => i.kumiai_name.toLowerCase().includes(searchTerm.toLowerCase())).map(inv => (
                        <tr key={inv.id} style={styles.trS}>
                            <td style={styles.tdStyle}><div style={{fontWeight:900, color: brandNavy}}>{inv.invoice_no}</div><div style={{fontSize:'0.75rem', color:'#64748b', fontWeight: 600}}>{new Date(inv.created_at).toLocaleDateString('id-ID')}</div></td>
                            <td style={styles.tdStyle}><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{inv.kumiai_name}</div><div style={{fontSize:'0.75rem', color:'#8b5cf6', fontWeight:700}}>{inv.opsi_pembayaran?.replace(/_/g, ' ')}</div></td>
                            <td style={styles.tdStyle}><div style={{ fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>{inv.billing_period}</div></td>
                            <td style={styles.tdStyle}><div style={{ fontWeight: 900, color: '#ec4899', fontSize: '1.2rem' }}>¥ {Number(inv.total_amount).toLocaleString()}</div></td>
                            <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {inv.status === 'UNPAID' && <button onClick={() => updateInvoiceStatus(inv)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Set Lunas</button>}
                                    {inv.status === 'PAID' && <span style={{ fontSize: '0.7rem', padding: '6px 10px', borderRadius: '6px', fontWeight: 800, background: '#dcfce7', color: '#166534' }}>LUNAS</span>}
                                    {inv.status === 'MERGED' && <span style={{ fontSize: '0.7rem', padding: '6px 10px', borderRadius: '6px', fontWeight: 800, background: '#f1f5f9', color: '#64748b' }}>MERGED</span>}
                                    
                                    <button onClick={() => setViewInvoice(inv)} style={{ padding: '6px 10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}><SearchIcon size={14}/> Rincian</button>
                                    <button onClick={() => window.open(`/print-invoice-detail/${inv.id}`, '_blank')} style={{ padding: '6px 10px', background: brandNavy, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Printer size={14}/> Cetak Rinci</button>
                                    <button onClick={() => window.open(`/print-invoice-summary/${inv.id}`, '_blank')} style={{ padding: '6px 10px', background: '#eab308', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Printer size={14}/> Cetak Ringkas</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {invoices.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'50px', color:'#94a3b8', fontWeight:700}}>Belum ada riwayat tagihan dibuat.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}