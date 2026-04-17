import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Wallet, Building2, FileBarChart, Search, Loader2, 
    UserCircle, MessageCircle, Plus, X, Award, Receipt, AlertCircle, TrendingUp, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

// ── KONSTANTA BIAYA STANDAR LPK UJC ──
const PAYMENT_STAGES = [
    { id: 'TAHAP_2', label: 'Tahap 2: MCU Awal', amount: 600000, isCicilan: false },
    { id: 'TAHAP_3', label: 'Tahap 3: Kelas Reguler (Bisa Dicicil)', amount: 5000000, isCicilan: true },
    { id: 'TAHAP_4', label: 'Tahap 4: General MCU (Pasca Match)', amount: 1400000, isCicilan: false },
    { id: 'TAHAP_5', label: 'Tahap 5: Kelas Diklat (Bisa Dicicil)', amount: 33000000, isCicilan: true },
    { id: 'TAHAP_6', label: 'Tahap 6: MCU Pra-Keberangkatan', amount: 650000, isCicilan: false },
    { id: 'LAINNYA', label: 'Lainnya / Tagihan Khusus', amount: 0, isCicilan: true }
];

export default function DashboardAdministrasi() {
    const navigate = useNavigate();
    
    // ── STATE UTAMA ──
    const [activeTab, setActiveTab] = useState('TAGIHAN_SISWA'); 
    const [students, setStudents] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [reportData, setReportData] = useState({ currentMonthIncome: 0, totalReceivables: 0, companyIncome: 0 });
    
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [myPoints, setMyPoints] = useState(0);

    // ── STATE MODAL PEMBAYARAN SISWA ──
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [payForm, setPayForm] = useState({ kategori: '', nominal: '', metode_pembayaran: 'TRANSFER', keterangan: '' });

    // ── STATE MODAL INVOICE PERUSAHAAN ──
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({ nama_perusahaan: '', deskripsi_tagihan: '', nominal_tagihan: '', jatuh_tempo: '' });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchUserProfile(user.id);
        };
        initData();
    }, []);

    useEffect(() => {
        if (activeTab === 'TAGIHAN_SISWA') fetchStudents();
        else if (activeTab === 'TAGIHAN_PERUSAHAAN') fetchInvoices();
        else if (activeTab === 'LAPORAN') fetchReport();
    }, [activeTab]);

    const fetchUserProfile = async (userId) => {
        try {
            const { data } = await supabase.from('employees').select('nama_lengkap, id_karyawan, poin_pendaftaran, master_role(nama_role)').eq('id', userId).maybeSingle();
            if (data) { setUserProfile(data); setMyPoints(data.poin_pendaftaran || 0); }
        } catch (err) {}
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const { data: stdData, error: stdErr } = await supabase.from('students').select('id, nik, nama_lengkap, telepon, tahap_sekarang, total_bayar, status_lunas').order('created_at', { ascending: false });
            if (stdErr) throw stdErr;

            const { data: payData, error: payErr } = await supabase.from('student_payments').select('student_id, nominal');
            if (payErr) throw payErr;

            const combinedData = stdData.map(std => {
                const totalTerbayar = payData.filter(p => p.student_id === std.id).reduce((sum, p) => sum + Number(p.nominal), 0);
                // Jika total_bayar di DB 0, asumsikan total biaya standar adalah 40.650.000
                const targetTagihan = std.total_bayar > 0 ? std.total_bayar : 40650000;
                const sisaTagihan = targetTagihan - totalTerbayar;
                
                return { ...std, total_bayar: targetTagihan, total_terbayar: totalTerbayar, sisa_tagihan: sisaTagihan > 0 ? sisaTagihan : 0 };
            });
            setStudents(combinedData);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('company_invoices').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setInvoices(data || []);
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const { data: studentPay } = await supabase.from('student_payments').select('nominal').gte('tanggal_bayar', startOfMonth).lte('tanggal_bayar', endOfMonth);
            const currentMonthStudentIncome = studentPay?.reduce((sum, p) => sum + Number(p.nominal), 0) || 0;

            const { data: stdData } = await supabase.from('students').select('id, total_bayar');
            const { data: allPay } = await supabase.from('student_payments').select('student_id, nominal');
            let totalPiutang = 0;
            stdData?.forEach(std => {
                const targetTagihan = std.total_bayar > 0 ? std.total_bayar : 40650000;
                const bayar = allPay?.filter(p => p.student_id === std.id).reduce((sum, p) => sum + Number(p.nominal), 0) || 0;
                const sisa = targetTagihan - bayar;
                if (sisa > 0) totalPiutang += sisa;
            });

            const { data: compInv } = await supabase.from('company_invoices').select('nominal_terbayar');
            const compIncome = compInv?.reduce((sum, i) => sum + Number(i.nominal_terbayar), 0) || 0;

            setReportData({ currentMonthIncome: currentMonthStudentIncome, totalReceivables: totalPiutang, companyIncome: compIncome });
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    // ── HANDLER PEMBAYARAN SISWA ──
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
        
        // Auto-fill nominal jika biaya fix (bukan cicilan)
        if (stage && !stage.isCicilan) {
            setPayForm(prev => ({ ...prev, kategori: val, nominal: stage.amount }));
        } else {
            setPayForm(prev => ({ ...prev, kategori: val, nominal: '' }));
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Format deskripsi agar rapi (Contoh: "Tahap 3: Kelas Reguler - Cicilan Ke-2")
            const stageLabel = PAYMENT_STAGES.find(s => s.id === payForm.kategori)?.label || 'Pembayaran';
            const finalKeterangan = payForm.keterangan ? `${stageLabel} (${payForm.keterangan})` : stageLabel;

            const payload = { 
                student_id: selectedStudent.id, 
                nominal: Number(payForm.nominal), 
                metode_pembayaran: payForm.metode_pembayaran, 
                keterangan: finalKeterangan, 
                created_by: user?.id 
            };
            
            const { error } = await supabase.from('student_payments').insert([payload]);
            if (error) throw error;

            if ((selectedStudent.sisa_tagihan - payload.nominal) <= 0) {
                await supabase.from('students').update({ status_lunas: true }).eq('id', selectedStudent.id);
            }
            
            alert("Pembayaran berhasil dicatat!");
            setIsPayModalOpen(false);
            fetchStudents(); 
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    // ── HANDLER INVOICE PERUSAHAAN ──
    const handleInvoiceSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { nama_perusahaan: invoiceForm.nama_perusahaan, deskripsi_tagihan: invoiceForm.deskripsi_tagihan, nominal_tagihan: Number(invoiceForm.nominal_tagihan), jatuh_tempo: invoiceForm.jatuh_tempo || null };
            const { error } = await supabase.from('company_invoices').insert([payload]);
            if (error) throw error;
            
            alert("Invoice berhasil dibuat!");
            setIsInvoiceModalOpen(false);
            setInvoiceForm({ nama_perusahaan: '', deskripsi_tagihan: '', nominal_tagihan: '', jatuh_tempo: '' });
            fetchInvoices();
        } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
    };

    const handleLunasInvoice = async (id, nama) => {
        if(!window.confirm(`Tandai invoice ${nama} sebagai LUNAS?`)) return;
        try {
            const target = invoices.find(i => i.id === id);
            const { error } = await supabase.from('company_invoices').update({ status_invoice: 'PAID', nominal_terbayar: target.nominal_tagihan }).eq('id', id);
            if (error) throw error;
            fetchInvoices();
        } catch (err) { alert(err.message); }
    };

    const handleWA = (nama, telp, sisaTagihan) => {
        let msg = `Halo ${nama}, ini dari Divisi Administrasi LPK UJC. Menginformasikan bahwa sisa total tagihan pendidikan & pemberangkatan Anda saat ini adalah Rp${sisaTagihan.toLocaleString('id-ID')}. Mohon konfirmasinya.`;
        let phone = telp?.replace(/[^0-9]/g, '');
        if (phone?.startsWith('0')) phone = '62' + phone.substring(1);
        if (!phone) return alert("Nomor tidak tersedia.");
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const filteredStudents = students.filter(s => s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredInvoices = invoices.filter(i => i.nama_perusahaan.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Divisi Administrasi</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Keuangan & Pelaporan</p>
                </div>
                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#d97706' }}><Award size={20}/></div>
                    <div><div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>POIN KEAKTIFAN</div><div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{myPoints}</div></div>
                </div>
                <nav style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <button onClick={() => setActiveTab('TAGIHAN_SISWA')} style={activeTab === 'TAGIHAN_SISWA' ? activeMenuS : inactiveMenuS}><Wallet size={18} /> Tagihan Siswa</button>
                    <button onClick={() => setActiveTab('TAGIHAN_PERUSAHAAN')} style={activeTab === 'TAGIHAN_PERUSAHAAN' ? activeMenuS : inactiveMenuS}><Building2 size={18} /> Tagihan Perusahaan</button>
                    <button onClick={() => setActiveTab('LAPORAN')} style={activeTab === 'LAPORAN' ? activeMenuS : inactiveMenuS}><FileBarChart size={18} /> Laporan Bulanan</button>
                </nav>
                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ width: '100%', padding: '8px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Keluar</button>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 900 }}>
                            {activeTab === 'TAGIHAN_SISWA' ? 'Manajemen Tagihan Siswa' : activeTab === 'TAGIHAN_PERUSAHAAN' ? 'Tagihan Perusahaan (Invoice)' : 'Rekapitulasi Keuangan'}
                        </h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Total Keseluruhan Biaya Siswa UJC: Rp 40.650.000</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {activeTab !== 'LAPORAN' && (
                            <div style={{ position: 'relative' }}>
                                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '12px' }} />
                                <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }} />
                            </div>
                        )}
                        {activeTab === 'TAGIHAN_PERUSAHAAN' && (
                            <button onClick={() => setIsInvoiceModalOpen(true)} style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <Plus size={18}/> Buat Invoice
                            </button>
                        )}
                    </div>
                </header>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {activeTab === 'TAGIHAN_SISWA' && (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thS}>Data Siswa</th>
                                        <th style={thS}>Target Tagihan</th>
                                        <th style={thS}>Sudah Dibayar</th>
                                        <th style={thS}>Sisa (Tunggakan)</th>
                                        <th style={{...thS, textAlign: 'center'}}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? <tr><td colSpan="5" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" style={{margin:'0 auto'}}/></td></tr> : filteredStudents.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={tdS}><div style={{fontWeight:800}}>{s.nama_lengkap}</div><div style={{fontSize:'0.75rem', color:'#64748b'}}>{s.tahap_sekarang}</div></td>
                                            <td style={tdS}>Rp {s.total_bayar?.toLocaleString('id-ID')}</td>
                                            <td style={{...tdS, color: '#10b981', fontWeight: 800}}>Rp {s.total_terbayar.toLocaleString('id-ID')}</td>
                                            <td style={{...tdS, color: s.sisa_tagihan > 0 ? '#ef4444' : '#64748b', fontWeight: 800}}>Rp {s.sisa_tagihan.toLocaleString('id-ID')}</td>
                                            <td style={{...tdS, textAlign: 'center'}}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button onClick={() => openPaymentModal(s)} style={btnA('#3b82f6')} title="Catat Pembayaran"><Receipt size={18}/></button>
                                                    {s.sisa_tagihan > 0 && <button onClick={() => handleWA(s.nama_lengkap, s.telepon, s.sisa_tagihan)} style={btnA('#10b981')}><MessageCircle size={18}/></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'TAGIHAN_PERUSAHAAN' && (
                        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thS}>Perusahaan</th>
                                        <th style={thS}>Tagihan</th>
                                        <th style={thS}>Nominal</th>
                                        <th style={thS}>Status</th>
                                        <th style={{...thS, textAlign: 'center'}}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? <tr><td colSpan="5" style={{padding:'40px', textAlign:'center'}}><Loader2 className="animate-spin" style={{margin:'0 auto'}}/></td></tr> : filteredInvoices.map(i => (
                                        <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{...tdS, fontWeight: 800}}>{i.nama_perusahaan}</td>
                                            <td style={tdS}>{i.deskripsi_tagihan}</td>
                                            <td style={{...tdS, fontWeight: 800, color: brandNavy}}>Rp {i.nominal_tagihan?.toLocaleString('id-ID')}</td>
                                            <td style={tdS}><span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, background: i.status_invoice === 'PAID' ? '#dcfce7' : '#fef3c7', color: i.status_invoice === 'PAID' ? '#166534' : '#92400e' }}>{i.status_invoice}</span></td>
                                            <td style={{...tdS, textAlign: 'center'}}>
                                                {i.status_invoice !== 'PAID' && <button onClick={() => handleLunasInvoice(i.id, i.nama_perusahaan)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Set Lunas</button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'LAPORAN' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}><div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><TrendingUp size={24} /></div><div><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>PEMASUKAN SISWA BULAN INI</div><div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b' }}>Rp {reportData.currentMonthIncome.toLocaleString('id-ID')}</div></div></div>
                            </div>
                            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}><div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><AlertCircle size={24} /></div><div><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>TOTAL PIUTANG / TUNGGAKAN</div><div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444' }}>Rp {reportData.totalReceivables.toLocaleString('id-ID')}</div></div></div>
                            </div>
                            <div style={{ background: 'white', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}><div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><CreditCard size={24} /></div><div><div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>INVOICE PERUSAHAAN TERBAYAR</div><div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b' }}>Rp {reportData.companyIncome.toLocaleString('id-ID')}</div></div></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── MODAL INPUT PEMBAYARAN SISWA ── */}
                {isPayModalOpen && selectedStudent && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900 }}>Catat Pembayaran</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{selectedStudent.nama_lengkap}</p>
                                </div>
                                <button onClick={() => setIsPayModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>

                            <form onSubmit={handlePaymentSubmit}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelS}>Pilih Kategori Pembayaran</label>
                                    <select required style={inputS} value={payForm.kategori} onChange={handleKategoriChange}>
                                        <option value="">-- Pilih Tahap Pembayaran --</option>
                                        {PAYMENT_STAGES.map(stage => (
                                            <option key={stage.id} value={stage.id}>{stage.label} (Rp {stage.amount.toLocaleString('id-ID')})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelS}>Nominal (Rp)</label>
                                    <input type="number" required max={selectedStudent.sisa_tagihan} style={{...inputS, fontSize: '1.2rem', fontWeight: 800, color: brandNavy}} value={payForm.nominal} onChange={(e) => setPayForm({...payForm, nominal: e.target.value})} placeholder="Contoh: 5000000" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                                    <div><label style={labelS}>Metode</label><select style={inputS} value={payForm.metode_pembayaran} onChange={(e) => setPayForm({...payForm, metode_pembayaran: e.target.value})}><option value="TRANSFER">Transfer Bank</option><option value="CASH">CASH (Tunai)</option></select></div>
                                    <div><label style={labelS}>Catatan (Opsional)</label><input style={inputS} value={payForm.keterangan} onChange={(e) => setPayForm({...payForm, keterangan: e.target.value})} placeholder="Ex: Cicilan ke-1" /></div>
                                </div>
                                <button type="submit" disabled={isSubmitting || selectedStudent.sisa_tagihan === 0} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: selectedStudent.sisa_tagihan === 0 ? 'not-allowed' : 'pointer' }}>
                                    {isSubmitting ? 'Memproses...' : 'Simpan Pembayaran'}
                                </button>
                            </form>

                            <div style={{ marginTop: '30px' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>Riwayat Pembayaran</h4>
                                {payments.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>Belum ada riwayat.</p> : (
                                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                        {payments.map((p, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: '0.8rem' }}>
                                                <div><div style={{ fontWeight: 700, color: '#334155' }}>{p.tanggal_bayar}</div><div style={{ color: '#64748b' }}>{p.keterangan || '-'}</div></div>
                                                <div style={{ fontWeight: 800, color: '#10b981' }}>+ Rp {Number(p.nominal).toLocaleString('id-ID')}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODAL INPUT INVOICE PERUSAHAAN ── */}
                {isInvoiceModalOpen && (
                    <div style={modalOverlay}>
                        <form onSubmit={handleInvoiceSubmit} style={modalContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Buat Tagihan Perusahaan</h3>
                                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>
                            <div style={{ marginBottom: '15px' }}><label style={labelS}>Nama Perusahaan (Kaisha/Kumiai)</label><input required style={inputS} value={invoiceForm.nama_perusahaan} onChange={e => setInvoiceForm({...invoiceForm, nama_perusahaan: e.target.value})} placeholder="Contoh: Toyota Corp" /></div>
                            <div style={{ marginBottom: '15px' }}><label style={labelS}>Deskripsi Tagihan</label><input required style={inputS} value={invoiceForm.deskripsi_tagihan} onChange={e => setInvoiceForm({...invoiceForm, deskripsi_tagihan: e.target.value})} placeholder="Contoh: Fee Penempatan" /></div>
                            <div style={{ marginBottom: '15px' }}><label style={labelS}>Nominal Tagihan (Rp)</label><input type="number" required style={inputS} value={invoiceForm.nominal_tagihan} onChange={e => setInvoiceForm({...invoiceForm, nominal_tagihan: e.target.value})} /></div>
                            <div style={{ marginBottom: '25px' }}><label style={labelS}>Batas Waktu (Jatuh Tempo)</label><input type="date" required style={inputS} value={invoiceForm.jatuh_tempo} onChange={e => setInvoiceForm({...invoiceForm, jatuh_tempo: e.target.value})} /></div>
                            <button type="submit" disabled={isSubmitting} style={{ width: '100%', background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Tagihan Baru'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── STYLE OBJECTS ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', fontWeight: 800, width: '100%', textAlign: 'left', cursor: 'pointer' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 700, width: '100%', textAlign: 'left', cursor: 'pointer' };
const thS = { padding: '15px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdS = { padding: '15px 20px', fontSize: '0.9rem' };
const btnA = (c) => ({ background: 'white', border: `1px solid ${c}40`, color: c, padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' });
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const labelS = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' };
const inputS = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: '#f8fafc' };