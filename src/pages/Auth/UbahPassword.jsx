import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { Key, ArrowRight, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function UbahPassword() {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [userRole, setUserRole] = useState(null);

    // Cek Sesi dan Ambil Role agar tahu harus kembali ke Dashboard mana
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data: emp } = await supabase
                .from('employees')
                .select('master_role(nama_role)')
                .eq('id', user.id)
                .maybeSingle(); 

            if (emp && emp.master_role) {
                setUserRole(emp.master_role.nama_role.toUpperCase());
            } else {
                setUserRole('MITRA'); 
            }
        };
        checkSession();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg('Kata sandi baru dan konfirmasi tidak cocok.');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg('Kata sandi minimal 6 karakter.');
            setLoading(false);
            return;
        }

        try {
            // 1. Update Kata Sandi di Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (authError) throw new Error('Gagal memperbarui sandi: ' + authError.message);

            // 2. Update flag is_first_login di tabel employees
            const { data: { user } } = await supabase.auth.getUser();
            if (user && userRole !== 'MITRA') {
                await supabase.from('employees').update({ is_first_login: false }).eq('id', user.id);
            }

            setSuccessMsg('Kata sandi berhasil diperbarui! Mengalihkan ke Dashboard...');

            // 3. Arahkan kembali ke Dashboard sesuai Role setelah 1.5 detik
            setTimeout(() => {
                if (userRole === 'SUPER ADMIN') navigate('/superadmin/dashboard');
                else if (userRole === 'SUPERVISOR') navigate('/supervisor/dashboard');
                else if (userRole === 'DIREKTUR') navigate('/direktur/dashboard');
                else if (userRole === 'REGULER') navigate('/reguler/dashboard');
                else if (userRole === 'REKRUTMEN') navigate('/rekrutmen/dashboard');
                else if (userRole === 'DOKUMEN') navigate('/dokumen/dashboard');
                else if (userRole === 'PENDIDIKAN') navigate('/pendidikan/dashboard');
                else if (userRole === 'ADMINISTRASI') navigate('/administrasi/dashboard');
                else if (userRole === 'MITRA') navigate('/mitra/dashboard');
                else navigate('/login');
            }, 1500);

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
                    <div style={{ width: '60px', height: '60px', background: brandNavy, color: brandYellow, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
                        <Lock size={30} />
                    </div>
                    <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 800 }}>Ubah Kata Sandi</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>Amankan akun Anda dengan sandi baru.</p>
                </div>

                {errorMsg && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 15px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <AlertCircle size={16} /> {errorMsg}
                    </div>
                )}

                {successMsg && (
                    <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 15px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <CheckCircle2 size={16} /> {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>KATA SANDI BARU</label>
                        <div style={{ position: 'relative' }}>
                            <Key size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                required
                                placeholder="Minimal 6 karakter"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} 
                                style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '0.95rem', color: '#1e293b' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>KONFIRMASI KATA SANDI</label>
                        <div style={{ position: 'relative' }}>
                            <Key size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                required
                                placeholder="Ulangi kata sandi baru"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '0.95rem', color: '#1e293b' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || successMsg !== ''}
                        style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: (loading || successMsg !== '') ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px', opacity: (loading || successMsg !== '') ? 0.7 : 1 }}
                    >
                        {loading ? 'Memproses...' : <>Simpan Kata Sandi <ArrowRight size={18} /></>}
                    </button>
                    
                    {!successMsg && (
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}
                        >
                            Batal & Kembali
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}