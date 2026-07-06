import React from 'react';
import { Users, Plane, BarChart2, Calendar } from 'lucide-react';

export default function KpiCardGroup({ kpi }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Users size={48} color="#2563eb" />
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>TOTAL SISWA BERANGKAT</div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a' }}>{kpi.totalSiswa}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Orang</div>
                </div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Plane size={48} color="#2563eb" />
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>KEBERANGKATAN BULAN INI</div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a' }}>{kpi.bulanIni} <span style={{fontSize:'16px'}}>Siswa</span></div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{kpi.bulanIniNama}</div>
                </div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <BarChart2 size={48} color="#16a34a" />
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>RATA-RATA KEBERANGKATAN / BULAN</div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#16a34a' }}>{kpi.rataRata}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Siswa</div>
                </div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Calendar size={48} color="#9333ea" />
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>PERIODE</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#9333ea' }}>{kpi.periode}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{kpi.periodeBulan} Bulan</div>
                </div>
            </div>
        </div>
    );
}