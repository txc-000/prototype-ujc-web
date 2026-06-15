import React from 'react';
import { X, Save, Loader2, Receipt } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalCatatKas({
    isCashModalOpen, setIsCashModalOpen, cashForm, setCashForm, handleCashSubmit, isSubmitting
}) {
    if (!isCashModalOpen) return null;

    // Logika warna tombol dinamis menyesuaikan tipe kas
    let btnColor = '#10b981'; // Default MASUK (Hijau)
    if (cashForm.tipe === 'KELUAR') btnColor = '#ef4444'; // KELUAR (Merah)
    if (cashForm.tipe === 'DANA_MENGGANTUNG') btnColor = '#f59e0b'; // MENGGANTUNG (Kuning/Orange)

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '500px', maxWidth: '95vw', padding: '30px'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: brandNavy, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={22}/> Catat Kas Manual
                        </h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Pemasukan, Pengeluaran, atau Dana Menggantung.</p>
                    </div>
                    <button type="button" onClick={() => setIsCashModalOpen(false)} style={styles.closeBtn}><X size={20} color="#64748b" /></button>
                </div>

                <form onSubmit={handleCashSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                        <div>
                            <label style={styles.lb}>Tipe Transaksi</label>
                            <select required style={styles.inp} value={cashForm.tipe} onChange={(e) => setCashForm({...cashForm, tipe: e.target.value})}>
                                <option value="MASUK">Pemasukan (Kas Masuk)</option>
                                <option value="KELUAR">Pengeluaran (Kas Keluar)</option>
                                <option value="DANA_MENGGANTUNG">Dana Menggantung</option>
                            </select>
                        </div>
                        <div>
                            <label style={styles.lb}>Kategori</label>
                            <select required style={styles.inp} value={cashForm.kategori} onChange={(e) => setCashForm({...cashForm, kategori: e.target.value})}>
                                <option value="Operasional">Operasional LPK</option>
                                <option value="Gaji Pegawai">Gaji Pegawai</option>
                                <option value="Pembelian Aset">Pembelian Aset</option>
                                <option value="Titipan Siswa">Titipan Siswa / Jaminan</option>
                                <option value="Lain-lain">Lain-lain</option>
                            </select>
                        </div>
                        <div>
                            <label style={styles.lb}>Nominal (Rp)</label>
                            <input type="number" required min="100" style={styles.inp} value={cashForm.nominal} onChange={(e) => setCashForm({...cashForm, nominal: e.target.value})} placeholder="Contoh: 500000" />
                        </div>
                        <div>
                            <label style={styles.lb}>Keterangan (Opsional)</label>
                            <textarea style={{...styles.inp, resize: 'none', height: '80px'}} value={cashForm.keterangan} onChange={(e) => setCashForm({...cashForm, keterangan: e.target.value})} placeholder="Rincian transaksi..."></textarea>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setIsCashModalOpen(false)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                        <button type="submit" disabled={isSubmitting} style={{...styles.btnPrimary, background: btnColor}}>
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Simpan Data</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}