import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    ArrowLeft, Printer, PlayCircle, Edit, Trash2, 
    MoreVertical, UserCheck, Users, X, Building2, Calendar
} from 'lucide-react';

const cleanStr = (str) => str ? String(str).trim() : '';

// Helper untuk format tanggal tampil
const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('id-ID', options);
};

// Helper untuk input datetime-local form
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
    
    // State Modal Seleksi
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [selectionData, setSelectionData] = useState({ status: '', notes: '' });

    // State Modal Edit Job
    const [isEditJobOpen, setIsEditJobOpen] = useState(false);
    const [editJobForm, setEditJobForm] = useState({});

    useEffect(() => {
        if (jobOrder && jobOrder.id) {
            setLocalJobOrder(jobOrder);
            fetchParticipants();
        }
    }, [jobOrder]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('job_order_participants')
                .select(`
                    id, status_seleksi, catatan,
                    students ( id, nama_lengkap, jenis_kelamin, telepon, pas_foto )
                `)
                .eq('job_order_id', jobOrder.id);

            if (error) {
                console.warn("Tabel job_order_participants belum siap.", error);
                setParticipants([]);
            } else {
                setParticipants(data || []);
            }
        } catch (err) {
            console.error("Gagal memuat peserta:", err);
            setParticipants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStatusUpdate = async (newStatus) => {
        try {
            const { error } = await supabase
                .from('job_orders')
                .update({ status: newStatus, updated_at: new Date() })
                .eq('id', localJobOrder.id);

            if (error) throw error;
            setLocalJobOrder({ ...localJobOrder, status: newStatus });
        } catch (err) {
            console.error("Gagal update status:", err);
            alert(`Gagal update status: ${err.message}`);
        }
    };

    const handleUpdateJobOrder = async (e) => {
        e.preventDefault();
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

            const { error } = await supabase.from('job_orders').update(payload).eq('id', localJobOrder.id);
            if (error) throw error;
            
            alert('Data Job Order berhasil diperbarui!');
            setLocalJobOrder({ ...localJobOrder, ...payload }); 
            setIsEditJobOpen(false); 
        } catch (err) {
            console.error("Gagal update Job Order:", err);
            alert(`Gagal memperbarui: ${err.message}`);
        }
    };

    const handleDeleteParticipant = async (participantId, namaLengkap) => {
        if (!window.confirm(`Hapus ${namaLengkap} dari Job Order ini?`)) return;
        try {
            const { error } = await supabase.from('job_order_participants').delete().eq('id', participantId);
            if (error) throw error;
            alert("Peserta berhasil dihapus.");
            fetchParticipants();
        } catch (err) {
            alert("Gagal menghapus peserta.");
        }
    };

    const openModalSeleksi = (participant) => {
        setSelectedParticipant(participant);
        setSelectionData({ status: participant?.status_seleksi || '', notes: participant?.catatan || '' });
        setIsModalOpen(true);
    };

    const handleSaveSeleksi = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('job_order_participants')
                .update({ status_seleksi: selectionData.status, catatan: selectionData.notes, updated_at: new Date() })
                .eq('id', selectedParticipant.id);

            if (error) throw error;
            alert('Hasil seleksi berhasil disimpan!');
            setIsModalOpen(false);
            fetchParticipants(); 
        } catch (err) {
            alert(`Gagal menyimpan: ${err.message}`);
        }
    };

    const getBadgeStyle = (status) => {
        const s = cleanStr(status).toUpperCase();
        if (s.includes('LULUS') && !s.includes('TIDAK')) return { bg: '#dcfce7', text: '#166534', icon: '✅' }; 
        if (s.includes('TIDAK LULUS')) return { bg: '#fee2e2', text: '#991b1b', icon: '❌' }; 
        if (s.includes('CADANGAN')) return { bg: '#fef3c7', text: '#92400e', icon: '🤷‍♂️' }; 
        return { bg: '#f1f5f9', text: '#64748b', icon: '⏳' }; 
    };

    if (!localJobOrder) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', background: '#f1f5f9', height: '100vh' }}>
                <h2>Memuat data...</h2>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── CSS ANIMASI KEDIP (PULSE BLINK) ── */}
            <style>{`
                @keyframes pulse-blink {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.98); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .status-blink {
                    animation: pulse-blink 1.5s ease-in-out infinite;
                    display: inline-block;
                }
            `}</style>

            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '20px', color: '#1e293b', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                <button onClick={onBack} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px' }}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{localJobOrder?.perusahaan || 'Detail Job Order'}</div>
            </div>

            <div style={{ padding: '25px', display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                <div style={{ width: '300px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '100%', height: '200px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Building2 size={48} color="#cbd5e1" />
                            <span style={{ fontSize: '0.8rem', marginTop: '10px', fontWeight: 600 }}>No Image Available</span>
                        </div>
                    </div>
                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button style={{...btnSidebar, background: '#10b981', color: 'white'}}><PlayCircle size={18}/> Mulai Pilih Peserta</button>
                        
                        <button 
                            onClick={() => {
                                setEditJobForm({
                                    ...localJobOrder,
                                    tanggal_recruiting: toInputFormat(localJobOrder.tanggal_recruiting),
                                    tanggal_pelatihan: toInputFormat(localJobOrder.tanggal_pelatihan),
                                    tanggal_wawancara: toInputFormat(localJobOrder.tanggal_wawancara),
                                    tanggal_selesai: toInputFormat(localJobOrder.tanggal_selesai),
                                });
                                setIsEditJobOpen(true);
                            }} 
                            style={{...btnSidebar, background: '#3b82f6', color: 'white'}}
                        >
                            <Edit size={18}/> Ubah Data
                        </button>

                        <button style={{...btnSidebar, background: '#ef4444', color: 'white'}}><Trash2 size={18}/> Hapus Data</button>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '600px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '30px', border: '1px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>{localJobOrder?.perusahaan || '-'}</h1>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>I. DETAIL JOB ORDER</h3>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                        <tbody>
                            <tr><td style={tdLabel}>ID Job Order</td><td style={{width:'15px', color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.job_id || '-'}</td></tr>
                            <tr><td style={tdLabel}>Nama Perusahaan</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.perusahaan || '-'}</td></tr>
                            <tr><td style={tdLabel}>Jenis Job</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.bidang || '-'}</td></tr>
                            <tr><td style={tdLabel}>Kumiai</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.kumiai || '-'}</td></tr>
                            <tr><td style={tdLabel}>Jumlah Peserta Dibutuhkan</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{localJobOrder?.kuota || 0} Peserta</td></tr>
                            
                            <tr><td style={tdLabel}>Tanggal Recruiting</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{formatDateTime(localJobOrder?.tanggal_recruiting)}</td></tr>
                            <tr><td style={tdLabel}>Tanggal Pelatihan</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{formatDateTime(localJobOrder?.tanggal_pelatihan)}</td></tr>
                            <tr><td style={tdLabel}>Tanggal Wawancara</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{formatDateTime(localJobOrder?.tanggal_wawancara)}</td></tr>
                            <tr><td style={tdLabel}>Tanggal Selesai</td><td style={{color:'#94a3b8'}}>:</td><td style={tdValue}>{formatDateTime(localJobOrder?.tanggal_selesai)}</td></tr>

                            <tr><td style={tdLabel}>Status Workflow</td><td style={{color:'#94a3b8'}}>:</td>
                                <td style={tdValue}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        {/* ── STATUS UTAMA DENGAN KELAS KEDIP ── */}
                                        <span className="status-blink" style={{ background: '#3b82f6', color: 'white', padding: '6px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}>
                                            {localJobOrder?.status || 'AKTIF'}
                                        </span>
                                        
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#334155' }}>II. DATA PESERTA ({participants?.length || 0}/{localJobOrder?.kuota || 0})</h3>
                        <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}>
                            <Printer size={16}/> Cetak Presensi
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600 }}>Memuat daftar peserta...</div>
                    ) : (
                        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thStyle}>No</th>
                                        <th style={thStyle}>Nama Peserta</th>
                                        <th style={thStyle}>JK</th>
                                        <th style={thStyle}>No. HP</th>
                                        <th style={thStyle}>Status Seleksi</th>
                                        <th style={thStyle}>Catatan</th>
                                        <th style={{...thStyle, textAlign:'center'}}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!participants || participants.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontWeight: 500 }}>Belum ada peserta yang mendaftar ke Job Order ini.</td></tr>
                                    ) : participants.map((p, idx) => {
                                        const badge = getBadgeStyle(p?.status_seleksi);
                                        const namaLengkap = p?.students?.nama_lengkap || 'Data Tidak Ditemukan';
                                        const foto = p?.students?.pas_foto;
                                        const jk = p?.students?.jenis_kelamin === 'Laki-Laki' ? 'L' : p?.students?.jenis_kelamin === 'Perempuan' ? 'P' : '-';
                                        const telp = p?.students?.telepon || '-';

                                        return (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={tdStyle}>{idx + 1}</td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                            {foto ? (
                                                                <img src={foto} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><Users size={16}/></div>
                                                            )}
                                                        </div>
                                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{namaLengkap}</div>
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>{jk}</td>
                                                <td style={tdStyle}>{telp}</td>
                                                <td style={tdStyle}>
                                                    <span style={{ background: badge.bg, color: badge.text, padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                                        {badge.icon} {p?.status_seleksi || 'PROSES'}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}><div style={{ color: '#64748b', fontSize: '0.85rem' }}>{p?.catatan || '-'}</div></td>
                                                <td style={{...tdStyle, textAlign: 'center'}}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button onClick={() => openModalSeleksi(p)} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)' }}>
                                                            <UserCheck size={14}/> Seleksi
                                                        </button>
                                                        <button onClick={() => handleDeleteParticipant(p.id, namaLengkap)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Hapus dari Job Order">
                                                            <Trash2 size={16}/>
                                                        </button>
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

            {isEditJobOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleUpdateJobOrder} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px', position: 'sticky', top: '-30px', background: 'white', zIndex: 10 }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>Ubah Data Job Order</h2>
                            <button type="button" onClick={() => setIsEditJobOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}><X size={18}/></button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div><label style={labelForm}>ID Job Order</label><input style={inputForm} required value={editJobForm.job_id || ''} onChange={(e) => setEditJobForm({...editJobForm, job_id: e.target.value})} /></div>
                            <div><label style={labelForm}>Nama Perusahaan</label><input style={inputForm} required value={editJobForm.perusahaan || ''} onChange={(e) => setEditJobForm({...editJobForm, perusahaan: e.target.value})} /></div>
                            <div><label style={labelForm}>Bidang / Jenis Job</label><input style={inputForm} required value={editJobForm.bidang || ''} onChange={(e) => setEditJobForm({...editJobForm, bidang: e.target.value})} /></div>
                            <div><label style={labelForm}>Nama Kumiai</label><input style={inputForm} required value={editJobForm.kumiai || ''} onChange={(e) => setEditJobForm({...editJobForm, kumiai: e.target.value})} /></div>
                            <div><label style={labelForm}>Kuota</label><input style={inputForm} type="number" required min="1" value={editJobForm.kuota || 0} onChange={(e) => setEditJobForm({...editJobForm, kuota: parseInt(e.target.value)})} /></div>
                            <div><label style={labelForm}>Status Utama</label>
                                <select style={inputForm} value={editJobForm.status || 'AKTIF'} onChange={(e) => setEditJobForm({...editJobForm, status: e.target.value})}>
                                    <option value="AKTIF">AKTIF</option><option value="RECRUITING">RECRUITING</option><option value="CETAK">CETAK</option>
                                    <option value="PELATIHAN">PELATIHAN</option><option value="WAWANCARA">WAWANCARA</option><option value="SELESAI">SELESAI</option><option value="CANCEL">CANCEL</option>
                                </select>
                            </div>
                            
                            <div><label style={labelForm}>Tanggal Recruiting</label><input type="datetime-local" style={inputForm} value={editJobForm.tanggal_recruiting || ''} onChange={(e) => setEditJobForm({...editJobForm, tanggal_recruiting: e.target.value})} /></div>
                            <div><label style={labelForm}>Tanggal Pelatihan</label><input type="datetime-local" style={inputForm} value={editJobForm.tanggal_pelatihan || ''} onChange={(e) => setEditJobForm({...editJobForm, tanggal_pelatihan: e.target.value})} /></div>
                            <div><label style={labelForm}>Tanggal Wawancara</label><input type="datetime-local" style={inputForm} value={editJobForm.tanggal_wawancara || ''} onChange={(e) => setEditJobForm({...editJobForm, tanggal_wawancara: e.target.value})} /></div>
                            <div><label style={labelForm}>Tanggal Selesai</label><input type="datetime-local" style={inputForm} value={editJobForm.tanggal_selesai || ''} onChange={(e) => setEditJobForm({...editJobForm, tanggal_selesai: e.target.value})} /></div>

                            <div style={{ gridColumn: 'span 2' }}><label style={labelForm}>Catatan</label><textarea style={{...inputForm, resize: 'vertical'}} rows="2" value={editJobForm.catatan || ''} onChange={(e) => setEditJobForm({...editJobForm, catatan: e.target.value})}></textarea></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', position: 'sticky', bottom: '-30px', background: 'white', padding: '15px 0 0 0', borderTop: '1px solid #e2e8f0' }}>
                            <button type="button" onClick={() => setIsEditJobOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                            <button type="submit" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Simpan Perubahan</button>
                        </div>
                    </form>
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', width: '500px', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ background: '#8b5cf6', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>Seleksi: {selectedParticipant?.students?.nama_lengkap || '-'}</h5>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={22}/></button>
                        </div>
                        <form onSubmit={handleSaveSeleksi}>
                            <div style={{ padding: '25px' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={labelForm}>Hasil Seleksi</label>
                                    <select required value={selectionData.status} onChange={(e) => setSelectionData({...selectionData, status: e.target.value})} style={inputForm}>
                                        <option value="">-- PILIH HASIL --</option>
                                        <option value="LULUS">✅ LULUS</option>
                                        <option value="TIDAK LULUS">❌ TIDAK LULUS</option>
                                        <option value="CADANGAN">🤷‍♂️ CADANGAN</option>
                                        <option value="CANCEL">🚫 CANCEL</option>
                                    </select>
                                </div>
                                <div><label style={labelForm}>Catatan (Opsional)</label><textarea rows="3" value={selectionData.notes} onChange={(e) => setSelectionData({...selectionData, notes: e.target.value})} style={{...inputForm, resize: 'vertical'}}></textarea></div>
                            </div>
                            <div style={{ padding: '20px 25px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', color: '#64748b', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                                <button type="submit" style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>💾 Simpan Hasil</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputForm = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc', transition: 'border 0.2s' };
const btnSidebar = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem', transition: '0.2s' };
const btnStatus = { background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', cursor: 'pointer', transition: '0.2s' };
const tdLabel = { width: '220px', padding: '12px 0', fontWeight: 800, color: '#64748b', fontSize: '0.95rem' };
const tdValue = { padding: '12px 0', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' };
const thStyle = { padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px', verticalAlign: 'middle', fontSize: '0.95rem', color: '#334155' };