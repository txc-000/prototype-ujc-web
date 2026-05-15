import React from 'react';
import { Loader2, Edit3 } from 'lucide-react';
import { styles, brandNavy, actionBtn } from '../../Reguler/components/dashboardStyles';

export default function TabBukuInduk({ 
    isLoading, filteredBukuInduk, filterTahun, setFilterTahun, 
    filterProgram, setFilterProgram, uniqueTahun, uniqueProgram, openRaportModal 
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '15px', background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', flexShrink: 0 }}>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }}>Tahun Masuk</label>
                    <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} style={{...styles.inpSm, width: '150px', cursor: 'pointer'}}>
                        <option value="">-- Semua Tahun --</option>
                        {uniqueTahun.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }}>Kategori Program</label>
                    <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={{...styles.inpSm, width: '200px', cursor: 'pointer'}}>
                        <option value="">-- Semua Program --</option>
                        {uniqueProgram.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={{ ...styles.tableContainer, flex: 1, overflow: 'auto' }}>
                <table style={{ ...styles.tableS, minWidth: '1000px' }}>
                    <thead style={{ ...styles.theadS, position: 'sticky', top: 0, zIndex: 5 }}>
                        <tr>
                            <th style={styles.thStyle}>Data Siswa</th>
                            <th style={styles.thStyle}>Rata²</th>
                            <th style={styles.thStyle}>Rincian Akademik</th>
                            <th style={styles.thStyle}>Karakter Dasar</th>
                            <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? <tr><td colSpan="5" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" size={30} color={brandNavy} style={{margin:'0 auto'}}/></td></tr> : filteredBukuInduk.map(s => {
                            const r = s.data_raport || {};
                            return (
                                <tr key={s.id} style={styles.trS}>
                                    <td style={styles.tdStyle}>
                                        <div style={{fontWeight:900, color: '#1e293b'}}>{s.nama_lengkap}</div>
                                        <div style={{fontSize:'0.75rem', color:'#64748b', fontWeight: 700}}>{s.program || '-'} • Angk. {new Date(s.created_at).getFullYear()}</div>
                                        <div style={{fontSize:'0.7rem', padding: '4px 10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', display: 'inline-block', marginTop: '6px', fontWeight: 800}}>{s.tahap_sekarang}</div>
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: brandNavy }}>{s.nilai_bahasa || 0}</span>
                                    </td>
                                    <td style={{...styles.tdStyle, fontSize: '0.85rem'}}>
                                        <div style={{display: 'flex', gap: '15px'}}>
                                            <div><span style={{color: '#94a3b8', fontWeight: 600}}>KTB:</span> <b style={{color: '#334155', fontWeight: 800}}>{r.kotoba || 0}</b></div>
                                            <div><span style={{color: '#94a3b8', fontWeight: 600}}>BNP:</span> <b style={{color: '#334155', fontWeight: 800}}>{r.bunpo || 0}</b></div>
                                            <div><span style={{color: '#94a3b8', fontWeight: 600}}>DKI:</span> <b style={{color: '#334155', fontWeight: 800}}>{r.dokkai || 0}</b></div>
                                        </div>
                                        <div style={{display: 'flex', gap: '15px', marginTop: '6px'}}>
                                            <div><span style={{color: '#94a3b8', fontWeight: 600}}>CHK:</span> <b style={{color: '#334155', fontWeight: 800}}>{r.choukai || 0}</b></div>
                                            <div><span style={{color: '#94a3b8', fontWeight: 600}}>KWA:</span> <b style={{color: '#334155', fontWeight: 800}}>{r.kaiwa || 0}</b></div>
                                        </div>
                                    </td>
                                    <td style={{...styles.tdStyle, fontSize: '0.85rem'}}>
                                        <div><span style={{color: '#94a3b8', fontWeight: 600}}>Sikap:</span> <b style={{color: '#f59e0b', fontWeight: 800}}>{r.perilaku || '-'}</b></div>
                                        <div style={{marginTop: '4px'}}><span style={{color: '#94a3b8', fontWeight: 600}}>Disiplin:</span> <b style={{color: '#f59e0b', fontWeight: 800}}>{r.kedisiplinan || '-'}</b></div>
                                    </td>
                                    <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                        <button onClick={() => openRaportModal(s)} style={{...actionBtn('#8b5cf6'), margin: '0 auto'}} title="Edit / Lihat Raport Detail"><Edit3 size={18}/></button>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredBukuInduk.length === 0 && !isLoading && <tr><td colSpan="5" style={{padding:'40px', textAlign:'center', color:'#94a3b8', fontWeight:700}}>Tidak ada data arsip yang sesuai.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}