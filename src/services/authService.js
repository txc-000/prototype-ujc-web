import { supabase } from '../lib/supabase';

export const authService = {
    // 1. Cek Sesi User 
    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    // 2. Ambil Role User (SANGAT KRUSIAL UNTUK ROUTING APP.JSX)
    getUserRole: async (userId) => {
        // Cek tabel Pegawai Internal dulu
        const { data: emp } = await supabase
            .from('employees')
            .select('master_role(nama_role)')
            .eq('id', userId)
            .maybeSingle(); 
        
        if (emp && emp.master_role) {
            return emp.master_role.nama_role.toUpperCase();
        }

        // Jika bukan pegawai, cek tabel Mitra
        const { data: mitra } = await supabase
            .from('master_mitra_lokal')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (mitra) return 'MITRA';

        return null; // Tidak punya akses
    },

    // 3. Ambil Data Profil Karyawan/Admin
    getUserProfile: async (userId) => {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // 4. Proses Login
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) throw error;
        return data;
    },

    // 5. Proses Logout
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }
};