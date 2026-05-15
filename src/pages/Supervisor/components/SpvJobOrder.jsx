import React, { useState } from 'react';
import { Search, Plus, LayoutGrid, List, Briefcase, Building2, MoreVertical, FileText, Trash2, X, Save, Loader2, Clock } from 'lucide-react';
import { supervisorService } from '../../../services/supervisorService';

// IMPORT STYLES SENTRAL (Sesuaikan path jika diperlukan)
import { styles, brandNavy, viewBtnS, tabS, tagS } from "../../Reguler/components/dashboardStyles";

export default function SpvJobOrder({ rawJobOrders, masterDropdowns, onRefresh, onSelectJobOrder }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('CARD');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isJobOrderModalOpen, setIsJobOrderModalOpen] = useState(false);
    const [isSubmittingJO, setIsSubmittingJO] = useState(false);

    const [newJobOrder, setNewJobOrder] = useState({ 
        job_id: '', perusahaan: '', bidang: '', kumiai: '', kuota: 0, terisi: 0, 
        status: 'OPEN', catatan: '', program: '', durasi_kontrak: '' 
    });

    const filteredJO = rawJobOrders.filter(jo => 
        (jo.perusahaan || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (jo.bidang || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddJobOrder = async (e) => {
        e.preventDefault(); 
        setIsSubmittingJO(true);
        try {
            const payload = { 
                ...newJobOrder, 
                job_id: newJobOrder.job_id || `JO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                durasi_kontrak: newJobOrder.durasi_kontrak ? parseInt(newJobOrder.durasi_kontrak) : null
            };
            await supervisorService.saveJobOrder(payload);
            alert('Job Order berhasil ditambahkan!'); 
            setIsJobOrderModalOpen(false); 
            onRefresh();
        } catch (error) { alert(`Gagal: ${error.message}`); } finally { setIsSubmittingJO(false); }
    };

    const handleDeleteJobOrder = async (id, namaPerusahaan) => {
        if (!window.confirm(`Yakin ingin menghapus Job Order untuk ${namaPerusahaan}?`)) return;
        try {
            await supervisorService.deleteJobOrder(id);
            alert('Job Order dihapus!'); 
            setActiveDropdown(null); 
            onRefresh();
        } catch (error) { alert(`Gagal: ${error.message}`); }
    };

    return (
        <div className="fade-in">
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0', fontWeight: 900 }}>Job Order (Kaisha)</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Daftar permintaan tenaga kerja dari perusahaan Jepang.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Perusahaan..." onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px', width: '250px' }} />
                    </div>
                    <button onClick={() => {
                        setNewJobOrder({ job_id: `JO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`, perusahaan: '', bidang: '', kumiai: '', kuota: 0, terisi: 0, status: 'OPEN', catatan: '', program: '', durasi_kontrak: '' });
                        setIsJobOrderModalOpen(true);
                    }} style={styles.btnPrimary}>
                        <Plus size={18} /> Tambah Job
                    </button>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                        <button onClick={() => setViewMode('CARD')} style={viewBtnS(viewMode === 'CARD')}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('TABLE')} style={viewBtnS(viewMode === 'TABLE')}><List size={18} /></button>
                    </div>
                </div>
            </header>

            {filteredJO.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', background: 'white', borderRadius: '15px' }}>Tidak ada Job Order. Silakan tambah data baru.</div>
            ) : viewMode === 'TABLE' ? (
                <div style={styles.tableContainer}>
                    <table style={styles.tableS}>
                        <thead style={styles.theadS}>
                            <tr><th style={styles.thStyle}>ID & Perusahaan</th><th style={styles.thStyle}>Bidang</th><th style={styles.thStyle}>Progress Kuota</th><th style={styles.thStyle}>Status</th><th style={{ ...styles.thStyle, textAlign: 'center' }}>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {filteredJO.map(jo => {
                                const pct = jo.kuota > 0 ? (jo.terisi / jo.kuota) * 100 : 0;
                                return (
                                    <tr key={jo.id} style={styles.trS}>
                                        <td style={{...styles.tdStyle, cursor: 'pointer'}} onClick={() => onSelectJobOrder(jo)}>
                                            <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={16} color={brandNavy} /> {jo.perusahaan}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>{jo.job_id} {jo.program ? `• ${jo.program}` : ''} {jo.durasi_kontrak ? `(${jo.durasi_kontrak} Bln)` : ''}</div>
                                        </td>
                                        <td style={{...styles.tdStyle, cursor: 'pointer'}} onClick={() => onSelectJobOrder(jo)}>{jo.bidang}</td>
                                        <td style={styles.tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ flex: 1, background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : '#10b981', height: '100%' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', width: '40px' }}>{jo.terisi}/{jo.kuota}</span>
                                            </div>
                                        </td>
                                        <td style={styles.tdStyle}><span style={tagS(jo.status)}>{jo.status}</span></td>
                                        <td style={{ ...styles.tdStyle, textAlign: 'center', position: 'relative' }}>
                                            <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === jo.id ? null : jo.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                                <MoreVertical size={20} />
                                            </button>
                                            {activeDropdown === jo.id && (
                                                <div style={styles.dropdownContainer}>
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(`/print-laporan-kaisha/${jo.id}`, '_blank'); setActiveDropdown(null); }} style={{ ...styles.dropdownItemS, color: brandNavy }}><FileText size={16} /> Cetak Laporan</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteJobOrder(jo.id, jo.perusahaan); }} style={{ ...styles.dropdownItemS, color: '#ef4444' }}><Trash2 size={16} /> Hapus Job Order</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredJO.map(jo => {
                        const pct = jo.kuota > 0 ? (jo.terisi / jo.kuota) * 100 : 0;
                        return (
                            <div key={jo.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div onClick={() => onSelectJobOrder(jo)} style={{ cursor: 'pointer', flex: 1 }}>
                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', marginBottom: '4px' }}>{jo.perusahaan}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px' }}>
                                            <Briefcase size={12} /> {jo.bidang}
                                            {jo.program && <><span style={{color:'#cbd5e1'}}>|</span> <span style={{fontWeight: 700}}>{jo.program}</span></>}
                                            {jo.durasi_kontrak && <><span style={{color:'#cbd5e1'}}>|</span> ⏳ {jo.durasi_kontrak} Bln</>}
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === jo.id ? null : jo.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                        <MoreVertical size={20} />
                                    </button>
                                    {activeDropdown === jo.id && (
                                        <div style={{ ...styles.dropdownContainer, right: '15px', top: '40px' }}>
                                            <button onClick={(e) => { e.stopPropagation(); window.open(`/print-laporan-kaisha/${jo.id}`, '_blank'); setActiveDropdown(null); }} style={{ ...styles.dropdownItemS, color: brandNavy }}><FileText size={16} /> Cetak Laporan</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteJobOrder(jo.id, jo.perusahaan); }} style={{ ...styles.dropdownItemS, color: '#ef4444' }}><Trash2 size={16} /> Hapus Job Order</button>
                                        </div>
                                    )}
                                </div>
                                <div onClick={() => onSelectJobOrder(jo)} style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={tagS(jo.status)}>{jo.status}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>
                                        <span>Progress Kuota</span><span>{jo.terisi} / {jo.kuota} Peserta</span>
                                    </div>
                                    <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : '#10b981', height: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MODAL TAMBAH JOB ORDER */}
            {isJobOrderModalOpen && (
                <div style={styles.modalOverlay}>
                    <form onSubmit={handleAddJobOrder} style={{ background: 'white', borderRadius: '20px', width: '700px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ background: brandNavy, padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'white', fontWeight: 900 }}>Tambah Job Order Baru</h2>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>Publikasikan kebutuhan tenaga kerja Kaisha</p>
                            </div>
                            <button type="button" onClick={() => setIsJobOrderModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={22} /></button>
                        </div>
                        
                        <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={styles.lb}>ID Job Order</label>
                                <input style={styles.inp} required value={newJobOrder.job_id} onChange={(e) => setNewJobOrder({ ...newJobOrder, job_id: e.target.value })} />
                            </div>
                            
                            <div>
                                <label style={styles.lb}>Nama Perusahaan (Kaisha) *</label>
                                <input style={styles.inp} required placeholder="Contoh: TOYOTA CORP" value={newJobOrder.perusahaan} onChange={(e) => setNewJobOrder({ ...newJobOrder, perusahaan: e.target.value })} />
                            </div>
                            
                            <div>
                                <label style={{...styles.lb, color: '#10b981'}}>Program Kaisha *</label>
                                <select style={{...styles.inp, border: '2px solid #a7f3d0'}} required value={newJobOrder.program} onChange={(e) => setNewJobOrder({ ...newJobOrder, program: e.target.value })}>
                                    <option value="">-- Pilih Program --</option>
                                    <option value="Pemagangan (Jisshusei)">Pemagangan (Jisshusei)</option>
                                    <option value="Tokutei Ginou (TG)">Tokutei Ginou (TG)</option>
                                    <option value="Engineering (Gijinkoku)">Engineering (Gijinkoku)</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label style={{...styles.lb, color: '#f59e0b'}}><Clock size={12} style={{display:'inline', marginBottom:'-2px'}}/> Durasi Kontrak (Bulan) *</label>
                                <input style={{...styles.inp, border: '2px solid #fde68a'}} type="number" required min="1" placeholder="Cth: 36, 60..." value={newJobOrder.durasi_kontrak} onChange={(e) => setNewJobOrder({ ...newJobOrder, durasi_kontrak: e.target.value })} />
                            </div>
                            
                            <div>
                                <label style={styles.lb}>Bidang / Jenis Job *</label>
                                <select style={styles.inp} required value={newJobOrder.bidang} onChange={(e) => setNewJobOrder({ ...newJobOrder, bidang: e.target.value })}>
                                    <option value="">-- Pilih Bidang --</option>
                                    {masterDropdowns.bidang.map((b, idx) => {
                                        const namaVal = b.nama_bidang || b.bidang || b.nama || Object.values(b)[1];
                                        return <option key={`bidang-${idx}`} value={namaVal}>{namaVal}</option>;
                                    })}
                                </select>
                            </div>

                            <div>
                                <label style={styles.lb}>Nama Kumiai (Pengawas) *</label>
                                <select style={styles.inp} required value={newJobOrder.kumiai} onChange={(e) => setNewJobOrder({ ...newJobOrder, kumiai: e.target.value })}>
                                    <option value="">-- Pilih Kumiai --</option>
                                    {masterDropdowns.kumiai.map((k, idx) => {
                                        const namaVal = k.nama_kumiai || k.kumiai || k.nama || Object.values(k)[1];
                                        return <option key={`kumiai-${idx}`} value={namaVal}>{namaVal}</option>;
                                    })}
                                </select>
                            </div>

                            <div>
                                <label style={{...styles.lb, color: '#ec4899'}}>Kuota Dibutuhkan *</label>
                                <input style={{...styles.inp, fontSize: '1.2rem', fontWeight: 800, border: '2px solid #fbcfe8', color: '#be185d'}} type="number" required min="1" value={newJobOrder.kuota} onChange={(e) => setNewJobOrder({ ...newJobOrder, kuota: parseInt(e.target.value) })} />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={styles.lb}>Status Job Order</label>
                                <select style={styles.inp} value={newJobOrder.status} onChange={(e) => setNewJobOrder({ ...newJobOrder, status: e.target.value })}>
                                    <option value="OPEN">OPEN (Recruiting)</option>
                                    <option value="PENUH">PENUH (Full)</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={styles.lb}>Catatan / Persyaratan (Opsional)</label>
                                <textarea style={{...styles.inp, resize: 'vertical'}} rows="2" value={newJobOrder.catatan} onChange={(e) => setNewJobOrder({ ...newJobOrder, catatan: e.target.value })} placeholder="Cth: Butuh Laki-laki usia maks 25th..."></textarea>
                            </div>
                        </div>

                        <div style={{ padding: '20px 25px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsJobOrderModalOpen(false)} style={styles.cancelBtn}>Batal</button>
                            <button type="submit" disabled={isSubmittingJO} style={{ padding: '12px 25px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: isSubmittingJO ? 'not-allowed' : 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isSubmittingJO ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Publikasi Job Order</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}