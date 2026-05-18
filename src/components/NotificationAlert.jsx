import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BellRing, X, CheckCircle } from 'lucide-react';

export default function NotificationAlert() {
    const [notifications, setNotifications] = useState([]);
    const [userId, setUserId] = useState(null);

    // 1. Inisialisasi User saat komponen dimuat (Sudah menggunakan getSession)
    useEffect(() => {
        const initUser = async () => {
            // ✅ MENGGUNAKAN getSession UNTUK MENCEGAH ERROR "LOCK STOLEN"
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            
            if (user) {
                setUserId(user.id);
                fetchNotifications(user.id);
            }
        };
        initUser();
    }, []);

    // 2. Fungsi tarik notifikasi awal (saat baru login/refresh)
    const fetchNotifications = async (uid) => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', uid)
                .eq('is_read', false) 
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            if (data) setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    // 3. MENDENGARKAN SUPABASE REALTIME (INSTAN TANPA RELOAD)
    useEffect(() => {
        if (!userId) return;

        // Buka koneksi WebSocket ke tabel notifications khusus untuk user ini
        const channel = supabase
            .channel('custom-notification-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    // Saat ada data masuk, langsung tambahkan ke state tanpa refresh layar!
                    setNotifications((prev) => [payload.new, ...prev]);
                    
                    // Opsional: Bunyikan suara notifikasi kecil
                    try {
                        const audio = new Audio('/notification-sound.mp3'); // Jika punya file suara
                        audio.play().catch(e => console.log('Audio play diabaikan browser.'));
                    } catch(e){}
                }
            )
            .subscribe();

        // Bersihkan koneksi jika komponen dihancurkan / user pindah halaman
        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    // 4. Fungsi tandai sudah dibaca
    const markAsRead = async (id) => {
        // Hilangkan dari UI langsung agar responsif
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        // Update status di database secara background
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        } catch (error) {
            console.error("Gagal update status read:", error);
        }
    };

    if (notifications.length === 0) return null;

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {notifications.map(notif => (
                <div key={notif.id} style={{ background: 'white', borderLeft: '5px solid #ef4444', padding: '20px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', width: '380px', animation: 'slideIn 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                            <BellRing size={18} className="animate-bounce" /> 
                            Instruksi {notif.sender_name}
                        </div>
                        <button onClick={() => markAsRead(notif.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                            <X size={18} />
                        </button>
                    </div>
                    
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.5', fontWeight: 600 }}>
                        "{notif.message}"
                    </p>
                    
                    <button onClick={() => markAsRead(notif.id)} style={{ width: '100%', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}>
                        <CheckCircle size={16}/> Siap, Laksanakan!
                    </button>
                </div>
            ))}
            
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}