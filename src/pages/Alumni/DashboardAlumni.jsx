import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// IMPOR KOMPONEN ANAK
import AlumniHeaderFilter from './components/AlumniHeaderFilter';
import AlumniKpiCards from './components/AlumniKpiCards';
import AlumniTable from './components/AlumniTable';
import ModalUpdateAlumni from './components/ModalUpdateAlumni';

export default function DashboardAlumni() {
    const [rawAlumni, setRawAlumni] = useState([]);
    const [alumni, setAlumni] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // FILTER STATE
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterKaisha, setFilterKaisha] = useState('');
    const [filterKumiai, setFilterKumiai] = useState('');
    
    // MASTER DATA UNTUK FILTER
    const [masterKaisha, setMasterKaisha] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);

    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAlumni, setSelectedAlumni] = useState(null);
    const [updateForm, setUpdateForm] = useState({ status_akhir: '', catatan: '' });

    useEffect(() => {
        function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [resKaisha, resKumiai] = await Promise.all([
                    supabase.from('master_kaisha').select('nama_perusahaan, nama_kaisha'),
                    supabase.from('master_kumiai').select('nama_kumiai')
                ]);
                if (resKaisha.data) setMasterKaisha(resKaisha.data);
                if (resKumiai.data) setMasterKumiai(resKumiai.data);
            } catch (err) {}
        };
        fetchMasterData();
        fetchAlumni();
    }, []);

    const fetchAlumni = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .in('tahap_sekarang', ['SIAP BERANGKAT', 'ALUMNI'])
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setRawAlumni(data || []);
            setAlumni(data || []);
        } catch (error) { console.error('Gagal memuat data alumni:', error); } finally { setIsLoading(false); }
    };

    // PROSES FILTERING CLIENT-SIDE
    useEffect(() => {
        let result = [...rawAlumni];
        if (searchTerm) result = result.filter(a => (a.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()));
        if (filterStatus !== 'ALL') result = result.filter(a => (a.status_akhir || '').toUpperCase() === filterStatus);
        if (filterKaisha) result = result.filter(a => a.perusahaan_tujuan === filterKaisha);
        if (filterKumiai) {
            result = result.filter(a => {
                const otit = typeof a.data_otit === 'string' ? JSON.parse(a.data_otit || '{}') : (a.data_otit || {});
                return otit.nama_kumiai === filterKumiai;
            });
        }
        setAlumni(result);
    }, [searchTerm, filterStatus, filterKaisha, filterKumiai, rawAlumni]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('students').update({ tahap_sekarang: 'ALUMNI', status_akhir: updateForm.status_akhir }).eq('id', selectedAlumni.id);
            if (error) throw error;
            
            const { data: { user } } = await supabase.auth.getUser();
            if(user) {
                await supabase.from('activity_logs').insert([{ user_id: user.id, keterangan: `Memperbarui status alumni ${selectedAlumni.nama_lengkap} menjadi ${updateForm.status_akhir}` }]);
            }
            alert('Status Alumni berhasil diperbarui!');
            setIsModalOpen(false);
            fetchAlumni();
        } catch (error) { alert('Gagal memperbarui status: ' + error.message); }
    };

    const openUpdateModal = (siswa) => {
        setSelectedAlumni(siswa);
        setUpdateForm({ status_akhir: siswa.status_akhir || 'AKTIF BEKERJA', catatan: '' });
        setIsModalOpen(true);
        setActiveDropdown(null);
    };

    const calculateContract = (dateString) => {
        if (!dateString) return { text: 'Tidak diketahui', isWarning: false };
        const start = new Date(dateString);
        const end = new Date(start.setFullYear(start.getFullYear() + 3)); 
        const now = new Date();
        const diffTime = Math.abs(end - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.round(diffDays / 30);

        if (now > end) return { text: 'Kontrak Habis', isWarning: true, color: '#ef4444' };
        if (diffMonths <= 3) return { text: `Sisa ${diffMonths} Bulan`, isWarning: true, color: '#f59e0b' };
        return { text: `Sisa ${diffMonths} Bulan`, isWarning: false, color: '#10b981' };
    };

    const statAktif = alumni.filter(a => (a.status_akhir || '').toUpperCase() === 'AKTIF BEKERJA').length;
    const statBermasalah = alumni.filter(a => ['KABUR', 'PULANG AWAL'].includes((a.status_akhir || '').toUpperCase())).length;
    const statSelesai = alumni.filter(a => (a.status_akhir || '').toUpperCase() === 'SELESAI KONTRAK').length;

    return (
        <div className="fade-in" style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
            <AlumniHeaderFilter 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
                filterKaisha={filterKaisha} setFilterKaisha={setFilterKaisha} 
                filterKumiai={filterKumiai} setFilterKumiai={setFilterKumiai} 
                filterStatus={filterStatus} setFilterStatus={setFilterStatus} 
                masterKaisha={masterKaisha} masterKumiai={masterKumiai} 
            />
            <div style={{ padding: '0 40px' }}>
                <AlumniKpiCards 
                    totalAlumni={alumni.length} statAktif={statAktif} 
                    statSelesai={statSelesai} statBermasalah={statBermasalah} 
                />
                <AlumniTable 
                    isLoading={isLoading} alumni={alumni} calculateContract={calculateContract} 
                    activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} 
                    dropdownRef={dropdownRef} openUpdateModal={openUpdateModal} 
                />
            </div>

            <ModalUpdateAlumni 
                isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} 
                selectedAlumni={selectedAlumni} updateForm={updateForm} setUpdateForm={setUpdateForm} 
                handleUpdateStatus={handleUpdateStatus} 
            />
        </div>
    );
}