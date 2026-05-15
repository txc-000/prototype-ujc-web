import React from 'react';
import { X, Bookmark, Briefcase, Users } from 'lucide-react';
import { styles } from '../../Reguler/components/dashboardStyles';

export default function ModalDetailKumiai({ kumiaiDetailModal, onClose }) {
    if (!kumiaiDetailModal) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, width: '600px', maxHeight: '80vh', padding: 0 }}>
                <div style={{ ...styles.modalHeader, background: '#fffbeb' }}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 900, color: '#92400e', display: 'flex', alignItems: 'center', gap: '10px' }}><Bookmark size={20} color="#d97706"/> Riwayat Job: {kumiaiDetailModal.name}</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>Total Repeat Order: {kumiaiDetailModal.count} | Akumulasi Kuota: {kumiaiDetailModal.totalKuota}</p>
                    </div>
                    <button onClick={onClose} style={{ ...styles.closeBtn, background: '#fde68a', color: '#92400e' }}><X size={18}/></button>
                </div>
                <div style={{ overflowY: 'auto', padding: '20px 25px', flex: 1 }}>
                    {kumiaiDetailModal.jobs.map((job, idx) => {
                        const statusJob = job.status ? job.status.toString().trim().toLowerCase() : '';
                        return (
                            <div key={idx} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '15px', background: '#f8fafc', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{job.perusahaan}</div>
                                    <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: statusJob === 'aktif' ? '#dcfce7' : '#f1f5f9', color: statusJob === 'aktif' ? '#166534' : '#64748b' }}>
                                        {job.status || 'N/A'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 600 }}>
                                    <span><Briefcase size={12} style={{marginRight: '4px'}}/> {job.bidang || 'Bidang Tidak Disebutkan'}</span>
                                    <span><Users size={12} style={{marginRight: '4px'}}/> Kuota: {job.kuota} Orang</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '10px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                                    Dibuat pada: {new Date(job.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}