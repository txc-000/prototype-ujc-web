import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// IMPORT STYLES SENTRAL
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

export default function EditProfileModal({ selectedCV, setSelectedCV, handleSaveCV }) {
    // ── STATE ARRAY DINAMIS ──
    const [pendidikanList, setPendidikanList] = useState([]);
    const [kerjaList, setKerjaList] = useState([]);
    const [keluargaList, setKeluargaList] = useState([]);
    const [fileList, setFileList] = useState([]);
    
    // ── STATE MASTER BIDANG ──
    const [masterBidang, setMasterBidang] = useState([]);

    // ── LOAD DATA KE DALAM STATE ──
    useEffect(() => {
        // Ambil Master Bidang untuk Dropdown
        const fetchBidang = async () => {
            const { data } = await supabase.from('master_bidang').select('nama_bidang').order('nama_bidang', { ascending: true });
            if (data) setMasterBidang(data);
        };
        fetchBidang();

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
    const addKeluarga = () => setKeluargaList([...keluargaList, { hubungan: '', nama: '', pendapatan: '', umur: '', lokasi: 'INDONESIA' }]);
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
        <div style={styles.modalOverlay}>
            <form onSubmit={onSubmitForm} style={{ ...styles.modalContent, width: '1000px', marginBottom: '50px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', position: 'sticky', top: '-40px', background: 'white', padding: '20px 0', zIndex: 10, borderBottom: '2px solid #e2e8f0' }}>
                    <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>📝 Edit Lengkap Rirekisho</h2>
                    <button type="button" onClick={() => setSelectedCV(null)} style={styles.closeBtn}><X size={20} /></button>
                </div>
                
                {/* ── IDENTITAS UTAMA ── */}
                <h4 style={styles.sectionTitle}>Identitas Utama</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
                    <div style={styles.col}><label style={styles.lb}>Nama Lengkap</label><input style={styles.inp} value={selectedCV.nama_lengkap || ''} onChange={e => setSelectedCV({...selectedCV, nama_lengkap: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>氏名 (Nama Jepang)</label><input style={styles.inp} value={selectedCV.nama_jepang || ''} onChange={e => setSelectedCV({...selectedCV, nama_jepang: e.target.value})} /></div>
                    
                    <div style={styles.col}>
                        <label style={styles.lb}>Jenis Kelamin</label>
                        <select style={styles.inp} value={selectedCV.jenis_kelamin || ''} onChange={e => setSelectedCV({...selectedCV, jenis_kelamin: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="L">Laki-laki (男性)</option>
                            <option value="P">Perempuan (女性)</option>
                        </select>
                    </div>
                    <div style={styles.col}>
                        <label style={styles.lb}>Status Pernikahan</label>
                        <select style={styles.inp} value={selectedCV.status_pernikahan || ''} onChange={e => setSelectedCV({...selectedCV, status_pernikahan: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="Belum Menikah">Belum Menikah (未婚)</option>
                            <option value="Menikah">Menikah (既婚)</option>
                            <option value="Cerai">Cerai Hidup / Mati</option>
                        </select>
                    </div>

                    {/* ── FIELD BARU: MINAT BIDANG (SOLUSI UNTUK ANAK SMA) ── */}
                    <div style={{...styles.col, gridColumn: '1 / -1'}}>
                        <label style={{...styles.lb, color: '#10b981'}}>🎯 Minat Bidang (Tujuan Job Kaisha)</label>
                        <select style={{...styles.inp, border: '2px solid #10b981', background: '#ecfdf5'}} value={selectedCV.minat_bidang || ''} onChange={e => setSelectedCV({...selectedCV, minat_bidang: e.target.value})}>
                            <option value="">-- Pilih Minat Bidang Pekerjaan --</option>
                            {masterBidang.map(b => (
                                <option key={b.nama_bidang} value={b.nama_bidang}>{b.nama_bidang}</option>
                            ))}
                        </select>
                        <small style={{color: '#64748b', fontSize: '0.7rem'}}>* Pilih ini agar lulusan SMA tetap bisa dijodohkan dengan Job Order tertentu.</small>
                    </div>

                    <div style={styles.col}><label style={styles.lb}>Tempat Lahir</label><input style={styles.inp} value={selectedCV.tempat_lahir || ''} onChange={e => setSelectedCV({...selectedCV, tempat_lahir: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Tanggal Lahir</label><input type="date" style={styles.inp} value={selectedCV.tanggal_lahir || ''} onChange={e => setSelectedCV({...selectedCV, tanggal_lahir: e.target.value})} /></div>
                    
                    <div style={styles.col}><label style={styles.lb}>Agama</label>
                        <select style={styles.inp} value={selectedCV.agama || ''} onChange={e => setSelectedCV({...selectedCV, agama: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="Islam">Islam</option>
                            <option value="Kristen">Kristen Protestan</option>
                            <option value="Katolik">Kristen Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Konghucu">Konghucu</option>
                        </select>
                    </div>
                    <div style={styles.col}><label style={styles.lb}>No. HP Pribadi</label><input style={styles.inp} value={selectedCV.telepon || ''} onChange={e => setSelectedCV({...selectedCV, telepon: e.target.value})} /></div>
                    
                    <div style={{...styles.col, gridColumn: '1 / -1'}}><label style={styles.lb}>Alamat Lengkap</label><textarea style={{...styles.inp, height: '60px', resize: 'none'}} value={selectedCV.alamat || ''} onChange={e => setSelectedCV({...selectedCV, alamat: e.target.value})} /></div>
                </div>

                {/* ── DATA FISIK & LAINNYA ── */}
                <h4 style={styles.sectionTitle}>Data Fisik & Informasi Tambahan</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
                    <div style={styles.col}><label style={styles.lb}>Tinggi Badan (cm)</label><input style={styles.inp} type="number" step="0.1" value={selectedCV.tinggi_badan || ''} onChange={e => setSelectedCV({...selectedCV, tinggi_badan: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Berat Badan (kg)</label><input style={styles.inp} type="number" step="0.1" value={selectedCV.berat_badan || ''} onChange={e => setSelectedCV({...selectedCV, berat_badan: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Gol. Darah</label>
                        <select style={styles.inp} value={selectedCV.golongan_darah || ''} onChange={e => setSelectedCV({...selectedCV, golongan_darah: e.target.value})}><option value="">Pilih...</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select>
                    </div>
                    
                    <div style={styles.col}><label style={styles.lb}>Uk. Sepatu (cm)</label><input style={styles.inp} type="number" step="0.1" value={selectedCV.ukuran_sepatu || ''} onChange={e => setSelectedCV({...selectedCV, ukuran_sepatu: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Uk. Pinggang (cm)</label><input style={styles.inp} type="number" step="0.1" value={selectedCV.ukuran_pinggang || ''} onChange={e => setSelectedCV({...selectedCV, ukuran_pinggang: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Uk. Kepala (cm)</label><input style={styles.inp} type="number" step="0.1" value={selectedCV.ukuran_kepala || ''} onChange={e => setSelectedCV({...selectedCV, ukuran_kepala: e.target.value})} /></div>

                    <div style={styles.col}><label style={styles.lb}>Mata Kanan (R)</label><input style={styles.inp} type="number" step="0.1" placeholder="1.0" value={selectedCV.mata_kanan || ''} onChange={e => setSelectedCV({...selectedCV, mata_kanan: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Mata Kiri (L)</label><input style={styles.inp} type="number" step="0.1" placeholder="1.0" value={selectedCV.mata_kiri || ''} onChange={e => setSelectedCV({...selectedCV, mata_kiri: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Buta Warna?</label>
                        <select style={styles.inp} value={selectedCV.buta_warna || ''} onChange={e => setSelectedCV({...selectedCV, buta_warna: e.target.value})}><option value="">Pilih...</option><option value="Tidak">Tidak (無)</option><option value="Ya">Ya (有)</option></select>
                    </div>

                    <div style={styles.col}><label style={styles.lb}>Tangan Dominan</label><select style={styles.inp} value={selectedCV.tangan_dominan || ''} onChange={e => setSelectedCV({...selectedCV, tangan_dominan: e.target.value})}><option value="">Pilih...</option><option value="Kanan">Kanan</option><option value="Kiri">Kiri</option></select></div>
                    <div style={styles.col}><label style={styles.lb}>Hobi</label><input style={styles.inp} value={selectedCV.hobi || ''} onChange={e => setSelectedCV({...selectedCV, hobi: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Bakat Khusus</label><input style={styles.inp} value={selectedCV.bakat || ''} onChange={e => setSelectedCV({...selectedCV, bakat: e.target.value})} /></div>
                </div>

                {/* ── KEBIASAAN MEROKOK & MINUM ── */}
                <h4 style={styles.sectionTitle}>Kebiasaan (Merokok & Sake)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
                    <div style={styles.col}>
                        <label style={styles.lb}>Merokok (Saat Ini)</label>
                        <select style={styles.inp} value={selectedCV.merokok_sekarang || ''} onChange={e => setSelectedCV({...selectedCV, merokok_sekarang: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="吸いません。">Tidak (吸いません。)</option>
                            <option value="吸います。">Ya (吸います。)</option>
                        </select>
                    </div>
                    <div style={styles.col}>
                        <label style={styles.lb}>Merokok (Di Jepang)</label>
                        <select style={styles.inp} value={selectedCV.merokok_jepang || ''} onChange={e => setSelectedCV({...selectedCV, merokok_jepang: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="吸いません。">Tidak (吸いません。)</option>
                            <option value="吸います。">Ya (吸います。)</option>
                        </select>
                    </div>
                    <div style={styles.col}>
                        <label style={styles.lb}>Minum Sake / Alkohol</label>
                        <select style={styles.inp} value={selectedCV.minum_sake || ''} onChange={e => setSelectedCV({...selectedCV, minum_sake: e.target.value})}>
                            <option value="">Pilih...</option>
                            <option value="全然酒を飲みません">Tidak Sama Sekali (全然酒を飲みません)</option>
                            <option value="飲みます">Ya, Minum (飲みます)</option>
                        </select>
                    </div>
                </div>

                {/* ── KEPRIBADIAN & TUJUAN ── */}
                <h4 style={styles.sectionTitle}>Personalitas & Tujuan</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
                    <div style={styles.col}><label style={styles.lb}>Kelebihan (長所)</label><textarea style={{...styles.inp, height: '70px', resize: 'none'}} value={selectedCV.kelebihan || ''} onChange={e => setSelectedCV({...selectedCV, kelebihan: e.target.value})} /></div>
                    <div style={styles.col}><label style={styles.lb}>Kekurangan (短所)</label><textarea style={{...styles.inp, height: '70px', resize: 'none'}} value={selectedCV.kekurangan || ''} onChange={e => setSelectedCV({...selectedCV, kekurangan: e.target.value})} /></div>
                    <div style={{...styles.col, gridColumn: '1 / -1'}}><label style={styles.lb}>Tujuan ke Jepang</label><textarea style={{...styles.inp, height: '70px', resize: 'none'}} value={selectedCV.tujuan_jepang || ''} onChange={e => setSelectedCV({...selectedCV, tujuan_jepang: e.target.value})} /></div>
                    <div style={{...styles.col, gridColumn: '1 / -1'}}><label style={styles.lb}>Target Menabung (Rp / Yen)</label><input style={styles.inp} value={selectedCV.target_menabung || ''} onChange={e => setSelectedCV({...selectedCV, target_menabung: e.target.value})} /></div>
                </div>

                {/* ── ARRAY: PENDIDIKAN (KOLOM JURUSAN DIKEMBALIKAN) ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{...styles.sectionTitle, borderBottom: 'none', margin: 0}}>Riwayat Pendidikan</h4>
                    <button type="button" onClick={addPendidikan} style={styles.btnAddArray}><Plus size={16}/> Tambah Pendidikan</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                    {pendidikanList.map((item, index) => (
                        <div key={index} style={styles.cardArray}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                <div style={styles.col}><label style={styles.lb}>Jenjang</label>
                                    <select style={styles.inpSm} value={item.jenjang} onChange={e => updatePendidikan(index, 'jenjang', e.target.value)}>
                                        <option value="">Pilih...</option><option value="SD">SD (小学校)</option><option value="SMP">SMP (中学校)</option><option value="SMA">SMA (高校)</option><option value="SMK">SMK (専門高校)</option><option value="D3">D3 (準学士)</option><option value="S1">S1 (大学)</option>
                                    </select>
                                </div>
                                <div style={styles.col}><label style={styles.lb}>Nama Sekolah</label><input style={styles.inpSm} value={item.nama_sekolah} onChange={e => updatePendidikan(index, 'nama_sekolah', e.target.value)} /></div>
                                
                                {/* ── KOLOM JURUSAN DI SINI ── */}
                                <div style={styles.col}><label style={styles.lb}>Jurusan (IPA/IPS/Dll)</label><input style={styles.inpSm} value={item.jurusan} onChange={e => updatePendidikan(index, 'jurusan', e.target.value)} /></div>

                                <div style={styles.col}><label style={styles.lb}>Masuk (Bln/Thn)</label>
                                    <div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={item.bln_awal} onChange={e => updatePendidikan(index, 'bln_awal', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={item.thn_awal} onChange={e => updatePendidikan(index, 'thn_awal', e.target.value)} /></div>
                                </div>
                                <div style={styles.col}><label style={styles.lb}>Lulus (Bln/Thn)</label>
                                    <div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={item.bln_akhir} onChange={e => updatePendidikan(index, 'bln_akhir', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={item.thn_akhir} onChange={e => updatePendidikan(index, 'thn_akhir', e.target.value)} /></div>
                                </div>
                                <button type="button" onClick={() => removePendidikan(index)} style={styles.btnDel}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {pendidikanList.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada data pendidikan...</div>}
                </div>

                {/* ── ARRAY: PENGALAMAN KERJA ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{...styles.sectionTitle, borderBottom: 'none', margin: 0}}>Pengalaman Kerja</h4>
                    <button type="button" onClick={addKerja} style={styles.btnAddArray}><Plus size={16}/> Tambah Pekerjaan</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                    {kerjaList.map((item, index) => (
                        <div key={index} style={styles.cardArray}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                                <div style={styles.col}><label style={styles.lb}>Nama Perusahaan</label><input style={styles.inpSm} value={item.nama_perusahaan} onChange={e => updateKerja(index, 'nama_perusahaan', e.target.value)} /></div>
                                <div style={styles.col}><label style={styles.lb}>Posisi / Jenis</label><input style={styles.inpSm} value={item.jenis_pekerjaan} onChange={e => updateKerja(index, 'jenis_pekerjaan', e.target.value)} /></div>
                                <div style={styles.col}><label style={styles.lb}>Masuk (Bln/Thn)</label>
                                    <div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={item.bln_awal} onChange={e => updateKerja(index, 'bln_awal', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={item.thn_awal} onChange={e => updateKerja(index, 'thn_awal', e.target.value)} /></div>
                                </div>
                                <div style={styles.col}><label style={styles.lb}>Selesai (Bln/Thn)</label>
                                    <div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={item.bln_akhir} onChange={e => updateKerja(index, 'bln_akhir', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={item.thn_akhir} onChange={e => updateKerja(index, 'thn_akhir', e.target.value)} /></div>
                                </div>
                                <button type="button" onClick={() => removeKerja(index)} style={styles.btnDel}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {kerjaList.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada data pekerjaan...</div>}
                </div>

                {/* ── ARRAY: KONTAK KELUARGA ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{...styles.sectionTitle, borderBottom: 'none', margin: 0}}>Kontak Keluarga & Kerabat</h4>
                    <button type="button" onClick={addKeluarga} style={styles.btnAddArray}><Plus size={16}/> Tambah Kontak</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                    {keluargaList.map((item, index) => (
                        <div key={index} style={styles.cardArray}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 2fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                <div style={styles.col}><label style={styles.lb}>Hubungan</label><input style={styles.inpSm} placeholder="Ayah/Ibu" value={item.hubungan} onChange={e => updateKeluarga(index, 'hubungan', e.target.value)} /></div>
                                <div style={styles.col}><label style={styles.lb}>Nama Anggota</label><input style={styles.inpSm} value={item.nama} onChange={e => updateKeluarga(index, 'nama', e.target.value)} /></div>
                                <div style={styles.col}><label style={styles.lb}>Umur</label><input style={styles.inpSm} value={item.umur} onChange={e => updateKeluarga(index, 'umur', e.target.value)} /></div>
                                <div style={styles.col}><label style={styles.lb}>Pekerjaan / Pendapatan</label><input style={styles.inpSm} placeholder="Petani / 2500000" value={item.pendapatan} onChange={e => updateKeluarga(index, 'pendapatan', e.target.value)} /></div>
                                <div style={styles.col}><label style={styles.lb}>Lokasi</label>
                                    <select style={styles.inpSm} value={item.lokasi || 'INDONESIA'} onChange={e => updateKeluarga(index, 'lokasi', e.target.value)}>
                                        <option value="INDONESIA">Di Indonesia</option>
                                        <option value="JEPANG">Di Jepang</option>
                                    </select>
                                </div>
                                <button type="button" onClick={() => removeKeluarga(index)} style={styles.btnDel}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {keluargaList.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada kontak keluarga...</div>}
                </div>

                {/* ── ARRAY: ATTACHMENT DOKUMEN ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{...styles.sectionTitle, borderBottom: 'none', margin: 0}}>Attachment Dokumen Pendukung</h4>
                    <button type="button" onClick={addFile} style={styles.btnAddArray}><Plus size={16}/> Tambah Dokumen</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                    {fileList.map((item, index) => (
                        <div key={index} style={styles.cardArray}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr auto', gap: '15px', alignItems: 'end' }}>
                                <div style={styles.col}>
                                    <label style={styles.lb}>Judul File</label>
                                    <input style={styles.inpSm} placeholder="Misal: KTP / PRA MCU" value={item.name} onChange={e => updateFile(index, 'name', e.target.value)} />
                                </div>
                                <div style={styles.col}>
                                    <label style={styles.lb}>Pilih Dokumen (URL)</label>
                                    <input style={{...styles.inpSm}} placeholder="URL file dari Supabase Storage" value={item.url} onChange={e => updateFile(index, 'url', e.target.value)} />
                                </div>
                                <div style={styles.col}>
                                    <label style={styles.lb}>Catatan / Keterangan</label>
                                    <input style={styles.inpSm} placeholder="Keterangan singkat" value={item.notes} onChange={e => updateFile(index, 'notes', e.target.value)} />
                                </div>
                                <button type="button" onClick={() => removeFile(index)} style={styles.btnDel}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {fileList.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada dokumen yang diunggah...</div>}
                </div>

                {/* ── TOMBOL SUBMIT ── */}
                <div style={{ position: 'sticky', bottom: '-50px', background: 'white', padding: '20px 0', borderTop: '2px solid #e2e8f0', display: 'flex', gap: '15px', justifyContent: 'flex-end', zIndex: 10 }}>
                    <button type="button" onClick={() => setSelectedCV(null)} style={styles.cancelBtn}>Batal</button>
                    <button type="submit" style={{ ...styles.btnPrimary, background: '#059669' }}>💾 Simpan Semua Perubahan</button>
                </div>

            </form>
        </div>
    );
}