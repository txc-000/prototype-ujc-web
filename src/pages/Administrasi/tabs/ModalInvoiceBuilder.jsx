import React from 'react';
import { X, Layers, CheckCircle2, Edit, Plus, ArrowDownCircle, Trash2, AlertOctagon, Loader2, Save } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

const SATUAN_WAKTU = ['Bulan', 'Minggu', 'Hari', 'Lumpsum'];

export default function ModalInvoiceBuilder({
    isInvoiceModalOpen, setIsInvoiceModalOpen, invoiceForm, handleSelectKumiaiForInvoice,
    masterKumiai, activeInvoiceId, activeInvoiceNo, OPSI_PEMBAYARAN, setInvoiceForm,
    formAddStudent, setFormAddStudent, uniqueKaishaForKumiai, availableStudentsForKaisha,
    handleAddStudentToDraft, invoiceDraft, updateDraftItem, removeDraftItem,
    handleSaveInvoice, isSubmitting
}) {
    if (!isInvoiceModalOpen) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '1000px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '95vh', padding: '30px', overflow: 'hidden'}}>
                <div style={styles.modalHeader}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={22} color={brandNavy}/> Builder & Update Invoice
                        </h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pilih Kumiai, tambahkan siswa (anti duplikat).</p>
                    </div>
                    <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={styles.closeBtn}><X size={20} color="#64748b" /></button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: brandNavy, fontWeight: 900, textTransform: 'uppercase' }}>1. Pilih Target Kumiai</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                            <div>
                                <select required style={{...styles.inp, border: '2px solid #3b82f6', fontWeight: 800, color: '#1d4ed8', cursor: 'pointer'}} value={invoiceForm.kumiai} onChange={(e) => handleSelectKumiaiForInvoice(e.target.value)}>
                                    <option value="">-- Pilih Kumiai --</option>
                                    {masterKumiai.map((k, i) => {
                                        const namaKumiai = k.nama_kumiai || k.kumiai || k.nama || k.name || k.nama_perusahaan || Object.values(k)[1] || `Kumiai (${k.id})`;
                                        return <option key={i} value={namaKumiai}>{namaKumiai}</option>;
                                    })}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {activeInvoiceId ? (
                                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '10px 15px', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                        <Edit size={16}/> Mengedit Nota: <b>{activeInvoiceNo}</b>
                                    </div>
                                ) : invoiceForm.kumiai ? (
                                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 15px', borderRadius: '8px', color: '#047857', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                        <CheckCircle2 size={16}/> Membuat Nota Baru.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        {invoiceForm.kumiai && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
                                <div>
                                    <label style={{...styles.lb, color: '#3730a3'}}>Periode Tagihan</label>
                                    <div style={{ ...styles.inp, background: '#f1f5f9', color: brandNavy, fontWeight: 900, cursor: 'not-allowed' }}>
                                        {activeInvoiceId ? invoiceForm.periode : `Bulan ${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`}
                                    </div>
                                </div>
                                <div>
                                    <label style={styles.lb}>Opsi Termin Pembayaran</label>
                                    <select required style={{...styles.inp, cursor: 'pointer'}} value={invoiceForm.opsi_pembayaran} onChange={(e) => setInvoiceForm({...invoiceForm, opsi_pembayaran: e.target.value})}>
                                        {OPSI_PEMBAYARAN.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {invoiceForm.kumiai && (
                        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '2px dashed #94a3b8', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16}/> 2. Tambah Siswa / Item ke Tagihan</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                <div>
                                    <label style={styles.lb}>Filter Perusahaan (Kaisha)</label>
                                    <select style={{...styles.inpSm, cursor: 'pointer'}} value={formAddStudent.kaisha} onChange={(e) => setFormAddStudent({ kaisha: e.target.value, student_id: '' })}>
                                        <option value="">-- Pilih Kaisha --</option>
                                        {uniqueKaishaForKumiai.map((p, i) => <option key={i} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.lb}>Siswa (Belum Dimasukkan)</label>
                                    <select style={{...styles.inpSm, cursor: 'pointer'}} value={formAddStudent.student_id} onChange={(e) => setFormAddStudent({...formAddStudent, student_id: e.target.value})} disabled={!formAddStudent.kaisha || availableStudentsForKaisha.length === 0}>
                                        <option value="">-- Pilih Siswa --</option>
                                        {availableStudentsForKaisha.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={handleAddStudentToDraft} disabled={!formAddStudent.student_id} style={{ padding: '10px 15px', background: formAddStudent.student_id ? '#10b981' : '#e2e8f0', color: formAddStudent.student_id ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: formAddStudent.student_id ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Tambahkan ke Nota <ArrowDownCircle size={16}/>
                                </button>
                            </div>
                        </div>
                    )}

                    {invoiceDraft.length > 0 && (
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                    <tr>
                                        <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: 800 }}>Nama Siswa / Item</th>
                                        <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: 800, width: '180px' }}>Keterangan Teks</th>
                                        <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: 800, width: '130px' }}>Nominal (¥)</th>
                                        <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: 800, width: '160px' }}>Satuan (Qty & Unit)</th>
                                        <th style={{ padding: '10px 15px', textAlign: 'right', color: '#475569', fontWeight: 800 }}>Subtotal</th>
                                        <th style={{ padding: '10px 15px', textAlign: 'center', color: '#475569', fontWeight: 800, width: '50px' }}>Hapus</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(
                                        invoiceDraft.reduce((acc, item) => {
                                            if (!acc[item.perusahaan]) acc[item.perusahaan] = [];
                                            acc[item.perusahaan].push(item);
                                            return acc;
                                        }, {})
                                    ).map(([perusahaan, students]) => (
                                        <React.Fragment key={perusahaan}>
                                            <tr style={{ background: perusahaan === 'TUNGGAKAN SEBELUMNYA' ? '#fffbeb' : '#e2e8f0' }}>
                                                <td colSpan="6" style={{ padding: '8px 10px', fontWeight: 900, color: perusahaan === 'TUNGGAKAN SEBELUMNYA' ? '#b45309' : '#1e293b' }}>
                                                    {perusahaan === 'TUNGGAKAN SEBELUMNYA' ? <AlertOctagon size={14} style={{display:'inline', marginBottom:'-2px'}}/> : '🏢'} {perusahaan}
                                                </td>
                                            </tr>
                                            {students.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '10px 15px' }}>
                                                        <div style={{ fontWeight: 800, color: item.student_id === 'OUTSTANDING' ? '#ef4444' : '#334155' }}>
                                                            {item.student_id === 'OUTSTANDING' ? item.nama_lengkap : (
                                                                <input type="text" style={{border:'none', background:'transparent', outline:'none', fontWeight: 800, color: '#1e293b', width: '100%'}} value={item.nama_lengkap} onChange={(e) => updateDraftItem(item.student_id, 'nama_lengkap', e.target.value)} />
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Entri: {item.no_entri || item.tanggal_entri || '-'}</div>
                                                    </td>
                                                    <td style={{ padding: '10px 15px' }}>
                                                        {item.student_id === 'OUTSTANDING' ? <span style={{fontSize:'0.75rem', color:'#ef4444', fontWeight:800}}>{item.ket_durasi}</span> : (
                                                            <input type="text" style={{ ...styles.inpSm, padding: '6px 8px', fontSize: '0.75rem' }} value={item.ket_durasi} onChange={(e) => updateDraftItem(item.student_id, 'ket_durasi', e.target.value)} />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px 15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontWeight: 800, color: '#94a3b8' }}>¥</span>
                                                            <input type="number" style={{ ...styles.inpSm, padding: '6px 8px', width: '100%' }} value={item.nominal} onChange={(e) => updateDraftItem(item.student_id, 'nominal', e.target.value)} />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 15px' }}>
                                                        {item.student_id === 'OUTSTANDING' ? <div style={{textAlign:'center', fontWeight:700, color:'#64748b'}}>-</div> : (
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <input type="number" min="1" style={{ ...styles.inpSm, padding: '6px', width: '50px', textAlign: 'center' }} value={item.kuantitas} onChange={(e) => updateDraftItem(item.student_id, 'kuantitas', e.target.value)} />
                                                                <select style={{ ...styles.inpSm, padding: '6px', cursor: 'pointer', flex: 1 }} value={item.satuan} onChange={(e) => updateDraftItem(item.student_id, 'satuan', e.target.value)}>
                                                                    {SATUAN_WAKTU.map(s => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 900, color: brandNavy }}>
                                                        ¥ {(item.nominal * item.kuantitas).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '10px 15px', textAlign: 'center' }}>
                                                        {item.student_id !== 'OUTSTANDING' && (
                                                            <button type="button" onClick={() => removeDraftItem(item.student_id)} style={styles.btnDel}>
                                                                <Trash2 size={14}/>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '15px 25px', borderTop: '1px solid #e2e8f0', marginTop: '20px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL TAGIHAN YEN</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: brandNavy, lineHeight: '1.2' }}>
                            ¥ {Math.round(invoiceDraft.reduce((sum, item) => sum + (item.nominal * item.kuantitas), 0) * 1.11).toLocaleString()}
                        </div>
                    </div>
                    <button type="button" onClick={handleSaveInvoice} disabled={isSubmitting || invoiceDraft.length === 0} style={{...styles.btnPrimary, opacity: (isSubmitting || invoiceDraft.length===0) ? 0.6 : 1}}>
                        {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <><Save size={20}/> {activeInvoiceId ? 'Update & Cetak Ulang Nota' : 'Simpan & Cetak Nota Baru'}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}