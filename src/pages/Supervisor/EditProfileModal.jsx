import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function EditProfileModal({ selectedCV, setSelectedCV, handleSaveCV }) {
    // ── STATE ARRAY DINAMIS ──
    const [pendidikanList, setPendidikanList] = useState([]);
    const [kerjaList, setKerjaList] = useState([]);
    const [keluargaList, setKeluargaList] = useState([]);
    const [fileList, setFileList] = useState([]);

    // ── LOAD DATA KE DALAM STATE ──
    useEffect(() => {
        if (selectedCV) {
            const safeParse = (data) => {
                if (!data) return [];
                if (typeof data === 'string') {
                    try { return JSON.parse(data); } catch { return []; }
                }
                return Array.isArray(data) ? data : [];
            };

            setPendidikanList(safeParse(selectedCV.pendidikan_history));
            setKerjaList(safeParse(selectedCV.kerja_history));
            setKeluargaList(safeParse(selectedCV.keluarga_history));
            setFileList(safeParse(selectedCV.attachments));
        }
    }, [selectedCV]);

    if (!selectedCV) return null;

    // ── HANDLERS: TAMBAH DATA BARU ──
    const addPendidikan = () => setPendidikanList([...pendidikanList, { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' }]);
    const addKerja = () => setKerjaList([...kerjaList, { nama_perusahaan: '', jenis_pekerjaan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' }]);
    const addKeluarga = () => setKeluargaList([...keluargaList, { nama: '', alamat: '', no_hp: '', pendapatan: '', hubungan: '', tipe: 'DARURAT' }]);
    const addFile = () => setFileList([...fileList, { name: '', url: '', type: 'DOKUMEN', notes: '' }]); 

    // ── HANDLERS: UPDATE DATA ARRAY ──
    const updatePendidikan = (index, field, value) => { const newArr = [...pendidikanList]; newArr[index][field] = value; setPendidikanList(newArr); };
    const updateKerja = (index, field, value) => { const newArr = [...kerjaList]; newArr[index][field] = value; setKerjaList(newArr); };
    const updateKeluarga = (index, field, value) => { const newArr = [...keluargaList]; newArr[index][field] = value; setKeluargaList(newArr); };
    const updateFile = (index, field, value) => { const newArr = [...fileList]; newArr[index][field] = value; setFileList(newArr); };

    // ── HANDLERS: HAPUS DATA ARRAY ──
    const removePendidikan = (index) => setPendidikanList(pendidikanList.filter((_, i) => i !== index));
    const removeKerja = (index) => setKerjaList(kerjaList.filter((_, i) => i !== index));
    const removeKeluarga = (index) => setKeluargaList(keluargaList.filter((_, i) => i !== index));
    const removeFile = (index) => setFileList(fileList.filter((_, i) => i !== index));

    // ── HANDLER: SIMPAN ──
    const onSubmitForm = (e) => {
        e.preventDefault();
        const finalData = {
            ...selectedCV,
            pendidikan_history: pendidikanList,
            kerja_history: kerjaList,
            keluarga_history: keluargaList,
            attachments: fileList 
        };
        
        setSelectedCV(finalData); 
        handleSaveCV(e, finalData); 
    };

    return (
        <div style={{ ...modalOverlay, alignItems: 'flex-start', paddingTop: '50px', overflowY: 'auto' }}>
            <form onSubmit={onSubmitForm} style={{ ...modalWide, marginBottom: '50px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', position: 'sticky', top: '-40px', background: 'white', padding: '20px 0', zIndex: 10, borderBottom: '2px solid #e2e8f0' }}>
                    <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>📝 Edit Lengkap Rirekisho</h2>
                    <button type="button" onClick={() => setSelectedCV(null)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                
                {/* ── IDENTITAS UTAMA ── */}
                <h4 style={sectionTitle}>Identitas Utama</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
                    <div style={col}><label style={lb}>Nama Lengkap</label><input style={inp} value={selectedCV.nama_lengkap || ''} onChange={e => setSelectedCV({...selectedCV, nama_lengkap: e.target.value})} /></div>
                    <div style={col}><label style={lb}>氏名 (Nama Jepang)</label><input style={inp} value={selectedCV.nama_jepang || ''} onChange={e => setSelectedCV({...selectedCV, nama_jepang: e.target.value})} /></div>
                    
                    {/* INPUT BARU: JENIS KELAMIN & STATUS PERNIKAHAN */}
                    <div style={col}>
                        <label style={lb}>Jenis Kelamin</label>
                        <select style={inp} value={selectedCV.jenis_kelamin || ''} onChange={e => setSelectedCV({...selectedCV, jenis_kelamin: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="L">Laki-laki (男性)</option>
                            <option value="P">Perempuan (女性)</option>
                        </select>
                    </div>
                    <div style={col}>
                        <label style={lb}>Status Pernikahan</label>
                        <select style={inp} value={selectedCV.status_pernikahan || ''} onChange={e => setSelectedCV({...selectedCV, status_pernikahan: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="Belum Menikah">Belum Menikah (未婚)</option>
                            <option value="Menikah">Menikah (既婚)</option>
                            <option value="Cerai">Cerai Hidup / Mati</option>
                        </select>
                    </div>

                    <div style={col}><label style={lb}>Tempat Lahir</label><input style={inp} value={selectedCV.tempat_lahir || ''} onChange={e => setSelectedCV({...selectedCV, tempat_lahir: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Tanggal Lahir</label><input type="date" style={inp} value={selectedCV.tanggal_lahir || ''} onChange={e => setSelectedCV({...selectedCV, tanggal_lahir: e.target.value})} /></div>
                    
                    <div style={col}><label style={lb}>Agama</label>
                        <select style={inp} value={selectedCV.agama || ''} onChange={e => setSelectedCV({...selectedCV, agama: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="Islam">Islam</option>
                            <option value="Kristen">Kristen Protestan</option>
                            <option value="Katolik">Kristen Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Konghucu">Konghucu</option>
                        </select>
                    </div>
                    <div style={col}><label style={lb}>No. HP Pribadi</label><input style={inp} value={selectedCV.no_telp || ''} onChange={e => setSelectedCV({...selectedCV, no_telp: e.target.value})} /></div>
                    
                    <div style={{...col, gridColumn: '1 / -1'}}><label style={lb}>Alamat Lengkap</label><textarea style={{...inp, height: '60px', resize: 'none'}} value={selectedCV.alamat || ''} onChange={e => setSelectedCV({...selectedCV, alamat: e.target.value})} /></div>
                </div>

                {/* ── DATA FISIK & LAINNYA ── */}
                <h4 style={sectionTitle}>Data Fisik & Informasi Tambahan</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
                    <div style={col}><label style={lb}>Tinggi Badan (cm)</label><input style={inp} type="number" step="0.1" value={selectedCV.tinggi_badan || ''} onChange={e => setSelectedCV({...selectedCV, tinggi_badan: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Berat Badan (kg)</label><input style={inp} type="number" step="0.1" value={selectedCV.berat_badan || ''} onChange={e => setSelectedCV({...selectedCV, berat_badan: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Gol. Darah</label>
                        <select style={inp} value={selectedCV.golongan_darah || ''} onChange={e => setSelectedCV({...selectedCV, golongan_darah: e.target.value})}><option value="">Pilih...</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select>
                    </div>
                    
                    <div style={col}><label style={lb}>Uk. Sepatu (cm)</label><input style={inp} type="number" step="0.1" value={selectedCV.ukuran_sepatu || ''} onChange={e => setSelectedCV({...selectedCV, ukuran_sepatu: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Uk. Pinggang (cm)</label><input style={inp} type="number" step="0.1" value={selectedCV.ukuran_pinggang || ''} onChange={e => setSelectedCV({...selectedCV, ukuran_pinggang: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Uk. Kepala (cm)</label><input style={inp} type="number" step="0.1" value={selectedCV.ukuran_kepala || ''} onChange={e => setSelectedCV({...selectedCV, ukuran_kepala: e.target.value})} /></div>

                    <div style={col}><label style={lb}>Mata Kanan (R)</label><input style={inp} type="number" step="0.1" placeholder="1.0" value={selectedCV.mata_kanan || ''} onChange={e => setSelectedCV({...selectedCV, mata_kanan: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Mata Kiri (L)</label><input style={inp} type="number" step="0.1" placeholder="1.0" value={selectedCV.mata_kiri || ''} onChange={e => setSelectedCV({...selectedCV, mata_kiri: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Buta Warna?</label>
                        <select style={inp} value={selectedCV.buta_warna || ''} onChange={e => setSelectedCV({...selectedCV, buta_warna: e.target.value})}><option value="">Pilih...</option><option value="Tidak">Tidak (無)</option><option value="Ya">Ya (有)</option></select>
                    </div>

                    <div style={col}><label style={lb}>Tangan Dominan</label><select style={inp} value={selectedCV.tangan_dominan || ''} onChange={e => setSelectedCV({...selectedCV, tangan_dominan: e.target.value})}><option value="">Pilih...</option><option value="Kanan">Kanan</option><option value="Kiri">Kiri</option></select></div>
                    <div style={col}><label style={lb}>Hobi</label><input style={inp} value={selectedCV.hobi || ''} onChange={e => setSelectedCV({...selectedCV, hobi: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Bakat Khusus</label><input style={inp} value={selectedCV.bakat || ''} onChange={e => setSelectedCV({...selectedCV, bakat: e.target.value})} /></div>
                </div>

                {/* ── KEBIASAAN MEROKOK & MINUM ── */}
                <h4 style={sectionTitle}>Kebiasaan (Merokok & Sake)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
                    <div style={col}>
                        <label style={lb}>Merokok (Saat Ini)</label>
                        <select style={inp} value={selectedCV.merokok_sekarang || ''} onChange={e => setSelectedCV({...selectedCV, merokok_sekarang: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="吸いません。">Tidak (吸いません。)</option>
                            <option value="吸います。">Ya (吸います。)</option>
                        </select>
                    </div>
                    <div style={col}>
                        <label style={lb}>Merokok (Di Jepang)</label>
                        <select style={inp} value={selectedCV.merokok_jepang || ''} onChange={e => setSelectedCV({...selectedCV, merokok_jepang: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="吸いません。">Tidak (吸いません。)</option>
                            <option value="吸います。">Ya (吸います。)</option>
                        </select>
                    </div>
                    <div style={col}>
                        <label style={lb}>Minum Sake / Alkohol</label>
                        <select style={inp} value={selectedCV.minum_sake || ''} onChange={e => setSelectedCV({...selectedCV, minum_sake: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="全然酒を飲みません">Tidak Sama Sekali (全然酒を飲みません)</option>
                            <option value="飲みます">Ya, Minum (飲みます)</option>
                        </select>
                    </div>
                </div>

                {/* ── KEPRIBADIAN & TUJUAN ── */}
                <h4 style={sectionTitle}>Personalitas & Tujuan</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
                    <div style={col}><label style={lb}>Kelebihan (長所)</label><textarea style={{...inp, height: '70px', resize: 'none'}} value={selectedCV.kelebihan || ''} onChange={e => setSelectedCV({...selectedCV, kelebihan: e.target.value})} /></div>
                    <div style={col}><label style={lb}>Kekurangan (短所)</label><textarea style={{...inp, height: '70px', resize: 'none'}} value={selectedCV.kekurangan || ''} onChange={e => setSelectedCV({...selectedCV, kekurangan: e.target.value})} /></div>
                    <div style={{...col, gridColumn: '1 / -1'}}><label style={lb}>Tujuan ke Jepang</label><textarea style={{...inp, height: '70px', resize: 'none'}} value={selectedCV.tujuan_jepang || ''} onChange={e => setSelectedCV({...selectedCV, tujuan_jepang: e.target.value})} /></div>
                    <div style={{...col, gridColumn: '1 / -1'}}><label style={lb}>Target Menabung (Rp / Yen)</label><input style={inp} value={selectedCV.target_menabung || ''} onChange={e => setSelectedCV({...selectedCV, target_menabung: e.target.value})} /></div>
                </div>

                {/* ── ARRAY: PENDIDIKAN ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{...sectionTitle, borderBottom: 'none', margin: 0}}>Riwayat Pendidikan</h4>
                    <button type="button" onClick={addPendidikan} style={btnAdd}><Plus size={16}/> Tambah Pendidikan</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                    {pendidikanList.map((item, index) => (
                        <div key={index} style={cardArray}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                                <div style={col}><label style={lb}>Jenjang</label>
                                    <select style={inpSm} value={item.jenjang} onChange={e => updatePendidikan(index, 'jenjang', e.target.value)}>
                                        <option value="">Pilih...</option><option value="SD">SD (小学校)</option><option value="SMP">SMP (中学校)</option><option value="SMA">SMA (高校)</option><option value="SMK">SMK (専門高校)</option><option value="D3">D3 (準学士)</option><option value="S1">S1 (大学)</option>
                                    </select>
                                </div>
                                <div style={col}><label style={lb}>Nama Sekolah</label><input style={inpSm} value={item.nama_sekolah} onChange={e => updatePendidikan(index, 'nama_sekolah', e.target.value)} /></div>
                                <div style={col}><label style={lb}>Masuk (Bln/Thn)</label>
                                    <div style={{display:'flex', gap:'5px'}}><input style={inpSm} placeholder="Bln" value={item.bln_awal} onChange={e => updatePendidikan(index, 'bln_awal', e.target.value)} /><input style={inpSm} placeholder="Thn" value={item.thn_awal} onChange={e => updatePendidikan(index, 'thn_awal', e.target.value)} /></div>
                                </div>
                                <div style={col}><label style={lb}>Lulus (Bln/Thn)</label>
                                    <div style={{display:'flex', gap:'5px'}}><input style={inpSm} placeholder="Bln" value={item.bln_akhir} onChange={e => updatePendidikan(index, 'bln_akhir', e.target.value)} /><input style={inpSm} placeholder="Thn" value={item.thn_akhir} onChange={e => updatePendidikan(index, 'thn_akhir', e.target.value)} /></div>
                                </div>
                                <button type="button" onClick={() => removePendidikan(index)} style={btnDel}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {pendidikanList.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada data pendidikan...</div>}
                </div>

                {/* ── ARRAY: PENGALAMAN KERJA ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{...sectionTitle, borderBottom: 'none', margin: 0}}>Pengalaman Kerja</h4>
                    <button type="button" onClick={addKerja} style={btnAdd}><Plus size={16}/> Tambah Pekerjaan</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                    {kerjaList.map((item, index) => (
                        <div key={index} style={cardArray}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                                <div style={col}><label style={lb}>Nama Perusahaan</label><input style={inpSm} value={item.nama_perusahaan} onChange={e => updateKerja(index, 'nama_perusahaan', e.target.value)} /></div>
                                <div style={col}><label style={lb}>Posisi / Jenis</label><input style={inpSm} value={item.jenis_pekerjaan} onChange={e => updateKerja(index, 'jenis_pekerjaan', e.target.value)} /></div>
                                <div style={col}><label style={lb}>Masuk (Bln/Thn)</label>
                                    <div style={{display:'flex', gap:'5px'}}><input style={inpSm} placeholder="Bln" value={item.bln_awal} onChange={e => updateKerja(index, 'bln_awal', e.target.value)} /><input style={inpSm} placeholder="Thn" value={item.thn_awal} onChange={e => updateKerja(index, 'thn_awal', e.target.value)} /></div>
                                </div>
                                <div style={col}><label style={lb}>Selesai (Bln/Thn)</label>
                                    <div style={{display:'flex', gap:'5px'}}><input style={inpSm} placeholder="Bln" value={item.bln_akhir} onChange={e => updateKerja(index, 'bln_akhir', e.target.value)} /><input style={inpSm} placeholder="Thn" value={item.thn_akhir} onChange={e => updateKerja(index, 'thn_akhir', e.target.value)} /></div>
                                </div>
                                <button type="button" onClick={() => removeKerja(index)} style={btnDel}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {kerjaList.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada data pekerjaan...</div>}
                </div>

                {/* ── ARRAY: KONTAK KELUARGA ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{...sectionTitle, borderBottom: 'none', margin: 0}}>Kontak Keluarga & Kerabat</h4>
                    <button type="button" onClick={addKeluarga} style={btnAdd}><Plus size={16}/> Tambah Kontak</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                    {keluargaList.map((item, index) => (
                        <div key={index} style={cardArray}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr auto', gap: '15px', alignItems: 'end', marginBottom: '10px' }}>
                                <div style={col}><label style={lb}>Kategori Kontak</label>
                                    <select style={inpSm} value={item.tipe} onChange={e => updateKeluarga(index, 'tipe', e.target.value)}>
                                        <option value="DARURAT">Darurat (Di-hubungi)</option><option value="INDONESIA">Keluarga Indonesia</option><option value="JEPANG">Keluarga di Jepang</option>
                                    </select>
                                </div>
                                <div style={col}><label style={lb}>Nama Anggota</label><input style={inpSm} value={item.nama} onChange={e => updateKeluarga(index, 'nama', e.target.value)} /></div>
                                <div style={col}><label style={lb}>Hubungan</label><input style={inpSm} placeholder="Ayah/Istri" value={item.hubungan} onChange={e => updateKeluarga(index, 'hubungan', e.target.value)} /></div>
                                <div style={col}><label style={lb}>No HP / Telp</label><input style={inpSm} value={item.no_hp} onChange={e => updateKeluarga(index, 'no_hp', e.target.value)} /></div>
                                <button type="button" onClick={() => removeKeluarga(index)} style={btnDel}><Trash2 size={18}/></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div style={col}><label style={lb}>Alamat Lengkap (Kosongkan jika sama)</label><input style={inpSm} value={item.alamat} onChange={e => updateKeluarga(index, 'alamat', e.target.value)} /></div>
                                <div style={col}><label style={lb}>Umur / Penghasilan (Rp)</label><input style={inpSm} type="text" placeholder="Contoh: 45 Thn / 2500000" value={item.pendapatan} onChange={e => updateKeluarga(index, 'pendapatan', e.target.value)} /></div>
                            </div>
                        </div>
                    ))}
                    {keluargaList.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada kontak keluarga...</div>}
                </div>

                {/* ── ARRAY: ATTACHMENT DOKUMEN ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{...sectionTitle, borderBottom: 'none', margin: 0}}>Attachment Dokumen Pendukung</h4>
                    <button type="button" onClick={addFile} style={btnAdd}><Plus size={16}/> Tambah Dokumen</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                    {fileList.map((item, index) => (
                        <div key={index} style={cardArray}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr auto', gap: '15px', alignItems: 'end' }}>
                                <div style={col}>
                                    <label style={lb}>Judul File</label>
                                    <input style={inpSm} placeholder="Misal: KTP / PRA MCU" value={item.name} onChange={e => updateFile(index, 'name', e.target.value)} />
                                </div>
                                <div style={col}>
                                    <label style={lb}>Pilih Dokumen (URL)</label>
                                    <input style={{...inpSm}} placeholder="URL file dari Supabase Storage" value={item.url} onChange={e => updateFile(index, 'url', e.target.value)} />
                                </div>
                                <div style={col}>
                                    <label style={lb}>Catatan / Keterangan</label>
                                    <input style={inpSm} placeholder="Keterangan singkat" value={item.notes} onChange={e => updateFile(index, 'notes', e.target.value)} />
                                </div>
                                <button type="button" onClick={() => removeFile(index)} style={btnDel}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {fileList.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada dokumen yang diunggah...</div>}
                </div>

                {/* ── TOMBOL SUBMIT ── */}
                <div style={{ position: 'sticky', bottom: '-50px', background: 'white', padding: '20px 0', borderTop: '2px solid #e2e8f0', display: 'flex', gap: '15px', justifyContent: 'flex-end', zIndex: 10 }}>
                    <button type="button" onClick={() => setSelectedCV(null)} style={btnModal('#94a3b8', 'transparent')}>Batal</button>
                    <button type="submit" style={btnModal('#059669', '#059669', 'white')}>💾 Simpan Semua Perubahan</button>
                </div>

            </form>
        </div>
    );
}

// ── STYLES KHUSUS MODAL ──
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' };
const modalWide = { background: 'white', padding: '40px 50px', borderRadius: '20px', width: '1000px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' };
const sectionTitle = { fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' };
const col = { display: 'flex', flexDirection: 'column', gap: '8px' };
const lb = { fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inp = { padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '100%', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', backgroundColor: '#f8fafc', transition: 'border 0.2s' };
const inpSm = { ...inp, padding: '10px', fontSize: '0.85rem' };
const btnModal = (bg, border, color='#334155') => ({ padding: '12px 30px', borderRadius: '10px', border: `2px solid ${border || bg}`, background: bg, color: color, cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', transition: '0.2s' });
const btnAdd = { background: '#eff6ff', color: '#3b82f6', border: '1px dashed #3b82f6', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' };
const btnDel = { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px' };
const cardArray = { background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px' };