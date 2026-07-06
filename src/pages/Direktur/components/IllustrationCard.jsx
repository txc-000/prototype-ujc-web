import React from 'react';

export default function IllustrationCard() {
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>PERJALANAN MENUJU MASA DEPAN</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Terus melangkah, wujudkan mimpi ke Jepang.</div>
            
            <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden' }}>
                <img 
                    src="https://travel.rakuten.com/contents/sites/contents/files/styles/max_1300x1300/public/2023-02/cherry-blossom-viewing-guide_key.jpg?itok=Tx9Aq2Wv" 
                    alt="Perjalanan ke Jepang" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
            </div>
        </div>
    );
}