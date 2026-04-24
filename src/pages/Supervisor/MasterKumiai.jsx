import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, MoreVertical, Edit, Trash2, X, Users, MapPin, Phone, Mail, Loader2, Save, Building2 } from 'lucide-react'; // <-- Building2 sudah ditambahkan di sini

const brandNavy = '#101869';

export default function MasterKumiai() {
    const [kumiaiList, setKumiaiList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialForm = { nama_kumiai: '', wilayah: '', penanggung_jawab: '', no_telepon: '', email: '', alamat: '', status: 'Aktif' };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchData();
        function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('master_kumiai').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setKumiaiList(data);
        } catch (error) { console.error("Gagal memuat Kumiai:", error.message); } finally { setIsLoading(false); }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openModal = (kumiai = null) => {
        if (kumiai) { setEditingId(kumiai.id); setFormData({ ...kumiai }); } 
        else { setEditingId(null); setFormData(initialForm); }
        setIsModalOpen(true); setActiveDropdown(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('master_kumiai').update(formData).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('master_kumiai').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false); 
            fetchData();
        } catch (error) { alert('Error: ' + error.message); } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin menghapus Kumiai ${nama}?`)) return;
        try {
            const { error } = await supabase.from('master_kumiai').delete().eq('id', id);
            if (error) throw error; 
            setActiveDropdown(null); 
            fetchData();
        } catch (error) { alert('Error: ' + error.message); }
    };

    const filteredData = kumiaiList.filter(k => (k.nama_kumiai?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (k.wilayah?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

    return (
        <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: '#1e293b', margin: '0 0 5px 0', fontWeight: 900 }}>Master Kumiai</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola data asosiasi penyalur dan pengawas di Jepang.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Kumiai / Wilayah..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '280px', fontSize: '0.95rem' }} />
                    </div>
                    <button onClick={() => openModal()} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Tambah Kumiai
                    </button>
                </div>
            </header>

            {isLoading && kumiaiList.length === 0 ? <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}><Loader2 className="animate-spin" size={30} style={{margin:'0 auto'}}/></div> : filteredData.length === 0 ? <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', color: '#64748b', fontWeight: 600, border: '1px dashed #cbd5e1' }}>Belum ada data Kumiai yang sesuai.</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredData.map(kumiai => (
                        <div key={kumiai.id} style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}><Building2 size={24} /></div>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 800 }}>{kumiai.nama_kumiai}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}><MapPin size={14} /> Wilayah: {kumiai.wilayah || '-'}</div>
                                    </div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => setActiveDropdown(activeDropdown === kumiai.id ? null : kumiai.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><MoreVertical size={20} /></button>
                                    {activeDropdown === kumiai.id && (
                                        <div ref={dropdownRef} style={{ position: 'absolute', right: 0, top: '25px', background: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '120px', zIndex: 10, padding: '5px' }}>
                                            <button onClick={() => openModal(kumiai)} style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}><Edit size={14} /> Edit</button>
                                            <button onClick={() => handleDelete(kumiai.id, kumiai.nama_kumiai)} style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#475569', marginTop: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                                <div style={{display:'flex', gap:'10px', alignItems: 'center'}}><Users size={16} color="#94a3b8"/> <b>PIC:</b> {kumiai.penanggung_jawab || '-'}</div>
                                <div style={{display:'flex', gap:'10px', alignItems: 'center'}}><Phone size={16} color="#94a3b8"/> {kumiai.no_telepon || '-'}</div>
                                <div style={{display:'flex', gap:'10px', alignItems: 'center'}}><Mail size={16} color="#94a3b8"/> {kumiai.email || '-'}</div>
                            </div>
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Status Sistem</span>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, background: kumiai.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: kumiai.status === 'Aktif' ? '#166534' : '#991b1b' }}>{kumiai.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── MODAL UI/UX BARU ── */}
            {isModalOpen && (
                <div style={modalOverlay}>
                    <form onSubmit={handleSubmit} style={modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', fontWeight: 900 }}>{editingId ? 'Edit Data Kumiai' : 'Registrasi Kumiai Baru'}</h2>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Masukkan detail informasi organisasi penerima (Jepang).</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex' }}><X size={20} color="#64748b" /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelS}>Nama Kumiai (Asosiasi) *</label>
                                <input style={inputForm} type="text" name="nama_kumiai" placeholder="Cth: Fukuoka Intec Kyodokumiai" required value={formData.nama_kumiai} onChange={handleInputChange} />
                            </div>
                            
                            <div>
                                <label style={labelS}>Wilayah / Prefektur *</label>
                                <input style={inputForm} type="text" name="wilayah" placeholder="Cth: Fukuoka, Tokyo" required value={formData.wilayah} onChange={handleInputChange} />
                            </div>
                            
                            <div>
                                <label style={labelS}>Penanggung Jawab (PIC)</label>
                                <input style={inputForm} type="text" name="penanggung_jawab" placeholder="Nama representatif" value={formData.penanggung_jawab} onChange={handleInputChange} />
                            </div>

                            <div>
                                <label style={labelS}>No. Telepon / Kantor</label>
                                <input style={inputForm} type="text" name="no_telepon" placeholder="+81..." value={formData.no_telepon} onChange={handleInputChange} />
                            </div>

                            <div>
                                <label style={labelS}>Email Resmi</label>
                                <input style={inputForm} type="email" name="email" placeholder="email@kumiai.jp" value={formData.email} onChange={handleInputChange} />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelS}>Alamat Lengkap</label>
                                <textarea style={{...inputForm, resize: 'vertical'}} name="alamat" placeholder="Detail jalan, distrik, kota..." rows="2" value={formData.alamat} onChange={handleInputChange}></textarea>
                            </div>

                            <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <label style={labelS}>Status Kemitraan Sistem</label>
                                <select style={{...inputForm, background: 'white'}} name="status" value={formData.status} onChange={handleInputChange}>
                                    <option value="Aktif">🟢 AKTIF (Terima Job Order)</option>
                                    <option value="Non-Aktif">🔴 NON-AKTIF (Ditangguhkan)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '2px solid #f1f5f9', paddingTop: '20px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 20px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Batal</button>
                            <button type="submit" disabled={isSubmitting} style={{ padding: '12px 25px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Simpan Data</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

// ── STYLE OBJECTS UNTUK MODAL ──
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { background: 'white', padding: '35px', borderRadius: '20px', width: '600px', maxWidth: '95vw', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const labelS = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputForm = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc', transition: 'border-color 0.2s' };