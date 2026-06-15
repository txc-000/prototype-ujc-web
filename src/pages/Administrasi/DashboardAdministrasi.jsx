import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Wallet, Building2, Search, Loader2, UserCircle, Plus, 
    Receipt, AlertOctagon, PlaneTakeoff, BellRing, Layers, Calendar, Mail, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORT STYLES SENTRAL
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

// IMPORT KOMPONEN TABS & MODALS
import TabDashboard from './tabs/TabDashboard';
import TabPrioritas from './tabs/TabPrioritas';
import TabTagihan from './tabs/TabTagihan';
import TabAlumni from './tabs/TabAlumni';
import TabInvoice from './tabs/TabInvoice';
import TabBukuKas from './tabs/TabBukuKas';
import ModalInvoiceBuilder from './tabs/ModalInvoiceBuilder';
import ModalPembayaranSiswa from './tabs/ModalPembayaranSiswa';
import ModalViewInvoice from './tabs/ModalViewInvoice';
import ModalCatatKas from './tabs/ModalCatatKas'; // ✅ INI YANG KELUPAAN DI-IMPORT TUAN

const PAYMENT_STAGES = [
    { id: 'TAHAP_3', label: 'Pendidikan Reguler', amount: 5000000, isCicilan: true },
    { id: 'TAHAP_5', label: 'Pendidikan Diklat', amount: 33000000, isCicilan: true }
];

const OPSI_PEMBAYARAN = [
    { id: 'SESUAI_PERJANJIAN', label: 'Sesuai Perjanjian' },
    { id: 'DIGABUNG_TAGIHAN_LAIN', label: 'Digabung Tagihan Lain' },
    { id: 'BAYAR_DIMUKA_1_TAHUN', label: 'Dibayar Di Muka (1 Tahun)' },
    { id: 'BAYAR_SAAT_PULANG', label: 'Dibayar Saat Pulang (Potong Jaminan)' }
];

