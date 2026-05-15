import React from 'react';
import { Target, Building2, Bookmark } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';
const brandYellow = '#fdfb06';

export default function DirekturTargets({ kpi, jobFulfillmentRate, topKaisha, topKumiai, setKumiaiDetailModal }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            {/* Target Kuota */}
            <div style={styles.cardStyle}>
                <h3 style={styles.cardHeaderStyle}><Target size={20}/> Target Pemenuhan Kuota</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginTop: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                            <span>Permintaan (Demand): {kpi.totalKebutuhan}</span>
                            <span style={{color: '#10b981'}}>Siswa (Supply): {kpi.totalTerpenuhi}</span>
                        </div>
                        <div style={{ width: '100%', height: '24px', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ width: `${jobFulfillmentRate}%`, height: '100%', background: jobFulfillmentRate >= 100 ? '#10b981' : brandNavy, transition: 'width 1s ease-in-out' }}></div>
                        </div>
                        <p style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b', marginTop: '8px', fontWeight: 700 }}>{jobFulfillmentRate}% Terpenuhi</p>
                    </div>
                </div>
            </div>

            {/* Top Kaisha */}
            <div style={styles.cardStyle}>
                <h3 style={styles.cardHeaderStyle}><Building2 size={20}/> Top Penempatan Kaisha</h3>
                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topKaisha.length === 0 ? <p style={{ color: '#94a3b8', fontSize:'0.8rem' }}>Belum ada data.</p> : 
                        topKaisha.map((kaisha, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                    <div style={{ background: brandYellow, color: brandNavy, width: '20px', height: '20px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.7rem' }}>{idx + 1}</div>
                                    {kaisha.name.length > 15 ? kaisha.name.substring(0, 15) + '...' : kaisha.name}
                                </div>
                                <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1rem' }}>{kaisha.count}</div>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* Loyalitas Kumiai */}
            <div style={{...styles.cardStyle, borderTop: `4px solid ${brandYellow}`}}>
                <h3 style={styles.cardHeaderStyle}><Bookmark size={20} color="#d97706"/> Loyalitas Kumiai</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>Klik nama Kumiai untuk rincian.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topKumiai.length === 0 ? <p style={{ color: '#94a3b8', fontSize:'0.8rem' }}>Belum ada data Kumiai.</p> : 
                        topKumiai.map((kumiai, idx) => (
                            <div 
                                key={idx} onClick={() => setKumiaiDetailModal(kumiai)} 
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div>
                                    <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.85rem' }}>{kumiai.name.length > 15 ? kumiai.name.substring(0, 15) + '...' : kumiai.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>{kumiai.totalKuota} Total Kuota</div>
                                </div>
                                <div style={{ fontWeight: 900, color: '#d97706', fontSize: '1.1rem' }}>
                                    {kumiai.count} <span style={{fontSize: '0.65rem'}}>Order</span>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}