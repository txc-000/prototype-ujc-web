import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { Key, User, ArrowRight, AlertCircle } from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function LoginPage() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState(''); 
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const inputVal = identifier.trim();

        // 1. SMART LOGIN LOGIC
        const loginEmail = inputVal.includes('@') 
            ? inputVal.toLowerCase() 
            : `${inputVal.toUpperCase()}@internal.ujc.com`;

        try {
            // 2. Eksekusi Login ke Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: password,
            });

            if (authError) throw new Error('Kredensial tidak valid. Periksa kembali ID/Email dan Password Anda.');

            // 3. CEK PEGAWAI INTERNAL
            const { data: employee } = await supabase
                .from('employees')
                .select('is_first_login, role_id, master_role(nama_role)')
                .eq('id', authData.user.id)
                .maybeSingle(); 

            if (employee) {
                // ALUR PEGAWAI INTERNAL
                await supabase.from('employees').update({ is_online: true }).eq('id', authData.user.id);

                const roleName = employee.master_role?.nama_role?.toUpperCase();

                // --- PENGALIHAN KE HALAMAN UBAH PASSWORD ---
                if (employee.is_first_login) {
                    navigate('/ubah-password');
                    return; // Menghentikan eksekusi ke bawah agar tidak masuk ke dashboard
                }

                // --- UPDATE ROUTING SESUAI SOP BARU ---
                if (roleName === 'SUPER ADMIN') {
                    navigate('/superadmin/dashboard'); // Rute khusus untuk Super Admin (Developer)
                } else if (roleName === 'SUPERVISOR') {
                    navigate('/supervisor/dashboard');
                } else if (roleName === 'DIREKTUR') {
                    navigate('/direktur/dashboard');
                } else if (roleName === 'REGULER') {
                    navigate('/reguler/dashboard');
                } else if (roleName === 'REKRUTMEN') {
                    navigate('/rekrutmen/dashboard');
                } else if (roleName === 'DOKUMEN') {
                    navigate('/dokumen/dashboard');
                } else if (roleName === 'PENDIDIKAN') {
                    navigate('/pendidikan/dashboard');
                } else if (roleName === 'ADMINISTRASI') {
                    navigate('/administrasi/dashboard');
                } else {
                    throw new Error(`Role internal tidak dikenali: ${roleName || 'Kosong'}`);
                }
            } else {
                // 4. CEK MITRA
                const { data: mitra } = await supabase
                    .from('master_mitra_lokal')
                    .select('id')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                if (mitra) {
                    navigate('/mitra/dashboard');
                } else {
                    throw new Error('Data profil Anda tidak ditemukan di sistem LPK maupun kemitraan.');
                }
            }

        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>

                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '60px', height: '60px', background: brandNavy, color: brandYellow, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', fontSize: '1.5rem', fontWeight: 900 }}>
                        UJC
                    </div>
                    <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>Sistem Terpadu LPK</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>Portal Pegawai & Mitra Bisnis</p>
                </div>

                {errorMsg && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 15px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <AlertCircle size={16} /> {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>ID KARYAWAN / EMAIL MITRA</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                required
                                placeholder="UJC-001 atau mitra@email.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)} 
                                style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '0.95rem', color: '#1e293b' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>KATA SANDI</label>
                        <div style={{ position: 'relative' }}>
                            <Key size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                required
                                placeholder="Masukkan kata sandi..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '0.95rem', color: '#1e293b' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Memverifikasi...' : <>Masuk ke Sistem <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}