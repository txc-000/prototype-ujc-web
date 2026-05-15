import React from 'react';
import { Building2, UserCircle, Receipt } from 'lucide-react';
import { styles, actionBtn } from '../../Reguler/components/dashboardStyles';

export default function TabTagihan({ filteredStudentsTagihan, openPaymentModal }) {
    return (
        <div style={styles.tableContainer}>
            <table style={styles.tableS}>
                <thead style={styles.theadS}>
                    <tr><th style={styles.thStyle}>Siswa (Pra-Terbang)</th><th style={styles.thStyle}>Sisa (Tunggakan)</th><th style={{...styles.thStyle, textAlign: 'center'}}>Aksi</th></tr>
                </thead>
                <tbody>
                    {filteredStudentsTagihan.map(s => (
                        <tr key={s.id} style={styles.trS}>
                            <td style={styles.tdStyle}>
                                <div style={{fontWeight:800, color: '#1e293b'}}>{s.nama_lengkap}</div>
                                {s.isMitra ? (
                                    <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Building2 size={12}/> Mitra: {s.lpk_asal}</div>
                                ) : (
                                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><UserCircle size={12}/> Reguler UJC</div>
                                )}
                            </td>
                            <td style={{...styles.tdStyle, color: s.sisa_tagihan > 0 ? '#ef4444' : '#64748b', fontWeight: 800}}>
                                Rp {s.sisa_tagihan.toLocaleString('id-ID')}
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>Total Tagihan: Rp {s.total_bayar.toLocaleString('id-ID')}</div>
                            </td>
                            <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                <button onClick={() => openPaymentModal(s)} style={{...actionBtn('#3b82f6'), margin: '0 auto'}}><Receipt size={16}/> Detail & Bayar</button>
                            </td>
                        </tr>
                    ))}
                    {filteredStudentsTagihan.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:'40px', color:'#94a3b8', fontWeight:700}}>Data tidak ditemukan.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}