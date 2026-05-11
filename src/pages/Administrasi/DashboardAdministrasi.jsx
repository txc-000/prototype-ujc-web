import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Wallet, Building2, Search, Loader2, UserCircle, Plus, X, Award, 
    Receipt, AlertOctagon, PlaneTakeoff, ShieldAlert, ArrowDownCircle, 
    ArrowUpCircle, FileText, CheckCircle2, Clock, XCircle, BellRing, Layers,
    Filter, CalendarDays, BookOpen, SearchIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    // State B2C Payment
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [payForm, setPayForm] = useState({ kategori: '', nominal: '', metode_pembayaran: 'TRANSFER', keterangan: '' });

    // State Invoice B2B
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({ kumiai: '', periodeMulai: '', periodeSelesai: '', opsi_pembayaran: 'SESUAI_PERJANJIAN' });
    const [invoiceDraft, setInvoiceDraft] = useState([]); 
    const [unpaidInvoices, setUnpaidInvoices] = useState([]); // LOGIKA BARU MERGER TUNGGAKAN
    const [filterPerusahaan, setFilterPerusahaan] = useState('');
    const [filterSiswa, setFilterSiswa] = useState('');
    
    // State Modal Predictive Billing
    const [viewInvoice, setViewInvoice] = useState(null);

    // State Buku Kas
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);
    const [cashForm, setCashForm] = useState({ tipe: 'KELUAR', kategori: 'Operasional', keterangan: '', nominal: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State Filter Dashboard Hirarki
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
                .select('id, nik, nama_lengkap, tahap_sekarang, total_bayar, status_pembayaran, telepon, program')
                .neq('tahap_sekarang', 'SIAP BERANGKAT')
                .order('created_at', { ascending: false });
            
            const { data: payData } = await supabase.from('student_payments').select('id, student_id, nominal, tanggal_bayar, created_at, metode_pembayaran');
            
            const combinedData = (stdData || []).map(std => {
                const totalTerbayar = payData?.filter(p => p.student_id === std.id).reduce((sum, p) => sum + Number(p.nominal), 0) || 0;
                const targetTagihan = std.total_bayar > 0 ? std.total_bayar : 38000000;
                const sisaTagihan = targetTagihan - totalTerbayar;
                return { ...std, total_bayar: targetTagihan, total_terbayar: totalTerbayar, sisa_tagihan: sisaTagihan > 0 ? sisaTagihan : 0 };
            });
            setStudents(combinedData);

            const { data: alumData } = await supabase.from('students')
                .select('id, nama_lengkap, perusahaan_tujuan, status_alumni, updated_at, tanggal_entri, program, data_otit')
                .eq('tahap_sekarang', 'SIAP BERANGKAT')
                .order('nama_lengkap', { ascending: true });
            
            const { data: jobOrdersData } = await supabase.from('job_orders').select('kumiai, perusahaan');
            const companyMap = {};
            if (jobOrdersData) {
                jobOrdersData.forEach(job => {
                    if (job.perusahaan && job.kumiai) {
                        companyMap[job.perusahaan.toLowerCase().trim()] = job.kumiai;
                    }
                });
            }

            const mappedAlumni = (alumData || []).map(s => {
                const pt = s.perusahaan_tujuan ? s.perusahaan_tujuan.trim() : '';
                const inferredKumiai = pt ? companyMap[pt.toLowerCase()] : null;
                return { ...s, kumiai_inferred: inferredKumiai };
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

    const calculateNextBilling = (periodStr) => {
        if (!periodStr) return '-';
        try {
            const parts = periodStr.split(' - ');
            if (parts.length === 2) {
                const endDateStr = parts[1].trim(); 
                const months = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 };
                const dateParts = endDateStr.split(' ');
                
                if (dateParts.length === 3) {
                    const d = parseInt(dateParts[0]);
                    const m = months[dateParts[1]];
                    const y = parseInt(dateParts[2]);
                    
                    const nextDate = new Date(y, m, d);
                    nextDate.setDate(nextDate.getDate() + 1);
                    return nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                }
                return `1 Hari setelah ${endDateStr}`;
            }
            return "Bulan berikutnya";
        } catch { return "-"; }
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
            
            const { data } = await supabase.from('student_payments').select('*').eq('student_id', selectedStudent.id).order('tanggal_bayar', { ascending: false });
            setPayments(data || []);
            
            fetchData(); 
            setPayForm({ kategori: '', nominal: '', metode_pembayaran: 'TRANSFER', keterangan: '' });
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const generateWaterfallBreakdown = () => {
        return PAYMENT_STAGES.map(stage => {
            const paidHere = payments.filter(p => p.keterangan && p.keterangan.includes(stage.label)).reduce((sum, p) => sum + Number(p.nominal), 0);
            return { ...stage, paidHere, sisa: (stage.amount - paidHere) > 0 ? (stage.amount - paidHere) : 0 };
        });
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

    const updateStatusAlumni = async (id, nama, newStatus) => {
        if(!window.confirm(`Ubah status ${nama} menjadi ${newStatus}?`)) return;
        try { await supabase.from('students').update({ status_alumni: newStatus, updated_at: new Date() }).eq('id', id); fetchData(); } catch (err) { alert(err.message); }
    };

    // ── FUNGSI TARIK DATA SISWA & DETEKSI TUNGGAKAN KUMIAI SEBELUMNYA ──
    const handleSelectKumiaiForInvoice = async (kumiaiName) => {
        setInvoiceForm(prev => ({ ...prev, kumiai: kumiaiName }));
        setFilterPerusahaan('');
        setFilterSiswa('');
        if (!kumiaiName) { setInvoiceDraft([]); setUnpaidInvoices([]); return; }
        
        setIsLoading(true);
        try {
            // 1. CARI INVOICE UNPAID BULAN SEBELUMNYA UNTUK DI MERGER
            const { data: unpaidData } = await supabase.from('invoices')
                .select('*')
                .eq('kumiai_name', kumiaiName)
                .eq('status', 'UNPAID');
            setUnpaidInvoices(unpaidData || []);

            // 2. CARI SISWA AKTIF DI KUMIAI INI (Siswa Lama & Baru Otomatis Bergabung)
            const { data: jobOrders } = await supabase.from('job_orders').select('perusahaan').ilike('kumiai', `%${kumiaiName}%`);
            const companies = jobOrders ? jobOrders.map(j => j.perusahaan?.toLowerCase().trim()).filter(Boolean) : [];

            if (companies.length === 0) { setInvoiceDraft([]); return; }

            const { data: rawStudents } = await supabase.from('students')
                .select('id, nama_lengkap, perusahaan_tujuan, status_alumni, tanggal_entri, program, data_otit')
                .eq('tahap_sekarang', 'SIAP BERANGKAT');
            
            const activeAlumni = (rawStudents || []).filter(s => {
                const isAktif = !s.status_alumni || s.status_alumni === 'AKTIF';
                const matchCompany = s.perusahaan_tujuan && companies.includes(s.perusahaan_tujuan.toLowerCase().trim());
                return isAktif && matchCompany;
            });

            const draft = activeAlumni.map(s => {
                const entri = s.tanggal_entri ? new Date(s.tanggal_entri) : new Date();
                const now = new Date();
                const bulanBerjalan = (now.getFullYear() - entri.getFullYear()) * 12 + (now.getMonth() - entri.getMonth()) + 1;
                const bulanAktual = bulanBerjalan > 0 ? bulanBerjalan : 1;

                const otit = typeof s.data_otit === 'string' ? JSON.parse(s.data_otit || '{}') : (s.data_otit || {});
                const prog = s.program || otit.program_jepang || '';
                const isTG = prog.toLowerCase().includes('tokutei ginou') || prog.toLowerCase().includes('tg');
                const maxBulan = isTG ? 60 : 36;
                const stringBulan = bulanAktual > maxBulan ? `Overdue (${bulanAktual})` : `${bulanAktual} / ${maxBulan}`;

                return {
                    student_id: s.id,
                    nama_lengkap: s.nama_lengkap,
                    perusahaan: s.perusahaan_tujuan.trim(),
                    no_entri: s.tanggal_entri ? new Date(s.tanggal_entri).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
                    foto: null,
                    nominal: 5000, 
                    kuantitas: 1,
                    satuan: 'Bulan',
                    ket_durasi: `Bulan ke-${stringBulan}`
                };
            }).sort((a, b) => a.perusahaan.localeCompare(b.perusahaan));
            
            setInvoiceDraft(draft);
        } catch (err) { console.error("Selection Error:", err.message); } finally { setIsLoading(false); }
    };

    const filteredDraft = invoiceDraft.filter(item => {
        const matchPerusahaan = filterPerusahaan ? item.perusahaan === filterPerusahaan : true;
        const matchSiswa = filterSiswa ? item.student_id === filterSiswa : true;
        return matchPerusahaan && matchSiswa;
    });

    const uniquePerusahaan = [...new Set(invoiceDraft.map(item => item.perusahaan))];
    const availableSiswa = invoiceDraft.filter(item => filterPerusahaan ? item.perusahaan === filterPerusahaan : true);

    const handlePerusahaanChange = (val) => {
        setFilterPerusahaan(val);
        setFilterSiswa(''); 
    };

    const updateDraftItem = (studentId, field, value) => {
        setInvoiceDraft(prev => prev.map(item => 
            item.student_id === studentId ? { ...item, [field]: field === 'satuan' ? value : Number(value) } : item
        ));
    };

    const removeDraftItem = (studentId) => {
        setInvoiceDraft(prev => prev.filter(item => item.student_id !== studentId));
    };

    // ── EKSEKUSI PEMBUATAN INVOICE DAN MERGER TUNGGAKAN ──
    const handleGenerateInvoiceKumiai = async (e) => {
        e.preventDefault();
        if (filteredDraft.length === 0) return alert("Tidak ada rincian siswa untuk ditagihkan pada filter ini.");
        if (!invoiceForm.periodeMulai || !invoiceForm.periodeSelesai) return alert("Harap isi Tanggal Mulai dan Tanggal Akhir Periode Tagihan.");

        setIsSubmitting(true);
        try {
            // Kalkulasi Bulan Ini
            const subtotalBulanIni = filteredDraft.reduce((sum, item) => sum + (item.nominal * item.kuantitas), 0);
            const ppnBulanIni = Math.round(subtotalBulanIni * 0.11); 
            
            // Kalkulasi Tunggakan Lama
            const totalTunggakan = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
            
            // Grand Total (Bulan Ini + PPN Bulan Ini + Total Tagihan Lama)
            const grandTotal = subtotalBulanIni + ppnBulanIni + totalTunggakan;
            
            const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const finalPeriod = `${formatTgl(invoiceForm.periodeMulai)} - ${formatTgl(invoiceForm.periodeSelesai)}`;

            // Buat Payload Array Detail Tagihan (Masukan Tunggakan sebagai 1 baris item jika ada)
            const finalDetailTagihan = [...filteredDraft];
            if (totalTunggakan > 0) {
                finalDetailTagihan.push({
                    student_id: 'OUTSTANDING',
                    nama_lengkap: 'AKUMULASI TAGIHAN BULAN LALU (BELUM LUNAS)',
                    perusahaan: 'TUNGGAKAN SEBELUMNYA',
                    no_entri: '-',
                    nominal: totalTunggakan,
                    kuantitas: 1,
                    satuan: 'Lumpsum',
                    ket_durasi: 'Merger'
                });
            }

            const invNo = `UJC-INV/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`;
            const payload = {
                invoice_no: invNo,
                kumiai_name: invoiceForm.kumiai,
                subtotal: subtotalBulanIni, // Subtotal asli bulan ini
                tax_amount: ppnBulanIni, // PPN asli bulan ini
                total_amount: grandTotal, // Tagihan utuh yang harus dibayar Kumiai
                billing_period: finalPeriod,
                status: 'UNPAID',
                opsi_pembayaran: invoiceForm.opsi_pembayaran,
                detail_tagihan: finalDetailTagihan
            };

            // 1. Simpan Invoice Baru
            await supabase.from('invoices').insert([payload]);

            // 2. Ubah Status Invoice Lama menjadi MERGED agar tidak menumpuk di tagihan prioritas
            if (unpaidInvoices.length > 0) {
                const oldIds = unpaidInvoices.map(inv => inv.id);
                await supabase.from('invoices').update({ status: 'MERGED' }).in('id', oldIds);
            }

            alert(totalTunggakan > 0 
                ? `Berhasil! Tagihan bulan ini dan Tunggakan ¥${totalTunggakan.toLocaleString()} telah dilebur menjadi 1 Invoice baru.` 
                : `Invoice baru berhasil dibuat! Subtotal: ¥${subtotalBulanIni.toLocaleString()}`
            );

            setIsInvoiceModalOpen(false); 
            setInvoiceForm({ kumiai: '', periodeMulai: '', periodeSelesai: '', opsi_pembayaran: 'SESUAI_PERJANJIAN' }); 
            setInvoiceDraft([]);
            setUnpaidInvoices([]);
            setFilterPerusahaan('');
            setFilterSiswa('');
            fetchData();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const updateInvoiceStatus = async (inv) => {
        if(!window.confirm(`Tandai Invoice ${inv.invoice_no} (${inv.kumiai_name}) sebagai LUNAS?\nSistem akan mencatat ¥${inv.total_amount} ke dalam Buku Kas (Uang Masuk).`)) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('invoices').update({ status: 'PAID' }).eq('id', inv.id);
            await supabase.from('cash_transactions').insert([{ tipe: 'MASUK', kategori: 'Pembayaran Kumiai', keterangan: `Pelunasan Invoice ${inv.invoice_no} dari ${inv.kumiai_name}`, nominal: inv.total_amount, created_by: user?.id }]);
            fetchData();
            if(viewInvoice && viewInvoice.id === inv.id) {
                setViewInvoice({...viewInvoice, status: 'PAID'});
            }
        } catch (err) { alert(err.message); }
    };

    const handleKirimReminderWA = (inv) => {
        const text = `いつもお世話になっております。${inv.kumiai_name} 様。
こちらはLPK UNIVERSAL JAPAN COURSEの財務部です。

未払いの請求書についてリマインドさせていただきます。

- 請求書番号 (No Invoice): ${inv.invoice_no}
- お支払い条件 (Opsi Bayar): ${inv.opsi_pembayaran?.replace(/_/g, ' ') || 'Sesuai Perjanjian'}
- ご請求金額 (Total Tagihan): ¥${Number(inv.total_amount).toLocaleString()}

お支払いの状況をご確認いただけますと幸いです。よろしくお願いいたします。`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Div. Administrasi</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Keuangan & Audit LPK</p>
                </div>
                
                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                    <button onClick={() => setActiveTab('DASHBOARD')} style={activeTab === 'DASHBOARD' ? activeMenuS : inactiveMenuS}><Layers size={18} /> Dashboard</button>
                    <button onClick={() => setActiveTab('PRIORITAS')} style={activeTab === 'PRIORITAS' ? activeMenuS : inactiveMenuS}><AlertOctagon size={18} /> Prioritas & Bermasalah</button>
                    
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', paddingLeft: '5px', marginTop: '15px', marginBottom: '5px' }}>TAGIHAN LOKAL (RP)</div>
                    <button onClick={() => setActiveTab('TAGIHAN_SISWA')} style={activeTab === 'TAGIHAN_SISWA' ? activeMenuS : inactiveMenuS}><Wallet size={18} /> Tagihan Siswa</button>

                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', paddingLeft: '5px', marginTop: '15px', marginBottom: '5px' }}>TAGIHAN JEPANG (YEN)</div>
                    <button onClick={() => setActiveTab('ALUMNI_TRACKING')} style={activeTab === 'ALUMNI_TRACKING' ? activeMenuS : inactiveMenuS}><PlaneTakeoff size={18} /> Tracker Alumni (Freeze)</button>
                    <button onClick={() => setActiveTab('INVOICE_KUMIAI')} style={activeTab === 'INVOICE_KUMIAI' ? activeMenuS : inactiveMenuS}><Building2 size={18} /> Invoice Kumiai B2B</button>

                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', paddingLeft: '5px', marginTop: '15px', marginBottom: '5px' }}>AUDIT & PEMBUKUAN</div>
                    <button onClick={() => setActiveTab('BUKU_KAS')} style={activeTab === 'BUKU_KAS' ? activeMenuS : inactiveMenuS}><Receipt size={18} /> Buku Kas & Arus Kas</button>
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
                            {activeTab === 'INVOICE_KUMIAI' && 'Invoice Kumiai Jepang (B2B)'}
                            {activeTab === 'BUKU_KAS' && 'Buku Kas & Detail Arus Uang'}
                        </h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Sistem ERP Terpadu Keuangan Universal Japan Course.</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {['TAGIHAN_SISWA', 'ALUMNI_TRACKING', 'INVOICE_KUMIAI', 'BUKU_KAS'].includes(activeTab) && (
                            <div style={{ position: 'relative' }}>
                                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                                <input type="text" placeholder="Cari Data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }} />
                            </div>
                        )}
                        {activeTab === 'INVOICE_KUMIAI' && <button onClick={() => setIsInvoiceModalOpen(true)} style={btnPrimary}><Plus size={18}/> Buat Invoice Kumiai</button>}
                        {activeTab === 'BUKU_KAS' && <button onClick={() => setIsCashModalOpen(true)} style={btnPrimary}><Plus size={18}/> Catat Transaksi Manual</button>}
                    </div>
                </header>

                {showPriorityBanner && !isLoading && activeTab !== 'DASHBOARD' && (
                    <div style={{ background: urgentInvoices.length > 0 ? '#fff1f2' : '#fffbeb', border: `1px solid ${urgentInvoices.length > 0 ? '#fecdd3' : '#fde68a'}`, padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', alignItems: 'flex-start', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                        <div style={{ background: urgentInvoices.length > 0 ? '#ffe4e6' : '#fef3c7', padding: '12px', borderRadius: '50%' }}>
                            <BellRing size={28} color={urgentInvoices.length > 0 ? '#e11d48' : '#d97706'} />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', color: urgentInvoices.length > 0 ? '#be123c' : '#b45309', fontSize: '1.1rem', fontWeight: 900 }}>🚨 PENGINGAT SISTEM: PRIORITAS PENAGIHAN HARI INI</h3>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: urgentInvoices.length > 0 ? '#9f1239' : '#92400e', fontSize: '0.9rem', fontWeight: 700, lineHeight: '1.6' }}>
                                {urgentInvoices.length > 0 && <li>Segera tagih <b>{urgentInvoices.length} Invoice Kumiai</b> yang belum lunas (Total Tertunggak: <b>¥ {totalKerugianYen.toLocaleString()}</b>).</li>}
                                {tunggakanBesarSiswa.length > 0 && <li>Terdapat <b>{tunggakanBesarSiswa.length} Siswa Lokal</b> dengan tunggakan &gt; Rp 20 Juta.</li>}
                                {problematicAlumni.length > 0 && <li>Ada <b>{problematicAlumni.length} Alumni Kabur/Sakit</b>, tagihan sudah di-freeze otomatis.</li>}
                                {unconfirmedAlumni.length > 0 && <li>Terdapat <b>{unconfirmedAlumni.length} Alumni BUTUH KONFIRMASI (Ghosting)</b>, pastikan status kontraknya di Jepang.</li>}
                            </ul>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    
                    {activeTab === 'DASHBOARD' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '1.1rem' }}>Peta Persebaran Alumni & Tagihan</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Data digenerate otomatis berdasarkan relasi Kumiai, Perusahaan, dan Tanggal Entri master.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div>
                                        <label style={{...labelS, display: 'flex', alignItems: 'center', gap: '5px'}}><BookOpen size={14}/> Program</label>
                                        <select style={{...selectS, padding: '8px 30px 8px 12px', backgroundPosition: 'right 10px center'}} value={dashFilterProgram} onChange={(e) => setDashFilterProgram(e.target.value)}>
                                            <option value="">Semua Program</option>
                                            {uniqueDashProgram.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{...labelS, display: 'flex', alignItems: 'center', gap: '5px'}}><Filter size={14}/> Perusahaan</label>
                                        <select style={{...selectS, padding: '8px 30px 8px 12px', backgroundPosition: 'right 10px center'}} value={dashFilterPerusahaan} onChange={(e) => setDashFilterPerusahaan(e.target.value)}>
                                            <option value="">Semua Perusahaan</option>
                                            {uniqueDashPerusahaan.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            {Object.entries(
                                filteredAlumniDash.reduce((acc, s) => {
                                    const kumiai = s.kumiai_inferred || 'TANPA KUMIAI (TIDAK TERIDENTIFIKASI)';
                                    const kaisha = s.perusahaan_tujuan || 'TANPA PERUSAHAAN';
                                    
                                    if (!acc[kumiai]) acc[kumiai] = {};
                                    if (!acc[kumiai][kaisha]) acc[kumiai][kaisha] = [];
                                    acc[kumiai][kaisha].push(s);
                                    return acc;
                                }, {})
                            ).sort(([a], [b]) => a.localeCompare(b)).map(([kumiaiName, kaishas]) => (
                                <div key={kumiaiName} style={{ background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{ padding: '15px 20px', background: brandNavy, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🇯🇵 {kumiaiName}</div>
                                        <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>{Object.keys(kaishas).length} Perusahaan</div>
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        {Object.entries(kaishas).sort(([a], [b]) => a.localeCompare(b)).map(([kaishaName, siswas]) => (
                                            <div key={kaishaName} style={{ marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                <div style={{ padding: '12px 15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>🏢 {kaishaName}</span>
                                                    <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontWeight: 800 }}>{siswas.length} Siswa Aktif</span>
                                                </div>
                                                <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', background: 'white' }}>
                                                    {siswas.sort((a,b) => a.nama_lengkap.localeCompare(b.nama_lengkap)).map(s => (
                                                        <div key={s.id} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <UserCircle size={28} color="#94a3b8"/>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase' }}>{s.nama_lengkap}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>Status: AKTIF</div>
                                                                </div>
                                                                <div style={{ marginLeft: 'auto' }}>
                                                                    <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontWeight: 800 }}>{s.program || 'Reguler'}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <PlaneTakeoff size={12}/> <b>Tgl Entri:</b> {formatTanggal(s.tanggal_entri)}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <CalendarDays size={12}/> <b>Periode:</b> {getPeriodeString(s.tanggal_entri)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'PRIORITAS' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '20px' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertOctagon size={20}/> INVOICE KUMIAI BELUM DIBAYAR ({urgentInvoices.length})</h3>
                                {urgentInvoices.length === 0 ? <p style={{margin:0, color:'#92400e'}}>Semua invoice sudah dilunasi Kumiai.</p> : (
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {urgentInvoices.map(inv => (
                                            <div key={inv.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div><div style={{fontWeight: 800, color: '#1e293b'}}>{inv.kumiai_name}</div><div style={{fontSize: '0.8rem', color: '#64748b'}}>Invoice: {inv.invoice_no} | Periode: {inv.billing_period}</div></div>
                                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                                    <div style={{fontWeight: 900, color: '#ef4444', fontSize: '1.2rem'}}>¥ {Number(inv.total_amount).toLocaleString()}</div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => updateInvoiceStatus(inv)} style={{...btnA('#10b981'), padding:'4px 10px', fontSize:'0.75rem'}}>Lunas</button>
                                                        <button onClick={() => handleKirimReminderWA(inv)} style={{...btnA('#16a34a'), padding:'4px 10px', fontSize:'0.75rem', background: '#dcfce7'}}>Kirim WA</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '20px' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20}/> ALUMNI BERMASALAH & GHOSTING</h3>
                                {problematicAlumni.length === 0 && unconfirmedAlumni.length === 0 ? <p style={{margin:0, color:'#7f1d1d'}}>Tidak ada catatan alumni bermasalah.</p> : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                                        {[...problematicAlumni, ...unconfirmedAlumni].map(alum => (
                                            <div key={alum.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${alum.status_alumni === 'BUTUH KONFIRMASI' ? '#eab308' : '#ef4444'}` }}>
                                                <div style={{fontWeight: 800, color: '#1e293b'}}>{alum.nama_lengkap}</div>
                                                <div style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '5px'}}>Kumiai: {alum.perusahaan_tujuan}</div>
                                                <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: alum.status_alumni === 'BUTUH KONFIRMASI' ? '#fef08a' : '#fee2e2', color: alum.status_alumni === 'BUTUH KONFIRMASI' ? '#854d0e' : '#991b1b', fontWeight: 800, borderRadius: '4px' }}>Status: {alum.status_alumni}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'BUKU_KAS' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #10b981' }}>
                                    <div style={{fontSize: '0.8rem', fontWeight: 800, color: '#64748b'}}>TOTAL MASUK & MENGGANTUNG</div>
                                    <div style={{fontSize: '1.8rem', fontWeight: 900, color: '#10b981'}}>Rp {totalMasuk.toLocaleString()}</div>
                                </div>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #ef4444' }}>
                                    <div style={{fontSize: '0.8rem', fontWeight: 800, color: '#64748b'}}>TOTAL UANG KELUAR</div>
                                    <div style={{fontSize: '1.8rem', fontWeight: 900, color: '#ef4444'}}>Rp {totalKeluar.toLocaleString()}</div>
                                </div>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: `5px solid ${brandNavy}` }}>
                                    <div style={{fontSize: '0.8rem', fontWeight: 800, color: '#64748b'}}>SALDO KAS SAAT INI</div>
                                    <div style={{fontSize: '1.8rem', fontWeight: 900, color: brandNavy}}>Rp {saldoAkhir.toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <tr><th style={thS}>Tgl & Tipe</th><th style={thS}>Kategori & Keterangan</th><th style={thS}>Nominal</th></tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={tdS}>
                                                    <div style={{fontWeight:800}}>{new Date(t.tanggal).toLocaleDateString('id-ID')}</div>
                                                    <div style={{ fontSize:'0.75rem', fontWeight:800, color: t.tipe==='KELUAR' ? '#ef4444' : t.tipe==='DANA_MENGGANTUNG' ? '#eab308' : '#10b981', display:'flex', alignItems:'center', gap:'4px' }}>
                                                        {t.tipe==='MASUK' ? <ArrowDownCircle size={14}/> : <ArrowUpCircle size={14}/>} {t.tipe.replace('_', ' ')}
                                                    </div>
                                                </td>
                                                <td style={tdS}>
                                                    <div style={{fontWeight:800, color: '#1e293b'}}>{t.kategori}</div>
                                                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>{t.keterangan}</div>
                                                </td>
                                                <td style={{...tdS, fontWeight: 900, fontSize: '1.1rem', color: t.tipe==='KELUAR' ? '#ef4444' : t.tipe==='DANA_MENGGANTUNG' ? '#eab308' : '#10b981'}}>
                                                    {t.tipe==='KELUAR' ? '-' : '+'} {Number(t.nominal).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'TAGIHAN_SISWA' && (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr><th style={thS}>Siswa (Pra-Terbang)</th><th style={thS}>Sisa (Tunggakan)</th><th style={{...thS, textAlign: 'center'}}>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {students.filter(s => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdS}><div style={{fontWeight:800}}>{s.nama_lengkap}</div><div style={badgeS}>{s.status_pembayaran || 'BELUM LUNAS'}</div></td>
                                            <td style={{...tdS, color: s.sisa_tagihan > 0 ? '#ef4444' : '#64748b', fontWeight: 800}}>Rp {s.sisa_tagihan.toLocaleString('id-ID')}</td>
                                            <td style={{...tdS, textAlign: 'center'}}><button onClick={() => openPaymentModal(s)} style={{...btnA('#3b82f6'), margin: '0 auto'}}><Receipt size={18}/> Detail & Bayar</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'ALUMNI_TRACKING' && (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thS}>Nama Alumni</th>
                                        <th style={thS}>Tgl Entri (Ke Jepang)</th>
                                        <th style={thS}>Status Penagihan</th>
                                        <th style={{...thS, textAlign: 'center'}}>Aksi Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alumniData.filter(a => a.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdS}>
                                                <div style={{fontWeight:800, color: '#1e293b'}}>{s.nama_lengkap}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#ec4899' }}>🏢 {s.perusahaan_tujuan || '-'}</div>
                                            </td>
                                            <td style={tdS}>
                                                <div style={{ fontWeight: 800, color: '#334155' }}>
                                                    {s.tanggal_entri ? formatTanggal(s.tanggal_entri) : <span style={{ color: '#ef4444' }}>Belum Diset</span>}
                                                </div>
                                            </td>
                                            <td style={tdS}>
                                                <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: s.status_alumni === 'BUTUH KONFIRMASI' ? '#fef08a' : s.status_alumni === 'AKTIF' ? '#dcfce7' : '#fee2e2', color: s.status_alumni === 'BUTUH KONFIRMASI' ? '#854d0e' : s.status_alumni === 'AKTIF' ? '#166534' : '#991b1b' }}>
                                                    {s.status_alumni || 'AKTIF'} {s.status_alumni !== 'AKTIF' && s.status_alumni !== 'BUTUH KONFIRMASI' && '(FREEZE)'}
                                                </span>
                                            </td>
                                            <td style={{...tdS, textAlign: 'center'}}>
                                                <select style={{...selectS, padding: '6px 30px 6px 12px', fontSize: '0.8rem', backgroundPosition: 'right 8px center', backgroundSize: '14px', width: 'auto', margin: '0 auto', display: 'block'}} value={s.status_alumni || 'AKTIF'} onChange={(e) => updateStatusAlumni(s.id, s.nama_lengkap, e.target.value)}>
                                                    <option value="AKTIF">AKTIF (Ditagih)</option>
                                                    <option value="BUTUH KONFIRMASI">BUTUH KONFIRMASI (Ghosting/Freeze)</option>
                                                    <option value="KABUR">KABUR (Freeze)</option>
                                                    <option value="SAKIT">SAKIT (Freeze)</option>
                                                    <option value="SELESAI_KONTRAK">SELESAI KONTRAK (Freeze)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'INVOICE_KUMIAI' && (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr><th style={thS}>No. Invoice</th><th style={thS}>Kumiai / Termin</th><th style={thS}>Total (Yen)</th><th style={{...thS, textAlign: 'center'}}>Opsi Cetak & Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {invoices.filter(i => i.kumiai_name.toLowerCase().includes(searchTerm.toLowerCase())).map(inv => (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdS}><div style={{fontWeight:800}}>{inv.invoice_no}</div><div style={{fontSize:'0.75rem', color:'#64748b'}}>{inv.billing_period}</div></td>
                                            <td style={tdS}><div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{inv.kumiai_name}</div><div style={{fontSize:'0.75rem', color:'#8b5cf6'}}>{inv.opsi_pembayaran?.replace(/_/g, ' ')}</div></td>
                                            <td style={tdS}><div style={{ fontWeight: 900, color: '#ec4899', fontSize: '1.2rem' }}>¥ {Number(inv.total_amount).toLocaleString()}</div></td>
                                            <td style={{...tdS, textAlign: 'center'}}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {inv.status !== 'PAID' ? <button onClick={() => updateInvoiceStatus(inv)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Lunas?</button> : <span style={{ fontSize: '0.7rem', padding: '6px 10px', borderRadius: '6px', fontWeight: 800, background: '#dcfce7', color: '#166534' }}>PAID</span>}
                                                    
                                                    <button onClick={() => setViewInvoice(inv)} style={{ padding: '6px 12px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}><SearchIcon size={14}/> Rincian</button>
                                                    
                                                    <button onClick={() => window.open(`/print-invoice-detail/${inv.id}`, '_blank')} style={{ padding: '6px 12px', background: brandNavy, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={14}/> Detail</button>
                                                    <button onClick={() => window.open(`/print-invoice-summary/${inv.id}`, '_blank')} style={{ padding: '6px 12px', background: '#eab308', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={14}/> Kwitansi</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {isCashModalOpen && (
                    <div style={modalOverlay}>
                        <form onSubmit={handleCashSubmit} style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Catat Transaksi Kas</h3>
                                <button type="button" onClick={() => setIsCashModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div><label style={labelS}>Tipe Transaksi</label><select required style={selectS} value={cashForm.tipe} onChange={(e) => setCashForm({...cashForm, tipe: e.target.value})}><option value="KELUAR">Uang Keluar</option><option value="MASUK">Uang Masuk</option><option value="DANA_MENGGANTUNG">Dana Menggantung (Tak Bertuan)</option></select></div>
                                <div><label style={labelS}>Kategori</label><input required style={inputS} value={cashForm.kategori} onChange={(e) => setCashForm({...cashForm, kategori: e.target.value})} placeholder="Cth: Operasional, Gaji, dll" /></div>
                            </div>
                            <div style={{ marginBottom: '15px' }}><label style={labelS}>Keterangan Detail</label><textarea required rows="2" style={{...inputS, resize: 'vertical'}} value={cashForm.keterangan} onChange={(e) => setCashForm({...cashForm, keterangan: e.target.value})} placeholder="Rincian transaksi..."></textarea></div>
                            <div style={{ marginBottom: '25px' }}><label style={labelS}>Nominal (Rp/Yen)</label><input required type="number" style={{...inputS, fontSize: '1.2rem', fontWeight: 800, color: cashForm.tipe === 'KELUAR' ? '#ef4444' : cashForm.tipe === 'DANA_MENGGANTUNG' ? '#eab308' : '#10b981'}} value={cashForm.nominal} onChange={(e) => setCashForm({...cashForm, nominal: e.target.value})} /></div>
                            <button type="submit" disabled={isSubmitting} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}</button>
                        </form>
                    </div>
                )}

                {isPayModalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={{...modalContent, width: '900px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div><h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: brandNavy }}>Detail & Pembayaran Tagihan</h3><p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>{selectedStudent.nama_lengkap}</p></div>
                                <button onClick={() => setIsPayModalOpen(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', overflowY: 'auto', paddingRight: '5px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>RINCIAN KEKURANGAN (ALOKASI)</span><span style={{ color: '#10b981' }}>Total Masuk: Rp {selectedStudent.total_terbayar.toLocaleString('id-ID')}</span>
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {generateWaterfallBreakdown().map((stage, idx) => (
                                            <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${stage.sisa === 0 ? '#10b981' : stage.sisa < stage.amount ? '#f59e0b' : '#e2e8f0'}`, background: stage.sisa === 0 ? '#ecfdf5' : stage.sisa < stage.amount ? '#fffbeb' : '#f8fafc' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{stage.label}</span>
                                                    {stage.sisa === 0 ? <CheckCircle2 size={18} color="#10b981"/> : stage.sisa < stage.amount ? <Clock size={18} color="#f59e0b"/> : <XCircle size={18} color="#94a3b8"/>}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                                                    <span>Target: Rp {stage.amount.toLocaleString()}</span><span>Terbayar: <b style={{color: '#10b981'}}>Rp {stage.paidHere.toLocaleString()}</b></span>
                                                </div>
                                                {stage.sisa > 0 && <div style={{ marginTop: '6px', fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>Kekurangan: Rp {stage.sisa.toLocaleString()}</div>}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '20px', padding: '15px', background: '#fef2f2', borderRadius: '8px', border: '1px dashed #fca5a5' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991b1b' }}>TOTAL SISA KESELURUHAN</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>Rp {selectedStudent.sisa_tagihan.toLocaleString('id-ID')}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <form onSubmit={handlePaymentSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '15px' }}>CATAT PEMBAYARAN BARU</h4>
                                        <div style={{ marginBottom: '15px' }}><label style={labelS}>Pilih Kategori</label>
                                            <select required style={selectS} value={payForm.kategori} onChange={handleKategoriChange}>
                                                <option value="">-- Pilih Tahap / Cicilan --</option>
                                                {PAYMENT_STAGES.map(stage => <option key={stage.id} value={stage.id}>{stage.label} (Rp {stage.amount.toLocaleString()})</option>)}
                                                <option value="LAINNYA">Lainnya / Tagihan Khusus</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '15px' }}><label style={labelS}>Nominal Uang Diterima (Rp)</label><input type="number" required max={selectedStudent.sisa_tagihan} style={{...inputS, fontSize: '1.2rem', fontWeight: 800, color: brandNavy}} value={payForm.nominal} onChange={(e) => setPayForm({...payForm, nominal: e.target.value})} /></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
                                            <div><label style={labelS}>Metode</label><select style={selectS} value={payForm.metode_pembayaran} onChange={(e) => setPayForm({...payForm, metode_pembayaran: e.target.value})}><option value="TRANSFER">Transfer Bank</option><option value="CASH">CASH (Tunai)</option></select></div>
                                            <div><label style={labelS}>Catatan (Opsional)</label><input style={inputS} value={payForm.keterangan} onChange={(e) => setPayForm({...payForm, keterangan: e.target.value})} /></div>
                                        </div>
                                        <button type="submit" disabled={isSubmitting || selectedStudent.sisa_tagihan === 0} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: selectedStudent.sisa_tagihan === 0 ? 'not-allowed' : 'pointer' }}>{isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Simpan Pembayaran'}</button>
                                    </form>

                                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '15px' }}>RIWAYAT PEMBAYARAN</h4>
                                        {payments.length === 0 ? (
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>Belum ada riwayat pembayaran.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                                {payments.map(p => (
                                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 900, color: brandNavy, fontSize: '1rem' }}>Rp {Number(p.nominal).toLocaleString('id-ID')}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{new Date(p.tanggal_bayar || p.created_at).toLocaleDateString('id-ID')} • {p.metode_pembayaran}</div>
                                                        </div>
                                                        <button onClick={() => window.open(`/print-kwitansi-siswa/${p.id}`, '_blank')} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: '0.2s' }}>
                                                            Cetak Kwitansi
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isInvoiceModalOpen && (
                    <div style={modalOverlay}>
                        <form onSubmit={handleGenerateInvoiceKumiai} style={{...modalContent, width: '1000px', maxWidth: '95vw'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div><h3 style={{ margin: 0, fontWeight: 900 }}>Invoice Builder B2B</h3><p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Sistem otomatis menyaring alumni aktif dan mencegah duplikasi tagihan.</p></div>
                                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>
                            
                            {/* PANEL PERINGATAN TUNGGAKAN */}
                            {unpaidInvoices.length > 0 && (
                                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <AlertOctagon color="#b45309" size={24} />
                                    <div>
                                        <div style={{ fontWeight: 900, color: '#92400e', fontSize: '0.9rem' }}>DITEMUKAN TUNGGAKAN KUMIAI (AUTO-MERGER)</div>
                                        <div style={{ fontSize: '0.8rem', color: '#b45309' }}>Terdapat tagihan lama yang belum lunas sebesar <b>¥ {unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0).toLocaleString()}</b>. Tunggakan ini akan otomatis dimasukkan ke dalam invoice baru sebagai satu kesatuan.</div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={labelS}>1. Pilih Kumiai Klien</label>
                                    <select required style={selectS} value={invoiceForm.kumiai} onChange={(e) => handleSelectKumiaiForInvoice(e.target.value)}>
                                        <option value="">-- Pilih Kumiai --</option>
                                        {masterKumiai.map((k, i) => {
                                            const namaKumiai = k.nama_kumiai || k.kumiai || k.nama || k.name || k.nama_perusahaan || Object.values(k).find(val => typeof val === 'string' && isNaN(val)) || `Kumiai (${k.id})`;
                                            return <option key={i} value={namaKumiai}>{namaKumiai}</option>;
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelS}>2. Filter Perusahaan</label>
                                    <select style={selectS} value={filterPerusahaan} onChange={(e) => handlePerusahaanChange(e.target.value)} disabled={invoiceDraft.length === 0}>
                                        <option value="">-- Semua Perusahaan --</option>
                                        {uniquePerusahaan.map((p, i) => <option key={i} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelS}>3. Filter Siswa (Abaikan jika menagih semua)</label>
                                    <select style={selectS} value={filterSiswa} onChange={(e) => setFilterSiswa(e.target.value)} disabled={availableSiswa.length === 0}>
                                        <option value="">-- Semua Siswa --</option>
                                        {availableSiswa.map((s, i) => <option key={i} value={s.student_id}>{s.nama_lengkap}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div><label style={labelS}>Tanggal Mulai Periode</label><input required type="date" style={inputS} value={invoiceForm.periodeMulai} onChange={(e) => setInvoiceForm({...invoiceForm, periodeMulai: e.target.value})} /></div>
                                <div><label style={labelS}>Tanggal Akhir Periode</label><input required type="date" style={inputS} value={invoiceForm.periodeSelesai} onChange={(e) => setInvoiceForm({...invoiceForm, periodeSelesai: e.target.value})} /></div>
                                <div>
                                    <label style={labelS}>Opsi Termin Pembayaran</label>
                                    <select required style={selectS} value={invoiceForm.opsi_pembayaran} onChange={(e) => setInvoiceForm({...invoiceForm, opsi_pembayaran: e.target.value})}>
                                        {OPSI_PEMBAYARAN.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {filteredDraft.length > 0 && (
                                <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '20px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                                            <tr>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Siswa & Tgl Entri</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', width: '130px' }}>Durasi Bulan</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', width: '120px' }}>Nominal (¥)</th>
                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1', width: '70px' }}>Qty</th>
                                                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Subtotal</th>
                                                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1', width: '50px' }}>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(
                                                filteredDraft.reduce((acc, item) => {
                                                    if (!acc[item.perusahaan]) acc[item.perusahaan] = [];
                                                    acc[item.perusahaan].push(item);
                                                    return acc;
                                                }, {})
                                            ).map(([perusahaan, students]) => (
                                                <React.Fragment key={perusahaan}>
                                                    <tr style={{ background: '#e2e8f0' }}>
                                                        <td colSpan="6" style={{ padding: '8px 10px', fontWeight: 900, color: '#1e293b' }}>🏢 {perusahaan}</td>
                                                    </tr>
                                                    {students.map((item) => (
                                                        <tr key={item.student_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '10px', paddingLeft: '25px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 800, color: '#334155' }}>{item.nama_lengkap}</div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Entri: {item.no_entri}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '10px' }}>
                                                                <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#dcfce7', color: '#166534', fontWeight: 800, borderRadius: '6px' }}>{item.ket_durasi}</span>
                                                            </td>
                                                            <td style={{ padding: '10px' }}><input type="number" style={{ ...inputS, padding: '6px' }} value={item.nominal} onChange={(e) => updateDraftItem(item.student_id, 'nominal', e.target.value)} /></td>
                                                            <td style={{ padding: '10px' }}><input type="number" style={{ ...inputS, padding: '6px' }} value={item.kuantitas} onChange={(e) => updateDraftItem(item.student_id, 'kuantitas', e.target.value)} /></td>
                                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: brandNavy }}>¥ {(item.nominal * item.kuantitas).toLocaleString()}</td>
                                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                <button type="button" onClick={() => removeDraftItem(item.student_id)} style={{ padding: '4px 8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                                                    <X size={14}/>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                            
                                            {/* RENDER TUNGGAKAN JIKA ADA */}
                                            {unpaidInvoices.length > 0 && (
                                                <tr style={{ background: '#fffbeb', borderTop: '2px dashed #fcd34d' }}>
                                                    <td colSpan="4" style={{ padding: '12px 10px', fontWeight: 900, color: '#b45309' }}>
                                                        <AlertOctagon size={14} style={{display:'inline', marginBottom:'-2px'}}/> AKUMULASI TUNGGAKAN SEBELUMNYA
                                                    </td>
                                                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 900, color: '#ef4444' }}>
                                                        ¥ {unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0).toLocaleString()}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>TOTAL SUBTOTAL (YEN)</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#334155' }}>¥ {filteredDraft.reduce((sum, item) => sum + (item.nominal * item.kuantitas), 0).toLocaleString()}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', marginTop: '5px' }}>+ PPN 11%: ¥ {Math.round(filteredDraft.reduce((sum, item) => sum + (item.nominal * item.kuantitas), 0) * 0.11).toLocaleString()}</div>
                                    {unpaidInvoices.length > 0 && <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>+ Tunggakan: ¥ {unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0).toLocaleString()}</div>}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: brandNavy, textAlign: 'right' }}>GRAND TOTAL TAGIHAN</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: brandNavy }}>
                                        ¥ {(
                                            filteredDraft.reduce((sum, item) => sum + (item.nominal * item.kuantitas), 0) + 
                                            Math.round(filteredDraft.reduce((sum, item) => sum + (item.nominal * item.kuantitas), 0) * 0.11) +
                                            unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
                                        ).toLocaleString()}
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting || filteredDraft.length === 0} style={{ padding: '12px 24px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: filteredDraft.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : 'Generate & Simpan Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {viewInvoice && (
                    <div style={modalOverlay}>
                        <div style={{...modalContent, width: '800px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: brandNavy }}>Rincian Tagihan & Prediksi</h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>No: {viewInvoice.invoice_no}</p>
                                </div>
                                <button onClick={() => setViewInvoice(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X /></button>
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
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Periode Tagihan Saat Ini</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', marginBottom: '10px' }}>{viewInvoice.billing_period}</div>
                                    
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', borderTop: '1px dashed #fcd34d', paddingTop: '10px' }}>Jadwal Tagihan Berikutnya</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <CalendarDays size={16}/> {calculateNextBilling(viewInvoice.billing_period)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Siswa (Batch/Entri)</th>
                                            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Durasi Bulan</th>
                                            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Nominal</th>
                                            <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Qty (Satuan)</th>
                                            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Subtotal</th>
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

const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 800, fontSize: '0.95rem' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem' };
const thS = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdS = { padding: '15px 20px', fontSize: '0.9rem' };
const btnA = (c) => ({ background: 'white', border: `1px solid ${c}40`, color: c, padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 });
const btnPrimary = { padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const labelS = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' };
const inputS = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#ffffff', color: '#1e293b', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'border-color 0.2s, box-shadow 0.2s' };
const selectS = { 
    ...inputS, 
    appearance: 'none', 
    WebkitAppearance: 'none', 
    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`, 
    backgroundRepeat: 'no-repeat', 
    backgroundPosition: 'right 12px center', 
    backgroundSize: '16px', 
    paddingRight: '40px', 
    cursor: 'pointer' 
};
const badgeS = { fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, display: 'inline-block', background: '#e0e7ff', color: '#3730a3' };