import React, { useState } from 'react';
import { Search, LayoutGrid, List, MoreVertical, Eye, FileSignature, ArrowRight, Building2 } from 'lucide-react';
import { supervisorService } from '../../../services/supervisorService';

// IMPORT STYLES SENTRAL
import { styles, viewBtnS, tabS, tagS } from '../../Reguler/components/dashboardStyles';

const PIPELINE_STAGES = [
    'PENDIDIKAN REGULER', 'AVAILABLE', 'PRA_MENSETSU', 'INTERVIEW', 'MATCHED',
    'PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA',
    'PENDIDIKAN DIKLAT', 'SIAP BERANGKAT'
];

export default function SpvManajemenSiswa({ 
    activeMenu = 'MASTER_CV', 
    activeTab = 'SEMUA', 
    setActiveTab = () => {}, 
    rawStudents = [], // KUNCI 1: Default Props
    setSelectedCV = () => {}, 
    onRefresh = () => {} 
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('TABLE');
    const [activeDropdown, setActiveDropdown] = useState(null);

    const cleanStr = (str) => str ? str.toString().trim().toLowerCase() : '';
    const isProses = (s) => cleanStr(s.status_akhir) === 'proses' || !s.status_akhir;

    // KUNCI 2: Pastikan selalu Array, tidak pernah undefined
    let currentStudents = rawStudents || [];

    // Filter Logic based on Active Menu & Tab
    if (activeMenu === 'LAPORAN_LULUS') currentStudents = currentStudents.filter(s => cleanStr(s.status_akhir) === 'lulus');
    else if (activeMenu === 'LAPORAN_GAGAL') currentStudents = currentStudents.filter(s => cleanStr(s.status_akhir) === 'gagal' || cleanStr(s.status_akhir) === 'gagal seleksi' || s.tahap_sekarang === 'ARSIP / GAGAL');
    else if (activeMenu === 'LAPORAN_PERUSAHAAN') currentStudents = currentStudents.filter(s => cleanStr(s.status_akhir) === 'lulus');
    else if (activeMenu === 'MASTER_CV') {
        if (activeTab === 'REGULER') currentStudents = currentStudents.filter(s => ['PENDIDIKAN REGULER', 'AVAILABLE'].includes(s.tahap_sekarang) && isProses(s));
        else if (activeTab === 'REKRUTMEN') currentStudents = currentStudents.filter(s => ['PRA_MENSETSU', 'INTERVIEW', 'MATCHED'].includes(s.tahap_sekarang) && isProses(s));
        else if (activeTab === 'DOKUMEN') currentStudents = currentStudents.filter(s => ['PENGUMPULAN BERKAS', 'TTD KONTRAK', 'APPLY COE', 'APPLY VISA'].includes(s.tahap_sekarang) && isProses(s));
        else if (activeTab === 'KEBERANGKATAN') currentStudents = currentStudents.filter(s => ['PENDIDIKAN DIKLAT', 'SIAP BERANGKAT'].includes(s.tahap_sekarang) && isProses(s));
        else currentStudents = currentStudents.filter(isProses);
    }

    // Apply Search
    const filteredStudents = currentStudents.filter(s => 
        (s.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.nama_jepang || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.perusahaan_tujuan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNextStage = async (id, currentStage, perusahaanTujuan) => {
        const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
        if (currentIndex >= PIPELINE_STAGES.indexOf('MATCHED') && (!perusahaanTujuan || perusahaanTujuan.trim() === '')) {
            alert("⛔ DITOLAK: Siswa ini belum terikat dengan Perusahaan (Kaisha) manapun!\n\nSilakan klik 'Edit Data Rirekisho' dan isi kolom Perusahaan Tujuan terlebih dahulu sebelum melanjutkan ke tahap pengurusan berkas terbang."); 
            setActiveDropdown(null); return;
        }
        if (currentIndex >= 0 && currentIndex < PIPELINE_STAGES.length - 1) {
            const nextStage = PIPELINE_STAGES[currentIndex + 1];
            if (!window.confirm(`Pindahkan siswa ke tahap selanjutnya: ${nextStage}?`)) return;
            try { 
                await supervisorService.updateStudentStage(id, nextStage); 
                onRefresh(); 
                setActiveDropdown(null); 
            } catch (err) { alert(err.message); }
        } else { 
            alert("Siswa sudah berada di tahap paling akhir."); 
            setActiveDropdown(null); 
        }
    };

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '15px', fontWeight: 900 }}>
                        {activeMenu === 'MASTER_CV' ? 'Manajemen Siswa LPK' : activeMenu === 'LAPORAN_LULUS' ? 'Laporan Kelulusan' : activeMenu === 'LAPORAN_PERUSAHAAN' ? 'Laporan Penempatan Perusahaan' : 'Laporan Gagal/Mundur'}
                    </h1>
                    {activeMenu === 'MASTER_CV' && (
                        <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '10px' }}>
                            {['SEMUA', 'REGULER', 'REKRUTMEN', 'DOKUMEN', 'KEBERANGKATAN'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} style={tabS(activeTab === tab)}>{tab}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Nama / Kaisha..." onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px', width: '300px' }} />
                    </div>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                        <button onClick={() => setViewMode('CARD')} style={viewBtnS(viewMode === 'CARD')}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('TABLE')} style={viewBtnS(viewMode === 'TABLE')}><List size={18} /></button>
                    </div>
                </div>
            </header>

            {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', background: 'white', borderRadius: '15px' }}>Belum ada data di tahapan ini.</div>
            ) : viewMode === 'TABLE' ? (
                <div style={styles.tableContainer}>
                    <table style={styles.tableS}>
                        <thead style={styles.theadS}>
                            <tr><th style={styles.thStyle}>Identitas Siswa</th><th style={styles.thStyle}>Tahap / Posisi</th><th style={styles.thStyle}>Status Akhir</th><th style={{ ...styles.thStyle, textAlign: 'center' }}>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(s => (
                                <tr key={s.id} style={styles.trS}>
                                    <td style={styles.tdStyle}>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama_lengkap}</div>
                                        <div style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>{s.nama_jepang || '(Nama Jepang Belum Diisi)'}</div>
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>{s.tahap_sekarang}</span>
                                        {s.perusahaan_tujuan && ['LAPORAN_LULUS', 'LAPORAN_PERUSAHAAN'].includes(activeMenu) && (
                                            <div style={{ fontSize: '0.75rem', color: '#ec4899', marginTop: '4px', fontWeight: 800 }}>📍 {s.perusahaan_tujuan}</div>
                                        )}
                                    </td>
                                    <td style={styles.tdStyle}>
                                        <span style={tagS(s.status_akhir)}>{s.status_akhir || 'Proses'}</span>
                                    </td>
                                    <td style={{ ...styles.tdStyle, textAlign: 'center', position: 'relative' }}>
                                        <button onClick={() => setActiveDropdown(activeDropdown === s.id ? null : s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '5px' }}>
                                            <MoreVertical size={20} />
                                        </button>
                                        {activeDropdown === s.id && (
                                            <div style={styles.dropdownContainer}>
                                                <button onClick={() => { window.open(`/print-cv/${s.id}`, '_blank'); setActiveDropdown(null); }} style={styles.dropdownItemS}><Eye size={16} /> Preview Rirekisho</button>
                                                <button onClick={() => { setSelectedCV(s); setActiveDropdown(null); }} style={styles.dropdownItemS}><FileSignature size={16} /> Edit Data Rirekisho</button>
                                                {isProses(s) && <div style={{ borderTop: '1px solid #f1f5f9', margin: '5px 0' }}></div>}
                                                {isProses(s) && <button onClick={() => handleNextStage(s.id, s.tahap_sekarang, s.perusahaan_tujuan)} style={{ ...styles.dropdownItemS, color: '#059669' }}><ArrowRight size={16} /> Lanjut Tahap</button>}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredStudents.map(s => (
                        <div key={s.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ paddingRight: '10px' }}>
                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem', lineHeight: '1.2', marginBottom: '4px' }}>{s.nama_lengkap}</div>
                                    <div style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>{s.nama_jepang || '(Nama Jepang Kosong)'}</div>
                                </div>
                                <button onClick={() => setActiveDropdown(activeDropdown === s.id ? null : s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', alignSelf: 'flex-start' }}>
                                    <MoreVertical size={20} />
                                </button>
                                {activeDropdown === s.id && (
                                    <div style={{ ...styles.dropdownContainer, right: '15px', top: '40px' }}>
                                        <button onClick={() => { window.open(`/print-cv/${s.id}`, '_blank'); setActiveDropdown(null); }} style={styles.dropdownItemS}><Eye size={16} /> Preview Rirekisho</button>
                                        <button onClick={() => { setSelectedCV(s); setActiveDropdown(null); }} style={styles.dropdownItemS}><FileSignature size={16} /> Edit Data Rirekisho</button>
                                        {isProses(s) && <div style={{ borderTop: '1px solid #f1f5f9', margin: '5px 0' }}></div>}
                                        {isProses(s) && <button onClick={() => handleNextStage(s.id, s.tahap_sekarang, s.perusahaan_tujuan)} style={{ ...styles.dropdownItemS, color: '#059669' }}><ArrowRight size={16} /> Lanjut Tahap</button>}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, marginBottom: '20px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Tahap Saat Ini</div>
                                <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>{s.tahap_sekarang}</div>
                                {s.perusahaan_tujuan && (
                                    <div style={{ fontSize: '0.8rem', color: '#ec4899', marginTop: '6px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Building2 size={14} /> {s.perusahaan_tujuan}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>ID: {s.id.substring(0, 6)}...</span>
                                <span style={tagS(s.status_akhir)}>{s.status_akhir || 'Proses'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}