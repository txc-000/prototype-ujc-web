import React from 'react';
import { ArrowLeft, Plane, Search, Building2, Users, Filter } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function AlumniHeaderFilter({ 
    searchTerm, setSearchTerm, 
    filterKaisha, setFilterKaisha, 
    filterKumiai, setFilterKumiai, 
    filterStatus, setFilterStatus, 
    masterKaisha, masterKumiai 
}) {
    return (
        <>
            <div style={{ background: brandNavy, padding: '20px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => window.history.back()} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Plane size={24}/> Pantauan Alumni (Eks-Jepang)</h1>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Tracking masa kontrak, status tenaga kerja, dan riwayat kumiai di Jepang</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '30px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <div style={styles.lb}>Cari Nama Siswa</div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                        <input type="text" placeholder="Ketik nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '40px' }} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={styles.lb}><Building2 size={12} style={{display:'inline', marginBottom:'-2px'}}/> Perusahaan (Kaisha)</div>
                    <select style={{...styles.inp, cursor: 'pointer'}} value={filterKaisha} onChange={(e) => setFilterKaisha(e.target.value)}>
                        <option value="">Semua Kaisha</option>
                        {masterKaisha.map((k,i) => <option key={i} value={k.nama_perusahaan || k.nama_kaisha}>{k.nama_perusahaan || k.nama_kaisha}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={styles.lb}><Users size={12} style={{display:'inline', marginBottom:'-2px'}}/> Asosiasi (Kumiai)</div>
                    <select style={{...styles.inp, cursor: 'pointer'}} value={filterKumiai} onChange={(e) => setFilterKumiai(e.target.value)}>
                        <option value="">Semua Kumiai</option>
                        {masterKumiai.map((k,i) => <option key={i} value={k.nama_kumiai}>{k.nama_kumiai}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={styles.lb}><Filter size={12} style={{display:'inline', marginBottom:'-2px'}}/> Status Siswa</div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{...styles.inp, cursor: 'pointer'}}>
                        <option value="ALL">Semua Status</option>
                        <option value="AKTIF BEKERJA">Aktif Bekerja</option>
                        <option value="PINDAH KAISHA">Pindah Kaisha</option>
                        <option value="SELESAI KONTRAK">Selesai Kontrak</option>
                        <option value="PULANG AWAL">Pulang Lebih Awal</option>
                        <option value="KABUR">Kabur (Runaway)</option>
                    </select>
                </div>
            </div>
        </>
    );
}