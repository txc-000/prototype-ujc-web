import React from 'react';
import { Building2, UserCircle } from 'lucide-react';
import { styles } from '../../Reguler/components/dashboardStyles';

export default function TabAlumni({ filteredAlumniTracking, formatTanggal, updateStatusAlumni }) {
    return (
        <div style={styles.tableContainer}>
            <table style={styles.tableS}>
                <thead style={styles.theadS}>
                    <tr>
                        <th style={styles.thStyle}>Nama Alumni & Asal</th>
                        <th style={styles.thStyle}>Tgl Entri (Ke Jepang)</th>
                        <th style={styles.thStyle}>Status Penagihan</th>
                        <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi Data</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAlumniTracking.map(s => (
                        <tr key={s.id} style={styles.trS}>
                            <td style={styles.tdStyle}>
                                <div style={{fontWeight:900, color: '#1e293b'}}>{s.nama_lengkap}</div>
                                <div style={{ fontSize: '0.85rem', color: '#ec4899', fontWeight: 700, marginTop: '2px' }}>🏢 {s.perusahaan_tujuan || '-'}</div>
                                {s.isMitra ? (
                                    <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Building2 size={12}/> Mitra: {s.lpk_asal}</div>
                                ) : (
                                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><UserCircle size={12}/> Reguler UJC</div>
                                )}
                            </td>
                            <td style={styles.tdStyle}>
                                <div style={{ fontWeight: 800, color: '#334155' }}>
                                    {s.tanggal_entri ? formatTanggal(s.tanggal_entri) : <span style={{ color: '#ef4444' }}>Belum Diset</span>}
                                </div>
                            </td>
                            <td style={styles.tdStyle}>
                                <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: s.status_alumni === 'BUTUH KONFIRMASI' ? '#fef08a' : s.status_alumni === 'AKTIF' ? '#dcfce7' : '#fee2e2', color: s.status_alumni === 'BUTUH KONFIRMASI' ? '#854d0e' : s.status_alumni === 'AKTIF' ? '#166534' : '#991b1b' }}>
                                    {s.status_alumni || 'AKTIF'} {s.status_alumni !== 'AKTIF' && s.status_alumni !== 'BUTUH KONFIRMASI' && '(FREEZE)'}
                                </span>
                            </td>
                            <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                <select style={{...styles.inpSm, padding: '6px 30px 6px 12px', fontSize: '0.8rem', width: 'auto', margin: '0 auto', display: 'block', cursor: 'pointer'}} value={s.status_alumni || 'AKTIF'} onChange={(e) => updateStatusAlumni(s.id, s.nama_lengkap, e.target.value)}>
                                    <option value="AKTIF">AKTIF (Ditagih)</option>
                                    <option value="BUTUH KONFIRMASI">BUTUH KONFIRMASI (Ghosting/Freeze)</option>
                                    <option value="KABUR">KABUR (Freeze)</option>
                                    <option value="SAKIT">SAKIT (Freeze)</option>
                                    <option value="SELESAI_KONTRAK">SELESAI KONTRAK (Freeze)</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                    {filteredAlumniTracking.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'#94a3b8', fontWeight:700}}>Data tidak ditemukan.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}