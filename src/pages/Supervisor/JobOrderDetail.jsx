import React, { useState, useEffect } from 'react';
import { supervisorService } from '../../services/supervisorService'; 
import { ArrowLeft, Printer, Edit, Trash2, UserCheck, X, Building2, Search, UserPlus, CheckCircle2, Loader2, Briefcase, Save } from 'lucide-react';

// IMPORT STYLES SENTRAL
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

const cleanStr = (str) => str ? String(str).trim() : '';

const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('id-ID', options);
};

const toInputFormat = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

export default function JobOrderDetail({ jobOrder, onBack }) {
    const [localJobOrder, setLocalJobOrder] = useState(jobOrder);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [masterBidang, setMasterBidang] = useState([]); 
    const [masterKumiai, setMasterKumiai] = useState([]); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [selectionData, setSelectionData] = useState({ status: '', notes: '' });

    const [isEditJobOpen, setIsEditJobOpen] = useState(false);
    const [editJobForm, setEditJobForm] = useState({});

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (jobOrder && jobOrder.id) {
            setLocalJobOrder(jobOrder);
            fetchParticipants();
            fetchMasterDropdowns(); 
        }
    }, [jobOrder]);

    const fetchMasterDropdowns = async () => {
        try {
            const dropdowns = await supervisorService.getMasterDropdowns();
            setMasterBidang(dropdowns.bidang);
            setMasterKumiai(dropdowns.kumiai);
        } catch (err) { console.error(err); }
    };

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const data = await supervisorService.getJobOrderParticipants(localJobOrder.perusahaan);
            setParticipants(data);
        } catch (error) { console.error("Gagal memuat peserta:", error); } finally { setLoading(false); }
    };

    const fetchAvailableStudents = async () => {
        try {
            const validStudents = await supervisorService.getAvailableStudentsForJob();
            setAvailableStudents(validStudents);
        } catch (error) { console.error("Gagal memuat kandidat:", error); }
    };

    const openAddModal = () => {
        fetchAvailableStudents();
        setSelectedStudentIds([]);
        setSearchTerm('');
        setIsAddModalOpen(true);
    };

    const toggleStudentSelection = (id) => {
        setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]);
    };

    const handleAddKandidat = async () => {
        if (selectedStudentIds.length === 0) return alert("Pilih minimal 1 kandidat!");
        
        const totalNanti = participants.length + selectedStudentIds.length;
        if (totalNanti > localJobOrder.kuota) {
            if (!window.confirm(`Peringatan: Jumlah kandidat (${totalNanti}) akan melebihi kuota Job Order (${localJobOrder.kuota}). Lanjutkan?`)) return;
        }

        setIsSubmitting(true);
        try {
            await supervisorService.addCandidatesToJob(selectedStudentIds, localJobOrder.id, localJobOrder.perusahaan, totalNanti);
            
            alert(`${selectedStudentIds.length} Kandidat berhasil ditambahkan ke tahap PRAMENSETSU!`);
            setIsAddModalOpen(false);
            setLocalJobOrder(prev => ({...prev, terisi: totalNanti}));
            fetchParticipants();
        } catch (error) { alert("Gagal menambahkan kandidat: " + error.message); } finally { setIsSubmitting(false); }
    };

    const handleDeleteParticipant = async (participantId, namaLengkap) => {
        if (!window.confirm(`Keluarkan ${namaLengkap} dari Job Order ini?`)) return;
        try {
            const totalSekarang = Math.max(0, participants.length - 1);
            await supervisorService.removeCandidateFromJob(participantId, localJobOrder.id, totalSekarang);

            setLocalJobOrder(prev => ({...prev, terisi: totalSekarang}));
            fetchParticipants();
        } catch (err) { alert("Gagal menghapus peserta."); }
    };

    const getJurusanTerakhir = (historyArray) => {
        const cleanArr = typeof historyArray === 'string' ? JSON.parse(historyArray || '[]') : (historyArray || []);
        if (!Array.isArray(cleanArr) || cleanArr.length === 0) return '-';
        const lastEdu = cleanArr[cleanArr.length - 1];
        return lastEdu.jurusan || lastEdu.nama_sekolah || '-';
    };

    const filteredCandidates = availableStudents.filter(s => 
        (s.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.minat_bidang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.asal_sekolah || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getJurusanTerakhir(s.pendidikan_history).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleQuickStatusUpdate = async (newStatus) => {
        try {
            await supervisorService.updateJobOrderStatusQuick(localJobOrder.id, newStatus);
            setLocalJobOrder({ ...localJobOrder, status: newStatus });
        } catch (err) { alert(`Gagal update status: ${err.message}`); }
    };

    const handleUpdateJobOrder = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                job_id: editJobForm.job_id,
                perusahaan: editJobForm.perusahaan,
                bidang: editJobForm.bidang,
                kumiai: editJobForm.kumiai,
                kuota: editJobForm.kuota,
                status: editJobForm.status,
                catatan: editJobForm.catatan,
                tanggal_recruiting: editJobForm.tanggal_recruiting ? new Date(editJobForm.tanggal_recruiting).toISOString() : null,
                tanggal_pelatihan: editJobForm.tanggal_pelatihan ? new Date(editJobForm.tanggal_pelatihan).toISOString() : null,
                tanggal_wawancara: editJobForm.tanggal_wawancara ? new Date(editJobForm.tanggal_wawancara).toISOString() : null,
                tanggal_selesai: editJobForm.tanggal_selesai ? new Date(editJobForm.tanggal_selesai).toISOString() : null,
                updated_at: new Date()
            };

            await supervisorService.updateJobOrderDetailFull(localJobOrder.id, payload);
            
            alert('Data Job Order berhasil diperbarui!');
            setLocalJobOrder({ ...localJobOrder, ...payload }); 
            setIsEditJobOpen(false); 
        } catch (err) { alert(`Gagal memperbarui: ${err.message}`); } finally { setIsSubmitting(false); }
    };

    const openModalSeleksi = (participant) => {
        setSelectedParticipant(participant);
        setSelectionData({ status: participant?.status_akhir || '', notes: participant?.catatan || '' });
        setIsModalOpen(true);
    };

    const handleSaveSeleksi = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let tahapBaru = selectedParticipant.tahap_sekarang;
            let payloadUpdate = {
                status_akhir: selectionData.status,
                catatan: selectionData.notes,
                updated_at: new Date()
            };

            let isFailed = false;
            let totalSekarang = participants.length;

            if (selectionData.status === 'LULUS') {
                tahapBaru = 'MATCHED';
                payloadUpdate.tahap_sekarang = tahapBaru;
                payloadUpdate.perusahaan_tujuan = localJobOrder.perusahaan;
            } else if (selectionData.status === 'TIDAK LULUS' || selectionData.status === 'CANCEL') {
                tahapBaru = 'AVAILABLE';
                payloadUpdate.tahap_sekarang = tahapBaru;
                payloadUpdate.perusahaan_tujuan = null; 
                isFailed = true;
                totalSekarang = Math.max(0, participants.length - 1);
            } else {
                payloadUpdate.tahap_sekarang = tahapBaru;
            }

            await supervisorService.saveCandidateSelection(selectedParticipant.id, localJobOrder.id, payloadUpdate, isFailed, totalSekarang);
            
            if (isFailed) setLocalJobOrder(prev => ({...prev, terisi: totalSekarang}));

            alert('Hasil seleksi berhasil disimpan!');
            setIsModalOpen(false);
            fetchParticipants(); 
        } catch (err) { alert(`Gagal menyimpan: ${err.message}`); } finally { setIsSubmitting(false); }
    };

    const getBadgeStyle = (status) => {
        const s = cleanStr(status).toUpperCase();
        if (s.includes('LULUS') && !s.includes('TIDAK')) return { bg: '#dcfce7', text: '#166534', icon: '✅' }; 
        if (s.includes('TIDAK LULUS')) return { bg: '#fee2e2', text: '#991b1b', icon: '❌' }; 
        if (s.includes('CADANGAN')) return { bg: '#fef3c7', text: '#92400e', icon: '🤷‍♂️' }; 
        return { bg: '#f1f5f9', text: '#64748b', icon: '⏳' }; 
    };

    // LOCAL STYLES UNTUK DETAIL JOB (Dipindah dari bawah ke konstanta agar bersih)
    const tdLabel = { width: '240px', padding: '14px 0', fontWeight: 800, color: '#64748b', fontSize: '1rem' };
    const tdValue = { padding: '14px 0', color: '#0f172a', fontWeight: 900, fontSize: '1.05rem' };
    const btnStatus = { background: 'white', border: '1px solid #cbd5e1', padding: '8px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 900, color: '#3b82f6', cursor: 'pointer', transition: '0.2s' };
    const btnSidebar = { width: '100%', padding: '14px 20px', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', transition: '0.2s' };

    if (!localJobOrder) { return <div style={{ padding: '50px', textAlign: 'center', background: '#f1f5f9' }}><h2>Memuat data...</h2></div>; }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
            
            <style>{`@keyframes pulse-blink { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.98); } 100% { opacity: 1; transform: scale(1); } } .status-blink { animation: pulse-blink 1.5s ease-in-out infinite; display: inline-block; }`}</style>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '20px', color: '#1e293b', borderRadius: '15px', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <button onClick={onBack} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '10px', transition: '0.2s' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Manajemen Job Detail</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: brandNavy }}>{localJobOrder?.perusahaan || '-'}</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: '320px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '100%', height: '220px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#3b82f6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Building2 size={64} color="#93c5fd" />
                            <span style={{ fontSize: '0.9rem', marginTop: '10px', fontWeight: 800 }}>Klien LPK UJC</span>
                        </div>
                    </div>
                    <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={openAddModal} style={{...btnSidebar, background: '#10b981', color: 'white'}}><UserPlus size={18}/> Tambah Kandidat</button>
                        <button onClick={() => { setEditJobForm({ ...localJobOrder, tanggal_recruiting: toInputFormat(localJobOrder.tanggal_recruiting), tanggal_pelatihan: toInputFormat(localJobOrder.tanggal_pelatihan), tanggal_wawancara: toInputFormat(localJobOrder.tanggal_wawancara), tanggal_selesai: toInputFormat(localJobOrder.tanggal_selesai) }); setIsEditJobOpen(true); }} style={{...btnSidebar, background: brandNavy, color: 'white'}}>
                            <Edit size={18}/> Ubah Detail Job
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '550px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '30px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '25px', marginTop: 0 }}>I. DETAIL JOB ORDER</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '50px' }}>
                        <tbody>
                            <tr><td style={tdLabel}>ID Job Order</td><td style={{width:'15px', color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.job_id || '-'}</td></tr>
                            <tr><td style={tdLabel}>Nama Perusahaan</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.perusahaan || '-'}</td></tr>
                            <tr><td style={tdLabel}>Jenis Job</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.bidang || '-'}</td></tr>
                            <tr><td style={tdLabel}>Kumiai</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.kumiai || '-'}</td></tr>
                            <tr><td style={tdLabel}>Jumlah Peserta Dibutuhkan</td><td style={{color:'#94a3b8'}}>:</td><td style={{...tdValue, color: brandNavy, fontSize: '1.2rem'}}>{localJobOrder?.kuota || 0} Peserta</td></tr>
                            
                            <tr><td style={tdLabel}>Tanggal Recruiting</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{formatDateTime(localJobOrder?.tanggal_recruiting)}</td></tr>
                            <tr><td style={tdLabel}>Tanggal Pelatihan</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{formatDateTime(localJobOrder?.tanggal_pelatihan)}</td></tr>
                            <tr><td style={tdLabel}>Tanggal Wawancara</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{formatDateTime(localJobOrder?.tanggal_wawancara)}</td></tr>
                            <tr><td style={tdLabel}>Tanggal Selesai</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{formatDateTime(localJobOrder?.tanggal_selesai)}</td></tr>

                            <tr><td style={tdLabel}>Status Workflow</td><td style={{color:'#94a3b8'}}>:</td>
                                <td style={tdValue}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span className="status-blink" style={{ background: '#3b82f6', color: 'white', padding: '6px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}>{localJobOrder?.status || 'AKTIF'}</span>
                                        <span style={{ color: '#cbd5e1', margin: '0 5px' }}>|</span>
                                        <button onClick={() => handleQuickStatusUpdate('RECRUITING')} style={btnStatus}>🕵🏽 RECRUITING</button>
                                        <button onClick={() => handleQuickStatusUpdate('CETAK')} style={btnStatus}>🖨️ CETAK</button>
                                        <button onClick={() => handleQuickStatusUpdate('PELATIHAN')} style={btnStatus}>💪🏽 PELATIHAN</button>
                                        <button onClick={() => handleQuickStatusUpdate('WAWANCARA')} style={btnStatus}>📢 WAWANCARA</button>
                                        <button onClick={() => handleQuickStatusUpdate('SELESAI')} style={{...btnStatus, background: '#10b981', color: 'white', borderColor: '#10b981'}}>🏆 SELESAI</button>
                                        <button onClick={() => handleQuickStatusUpdate('CANCEL')} style={{...btnStatus, color: '#ef4444'}}>🚫 CANCEL</button>
                                    </div>
                                </td>
                            </tr>
                            <tr><td style={tdLabel}>Catatan</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.catatan || '-'}</td></tr>
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#334155' }}>II. DATA PESERTA ({participants?.length || 0}/{localJobOrder?.kuota || 0})</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => window.open(`/print-laporan-kaisha/${localJobOrder.id}`, '_blank')} style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, cursor: 'pointer' }}>
                                <Printer size={18}/> Cetak Laporan Kaisha
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontWeight: 600 }}><Loader2 className="animate-spin" size={40} style={{margin:'0 auto'}}/></div>
                    ) : (
                        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <table style={styles.tableS}>
                                <thead style={styles.theadS}>
                                    <tr>
                                        <th style={styles.thStyle}>No</th>
                                        <th style={styles.thStyle}>Nama Peserta</th>
                                        <th style={styles.thStyle}>JK</th>
                                        <th style={styles.thStyle}>No. HP</th>
                                        <th style={styles.thStyle}>Status Seleksi</th>
                                        <th style={styles.thStyle}>Catatan</th>
                                        <th style={{...styles.thStyle, textAlign:'center'}}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!participants || participants.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600, fontSize: '1.1rem' }}>Belum ada peserta yang dimasukkan ke Job Order ini.</td></tr>
                                    ) : participants.map((p, idx) => {
                                        const badge = getBadgeStyle(p?.status_akhir);
                                        const namaLengkap = p?.nama_lengkap || 'Data Tidak Ditemukan';
                                        const foto = supervisorService.getStudentPhotoUrl(p?.id);
                                        const jk = p?.jenis_kelamin === 'Laki-Laki' || p?.jenis_kelamin === 'L' ? 'L' : p?.jenis_kelamin === 'Perempuan' || p?.jenis_kelamin === 'P' ? 'P' : '-';
                                        
                                        return (
                                            <tr key={p.id} style={styles.trS}>
                                                <td style={styles.tdStyle}>{idx + 1}</td>
                                                <td style={styles.tdStyle}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                            <img src={foto} alt="foto" onError={(e) => e.target.style.display='none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>{namaLengkap}</div>
                                                    </div>
                                                </td>
                                                <td style={styles.tdStyle}>{jk}</td>
                                                <td style={styles.tdStyle}>{p?.telepon || '-'}</td>
                                                <td style={styles.tdStyle}><span style={{ background: badge.bg, color: badge.text, padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 900, whiteSpace: 'nowrap' }}>{badge.icon} {p?.status_akhir || 'PROSES'}</span></td>
                                                <td style={styles.tdStyle}><div style={{ color: '#64748b', fontSize: '0.9rem' }}>{p?.catatan || '-'}</div></td>
                                                <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                        <button onClick={() => openModalSeleksi(p)} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)' }}><UserCheck size={16}/> Seleksi</button>
                                                        <button onClick={() => handleDeleteParticipant(p.id, namaLengkap)} style={styles.btnDel} title="Hapus dari Job Order"><Trash2 size={18}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL PILIH KANDIDAT ── */}
            {isAddModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modalContent, width: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '25px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontWeight: 900, color: '#1e293b', fontSize: '1.6rem' }}>Pilih Kandidat Tersedia</h2>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Centang siswa nganggur (Available) yang akan dimasukkan ke <b>{localJobOrder.perusahaan}</b>.</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} style={styles.closeBtn}><X size={20} color="#64748b"/></button>
                        </div>

                        <div style={{ padding: '20px 30px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                                <input type="text" placeholder="Ketik Minat Bidang, jurusan, atau nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px' }} />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 30px' }}>
                            {filteredCandidates.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontWeight: 600, fontSize: '1.2rem' }}>Tidak ada kandidat nganggur (Available) yang cocok.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                        <tr>
                                            <th style={{...styles.thStyle, width: '50px'}}>Pilih</th>
                                            <th style={styles.thStyle}>Nama Kandidat</th>
                                            <th style={styles.thStyle}>Minat Bidang</th>
                                            <th style={styles.thStyle}>Latar Belakang / Pendidikan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCandidates.map(c => {
                                            const isSelected = selectedStudentIds.includes(c.id);
                                            const jurusan = getJurusanTerakhir(c.pendidikan_history);
                                            return (
                                                <tr key={c.id} onClick={() => toggleStudentSelection(c.id)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'transparent', transition: '0.2s' }}>
                                                    <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                                        <div style={{ width: '26px', height: '26px', borderRadius: '6px', border: `2px solid ${isSelected ? brandNavy : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? brandNavy : 'white' }}>
                                                            {isSelected && <CheckCircle2 size={18} color="white" />}
                                                        </div>
                                                    </td>
                                                    <td style={styles.tdStyle}><div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>{c.nama_lengkap}</div><div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Tahap: <b>{c.tahap_sekarang || '-'}</b> | JK: {c.jenis_kelamin}</div></td>
                                                    <td style={styles.tdStyle}><div style={{ fontSize: '0.95rem', color: '#10b981', fontWeight: 900 }}>🎯 {c.minat_bidang || 'Belum Diset'}</div></td>
                                                    <td style={styles.tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569', fontWeight: 800 }}><Briefcase size={16}/> {jurusan}</div><div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{c.asal_sekolah || '-'}</div></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ padding: '20px 30px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                            <div style={{ fontWeight: 800, color: '#475569', fontSize: '1.1rem' }}>Terpilih: <span style={{ color: brandNavy, fontSize: '1.5rem', fontWeight: 900 }}>{selectedStudentIds.length}</span> Siswa</div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button onClick={() => setIsAddModalOpen(false)} style={styles.cancelBtn}>Batal</button>
                                <button onClick={handleAddKandidat} disabled={isSubmitting} style={styles.btnPrimary}>
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Masukkan ke Job Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL EDIT JOB ── */}
            {isEditJobOpen && (
                <div style={styles.modalOverlay}>
                    <form onSubmit={handleUpdateJobOrder} style={{...styles.modalContent, width: '800px', padding: 0}}>
                        <div style={{ padding: '30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10, borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#1e293b' }}>Ubah Data Job Order</h2>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Perbarui informasi detail untuk Job Kaisha.</p>
                            </div>
                            <button type="button" onClick={() => setIsEditJobOpen(false)} style={styles.closeBtn}><X size={20} color="#64748b"/></button>
                        </div>
                        
                        <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div><label style={styles.lb}>ID Job Order</label><input style={styles.inp} required value={editJobForm.job_id || ''} onChange={(e) => setEditJobForm({...editJobForm, job_id: e.target.value})} /></div>
                            <div><label style={styles.lb}>Nama Perusahaan</label><input style={styles.inp} required value={editJobForm.perusahaan || ''} onChange={(e) => setEditJobForm({...editJobForm, perusahaan: e.target.value})} /></div>
                            
                            <div>
                                <label style={styles.lb}>Bidang / Jenis Job</label>
                                <select required style={styles.inp} value={editJobForm.bidang || ''} onChange={(e) => setEditJobForm({...editJobForm, bidang: e.target.value})}>
                                    <option value="">-- Pilih Bidang Pekerjaan --</option>
                                    {masterBidang.map((b, i) => {
                                        const val = b.nama_bidang || b.bidang || b.nama || Object.values(b)[1];
                                        return <option key={`eb-${i}`} value={val}>{val}</option>;
                                    })}
                                </select>
                            </div>

                            <div>
                                <label style={styles.lb}>Nama Kumiai</label>
                                <select required style={styles.inp} value={editJobForm.kumiai || ''} onChange={(e) => setEditJobForm({...editJobForm, kumiai: e.target.value})}>
                                    <option value="">-- Pilih Kumiai --</option>
                                    {masterKumiai.map((k, i) => {
                                        const val = k.nama_kumiai || k.kumiai || k.nama || Object.values(k)[1];
                                        return <option key={`ek-${i}`} value={val}>{val}</option>;
                                    })}
                                </select>
                            </div>

                            <div><label style={styles.lb}>Kuota Peserta</label><input style={styles.inp} type="number" required min="1" value={editJobForm.kuota || 0} onChange={(e) => setEditJobForm({...editJobForm, kuota: parseInt(e.target.value)})} /></div>
                            <div>
                                <label style={styles.lb}>Status Utama Sistem</label>
                                <select style={styles.inp} value={editJobForm.status || 'AKTIF'} onChange={(e) => setEditJobForm({...editJobForm, status: e.target.value})}>
                                    <option value="AKTIF">AKTIF</option><option value="RECRUITING">RECRUITING</option><option value="CETAK">CETAK</option>
                                    <option value="PELATIHAN">PELATIHAN</option><option value="WAWANCARA">WAWANCARA</option><option value="SELESAI">SELESAI</option><option value="CANCEL">CANCEL</option>
                                </select>
                            </div>
                            
                            <div><label style={styles.lb}>Tanggal Recruiting</label><input type="datetime-local" style={styles.inp} value={editJobForm.tanggal_recruiting || ''} onChange={(e) => setEditJobForm({...editJobForm, tanggal_recruiting: e.target.value})} /></div>
                            <div><label style={styles.lb}>Tanggal Pelatihan</label><input type="datetime-local" style={styles.inp} value={editJobForm.tanggal_pelatihan || ''} onChange={(e) => setEditJobForm({...editJobForm, tanggal_pelatihan: e.target.value})} /></div>
                            <div><label style={styles.lb}>Tanggal Wawancara</label><input type="datetime-local" style={styles.inp} value={editJobForm.tanggal_wawancara || ''} onChange={(e) => setEditJobForm({...editJobForm, tanggal_wawancara: e.target.value})} /></div>
                            <div><label style={styles.lb}>Tanggal Selesai</label><input type="datetime-local" style={styles.inp} value={editJobForm.tanggal_selesai || ''} onChange={(e) => setEditJobForm({...editJobForm, tanggal_selesai: e.target.value})} /></div>

                            <div style={{ gridColumn: '1 / -1' }}><label style={styles.lb}>Catatan Khusus</label><textarea style={{...styles.inp, resize: 'vertical'}} rows="2" value={editJobForm.catatan || ''} onChange={(e) => setEditJobForm({...editJobForm, catatan: e.target.value})}></textarea></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', position: 'sticky', bottom: 0, background: '#f8fafc', padding: '25px 30px', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                            <button type="button" onClick={() => setIsEditJobOpen(false)} style={styles.cancelBtn}>Batal</button>
                            <button type="submit" disabled={isSubmitting} style={styles.btnPrimary}>
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Simpan Perubahan</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── MODAL HASIL SELEKSI ── */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modalContent, padding: 0, width: '550px'}}>
                        <div style={{ background: '#8b5cf6', color: 'white', padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>Input Hasil Seleksi</h2>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Kandidat: {selectedParticipant?.nama_lengkap || '-'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
                        </div>
                        <form onSubmit={handleSaveSeleksi}>
                            <div style={{ padding: '30px' }}>
                                <div style={{ marginBottom: '25px' }}>
                                    <label style={styles.lb}>Keputusan / Hasil Akhir</label>
                                    <select required value={selectionData.status} onChange={(e) => setSelectionData({...selectionData, status: e.target.value})} style={{...styles.inp, fontSize: '1.2rem', fontWeight: 900, padding: '15px'}}>
                                        <option value="">-- Tentukan Hasil --</option>
                                        <option value="LULUS">✅ LULUS (MATCHED)</option>
                                        <option value="TIDAK LULUS">❌ TIDAK LULUS</option>
                                        <option value="CADANGAN">🤷‍♂️ CADANGAN</option>
                                        <option value="CANCEL">🚫 CANCEL</option>
                                    </select>
                                </div>
                                <div><label style={styles.lb}>Catatan Evaluasi (Opsional)</label><textarea rows="3" value={selectionData.notes} onChange={(e) => setSelectionData({...selectionData, notes: e.target.value})} style={{...styles.inp, resize: 'vertical', fontSize: '1rem'}} placeholder="Kelebihan, kekurangan, alasan gagal..."></textarea></div>
                            </div>
                            <div style={{ padding: '25px 30px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '15px', background: '#f8fafc', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Batal</button>
                                <button type="submit" disabled={isSubmitting} style={{...styles.btnPrimary, background: '#8b5cf6'}}>
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Simpan Hasil'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}