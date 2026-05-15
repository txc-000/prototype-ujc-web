import React from 'react';
import { X, List, Activity } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalAktivitasKaryawan({ activityModal, isLoadingActivities, employeeActivities, formatActivityDate, onClose }) {
    if (!activityModal) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, width: '600px', maxHeight: '85vh', padding: 0 }}>
                <div style={styles.modalHeader}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, color: brandNavy, display: 'flex', alignItems: 'center', gap: '10px' }}><List size={20}/> Log Aktivitas Karyawan</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{activityModal.nama_lengkap} ({activityModal.role})</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><X size={18}/></button>
                </div>
                
                <div style={{ overflowY: 'auto', padding: '25px', flex: 1 }}>
                    {isLoadingActivities ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><Activity className="animate-spin" size={30} style={{margin: '0 auto 10px'}}/> Sedang menarik data log...</div>
                    ) : employeeActivities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600, border: '2px dashed #cbd5e1', borderRadius: '12px' }}>Karyawan ini belum mencatat aktivitas apa pun di sistem.</div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {employeeActivities.map((act, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: `3px solid ${brandNavy}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: '8px', height: '8px', background: brandNavy, borderRadius: '50%' }}></div>
                                        </div>
                                        <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '5px' }}>{formatActivityDate(act.created_at)}</div>
                                            <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, lineHeight: '1.4' }}>{act.keterangan}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}