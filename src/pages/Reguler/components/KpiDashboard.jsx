// File: src/pages/Reguler/components/KpiDashboard.jsx
import React from 'react';
import { Award, Users, Briefcase, Target } from 'lucide-react';

const brandNavy = '#101869';

export default function KpiDashboard({ userProfile }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', borderLeft: `6px solid ${brandNavy}`, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: '0 0 5px 0', color: brandNavy }}>Selamat Bertugas, {userProfile?.nama_lengkap || 'Admin'}!</h2>
                <p style={{ margin: 0, color: '#64748b' }}>Fokus hari ini: Entri data kandidat, plotting wawancara, dan evaluasi hasil mensetsu.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={cardKpiS}>
                    <div style={iconBoxS('#eff6ff', '#2563eb')}><Award size={24} /></div>
                    <div>
                        <div style={kpiLabelS}>Poin Kinerja Tuan</div>
                        <div style={kpiValueS}>{userProfile?.poin_pendaftaran || 0} <span style={{fontSize:'0.9rem', color:'#64748b', fontWeight:700}}>Pts</span></div>
                    </div>
                </div>
                <div style={cardKpiS}>
                    <div style={iconBoxS('#fef2f2', '#ef4444')}><Users size={24} /></div>
                    <div>
                        <div style={kpiLabelS}>Kandidat Registrasi</div>
                        <div style={kpiValueS}>Aktif</div>
                    </div>
                </div>
                <div style={cardKpiS}>
                    <div style={iconBoxS('#fefce8', '#d97706')}><Briefcase size={24} /></div>
                    <div>
                        <div style={kpiLabelS}>Bursa Job Order</div>
                        <div style={kpiValueS}>Tersedia</div>
                    </div>
                </div>
                <div style={cardKpiS}>
                    <div style={iconBoxS('#ecfdf5', '#10b981')}><Target size={24} /></div>
                    <div>
                        <div style={kpiLabelS}>Sukses Matched</div>
                        <div style={kpiValueS}>Proses</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const cardKpiS = { background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' };
const iconBoxS = (bg, color) => ({ width: '50px', height: '50px', background: bg, color: color, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const kpiLabelS = { fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' };
const kpiValueS = { fontSize: '1.8rem', fontWeight: 900, color: '#1e293b' };