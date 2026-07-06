import React from 'react';

export default function IllustrationCard() {
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>PERJALANAN MENUJU MASA DEPAN</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Terus melangkah, wujudkan mimpi ke Jepang.</div>
            
            <div style={{ width: '100%', height: '150px', background: '#e0f2fe', border: '2px dashed #bae6fd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontWeight: 'bold' }}>
                [ Tuan bisa isi tag &lt;img /&gt; aset gambar Jepang di sini ]
            </div>
        </div>
    );
}