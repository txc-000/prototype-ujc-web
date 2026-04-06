import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, MoreVertical, Edit, Trash2, X, Building2, MapPin, Phone, Mail, Briefcase, CheckCircle2 } from 'lucide-react';

const brandNavy = '#101869';

export default function MasterKaisha() {
    const [kaishaList, setKaishaList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        nama_perusahaan: '', nama_kumiai: '', bidang_industri: '', 
        penanggung_jawab: '', no_telepon: '', email: '', alamat: '', status: 'Aktif'
    };
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
            const { data, error } = await supabase.from('master_kaisha').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setKaishaList(data);
        } catch (error) {
            console.error("Gagal memuat data Kaisha:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openModal = (kaisha = null) => {
        if (kaisha) {
            setEditingId(kaisha.id);
            setFormData({ ...kaisha });
        } else {
            setEditingId(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
        setActiveDropdown(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('master_kaisha').update(formData).eq('id', editingId);
                if (error) throw error;
                alert('Data Kaisha berhasil diperbarui!');
            } else {
                const { error } = await supabase.from('master_kaisha').insert([formData]);
                if (error) throw error;
                alert('Data Kaisha baru berhasil ditambahkan!');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) { alert('Error: ' + error.message); } finally { setIsLoading(false); }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus Kaisha ${nama} secara permanen?`)) return;
        try {
            const { error } = await supabase.from('master_kaisha').delete().eq('id', id);
            if (error) throw error;
            alert('Data berhasil dihapus!');
            setActiveDropdown(null);
            fetchData();
        } catch (error) { alert('Error: ' + error.message); }
    };

    const filteredData = kaishaList.filter(k =>
        (k.nama_perusahaan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (k.nama_kumiai?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (k.bidang_industri?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0' }}>Master Kaisha (Perusahaan Jepang)</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola profil perusahaan dan Kumiai tempat siswa ditempatkan.</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Kaisha / Kumiai..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '280px', fontSize: '0.9rem' }} />
                    </div>
                    <button onClick={() => openModal()} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(16,24,105,0.2)' }}>
                        <Plus size={18} /> Tambah Kaisha
                    </button>
                </div>
            </header>

            {isLoading && kaishaList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}>Memuat data...</div>
            ) : filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', color: '#64748b', fontWeight: 600 }}>Belum ada data Kaisha yang cocok.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredData.map(kaisha => (
                        <div key={kaisha.id} style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: brandNavy, flexShrink: 0 }}>
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 800 }}>{kaisha.nama_perusahaan}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                                            <CheckCircle2 size={14} /> {kaisha.nama_kumiai || 'Tanpa Kumiai'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => setActiveDropdown(activeDropdown === kaisha.id ? null : kaisha.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0' }}>
                                        <MoreVertical size={20} />
                                    </button>
                                    {activeDropdown === kaisha.id && (
                                        <div ref={dropdownRef} style={dropdownContainer}>
                                            <button onClick={() => openModal(kaisha)} style={dropdownItemS}><Edit size={14} /> Ubah Data</button>
                                            <button onClick={() => handleDelete(kaisha.id, kaisha.nama_perusahaan)} style={{ ...dropdownItemS, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginTop: '10px' }}>
                                <div style={infoRowS}><Briefcase size={14}/> <span style={{fontWeight: 600, color:'#334155'}}>{kaisha.bidang_industri || '-'}</span></div>
                                <div style={infoRowS}><Phone size={14}/> <span>{kaisha.no_telepon || '-'}</span> <span style={{color: '#cbd5e1'}}>•</span> <span>{kaisha.penanggung_jawab || '-'}</span></div>
                                {kaisha.email && <div style={infoRowS}><Mail size={14}/> <span>{kaisha.email}</span></div>}
                                {kaisha.alamat && <div style={{...infoRowS, alignItems: 'flex-start'}}><MapPin size={14} style={{marginTop:'3px', flexShrink: 0}}/> <span style={{lineHeight: 1.4}}>{kaisha.alamat}</span></div>}
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Ditambahkan: {new Date(kaisha.created_at).toLocaleDateString('id-ID')}</span>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: kaisha.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: kaisha.status === 'Aktif' ? '#166534' : '#991b1b' }}>{kaisha.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '600px', maxWidth: '95%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{editingId ? 'Edit Profil Kaisha' : 'Tambah Master Kaisha Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={labelForm}>Nama Perusahaan (Kaisha) *</label><input type="text" name="nama_perusahaan" value={formData.nama_perusahaan} onChange={handleInputChange} required style={inputForm} placeholder="Contoh: TOYOTA CORP" /></div>
                                <div><label style={labelForm}>Nama Kumiai</label><input type="text" name="nama_kumiai" value={formData.nama_kumiai} onChange={handleInputChange} style={inputForm} placeholder="Contoh: JITCO" /></div>
                            </div>
                            
                            <div><label style={labelForm}>Bidang Industri *</label><input type="text" name="bidang_industri" value={formData.bidang_industri} onChange={handleInputChange} required style={inputForm} placeholder="Contoh: Manufaktur / Pertanian / Perawat" /></div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={labelForm}>Penanggung Jawab (PIC)</label><input type="text" name="penanggung_jawab" value={formData.penanggung_jawab} onChange={handleInputChange} style={inputForm} placeholder="Nama PIC" /></div>
                                <div><label style={labelForm}>No. Telepon / Kantor</label><input type="text" name="no_telepon" value={formData.no_telepon} onChange={handleInputChange} style={inputForm} /></div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div><label style={labelForm}>Email Perusahaan</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} style={inputForm} /></div>
                                <div><label style={labelForm}>Status Kemitraan</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} style={inputForm}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                        <option value="Blacklist">Blacklist</option>
                                    </select>
                                </div>
                            </div>

                            <div><label style={labelForm}>Alamat Lengkap di Jepang</label><textarea name="alamat" value={formData.alamat} onChange={handleInputChange} rows="3" style={{ ...inputForm, resize: 'vertical' }}></textarea></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>{isLoading ? 'Menyimpan...' : 'Simpan Kaisha'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' };
const inputForm = { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const infoRowS = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' };
const dropdownContainer = { position: 'absolute', right: '0', top: '25px', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '140px', zIndex: 50, padding: '5px', textAlign: 'left' };
const dropdownItemS = { width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', borderRadius: '4px', transition: 'background 0.2s' };