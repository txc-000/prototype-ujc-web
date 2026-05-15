import React from 'react';
import { X, Users } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalDetailSiswa({ detailModal, onClose }) {
    if (!detailModal) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, width: '600px', maxHeight: '80vh', padding: 0 }}>
                <div style={styles.modalHeader}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={20} color={brandNavy}/> Rincian Data: {detailModal.label}
                        </h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total: {detailModal.items.length} Siswa</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><X size={18}/></button>
                </div>
                <div style={{ overflowY: 'auto', padding: '20px 25px', flex: 1 }}>
                    {detailModal.items.map((s, idx) => (
                        <div key={idx} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div>
                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{s.nama_lengkap}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{s.nik || 'NIK Kosong'} &nbsp;•&nbsp; {s.tahap_sekarang}</div>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: brandNavy, background: '#e0e7ff', padding: '6px 12px', borderRadius: '20px' }}>
                                {s.status_akhir || 'Proses'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}