import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, Award, GraduationCap, BrainCircuit, Activity, Save, Trash2, Loader2 } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalRaport({ student, onClose, onSuccess, logActivity }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendidikanList, setPendidikanList] = useState([]); 
    const [raportData, setRaportData] = useState({
        kotoba: 0, bunpo: 0, dokkai: 0, choukai: 0, kaiwa: 0,
        kecerdasan: 'B', kedisiplinan: 'B', kerapihan: 'B', perilaku: 'B',
        kepribadian: 'B', teamwork: 'B', inisiatif: 'B', fisik: 'B'
    });

    useEffect(() => {
        if (student) {
            const parsedRaport = student.data_raport || {};
            const parsedPendidikan = student.pendidikan_history || [];
            setPendidikanList(Array.isArray(parsedPendidikan) ? parsedPendidikan : []);
            setRaportData({
                kotoba: parsedRaport.kotoba || 0, bunpo: parsedRaport.bunpo || 0,
                dokkai: parsedRaport.dokkai || 0, choukai: parsedRaport.choukai || 0, kaiwa: parsedRaport.kaiwa || 0,
                kecerdasan: parsedRaport.kecerdasan || 'B', kedisiplinan: parsedRaport.kedisiplinan || 'B',
                kerapihan: parsedRaport.kerapihan || 'B', perilaku: parsedRaport.perilaku || 'B',
                kepribadian: parsedRaport.kepribadian || 'B', teamwork: parsedRaport.teamwork || 'B',
                inisiatif: parsedRaport.inisiatif || 'B', fisik: parsedRaport.fisik || 'B'
            });
        }
    }, [student]);

    const handleRaportChange = (e) => {
        const { name, value, type } = e.target;
        setRaportData({ ...raportData, [name]: type === 'number' ? Number(value) : value });
    };

    const addPendidikan = () => setPendidikanList([...pendidikanList, { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' }]);
    const updatePendidikan = (index, field, value) => { const newArr = [...pendidikanList]; newArr[index][field] = value; setPendidikanList(newArr); };
    const removePendidikan = (index) => setPendidikanList(pendidikanList.filter((_, i) => i !== index));

    const saveRaportForm = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const totAkad = Number(raportData.kotoba) + Number(raportData.bunpo) + Number(raportData.dokkai) + Number(raportData.choukai) + Number(raportData.kaiwa);
            const finalAvg = Math.round(totAkad / 5);

            const { error } = await supabase.from('students')
                .update({ data_raport: raportData, pendidikan_history: pendidikanList, nilai_bahasa: finalAvg, updated_at: new Date() })
                .eq('id', student.id);

            if (error) throw error;
            await logActivity(`Update raport & history pendidikan: ${student.nama_lengkap}`);
            alert(`Data Raport disimpan. Rata-rata akhir siswa ditetapkan menjadi ${finalAvg}.`);
            onSuccess();
        } catch (err) { alert('Gagal menyimpan: ' + err.message); } finally { setIsSubmitting(false); }
    };

    const totalAkademikModal = Number(raportData.kotoba) + Number(raportData.bunpo) + Number(raportData.dokkai) + Number(raportData.choukai) + Number(raportData.kaiwa);
    const rataRataRaportModal = (totalAkademikModal / 5).toFixed(1);

    return (
        <div style={styles.modalOverlay}>
            <form onSubmit={saveRaportForm} style={{...styles.modalContent, width: '900px', maxHeight: '90vh', overflowY: 'auto', padding: 0}}>
                <div style={{...styles.modalHeader, position: 'sticky', top: 0, background: 'white', zIndex: 10}}>
                    <div><h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Award size={22} color={brandNavy}/> Input Raport Akhir & History</h3><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Siswa: <span style={{color: '#1e293b'}}>{student.nama_lengkap}</span></p></div>
                    <button type="button" onClick={onClose} style={styles.closeBtn}><X size={18}/></button>
                </div>
                
                <div style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{...styles.sectionTitle, marginBottom: 0, borderBottom: 'none'}}><GraduationCap size={18}/> Riwayat Pendidikan</h4>
                        <button type="button" onClick={addPendidikan} style={{ background: '#dbeafe', color: brandNavy, border: `1px solid ${brandNavy}`, padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>+ Tambah Pendidikan</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                        {pendidikanList.map((edu, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'end', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div><label style={styles.lb}>Jenjang</label><input style={styles.inpSm} value={edu.jenjang} onChange={e => updatePendidikan(idx, 'jenjang', e.target.value)} placeholder="SD/SMP" /></div>
                                <div><label style={styles.lb}>Nama Sekolah</label><input style={styles.inpSm} value={edu.nama_sekolah} onChange={e => updatePendidikan(idx, 'nama_sekolah', e.target.value)} /></div>
                                <div><label style={styles.lb}>Jurusan</label><input style={styles.inpSm} value={edu.jurusan} onChange={e => updatePendidikan(idx, 'jurusan', e.target.value)} placeholder="IPA/IPS" /></div>
                                <div><label style={styles.lb}>Masuk</label><div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={edu.bln_awal} onChange={e => updatePendidikan(idx, 'bln_awal', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={edu.thn_awal} onChange={e => updatePendidikan(idx, 'thn_awal', e.target.value)} /></div></div>
                                <div><label style={styles.lb}>Lulus</label><div style={{display:'flex', gap:'5px'}}><input style={styles.inpSm} placeholder="Bln" value={edu.bln_akhir} onChange={e => updatePendidikan(idx, 'bln_akhir', e.target.value)} /><input style={styles.inpSm} placeholder="Thn" value={edu.thn_akhir} onChange={e => updatePendidikan(idx, 'thn_akhir', e.target.value)} /></div></div>
                                <button type="button" onClick={() => removePendidikan(idx)} style={styles.btnDel}><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {pendidikanList.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>Belum ada data pendidikan...</div>}
                    </div>

                    <h4 style={styles.sectionTitle}><BrainCircuit size={18}/> Nilai Akademik Bahasa Jepang</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '15px' }}>
                        <div><label style={styles.lb}>Kotoba</label><input type="number" required min="0" max="100" style={styles.inp} name="kotoba" value={raportData.kotoba} onChange={handleRaportChange} /></div>
                        <div><label style={styles.lb}>Bunpo</label><input type="number" required min="0" max="100" style={styles.inp} name="bunpo" value={raportData.bunpo} onChange={handleRaportChange} /></div>
                        <div><label style={styles.lb}>Dokkai</label><input type="number" required min="0" max="100" style={styles.inp} name="dokkai" value={raportData.dokkai} onChange={handleRaportChange} /></div>
                        <div><label style={styles.lb}>Choukai</label><input type="number" required min="0" max="100" style={styles.inp} name="choukai" value={raportData.choukai} onChange={handleRaportChange} /></div>
                        <div><label style={styles.lb}>Kaiwa</label><input type="number" required min="0" max="100" style={styles.inp} name="kaiwa" value={raportData.kaiwa} onChange={handleRaportChange} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', background: '#f8fafc', padding: '15px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                        <div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>JUMLAH NILAI</div><div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>{totalAkademikModal}</div></div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>RATA-RATA</div><div style={{ fontSize: '1.5rem', fontWeight: 900, color: brandNavy }}>{rataRataRaportModal}</div></div>
                    </div>

                    <h4 style={styles.sectionTitle}><Activity size={18}/> Nilai Sikap & Kepribadian</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div><label style={styles.lb}>Kecerdasan</label><select style={styles.inp} name="kecerdasan" value={raportData.kecerdasan} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                        <div><label style={styles.lb}>Kedisiplinan</label><select style={styles.inp} name="kedisiplinan" value={raportData.kedisiplinan} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                        <div><label style={styles.lb}>Kerapihan</label><select style={styles.inp} name="kerapihan" value={raportData.kerapihan} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                        <div><label style={styles.lb}>Perilaku / Dewasa</label><select style={styles.inp} name="perilaku" value={raportData.perilaku} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                        <div><label style={styles.lb}>Kepribadian</label><select style={styles.inp} name="kepribadian" value={raportData.kepribadian} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                        <div><label style={styles.lb}>Team Work</label><select style={styles.inp} name="teamwork" value={raportData.teamwork} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                        <div><label style={styles.lb}>Inisiatif</label><select style={styles.inp} name="inisiatif" value={raportData.inisiatif} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                        <div><label style={styles.lb}>Ketahanan Fisik</label><select style={styles.inp} name="fisik" value={raportData.fisik} onChange={handleRaportChange}><option value="A">A</option><option value="B">B</option><option value="B-">B-</option><option value="C">C</option><option value="D">D</option></select></div>
                    </div>
                </div>
                
                <div style={{ position: 'sticky', bottom: 0, background: 'white', padding: '20px 25px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', zIndex: 10 }}>
                    <button type="button" onClick={onClose} style={styles.cancelBtn}>Batal</button>
                    <button type="submit" disabled={isSubmitting} style={styles.btnPrimary}>{isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Simpan Raport</>}</button>
                </div>
            </form>
        </div>
    );
}