export default function DashboardAdministrasi() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('DASHBOARD'); 
    const [students, setStudents] = useState([]);
    const [alumniData, setAlumniData] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // STATE FILTER
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAsal, setFilterAsal] = useState('SEMUA'); 
    
    const [userProfile, setUserProfile] = useState(null);

    // State B2C Payment
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [payForm, setPayForm] = useState({ kategori: '', nominal: '', metode_pembayaran: 'TRANSFER', keterangan: '' });

    // STATE INVOICE B2B
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({ kumiai: '', periode: '', opsi_pembayaran: 'SESUAI_PERJANJIAN' });
    const [invoiceDraft, setInvoiceDraft] = useState([]); 
    const [activeInvoiceId, setActiveInvoiceId] = useState(null);
    const [activeInvoiceNo, setActiveInvoiceNo] = useState('');
    const [formAddStudent, setFormAddStudent] = useState({ kaisha: '', student_id: '' });

    // State Modal View & Kas
    const [viewInvoice, setViewInvoice] = useState(null);
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);
    const [cashForm, setCashForm] = useState({ tipe: 'KELUAR', kategori: 'Operasional', keterangan: '', nominal: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State Filter Dashboard
    const [dashFilterProgram, setDashFilterProgram] = useState('');
    const [dashFilterPerusahaan, setDashFilterPerusahaan] = useState('');

    // STATE KOTAK MASUK
    const [currentUserId, setCurrentUserId] = useState(null);
    const [inboxTasks, setInboxTasks] = useState([]);
    const [showInbox, setShowInbox] = useState(false);

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                fetchInbox(user.id);
                fetchUserProfile(user.id);
            }
        };
        initData();
    }, []);

    const fetchInbox = async (userId) => {
        try {
            const { data } = await supabase.from('timeline_discussions').select('id, sender_name, message, created_at, is_read, company_timeline(kegiatan)').eq('receiver_id', userId).eq('is_read', false).order('created_at', { ascending: false });
            setInboxTasks(data || []);
        } catch (e) {}
    };

    const markAsRead = async (id) => {
        try {
            await supabase.from('timeline_discussions').update({ is_read: true }).eq('id', id);
            setInboxTasks(prev => prev.filter(t => t.id !== id));
        } catch (e) {}
    };

    useEffect(() => {
        if (!currentUserId) return;
        const channel = supabase.channel('custom-inbox-admin')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline_discussions', filter: `receiver_id=eq.${currentUserId}` }, (payload) => {
                fetchInbox(currentUserId);
                alert(`🔔 TUGAS BARU DARI: ${payload.new.sender_name}\n\nPesan: ${payload.new.message}`);
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUserId]);

    useEffect(() => { fetchData(); }, [activeTab]);

    const fetchUserProfile = async (userId) => {
        try {
            const { data } = await supabase.from('employees').select('nama_lengkap').eq('id', userId).maybeSingle();
            if (data) setUserProfile(data);
        } catch (err) {}
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: stdData } = await supabase.from('students')
                .select('id, nik, nama_lengkap, tahap_sekarang, total_bayar, status_pembayaran, telepon, program, lpk_asal')
                .neq('tahap_sekarang', 'SIAP BERANGKAT')
                .order('created_at', { ascending: false });
            
            const { data: payData } = await supabase.from('student_payments').select('id, student_id, nominal, tanggal_bayar, created_at, metode_pembayaran');
            
            const combinedData = (stdData || []).map(std => {
                const totalTerbayar = payData?.filter(p => p.student_id === std.id).reduce((sum, p) => sum + Number(p.nominal), 0) || 0;
                const isMitra = std.lpk_asal && std.lpk_asal.trim() !== '';
                const defaultTagihan = isMitra ? 33000000 : 38000000;
                const targetTagihan = std.total_bayar > 0 ? std.total_bayar : defaultTagihan;
                const sisaTagihan = targetTagihan - totalTerbayar;
                
                return { ...std, total_bayar: targetTagihan, total_terbayar: totalTerbayar, sisa_tagihan: sisaTagihan > 0 ? sisaTagihan : 0, isMitra };
            });
            setStudents(combinedData);

            const { data: alumData } = await supabase.from('students')
                .select('id, nama_lengkap, perusahaan_tujuan, status_alumni, updated_at, tanggal_entri, program, data_otit, lpk_asal')
                .eq('tahap_sekarang', 'SIAP BERANGKAT')
                .order('nama_lengkap', { ascending: true });
            
            const { data: jobOrdersData } = await supabase.from('job_orders').select('kumiai, perusahaan');
            const companyMap = {};
            if (jobOrdersData) {
                jobOrdersData.forEach(job => {
                    if (job.perusahaan && job.kumiai) companyMap[job.perusahaan.toLowerCase().trim()] = job.kumiai;
                });
            }

            const mappedAlumni = (alumData || []).map(s => {
                const pt = s.perusahaan_tujuan ? s.perusahaan_tujuan.trim() : '';
                const inferredKumiai = pt ? companyMap[pt.toLowerCase()] : null;
                const isMitra = s.lpk_asal && s.lpk_asal.trim() !== '';
                return { ...s, kumiai_inferred: inferredKumiai, isMitra };
            });
            setAlumniData(mappedAlumni);

            const { data: invData } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
            setInvoices(invData || []);

            const { data: cashData } = await supabase.from('cash_transactions').select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false });
            setTransactions(cashData || []);

            const { data: kumiaiData } = await supabase.from('master_kumiai').select('*');
            setMasterKumiai(kumiaiData || []);

        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const formatTanggal = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getPeriodeString = (tglEntri) => {
        if (!tglEntri) return 'Belum ada data Entri';
        const start = formatTanggal(tglEntri);
        const end = formatTanggal(new Date());
        return `${start} s/d ${end}`;
    };

    const updateStatusAlumni = async (id, nama, status) => {
        try {
            await supabase.from('students').update({ status_alumni: status }).eq('id', id);
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const uniqueDashPerusahaan = [...new Set(alumniData.map(a => a.perusahaan_tujuan).filter(Boolean))].sort();
    const uniqueDashProgram = [...new Set(alumniData.map(a => a.program).filter(Boolean))].sort();

    const filteredAlumniDash = alumniData.filter(s => {
        const matchProg = dashFilterProgram ? s.program === dashFilterProgram : true;
        const matchPerus = dashFilterPerusahaan ? s.perusahaan_tujuan === dashFilterPerusahaan : true;
        const isAktif = !s.status_alumni || s.status_alumni === 'AKTIF';
        return matchProg && matchPerus && isAktif;
    });

    const openPaymentModal = async (student) => {
        setSelectedStudent(student);
        setPayForm({ kategori: '', nominal: '', metode_pembayaran: 'TRANSFER', keterangan: '' });
        try {
            const { data } = await supabase.from('student_payments').select('*').eq('student_id', student.id).order('tanggal_bayar', { ascending: false });
            setPayments(data || []);
        } catch (err) {}
        setIsPayModalOpen(true);
    };

    const handleKategoriChange = (e) => {
        const val = e.target.value;
        const stage = PAYMENT_STAGES.find(s => s.id === val);
        if (stage && !stage.isCicilan) setPayForm(prev => ({ ...prev, kategori: val, nominal: stage.amount }));
        else setPayForm(prev => ({ ...prev, kategori: val, nominal: '' }));
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const stageLabel = PAYMENT_STAGES.find(s => s.id === payForm.kategori)?.label || payForm.kategori || 'Pembayaran Lainnya';
            const finalKet = payForm.keterangan ? `${stageLabel} (${payForm.keterangan})` : stageLabel;
            const nominalNum = Number(payForm.nominal);

            await supabase.from('student_payments').insert([{ student_id: selectedStudent.id, nominal: nominalNum, metode_pembayaran: payForm.metode_pembayaran, keterangan: finalKet, created_by: user?.id }]);
            await supabase.from('cash_transactions').insert([{ tipe: 'MASUK', kategori: 'Pembayaran Siswa', keterangan: `Pemb. ${selectedStudent.nama_lengkap} - ${finalKet}`, nominal: nominalNum, created_by: user?.id }]);

            if ((selectedStudent.sisa_tagihan - nominalNum) <= 0) {
                await supabase.from('students').update({ status_pembayaran: 'LUNAS' }).eq('id', selectedStudent.id);
            }
            
            alert("Pembayaran berhasil dicatat & masuk ke Buku Kas!");
            fetchData(); 
            setIsPayModalOpen(false);
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const handleCashSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('cash_transactions').insert([{ tipe: cashForm.tipe, kategori: cashForm.kategori, keterangan: cashForm.keterangan, nominal: Number(cashForm.nominal), created_by: user?.id }]);
            alert("Transaksi kas berhasil dicatat!");
            setIsCashModalOpen(false);
            setCashForm({ tipe: 'KELUAR', kategori: 'Operasional', keterangan: '', nominal: '' });
            fetchData();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const handleSelectKumiaiForInvoice = async (kumiaiName) => {
        setInvoiceForm(prev => ({ ...prev, kumiai: kumiaiName }));
        setFormAddStudent({ kaisha: '', student_id: '' });
        
        if (!kumiaiName) { 
            setInvoiceDraft([]); 
            setActiveInvoiceId(null);
            setActiveInvoiceNo('');
            return; 
        }
        
        setIsLoading(true);
        try {
            const { data } = await supabase.from('invoices')
                .select('*')
                .eq('kumiai_name', kumiaiName)
                .eq('status', 'UNPAID')
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                const existingInv = data[0];
                setActiveInvoiceId(existingInv.id);
                setActiveInvoiceNo(existingInv.invoice_no);
                
                const existingDetail = typeof existingInv.detail_tagihan === 'string' ? JSON.parse(existingInv.detail_tagihan) : (existingInv.detail_tagihan || []);
                setInvoiceDraft(existingDetail);
                setInvoiceForm({ 
                    kumiai: kumiaiName, 
                    periode: existingInv.billing_period || `Bulan ${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`, 
                    opsi_pembayaran: existingInv.opsi_pembayaran || 'SESUAI_PERJANJIAN' 
                });
            } else {
                setActiveInvoiceId(null);
                setActiveInvoiceNo('');
                setInvoiceDraft([]);
                setInvoiceForm({ 
                    kumiai: kumiaiName, 
                    periode: `Bulan ${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`, 
                    opsi_pembayaran: 'SESUAI_PERJANJIAN' 
                });
            }
        } catch (err) { console.error("Error fetching invoice:", err.message); } finally { setIsLoading(false); }
    };

    const uniqueKaishaForKumiai = [...new Set(alumniData.filter(a => a.kumiai_inferred === invoiceForm.kumiai).map(a => a.perusahaan_tujuan).filter(Boolean))].sort();
    
    const availableStudentsForKaisha = alumniData.filter(a => 
        a.perusahaan_tujuan === formAddStudent.kaisha && 
        a.kumiai_inferred === invoiceForm.kumiai && 
        !invoiceDraft.some(draftItem => draftItem.student_id === a.id)
    );

    const handleAddStudentToDraft = () => {
        if (!formAddStudent.student_id) return alert("Pilih siswa terlebih dahulu!");
        const student = alumniData.find(a => a.id === formAddStudent.student_id);
        if (!student) return;

        const entri = student.tanggal_entri ? new Date(student.tanggal_entri) : new Date();
        const now = new Date();
        const bulanBerjalan = (now.getFullYear() - entri.getFullYear()) * 12 + (now.getMonth() - entri.getMonth()) + 1;
        const bulanAktual = bulanBerjalan > 0 ? bulanBerjalan : 1;

        const newItem = {
            student_id: student.id,
            nama_lengkap: student.nama_lengkap,
            perusahaan: student.perusahaan_tujuan.trim(),
            no_entri: student.tanggal_entri ? formatTanggal(student.tanggal_entri) : '-',
            nominal: 5000, 
            kuantitas: 1,
            satuan: 'Bulan',
            ket_durasi: `Bulan ke-${bulanAktual}`
        };

        setInvoiceDraft([...invoiceDraft, newItem]);
        setFormAddStudent({ ...formAddStudent, student_id: '' }); 
    };

    const updateDraftItem = (studentId, field, value) => {
        setInvoiceDraft(prev => prev.map(item => 
            item.student_id === studentId ? { ...item, [field]: (field === 'satuan' || field === 'ket_durasi' || field === 'nama_lengkap') ? value : Number(value) } : item
        ));
    };

    const removeDraftItem = (studentId) => {
        if (window.confirm("Hapus item ini dari tagihan?")) {
            setInvoiceDraft(prev => prev.filter(item => item.student_id !== studentId));
        }
    };

    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        if (invoiceDraft.length === 0) return alert("Tagihan tidak boleh kosong.");

        setIsSubmitting(true);
        try {
            const subtotal = invoiceDraft.reduce((sum, item) => sum + (item.nominal * item.kuantitas), 0);
            const tax = Math.round(subtotal * 0.11);
            const grandTotal = subtotal + tax;
            const finalPeriod = activeInvoiceId ? invoiceForm.periode : `Bulan ${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`;

            const payload = {
                kumiai_name: invoiceForm.kumiai,
                subtotal: subtotal,
                tax_amount: tax,
                total_amount: grandTotal,
                billing_period: finalPeriod,
                status: 'UNPAID',
                opsi_pembayaran: invoiceForm.opsi_pembayaran,
                detail_tagihan: invoiceDraft
            };

            let invoiceIdToPrint = activeInvoiceId;

            if (activeInvoiceId) {
                await supabase.from('invoices').update(payload).eq('id', activeInvoiceId);
                alert(`Data berhasil ditambahkan/diupdate ke Nota: ${activeInvoiceNo}`);
            } else {
                const invNo = `UJC-INV/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`;
                payload.invoice_no = invNo;
                const { data: inserted } = await supabase.from('invoices').insert([payload]).select();
                if (inserted && inserted.length > 0) invoiceIdToPrint = inserted[0].id;
                alert("Nota baru berhasil dibuat!");
            }

            if (invoiceIdToPrint) window.open(`/print-invoice-detail/${invoiceIdToPrint}`, '_blank');

            setIsInvoiceModalOpen(false); 
            setInvoiceForm({ kumiai: '', periode: '', opsi_pembayaran: 'SESUAI_PERJANJIAN' }); 
            setInvoiceDraft([]);
            setActiveInvoiceId(null);
            setActiveInvoiceNo('');
            fetchData();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const updateInvoiceStatus = async (inv) => {
        if(!window.confirm(`Tandai Invoice ${inv.invoice_no} sebagai LUNAS?`)) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('invoices').update({ status: 'PAID' }).eq('id', inv.id);
            await supabase.from('cash_transactions').insert([{ tipe: 'MASUK', kategori: 'Pembayaran Kumiai', keterangan: `Pelunasan Invoice ${inv.invoice_no}`, nominal: inv.total_amount, created_by: user?.id }]);
            fetchData();
            if(viewInvoice && viewInvoice.id === inv.id) setViewInvoice({...viewInvoice, status: 'PAID'});
        } catch (err) { alert(err.message); }
    };

    const filteredStudentsTagihan = students.filter(s => {
        let matchAsal = true;
        if (filterAsal === 'REGULER') matchAsal = !s.isMitra;
        if (filterAsal === 'MITRA') matchAsal = s.isMitra;
        const matchSearch = (s.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch && matchAsal;
    });

    const filteredAlumniTracking = alumniData.filter(a => {
        let matchAsal = true;
        if (filterAsal === 'REGULER') matchAsal = !a.isMitra;
        if (filterAsal === 'MITRA') matchAsal = a.isMitra;
        const matchSearch = (a.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.perusahaan_tujuan || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch && matchAsal;
    });

    const urgentInvoices = invoices.filter(i => i.status === 'UNPAID');
    const problematicAlumni = alumniData.filter(a => ['KABUR', 'SAKIT'].includes(a.status_alumni));
    const unconfirmedAlumni = alumniData.filter(a => a.status_alumni === 'BUTUH KONFIRMASI');
    const tunggakanBesarSiswa = students.filter(s => s.sisa_tagihan > 20000000);

    const totalMasuk = transactions.filter(t => t.tipe === 'MASUK' || t.tipe === 'DANA_MENGGANTUNG').reduce((sum, t) => sum + Number(t.nominal), 0);
    const totalKeluar = transactions.filter(t => t.tipe === 'KELUAR').reduce((sum, t) => sum + Number(t.nominal), 0);
    const saldoAkhir = totalMasuk - totalKeluar;

    const showPriorityBanner = urgentInvoices.length > 0 || tunggakanBesarSiswa.length > 0 || problematicAlumni.length > 0 || unconfirmedAlumni.length > 0;
    const totalKerugianYen = urgentInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    return (
        <div className="fade-in" style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Div. Administrasi</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Keuangan & Audit LPK</p>
                </div>
                
                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                    <button onClick={() => setActiveTab('DASHBOARD')} style={activeTab === 'DASHBOARD' ? styles.activeMenuS : styles.inactiveMenuS}><Layers size={18} /> Dashboard</button>
                    <button onClick={() => setActiveTab('PRIORITAS')} style={activeTab === 'PRIORITAS' ? styles.activeMenuS : styles.inactiveMenuS}><AlertOctagon size={18} /> Prioritas & Bermasalah</button>
                    
                    <div style={styles.sidebarLabel}>TAGIHAN LOKAL (RP)</div>
                    <button onClick={() => setActiveTab('TAGIHAN_SISWA')} style={activeTab === 'TAGIHAN_SISWA' ? styles.activeMenuS : styles.inactiveMenuS}><Wallet size={18} /> Tagihan Siswa</button>

                    <div style={styles.sidebarLabel}>TAGIHAN JEPANG (YEN)</div>
                    <button onClick={() => setActiveTab('ALUMNI_TRACKING')} style={activeTab === 'ALUMNI_TRACKING' ? styles.activeMenuS : styles.inactiveMenuS}><PlaneTakeoff size={18} /> Tracker Alumni (Freeze)</button>
                    <button onClick={() => setActiveTab('INVOICE_KUMIAI')} style={activeTab === 'INVOICE_KUMIAI' ? styles.activeMenuS : styles.inactiveMenuS}><Building2 size={18} /> Invoice Builder B2B</button>

                    <div style={styles.sidebarLabel}>AUDIT & PEMBUKUAN</div>
                    <button onClick={() => setActiveTab('BUKU_KAS')} style={activeTab === 'BUKU_KAS' ? styles.activeMenuS : styles.inactiveMenuS}><Receipt size={18} /> Buku Kas & Arus Kas</button>
                    <button onClick={() => navigate('/timeline')} style={styles.inactiveMenuS}><Calendar size={18} /> Timeline Global</button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <button onClick={() => setShowInbox(true)} style={{ width: '100%', marginBottom: '15px', background: inboxTasks.length > 0 ? '#eff6ff' : 'white', border: `1px solid ${inboxTasks.length > 0 ? '#3b82f6' : '#cbd5e1'}`, padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: inboxTasks.length > 0 ? '#1e40af' : '#475569', fontWeight: 800 }}><Mail size={18}/> Kotak Tugas</div>
                        {inboxTasks.length > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' }}>{inboxTasks.length} Baru</span>}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <UserCircle size={32} color={brandNavy} />
                        <div style={{ overflow: 'hidden' }}><div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{userProfile?.nama_lengkap || 'Admin'}</div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>ADMINISTRATOR</div></div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '8px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Keluar</button>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>
                            {activeTab === 'DASHBOARD' && 'Dashboard Hierarki B2B'}
                            {activeTab === 'PRIORITAS' && 'Radar Prioritas & Entitas Bermasalah'}
                            {activeTab === 'TAGIHAN_SISWA' && 'Manajemen Tagihan Siswa'}
                            {activeTab === 'ALUMNI_TRACKING' && 'Tracking Status Alumni'}
                            {activeTab === 'INVOICE_KUMIAI' && 'Invoice Builder (Update Nota)'}
                            {activeTab === 'BUKU_KAS' && 'Buku Kas & Detail Arus Uang'}
                        </h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Sistem ERP Terpadu Keuangan Universal Japan Course.</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {['TAGIHAN_SISWA', 'ALUMNI_TRACKING'].includes(activeTab) && (
                            <select value={filterAsal} onChange={(e) => setFilterAsal(e.target.value)} style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700, color: brandNavy, background: 'white' }}>
                                <option value="SEMUA">Semua Jalur</option>
                                <option value="REGULER">Siswa Reguler UJC</option>
                                <option value="MITRA">Siswa Mitra LPK</option>
                            </select>
                        )}
                        {['TAGIHAN_SISWA', 'ALUMNI_TRACKING', 'INVOICE_KUMIAI', 'BUKU_KAS'].includes(activeTab) && (
                            <div style={{ position: 'relative' }}>
                                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                                <input type="text" placeholder="Cari Data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }} />
                            </div>
                        )}
                        {activeTab === 'INVOICE_KUMIAI' && <button onClick={() => setIsInvoiceModalOpen(true)} style={styles.btnPrimary}><Plus size={18}/> Buat / Update Invoice</button>}
                        {activeTab === 'BUKU_KAS' && <button onClick={() => setIsCashModalOpen(true)} style={styles.btnPrimary}><Plus size={18}/> Catat Transaksi Manual</button>}
                    </div>
                </header>

                {showPriorityBanner && !isLoading && activeTab !== 'DASHBOARD' && (
                    <div style={{ background: urgentInvoices.length > 0 ? '#fff1f2' : '#fffbeb', border: `1px solid ${urgentInvoices.length > 0 ? '#fecdd3' : '#fde68a'}`, padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', alignItems: 'flex-start', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                        <div style={{ background: urgentInvoices.length > 0 ? '#ffe4e6' : '#fef3c7', padding: '12px', borderRadius: '50%' }}>
                            <BellRing size={28} color={urgentInvoices.length > 0 ? '#e11d48' : '#d97706'} />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', color: urgentInvoices.length > 0 ? '#be123c' : '#b45309', fontSize: '1.1rem', fontWeight: 900 }}>🚨 PENGINGAT SISTEM: PRIORITAS PENAGIHAN</h3>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: urgentInvoices.length > 0 ? '#9f1239' : '#92400e', fontSize: '0.9rem', fontWeight: 700, lineHeight: '1.6' }}>
                                {urgentInvoices.length > 0 && <li>Segera tagih <b>{urgentInvoices.length} Invoice Kumiai</b> yang belum lunas (Total Tertunggak: <b>¥ {totalKerugianYen.toLocaleString()}</b>).</li>}
                                {tunggakanBesarSiswa.length > 0 && <li>Terdapat <b>{tunggakanBesarSiswa.length} Siswa Lokal</b> dengan tunggakan &gt; Rp 20 Juta.</li>}
                                {problematicAlumni.length > 0 && <li>Ada <b>{problematicAlumni.length} Alumni Kabur/Sakit</b>.</li>}
                            </ul>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {activeTab === 'DASHBOARD' && <TabDashboard dashFilterProgram={dashFilterProgram} setDashFilterProgram={setDashFilterProgram} uniqueDashProgram={uniqueDashProgram} dashFilterPerusahaan={dashFilterPerusahaan} setDashFilterPerusahaan={setDashFilterPerusahaan} uniqueDashPerusahaan={uniqueDashPerusahaan} filteredAlumniDash={filteredAlumniDash} formatTanggal={formatTanggal} getPeriodeString={getPeriodeString} />}
                    {activeTab === 'PRIORITAS' && <TabPrioritas urgentInvoices={urgentInvoices} updateInvoiceStatus={updateInvoiceStatus} problematicAlumni={problematicAlumni} unconfirmedAlumni={unconfirmedAlumni} totalKerugianYen={totalKerugianYen} />}
                    {activeTab === 'TAGIHAN_SISWA' && <TabTagihan filteredStudentsTagihan={filteredStudentsTagihan} openPaymentModal={openPaymentModal} />}
                    {activeTab === 'ALUMNI_TRACKING' && <TabAlumni filteredAlumniTracking={filteredAlumniTracking} formatTanggal={formatTanggal} updateStatusAlumni={updateStatusAlumni} />}
                    {activeTab === 'INVOICE_KUMIAI' && <TabInvoice invoices={invoices} searchTerm={searchTerm} updateInvoiceStatus={updateInvoiceStatus} setViewInvoice={setViewInvoice} />}
                    {activeTab === 'BUKU_KAS' && <TabBukuKas totalMasuk={totalMasuk} totalKeluar={totalKeluar} saldoAkhir={saldoAkhir} transactions={transactions} />}
                </div>

                <ModalPembayaranSiswa 
                    isPayModalOpen={isPayModalOpen}
                    setIsPayModalOpen={setIsPayModalOpen}
                    selectedStudent={selectedStudent}
                    payForm={payForm}
                    setPayForm={setPayForm}
                    PAYMENT_STAGES={PAYMENT_STAGES}
                    handleKategoriChange={handleKategoriChange}
                    handlePaymentSubmit={handlePaymentSubmit}
                    isSubmitting={isSubmitting}
                    payments={payments}
                />

                <ModalInvoiceBuilder 
                    isInvoiceModalOpen={isInvoiceModalOpen}
                    setIsInvoiceModalOpen={setIsInvoiceModalOpen}
                    invoiceForm={invoiceForm}
                    handleSelectKumiaiForInvoice={handleSelectKumiaiForInvoice}
                    masterKumiai={masterKumiai}
                    activeInvoiceId={activeInvoiceId}
                    activeInvoiceNo={activeInvoiceNo}
                    OPSI_PEMBAYARAN={OPSI_PEMBAYARAN}
                    setInvoiceForm={setInvoiceForm}
                    formAddStudent={formAddStudent}
                    setFormAddStudent={setFormAddStudent}
                    uniqueKaishaForKumiai={uniqueKaishaForKumiai}
                    availableStudentsForKaisha={availableStudentsForKaisha}
                    handleAddStudentToDraft={handleAddStudentToDraft}
                    invoiceDraft={invoiceDraft}
                    updateDraftItem={updateDraftItem}
                    removeDraftItem={removeDraftItem}
                    handleSaveInvoice={handleSaveInvoice}
                    isSubmitting={isSubmitting}
                />

                <ModalViewInvoice 
                    viewInvoice={viewInvoice}
                    setViewInvoice={setViewInvoice}
                />

                {/* ✅ INI YANG TADI KELUPAAN DIMASUKKAN TUAN */}
                <ModalCatatKas 
                    isCashModalOpen={isCashModalOpen}
                    setIsCashModalOpen={setIsCashModalOpen}
                    cashForm={cashForm}
                    setCashForm={setCashForm}
                    handleCashSubmit={handleCashSubmit}
                    isSubmitting={isSubmitting}
                />
                
                {/* MODAL KOTAK MASUK */}
                {showInbox && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={20} color="#3b82f6"/> Kotak Tugas & Pesan</h2>
                                <button onClick={() => setShowInbox(false)} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18}/></button>
                            </div>
                            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f1f5f9' }}>
                                {inboxTasks.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '30px 0', fontWeight: 600 }}>Tidak ada tugas / instruksi baru untuk Anda.</div>
                                ) : (
                                    inboxTasks.map(t => (
                                        <div key={t.id} style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>Dari: {t.sender_name}</span>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(t.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>Tugas: {t.company_timeline?.kegiatan || '-'}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>"{t.message}"</div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => markAsRead(t.id)} style={{ flex: 1, background: '#10b981', color: 'white', padding: '8px', borderRadius: '6px', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Tandai Selesai Dibaca</button>
                                                <button onClick={() => { setShowInbox(false); navigate('/timeline'); }} style={{ flex: 1, background: 'white', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Lihat Timeline</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}