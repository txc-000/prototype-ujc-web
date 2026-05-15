import React from 'react';
import { Clock, XCircle, CheckCircle2, Eye, Loader2 } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

const cleanStr = (str) => (str || '').toLowerCase().trim();

export default function TabRiwayatPengajuan({ isLoading, riwayatSiswa, setDetailModal }) {
    return (
        <div className="fade-in">
            <header style={{ marginBottom: '30px', flexShrink: 0 }}>
                <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900, letterSpacing: '-0.5px' }}>Pemantauan Status Kandidat</h1>
                <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>Pantau perkembangan, nilai akademik, dan penempatan siswa Anda secara real-time.</p>
            </header>

            <div style={styles.tableContainer}>
                <table style={styles.tableS}>
                    <thead style={styles.theadS}>
                        <tr>
                            <th style={styles.thStyle}>Nama Siswa & Program</th>
                            <th style={styles.thStyle}>Tgl Pengajuan</th>
                            <th style={styles.thStyle}>Posisi / Tahap Saat Ini</th>
                            <th style={styles.thStyle}>Status Seleksi UJC</th>
                            <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi & Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" size={30} color={brandNavy} style={{margin:'0 auto'}}/></td></tr>
                        ) : riwayatSiswa.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Anda belum mengajukan kandidat sama sekali.</td></tr>
                        ) : (
                            riwayatSiswa.map(siswa => {
                                const status = cleanStr(siswa.status_akhir);
                                const tahap = cleanStr(siswa.tahap_sekarang);
                                
                                let icon = <Clock size={16} color="#d97706" />;
                                let bg = '#fef3c7', col = '#92400e';
                                
                                if (tahap === 'wawancara mitra' || status === 'menunggu review') {
                                    bg = '#fef3c7'; col = '#92400e'; icon = <Clock size={16} color="#92400e" />;
                                } else if (status === 'ditolak' || status === 'gagal') {
                                    bg = '#fee2e2'; col = '#991b1b'; icon = <XCircle size={16} color="#991b1b" />;
                                } else {
                                    bg = '#dcfce7'; col = '#166534'; icon = <CheckCircle2 size={16} color="#166534" />;
                                }

                                return (
                                    <tr key={siswa.id} style={styles.trS}>
                                        <td style={styles.tdStyle}>
                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{siswa.nama_lengkap}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                                                {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} <span style={{color:'#cbd5e1', margin:'0 4px'}}>|</span> <span style={{color: '#10b981'}}>{siswa.program || 'Program Belum Diset'}</span>
                                            </div>
                                        </td>
                                        <td style={styles.tdStyle}>
                                            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                                {new Date(siswa.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td style={styles.tdStyle}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: brandNavy }}>{siswa.tahap_sekarang}</span>
                                        </td>
                                        <td style={styles.tdStyle}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: bg, color: col, padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                {icon} {siswa.status_akhir || 'PROSES'}
                                            </div>
                                        </td>
                                        <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                            <button onClick={() => setDetailModal(siswa)} style={{ padding: '8px 15px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', transition: '0.2s' }}>
                                                <Eye size={16}/> Cek Progres
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}