import { supabase, supabaseAdmin } from '../lib/supabase';

export const supervisorService = {
    // ── 1. GLOBAL & DASHBOARD ──
    getMasterDropdowns: async () => {
        const [bidangRes, kumiaiRes, kaishaRes] = await Promise.all([
            supabase.from('master_bidang').select('nama_bidang'),
            supabase.from('master_kumiai').select('nama_kumiai'),
            supabase.from('master_kaisha').select('*')
        ]);
        return {
            bidang: bidangRes.data || [],
            kumiai: kumiaiRes.data || [],
            kaisha: kaishaRes.data || []
        };
    },

    getRawData: async () => {
        const [resSiswa, resJO] = await Promise.all([
            supabase.from('students').select('*').order('created_at', { ascending: false }),
            supabase.from('job_orders').select('*')
        ]);
        return {
            students: resSiswa.data || [],
            jobOrders: resJO.data || []
        };
    },

    // ── 2. JOB ORDER MANAJEMEN ──
    saveJobOrder: async (payload) => {
        const { error } = await supabase.from('job_orders').insert([payload]);
        if (error) throw error;
    },

    deleteJobOrder: async (id) => {
        const { error } = await supabase.from('job_orders').delete().eq('id', id);
        if (error) throw error;
    },

    // ── 3. SISWA & EVALUASI ──
    updateStudentStage: async (id, nextStage) => {
        const { error } = await supabase.from('students').update({ 
            tahap_sekarang: nextStage, 
            updated_at: new Date() 
        }).eq('id', id);
        if (error) throw error;
    },

    updateStudentCV: async (id, payload) => {
        const { error } = await supabase.from('students').update(payload).eq('id', id);
        if (error) throw error;
    },

    getMitraEvaluationData: async () => {
        const { data, error } = await supabase
            .from('students')
            .select('lpk_asal, tahap_sekarang, status_akhir, medical_checkup_status, created_at')
            .not('lpk_asal', 'is', null)
            .neq('lpk_asal', '');
        if (error) throw error;
        return data || [];
    },

    // ── 4. MASTER BIDANG ──
    getMasterBidangList: async () => {
        const { data, error } = await supabase.from('master_bidang').select('*').order('nama_bidang', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    addMasterBidang: async (namaBidang) => {
        const { error } = await supabase.from('master_bidang').insert([{ nama_bidang: namaBidang.toUpperCase() }]);
        if (error) throw error;
    },

    deleteMasterBidang: async (id) => {
        const { error } = await supabase.from('master_bidang').delete().eq('id', id);
        if (error) throw error;
    },

    // ── 5. MASTER KAISHA ──
    getKaishaWithStats: async () => {
        const { data: kaishaData, error: kError } = await supabase.from('master_kaisha').select('*');
        if (kError) throw kError;

        const { data: joData } = await supabase.from('job_orders').select('id, perusahaan, kumiai');
        const existingKaishaNames = new Set(kaishaData.map(k => k.nama_perusahaan?.toLowerCase().trim()));
        const missingKaishas = [];

        if (joData) {
            joData.forEach(jo => {
                if (jo.perusahaan) {
                    const pName = jo.perusahaan.trim();
                    const pNameLower = pName.toLowerCase();
                    if (!existingKaishaNames.has(pNameLower)) {
                        existingKaishaNames.add(pNameLower);
                        missingKaishas.push({ nama_perusahaan: pName, nama_kumiai: jo.kumiai || '', status: 'Aktif' });
                    }
                }
            });
        }

        let finalKaishaData = [...kaishaData];
        if (missingKaishas.length > 0) {
            await supabase.from('master_kaisha').insert(missingKaishas);
            const { data: updatedKaisha } = await supabase.from('master_kaisha').select('*');
            if (updatedKaisha) finalKaishaData = updatedKaisha;
        }

        const uniqueMap = new Map();
        finalKaishaData.forEach(k => {
            const key = k.nama_perusahaan?.toLowerCase().trim();
            if (key && !uniqueMap.has(key)) uniqueMap.set(key, k);
        });
        const cleanedKaishaData = Array.from(uniqueMap.values());

        const { data: participants } = await supabase.from('job_order_participants').select('student_id, job_id');
        const { data: students } = await supabase.from('students').select('id, perusahaan_tujuan, status_alumni, tahap_sekarang');

        const statsMap = {};
        cleanedKaishaData.forEach(k => {
            if (k.nama_perusahaan) statsMap[k.nama_perusahaan.toLowerCase().trim()] = { joCount: 0, studentCount: 0 };
        });

        const joIdToPerusahaan = {};
        if (joData) {
            joData.forEach(jo => {
                if (jo.perusahaan) {
                    const key = jo.perusahaan.toLowerCase().trim();
                    if (statsMap[key]) statsMap[key].joCount += 1;
                    joIdToPerusahaan[jo.id] = key;
                }
            });
        }

        const activeStudents = (students || []).filter(s => s.tahap_sekarang === 'SIAP BERANGKAT' && (!s.status_alumni || s.status_alumni === 'AKTIF'));
        
        activeStudents.forEach(s => {
            let compKey = s.perusahaan_tujuan?.toLowerCase().trim();
            if (!compKey && participants) {
                const p = participants.find(part => part.student_id === s.id);
                if (p && joIdToPerusahaan[p.job_id]) compKey = joIdToPerusahaan[p.job_id];
            }
            if (compKey && statsMap[compKey]) statsMap[compKey].studentCount += 1;
        });

        return cleanedKaishaData.map(k => ({
            ...k,
            stats: statsMap[k.nama_perusahaan?.toLowerCase().trim()] || { joCount: 0, studentCount: 0 }
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    saveKaisha: async (payload, editingId) => {
        if (editingId) {
            const { error } = await supabase.from('master_kaisha').update(payload).eq('id', editingId);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('master_kaisha').insert([payload]);
            if (error) throw error;
        }
    },

    deleteKaisha: async (id) => {
        const { error } = await supabase.from('master_kaisha').delete().eq('id', id);
        if (error) throw error;
    },

    // ── 6. MASTER KUMIAI ──
    getKumiaiList: async () => {
        const { data, error } = await supabase.from('master_kumiai').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    saveKumiai: async (payload, editingId) => {
        if (editingId) {
            const { error } = await supabase.from('master_kumiai').update(payload).eq('id', editingId);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('master_kumiai').insert([payload]);
            if (error) throw error;
        }
    },

    deleteKumiai: async (id) => {
        const { error } = await supabase.from('master_kumiai').delete().eq('id', id);
        if (error) throw error;
    },

    // ── 7. MASTER MITRA & AKSES ──
    getMitraList: async () => {
        const { data, error } = await supabase.from('master_mitra_lokal').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    addMitra: async (payload, password) => {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email: payload.email, password: password });
        if (authError) throw authError;
        if (!authData.user) throw new Error("Gagal membuat kredensial akses. Mungkin email sudah terdaftar.");

        const profileData = { ...payload, id: authData.user.id };
        const { error } = await supabase.from('master_mitra_lokal').insert([profileData]);
        if (error) throw error;
    },

    updateMitra: async (id, payload) => {
        const { error } = await supabase.from('master_mitra_lokal').update(payload).eq('id', id);
        if (error) throw error;
    },

    deleteMitra: async (id) => {
        const { error } = await supabase.from('master_mitra_lokal').delete().eq('id', id);
        if (error) throw error;
    },

    getStudentsByMitra: async (namaInstitusi) => {
        const { data, error } = await supabase
            .from('students')
            .select('id, nik, nama_lengkap, jenis_kelamin, program, tahap_sekarang, status_akhir, medical_checkup_status')
            .eq('lpk_asal', namaInstitusi)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    // ── 8. MASTER PENGGUNA (SDM) ──
    getEmployeeList: async () => {
        const { data: roleData } = await supabaseAdmin.from('master_role').select('id, nama_role');
        const { data: empData, error } = await supabaseAdmin.from('employees').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        return empData.map(emp => ({
            ...emp,
            master_role: { nama_role: roleData.find(r => r.id === emp.role_id)?.nama_role || 'BELUM ADA JABATAN' }
        }));
    },

    createEmployee: async (formData) => {
        const shadowEmail = `${formData.id_karyawan.trim().toUpperCase()}@internal.ujc.com`;
        const defaultPassword = 'UJC12345';

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: shadowEmail, password: defaultPassword, email_confirm: true
        });
        if (authError) throw authError;

        const { error: empError } = await supabase.from('employees').insert([{
            id: authData.user.id,
            id_karyawan: formData.id_karyawan.trim().toUpperCase(),
            nama_lengkap: formData.nama_lengkap,
            email_pribadi: formData.email_pribadi,
            no_hp: formData.no_hp,
            role_id: formData.role_id,
            alamat: formData.alamat,
            status: formData.status,
            is_first_login: true
        }]);

        if (empError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw empError;
        }

        return { email: shadowEmail, password: defaultPassword };
    },

    updateEmployee: async (id, formData) => {
        const { error } = await supabase.from('employees').update({
            id_karyawan: formData.id_karyawan.trim().toUpperCase(),
            nama_lengkap: formData.nama_lengkap,
            email_pribadi: formData.email_pribadi,
            no_hp: formData.no_hp,
            role_id: formData.role_id,
            alamat: formData.alamat,
            status: formData.status
        }).eq('id', id);
        if (error) throw error;
    },

    resetEmployeePassword: async (id) => {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { password: 'UJC12345' });
        if (authError) throw authError;

        const { error: empError } = await supabase.from('employees').update({ is_first_login: true }).eq('id', id);
        if (empError) throw empError;
    },

    deleteEmployee: async (id) => {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;
    },

    // ── 9. FUNGSI KHUSUS JOB ORDER DETAIL (SHARED COMPONENT) ──
    getJobOrderParticipants: async (perusahaan) => {
        const { data, error } = await supabase.from('students').select('*').eq('perusahaan_tujuan', perusahaan).order('nama_lengkap', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    getAvailableStudentsForJob: async () => {
        const { data, error } = await supabase.from('students').select('*').order('nama_lengkap', { ascending: true });
        if (error) throw error;
        return (data || []).filter(s => {
            const tahap = (s.tahap_sekarang || '').toUpperCase();
            const isNganggur = ['AVAILABLE', 'SELEKSI AWAL', 'REGISTRASI', 'PRA_MENSETSU', 'INTERVIEW'].includes(tahap);
            const isNoCompany = !s.perusahaan_tujuan || s.perusahaan_tujuan.trim() === '';
            return isNganggur && isNoCompany;
        });
    },

    addCandidatesToJob: async (studentIds, jobId, perusahaan, totalNanti) => {
        const { error: studentErr } = await supabase.from('students').update({ 
            perusahaan_tujuan: perusahaan, tahap_sekarang: 'PRA_MENSETSU', status_akhir: 'Proses', catatan: '' 
        }).in('id', studentIds);
        if (studentErr) throw studentErr;

        const { error: joErr } = await supabase.from('job_orders').update({ terisi: totalNanti }).eq('id', jobId);
        if (joErr) throw joErr;
    },

    removeCandidateFromJob: async (studentId, jobId, totalSekarang) => {
        const { error } = await supabase.from('students').update({ perusahaan_tujuan: null, tahap_sekarang: 'AVAILABLE', status_akhir: 'BELUM DAPAT JOB', catatan: '' }).eq('id', studentId);
        if (error) throw error;
        
        await supabase.from('job_orders').update({ terisi: totalSekarang }).eq('id', jobId);
    },

    updateJobOrderStatusQuick: async (jobId, newStatus) => {
        const { error } = await supabase.from('job_orders').update({ status: newStatus, updated_at: new Date() }).eq('id', jobId);
        if (error) throw error;
    },

    updateJobOrderDetailFull: async (jobId, payload) => {
        const { error } = await supabase.from('job_orders').update(payload).eq('id', jobId);
        if (error) throw error;
    },

    saveCandidateSelection: async (studentId, jobId, payloadUpdate, isFailed, totalSekarang) => {
        const { error } = await supabase.from('students').update(payloadUpdate).eq('id', studentId);
        if (error) throw error;

        if (isFailed) {
            await supabase.from('job_orders').update({ terisi: totalSekarang }).eq('id', jobId);
        }
    },
    
    getStudentPhotoUrl: (studentId) => {
        if(!studentId) return '';
        const { data } = supabase.storage.from('registration_photos').getPublicUrl(`${studentId}.jpg`);
        return data.publicUrl;
    }
};