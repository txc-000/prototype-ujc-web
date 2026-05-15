import React from 'react';
import { AlertOctagon, ShieldAlert } from 'lucide-react';
import { actionBtn } from '../../Reguler/components/dashboardStyles';

export default function TabPrioritas({ urgentInvoices, updateInvoiceStatus, problematicAlumni, unconfirmedAlumni }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertOctagon size={20}/> INVOICE KUMIAI BELUM DIBAYAR ({urgentInvoices.length})</h3>
                {urgentInvoices.length === 0 ? <p style={{margin:0, color:'#92400e', fontWeight: 600}}>Semua invoice sudah dilunasi Kumiai.</p> : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {urgentInvoices.map(inv => (
                            <div key={inv.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <div style={{fontWeight: 800, color: '#1e293b'}}>{inv.kumiai_name}</div>
                                    <div style={{fontSize: '0.8rem', color: '#64748b', fontWeight: 600}}>Invoice: {inv.invoice_no} | Periode: {inv.billing_period}</div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                    <div style={{fontWeight: 900, color: '#ef4444', fontSize: '1.2rem'}}>¥ {Number(inv.total_amount).toLocaleString()}</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => updateInvoiceStatus(inv)} style={{...actionBtn('#10b981'), padding:'4px 10px', fontSize:'0.75rem'}}>Set Lunas</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20}/> ALUMNI BERMASALAH & GHOSTING</h3>
                {problematicAlumni.length === 0 && unconfirmedAlumni.length === 0 ? <p style={{margin:0, color:'#7f1d1d', fontWeight: 600}}>Tidak ada catatan alumni bermasalah.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                        {[...problematicAlumni, ...unconfirmedAlumni].map(alum => (
                            <div key={alum.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${alum.status_alumni === 'BUTUH KONFIRMASI' ? '#eab308' : '#ef4444'}` }}>
                                <div style={{fontWeight: 800, color: '#1e293b'}}>{alum.nama_lengkap}</div>
                                <div style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '5px', fontWeight: 600}}>Kumiai: {alum.perusahaan_tujuan}</div>
                                <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: alum.status_alumni === 'BUTUH KONFIRMASI' ? '#fef08a' : '#fee2e2', color: alum.status_alumni === 'BUTUH KONFIRMASI' ? '#854d0e' : '#991b1b', fontWeight: 800, borderRadius: '4px' }}>Status: {alum.status_alumni}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}