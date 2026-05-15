import React from 'react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function AlumniKpiCards({ totalAlumni, statAktif, statSelesai, statBermasalah }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={{ ...styles.cardStyle, borderTop: `4px solid ${brandNavy}` }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Ditampilkan</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', margin: '5px 0' }}>{totalAlumni}</div>
            </div>
            <div style={{ ...styles.cardStyle, borderTop: `4px solid #10b981` }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Aktif Bekerja (Jepang)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', margin: '5px 0' }}>{statAktif}</div>
            </div>
            <div style={{ ...styles.cardStyle, borderTop: `4px solid #3b82f6` }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Selesai Kontrak (Lulus)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3b82f6', margin: '5px 0' }}>{statSelesai}</div>
            </div>
            <div style={{ ...styles.cardStyle, borderTop: `4px solid #ef4444` }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Insiden (Kabur/Pulang)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444', margin: '5px 0' }}>{statBermasalah}</div>
            </div>
        </div>
    );
}