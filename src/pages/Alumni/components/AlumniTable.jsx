import React from 'react';
import { Building2, Users, AlertTriangle, Clock, MoreVertical, Edit, Loader2 } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function AlumniTable({ 
    isLoading, alumni, calculateContract, 
    activeDropdown, setActiveDropdown, dropdownRef, openUpdateModal 
}) {
    return (
        <div style={styles.tableContainer}>
            <table style={styles.tableS}>
                <thead style={styles.theadS}>
                    <tr>
                        <th style={styles.thStyle}>Identitas Alumni</th>
                        <th style={styles.thStyle}>Penempatan (Kaisha & Kumiai)</th>
                        <th style={styles.thStyle}>Estimasi Kontrak</th>
                        <th style={styles.thStyle}>Status Terkini</th>
                        <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="5" style={{ padding: '50px', textAlign: 'center' }}><Loader2 className="animate-spin" size={30} color={brandNavy} style={{margin:'0 auto'}}/></td></tr>
                    ) : alumni.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Tidak ada data alumni yang sesuai filter.</td></tr>
                    ) : (
                        alumni.map(a => {
                            const contract = calculateContract(a.tanggal_entri || a.updated_at);
                            const st = (a.status_akhir || 'AKTIF BEKERJA').toUpperCase();
                            const otit = typeof a.data_otit === 'string' ? JSON.parse(a.data_otit || '{}') : (a.data_otit || {});
                            
                            return (
                                <tr key={a.id} style={styles.trS}>
                                    <td style={styles.tdStyle}>
                                        <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.05rem' }}>{a.nama_lengkap}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>NIK: {a.nik || '-'}</div>
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: brandNavy, marginBottom: '4px' }}>
                                            <Building2 size={16}/> {a.perusahaan_tujuan || 'Belum Terdata'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                            <Users size={12}/> {otit.nama_kumiai || '-'}
                                        </div>
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: contract.color }}>
                                            {contract.isWarning ? <AlertTriangle size={16}/> : <Clock size={16}/>}
                                            {contract.text}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                                            Mulai: {a.tanggal_entri ? new Date(a.tanggal_entri).toLocaleDateString('id-ID') : 'Belum diisi'}
                                        </div>
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <span style={{ 
                                            background: st === 'AKTIF BEKERJA' ? '#dcfce7' : st === 'KABUR' ? '#fee2e2' : '#f1f5f9', 
                                            color: st === 'AKTIF BEKERJA' ? '#166534' : st === 'KABUR' ? '#991b1b' : '#475569', 
                                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900 
                                        }}>
                                            {st}
                                        </span>
                                    </td>
                                    <td style={{...styles.tdStyle, textAlign: 'center', position: 'relative'}}>
                                        <button onClick={() => setActiveDropdown(activeDropdown === a.id ? null : a.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                            <MoreVertical size={20} />
                                        </button>
                                        {activeDropdown === a.id && (
                                            <div ref={dropdownRef} style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '180px', zIndex: 50, padding: '5px', textAlign: 'left' }}>
                                                <button onClick={() => openUpdateModal(a)} style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}><Edit size={14} /> Update Status</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}