import { supabase } from '../lib/supabase';

export const regulerService = {
    getUserProfile: async (userId) => {
        const { data } = await supabase.from('employees').select('nama_lengkap, poin_pendaftaran, master_role(nama_role)').eq('id', userId).maybeSingle();
        return data;
    },

    getMasterData: async () => {
        const [bidang, kumiai, kaisha] = await Promise.all([
            supabase.from('master_bidang').select('*').order('nama_bidang'),
            supabase.from('master_kumiai').select('*'),
            supabase.from('master_kaisha').select('*')
        ]);
        return { bidang: bidang.data || [], kumiai: kumiai.data || [], kaisha: kaisha.data || [] };
    },

    // ── DITAMBAHKAN UNTUK FETCH DATA JOB ORDER ──
    getJobOrders: async () => {
        const { data, error } = await supabase.from('job_orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    getStudentsByTab: async (tab) => {
        let query = supabase.from('students').select('*').order('updated_at', { ascending: false });
        if (tab === 'PENDAFTARAN') query = query.eq('tahap_sekarang', 'REGISTRASI');
        else if (tab === 'SELEKSI') query = query.in('tahap_sekarang', ['SELEKSI AWAL', 'WAWANCARA MITRA']);
        else if (tab === 'KELAS_DIKLAT') query = query.eq('tahap_sekarang', 'PENDIDIKAN DIKLAT');
        else if (tab === 'PEMANGGILAN') query = query.or('tahap_sekarang.eq.AVAILABLE,status_akhir.eq.BELUM DAPAT JOB');
        else if (tab === 'MATCHING') query = query.in('tahap_sekarang', ['AVAILABLE', 'PRA_MENSETSU', 'INTERVIEW']);
        else if (tab === 'PASCA_INTERVIEW') query = query.in('tahap_sekarang', ['MATCHED', 'MCU_LANJUTAN', 'PEMBERKASAN']);

        const { data } = await query;
        return (data || []).map(s => ({
            ...s,
            data_raport: typeof s.data_raport === 'string' ? JSON.parse(s.data_raport || '{}') : (s.data_raport || {}),
            nilai_history: typeof s.nilai_history === 'string' ? JSON.parse(s.nilai_history || '[]') : (s.nilai_history || [])
        }));
    },

    saveStudent: async (payload, id = null) => {
        if (id) {
            const { error } = await supabase.from('students').update(payload).eq('id', id);
            if (error) throw error;
            return { isEdit: true };
        } else {
            const { data, error } = await supabase.from('students').insert([payload]).select();
            if (error) throw error;
            return { isEdit: false, newId: data[0].id };
        }
    },

    updateStudentFields: async (id, fields) => {
        const { error } = await supabase.from('students').update(fields).eq('id', id);
        if (error) throw error;
    },

    reEntryStudent: async (nik, userId) => {
        const { data: old, error } = await supabase.from('students').select('*').eq('nik', nik).order('created_at', { ascending: false }).limit(1).single();
        if (error || !old) throw new Error("Data Alumni tidak ditemukan!");
        const newPayload = { ...old, program: 'Tokutei Ginou (TG)', tahap_sekarang: 'REGISTRASI', status_akhir: 'Proses', created_by: userId };
        delete newPayload.id; delete newPayload.created_at; delete newPayload.updated_at;
        const { data: ins, error: insErr } = await supabase.from('students').insert([newPayload]).select();
        if (insErr) throw insErr;
        return { oldData: old, newId: ins[0].id };
    },

    logActivityAndAddPoint: async (userId, currentPoint, desc) => {
        await supabase.from('activity_logs').insert([{ user_id: userId, keterangan: desc }]);
        const newPoint = currentPoint + 1;
        await supabase.from('employees').update({ poin_pendaftaran: newPoint }).eq('id', userId);
        return newPoint;
    }
};