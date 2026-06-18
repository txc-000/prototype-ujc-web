import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileText, X, GraduationCap, UserCog, Building2, CalendarDays, History, PlaneTakeoff, Trash2, Loader2, Save } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalOtit({ student, masterMitra, masterKaisha, masterKumiai, masterBidang, onClose, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendidikanList, setPendidikanList] = useState([]); 
    const [otitData, setOtitData] = useState({
        nik: '', nama_lengkap: '', nama_jepang: '', tempat_lahir: '', tanggal_lahir: '',
        jenis_kelamin: '', agama: '', telepon: '', alamat: '', tinggi_badan: '', berat_badan: '', golongan_darah: '',
        posisi_siswa: '', group_suisen: '', jumlah_peserta_suisen: '',
        mulai_belajar: '', selesai_belajar: '', rencana_berangkat: '', tgl_cetak_cv: '',
        nama_kumiai: '', perusahaan_penerima: '', perusahaan_haken: '',
        program_jepang: '', lpk_mitra: '', kelompok_pekerjaan: '', sub_kelompok_pekerjaan: '',
        is_eks_jepang: 'Tidak', eks_dari: '', eks_sampai: '', eks_status_tinggal: '',
        masa_pulang_dari: '', masa_pulang_sampai: '',
        eks_kapal_bangunan: 'Tidak', masa_pulang_kapal_dari: '', masa_pulang_kapal_sampai: '',
        eks_magang_tipe: '', eks_epa: 'Tidak'
    });

    useEffect(() => {
        if (student) {
            const parsedOtit = typeof student.data_otit === 'string' ? JSON.parse(student.data_otit || '{}') : (student.data_otit || {});
            const parsedPendidikan = typeof student.pendidikan_history === 'string' ? JSON.parse(student.pendidikan_history || '[]') : (student.pendidikan_history || []);
            
            setPendidikanList(Array.isArray(parsedPendidikan) ? parsedPendidikan : []);
            setOtitData({
                nik: student.nik || '', nama_lengkap: student.nama_lengkap || '', nama_jepang: student.nama_jepang || '', 
                tempat_lahir: student.tempat_lahir || '', tanggal_lahir: student.tanggal_lahir || '', jenis_kelamin: student.jenis_kelamin || '', 
                agama: student.agama || '', telepon: student.telepon || student.no_telp || '', alamat: student.alamat || '', 
                tinggi_badan: student.tinggi_badan || '', berat_badan: student.berat_badan || '', golongan_darah: student.golongan_darah || '',
                
                posisi_siswa: parsedOtit.posisi_siswa || '', group_suisen: parsedOtit.group_suisen || '', jumlah_peserta_suisen: parsedOtit.jumlah_peserta_suisen || '',
                mulai_belajar: parsedOtit.mulai_belajar || '', selesai_belajar: parsedOtit.selesai_belajar || '', rencana_berangkat: parsedOtit.rencana_berangkat || '', tgl_cetak_cv: parsedOtit.tgl_cetak_cv || '',
                nama_kumiai: parsedOtit.nama_kumiai || '', perusahaan_penerima: parsedOtit.perusahaan_penerima || '', perusahaan_haken: parsedOtit.perusahaan_haken || '',
                program_jepang: parsedOtit.program_jepang || '', lpk_mitra: parsedOtit.lpk_mitra || '', kelompok_pekerjaan: parsedOtit.kelompok_pekerjaan || '', sub_kelompok_pekerjaan: parsedOtit.sub_kelompok_pekerjaan || '',
                
                is_eks_jepang: parsedOtit.is_eks_jepang || 'Tidak', eks_dari: parsedOtit.eks_dari || '', eks_sampai: parsedOtit.eks_sampai || '',
                eks_status_tinggal: parsedOtit.eks_status_tinggal || '', masa_pulang_dari: parsedOtit.masa_pulang_dari || '', masa_pulang_sampai: parsedOtit.masa_pulang_sampai || '',
                eks_kapal_bangunan: parsedOtit.eks_kapal_bangunan || 'Tidak', masa_pulang_kapal_dari: parsedOtit.masa_pulang_kapal_dari || '', masa_pulang_kapal_sampai: parsedOtit.masa_pulang_kapal_sampai || '',
                eks_magang_tipe: parsedOtit.eks_magang_tipe || '', eks_epa: parsedOtit.eks_epa || 'Tidak'
            });
        }
    }, [student]);

    const handleOtitChange = (e) => setOtitData({ ...otitData, [e.target.name]: e.target.value });
    const addPendidikan = () => setPendidikanList([...pendidikanList, { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' }]);
    const updatePendidikan = (index, field, value) => { const newArr = [...pendidikanList]; newArr[index][field] = value; setPendidikanList(newArr); };
    const removePendidikan = (index) => setPendidikanList(pendidikanList.filter((_, i) => i !== index));

    const saveOtitForm = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const mainColumnsPayload = {
                nik: otitData.nik, nama_lengkap: otitData.nama_lengkap, nama_jepang: otitData.nama_jepang,
                tempat_lahir: otitData.tempat_lahir, tanggal_lahir: otitData.tanggal_lahir, jenis_kelamin: otitData.jenis_kelamin,
                agama: otitData.agama, telepon: otitData.telepon, alamat: otitData.alamat,
                tinggi_badan: otitData.tinggi_badan ? parseInt(otitData.tinggi_badan) : null,
                berat_badan: otitData.berat_badan ? parseInt(otitData.berat_badan) : null,
                golongan_darah: otitData.golongan_darah, pendidikan_history: pendidikanList, updated_at: new Date()
            };

            const otitJsonPayload = {
                posisi_siswa: otitData.posisi_siswa, group_suisen: otitData.group_suisen, jumlah_peserta_suisen: otitData.jumlah_peserta_suisen,
                mulai_belajar: otitData.mulai_belajar, selesai_belajar: otitData.selesai_belajar, rencana_berangkat: otitData.rencana_berangkat, tgl_cetak_cv: otitData.tgl_cetak_cv,
                nama_kumiai: otitData.nama_kumiai, perusahaan_penerima: otitData.perusahaan_penerima, perusahaan_haken: otitData.perusahaan_haken,
                program_jepang: otitData.program_jepang, lpk_mitra: otitData.lpk_mitra, kelompok_pekerjaan: otitData.kelompok_pekerjaan, sub_kelompok_pekerjaan: otitData.sub_kelompok_pekerjaan,
                is_eks_jepang: otitData.is_eks_jepang, eks_dari: otitData.eks_dari, eks_sampai: otitData.eks_sampai,
                eks_status_tinggal: otitData.eks_status_tinggal, masa_pulang_dari: otitData.masa_pulang_dari, masa_pulang_sampai: otitData.masa_pulang_sampai,
                eks_kapal_bangunan: otitData.eks_kapal_bangunan, masa_pulang_kapal_dari: otitData.masa_pulang_kapal_dari, masa_pulang_kapal_sampai: otitData.masa_pulang_kapal_sampai,
                eks_magang_tipe: otitData.eks_magang_tipe, eks_epa: otitData.eks_epa
            };

            const { error } = await supabase.from('students').update({ ...mainColumnsPayload, data_otit: otitJsonPayload }).eq('id', student.id);
            if (error) throw error;
            alert('Data Lengkap Siswa, Pendidikan, & Formulir OTIT berhasil disimpan!');
            onSuccess();
        } catch (err) { alert('Gagal menyimpan: ' + err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div style={styles.modalOverlay}>
            <form onSubmit={saveOtitForm} style={{...styles.modalContent, width: '1000px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column'}}>
                <div style={{...styles.modalHeader, padding: '25px', position: 'sticky', top: 0, zIndex: 10, background: 'white'}}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={22} color={brandNavy}/> Verifikasi Data OTIT & Dokumen Siswa
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Atas Nama: <span style={{color: '#1e293b'}}>{student.nama_lengkap}</span></p>
                    </div>
                    <button type="button" onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>
                
                <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
                    <h4 style={styles.sectionTitle}><UserCog size={18}/> Identitas Dasar</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div><label style={styles.lb}>NIK</label><input required style={styles.inp} name="nik" value={otitData.nik} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}>Nama Lengkap Sesuai Dokumen</label><input required style={styles.inp} name="nama_lengkap" value={otitData.nama_lengkap} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}>Nama Jepang (Katakana)</label><input style={styles.inp} name="nama_jepang" value={otitData.nama_jepang} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}>Tempat Lahir</label><input required style={styles.inp} name="tempat_lahir" value={otitData.tempat_lahir} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}>Tanggal Lahir</label><input type="date" required style={styles.inp} name="tanggal_lahir" value={otitData.tanggal_lahir} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}>Jenis Kelamin</label><select required style={styles.inp} name="jenis_kelamin" value={otitData.jenis_kelamin} onChange={handleOtitChange}><option value="">Pilih...</option><option value="L">Laki-Laki</option><option value="P">Perempuan</option></select></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div><label style={styles.lb}>Gol. Darah</label><select style={styles.inp} name="golongan_darah" value={otitData.golongan_darah} onChange={handleOtitChange}><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select></div>
                            <div><label style={styles.lb}>TB (cm)</label><input type="number" style={styles.inp} name="tinggi_badan" value={otitData.tinggi_badan} onChange={handleOtitChange} /></div>
                            <div><label style={styles.lb}>BB (kg)</label><input type="number" style={styles.inp} name="berat_badan" value={otitData.berat_badan} onChange={handleOtitChange} /></div>
                        </div>
                        <div><label style={styles.lb}>Agama</label><select style={styles.inp} name="agama" value={otitData.agama} onChange={handleOtitChange}><option value="">Pilih...</option><option value="Islam">Islam</option><option value="Kristen">Kristen Protestan</option><option value="Katolik">Kristen Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option></select></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={styles.lb}>No. Telepon / WhatsApp</label><input required style={styles.inp} name="telepon" value={otitData.telepon} onChange={handleOtitChange} /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={styles.lb}>Alamat Lengkap</label><textarea required style={{...styles.inp, resize: 'vertical'}} rows="2" name="alamat" value={otitData.alamat} onChange={handleOtitChange}></textarea></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{...styles.sectionTitle, marginBottom: 0, borderBottom: 'none'}}><GraduationCap size={18}/> Riwayat Pendidikan</h4>
                        <button type="button" onClick={addPendidikan} style={{ background: '#dbeafe', color: brandNavy, border: `1px solid ${brandNavy}`, padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>+ Tambah Pendidikan</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                        {pendidikanList.map((edu, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'end', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div><label style={styles.lb}>Jenjang</label><input style={styles.inpSm} value={edu.jenjang} onChange={e => updatePendidikan(idx, 'jenjang', e.target.value)} /></div>
                                <div><label style={styles.lb}>Nama Sekolah</label><input style={styles.inpSm} value={edu.nama_sekolah} onChange={e => updatePendidikan(idx, 'nama_sekolah', e.target.value)} /></div>
                                <div><label style={styles.lb}>Jurusan</label><input style={styles.inpSm} value={edu.jurusan} onChange={e => updatePendidikan(idx, 'jurusan', e.target.value)} /></div>
                                <div><label style={styles.lb}>Masuk</label><div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} value={edu.bln_awal} onChange={e => updatePendidikan(idx, 'bln_awal', e.target.value)} /><input style={styles.inpSm} value={edu.thn_awal} onChange={e => updatePendidikan(idx, 'thn_awal', e.target.value)} /></div></div>
                                <div><label style={styles.lb}>Lulus</label><div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} value={edu.bln_akhir} onChange={e => updatePendidikan(idx, 'bln_akhir', e.target.value)} /><input style={styles.inpSm} value={edu.thn_akhir} onChange={e => updatePendidikan(idx, 'thn_akhir', e.target.value)} /></div></div>
                                <button type="button" onClick={() => removePendidikan(idx)} style={styles.btnDel}><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>

                    <h4 style={styles.sectionTitle}><UserCog size={18}/> Status Penempatan & Grup</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                        <div><label style={styles.lb}>Posisi Siswa Saat Ini</label><select style={styles.inp} name="posisi_siswa" value={otitData.posisi_siswa} onChange={handleOtitChange}><option value="">Pilih Posisi...</option><option value="Report 3 Gou">Report 3 Gou</option><option value="Belum Terbang">Belum Terbang</option></select></div>
                        <div><label style={styles.lb}>Group Suisen</label><input style={styles.inp} name="group_suisen" value={otitData.group_suisen} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}>Jumlah Peserta Suisen</label><input type="number" style={styles.inp} name="jumlah_peserta_suisen" value={otitData.jumlah_peserta_suisen} onChange={handleOtitChange} /></div>
                    </div>

                    <h4 style={styles.sectionTitle}><Building2 size={18}/> Program, Perusahaan & Mitra</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                        <div><label style={styles.lb}>Program Ke Jepang</label><select required style={styles.inp} name="program_jepang" value={otitData.program_jepang} onChange={handleOtitChange}><option value="">-- Pilih --</option><option value="Pemagangan (Jisshusei)">Pemagangan (Jisshusei)</option><option value="Tokutei Ginou (TG)">Tokutei Ginou (TG)</option><option value="Engineering (Gijinkoku)">Engineering (Gijinkoku)</option></select></div>
                        <div><label style={styles.lb}>Nama LPK Mitra</label><select style={styles.inp} name="lpk_mitra" value={otitData.lpk_mitra} onChange={handleOtitChange}><option value="">-- Tidak Ada --</option>{masterMitra.map(m => <option key={m.id} value={m.nama_mitra}>{m.nama_mitra}</option>)}</select></div>
                        <div><label style={styles.lb}>Nama Kumiai</label><select style={styles.inp} name="nama_kumiai" value={otitData.nama_kumiai} onChange={handleOtitChange}><option value="">-- Pilih Kumiai --</option>{masterKumiai.map(k => <option key={k.id} value={k.nama_kumiai}>{k.nama_kumiai}</option>)}</select></div>
                        <div><label style={styles.lb}>Perusahaan Penerima</label><select style={styles.inp} name="perusahaan_penerima" value={otitData.perusahaan_penerima} onChange={handleOtitChange}><option value="">-- Pilih Kaisha --</option>{masterKaisha.map(k => <option key={k.id} value={k.nama_perusahaan || k.nama_kaisha}>{k.nama_perusahaan || k.nama_kaisha}</option>)}</select></div>
                        <div><label style={styles.lb}>Perusahaan Haken</label><select style={styles.inp} name="perusahaan_haken" value={otitData.perusahaan_haken} onChange={handleOtitChange}><option value="">-- Tidak Ada --</option>{masterKaisha.map(k => <option key={k.id} value={k.nama_perusahaan || k.nama_kaisha}>{k.nama_perusahaan || k.nama_kaisha}</option>)}</select></div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{flex: 1}}><label style={styles.lb}>Kel. Pekerjaan</label><select style={styles.inp} name="kelompok_pekerjaan" value={otitData.kelompok_pekerjaan} onChange={handleOtitChange}><option value="">-- Pilih Bidang --</option>{masterBidang.map(b => <option key={b.nama_bidang} value={b.nama_bidang}>{b.nama_bidang}</option>)}</select></div>
                            <div style={{flex: 1}}><label style={styles.lb}>Sub Kelompok</label><input style={styles.inp} name="sub_kelompok_pekerjaan" value={otitData.sub_kelompok_pekerjaan} onChange={handleOtitChange} /></div>
                        </div>
                    </div>

                    <h4 style={styles.sectionTitle}><CalendarDays size={18}/> Jadwal Pendidikan & Keberangkatan</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                        <div><label style={styles.lb}>Mulai Belajar Nihongo</label><input type="date" required style={styles.inp} name="mulai_belajar" value={otitData.mulai_belajar} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}>Selesai Belajar</label><input type="date" required style={styles.inp} name="selesai_belajar" value={otitData.selesai_belajar} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}>Tgl Cetak CV/Surat</label><input type="date" style={styles.inp} name="tgl_cetak_cv" value={otitData.tgl_cetak_cv} onChange={handleOtitChange} /></div>
                        <div><label style={styles.lb}><PlaneTakeoff size={14}/> Rencana Berangkat</label><input type="date" required style={{...styles.inp, border: '2px solid #3b82f6'}} name="rencana_berangkat" value={otitData.rencana_berangkat} onChange={handleOtitChange} /></div>
                    </div>

                    <h4 style={styles.sectionTitle}><History size={18}/> Riwayat Eks-Jepang</h4>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={styles.lb}>Apakah ada pengalaman ke Jepang sebelumnya?</label>
                            <select style={{...styles.inp, width: '200px'}} name="is_eks_jepang" value={otitData.is_eks_jepang} onChange={handleOtitChange}><option value="Tidak">Tidak Ada</option><option value="Ya">Ya, Pernah</option></select>
                        </div>
                        {otitData.is_eks_jepang === 'Ya' && (
                            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
                                <div><label style={styles.lb}>Pengalaman Dari</label><input type="month" style={styles.inp} name="eks_dari" value={otitData.eks_dari} onChange={handleOtitChange} /></div>
                                <div><label style={styles.lb}>Pengalaman Sampai</label><input type="month" style={styles.inp} name="eks_sampai" value={otitData.eks_sampai} onChange={handleOtitChange} /></div>
                                <div style={{gridColumn: '1 / -1', display: 'flex', gap: '15px'}}>
                                    <div style={{flex: 1}}><label style={styles.lb}>Status Tinggal Jisshusei</label><select style={styles.inp} name="eks_status_tinggal" value={otitData.eks_status_tinggal} onChange={handleOtitChange}><option value="">Pilih...</option><option value="Jisshusei">Ya (Jisshusei)</option><option value="Jisshu Igai">Jisshu Igai</option><option value="Lainnya">Lainnya</option></select></div>
                                    <div style={{flex: 1}}><label style={styles.lb}>Masa Pulang Dari</label><input type="month" style={styles.inp} name="masa_pulang_dari" value={otitData.masa_pulang_dari} onChange={handleOtitChange} /></div>
                                    <div style={{flex: 1}}><label style={styles.lb}>Masa Pulang Sampai</label><input type="month" style={styles.inp} name="masa_pulang_sampai" value={otitData.masa_pulang_sampai} onChange={handleOtitChange} /></div>
                                </div>
                                <div style={{gridColumn: '1 / -1', display: 'flex', gap: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px'}}>
                                    <div style={{flex: 1}}><label style={styles.lb}>Ada Pengalaman Kapal?</label><select style={styles.inp} name="eks_kapal_bangunan" value={otitData.eks_kapal_bangunan} onChange={handleOtitChange}><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select></div>
                                    <div style={{flex: 1}}><label style={styles.lb}>Masa Pulang Kapal Dari</label><input type="month" style={styles.inp} name="masa_pulang_kapal_dari" value={otitData.masa_pulang_kapal_dari} onChange={handleOtitChange} disabled={otitData.eks_kapal_bangunan === 'Tidak'} /></div>
                                    <div style={{flex: 1}}><label style={styles.lb}>Masa Pulang Kapal Sampai</label><input type="month" style={styles.inp} name="masa_pulang_kapal_sampai" value={otitData.masa_pulang_kapal_sampai} onChange={handleOtitChange} disabled={otitData.eks_kapal_bangunan === 'Tidak'} /></div>
                                </div>
                                <div><label style={styles.lb}>Magang Tipe Berapa?</label><select style={styles.inp} name="eks_magang_tipe" value={otitData.eks_magang_tipe} onChange={handleOtitChange}><option value="">Pilih...</option><option value="Magang Tipe 1">Magang Tipe 1</option><option value="Magang Tipe 2">Magang Tipe 2</option><option value="Magang Tipe 3">Magang Tipe 3</option></select></div>
                                <div><label style={styles.lb}>Pengalaman EPA?</label><select style={styles.inp} name="eks_epa" value={otitData.eks_epa} onChange={handleOtitChange}><option value="Tidak">Tidak</option><option value="Ya">Ya</option></select></div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ padding: '20px 25px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc', position: 'sticky', bottom: 0, zIndex: 10 }}>
                    <button type="button" onClick={onClose} style={styles.cancelBtn}>Tutup</button>
                    <button type="submit" disabled={isSubmitting} style={styles.btnPrimary}><Save size={18}/> {isSubmitting ? 'Menyimpan...' : 'Simpan Data OTIT'}</button>
                </div>
            </form>
        </div>
    );
}