import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    UserPlus, FileText, CheckCircle2, Clock, XCircle, Send, Building, 
    Loader2, Info, BookOpen, Eye, X, Activity, Award, Building2, PlaneTakeoff, Stethoscope, Trash2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const brandNavy = '#101869';

export default function DashboardMitra() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [mitraProfile, setMitraProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('INPUT'); 
    const [riwayatSiswa, setRiwayatSiswa] = useState([]);
    const [masterBidang, setMasterBidang] = useState([]); 

    // ── STATE UNTUK MODAL DETAIL PROGRESS ──
    const [detailModal, setDetailModal] = useState(null);

    const initialFormState = {
        nik: '', nama_lengkap: '', nama_jepang: '', tempat_lahir: '', tanggal_lahir: '', 
        jenis_kelamin: '', agama: '', golongan_darah: '', tinggi_badan: '', berat_badan: '', 
        telepon: '', email: '', asal_sekolah: '', minat_bidang: '', program: '',
        pendidikan_history: [], kerja_history: [], keluarga_history: []
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        const initDashboard = async () => {
            setIsLoading(true);
            const profile = await fetchMitraProfile();
            if (profile) {
                await fetchRiwayatPengajuan(profile.id);
            }
            await fetchMasterBidang();
            setIsLoading(false);
        };
        initDashboard();
    }, []);

    const fetchMitraProfile = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) { navigate('/login'); return null; }

            const { data: profile, error: profileError } = await supabase
                .from('master_mitra_lokal')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle(); 

            if (profileError) throw profileError;

            if (profile) {
                const mp = { id: profile.id, nama: profile.nama_institusi, jenis: profile.jenis_institusi };
                setMitraProfile(mp);
                return mp;
            } else {
                const dummy = { id: session.user.id, nama: 'Profil Mitra Belum Lengkap', jenis: 'Instansi' };
                setMitraProfile(dummy);
                return dummy;
            }
        } catch (error) {
            console.error("Gagal memuat profil mitra:", error.message);
            return null;
        }
    };

    const fetchMasterBidang = async () => {
        try {
            const { data } = await supabase.from('master_bidang').select('*').order('nama_bidang', { ascending: true });
            if (data) setMasterBidang(data);
        } catch (err) { console.error(err); }
    };

    const fetchRiwayatPengajuan = async (mitraId) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, nama_lengkap, jenis_kelamin, program, tahap_sekarang, status_akhir, created_at, medical_checkup_status, nilai_bahasa, data_raport, perusahaan_tujuan, tanggal_entri')
                .eq('created_by', mitraId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRiwayatSiswa(data || []);
        } catch (error) {
            console.error("Error fetching riwayat:", error.message);
        }
    };

    // ── HANDLER FORM LENGKAP ──
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleArrayChange = (field, index, key, value) => { 
        const updated = [...formData[field]]; 
        updated[index][key] = value; 
        setFormData({ ...formData, [field]: updated }); 
    };
    const addArrayItem = (field, newItem) => setFormData({ ...formData, [field]: [...formData[field], newItem] });
    const removeArrayItem = (field, index) => setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });

    const handleSubmitPengajuan = async (e) => {
        e.preventDefault();
        
        if (!window.confirm(`Kirim pengajuan kandidat atas nama ${formData.nama_lengkap} ke LPK UJC?`)) return;
        
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                tinggi_badan: formData.tinggi_badan ? parseInt(formData.tinggi_badan) : null, 
                berat_badan: formData.berat_badan ? parseInt(formData.berat_badan) : null,
                created_by: mitraProfile.id,
                lpk_asal: mitraProfile.nama,
                tahap_sekarang: 'WAWANCARA MITRA', 
                status_akhir: 'MENUNGGU REVIEW',
                total_bayar: 33000000 
            };

            const { error } = await supabase.from('students').insert([payload]);
            if (error) throw error;

            alert("Kandidat berhasil diajukan! Tim UJC akan segera melakukan verifikasi.");
            setFormData(initialFormState);
            setActiveTab('RIWAYAT');
            await fetchRiwayatPengajuan(mitraProfile.id);

        } catch (err) {
            alert("Gagal melakukan pengajuan: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const cleanStr = (str) => (str || '').toLowerCase().trim();

    if (isLoading && !mitraProfile) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', color: brandNavy }}>
                <Loader2 size={40} className="animate-spin" style={{ marginBottom: '15px' }} />
                <h2 style={{ margin: 0, fontWeight: 800 }}>Mempersiapkan Portal Mitra...</h2>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
            
            {/* ── SIDEBAR ── */}
            <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '25px 20px', borderBottom: '1px solid #e2e8f0', background: brandNavy, color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Portal Mitra</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Universal Japan Course</p>
                </div>
                
                <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px' }}>Instansi Pengirim</div>
                    <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '5px', lineHeight: '1.3' }}>
                        {mitraProfile?.nama || 'Mitra LPK'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Building size={14} /> {mitraProfile?.jenis || 'Agensi'}
                    </div>
                </div>

                <nav style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '10px 0 5px 5px' }}>Menu Utama</div>
                    <button onClick={() => setActiveTab('INPUT')} style={activeTab === 'INPUT' ? activeMenuS : inactiveMenuS}>
                        <UserPlus size={18} /> Formulir Pengajuan
                    </button>
                    <button onClick={() => setActiveTab('RIWAYAT')} style={activeTab === 'RIWAYAT' ? activeMenuS : inactiveMenuS}>
                        <FileText size={18} /> Status Kandidat
                    </button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
                        Keluar
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
                
                {/* ── TAB: INPUT PENGAJUAN (DIPERLUAS DENGAN FORM LENGKAP) ── */}
                {activeTab === 'INPUT' && (
                    <div className="fade-in" style={{ maxWidth: '900px' }}>
                        <header style={{ marginBottom: '30px' }}>
                            <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900, letterSpacing: '-0.5px' }}>Formulir Pengajuan Kandidat</h1>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Info size={16}/> Mohon lengkapi seluruh data siswa / alumni LPK Anda.
                            </p>
                        </header>

                        <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderTop: `5px solid ${brandNavy}` }}>
                            <form onSubmit={handleSubmitPengajuan}>
                                <h3 style={sectionTitle}>I. Klasifikasi & Identitas Dasar</h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{...labelForm, color: brandNavy}}>🎓 Kategori Program *</label>
                                        <select name="program" value={formData.program} onChange={handleInputChange} required style={{...inputForm, border: `2px solid ${brandNavy}`, background: '#eff6ff', fontWeight: 800}}>
                                            <option value="">-- Pilih Program Tujuan --</option>
                                            <option value="Pemagangan (Jisshusei)">Pemagangan (Jisshusei)</option>
                                            <option value="Tokutei Ginou (TG)">Tokutei Ginou (TG)</option>
                                            <option value="Engineering (Gijinkoku)">Engineering (Gijinkoku)</option>
                                            <option value="Visa Pelajar (Ryuugaku)">Visa Pelajar (Ryuugaku)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{...labelForm, color: '#10b981'}}>🎯 Minat Bidang Pekerjaan *</label>
                                        <select name="minat_bidang" value={formData.minat_bidang} onChange={handleInputChange} required style={{...inputForm, border: '2px solid #10b981', background: '#ecfdf5'}}>
                                            <option value="">-- Pilih Bidang (Tujuan Kaisha) --</option>
                                            {masterBidang.map(b => <option key={b.nama_bidang} value={b.nama_bidang}>{b.nama_bidang}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '40px' }}>
                                    <div><label style={labelForm}>NIK *</label><input type="text" name="nik" value={formData.nik} onChange={handleInputChange} required style={inputForm} placeholder="16 Digit NIK" /></div>
                                    <div><label style={labelForm}>Nama Lengkap *</label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} required style={inputForm} placeholder="Sesuai KTP" /></div>
                                    <div><label style={labelForm}>Nama Jepang</label><input type="text" name="nama_jepang" value={formData.nama_jepang} onChange={handleInputChange} style={inputForm} placeholder="Katakana (Opsional)" /></div>
                                    <div><label style={labelForm}>Tempat Lahir *</label><input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} required style={inputForm} placeholder="Kota/Kab Kelahiran" /></div>
                                    <div><label style={labelForm}>Tanggal Lahir *</label><input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} required style={inputForm} /></div>
                                    <div><label style={labelForm}>Jenis Kelamin *</label><select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} required style={inputForm}><option value="">-- Pilih --</option><option value="L">Laki-Laki</option><option value="P">Perempuan</option></select></div>
                                    <div><label style={labelForm}>Agama</label><select name="agama" value={formData.agama} onChange={handleInputChange} style={inputForm}><option value="">-- Pilih --</option><option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option></select></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div><label style={labelForm}>Gol. Darah</label><select name="golongan_darah" value={formData.golongan_darah} onChange={handleInputChange} style={inputForm}><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option></select></div>
                                        <div><label style={labelForm}>Tinggi (cm)</label><input type="number" name="tinggi_badan" value={formData.tinggi_badan} onChange={handleInputChange} style={inputForm} /></div>
                                        <div><label style={labelForm}>Berat (kg)</label><input type="number" name="berat_badan" value={formData.berat_badan} onChange={handleInputChange} style={inputForm} /></div>
                                    </div>
                                    <div><label style={labelForm}>No. WhatsApp *</label><input type="text" name="telepon" value={formData.telepon} onChange={handleInputChange} required style={inputForm} placeholder="08..." /></div>
                                    <div><label style={labelForm}>Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} style={inputForm} placeholder="Email aktif" /></div>
                                    <div><label style={labelForm}>Asal Sekolah *</label><input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleInputChange} required style={inputForm} placeholder="SMA/SMK/PT" /></div>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>II. Riwayat Pendidikan</h3><button type="button" onClick={() => addArrayItem('pendidikan_history', { jenjang: '', nama_sekolah: '', jurusan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' })} style={btnAddArray}>+ Tambah Pendidikan</button></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                                    {formData.pendidikan_history.map((edu, idx) => (
                                        <div key={idx} style={{...dynamicRowStyle, gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr auto'}}>
                                            <input style={inputForm} placeholder="Jenjang (SD/SMP)" value={edu.jenjang} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'jenjang', e.target.value)} />
                                            <input style={inputForm} placeholder="Nama Institusi" value={edu.nama_sekolah} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'nama_sekolah', e.target.value)} />
                                            <input style={inputForm} placeholder="Jurusan" value={edu.jurusan} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'jurusan', e.target.value)} />
                                            <div style={{display:'flex', gap:'5px'}}>
                                                <input style={inputForm} placeholder="Thn Masuk" value={edu.thn_awal} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'thn_awal', e.target.value)} />
                                                <input style={inputForm} placeholder="Thn Lulus" value={edu.thn_akhir} onChange={(e) => handleArrayChange('pendidikan_history', idx, 'thn_akhir', e.target.value)} />
                                            </div>
                                            <button type="button" onClick={() => removeArrayItem('pendidikan_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {formData.pendidikan_history.length === 0 && <div style={emptyArrayText}>Belum ada riwayat pendidikan yang ditambahkan.</div>}
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>III. Pengalaman Kerja</h3><button type="button" onClick={() => addArrayItem('kerja_history', { nama_perusahaan: '', jenis_pekerjaan: '', bln_awal: '', thn_awal: '', bln_akhir: '', thn_akhir: '' })} style={btnAddArray}>+ Tambah Pekerjaan</button></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                                    {formData.kerja_history.map((job, idx) => (
                                        <div key={idx} style={dynamicRowStyle}>
                                            <input style={inputForm} placeholder="Nama Perusahaan" value={job.nama_perusahaan} onChange={(e) => handleArrayChange('kerja_history', idx, 'nama_perusahaan', e.target.value)} />
                                            <input style={inputForm} placeholder="Posisi" value={job.jenis_pekerjaan} onChange={(e) => handleArrayChange('kerja_history', idx, 'jenis_pekerjaan', e.target.value)} />
                                            <div style={{display:'flex', gap:'5px'}}>
                                                <input style={inputForm} placeholder="Thn Masuk" value={job.thn_awal} onChange={(e) => handleArrayChange('kerja_history', idx, 'thn_awal', e.target.value)} />
                                                <input style={inputForm} placeholder="Thn Keluar" value={job.thn_akhir} onChange={(e) => handleArrayChange('kerja_history', idx, 'thn_akhir', e.target.value)} />
                                            </div>
                                            <button type="button" onClick={() => removeArrayItem('kerja_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {formData.kerja_history.length === 0 && <div style={emptyArrayText}>Belum ada pengalaman kerja yang ditambahkan.</div>}
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}><h3 style={{...sectionTitle, marginBottom: 0, borderBottom: 'none'}}>IV. Kontak Keluarga</h3><button type="button" onClick={() => addArrayItem('keluarga_history', { hubungan: '', nama: '', pendapatan: '', umur: '', lokasi: 'INDONESIA' })} style={btnAddArray}>+ Tambah Keluarga</button></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', borderTop: '2px solid #f1f5f9', paddingTop: '15px' }}>
                                    {formData.keluarga_history.map((fam, idx) => (
                                        <div key={idx} style={{...dynamicRowStyle, gridTemplateColumns: '1fr 2fr 1fr 2fr 1fr auto'}}>
                                            <input style={inputForm} placeholder="Hubungan" value={fam.hubungan} onChange={(e) => handleArrayChange('keluarga_history', idx, 'hubungan', e.target.value)} />
                                            <input style={inputForm} placeholder="Nama Keluarga" value={fam.nama} onChange={(e) => handleArrayChange('keluarga_history', idx, 'nama', e.target.value)} />
                                            <input style={inputForm} placeholder="Umur" value={fam.umur} onChange={(e) => handleArrayChange('keluarga_history', idx, 'umur', e.target.value)} />
                                            <input style={inputForm} placeholder="Pekerjaan" value={fam.pendapatan} onChange={(e) => handleArrayChange('keluarga_history', idx, 'pendapatan', e.target.value)} />
                                            <select style={inputForm} value={fam.lokasi || 'INDONESIA'} onChange={(e) => handleArrayChange('keluarga_history', idx, 'lokasi', e.target.value)}>
                                                <option value="INDONESIA">Di Indonesia</option>
                                                <option value="JEPANG">Di Jepang</option>
                                            </select>
                                            <button type="button" onClick={() => removeArrayItem('keluarga_history', idx)} style={btnRemoveArray}><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {formData.keluarga_history.length === 0 && <div style={emptyArrayText}>Belum ada data keluarga yang ditambahkan.</div>}
                                </div>

                                <div style={{ background: '#eff6ff', padding: '15px 20px', borderRadius: '8px', border: '1px dashed #93c5fd', marginTop: '30px', color: '#1e3a8a', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '25px' }}>
                                    <strong>Pemberitahuan:</strong> Pastikan seluruh data CV siswa terisi dengan benar. Data ini akan langsung digunakan oleh LPK UJC untuk kebutuhan wawancara dan pengiriman dokumen ke Jepang.
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={isSubmitting} style={{ padding: '16px 30px', background: brandNavy, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(16,24,105,0.25)', transition: '0.2s', opacity: isSubmitting ? 0.7 : 1, fontSize: '1rem' }}>
                                        {isSubmitting ? 'Mengirim Data...' : <>Kirim CV Kandidat ke UJC <Send size={18}/></>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── TAB: RIWAYAT PENGAJUAN & PEMANTAUAN ── */}
                {activeTab === 'RIWAYAT' && (
                    <div className="fade-in">
                        <header style={{ marginBottom: '30px', flexShrink: 0 }}>
                            <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 10px 0', fontWeight: 900, letterSpacing: '-0.5px' }}>Pemantauan Status Kandidat</h1>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>Pantau perkembangan, nilai akademik, dan penempatan siswa Anda secara real-time.</p>
                        </header>

                        <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={thP}>Nama Siswa & Program</th>
                                        <th style={thP}>Tgl Pengajuan</th>
                                        <th style={thP}>Posisi / Tahap Saat Ini</th>
                                        <th style={thP}>Status Seleksi UJC</th>
                                        <th style={{...thP, textAlign: 'center'}}>Aksi & Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat riwayat...</td></tr>
                                    ) : riwayatSiswa.length === 0 ? (
                                        <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Anda belum mengajukan kandidat sama sekali.</td></tr>
                                    ) : (
                                        riwayatSiswa.map(siswa => {
                                            const status = cleanStr(siswa.status_akhir);
                                            const tahap = cleanStr(siswa.tahap_sekarang);
                                            
                                            // Logika Pewarnaan Label
                                            let icon = <Clock size={16} color="#d97706" />;
                                            let bg = '#fef3c7', col = '#92400e';
                                            
                                            if (tahap === 'wawancara mitra' || status === 'menunggu review') {
                                                bg = '#fef3c7'; col = '#92400e'; icon = <Clock size={16} color="#92400e" />;
                                            } else if (status === 'ditolak' || status === 'gagal') {
                                                bg = '#fee2e2'; col = '#991b1b'; icon = <XCircle size={16} color="#991b1b" />;
                                            } else {
                                                bg = '#dcfce7'; col = '#166534'; icon = <CheckCircle2 size={16} color="#166534" />;
                                            }

                                            return (
                                                <tr key={siswa.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={tdP}>
                                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{siswa.nama_lengkap}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                                                            {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} <span style={{color:'#cbd5e1', margin:'0 4px'}}>|</span> <span style={{color: '#10b981'}}>{siswa.program || 'Program Belum Diset'}</span>
                                                        </div>
                                                    </td>
                                                    <td style={tdP}>
                                                        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                                            {new Date(siswa.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td style={tdP}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: brandNavy }}>{siswa.tahap_sekarang}</span>
                                                    </td>
                                                    <td style={tdP}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: bg, color: col, padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                            {icon} {siswa.status_akhir || 'PROSES'}
                                                        </div>
                                                    </td>
                                                    <td style={{...tdP, textAlign: 'center'}}>
                                                        <button onClick={() => setDetailModal(siswa)} style={{ padding: '8px 15px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', transition: '0.2s' }}>
                                                            <Eye size={16}/> Cek Progres
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── MODAL DETAIL PROGRESS UNTUK MITRA ── */}
                {detailModal && (
                    <div style={modalOverlay}>
                        <div style={{...modalContent, width: '800px', maxWidth: '95vw', padding: 0}}>
                            <div style={{ background: brandNavy, color: 'white', padding: '25px 30px', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Detail Evaluasi & Progress Kandidat</h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#cbd5e1' }}>{detailModal.nama_lengkap} • {detailModal.program}</p>
                                </div>
                                <button onClick={() => setDetailModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
                            </div>

                            <div style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                    
                                    {/* STATUS MCU */}
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                            <div style={{ padding: '8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '8px' }}><Stethoscope size={20}/></div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>Medical Check-Up</h4>
                                        </div>
                                        {detailModal.medical_checkup_status ? (
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: detailModal.medical_checkup_status === 'FIT' ? '#10b981' : '#ef4444' }}>
                                                {detailModal.medical_checkup_status === 'FIT' ? '✅ FIT (Lulus)' : '❌ UNFIT (Gagal)'}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>⏳ Sedang Menunggu Hasil</div>
                                        )}
                                    </div>

                                    {/* STATUS PENEMPATAN */}
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                            <div style={{ padding: '8px', background: '#fce7f3', color: '#be185d', borderRadius: '8px' }}><Building2 size={20}/></div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>Penempatan (Job Order)</h4>
                                        </div>
                                        {detailModal.perusahaan_tujuan ? (
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#db2777' }}>🏢 {detailModal.perusahaan_tujuan}</div>
                                                {detailModal.tanggal_entri ? (
                                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#10b981', fontWeight: 800 }}>
                                                        <PlaneTakeoff size={16}/> Jadwal Terbang: {new Date(detailModal.tanggal_entri).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                    </div>
                                                ) : (
                                                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Dokumen sedang diproses (Menunggu COE/Visa).</div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b' }}>Siswa belum di-matching dengan Kaisha (Perusahaan).</div>
                                        )}
                                    </div>
                                </div>

                                {/* NILAI AKADEMIK & RAPORT */}
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} color={brandNavy}/> Evaluasi Akademik (Diklat)</h4>
                                <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>Rata-rata Tes Bahasa:</span>
                                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: brandNavy }}>{detailModal.nilai_bahasa || 0}</span>
                                    </div>

                                    {/* PARSING DATA RAPORT DENGAN AMAN */}
                                    {(() => {
                                        const raport = typeof detailModal.data_raport === 'string' ? JSON.parse(detailModal.data_raport || '{}') : (detailModal.data_raport || {});
                                        if (Object.keys(raport).length === 0) {
                                            return <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Raport akhir belum diterbitkan oleh Instruktur UJC.</div>;
                                        }
                                        return (
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Rincian Aspek Bahasa</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '20px' }}>
                                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Kotoba</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.kotoba || 0}</div></div>
                                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Bunpo</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.bunpo || 0}</div></div>
                                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Dokkai</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.dokkai || 0}</div></div>
                                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Choukai</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.choukai || 0}</div></div>
                                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#64748b'}}>Kaiwa</div><div style={{fontWeight:900, color: brandNavy, fontSize: '1rem'}}>{raport.kaiwa || 0}</div></div>
                                                </div>

                                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Sikap & Karakter</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                                                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#b45309'}}>Perilaku</div><div style={{fontWeight:900, color: '#d97706'}}>{raport.perilaku || '-'}</div></div>
                                                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#b45309'}}>Disiplin</div><div style={{fontWeight:900, color: '#d97706'}}>{raport.kedisiplinan || '-'}</div></div>
                                                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#b45309'}}>Teamwork</div><div style={{fontWeight:900, color: '#d97706'}}>{raport.teamwork || '-'}</div></div>
                                                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px' }}><div style={{fontSize:'0.7rem', color:'#b45309'}}>Fisik</div><div style={{fontWeight:900, color: '#d97706'}}>{raport.fisik || '-'}</div></div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button onClick={() => setDetailModal(null)} style={{ padding: '12px 30px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Tutup</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── STYLES ──
const activeMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 800, fontSize: '0.95rem' };
const inactiveMenuS = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem', transition: '0.2s' };
const sectionTitle = { fontSize: '1.2rem', color: '#1e293b', fontWeight: 800, margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' };
const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputForm = { width: '100%', padding: '12px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const dynamicRowStyle = { display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' };
const btnAddArray = { background: '#dbeafe', color: brandNavy, border: `1px solid ${brandNavy}`, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: '0.2s' };
const btnRemoveArray = { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const emptyArrayText = { textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1' };
const thP = { padding: '18px 25px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', fontWeight: 800 };
const tdP = { padding: '18px 25px', verticalAlign: 'middle' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(6px)' };
const modalContent = { background: 'white', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' };