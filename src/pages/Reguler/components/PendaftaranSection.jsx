import React, { useState } from 'react';
import { regulerService } from '../../../services/regulerService';
import { Search, Plus, RefreshCw, X, Loader2, Edit, ArrowRightCircle } from 'lucide-react'; 
import FormKandidat from './FormKandidat';
import { styles } from './dashboardStyles';

export default function PendaftaranSection({ students, masterBidang, onRefresh, onLogActivity, currentUser, updateStage }) {
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [cloneNik, setCloneNik] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialForm = {
        id: null, nik: '', nama_lengkap: '', nama_jepang: '', jenis_kelamin: '', status_pernikahan: '',
        tempat_lahir: '', tanggal_lahir: '', agama: '', telepon: '', email: '', alamat: '',
        minat_bidang: '', program: 'Pemagangan (Jisshusei)', tahap_sekarang: 'REGISTRASI', status_akhir: 'Proses',
        lpk_asal: '', tinggi_badan: '', berat_badan: '', golongan_darah: '', ukuran_sepatu: '', ukuran_pinggang: '', ukuran_kepala: '',
        mata_kanan: '', mata_kiri: '', buta_warna: '', tangan_dominan: '', hobi: '', bakat: '',
        merokok_sekarang: '', merokok_jepang: '', minum_sake: '', kelebihan: '', kekurangan: '', tujuan_jepang: '', target_menabung: '',
        pendidikan_history: [], kerja_history: [], keluarga_history: [], attachments: []
    };
    const [formData, setFormData] = useState(initialForm);

    const handleCloneSubmit = async (e) => {
        e.preventDefault();
        if (!cloneNik) return alert("Masukkan NIK terlebih dahulu!");
        setIsSubmitting(true);
        try {
            const { oldData, newId } = await regulerService.reEntryStudent(cloneNik, currentUser?.id);
            if (!window.confirm(`Ditemukan data atas nama ${oldData.nama_lengkap}. Proses Re-Entry Tokutei Ginou?`)) { setIsSubmitting(false); return; }
            
            await onLogActivity(`Proses Re-Entry NIK: ${oldData.nama_lengkap} -> TG`);
            alert(`Berhasil! Data digandakan.`);
            
            setIsCloneModalOpen(false); setCloneNik(''); onRefresh();
            if (newId && window.confirm("Perbarui foto profil TG?")) openForm({...oldData, id: newId});
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault(); 
        setIsSubmitting(true);
        try {
            // Fungsi pembersih otomatis
            const cleanPayload = (obj) => {
                const cleaned = { ...obj };
                for (const key in cleaned) {
                    if (cleaned[key] === "") {
                        cleaned[key] = null;
                    }
                }
                return cleaned;
            };

            // Bersihkan data sebelum dikirim
            const payload = cleanPayload(formData);
            const editingId = payload.id;
            delete payload.id;

            const { isEdit } = await regulerService.saveStudent(payload, editingId);
            await onLogActivity(isEdit ? `Mengubah data ${payload.nama_lengkap}` : `Mendaftarkan ${payload.nama_lengkap}`);
            
            alert('Data pendaftar berhasil disimpan!');
            setIsFormOpen(false); 
            onRefresh();
        } catch (error) { 
            alert(`Error: ${error.message}`); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const openForm = (student = null) => {
        if (student) {
            const safeParse = (data) => { if (!data) return []; if (typeof data === 'string') { try { return JSON.parse(data); } catch { return []; } } return Array.isArray(data) ? data : []; };
            setFormData({ ...initialForm, ...student, pendidikan_history: safeParse(student.pendidikan_history), kerja_history: safeParse(student.kerja_history), keluarga_history: safeParse(student.keluarga_history), attachments: safeParse(student.attachments) });
        } else { setFormData(initialForm); }
        setIsFormOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Menampilkan {students.length} Pendaftar Baru</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setIsCloneModalOpen(true)} style={{...styles.btnPrimary, background: '#f59e0b'}}><RefreshCw size={16}/> Re-Entry TG</button>
                    <button onClick={() => openForm()} style={styles.btnPrimary}><Plus size={16}/> Tambah Pendaftar</button>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.tableS}>
                    <thead style={styles.theadS}>
                        <tr><th style={styles.thStyle}>NIK & Nama Lengkap</th><th style={styles.thStyle}>Kontak & LPK</th><th style={styles.thStyle}>Program</th><th style={{...styles.thStyle, textAlign: 'center'}}>Aksi / Update Alur</th></tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? <tr><td colSpan="4" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>Belum ada data pendaftar.</td></tr> : null}
                        {students.map(s => (
                            <tr key={s.id} style={styles.trS}>
                                <td style={styles.tdStyle}><div style={{ fontWeight: 800, color: '#1e293b' }}>{s.nama_lengkap}</div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>NIK: {s.nik} • {s.jenis_kelamin}</div></td>
                                <td style={styles.tdStyle}><div style={{fontWeight: 700}}>{s.telepon}</div><div style={{ fontSize: '0.75rem', color: s.lpk_asal ? '#3b82f6' : '#10b981', fontWeight: 800 }}>{s.lpk_asal ? `Mitra: ${s.lpk_asal}` : 'Internal UJC'}</div></td>
                                <td style={styles.tdStyle}><span style={styles.badgeS}>{s.program}</span></td>
                                <td style={{...styles.tdStyle, textAlign: 'center'}}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button onClick={() => openForm(s)} style={styles.btnA('#3b82f6')} title="Kelola Profil Lengkap"><Edit size={14}/> Kelola Data</button>
                                        <button onClick={() => updateStage(s.id, s.nama_lengkap, 'SELEKSI AWAL', 'Siswa dipindah ke tahap Seleksi')} style={{...styles.btnA('#101869'), background: '#101869', color: 'white'}}><ArrowRightCircle size={14}/> Proses Seleksi</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL RE-ENTRY */}
            {isCloneModalOpen && (
                <div style={styles.modalOverlay}>
                    <form onSubmit={handleCloneSubmit} style={{...styles.modalContent, width: '450px'}}>
                        <div style={styles.modalHeader}>
                            <div><h3 style={{ margin: 0, color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}><RefreshCw size={20} color="#f59e0b" /> Proses Re-Entry TG</h3><p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Gandakan biodata alumni masa lalu.</p></div>
                            <button type="button" onClick={() => setIsCloneModalOpen(false)} style={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <div style={{ marginBottom: '25px' }}><label style={styles.labelForm}>Masukkan NIK Alumni Lama *</label><input type="text" required value={cloneNik} onChange={(e) => setCloneNik(e.target.value)} style={{...styles.inp, border: '2px solid #f59e0b', fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', letterSpacing: '2px'}} placeholder="16 Digit NIK" /></div>
                        <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>{isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <><Search size={18} /> Cari & Gandakan Data</>}</button>
                    </form>
                </div>
            )}

            {/* KOMPONEN FORM KANDIDAT YANG DIPISAH */}
            {isFormOpen && (
                <FormKandidat 
                    formData={formData} setFormData={setFormData} handleSave={handleSave} 
                    masterBidang={masterBidang} isSubmitting={isSubmitting} 
                    setIsFormOpen={setIsFormOpen} onRefresh={onRefresh} 
                />
            )}
        </div>
    );
}