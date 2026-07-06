import React from 'react';

export default function ModalDaftarSiswaPerBulan({ modalData, onClose }) {
    if (!modalData) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                <h2 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>Data Keberangkatan - {modalData.bulan}</h2>
                <p>Data spesifik siswa belum tersedia dari file rincian (membutuhkan file Sheet terpisah). Data Excel saat ini hanya memuat angka agregat.</p>
                <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Tutup</button>
            </div>
        </div>
    );
}