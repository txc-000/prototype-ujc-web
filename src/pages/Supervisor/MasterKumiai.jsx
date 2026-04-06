import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, MoreVertical, Edit, Trash2, X, Users, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';

const brandNavy = '#101869';

export default function MasterKumiai() {
    const [kumiaiList, setKumiaiList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

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
        setIsLoading(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('master_kumiai').update(formData).eq('id', editingId);
                if (error) throw error;
                alert('Data Kumiai berhasil diperbarui!');
            } else {
                const { error } = await supabase.from('master_kumiai').insert([formData]);
                if (error) throw error;
                alert('Data Kumiai baru berhasil ditambahkan!');
            }
            setIsModalOpen(false); fetchData();
        } catch (error) { alert('Error: ' + error.message); } finally { setIsLoading(false); }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin menghapus Kumiai ${nama}?`)) return;
        try {
            const { error } = await supabase.from('master_kumiai').delete().eq('id', id);
            if (error) throw error; alert('Dihapus!'); setActiveDropdown(null); fetchData();
        } catch (error) { alert('Error: ' + error.message); }
    };

    const filteredData = kumiaiList.filter(k => (k.nama_kumiai?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (k.wilayah?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

    return (
        <div className="fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0' }}>Master Kumiai (Asosiasi)</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola organisasi penyalur dan pengawas di Jepang.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Kumiai / Wilayah..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '280px', fontSize: '0.9rem' }} />
                    </div>
                    <button onClick={() => openModal()} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Tambah Kumiai
                    </button>
                </div>
            </header>

            {isLoading && kumiaiList.length === 0 ? <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}>Memuat data...</div> : filteredData.length === 0 ? <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', color: '#64748b', fontWeight: 600 }}>Belum ada data Kumiai.</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredData.map(kumiai => (
                        <div key={kumiai.id} style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}><Users size={24} /></div>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 800 }}>{kumiai.nama_kumiai}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}><MapPin size={14} /> Wilayah: {kumiai.wilayah || '-'}</div>
                                    </div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => setActiveDropdown(activeDropdown === kumiai.id ? null : kumiai.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><MoreVertical size={20} /></button>
                                    {activeDropdown === kumiai.id && (
                                        <div ref={dropdownRef} style={{ position: 'absolute', right: 0, top: '25px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '120px', zIndex: 10, padding: '5px' }}>
                                            <button onClick={() => openModal(kumiai)} style={{ width: '100%', padding: '8px', display: 'flex', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600 }}><Edit size={14} /> Ubah</button>
                                            <button onClick={() => handleDelete(kumiai.id, kumiai.nama_kumiai)} style={{ width: '100%', padding: '8px', display: 'flex', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#64748b', marginTop: '15px' }}>
                                <div style={{display:'flex', gap:'8px'}}><Phone size={14}/> {kumiai.no_telepon || '-'} • {kumiai.penanggung_jawab || 'PIC Kosong'}</div>
                                {kumiai.email && <div style={{display:'flex', gap:'8px'}}><Mail size={14}/> {kumiai.email}</div>}
                            </div>
                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Status:</span>
                                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: kumiai.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: kumiai.status === 'Aktif' ? '#166534' : '#991b1b' }}>{kumiai.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{editingId ? 'Edit Kumiai' : 'Tambah Kumiai Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                            <input style={inputForm} type="text" name="nama_kumiai" placeholder="Nama Kumiai *" required value={formData.nama_kumiai} onChange={handleInputChange} />
                            <input style={inputForm} type="text" name="wilayah" placeholder="Wilayah (Prefektur)" value={formData.wilayah} onChange={handleInputChange} />
                            <input style={inputForm} type="text" name="penanggung_jawab" placeholder="Penanggung Jawab (PIC)" value={formData.penanggung_jawab} onChange={handleInputChange} />
                            <input style={inputForm} type="text" name="no_telepon" placeholder="Nomor Telepon" value={formData.no_telepon} onChange={handleInputChange} />
                            <input style={inputForm} type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
                            <textarea style={inputForm} name="alamat" placeholder="Alamat Lengkap" rows="2" value={formData.alamat} onChange={handleInputChange}></textarea>
                            <select style={inputForm} name="status" value={formData.status} onChange={handleInputChange}><option value="Aktif">Aktif</option><option value="Non-Aktif">Non-Aktif</option></select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                            <button type="submit" style={{ padding: '10px 15px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Simpan</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const inputForm = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' };