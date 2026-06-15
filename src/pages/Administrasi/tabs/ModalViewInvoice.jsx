import React from 'react';
import { X, AlertOctagon, Printer } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalViewInvoice({ viewInvoice, setViewInvoice }) {
    if (!viewInvoice) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '800px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: '30px'}}>
                <div style={styles.modalHeader}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: brandNavy }}>Rincian Tagihan & Prediksi</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>No: {viewInvoice.invoice_no}</p>
                    </div>
                    <button onClick={() => setViewInvoice(null)} style={styles.closeBtn}><X size={20} color="#64748b" /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Klien (Kumiai)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{viewInvoice.kumiai_name}</div>
                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 800, background: viewInvoice.status === 'PAID' ? '#dcfce7' : viewInvoice.status === 'MERGED' ? '#f3f4f6' : '#fef2f2', color: viewInvoice.status === 'PAID' ? '#166534' : viewInvoice.status === 'MERGED' ? '#475569' : '#ef4444' }}>STATUS: {viewInvoice.status}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ec4899' }}>Total: ¥{Number(viewInvoice.total_amount).toLocaleString()}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                            <button onClick={() => window.open(`/print-invoice-detail/${viewInvoice.id}`, '_blank')} style={{ background: brandNavy, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Printer size={14}/> Cetak Detail (請求書)
                            </button>
                            <button onClick={() => window.open(`/print-invoice-summary/${viewInvoice.id}`, '_blank')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Printer size={14}/> Cetak Kwitansi (領収書)
                            </button>
                        </div>
                    </div>

                    <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Periode Saat Ini</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', marginBottom: '10px' }}>{viewInvoice.billing_period}</div>
                    </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                            <tr>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Siswa (Batch/Entri)</th>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Durasi Tagihan</th>
                                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Nominal</th>
                                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Qty (Satuan)</th>
                                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(
                                (viewInvoice.detail_tagihan || []).reduce((acc, item) => {
                                    if (!acc[item.perusahaan]) acc[item.perusahaan] = [];
                                    acc[item.perusahaan].push(item);
                                    return acc;
                                }, {})
                            ).map(([perusahaan, students]) => (
                                <React.Fragment key={perusahaan}>
                                    <tr style={{ background: perusahaan === 'TUNGGAKAN SEBELUMNYA' ? '#fffbeb' : '#e2e8f0' }}>
                                        <td colSpan="5" style={{ padding: '8px 10px', fontWeight: 900, color: perusahaan === 'TUNGGAKAN SEBELUMNYA' ? '#b45309' : '#1e293b' }}>
                                            {perusahaan === 'TUNGGAKAN SEBELUMNYA' ? <AlertOctagon size={14} style={{display:'inline', marginBottom:'-2px'}}/> : '🏢'} {perusahaan}
                                        </td>
                                    </tr>
                                    {students.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', paddingLeft: '25px' }}>
                                                <div style={{ fontWeight: 800, color: item.student_id === 'OUTSTANDING' ? '#ef4444' : '#334155' }}>{item.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Entri: {item.no_entri || item.tanggal_entri || '-'}</div>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: item.student_id === 'OUTSTANDING' ? '#fee2e2' : '#dbeafe', color: item.student_id === 'OUTSTANDING' ? '#ef4444' : '#1e40af', fontWeight: 800, borderRadius: '4px' }}>{item.ket_durasi || '-'}</span>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>¥{Number(item.nominal).toLocaleString()}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.kuantitas} {item.satuan}</td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: item.student_id === 'OUTSTANDING' ? '#ef4444' : brandNavy }}>¥{(item.nominal * item.kuantitas).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}