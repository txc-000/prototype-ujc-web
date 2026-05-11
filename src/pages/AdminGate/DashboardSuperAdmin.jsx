import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
    LayoutDashboard, Users, FileText, BookOpen, 
    Wallet, ShieldCheck, PieChart, Building, LogOut, Code, Plane
} from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function DashboardSuperAdmin() {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserEmail(user.email);
        };
        checkUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const modules = [
        { name: 'Reguler & Rekrutmen', path: '/reguler/dashboard', icon: <Users size={32} />, color: '#3b82f6', desc: 'Pendaftaran, Seleksi, Wawancara & Job Order' },
        { name: 'Divisi Pendidikan', path: '/pendidikan/dashboard', icon: <BookOpen size={32} />, color: '#14b8a6', desc: 'Kelas, Evaluasi Harian, Raport & Sertifikat' },
        { name: 'Divisi Dokumen', path: '/dokumen/dashboard', icon: <FileText size={32} />, color: '#f59e0b', desc: 'Pemberkasan, Rirekisho, COE & Visa' },
        { name: 'Administrasi & Keuangan', path: '/administrasi/dashboard', icon: <Wallet size={32} />, color: '#6366f1', desc: 'Buku Kas, Tagihan Siswa & Invoice B2B' },
        
        { name: 'SPV Rekrutmen', path: '/supervisor/dashboard', stateParams: { spvType: 'REKRUTMEN' }, icon: <ShieldCheck size={32} />, color: '#ec4899', desc: 'Master Data & Kontrol Alur Rekrutmen' },
        { name: 'SPV Dokumen', path: '/supervisor/dashboard', stateParams: { spvType: 'DOKUMEN' }, icon: <ShieldCheck size={32} />, color: '#eab308', desc: 'Approval & Kontrol Alur Dokumen' },
        
        { name: 'Dashboard Direktur', path: '/direktur/dashboard', icon: <PieChart size={32} />, color: '#8b5cf6', desc: 'Executive Helicopter View & Analitik' },
        { name: 'Pantauan Alumni', path: '/alumni/dashboard', icon: <Plane size={32} />, color: '#0ea5e9', desc: 'Tracking Eks-Jepang & Status Freeze' },
        { name: 'Portal Mitra Lokal', path: '/mitra/dashboard', icon: <Building size={32} />, color: '#64748b', desc: 'B2B Portal untuk Agensi & Sekolah' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', padding: '50px', fontFamily: 'sans-serif' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
                <div>
                    <h1 style={{ color: 'white', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Code color={brandYellow} size={36} /> Super Admin Command Center
                    </h1>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>
                        Akses sistem bypass: <span style={{ color: '#10b981', fontWeight: 800 }}>{userEmail}</span>
                    </p>
                </div>
                <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LogOut size={20} /> Force Logout
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                {modules.map((mod, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => navigate(mod.path, { state: mod.stateParams })}
                        style={{ 
                            background: '#1e293b', 
                            border: `1px solid ${mod.color}40`, 
                            borderTop: `4px solid ${mod.color}`,
                            borderRadius: '12px', 
                            padding: '30px', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.background = '#334155';
                            e.currentTarget.style.boxShadow = `0 10px 20px -5px ${mod.color}40`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = '#1e293b';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ color: mod.color }}>{mod.icon}</div>
                        <div>
                            <h3 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 800 }}>{mod.name}</h3>
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>{mod.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <footer style={{ marginTop: '50px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                Mode Super Admin LPK UJC | Bebas hambatan RLS & Routing Restrictions
            </footer>
        </div>
    );
}