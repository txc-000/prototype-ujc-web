import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; // Sesuaikan path jika berbeda
import { Key, User, ArrowRight, AlertCircle } from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function LoginPage() {
    const navigate = useNavigate();
    const [idKaryawan, setIdKaryawan] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        // 1. Ubah ID Karyawan menjadi format email
        const shadowEmail = `${idKaryawan.trim().toUpperCase()}@internal.ujc.com`;

        try {
            // 2. Eksekusi Login ke Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: shadowEmail,
                password: password,
            });

            if (authError) throw new Error('ID Karyawan atau Password salah.');

            // 3. Ambil profil karyawan beserta nama role-nya
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select(`
          is_first_login, 
          role_id, 
          master_role (nama_role)
        `)
                .eq('id', authData.user.id)
                .single();

            if (empError || !employee) throw new Error('Data profil karyawan tidak ditemukan di sistem.');

            // 4. Update status is_online menjadi true
            await supabase.from('employees').update({ is_online: true }).eq('id', authData.user.id);

            // 5. Logika Routing Sebenarnya (Real Routing)
            const roleName = employee.master_role?.nama_role?.toUpperCase();

            // Jika ini login pertama dan Anda belum membuat halaman ubah password, 
            // kita berikan alert sementara tapi tetap izinkan masuk.
            if (employee.is_first_login) {
                alert("Info: Ini adalah login pertama. Karena halaman ubah password belum siap, Anda akan langsung diarahkan ke Dashboard.");
                // Idealnya nanti: navigate('/ubah-password'); return;
            }

            // 6. Arahkan berdasarkan Role Name asli dari Database
            // 6. Arahkan berdasarkan Role Name asli dari Database
            if (roleName === 'SUPERVISOR' || roleName === 'SUPER ADMIN') {
                // Super Admin diarahkan ke halaman Supervisor (atau ganti ke /direktur/dashboard jika Tuan mau)
                navigate('/supervisor/dashboard');
            } else if (roleName === 'DIREKTUR') {
                navigate('/direktur/dashboard');
            } else if (roleName === 'PENDAFTARAN') {
                navigate('/pendaftaran/dashboard');
            } else if (roleName === 'KEUANGAN') {
                navigate('/keuangan/dashboard');
            } else if (roleName === 'DOKUMEN') {
                navigate('/dokumen/dashboard');
            } else if (roleName === 'PELATIHAN') {
                navigate('/pelatihan/dashboard');
            } else {
                throw new Error(`Role tidak valid atau tidak dikenali: ${roleName || 'Kosong'}`);
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
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>Masuk menggunakan ID Karyawan Anda</p>
                </div>

                {errorMsg && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 15px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <AlertCircle size={16} /> {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>ID KARYAWAN</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                required
                                placeholder="Contoh: UJC-001"
                                value={idKaryawan}
                                onChange={(e) => setIdKaryawan(e.target.value)}
                                style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '0.95rem', color: '#1e293b', textTransform: 'uppercase' }}
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