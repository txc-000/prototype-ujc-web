import React from 'react';
import { Calendar } from 'lucide-react';

export default function HeaderSection({ summary }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', margin: '0 0 5px 0' }}>
                    DASHBOARD KEBERANGKATAN SISWA KE JEPANG
                </h1>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>
                    PERIODE {summary ? summary.kpi.periode.toUpperCase() : 'JANUARI - JUNI 2026'}
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <Calendar size={24} color="#1e3a8a" />
                <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Periode Data</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{summary ? summary.periodeLengkap : '-'}</div>
                </div>
            </div>
        </div>
    );
}