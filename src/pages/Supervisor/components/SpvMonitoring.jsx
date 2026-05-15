import React, { useState } from 'react';
import { Search } from 'lucide-react';

// IMPORT STYLES SENTRAL
import { styles, tagS } from '../../Reguler/components/dashboardStyles';

const DOC_ITEMS = [
    { id: 'ktp', label: 'KTP' }, { id: 'kk', label: 'KK' }, { id: 'akta', label: 'Akta' },
    { id: 'paspor', label: 'Paspor' }, { id: 'ijazah', label: 'Ijazah' }, { id: 'mcu_final', label: 'MCU' },
    { id: 'skck', label: 'SKCK' }, { id: 'foto', label: 'Foto' }
];

export default function SpvMonitoring({ 
    rawStudents = [], // Pengaman 1: Default props
    rawJobOrders = [], // Pengaman 1: Default props
    spvType, 
    onSelectJobOrder 
}) {
    const [searchTerm, setSearchTerm] = useState('');

    const docStages = ['MATCHED', 'MCU_LANJUTAN', 'PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA', 'SIAP BERANGKAT'];
    
    // Pengaman 2: Pastikan selalu berwujud array meskipun dipaksa menerima null
    const safeStudents = rawStudents || [];
    const safeJobs = rawJobOrders || [];

    const filteredDocs = safeStudents.filter(s => 
        docStages.includes(s.tahap_sekarang) && 
        (s.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const filteredJO = safeJobs.filter(j => 
        (j.status === 'OPEN' || j.status === 'AKTIF') && 
        ((j.perusahaan || '').toLowerCase().includes(searchTerm.toLowerCase()) || (j.bidang || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: '2rem' }}>Monitoring Detail: {spvType}</h2>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>Pantau pergerakan data dari staf di lapangan.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px' }} color="#94a3b8" />
                    <input placeholder="Cari nama / data..." style={{ ...styles.inpSm, paddingLeft: '40px', width: '250px' }} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </header>

            <div style={styles.tableContainer}>
                {spvType === 'REKRUTMEN' ? (
                    <table style={styles.tableS}>
                        <thead style={styles.theadS}>
                            <tr><th style={styles.thStyle}>Perusahaan & ID</th><th style={styles.thStyle}>Bidang</th><th style={styles.thStyle}>Kuota Terisi</th><th style={styles.thStyle}>Status</th></tr>
                        </thead>
                        <tbody>
                            {filteredJO.map(j => {
                                const pct = j.kuota > 0 ? (j.terisi / j.kuota) * 100 : 0;
                                return (
                                    <tr key={j.id} style={{ ...styles.trS, cursor: 'pointer' }} onClick={() => onSelectJobOrder(j)}>
                                        <td style={styles.tdStyle}>
                                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{j.perusahaan}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                                {j.job_id} {j.program ? `• ${j.program}` : ''} {j.durasi_kontrak ? `(${j.durasi_kontrak} Bln)` : ''}
                                            </div>
                                        </td>
                                        <td style={styles.tdStyle}>{j.bidang}</td>
                                        <td style={styles.tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ flex: 1, background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '100px' }}>
                                                    <div style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : '#10b981', height: '100%' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>{j.terisi}/{j.kuota}</span>
                                            </div>
                                        </td>
                                        <td style={styles.tdStyle}><span style={tagS(j.status)}>{j.status}</span></td>
                                    </tr>
                                )
                            })}
                            {filteredJO.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Data kosong atau Job Order tidak ditemukan.</td></tr>}
                        </tbody>
                    </table>
                ) : (
                    <table style={styles.tableS}>
                        <thead style={styles.theadS}>
                            <tr><th style={styles.thStyle}>Identitas Siswa</th><th style={styles.thStyle}>Status Berkas Fisik</th><th style={styles.thStyle}>Item Belum Lengkap</th><th style={styles.thStyle}>Tahapan</th></tr>
                        </thead>
                        <tbody>
                            {filteredDocs.map(s => {
                                const parsed = typeof s.pemberkasan_status === 'string' ? JSON.parse(s.pemberkasan_status || '{}') : (s.pemberkasan_status || {});
                                const missing = DOC_ITEMS.filter(d => !parsed[d.id]).map(d => d.label);
                                const done = DOC_ITEMS.length - missing.length;
                                return (
                                    <tr key={s.id} style={styles.trS}>
                                        <td style={styles.tdStyle}>
                                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama_lengkap}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kaisha: <span style={{color: '#ec4899', fontWeight: 700}}>{s.perusahaan_tujuan || '-'}</span></div>
                                        </td>
                                        <td style={styles.tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '100px', background: '#e2e8f0', height: '6px', borderRadius: '3px' }}>
                                                    <div style={{ width: `${(done/DOC_ITEMS.length)*100}%`, background: done === DOC_ITEMS.length ? '#10b981' : '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{done}/{DOC_ITEMS.length}</span>
                                            </div>
                                        </td>
                                        <td style={styles.tdStyle}>
                                            {missing.length === 0 ? <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem' }}>LENGKAP</span> : (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {missing.map(m => <span key={m} style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{m}</span>)}
                                                </div>
                                            )}
                                        </td>
                                        <td style={styles.tdStyle}><span style={tagS('CETAK')}>{s.tahap_sekarang}</span></td>
                                    </tr>
                                );
                            })}
                            {filteredDocs.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Data kosong atau Siswa tidak ditemukan.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}