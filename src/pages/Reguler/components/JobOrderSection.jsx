import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Search, Plus, X, Building, Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORT STYLES & CONSTANTS
import { styles, brandNavy, actionBtn } from './dashboardStyles';

export default function JobOrderSection({ 
    jobOrders, 
    masterData, 
    onLogActivity, 
    currentUser, 
    setSelectedJobOrder, 
    onRefresh 
}) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddJOOpen, setIsAddJOOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joForm, setJoForm] = useState({ perusahaan: '', bidang: '', kumiai: '', kuota: 1, catatan: '' });

    // Filter pencarian Job Order
    const filteredJO = jobOrders.filter(j => 
        (j.perusahaan || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (j.bidang || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddJO = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { 
                perusahaan: joForm.perusahaan, 
                bidang: joForm.bidang, 
                kumiai: joForm.kumiai, 
                kuota: parseInt(joForm.kuota), 
                catatan: joForm.catatan, 
                status: 'OPEN', 
                created_by: currentUser?.id 
            };

            const { error } = await supabase.from('job_orders').insert([payload]);
            if (error) throw error;
            
            await onLogActivity(`Membuat Job Order baru: ${joForm.perusahaan}`); 
            alert("Job Order berhasil dipublikasi!"); 
            setIsAddJOOpen(false);
            setJoForm({ perusahaan: '', bidang: '', kumiai: '', kuota: 1, catatan: '' }); 
            if(onRefresh) onRefresh();
        } catch (err) { 
            alert(err.message); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const toggleStatus = async (job) => {
        const newStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        if (!window.confirm(`Ubah status Job Order ${job.perusahaan} menjadi ${newStatus}?`)) return;
        
        try {
            const { error } = await supabase.from('job_orders').update({ status: newStatus }).eq('id', job.id);
            if (error) throw error;
            if (onRefresh) onRefresh();
        } catch (error) { 
            alert(error.message); 
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ── HEADER ACTIONS ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                    <input 
                        type="text" 
                        placeholder="Cari perusahaan atau bidang..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        style={{ ...styles.inp, width: '300px', paddingLeft: '45px' }} 
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/master-kumiai')} style={{...styles.btnPrimary, background: '#8b5cf6'}}>
                        <Building size={18}/> Master Kumiai
                    </button>
                    <button onClick={() => navigate('/master-kaisha')} style={{...styles.btnPrimary, background: '#ec4899'}}>
                        <Building2 size={18}/> Master Kaisha
                    </button>
                    <button onClick={() => setIsAddJOOpen(true)} style={styles.btnPrimary}>
                        <Plus size={18}/> Tambah Job Order
                    </button>
                </div>
            </div>

            {/* ── TABLE ── */}
            <div style={styles.tableContainer}>
                <table style={styles.tableS}>
                    <thead style={styles.theadS}>
                        <tr>
                            <th style={styles.thStyle}>Perusahaan Jepang</th>
                            <th style={styles.thStyle}>Bidang Pekerjaan</th>
                            <th style={styles.thStyle}>Kuota</th>
                            <th style={styles.thStyle}>Status</th>
                            <th style={{...styles.thStyle, textAlign: 'center'}}>Aksi & Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredJO.length === 0 ? (
                            <tr><td colSpan="5" style={{padding:'40px', textAlign:'center', color:'#94a3b8', fontWeight:700}}>Belum ada data Job Order.</td></tr>
                        ) : filteredJO.map(j => (
                            <tr key={j.id} style={styles.trS}>
                                <td style={{...styles.tdStyle, fontWeight: 800, color: '#1e293b'}}>
                                    {j.perusahaan}
                                    <div style={{fontSize:'0.75rem', color:'#64748b', fontWeight: 600, marginTop: '2px'}}>{j.kumiai}</div>
                                </td>
                                <td style={styles.tdStyle}>{j.bidang}</td>
                                <td style={{...styles.tdStyle, fontWeight: 900, color: brandNavy}}>{j.kuota} Orang</td>
                                <td style={styles.tdStyle}>
                                    <span style={{ 
                                        ...styles.badgeS, 
                                        background: j.status === 'OPEN' ? '#dcfce7' : '#fee2e2', 
                                        color: j.status === 'OPEN' ? '#166534' : '#991b1b'
                                    }}>
                                        {j.status}
                                    </span>
                                </td>
                                <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button 
                                            onClick={() => setSelectedJobOrder && setSelectedJobOrder(j)} 
                                            style={{...styles.btnA(brandNavy), padding: '8px 15px', background: '#eff6ff'}}
                                        >
                                            Kelola Seleksi
                                        </button>
                                        <button 
                                            onClick={() => toggleStatus(j)} 
                                            style={{...actionBtn(j.status === 'OPEN' ? '#ef4444' : '#10b981'), padding: '8px 15px'}}
                                        >
                                            {j.status === 'OPEN' ? 'Tutup JO' : 'Buka JO'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── MODAL ADD JOB ORDER ── */}
            {isAddJOOpen && (
                <div style={styles.modalOverlay}>
                    <form onSubmit={handleAddJO} style={{...styles.modalContent, width: '500px'}}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>Buat Job Order Baru</h3>
                            <button type="button" onClick={() => setIsAddJOOpen(false)} style={styles.closeBtn}><X size={20}/></button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                            <div>
                                <label style={styles.lb}>Nama Perusahaan Klien (Kaisha)</label>
                                <select 
                                    required 
                                    style={styles.inp} 
                                    value={joForm.perusahaan} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        const kaisha = masterData.kaisha.find(k => k.nama_perusahaan === val || k.perusahaan === val);
                                        setJoForm({...joForm, perusahaan: val, kumiai: kaisha?.nama_kumiai || kaisha?.kumiai || joForm.kumiai});
                                    }}
                                >
                                    <option value="">-- Pilih Perusahaan --</option>
                                    {masterData.kaisha.map((k, i) => (
                                        <option key={i} value={k.nama_perusahaan || k.perusahaan}>{k.nama_perusahaan || k.perusahaan}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={styles.lb}>Nama Kumiai</label>
                                <select required style={styles.inp} value={joForm.kumiai} onChange={e => setJoForm({...joForm, kumiai: e.target.value})}>
                                    <option value="">-- Pilih Kumiai --</option>
                                    {masterData.kumiai.map((k, i) => {
                                        const val = k.nama_kumiai || k.kumiai || k.nama || Object.values(k)[1];
                                        return <option key={i} value={val}>{val}</option>;
                                    })}
                                </select>
                            </div>

                            <div>
                                <label style={styles.lb}>Bidang Pekerjaan</label>
                                <select required style={styles.inp} value={joForm.bidang} onChange={e => setJoForm({...joForm, bidang: e.target.value})}>
                                    <option value="">-- Pilih Bidang Pekerjaan --</option>
                                    {masterData.bidang.map((b, i) => <option key={i} value={b.nama_bidang}>{b.nama_bidang}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={styles.lb}>Kuota Siswa Dibutuhkan</label>
                                <input type="number" required min="1" style={styles.inp} value={joForm.kuota} onChange={e => setJoForm({...joForm, kuota: e.target.value})} placeholder="Cth: 5" />
                            </div>

                            <div>
                                <label style={styles.lb}>Keterangan Syarat (Opsional)</label>
                                <textarea rows="3" style={{...styles.inp, height: '80px', resize: 'none'}} value={joForm.catatan} onChange={e => setJoForm({...joForm, catatan: e.target.value})} placeholder="Cth: Tinggi min 160cm, Mata tidak minus"></textarea>
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
                            {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : 'Publikasi Job Order'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}