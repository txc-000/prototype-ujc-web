import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserPlus, FileText, Building, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

// IMPOR KOMPONEN ANAK
import TabInputSiswa from './tabs/TabInputSiswa';
import TabRiwayatPengajuan from './tabs/TabRiwayatPengajuan';
import ModalDetailProgress from './modals/ModalDetailProgress';

export default function DashboardMitra() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    
    const [mitraProfile, setMitraProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('INPUT'); 
    const [riwayatSiswa, setRiwayatSiswa] = useState([]);
    const [masterBidang, setMasterBidang] = useState([]); 

    // STATE UNTUK MODAL
    const [detailModal, setDetailModal] = useState(null);

    useEffect(() => {
        const initDashboard = async () => {
            setIsLoading(true);
            const profile = await fetchMitraProfile();
            if (profile) await fetchRiwayatPengajuan(profile.id);
            await fetchMasterBidang();
            setIsLoading(false);
        };
        initDashboard();
    }, []);

    const fetchMitraProfile = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) { navigate('/login'); return null; }

            const { data: profile, error: profileError } = await supabase
                .from('master_mitra_lokal')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle(); 

            if (profileError) throw profileError;

            if (profile) {
                const mp = { id: profile.id, nama: profile.nama_institusi, jenis: profile.jenis_institusi };
                setMitraProfile(mp);
                return mp;
            } else {
                const dummy = { id: session.user.id, nama: 'Profil Mitra Belum Lengkap', jenis: 'Instansi' };
                setMitraProfile(dummy);
                return dummy;
            }
        } catch (error) { console.error("Gagal memuat profil mitra:", error.message); return null; }
    };

    const fetchMasterBidang = async () => {
        try {
            const { data } = await supabase.from('master_bidang').select('*').order('nama_bidang', { ascending: true });
            if (data) setMasterBidang(data);
        } catch (err) {}
    };

    const fetchRiwayatPengajuan = async (mitraId) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, nama_lengkap, jenis_kelamin, program, tahap_sekarang, status_akhir, created_at, medical_checkup_status, nilai_bahasa, data_raport, perusahaan_tujuan, tanggal_entri')
                .eq('created_by', mitraId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRiwayatSiswa(data || []);
        } catch (error) { console.error("Error fetching riwayat:", error.message); }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (isLoading && !mitraProfile) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', color: brandNavy }}>
                <Loader2 size={40} className="animate-spin" style={{ marginBottom: '15px' }} />
                <h2 style={{ margin: 0, fontWeight: 800 }}>Mempersiapkan Portal Mitra...</h2>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR ── */}
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Portal Mitra</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Universal Japan Course</p>
                </div>
                
                <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px' }}>Instansi Pengirim</div>
                    <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '5px', lineHeight: '1.3' }}>
                        {mitraProfile?.nama || 'Mitra LPK'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Building size={14} /> {mitraProfile?.jenis || 'Agensi'}
                    </div>
                </div>

                <nav style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '10px 0 5px 5px' }}>Menu Utama</div>
                    <button onClick={() => setActiveTab('INPUT')} style={activeTab === 'INPUT' ? styles.activeMenuS : styles.inactiveMenuS}>
                        <UserPlus size={18} /> Formulir Pengajuan
                    </button>
                    <button onClick={() => { setActiveTab('RIWAYAT'); fetchRiwayatPengajuan(mitraProfile.id); }} style={activeTab === 'RIWAYAT' ? styles.activeMenuS : styles.inactiveMenuS}>
                        <FileText size={18} /> Status Kandidat
                    </button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
                        Keluar
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
                
                {activeTab === 'INPUT' && (
                    <TabInputSiswa 
                        masterBidang={masterBidang} 
                        mitraProfile={mitraProfile} 
                        onSuccess={() => { setActiveTab('RIWAYAT'); fetchRiwayatPengajuan(mitraProfile.id); }} 
                    />
                )}

                {activeTab === 'RIWAYAT' && (
                    <TabRiwayatPengajuan 
                        isLoading={isLoading} 
                        riwayatSiswa={riwayatSiswa} 
                        setDetailModal={setDetailModal} 
                    />
                )}

                {/* MODAL */}
                <ModalDetailProgress 
                    detailModal={detailModal} 
                    onClose={() => setDetailModal(null)} 
                />
            </main>
        </div>
    );
}