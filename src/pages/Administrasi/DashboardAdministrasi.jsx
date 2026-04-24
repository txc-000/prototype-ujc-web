import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Wallet, Building2, Search, Loader2, UserCircle, Plus, X, Award, 
    Receipt, AlertOctagon, PlaneTakeoff, ShieldAlert, ArrowDownCircle, 
    ArrowUpCircle, FileText, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

// ── KONSTANTA BIAYA STANDAR ──
const PAYMENT_STAGES = [
    { id: 'TAHAP_2', label: 'MCU Awal', amount: 600000, isCicilan: false },
    { id: 'TAHAP_3', label: 'Pendidikan Reguler', amount: 5000000, isCicilan: true },
    { id: 'TAHAP_4', label: 'General MCU (Pasca Match)', amount: 1400000, isCicilan: false },
    { id: 'TAHAP_5', label: 'Pendidikan Diklat', amount: 33000000, isCicilan: true },
    { id: 'TAHAP_6', label: 'MCU Pra-Terbang', amount: 650000, isCicilan: false }
];

export default function DashboardAdministrasi() {
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('PRIORITAS'); // PRIORITAS, TAGIHAN_SISWA, ALUMNI_TRACKING, INVOICE_KUMIAI, BUKU_KAS
    
    const [students, setStudents] = useState([]);
    const [alumniData, setAlumniData] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [masterKumiai, setMasterKumiai] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    // MODAL STATE
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [payForm, setPayForm] = useState({ kategori: '', nominal: '', metode_pembayaran: 'TRANSFER', keterangan: '' });

    // STATE INVOICE B2B (DIUBAH KE AUTO PERIODE)
    const currentYm = new Date().toISOString().slice(0, 7);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({ kumiai: '', startMonth: currentYm, duration: '1', nominal: 5000 });
    
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);
    const [cashForm, setCashForm] = useState({ tipe: 'KELUAR', kategori: 'Operasional', keterangan: '', nominal: '' });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // HELPER: Kalkulator String Periode Otomatis
    const hitungPeriode = (ym, dur) => {
        if (!ym) return '';
        const d = parseInt(dur);
        const date = new Date(ym + '-01');
        const bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        
        const startS = `${bln[date.getMonth()]} ${date.getFullYear()}`;
        if (d === 1) return startS; // Jika cuma 1 bulan
        
        const endDate = new Date(date);
        endDate.setMonth(endDate.getMonth() + d - 1);
        const endS = `${bln[endDate.getMonth()]} ${endDate.getFullYear()}`;
        
        // Cek jika menyeberang tahun
        if (date.getFullYear() === endDate.getFullYear()) return `${bln[date.getMonth()]} - ${endS}`;
        return `${startS} - ${endS}`;
    };

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
            const { data: stdData } = await supabase.from('students').select('id, nik, nama_lengkap, tahap_sekarang, total_bayar, status_pembayaran, telepon').neq('tahap_sekarang', 'SIAP BERANGKAT').order('created_at', { ascending: false });
            const { data: payData } = await supabase.from('student_payments').select('student_id, nominal');
            
            const combinedData = stdData?.map(std => {
                const totalTerbayar = payData?.filter(p => p.student_id === std.id).reduce((sum, p) => sum + Number(p.nominal), 0) || 0;
                const targetTagihan = std.total_bayar > 0 ? std.total_bayar : 40650000;
                const sisaTagihan = targetTagihan - totalTerbayar;
                return { ...std, total_bayar: targetTagihan, total_terbayar: totalTerbayar, sisa_tagihan: sisaTagihan > 0 ? sisaTagihan : 0 };
            }) || [];
            setStudents(combinedData);

            const { data: alumData } = await supabase.from('students').select('id, nama_lengkap, perusahaan_tujuan, status_alumni, updated_at').eq('tahap_sekarang', 'SIAP BERANGKAT').order('nama_lengkap', { ascending: true });
            setAlumniData(alumData || []);

            const { data: invData } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
            setInvoices(invData || []);

            const { data: cashData } = await supabase.from('cash_transactions').select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false });
            setTransactions(cashData || []);

            const { data: kumiaiData } = await supabase.from('master_kumiai').select('*');
            setMasterKumiai(kumiaiData || []);

        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    // ── LOGIKA PEMBAYARAN & WATERFALL KATEGORI PINTAR ──
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

            const { error } = await supabase.from('student_payments').insert([{ student_id: selectedStudent.id, nominal: nominalNum, metode_pembayaran: payForm.metode_pembayaran, keterangan: finalKet, created_by: user?.id }]);
            if (error) throw error;

            await supabase.from('cash_transactions').insert([{ tipe: 'MASUK', kategori: 'Pembayaran Siswa', keterangan: `Pemb. ${selectedStudent.nama_lengkap} - ${finalKet}`, nominal: nominalNum, created_by: user?.id }]);

            if ((selectedStudent.sisa_tagihan - nominalNum) <= 0) {
                await supabase.from('students').update({ status_pembayaran: 'LUNAS' }).eq('id', selectedStudent.id);
            }
            
            alert("Pembayaran berhasil dicatat & masuk ke Buku Kas!");
            setIsPayModalOpen(false);
            fetchData(); 
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const generateWaterfallBreakdown = () => {
        return PAYMENT_STAGES.map(stage => {
            const paidHere = payments
                .filter(p => p.keterangan && p.keterangan.includes(stage.label))
                .reduce((sum, p) => sum + Number(p.nominal), 0);
            
            const sisa = stage.amount - paidHere;
            return { 
                ...stage, 
                paidHere, 
                sisa: sisa > 0 ? sisa : 0 
            };
        });
    };

    // ── LOGIKA INVOICE KUMIAI & BUKU KAS ──
    const updateStatusAlumni = async (id, nama, newStatus) => {
        if(!window.confirm(`Ubah status ${nama} menjadi ${newStatus}? \n\nSiswa KABUR / SAKIT akan masuk daftar BERMASALAH dan di-freeze tagihannya.`)) return;
        try { await supabase.from('students').update({ status_alumni: newStatus, updated_at: new Date() }).eq('id', id); fetchData(); } catch (err) { alert(err.message); }
    };

    const handleGenerateInvoiceKumiai = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // 1. Tarik semua siswa SIAP BERANGKAT (tanpa filter status & nama di query DB agar tidak kena bug NULL)
            const { data: rawStudents, error } = await supabase
                .from('students')
                .select('id, status_alumni, perusahaan_tujuan')
                .eq('tahap_sekarang', 'SIAP BERANGKAT');

            if (error) throw error;

            // 2. FILTER MANUAL DI FRONTEND (Failsafe Mutlak)
            const aktifStudents = (rawStudents || []).filter(s => {
                // Anggap null/kosong sebagai 'AKTIF'
                const isAktif = !s.status_alumni || s.status_alumni === 'AKTIF';
                // Pengecekan nama kumiai / perusahaan anti case-sensitive
                const matchKumiai = s.perusahaan_tujuan && s.perusahaan_tujuan.toLowerCase().includes(invoiceForm.kumiai.toLowerCase());
                
                return isAktif && matchKumiai;
            });

            const jumlahAktif = aktifStudents.length;

            if (jumlahAktif === 0) { 
                alert(`Tidak ada siswa AKTIF di Kumiai ${invoiceForm.kumiai}.`); 
                setIsSubmitting(false); 
                return; 
            }

            const totalTagihan = jumlahAktif * Number(invoiceForm.nominal);
            const invNo = `UJC-INV/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`;
            const finalPeriode = hitungPeriode(invoiceForm.startMonth, invoiceForm.duration);

            await supabase.from('invoices').insert([{ 
                invoice_no: invNo, 
                kumiai_name: invoiceForm.kumiai, 
                total_amount: totalTagihan, 
                billing_period: finalPeriode, 
                status: 'UNPAID' 
            }]);

            alert(`Invoice Jepang terbuat untuk ${jumlahAktif} siswa. Total: ¥${totalTagihan.toLocaleString()}`);
            setIsInvoiceModalOpen(false); 
            setInvoiceForm(prev => ({...prev, kumiai: ''})); 
            fetchData();
        } catch (err) { 
            alert(err.message); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const updateInvoiceStatus = async (inv) => {
        if(!window.confirm(`Tandai Invoice ${inv.invoice_no} (${inv.kumiai_name}) sebagai LUNAS?\nSistem akan mencatat ¥${inv.total_amount} ke dalam Buku Kas (Uang Masuk).`)) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('invoices').update({ status: 'PAID' }).eq('id', inv.id);
            await supabase.from('cash_transactions').insert([{ tipe: 'MASUK', kategori: 'Pembayaran Kumiai', keterangan: `Pelunasan Invoice ${inv.invoice_no} dari ${inv.kumiai_name}`, nominal: inv.total_amount, created_by: user?.id }]);
            fetchData();
        } catch (err) { alert(err.message); }
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

    // ── FILTER DATA ──
    const urgentInvoices = invoices.filter(i => i.status === 'UNPAID');
    const problematicAlumni = alumniData.filter(a => ['KABUR', 'SAKIT'].includes(a.status_alumni));
    const tunggakanBesarSiswa = students.filter(s => s.sisa_tagihan > 20000000);

    const totalMasuk = transactions.filter(t => t.tipe === 'MASUK').reduce((sum, t) => sum + Number(t.nominal), 0);
    const totalKeluar = transactions.filter(t => t.tipe === 'KELUAR').reduce((sum, t) => sum + Number(t.nominal), 0);
    const saldoAkhir = totalMasuk - totalKeluar;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Div. Administrasi</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Keuangan & Audit LPK</p>
                </div>
                
                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
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
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>
                            {activeTab === 'PRIORITAS' && 'Radar Prioritas & Entitas Bermasalah'}
                            {activeTab === 'TAGIHAN_SISWA' && 'Manajemen Tagihan Siswa'}
                            {activeTab === 'ALUMNI_TRACKING' && 'Tracking Status Alumni'}
                            {activeTab === 'INVOICE_KUMIAI' && 'Invoice Kumiai Jepang (B2B)'}
                            {activeTab === 'BUKU_KAS' && 'Buku Kas & Detail Arus Uang'}
                        </h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
                            {activeTab === 'PRIORITAS' && 'Tindak lanjuti segera tunggakan besar, invoice belum dibayar, dan siswa kabur.'}
                            {activeTab === 'BUKU_KAS' && 'Pantau setiap pemasukan dan pengeluaran secara mendetail untuk audit.'}
                        </p>
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

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    
                    {/* TAB: PRIORITAS */}
                    {activeTab === 'PRIORITAS' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '20px' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertOctagon size={20}/> INVOICE KUMIAI BELUM DIBAYAR ({urgentInvoices.length})</h3>
                                {urgentInvoices.length === 0 ? <p style={{margin:0, color:'#92400e'}}>Semua invoice sudah dilunasi Kumiai.</p> : (
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {urgentInvoices.map(inv => (
                                            <div key={inv.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div><div style={{fontWeight: 800, color: '#1e293b'}}>{inv.kumiai_name}</div><div style={{fontSize: '0.8rem', color: '#64748b'}}>Invoice: {inv.invoice_no} | Periode: {inv.billing_period}</div></div>
                                                <div style={{ textAlign: 'right' }}><div style={{fontWeight: 900, color: '#ef4444', fontSize: '1.2rem'}}>¥ {Number(inv.total_amount).toLocaleString()}</div><button onClick={() => updateInvoiceStatus(inv)} style={{...btnA('#10b981'), marginTop:'5px', padding:'4px 10px', fontSize:'0.75rem'}}>Tandai Lunas</button></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '20px' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20}/> ALUMNI BERMASALAH DI JEPANG ({problematicAlumni.length})</h3>
                                {problematicAlumni.length === 0 ? <p style={{margin:0, color:'#7f1d1d'}}>Tidak ada catatan alumni bermasalah.</p> : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                                        {problematicAlumni.map(alum => (
                                            <div key={alum.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                                                <div style={{fontWeight: 800, color: '#1e293b'}}>{alum.nama_lengkap}</div>
                                                <div style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '5px'}}>Kumiai: {alum.perusahaan_tujuan}</div>
                                                <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#fee2e2', color: '#991b1b', fontWeight: 800, borderRadius: '4px' }}>Status: {alum.status_alumni}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={20}/> TUNGGAKAN SISWA LOKAL &gt; Rp 20 Juta ({tunggakanBesarSiswa.length})</h3>
                                {tunggakanBesarSiswa.length === 0 ? <p style={{margin:0, color:'#64748b'}}>Tunggakan siswa terpantau aman.</p> : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead style={{ background: '#f8fafc' }}><tr><th style={thS}>Siswa</th><th style={thS}>Tahap Saat Ini</th><th style={thS}>Sisa Tagihan</th></tr></thead>
                                        <tbody>
                                            {tunggakanBesarSiswa.map(s => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={tdS}><b>{s.nama_lengkap}</b></td>
                                                    <td style={tdS}>{s.tahap_sekarang}</td>
                                                    <td style={{...tdS, color: '#ef4444', fontWeight: 800}}>Rp {s.sisa_tagihan.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: BUKU KAS */}
                    {activeTab === 'BUKU_KAS' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #10b981' }}>
                                    <div style={{fontSize: '0.8rem', fontWeight: 800, color: '#64748b'}}>TOTAL UANG MASUK</div>
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
                                        <tr>
                                            <th style={thS}>Tgl & Tipe</th>
                                            <th style={thS}>Kategori & Keterangan</th>
                                            <th style={thS}>Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={tdS}>
                                                    <div style={{fontWeight:800}}>{new Date(t.tanggal).toLocaleDateString('id-ID')}</div>
                                                    <div style={{ fontSize:'0.75rem', fontWeight:800, color: t.tipe==='MASUK' ? '#10b981' : '#ef4444', display:'flex', alignItems:'center', gap:'4px' }}>
                                                        {t.tipe==='MASUK' ? <ArrowDownCircle size={14}/> : <ArrowUpCircle size={14}/>} {t.tipe}
                                                    </div>
                                                </td>
                                                <td style={tdS}>
                                                    <div style={{fontWeight:800, color: '#1e293b'}}>{t.kategori}</div>
                                                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>{t.keterangan}</div>
                                                </td>
                                                <td style={{...tdS, fontWeight: 900, fontSize: '1.1rem', color: t.tipe==='MASUK' ? '#10b981' : '#ef4444'}}>
                                                    {t.tipe==='MASUK' ? '+' : '-'} {Number(t.nominal).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: TAGIHAN SISWA */}
                    {activeTab === 'TAGIHAN_SISWA' && (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thS}>Siswa (Pra-Terbang)</th>
                                        <th style={thS}>Sisa (Tunggakan)</th>
                                        <th style={{...thS, textAlign: 'center'}}>Aksi</th>
                                    </tr>
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

                    {/* TAB: ALUMNI TRACKING */}
                    {activeTab === 'ALUMNI_TRACKING' && (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thS}>Nama Alumni</th>
                                        <th style={thS}>Status Penagihan</th>
                                        <th style={{...thS, textAlign: 'center'}}>Ubah Status Sistem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alumniData.filter(a => a.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdS}><div style={{fontWeight:800, color: '#1e293b'}}>{s.nama_lengkap}</div><div style={{ fontSize: '0.85rem', color: '#ec4899' }}>🏢 {s.perusahaan_tujuan || '-'}</div></td>
                                            <td style={tdS}><div style={{...badgeS, background: s.status_alumni === 'AKTIF' ? '#dcfce7' : '#fee2e2', color: s.status_alumni === 'AKTIF' ? '#166534' : '#991b1b'}}>{s.status_alumni || 'AKTIF'}</div></td>
                                            <td style={{...tdS, textAlign: 'center'}}>
                                                <select style={inputS} value={s.status_alumni || 'AKTIF'} onChange={(e) => updateStatusAlumni(s.id, s.nama_lengkap, e.target.value)}>
                                                    <option value="AKTIF">Masih AKTIF</option><option value="KABUR">Siswa KABUR (Freeze)</option><option value="SAKIT">Siswa SAKIT (Freeze)</option><option value="SELESAI_KONTRAK">SELESAI KONTRAK (Freeze)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TAB: INVOICE KUMIAI */}
                    {activeTab === 'INVOICE_KUMIAI' && (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thS}>No. Invoice</th>
                                        <th style={thS}>Kumiai / Client</th>
                                        <th style={thS}>Total Tagihan (Yen)</th>
                                        <th style={{...thS, textAlign: 'center'}}>Aksi / Download PDF (JP)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.filter(i => i.kumiai_name.toLowerCase().includes(searchTerm.toLowerCase())).map(inv => (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdS}><div style={{fontWeight:800}}>{inv.invoice_no}</div><div style={{fontSize:'0.75rem', color:'#64748b'}}>Dibuat: {new Date(inv.created_at).toLocaleDateString('id-ID')}</div></td>
                                            <td style={tdS}><div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{inv.kumiai_name}</div></td>
                                            <td style={tdS}><div style={{ fontWeight: 900, color: '#ec4899', fontSize: '1.2rem' }}>¥ {Number(inv.total_amount).toLocaleString()}</div></td>
                                            <td style={{...tdS, textAlign: 'center'}}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.7rem', padding: '6px 10px', borderRadius: '6px', fontWeight: 800, background: inv.status === 'PAID' ? '#dcfce7' : '#fee2e2', color: inv.status === 'PAID' ? '#166534' : '#991b1b' }}>{inv.status}</span>
                                                    {inv.status !== 'PAID' && <button onClick={() => updateInvoiceStatus(inv)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Lunas?</button>}
                                                    <button onClick={() => window.open(`/print-invoice-kumiai/${inv.id}`, '_blank')} style={{ padding: '6px 12px', background: brandNavy, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <FileText size={14}/> Download 請求書 (JP)
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL TRANSAKSI KAS */}
                {isCashModalOpen && (
                    <div style={modalOverlay}>
                        <form onSubmit={handleCashSubmit} style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Catat Transaksi Kas</h3>
                                <button type="button" onClick={() => setIsCashModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div><label style={labelS}>Tipe Transaksi</label><select required style={inputS} value={cashForm.tipe} onChange={(e) => setCashForm({...cashForm, tipe: e.target.value})}><option value="KELUAR">Uang Keluar (Pengeluaran)</option><option value="MASUK">Uang Masuk (Pemasukan)</option></select></div>
                                <div><label style={labelS}>Kategori</label><input required style={inputS} value={cashForm.kategori} onChange={(e) => setCashForm({...cashForm, kategori: e.target.value})} placeholder="Cth: Operasional, Gaji, dll" /></div>
                            </div>
                            <div style={{ marginBottom: '15px' }}><label style={labelS}>Keterangan Detail</label><textarea required rows="2" style={{...inputS, resize: 'vertical'}} value={cashForm.keterangan} onChange={(e) => setCashForm({...cashForm, keterangan: e.target.value})} placeholder="Rincian transaksi..."></textarea></div>
                            <div style={{ marginBottom: '25px' }}><label style={labelS}>Nominal (Rp/Yen)</label><input required type="number" style={{...inputS, fontSize: '1.2rem', fontWeight: 800, color: cashForm.tipe === 'KELUAR' ? '#ef4444' : '#10b981'}} value={cashForm.nominal} onChange={(e) => setCashForm({...cashForm, nominal: e.target.value})} /></div>
                            <button type="submit" disabled={isSubmitting} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}</button>
                        </form>
                    </div>
                )}

                {/* MODAL PEMBAYARAN SISWA & WATERFALL BREAKDOWN */}
                {isPayModalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={{...modalContent, width: '900px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: brandNavy }}>Detail & Pembayaran Tagihan</h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>{selectedStudent.nama_lengkap} (NIK: {selectedStudent.nik})</p>
                                </div>
                                <button onClick={() => setIsPayModalOpen(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X /></button>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', overflowY: 'auto', paddingRight: '5px' }}>
                                
                                {/* KOLOM KIRI: RINCIAN KEKURANGAN (ALOKASI PINTAR) */}
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>RINCIAN KEKURANGAN (ALOKASI)</span>
                                        <span style={{ color: '#10b981' }}>Total Masuk: Rp {selectedStudent.total_terbayar.toLocaleString('id-ID')}</span>
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {generateWaterfallBreakdown().map((stage, idx) => (
                                            <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${stage.sisa === 0 ? '#10b981' : stage.sisa < stage.amount ? '#f59e0b' : '#e2e8f0'}`, background: stage.sisa === 0 ? '#ecfdf5' : stage.sisa < stage.amount ? '#fffbeb' : '#f8fafc' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{stage.label}</span>
                                                    {stage.sisa === 0 ? <CheckCircle2 size={18} color="#10b981"/> : stage.sisa < stage.amount ? <Clock size={18} color="#f59e0b"/> : <XCircle size={18} color="#94a3b8"/>}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                                                    <span>Target: Rp {stage.amount.toLocaleString()}</span>
                                                    <span>Terbayar: <b style={{color: '#10b981'}}>Rp {stage.paidHere.toLocaleString()}</b></span>
                                                </div>
                                                {stage.sisa > 0 && (
                                                    <div style={{ marginTop: '6px', fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                        Kekurangan: Rp {stage.sisa.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '20px', padding: '15px', background: '#fef2f2', borderRadius: '8px', border: '1px dashed #fca5a5' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991b1b' }}>TOTAL SISA KESELURUHAN (TUNGGAKAN)</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>Rp {selectedStudent.sisa_tagihan.toLocaleString('id-ID')}</div>
                                    </div>
                                </div>

                                {/* KOLOM KANAN: FORM INPUT & RIWAYAT */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <form onSubmit={handlePaymentSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '15px' }}>CATAT PEMBAYARAN BARU</h4>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={labelS}>Pilih Kategori</label>
                                            <select required style={inputS} value={payForm.kategori} onChange={handleKategoriChange}>
                                                <option value="">-- Pilih Tahap / Cicilan --</option>
                                                {PAYMENT_STAGES.map(stage => <option key={stage.id} value={stage.id}>{stage.label} (Rp {stage.amount.toLocaleString()})</option>)}
                                                <option value="LAINNYA">Lainnya / Tagihan Khusus</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={labelS}>Nominal Uang Diterima (Rp)</label>
                                            <input type="number" required max={selectedStudent.sisa_tagihan} style={{...inputS, fontSize: '1.2rem', fontWeight: 800, color: brandNavy}} value={payForm.nominal} onChange={(e) => setPayForm({...payForm, nominal: e.target.value})} placeholder="Contoh: 5000000" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
                                            <div><label style={labelS}>Metode</label><select style={inputS} value={payForm.metode_pembayaran} onChange={(e) => setPayForm({...payForm, metode_pembayaran: e.target.value})}><option value="TRANSFER">Transfer Bank</option><option value="CASH">CASH (Tunai)</option></select></div>
                                            <div><label style={labelS}>Catatan (Opsional)</label><input style={inputS} value={payForm.keterangan} onChange={(e) => setPayForm({...payForm, keterangan: e.target.value})} placeholder="Ex: Cicilan ke-1 Pendidikan" /></div>
                                        </div>
                                        <button type="submit" disabled={isSubmitting || selectedStudent.sisa_tagihan === 0} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: selectedStudent.sisa_tagihan === 0 ? 'not-allowed' : 'pointer' }}>
                                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Simpan Pembayaran & Cetak Kas'}
                                        </button>
                                    </form>

                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '10px' }}>Riwayat Pembayaran Siswa</h4>
                                        {payments.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>Belum ada riwayat.</p> : (
                                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {payments.map((p, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e2e8f0', fontSize: '0.8rem' }}>
                                                        <div><div style={{ fontWeight: 700, color: '#334155' }}>{new Date(p.tanggal_bayar).toLocaleDateString('id-ID')}</div><div style={{ color: '#64748b' }}>{p.keterangan || '-'}</div></div>
                                                        <div style={{ fontWeight: 800, color: '#10b981' }}>+ Rp {Number(p.nominal).toLocaleString('id-ID')}</div>
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

                {/* MODAL GENERATE INVOICE KUMIAI B2B (DENGAN AUTO PERIODE & FAILSAFE AKTIF) */}
                {isInvoiceModalOpen && (
                    <div style={modalOverlay}>
                        <form onSubmit={handleGenerateInvoiceKumiai} style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div><h3 style={{ margin: 0, fontWeight: 900 }}>Generate Tagihan Kumiai (B2B)</h3><p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Sistem otomatis mem-freeze siswa kabur/sakit.</p></div>
                                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelS}>Pilih Kumiai Klien (Jepang)</label>
                                <select required style={inputS} value={invoiceForm.kumiai} onChange={(e) => setInvoiceForm({...invoiceForm, kumiai: e.target.value})}>
                                    <option value="">-- Pilih Kumiai yang ingin ditagih --</option>
                                    {masterKumiai.map((k, i) => {
                                        const namaKumiai = k.nama_kumiai || k.kumiai || k.nama || k.name || k.nama_perusahaan || Object.values(k).find(val => typeof val === 'string' && isNaN(val)) || `Kumiai (${k.id})`;
                                        return (
                                            <option key={i} value={namaKumiai}>{namaKumiai}</option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '5px' }}>
                                <div>
                                    <label style={labelS}>Mulai Dari Bulan</label>
                                    <input required type="month" style={inputS} value={invoiceForm.startMonth} onChange={(e) => setInvoiceForm({...invoiceForm, startMonth: e.target.value})} />
                                </div>
                                <div>
                                    <label style={labelS}>Durasi Tagihan</label>
                                    <select required style={inputS} value={invoiceForm.duration} onChange={(e) => setInvoiceForm({...invoiceForm, duration: e.target.value})}>
                                        <option value="1">1 Bulan</option>
                                        <option value="2">2 Bulan</option>
                                        <option value="3">3 Bulan (Quarter)</option>
                                        <option value="6">6 Bulan (Semester)</option>
                                        <option value="12">1 Tahun</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '15px', padding: '10px 15px', background: '#eff6ff', borderRadius: '8px', border: '1px dashed #bfdbfe', color: brandNavy, fontSize: '0.85rem', fontWeight: 800 }}>
                                Preview Periode: <span style={{ fontSize: '1rem', fontWeight: 900 }}>{hitungPeriode(invoiceForm.startMonth, invoiceForm.duration)}</span>
                            </div>

                            <div style={{ marginBottom: '25px', background: '#fef2f2', padding: '15px', borderRadius: '8px', border: '1px dashed #fca5a5' }}>
                                <label style={{...labelS, color: '#991b1b'}}>Fee per Siswa AKTIF (Dalam YEN / ¥)</label>
                                <input required type="number" style={{...inputS, fontSize: '1.2rem', fontWeight: 800, color: '#991b1b', background: 'white'}} value={invoiceForm.nominal} onChange={(e) => setInvoiceForm({...invoiceForm, nominal: e.target.value})} />
                                <p style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: '8px', marginBottom: 0 }}>*Default ¥5.000 (Kanri-hi). Jika ingin membuat tagihan lain, ubah nominal di atas.</p>
                            </div>
                            <button type="submit" disabled={isSubmitting} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : 'Kalkulasi & Generate Invoice'}
                            </button>
                        </form>
                    </div>
                )}

            </main>
        </div>
    );
}

// ── STYLE OBJECTS ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 800, fontSize: '0.95rem' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem' };
const thS = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdS = { padding: '15px 20px', fontSize: '0.9rem' };
const btnA = (c) => ({ background: 'white', border: `1px solid ${c}40`, color: c, padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 });
const btnPrimary = { padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const labelS = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' };
const inputS = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#f8fafc' };
const badgeS = { fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, display: 'inline-block', background: '#e0e7ff', color: '#3730a3' };