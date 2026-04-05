import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Lock, CheckCircle } from 'lucide-react';

const brandNavy = '#101869';

export default function UbahPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (password !== confirmPassword) {
            setErrorMsg('Konfirmasi password tidak cocok!');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('Password minimal harus 6 karakter!');
            return;
        }

        setLoading(true);
        try {
            // 1. Dapatkan user aktif (sesi login saat ini dengan password default)
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error('Sesi tidak valid. Silakan login ulang.');

            // 2. Update password di Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({ password: password });
            if (updateError) throw new Error('Gagal merubah password: ' + updateError.message);

            // 3. Update status is_first_login di tabel employees menjadi false
            const { error: empError } = await supabase.from('employees')
                .update({ is_first_login: false })
                .eq('id', user.id);
            if (empError) throw new Error('Gagal update status profil: ' + empError.message);

            alert('✅ Password berhasil diubah! Silakan login kembali menggunakan password baru Anda.');

            // 4. Force Logout agar user login dengan kredensial baru (Best Practice)
            await supabase.auth.signOut();
            navigate('/login');

        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ background: '#e0e7ff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
                        <KeyRound size={30} color={brandNavy} />
                    </div>
                    <h2 style={{ color: '#1e293b', margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 800 }}>Ubah Password</h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Ini adalah login pertama Anda. Wajib mengganti password default demi keamanan.</p>
                </div>

                {errorMsg && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 15px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 600 }}>{errorMsg}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>PASSWORD BARU</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>KONFIRMASI PASSWORD</label>
                        <div style={{ position: 'relative' }}>
                            <CheckCircle size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ketik ulang password baru" style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc' }} />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{ background: brandNavy, color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}>
                        {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </button>
                </form>

            </div>
        </div>
    );
}