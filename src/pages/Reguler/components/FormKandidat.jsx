import React from 'react';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import { styles, brandNavy } from './dashboardStyles';
import RegistrationPhotoUpload from './RegistrationPhotoUpload';

export default function FormKandidat({ 
    formData, setFormData, handleSave, masterBidang, isSubmitting, setIsFormOpen, onRefresh 
}) {
    // FIX STATE MUTATION ARRAY: Menggunakan Deep Copy yang benar di React
    const handleArrayChange = (field, index, key, value) => { 
        setFormData(prev => {
            const updatedArr = [...prev[field]];
            updatedArr[index] = { ...updatedArr[index], [key]: value };
            return { ...prev, [field]: updatedArr };
        }); 
    };

    const addArrayItem = (field, newItem) => setFormData(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
    const removeArrayItem = (field, index) => setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '1100px'}}> 
                <div style={styles.modalHeader}>
                    <h3 style={{ margin: 0, color: brandNavy, fontWeight: 900 }}>{formData.id ? 'Edit Data Pendaftar Lengkap' : 'Form Pendaftaran Baru'}</h3>
                    <button type="button" onClick={() => setIsFormOpen(false)} style={styles.closeBtn}><X size={18}/></button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: formData.id ? '3fr 1fr' : '1fr', gap: '30px' }}>
                    <form onSubmit={handleSave}>
                        {/* IDENTITAS */}
                        <h4 style={styles.sectionTitle}>Identitas Utama</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
                            <div style={styles.col}><label style={styles.lb}>Nama Lengkap *</label><input style={styles.inp} value={formData.nama_lengkap || ''} onChange={e => setFormData({...formData, nama_lengkap: e.target.value})} required/></div>
                            <div style={styles.col}><label style={styles.lb}>氏名 (Nama Jepang)</label><input style={styles.inp} value={formData.nama_jepang || ''} onChange={e => setFormData({...formData, nama_jepang: e.target.value})} /></div>
                            <div style={styles.col}><label style={styles.lb}>Jenis Kelamin *</label><select style={styles.inp} value={formData.jenis_kelamin || ''} onChange={e => setFormData({...formData, jenis_kelamin: e.target.value})} required><option value="">Pilih...</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                            <div style={styles.col}><label style={styles.lb}>Status Pernikahan</label><select style={styles.inp} value={formData.status_pernikahan || ''} onChange={e => setFormData({...formData, status_pernikahan: e.target.value})}><option value="">Pilih...</option><option value="Belum Menikah">Belum Menikah</option><option value="Menikah">Menikah</option><option value="Cerai">Cerai Hidup / Mati</option></select></div>
                            <div style={styles.col}><label style={{...styles.lb, color: '#10b981'}}>🎯 Minat Bidang Kaisha</label><select style={{...styles.inp, border: '2px solid #10b981', background: '#ecfdf5'}} value={formData.minat_bidang || ''} onChange={e => setFormData({...formData, minat_bidang: e.target.value})}><option value="">-- Pilih Minat Bidang --</option>{masterBidang?.map(b => ( <option key={b.nama_bidang} value={b.nama_bidang}>{b.nama_bidang}</option> ))}</select></div>
                            <div style={styles.col}><label style={{...styles.lb, color: brandNavy}}>Kategori Program *</label><select style={{...styles.inp, border: `2px solid ${brandNavy}`, background: '#eff6ff', fontWeight: 800}} value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} required><option value="Pemagangan (Jisshusei)">Pemagangan (Jisshusei)</option><option value="Tokutei Ginou (TG)">Tokutei Ginou (TG)</option><option value="Engineering (Gijinkoku)">Engineering (Gijinkoku)</option><option value="Visa Pelajar (Ryuugaku)">Visa Pelajar (Ryuugaku)</option></select></div>
                            <div style={styles.col}><label style={styles.lb}>NIK KTP *</label><input required style={styles.inp} value={formData.nik || ''} onChange={e => setFormData({...formData, nik: e.target.value})} /></div>
                            <div style={styles.col}><label style={styles.lb}>Asal Sekolah *</label><input required style={styles.inp} value={formData.asal_sekolah || ''} onChange={e => setFormData({...formData, asal_sekolah: e.target.value})} /></div>
                            <div style={styles.col}><label style={{...styles.lb, color: '#3b82f6'}}>LPK Asal (Mitra) *Opsional</label><input style={{...styles.inp, border: '1px solid #3b82f6'}} placeholder="Kosongkan jika Reguler" value={formData.lpk_asal || ''} onChange={e => setFormData({...formData, lpk_asal: e.target.value})} /></div>
                            <div style={styles.col}><label style={styles.lb}>Tempat Lahir *</label><input required style={styles.inp} value={formData.tempat_lahir || ''} onChange={e => setFormData({...formData, tempat_lahir: e.target.value})} /></div>
                            <div style={styles.col}><label style={styles.lb}>Tanggal Lahir *</label><input type="date" style={styles.inp} value={formData.tanggal_lahir || ''} onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})} required/></div>
                            <div style={styles.col}><label style={styles.lb}>Agama</label><select style={styles.inp} value={formData.agama || ''} onChange={e => setFormData({...formData, agama: e.target.value})}><option value="">Pilih...</option><option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option></select></div>
                            <div style={styles.col}><label style={styles.lb}>No. HP Pribadi *</label><input required style={styles.inp} value={formData.telepon || ''} onChange={e => setFormData({...formData, telepon: e.target.value})} /></div>
                            <div style={{...styles.col, gridColumn: '1 / -1'}}><label style={styles.lb}>Alamat Lengkap</label><textarea style={{...styles.inp, height: '60px', resize: 'none'}} value={formData.alamat || ''} onChange={e => setFormData({...formData, alamat: e.target.value})} /></div>
                        </div>

                        {/* FISIK & KEBIASAAN */}
                        <h4 style={styles.sectionTitle}>Data Fisik & Personal</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
                            <div style={styles.col}><label style={styles.lb}>Tinggi (cm)</label><input style={styles.inp} type="number" step="0.1" value={formData.tinggi_badan || ''} onChange={e => setFormData({...formData, tinggi_badan: e.target.value})} /></div>
                            <div style={styles.col}><label style={styles.lb}>Berat (kg)</label><input style={styles.inp} type="number" step="0.1" value={formData.berat_badan || ''} onChange={e => setFormData({...formData, berat_badan: e.target.value})} /></div>
                            <div style={styles.col}><label style={styles.lb}>Gol. Darah</label><select style={styles.inp} value={formData.golongan_darah || ''} onChange={e => setFormData({...formData, golongan_darah: e.target.value})}><option value="">Pilih...</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select></div>
                            <div style={styles.col}><label style={styles.lb}>Mata Kanan (R)</label><input style={styles.inp} type="number" step="0.1" placeholder="1.0" value={formData.mata_kanan || ''} onChange={e => setFormData({...formData, mata_kanan: e.target.value})} /></div>
                            <div style={styles.col}><label style={styles.lb}>Mata Kiri (L)</label><input style={styles.inp} type="number" step="0.1" placeholder="1.0" value={formData.mata_kiri || ''} onChange={e => setFormData({...formData, mata_kiri: e.target.value})} /></div>
                            <div style={styles.col}><label style={styles.lb}>Merokok Saat Ini</label><select style={styles.inp} value={formData.merokok_sekarang || ''} onChange={e => setFormData({...formData, merokok_sekarang: e.target.value})}><option value="">Pilih...</option><option value="吸いません。">Tidak</option><option value="吸います。">Ya</option></select></div>
                        </div>

                        {/* RIWAYAT PENDIDIKAN ARRAY */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{...styles.sectionTitle, borderBottom: 'none', margin: 0}}>Riwayat Pendidikan</h4>
                            <button type="button" onClick={() => addArrayItem('pendidikan_history', { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' })} style={styles.btnAddArray}><Plus size={16}/> Tambah</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                            {formData.pendidikan_history.map((item, index) => (
                                <div key={index} style={styles.cardArray}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                        <div style={styles.col}><label style={styles.lb}>Jenjang</label><select style={styles.inpSm} value={item.jenjang} onChange={e => handleArrayChange('pendidikan_history', index, 'jenjang', e.target.value)}><option value="">Pilih...</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="SMK">SMK</option><option value="D3">D3</option><option value="S1">S1</option></select></div>
                                        <div style={styles.col}><label style={styles.lb}>Nama Sekolah</label><input style={styles.inpSm} value={item.nama_sekolah} onChange={e => handleArrayChange('pendidikan_history', index, 'nama_sekolah', e.target.value)} /></div>
                                        <div style={styles.col}><label style={styles.lb}>Jurusan</label><input style={styles.inpSm} value={item.jurusan} onChange={e => handleArrayChange('pendidikan_history', index, 'jurusan', e.target.value)} /></div>
                                        <div style={styles.col}><label style={styles.lb}>Masuk</label><div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={item.bln_awal} onChange={e => handleArrayChange('pendidikan_history', index, 'bln_awal', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={item.thn_awal} onChange={e => handleArrayChange('pendidikan_history', index, 'thn_awal', e.target.value)} /></div></div>
                                        <div style={styles.col}><label style={styles.lb}>Lulus</label><div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={item.bln_akhir} onChange={e => handleArrayChange('pendidikan_history', index, 'bln_akhir', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={item.thn_akhir} onChange={e => handleArrayChange('pendidikan_history', index, 'thn_akhir', e.target.value)} /></div></div>
                                        <button type="button" onClick={() => removeArrayItem('pendidikan_history', index)} style={styles.btnDel}><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ARRAY PENGALAMAN KERJA (Contoh ringkas) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{...styles.sectionTitle, borderBottom: 'none', margin: 0}}>Pengalaman Kerja</h4>
                            <button type="button" onClick={() => addArrayItem('kerja_history', { nama_perusahaan: '', jenis_pekerjaan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' })} style={styles.btnAddArray}><Plus size={16}/> Tambah</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                            {formData.kerja_history.map((item, index) => (
                                <div key={index} style={styles.cardArray}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                                        <div style={styles.col}><label style={styles.lb}>Perusahaan</label><input style={styles.inpSm} value={item.nama_perusahaan} onChange={e => handleArrayChange('kerja_history', index, 'nama_perusahaan', e.target.value)} /></div>
                                        <div style={styles.col}><label style={styles.lb}>Posisi</label><input style={styles.inpSm} value={item.jenis_pekerjaan} onChange={e => handleArrayChange('kerja_history', index, 'jenis_pekerjaan', e.target.value)} /></div>
                                        <div style={styles.col}><label style={styles.lb}>Masuk</label><div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={item.bln_awal} onChange={e => handleArrayChange('kerja_history', index, 'bln_awal', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={item.thn_awal} onChange={e => handleArrayChange('kerja_history', index, 'thn_awal', e.target.value)} /></div></div>
                                        <div style={styles.col}><label style={styles.lb}>Selesai</label><div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={item.bln_akhir} onChange={e => handleArrayChange('kerja_history', index, 'bln_akhir', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={item.thn_akhir} onChange={e => handleArrayChange('kerja_history', index, 'thn_akhir', e.target.value)} /></div></div>
                                        <button type="button" onClick={() => removeArrayItem('kerja_history', index)} style={styles.btnDel}><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TOMBOL SIMPAN */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', position: 'sticky', bottom: '-40px', background: 'white', padding: '15px 0', borderTop: '2px solid #e2e8f0' }}>
                            <button type="button" onClick={() => setIsFormOpen(false)} style={styles.cancelBtn}>Batal</button>
                            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>{isSubmitting ? <Loader2 className="animate-spin" /> : formData.id ? '💾 Simpan Koreksi CV' : '🚀 Daftarkan Siswa & CV'}</button>
                        </div>
                    </form>

                    {/* FOTO HANYA MUNCUL JIKA ID SUDAH ADA (EDIT) */}
                    {formData.id && (<div><RegistrationPhotoUpload studentId={formData.id} onUploadSuccess={() => onRefresh()} /></div>)}
                </div>
            </div>
        </div>
    );
}