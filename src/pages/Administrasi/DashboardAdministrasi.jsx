import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Wallet, Building2, Search, Loader2, UserCircle, Plus, X, 
    Receipt, AlertOctagon, PlaneTakeoff, ShieldAlert, CheckCircle2, 
    BellRing, Layers, CalendarDays, Edit, Save, Trash2, ArrowDownCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORT STYLES SENTRAL
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

// IMPORT KOMPONEN TABS YANG SUDAH DIPISAH
import TabDashboard from './tabs/TabDashboard';
import TabPrioritas from './tabs/TabPrioritas';
import TabTagihan from './tabs/TabTagihan';
import TabAlumni from './tabs/TabAlumni';
import TabInvoice from './tabs/TabInvoice';
import TabBukuKas from './tabs/TabBukuKas';

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

const SATUAN_WAKTU = ['Bulan', 'Minggu', 'Hari', 'Lumpsum'];

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

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchUserProfile(user.id);
        };
        initData();
    }, []);

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
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
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
                    {/* Render Komponen Tab Secara Dinamis */}
                    {activeTab === 'DASHBOARD' && <TabDashboard dashFilterProgram={dashFilterProgram} setDashFilterProgram={setDashFilterProgram} uniqueDashProgram={uniqueDashProgram} dashFilterPerusahaan={dashFilterPerusahaan} setDashFilterPerusahaan={setDashFilterPerusahaan} uniqueDashPerusahaan={uniqueDashPerusahaan} filteredAlumniDash={filteredAlumniDash} formatTanggal={formatTanggal} getPeriodeString={getPeriodeString} />}
                    
                    {activeTab === 'PRIORITAS' && <TabPrioritas urgentInvoices={urgentInvoices} updateInvoiceStatus={updateInvoiceStatus} problematicAlumni={problematicAlumni} unconfirmedAlumni={unconfirmedAlumni} totalKerugianYen={totalKerugianYen} />}
                    
                    {activeTab === 'TAGIHAN_SISWA' && <TabTagihan filteredStudentsTagihan={filteredStudentsTagihan} openPaymentModal={openPaymentModal} />}
                    
                    {activeTab === 'ALUMNI_TRACKING' && <TabAlumni filteredAlumniTracking={filteredAlumniTracking} formatTanggal={formatTanggal} updateStatusAlumni={updateStatusAlumni} />}
                    
                    {activeTab === 'INVOICE_KUMIAI' && <TabInvoice invoices={invoices} searchTerm={searchTerm} updateInvoiceStatus={updateInvoiceStatus} setViewInvoice={setViewInvoice} />}
                    
                    {activeTab === 'BUKU_KAS' && <TabBukuKas totalMasuk={totalMasuk} totalKeluar={totalKeluar} saldoAkhir={saldoAkhir} transactions={transactions} />}
                </div>

                {/* ── MODAL PEMBAYARAN SISWA (B2C) ── */}
                {isPayModalOpen && selectedStudent && (
                    <div style={styles.modalOverlay}>
                        <div style={{...styles.modalContent, width: '700px', maxWidth: '95vw', padding: 0, overflow: 'hidden'}}>
                            <div style={{ background: brandNavy, padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Kasir Pembayaran Tagihan</h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Siswa: {selectedStudent.nama_lengkap} ({selectedStudent.isMitra ? 'Mitra' : 'Reguler'})</p>
                                </div>
                                <button type="button" onClick={() => setIsPayModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ padding: '30px', maxHeight: '75vh', overflowY: 'auto' }}>
                                {/* INFO KARTU TAGIHAN */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 800 }}>SISA TUNGGAKAN</div>
                                        <div style={{ fontSize: '1.6rem', color: '#ef4444', fontWeight: 900 }}>Rp {selectedStudent.sisa_tagihan.toLocaleString('id-ID')}</div>
                                    </div>
                                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '15px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 800 }}>TOTAL TERBAYAR</div>
                                        <div style={{ fontSize: '1.6rem', color: '#10b981', fontWeight: 900 }}>Rp {selectedStudent.total_terbayar.toLocaleString('id-ID')}</div>
                                    </div>
                                </div>

                                {/* FORM INPUT PEMBAYARAN */}
                                <form onSubmit={handlePaymentSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                                    <h4 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Input Pembayaran Baru</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={styles.lb}>Kategori Tagihan</label>
                                            <select required style={styles.inp} value={payForm.kategori} onChange={handleKategoriChange}>
                                                <option value="">-- Pilih Jenis --</option>
                                                {PAYMENT_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                <option value="LAINNYA">Lainnya / Cicilan Custom</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={styles.lb}>Nominal (Rp)</label>
                                            <input type="number" required min="1000" style={styles.inp} value={payForm.nominal} onChange={(e) => setPayForm({...payForm, nominal: e.target.value})} placeholder="Contoh: 1000000" />
                                        </div>
                                        <div>
                                            <label style={styles.lb}>Metode Pembayaran</label>
                                            <select required style={styles.inp} value={payForm.metode_pembayaran} onChange={(e) => setPayForm({...payForm, metode_pembayaran: e.target.value})}>
                                                <option value="TRANSFER">Transfer Bank</option>
                                                <option value="CASH">Tunai (Cash)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={styles.lb}>Keterangan Tambahan</label>
                                            <input type="text" style={styles.inp} value={payForm.keterangan} onChange={(e) => setPayForm({...payForm, keterangan: e.target.value})} placeholder="Opsional..." />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="submit" disabled={isSubmitting} style={{...styles.btnPrimary, background: '#10b981', padding: '12px 25px', fontSize: '1rem' }}>
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Wallet size={20}/> Catat & Masukkan Buku Kas</>}
                                        </button>
                                    </div>
                                </form>

                                {/* HISTORI PEMBAYARAN */}
                                <h4 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>Histori Pembayaran Siswa</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ background: '#f1f5f9' }}>
                                        <tr>
                                            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Tanggal</th>
                                            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Nominal</th>
                                            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Keterangan</th>
                                            <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Metode</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.length === 0 ? (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Belum ada histori pembayaran.</td></tr>
                                        ) : payments.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px', color: '#475569' }}>{new Date(p.tanggal_bayar || p.created_at).toLocaleDateString('id-ID')}</td>
                                                <td style={{ padding: '10px', fontWeight: 800, color: '#10b981' }}>Rp {Number(p.nominal).toLocaleString('id-ID')}</td>
                                                <td style={{ padding: '10px', color: '#334155' }}>{p.keterangan}</td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: p.metode_pembayaran === 'CASH' ? '#fef3c7' : '#e0e7ff', color: p.metode_pembayaran === 'CASH' ? '#b45309' : '#3730a3', fontWeight: 700, fontSize: '0.75rem' }}>{p.metode_pembayaran}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL INVOICE BUILDER (TETAP DI PARENT KARENA BANYAK STATE COMPLEX) */}
                {isInvoiceModalOpen && (
                    <div style={styles.modalOverlay}>
                        <div style={{...styles.modalContent, width: '1000px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '95vh', padding: '30px', overflow: 'hidden'}}>
                            <div style={styles.modalHeader}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Layers size={22} color={brandNavy}/> Builder & Update Invoice
                                    </h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pilih Kumiai, tambahkan siswa (anti duplikat).</p>
                                </div>
                                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={styles.closeBtn}><X size={20} color="#64748b" /></button>
                            </div>

                            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
                                {/* KOTAK 1: KONTROL INVOICE */}
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: brandNavy, fontWeight: 900, textTransform: 'uppercase' }}>1. Pilih Target Kumiai</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                                        <div>
                                            <select required style={{...styles.inp, border: '2px solid #3b82f6', fontWeight: 800, color: '#1d4ed8', cursor: 'pointer'}} value={invoiceForm.kumiai} onChange={(e) => handleSelectKumiaiForInvoice(e.target.value)}>
                                                <option value="">-- Pilih Kumiai --</option>
                                                {masterKumiai.map((k, i) => {
                                                    const namaKumiai = k.nama_kumiai || k.kumiai || k.nama || k.name || k.nama_perusahaan || Object.values(k)[1] || `Kumiai (${k.id})`;
                                                    return <option key={i} value={namaKumiai}>{namaKumiai}</option>;
                                                })}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {activeInvoiceId ? (
                                                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '10px 15px', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                    <Edit size={16}/> Mengedit Nota: <b>{activeInvoiceNo}</b>
                                                </div>
                                            ) : invoiceForm.kumiai ? (
                                                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 15px', borderRadius: '8px', color: '#047857', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                    <CheckCircle2 size={16}/> Membuat Nota Baru.
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    {invoiceForm.kumiai && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px' }}>
                                            <div>
                                                <label style={{...styles.lb, color: '#3730a3'}}>Periode Tagihan</label>
                                                <div style={{ ...styles.inp, background: '#f1f5f9', color: brandNavy, fontWeight: 900, cursor: 'not-allowed' }}>
                                                    {activeInvoiceId ? invoiceForm.periode : `Bulan ${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={styles.lb}>Opsi Termin Pembayaran</label>
                                                <select required style={{...styles.inp, cursor: 'pointer'}} value={invoiceForm.opsi_pembayaran} onChange={(e) => setInvoiceForm({...invoiceForm, opsi_pembayaran: e.target.value})}>
                                                    {OPSI_PEMBAYARAN.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* KOTAK 2: TAMBAH SISWA KE NOTA */}
                                {invoiceForm.kumiai && (
                                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '2px dashed #94a3b8', marginBottom: '20px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16}/> 2. Tambah Siswa / Item ke Tagihan</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                            <div>
                                                <label style={styles.lb}>Filter Perusahaan (Kaisha)</label>
                                                <select style={{...styles.inpSm, cursor: 'pointer'}} value={formAddStudent.kaisha} onChange={(e) => setFormAddStudent({ kaisha: e.target.value, student_id: '' })}>
                                                    <option value="">-- Pilih Kaisha --</option>
                                                    {uniqueKaishaForKumiai.map((p, i) => <option key={i} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={styles.lb}>Siswa (Belum Dimasukkan)</label>
                                                <select style={{...styles.inpSm, cursor: 'pointer'}} value={formAddStudent.student_id} onChange={(e) => setFormAddStudent({...formAddStudent, student_id: e.target.value})} disabled={!formAddStudent.kaisha || availableStudentsForKaisha.length === 0}>
                                                    <option value="">-- Pilih Siswa --</option>
                                                    {availableStudentsForKaisha.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap}</option>)}
                                                </select>
                                            </div>
                                            <button type="button" onClick={handleAddStudentToDraft} disabled={!formAddStudent.student_id} style={{ padding: '10px 15px', background: formAddStudent.student_id ? '#10b981' : '#e2e8f0', color: formAddStudent.student_id ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: formAddStudent.student_id ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                Tambahkan ke Nota <ArrowDownCircle size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* TABEL DRAFT INVOICE */}
                                {invoiceDraft.length > 0 && (
                                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                                <tr>
                                                    <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: 800 }}>Nama Siswa / Item</th>
                                                    <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: 800, width: '180px' }}>Keterangan Teks</th>
                                                    <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: 800, width: '130px' }}>Nominal (¥)</th>
                                                    <th style={{ padding: '10px 15px', textAlign: 'left', color: '#475569', fontWeight: 800, width: '160px' }}>Satuan (Qty & Unit)</th>
                                                    <th style={{ padding: '10px 15px', textAlign: 'right', color: '#475569', fontWeight: 800 }}>Subtotal</th>
                                                    <th style={{ padding: '10px 15px', textAlign: 'center', color: '#475569', fontWeight: 800, width: '50px' }}>Hapus</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(
                                                    invoiceDraft.reduce((acc, item) => {
                                                        if (!acc[item.perusahaan]) acc[item.perusahaan] = [];
                                                        acc[item.perusahaan].push(item);
                                                        return acc;
                                                    }, {})
                                                ).map(([perusahaan, students]) => (
                                                    <React.Fragment key={perusahaan}>
                                                        <tr style={{ background: perusahaan === 'TUNGGAKAN SEBELUMNYA' ? '#fffbeb' : '#e2e8f0' }}>
                                                            <td colSpan="6" style={{ padding: '8px 10px', fontWeight: 900, color: perusahaan === 'TUNGGAKAN SEBELUMNYA' ? '#b45309' : '#1e293b' }}>
                                                                {perusahaan === 'TUNGGAKAN SEBELUMNYA' ? <AlertOctagon size={14} style={{display:'inline', marginBottom:'-2px'}}/> : '🏢'} {perusahaan}
                                                            </td>
                                                        </tr>
                                                        {students.map((item, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '10px 15px' }}>
                                                                    <div style={{ fontWeight: 800, color: item.student_id === 'OUTSTANDING' ? '#ef4444' : '#334155' }}>
                                                                        {item.student_id === 'OUTSTANDING' ? item.nama_lengkap : (
                                                                            <input type="text" style={{border:'none', background:'transparent', outline:'none', fontWeight: 800, color: '#1e293b', width: '100%'}} value={item.nama_lengkap} onChange={(e) => updateDraftItem(item.student_id, 'nama_lengkap', e.target.value)} />
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Entri: {item.no_entri || item.tanggal_entri || '-'}</div>
                                                                </td>
                                                                <td style={{ padding: '10px 15px' }}>
                                                                    {item.student_id === 'OUTSTANDING' ? <span style={{fontSize:'0.75rem', color:'#ef4444', fontWeight:800}}>{item.ket_durasi}</span> : (
                                                                        <input type="text" style={{ ...styles.inpSm, padding: '6px 8px', fontSize: '0.75rem' }} value={item.ket_durasi} onChange={(e) => updateDraftItem(item.student_id, 'ket_durasi', e.target.value)} />
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '10px 15px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <span style={{ fontWeight: 800, color: '#94a3b8' }}>¥</span>
                                                                        <input type="number" style={{ ...styles.inpSm, padding: '6px 8px', width: '100%' }} value={item.nominal} onChange={(e) => updateDraftItem(item.student_id, 'nominal', e.target.value)} />
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '10px 15px' }}>
                                                                    {item.student_id === 'OUTSTANDING' ? <div style={{textAlign:'center', fontWeight:700, color:'#64748b'}}>-</div> : (
                                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                                            <input type="number" min="1" style={{ ...styles.inpSm, padding: '6px', width: '50px', textAlign: 'center' }} value={item.kuantitas} onChange={(e) => updateDraftItem(item.student_id, 'kuantitas', e.target.value)} />
                                                                            <select style={{ ...styles.inpSm, padding: '6px', cursor: 'pointer', flex: 1 }} value={item.satuan} onChange={(e) => updateDraftItem(item.student_id, 'satuan', e.target.value)}>
                                                                                {SATUAN_WAKTU.map(s => <option key={s} value={s}>{s}</option>)}
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '10px 15px', textAlign: 'right', fontWeight: 900, color: brandNavy }}>
                                                                    ¥ {(item.nominal * item.kuantitas).toLocaleString()}
                                                                </td>
                                                                <td style={{ padding: '10px 15px', textAlign: 'center' }}>
                                                                    {item.student_id !== 'OUTSTANDING' && (
                                                                        <button type="button" onClick={() => removeDraftItem(item.student_id)} style={styles.btnDel}>
                                                                            <Trash2 size={14}/>
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* KOTAK 3: TOTAL & SIMPAN */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '15px 25px', borderTop: '1px solid #e2e8f0', marginTop: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL TAGIHAN YEN</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: brandNavy, lineHeight: '1.2' }}>
                                        ¥ {Math.round(invoiceDraft.reduce((sum, item) => sum + (item.nominal * item.kuantitas), 0) * 1.11).toLocaleString()}
                                    </div>
                                </div>
                                <button type="button" onClick={handleSaveInvoice} disabled={isSubmitting || invoiceDraft.length === 0} style={{...styles.btnPrimary, opacity: (isSubmitting || invoiceDraft.length===0) ? 0.6 : 1}}>
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <><Save size={20}/> {activeInvoiceId ? 'Update & Cetak Ulang Nota' : 'Simpan & Cetak Nota Baru'}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL VIEW INVOICE */}
                {viewInvoice && (
                    <div style={styles.modalOverlay}>
                        <div style={{...styles.modalContent, width: '800px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: '30px'}}>
                            <div style={styles.modalHeader}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: brandNavy }}>Rincian Tagihan & Prediksi</h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>No: {viewInvoice.invoice_no}</p>
                                </div>
                                <button onClick={() => setViewInvoice(null)} style={styles.closeBtn}><X size={20} color="#64748b" /></button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Klien (Kumiai)</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{viewInvoice.kumiai_name}</div>
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 800, background: viewInvoice.status === 'PAID' ? '#dcfce7' : viewInvoice.status === 'MERGED' ? '#f3f4f6' : '#fef2f2', color: viewInvoice.status === 'PAID' ? '#166534' : viewInvoice.status === 'MERGED' ? '#475569' : '#ef4444' }}>STATUS: {viewInvoice.status}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ec4899' }}>Total: ¥{Number(viewInvoice.total_amount).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Periode Saat Ini</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', marginBottom: '10px' }}>{viewInvoice.billing_period}</div>
                                </div>
                            </div>

                            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Siswa (Batch/Entri)</th>
                                            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Durasi Tagihan</th>
                                            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Nominal</th>
                                            <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Qty (Satuan)</th>
                                            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1', fontWeight: 800, color: '#475569' }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(
                                            (viewInvoice.detail_tagihan || []).reduce((acc, item) => {
                                                if (!acc[item.perusahaan]) acc[item.perusahaan] = [];
                                                acc[item.perusahaan].push(item);
                                                return acc;
                                            }, {})
                                        ).map(([perusahaan, students]) => (
                                            <React.Fragment key={perusahaan}>
                                                <tr style={{ background: perusahaan === 'TUNGGAKAN SEBELUMNYA' ? '#fffbeb' : '#e2e8f0' }}>
                                                    <td colSpan="5" style={{ padding: '8px 10px', fontWeight: 900, color: perusahaan === 'TUNGGAKAN SEBELUMNYA' ? '#b45309' : '#1e293b' }}>
                                                        {perusahaan === 'TUNGGAKAN SEBELUMNYA' ? <AlertOctagon size={14} style={{display:'inline', marginBottom:'-2px'}}/> : '🏢'} {perusahaan}
                                                    </td>
                                                </tr>
                                                {students.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '10px', paddingLeft: '25px' }}>
                                                            <div style={{ fontWeight: 800, color: item.student_id === 'OUTSTANDING' ? '#ef4444' : '#334155' }}>{item.nama_lengkap}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Entri: {item.no_entri || item.tanggal_entri || '-'}</div>
                                                        </td>
                                                        <td style={{ padding: '10px' }}>
                                                            <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: item.student_id === 'OUTSTANDING' ? '#fee2e2' : '#dbeafe', color: item.student_id === 'OUTSTANDING' ? '#ef4444' : '#1e40af', fontWeight: 800, borderRadius: '4px' }}>{item.ket_durasi || '-'}</span>
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'right' }}>¥{Number(item.nominal).toLocaleString()}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.kuantitas} {item.satuan}</td>
                                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: item.student_id === 'OUTSTANDING' ? '#ef4444' : brandNavy }}>¥{(item.nominal * item.kuantitas).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}