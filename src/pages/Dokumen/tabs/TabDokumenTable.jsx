import React from 'react';
import { Loader2, Building2, UserCircle, Eye, ClipboardCheck, FileText, Printer, PlaneTakeoff } from 'lucide-react';
import { styles, brandNavy, actionBtn } from '../../Reguler/components/dashboardStyles';

export default function TabDokumenTable({ 
    activeTab, 
    isLoading, 
    filtered, 
    docItems, 
    formatTanggal, 
    getPeriodeString,
    openBerkasDigital, 
    openChecklistModal, 
    openOtitModal, 
    openPrintMenu, 
    handleUpdateStage, 
    initModalTerbang 
}) {
    return (
        <div style={styles.tableContainer}>
            <table style={styles.tableS}>
                <thead style={styles.theadS}>
                    <tr>
                        <th style={styles.thStyle}>Siswa</th>
                        <th style={styles.thStyle}>Status Pipeline</th>
                        <th style={styles.thStyle}>Progres Fisik</th>
                        <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi Dokumen</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="4" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" size={30} color={brandNavy} style={{margin:'0 auto'}}/></td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan="4" style={{padding:'40px', textAlign:'center', color:'#94a3b8', fontWeight:600}}>Tidak ada siswa di tahap ini.</td></tr>
                    ) : filtered.map(s => {
                        const parsedStatus = typeof s.pemberkasan_status === 'string' ? JSON.parse(s.pemberkasan_status || '{}') : (s.pemberkasan_status || {});
                        const doneCount = Object.values(parsedStatus).filter(v => v === true).length;
                        const progress = Math.round((doneCount / docItems.length) * 100);
                        
                        return (
                            <tr key={s.id} style={{ ...styles.trS, background: activeTab === 'SELESAI' ? '#f8fafc' : 'white' }}>
                                <td style={styles.tdStyle}>
                                    <div style={{fontWeight:800, color: '#1e293b'}}>{s.nama_lengkap}</div>
                                    <div style={{fontSize:'0.75rem', color:'#64748b', fontWeight: 600}}>{s.nis || s.nik || '-'}</div>
                                </td>
                                <td style={styles.tdStyle}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '5px' }}>📍 {s.perusahaan_tujuan || 'Belum Ada Kaisha'}</div>
                                    <div style={{...styles.badgeS, marginTop: '6px'}}>{s.tahap_sekarang}</div>
                                </td>
                                <td style={styles.tdStyle}>
                                    <div style={{ width: '100%', background: '#e2e8f0', height: '8px', borderRadius: '10px', overflow: 'hidden', marginBottom: '5px' }}>
                                        <div style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : brandNavy, height: '100%', transition: '0.3s' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: progress === 100 ? '#10b981' : '#64748b' }}>{progress}% Lengkap</span>
                                </td>
                                <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                        
                                        {/* TOMBOL MANAJEMEN DOKUMEN TERPADU */}
                                        <button onClick={() => openBerkasDigital(s)} style={{...actionBtn('#3b82f6'), background: '#eff6ff'}} title="Kelola Kelengkapan Berkas Fisik & Scan"><ClipboardCheck size={18} color="#2563eb"/></button>
                                        
                                        {/* TOMBOL FORMULIR OTIT */}
                                        <button onClick={() => openOtitModal(s)} style={{...actionBtn('#10b981'), background: '#ecfdf5'}} title="Form OTIT, Pendidikan & Identitas">
                                            <FileText size={18} color="#065f46" />
                                        </button>
                                        
                                        {/* TOMBOL CETAK DOKUMEN OTIT */}
                                        <button onClick={() => openPrintMenu(s)} style={{...actionBtn('#8b5cf6'), background: '#f5f3ff'}} title="Cetak Dokumen Imigrasi/OTIT">
                                            <Printer size={18} color="#6d28d9" />
                                        </button>

                                        {/* TOMBOL AKSI PIPELINE (Dinamis per Tab, WA Dihapus) */}
                                        {activeTab === 'PEMBERKASAN' && (
                                            <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'TTD KONTRAK')} style={{...styles.btnPrimary, padding: '8px 12px', fontSize: '0.8rem'}}>Maju TTD Kontrak</button>
                                        )}
                                        
                                        {activeTab === 'KONTRAK' && (
                                            <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'APPLY COE')} style={{...styles.btnPrimary, padding: '8px 12px', fontSize: '0.8rem'}}>Maju Apply CoE</button>
                                        )}
                                        
                                        {activeTab === 'COE_VISA' && s.tahap_sekarang !== 'APPLY VISA' && (
                                            <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'APPLY VISA')} style={{...styles.btnPrimary, padding: '8px 12px', fontSize: '0.8rem', background: '#3b82f6'}}>CoE Turun (Apply Visa)</button>
                                        )}
                                        {activeTab === 'COE_VISA' && s.tahap_sekarang === 'APPLY VISA' && (
                                            <button onClick={() => handleUpdateStage(s.id, s.nama_lengkap, 'SIAP BERANGKAT')} style={{...styles.btnPrimary, padding: '8px 12px', fontSize: '0.8rem', background: '#10b981'}}>Visa Terbit (Siap Terbang)</button>
                                        )}
                                        
                                        {activeTab === 'KEBERANGKATAN' && (
                                            <button onClick={() => initModalTerbang(s)} style={{...styles.btnPrimary, background: '#10b981', padding: '8px 12px', fontSize: '0.8rem'}}>
                                                <PlaneTakeoff size={14}/> Set Jadwal Terbang
                                            </button>
                                        )}
                                        
                                        {activeTab === 'SELESAI' && (
                                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800, padding: '6px 12px', background: '#dcfce7', borderRadius: '6px', border: '1px solid #10b981' }}>✔️ Selesai Proses</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}