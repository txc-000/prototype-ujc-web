import React from 'react';
import { Activity, TrendingUp, Clock, List, MessageSquare } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function DirekturEmployees({ employeeList, productivity, timeAgo, fetchUserActivities, setMsgModal, setMsgText }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Status Realtime */}
            <div style={styles.cardStyle}>
                <h3 style={styles.cardHeaderStyle}><Activity size={20}/> Status Kehadiran Karyawan (Real-Time)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                    {employeeList.map(emp => {
                        const isAktif = emp.status === 'Aktif' || !emp.status;
                        const statusColor = emp.is_online ? '#10b981' : '#cbd5e1';
                        
                        return (
                            <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: isAktif ? '#f8fafc' : '#f1f5f9', borderRadius: '8px', borderLeft: `4px solid ${isAktif ? statusColor : '#ef4444'}`, opacity: isAktif ? 1 : 0.6 }}>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {emp.nama_lengkap} 
                                        {!isAktif && <span style={{background: '#fee2e2', color: '#991b1b', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'}}>{emp.status}</span>}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{emp.master_role?.nama_role}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {emp.is_online ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}><div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 5px #10b981' }}></div> Online</span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}><Clock size={12}/> {timeAgo(emp.last_seen)}</span>
                                    )}
                                    <button onClick={() => fetchUserActivities(emp.id, emp.nama_lengkap, emp.master_role?.nama_role)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Lacak Aktivitas Pekerjaan"><List size={16}/></button>
                                    <button onClick={() => {setMsgModal({ id: emp.id, nama_lengkap: emp.nama_lengkap }); setMsgText('');}} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Kirim Instruksi"><MessageSquare size={16}/></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Produktivitas */}
            <div style={styles.cardStyle}>
                <h3 style={styles.cardHeaderStyle}><TrendingUp size={20}/> Produktivitas Kinerja Operasional (All-Time)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                    {productivity.map((prod, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: idx < 3 ? brandNavy : '#94a3b8', width: '20px' }}>#{idx + 1}</div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#1e293b' }}>{prod.nama}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{prod.role}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: prod.jumlahInput === 0 ? '#ef4444' : '#10b981', marginRight: '10px' }}>{prod.jumlahInput} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Poin</span></div>
                                <button onClick={() => fetchUserActivities(prod.id, prod.nama, prod.role)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Lacak Aktivitas Pekerjaan"><List size={16}/></button>
                                <button onClick={() => {setMsgModal({ id: prod.id, nama_lengkap: prod.nama }); setMsgText('');}} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Kirim Instruksi"><MessageSquare size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}