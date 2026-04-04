import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Building2, MapPin, Phone, Mail, Edit, Trash2, X, ShieldCheck, LayoutGrid, List } from 'lucide-react';

const brandNavy = '#101869';
const brandYellow = '#fdfb06';

export default function MasterMitra({ initialFilter = 'ALL' }) {
    const [mitraList, setMitraList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenis, setFilterJenis] = useState(initialFilter); 
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('TABLE'); // 'CARD' atau 'TABLE'

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        jenis: 'MITRA', nama_perusahaan: '', kode_perusahaan: '', email: '', telepon: '', alamat: '', status: 'ACTIVE'
    });

    const fetchMitra = async () => {
        setIsLoading(true);
        let query = supabase.from('mitra').select('*').order('created_at', { ascending: false });
        if (filterJenis !== 'ALL') query = query.eq('jenis', filterJenis);

        const { data, error } = await query;
        if (!error && data) setMitraList(data);
        setIsLoading(false);
    };

    useEffect(() => { 
        setFilterJenis(initialFilter);
    }, [initialFilter]);

    useEffect(() => { 
        fetchMitra(); 
    }, [filterJenis]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openModal = (mitra = null) => {
        if (mitra) {
            setEditingId(mitra.id);
            setFormData(mitra);
        } else {
            setEditingId(null);
            setFormData({ jenis: filterJenis === 'KUMIAI' ? 'KUMIAI' : 'MITRA', nama_perusahaan: '', kode_perusahaan: '', email: '', telepon: '', alamat: '', status: 'ACTIVE' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('mitra').update(formData).eq('id', editingId);
                if (error) throw error;
                alert('Data berhasil diupdate!');
            } else {
                const { error } = await supabase.from('mitra').insert([formData]);
                if (error) throw error;
                alert('Data baru berhasil ditambahkan!');
            }
            setIsModalOpen(false);
            fetchMitra();
        } catch (error) { alert('Error: ' + error.message); } 
        finally { setIsLoading(false); }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus ${nama}?`)) return;
        try {
            const { error } = await supabase.from('mitra').delete().eq('id', id);
            if (error) throw error;
            fetchMitra();
        } catch (error) { alert('Error: ' + error.message); }
    };

    const filteredData = mitraList.filter(m => 
        m.nama_perusahaan.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (m.kode_perusahaan && m.kode_perusahaan.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0' }}>
                        {filterJenis === 'ALL' ? 'Master Data Mitra & Kumiai' : filterJenis === 'MITRA' ? 'Master Mitra (Kaisha)' : 'Master Kumiai'}
                    </h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola daftar perusahaan dan lembaga penyalur.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari nama / kode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '0.9rem' }} />
                    </div>
                    <button onClick={() => openModal()} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Tambah Data
                    </button>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                        <button onClick={() => setViewMode('CARD')} style={viewBtnS(viewMode === 'CARD')}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('TABLE')} style={viewBtnS(viewMode === 'TABLE')}><List size={18} /></button>
                    </div>
                </div>
            </header>

            {/* TABEL VIEW */}
            {viewMode === 'TABLE' ? (
                <div style={{ background: 'white', borderRadius: '15px', overflow: 'visible', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr><th style={thP}>Nama Institusi</th><th style={thP}>Kontak</th><th style={thP}>Alamat</th><th style={{...thP, textAlign: 'center'}}>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {filteredData.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdP}>
                                        <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {item.jenis === 'KUMIAI' ? <ShieldCheck size={16} color="#f59e0b"/> : <Building2 size={16} color={brandNavy}/>}
                                            {item.nama_perusahaan}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>{item.kode_perusahaan || 'NO-CODE'}</span>
                                            <span style={{ color: item.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 700 }}>{item.status}</span>
                                        </div>
                                    </td>
                                    <td style={tdP}>
                                        <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>{item.email || '-'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>{item.telepon || '-'}</div>
                                    </td>
                                    <td style={{...tdP, fontSize: '0.85rem', color: '#64748b', maxWidth: '300px'}}>{item.alamat || '-'}</td>
                                    <td style={{...tdP, textAlign: 'center'}}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button onClick={() => openModal(item)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6' }}><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(item.id, item.nama_perusahaan)} style={{ background: '#fef2f2', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Tidak ada data ditemukan.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* CARD VIEW */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredData.map(item => (
                        <div key={item.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', borderTop: `4px solid ${item.jenis === 'KUMIAI' ? '#f59e0b' : brandNavy}`, position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '5px' }}>
                                <button onClick={() => openModal(item)} style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6' }}><Edit size={14}/></button>
                                <button onClick={() => handleDelete(item.id, item.nama_perusahaan)} style={{ background: '#fef2f2', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14}/></button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ width: '50px', height: '50px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                    {item.jenis === 'KUMIAI' ? <ShieldCheck size={24} color="#f59e0b"/> : <Building2 size={24} color={brandNavy}/>}
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 800, paddingRight: '60px' }}>{item.nama_perusahaan}</h3>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{item.kode_perusahaan || 'NO-CODE'}</span>
                                        <span style={{ color: item.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}>● {item.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                                {item.email && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Mail size={14} color="#94a3b8"/> {item.email}</div>}
                                {item.telepon && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Phone size={14} color="#94a3b8"/> {item.telepon}</div>}
                                {item.alamat && <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}><MapPin size={14} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }}/> <span style={{ lineHeight: 1.4 }}>{item.alamat}</span></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL FORM TAMBAH/EDIT */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{editingId ? 'Edit Data Mitra' : 'Tambah Mitra Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20}/></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={labelForm}>Jenis Institusi</label>
                                    <select name="jenis" value={formData.jenis} onChange={handleInputChange} style={inputForm}>
                                        <option value="MITRA">Kaisha / Perusahaan</option>
                                        <option value="KUMIAI">Kumiai (Penyalur)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelForm}>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} style={inputForm}>
                                        <option value="ACTIVE">Aktif Bekerjasama</option>
                                        <option value="INACTIVE">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label style={labelForm}>Nama Perusahaan / Kumiai *</label>
                                <input type="text" name="nama_perusahaan" value={formData.nama_perusahaan} onChange={handleInputChange} required style={inputForm} />
                            </div>
                            <div>
                                <label style={labelForm}>Kode Perusahaan (Opsional)</label>
                                <input type="text" name="kode_perusahaan" value={formData.kode_perusahaan} onChange={handleInputChange} placeholder="Cth: 001 / ASIHIRO" style={inputForm} />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={labelForm}>Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} style={inputForm} /></div>
                                <div><label style={labelForm}>No. Telepon</label><input type="text" name="telepon" value={formData.telepon} onChange={handleInputChange} style={inputForm} /></div>
                            </div>
                            
                            <div>
                                <label style={labelForm}>Alamat Lengkap</label>
                                <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} rows="3" style={{...inputForm, resize: 'vertical'}}></textarea>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>{isLoading ? 'Menyimpan...' : 'Simpan Data'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' };
const inputForm = { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const viewBtnS = (active) => ({ padding: '6px 10px', border:'none', borderRadius:'6px', cursor:'pointer', background: active ? 'white' : 'transparent', color: active ? brandNavy : '#94a3b8', transition: '0.2s', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' });
const thP = { padding: '18px 25px', textAlign:'left', fontSize:'0.75rem', textTransform:'uppercase', color:'#94a3b8', letterSpacing: '1px', fontWeight: 800 };
const tdP = { padding: '18px 25px', verticalAlign: 'middle' };