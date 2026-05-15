import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Info, Send, Trash2 } from 'lucide-react';
import { brandNavy } from '../../Reguler/components/dashboardStyles';

// Local Styles Khusus Form Panjang
const sectionTitle = { fontSize: '1.2rem', color: '#1e293b', fontWeight: 800, margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' };
const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputForm = { width: '100%', padding: '12px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const dynamicRowStyle = { display: 'grid', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const btnAddArray = { background: '#dbeafe', color: brandNavy, border: `1px solid ${brandNavy}`, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: '0.2s' };
const btnRemoveArray = { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const emptyArrayText = { textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1' };

const initialFormState = {
    nik: '', nama_lengkap: '', nama_jepang: '', tempat_lahir: '', tanggal_lahir: '', 
    jenis_kelamin: '', agama: '', golongan_darah: '', tinggi_badan: '', berat_badan: '', 
    telepon: '', email: '', asal_sekolah: '', minat_bidang: '', program: '',
    pendidikan_history: [], kerja_history: [], keluarga_history: []
};

export default function TabInputSiswa({ masterBidang, mitraProfile, onSuccess }) {
    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleArrayChange = (field, index, key, value) => { 
        const updated = [...formData[field]]; updated[index][key] = value; setFormData({ ...formData, [field]: updated }); 
    };
    const addArrayItem = (field, newItem) => setFormData({ ...formData, [field]: [...formData[field], newItem] });
    const removeArrayItem = (field, index) => setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });

    const handleSubmitPengajuan = async (e) => {
        e.preventDefault();
        if (!window.confirm(`Kirim pengajuan kandidat atas nama ${formData.nama_lengkap} ke LPK UJC?`)) return;
        
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                tinggi_badan: formData.tinggi_badan ? parseInt(formData.tinggi_badan) : null, 
                berat_badan: formData.berat_badan ? parseInt(formData.berat_badan) : null,
                created_by: mitraProfile.id,
                lpk_asal: mitraProfile.nama,
                tahap_sekarang: 'WAWANCARA MITRA', 
                status_akhir: 'MENUNGGU REVIEW',
                total_bayar: 33000000 
            };

            const { error } = await supabase.from('students').insert([payload]);
            if (error) throw error;

            alert("Kandidat berhasil diajukan! Tim UJC akan segera melakukan verifikasi.");
            setFormData(initialFormState);
            onSuccess(); // Switch Tab & Refresh Data
        } catch (err) { alert("Gagal melakukan pengajuan: " + err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '900px' }}>
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900, letterSpacing: '-0.5px' }}>Formulir Pengajuan Kandidat</h1>
                <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Info size={16}/> Mohon lengkapi seluruh data siswa / alumni LPK Anda.</p>
            </header>

            <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderTop: `5px solid ${brandNavy}` }}>
                <form onSubmit={handleSubmitPengajuan}>
                    <h3 style={sectionTitle}>I. Klasifikasi & Identitas Dasar</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div><label style={{...labelForm, color: brandNavy}}>🎓 Kategori Program *</label><select name="program" value={formData.program} onChange={handleInputChange} required style={{...inputForm, border: `2px solid ${brandNavy}`, background: '#eff6ff', fontWeight: 800}}><option value="">-- Pilih Program --</option><option value="Pemagangan (Jisshusei)">Pemagangan (Jisshusei)</option><option value="Tokutei Ginou (TG)">Tokutei Ginou (TG)</option><option value="Engineering (Gijinkoku)">Engineering (Gijinkoku)</option><option value="Visa Pelajar (Ryuugaku)">Visa Pelajar (Ryuugaku)</option></select></div>
                        <div><label style={{...labelForm, color: '#10b981'}}>🎯 Minat Bidang Pekerjaan *</label><select name="minat_bidang" value={formData.minat_bidang} onChange={handleInputChange} required style={{...inputForm, border: '2px solid #10b981', background: '#ecfdf5'}}><option value="">-- Pilih Bidang --</option>{masterBidang.map(b => <option key={b.nama_bidang} value={b.nama_bidang}>{b.nama_bidang}</option>)}</select></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '40px' }}>
                        <div><label style={labelForm}>NIK *</label><input type="text" name="nik" value={formData.nik} onChange={handleInputChange} required style={inputForm} placeholder="16 Digit NIK" /></div>
                        <div><label style={labelForm}>Nama Lengkap *</label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} required style={inputForm} placeholder="Sesuai KTP" /></div>
                        <div><label style={labelForm}>Nama Jepang</label><input type="text" name="nama_jepang" value={formData.nama_jepang} onChange={handleInputChange} style={inputForm} placeholder="Katakana (Opsional)" /></div>
                        <div><label style={labelForm}>Tempat Lahir *</label><input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} required style={inputForm} placeholder="Kota/Kab Kelahiran" /></div>
                        <div><label style={labelForm}>Tanggal Lahir *</label><input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} required style={inputForm} /></div>
                        <div><label style={labelForm}>Jenis Kelamin *</label><select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} required style={inputForm}><option value="">-- Pilih --</option><option value="L">Laki-Laki</option><option value="P">Perempuan</option></select></div>
                        <div><label style={labelForm}>Agama</label><select name="agama" value={formData.agama} onChange={handleInputChange} style={inputForm}><option value="">-- Pilih --</option><option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option></select></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div><label style={labelForm}>Gol. Darah</label><select name="golongan_darah" value={formData.golongan_darah} onChange={handleInputChange} style={inputForm}><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select></div>
                            <div><label style={labelForm}>Tinggi (cm)</label><input type="number" name="tinggi_badan" value={formData.tinggi_badan} onChange={handleInputChange} style={inputForm} /></div>
                            <div><label style={labelForm}>Berat (kg)</label><input type="number" name="berat_badan" value={formData.berat_badan} onChange={handleInputChange} style={inputForm} /></div>
                        </div>
                        <div><label style={labelForm}>No. WhatsApp *</label><input type="text" name="telepon" value={formData.telepon} onChange={handleInputChange} required style={inputForm} placeholder="08..." /></div>
                        <div><label style={labelForm}>Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} style={inputForm} placeholder="Email aktif" /></div>
                        <div><label style={labelForm}>Asal Sekolah *</label><input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleInputChange} required style={inputForm} placeholder="SMA/SMK/PT" /></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>II. Riwayat Pendidikan</h3><button type="button" onClick={() => addArrayItem('pendidikan_history', { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' })} style={btnAddArray}>+ Tambah Pendidikan</button></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                        {formData.pendidikan_history.map((edu, idx) => (
                            <div key={idx} style={{...dynamicRowStyle, gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr auto'}}>
                                <input style={inputForm} placeholder="Jenjang (SD/SMP)" value={edu.jenjang} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'jenjang', e.target.value)} />
                                <input style={inputForm} placeholder="Nama Institusi" value={edu.nama_sekolah} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'nama_sekolah', e.target.value)} />
                                <input style={inputForm} placeholder="Jurusan" value={edu.jurusan} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'jurusan', e.target.value)} />
                                <div style={{display:'flex', gap:'5px'}}><input style={inputForm} placeholder="Masuk" value={edu.thn_awal} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'thn_awal', e.target.value)} /><input style={inputForm} placeholder="Lulus" value={edu.thn_akhir} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'thn_akhir', e.target.value)} /></div>
                                <button type="button" onClick={() => removeArrayItem('pendidikan_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {formData.pendidikan_history.length === 0 && <div style={emptyArrayText}>Belum ada riwayat pendidikan yang ditambahkan.</div>}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>III. Pengalaman Kerja</h3><button type="button" onClick={() => addArrayItem('kerja_history', { nama_perusahaan: '', jenis_pekerjaan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' })} style={btnAddArray}>+ Tambah Pekerjaan</button></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                        {formData.kerja_history.map((job, idx) => (
                            <div key={idx} style={{...dynamicRowStyle, gridTemplateColumns: '1.5fr 1.5fr 1fr auto'}}>
                                <input style={inputForm} placeholder="Nama Perusahaan" value={job.nama_perusahaan} onChange={(e) => handleArrayChange('kerja_history', idx, 'nama_perusahaan', e.target.value)} />
                                <input style={inputForm} placeholder="Posisi" value={job.jenis_pekerjaan} onChange={(e) => handleArrayChange('kerja_history', idx, 'jenis_pekerjaan', e.target.value)} />
                                <div style={{display:'flex', gap:'5px'}}><input style={inputForm} placeholder="Masuk" value={job.thn_awal} onChange={(e) => handleArrayChange('kerja_history', idx, 'thn_awal', e.target.value)} /><input style={inputForm} placeholder="Keluar" value={job.thn_akhir} onChange={(e) => handleArrayChange('kerja_history', idx, 'thn_akhir', e.target.value)} /></div>
                                <button type="button" onClick={() => removeArrayItem('kerja_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {formData.kerja_history.length === 0 && <div style={emptyArrayText}>Belum ada pengalaman kerja yang ditambahkan.</div>}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>IV. Kontak Keluarga</h3><button type="button" onClick={() => addArrayItem('keluarga_history', { hubungan: '', nama: '', pendapatan: '', umur: '', lokasi: 'INDONESIA' })} style={btnAddArray}>+ Tambah Keluarga</button></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                        {formData.keluarga_history.map((fam, idx) => (
                            <div key={idx} style={{...dynamicRowStyle, gridTemplateColumns: '1fr 2fr 1fr 2fr 1fr auto'}}>
                                <input style={inputForm} placeholder="Hubungan" value={fam.hubungan} onChange={(e) => handleArrayChange('keluarga_history', idx, 'hubungan', e.target.value)} />
                                <input style={inputForm} placeholder="Nama Keluarga" value={fam.nama} onChange={(e) => handleArrayChange('keluarga_history', idx, 'nama', e.target.value)} />
                                <input style={inputForm} placeholder="Umur" value={fam.umur} onChange={(e) => handleArrayChange('keluarga_history', idx, 'umur', e.target.value)} />
                                <input style={inputForm} placeholder="Pekerjaan" value={fam.pendapatan} onChange={(e) => handleArrayChange('keluarga_history', idx, 'pendapatan', e.target.value)} />
                                <select style={inputForm} value={fam.lokasi || 'INDONESIA'} onChange={(e) => handleArrayChange('keluarga_history', idx, 'lokasi', e.target.value)}>
                                    <option value="INDONESIA">Di Indonesia</option>
                                    <option value="JEPANG">Di Jepang</option>
                                </select>
                                <button type="button" onClick={() => removeArrayItem('keluarga_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {formData.keluarga_history.length === 0 && <div style={emptyArrayText}>Belum ada data keluarga yang ditambahkan.</div>}
                    </div>

                    <div style={{ background: '#eff6ff', padding: '15px 20px', borderRadius: '8px', border: '1px dashed #93c5fd', marginTop: '30px', color: '#1e3a8a', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '25px' }}>
                        <strong>Pemberitahuan:</strong> Pastikan seluruh data CV siswa terisi dengan benar. Data ini akan langsung digunakan oleh LPK UJC untuk kebutuhan wawancara dan pengiriman dokumen ke Jepang.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={isSubmitting} style={{ padding: '16px 30px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(16,24,105,0.25)', transition: '0.2s', opacity: isSubmitting ? 0.7 : 1, fontSize: '1rem' }}>
                            {isSubmitting ? 'Mengirim Data...' : <>Kirim CV Kandidat ke UJC <Send size={18}/></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}