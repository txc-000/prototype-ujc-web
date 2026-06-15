import React from 'react';
import { X, Wallet, Loader2 } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalPembayaranSiswa({
    isPayModalOpen, setIsPayModalOpen, selectedStudent, payForm, setPayForm,
    PAYMENT_STAGES, handleKategoriChange, handlePaymentSubmit, isSubmitting, payments
}) {
    if (!isPayModalOpen || !selectedStudent) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '700px', maxWidth: '95vw', padding: 0, overflow: 'hidden'}}>
                <div style={{ background: brandNavy, padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Kasir Pembayaran Tagihan</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Siswa: {selectedStudent.nama_lengkap} ({selectedStudent.isMitra ? 'Mitra' : 'Reguler'})</p>
                    </div>
                    <button type="button" onClick={() => setIsPayModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ padding: '30px', maxHeight: '75vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 800 }}>SISA TUNGGAKAN</div>
                            <div style={{ fontSize: '1.6rem', color: '#ef4444', fontWeight: 900 }}>Rp {selectedStudent.sisa_tagihan.toLocaleString('id-ID')}</div>
                        </div>
                        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '15px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 800 }}>TOTAL TERBAYAR</div>
                            <div style={{ fontSize: '1.6rem', color: '#10b981', fontWeight: 900 }}>Rp {selectedStudent.total_terbayar.toLocaleString('id-ID')}</div>
                        </div>
                    </div>

                    <form onSubmit={handlePaymentSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                        <h4 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Input Pembayaran Baru</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={styles.lb}>Kategori Tagihan</label>
                                <select required style={styles.inp} value={payForm.kategori} onChange={handleKategoriChange}>
                                    <option value="">-- Pilih Jenis --</option>
                                    {PAYMENT_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    <option value="LAINNYA">Lainnya / Cicilan Custom</option>
                                </select>
                            </div>
                            <div>
                                <label style={styles.lb}>Nominal (Rp)</label>
                                <input type="number" required min="1000" style={styles.inp} value={payForm.nominal} onChange={(e) => setPayForm({...payForm, nominal: e.target.value})} placeholder="Contoh: 1000000" />
                            </div>
                            <div>
                                <label style={styles.lb}>Metode Pembayaran</label>
                                <select required style={styles.inp} value={payForm.metode_pembayaran} onChange={(e) => setPayForm({...payForm, metode_pembayaran: e.target.value})}>
                                    <option value="TRANSFER">Transfer Bank</option>
                                    <option value="CASH">Tunai (Cash)</option>
                                </select>
                            </div>
                            <div>
                                <label style={styles.lb}>Keterangan Tambahan</label>
                                <input type="text" style={styles.inp} value={payForm.keterangan} onChange={(e) => setPayForm({...payForm, keterangan: e.target.value})} placeholder="Opsional..." />
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" disabled={isSubmitting} style={{...styles.btnPrimary, background: '#10b981', padding: '12px 25px', fontSize: '1rem' }}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Wallet size={20}/> Catat & Masukkan Buku Kas</>}
                            </button>
                        </div>
                    </form>

                    <h4 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>Histori Pembayaran Siswa</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                            <tr>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Tanggal</th>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Nominal</th>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Keterangan</th>
                                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Metode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Belum ada histori pembayaran.</td></tr>
                            ) : payments.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px', color: '#475569' }}>{new Date(p.tanggal_bayar || p.created_at).toLocaleDateString('id-ID')}</td>
                                    <td style={{ padding: '10px', fontWeight: 800, color: '#10b981' }}>Rp {Number(p.nominal).toLocaleString('id-ID')}</td>
                                    <td style={{ padding: '10px', color: '#334155' }}>{p.keterangan}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: p.metode_pembayaran === 'CASH' ? '#fef3c7' : '#e0e7ff', color: p.metode_pembayaran === 'CASH' ? '#b45309' : '#3730a3', fontWeight: 700, fontSize: '0.75rem' }}>{p.metode_pembayaran}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}