import React from 'react';
import { Trophy, TrendingDown } from 'lucide-react';

export default function HighlightExtremes({ summary }) {
    const { bulanTerbanyak, bulanTersedikit } = summary;
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <Trophy size={32} color="#16a34a" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#16a34a', marginBottom: '5px' }}>BULAN DENGAN<br/>KEBERANGKATAN TERBANYAK</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#166534', marginBottom: '5px' }}>{bulanTerbanyak.bulan.toUpperCase()}</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#14532d' }}>{bulanTerbanyak.siswa} <span style={{fontSize: '12px'}}>Siswa</span></div>
                <div style={{ fontSize: '10px', color: '#166534', marginTop: '5px' }}>{bulanTerbanyak.persen}% dari total semester ini</div>
            </div>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <TrendingDown size={32} color="#ea580c" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#ea580c', marginBottom: '5px' }}>BULAN DENGAN<br/>KEBERANGKATAN PALING SEDIKIT</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#c2410c', marginBottom: '5px' }}>{bulanTersedikit.bulan.toUpperCase()}</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#9a3412' }}>{bulanTersedikit.siswa} <span style={{fontSize: '12px'}}>Siswa</span></div>
                <div style={{ fontSize: '10px', color: '#c2410c', marginTop: '5px' }}>{bulanTersedikit.persen}% dari total semester ini</div>
            </div>
        </div>
    );
}