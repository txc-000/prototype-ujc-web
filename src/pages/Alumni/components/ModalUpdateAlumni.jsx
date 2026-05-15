import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalUpdateAlumni({ 
    isModalOpen, setIsModalOpen, 
    selectedAlumni, updateForm, setUpdateForm, handleUpdateStatus 
}) {
    if (!isModalOpen) return null;

    return (
        <div style={styles.modalOverlay}>
            <form onSubmit={handleUpdateStatus} style={{ ...styles.modalContent, width: '450px', padding: '35px' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>Update Status Pekerja</h2>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b' }}>Perbarui kondisi terkini alumni di Jepang.</p>
                
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 900, color: brandNavy, fontSize: '1.1rem' }}>{selectedAlumni?.nama_lengkap}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>📍 {selectedAlumni?.perusahaan_tujuan || 'Perusahaan tidak diketahui'}</div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={styles.lb}>Status Kondisi Saat Ini</label>
                    <select 
                        required 
                        value={updateForm.status_akhir} 
                        onChange={e => setUpdateForm({...updateForm, status_akhir: e.target.value})}
                        style={{ ...styles.inp, padding: '14px', border: '2px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
                    >
                        <option value="AKTIF BEKERJA">✅ Aktif Bekerja (Aman)</option>
                        <option value="PINDAH KAISHA">🔄 Pindah Perusahaan</option>
                        <option value="SELESAI KONTRAK">🎓 Selesai Kontrak (Lulus)</option>
                        <option value="PULANG AWAL">⚠️ Pulang Lebih Awal</option>
                        <option value="KABUR">🚨 KABUR (Runaway)</option>
                    </select>
                    
                    {updateForm.status_akhir === 'KABUR' && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <AlertTriangle size={14}/> Perhatian: Status KABUR akan mempengaruhi rating lembaga.
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Batal</button>
                    <button type="submit" style={styles.btnPrimary}>Simpan Pembaruan</button>
                </div>
            </form>
        </div>
    );
}