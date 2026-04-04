import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, MoreVertical, Edit, Trash2, X, LayoutGrid, List } from 'lucide-react';

const brandNavy = '#101869';

export default function MasterPengguna() {
    const [penggunaList, setPenggunaList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('CARD'); 
    
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // State form disesuaikan murni untuk profil user
    const [formData, setFormData] = useState({
        nama_pengguna: '', email: '', telepon: '', tipe_akun: 'mitra', instansi: '', alamat: '', status: 'Aktif'
    });

    useEffect(() => {
        function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchPengguna = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('pengguna').select('*').order('created_at', { ascending: false });
        if (!error && data) setPenggunaList(data);
        setIsLoading(false);
    };

    useEffect(() => { fetchPengguna(); }, []);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openModal = (user = null) => {
        if (user) {
            setEditingId(user.id);
            setFormData(user);
        } else {
            setEditingId(null);
            setFormData({ nama_pengguna: '', email: '', telepon: '', tipe_akun: 'mitra', instansi: '', alamat: '', status: 'Aktif' });
        }
        setIsModalOpen(true);
        setActiveDropdown(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('pengguna').update(formData).eq('id', editingId);
                if (error) throw error;
                alert('Data Pengguna berhasil diupdate!');
            } else {
                const { error } = await supabase.from('pengguna').insert([formData]);
                if (error) throw error;
                alert('Pengguna baru berhasil ditambahkan!');
            }
            setIsModalOpen(false);
            fetchPengguna();
        } catch (error) { alert('Error: ' + error.message); } 
        finally { setIsLoading(false); }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus akun ${nama}?`)) return;
        try {
            const { error } = await supabase.from('pengguna').delete().eq('id', id);
            if (error) throw error;
            fetchPengguna();
            setActiveDropdown(null);
        } catch (error) { alert('Error: ' + error.message); }
    };

    const filteredData = penggunaList.filter(p => 
        p.nama_pengguna.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.instansi?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Format Badge Tipe Akun (Meniru HTML lama)
    const getTipeBadge = (tipe) => {
        const t = tipe.toLowerCase();
        if(t === 'admin') return { bg: '#ec4899', text: 'admin' }; // Pink
        if(t === 'cs') return { bg: '#3b82f6', text: 'cs' };       // Biru
        return { bg: '#3b82f6', text: 'mitra' };                   // Biru (Mitra)
    };

    return (
        <div className="fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b', margin: '0 0 5px 0' }}>Pengguna Aplikasi</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola profil akun (Admin, CS, dan Mitra).</p>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Nama / Instansi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '0.9rem' }} />
                    </div>
                    <button onClick={() => openModal()} style={{ background: brandNavy, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Tambah Akun
                    </button>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                        <button onClick={() => setViewMode('CARD')} style={viewBtnS(viewMode === 'CARD')}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('TABLE')} style={viewBtnS(viewMode === 'TABLE')}><List size={18} /></button>
                    </div>
                </div>
            </header>

            {/* CARD VIEW */}
            {viewMode === 'CARD' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredData.map((user, i) => {
                        const tBadge = getTipeBadge(user.tipe_akun);
                        return (
                            <div key={user.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        {/* Avatar Dummy */}
                                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>

                                        <div>
                                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>{user.nama_pengguna}</h3>
                                            
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                <span style={{ background: tBadge.bg, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{tBadge.text}</span>
                                                <span style={{ background: user.status === 'Aktif' ? '#10b981' : '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{user.status}</span>
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                {user.instansi && <span style={{ border: '1px solid #a855f7', color: '#9333ea', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>{user.instansi}</span>}
                                                <span style={{ border: '1px solid #ec4899', color: '#db2777', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>{user.email}</span>
                                                {user.telepon && <span style={{ border: '1px solid #3b82f6', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>{user.telepon}</span>}
                                                {i === 0 && <span className="status-blink" style={{ border: '1px solid #10b981', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>current</span>}
                                            </div>

                                            {user.alamat && <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '10px', marginBottom: 0, textTransform: 'uppercase' }}>{user.alamat}</p>}
                                        </div>
                                    </div>

                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0' }}>
                                            <MoreVertical size={20} />
                                        </button>
                                        {activeDropdown === user.id && (
                                            <div ref={dropdownRef} style={dropdownContainer}>
                                                <button onClick={() => openModal(user)} style={dropdownItemS}><Edit size={14}/> Ubah</button>
                                                <button onClick={() => handleDelete(user.id, user.nama_pengguna)} style={{...dropdownItemS, color: '#ef4444'}}><Trash2 size={14}/> Hapus</button>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* TABLE VIEW */
                <div style={{ background: 'white', borderRadius: '15px', overflow: 'visible', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr><th style={thP}>Nama Pengguna</th><th style={thP}>Kontak & Instansi</th><th style={thP}>Status Akun</th><th style={{...thP, textAlign: 'center'}}>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {filteredData.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdP}>
                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{user.nama_pengguna}</div>
                                        <div style={{ fontSize: '0.75rem', color: getTipeBadge(user.tipe_akun).bg, fontWeight: 700, marginTop: '2px', textTransform: 'uppercase' }}>{user.tipe_akun}</div>
                                    </td>
                                    <td style={{...tdP, fontSize: '0.8rem', color: '#475569'}}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{user.instansi || '-'}</div>
                                        <div>{user.email} • {user.telepon || '-'}</div>
                                    </td>
                                    <td style={tdP}>
                                        <span style={{ background: user.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: user.status === 'Aktif' ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>{user.status}</span>
                                    </td>
                                    <td style={{...tdP, textAlign: 'center'}}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button onClick={() => openModal(user)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6' }}><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(user.id, user.nama_pengguna)} style={{ background: '#fef2f2', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL FORM */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{editingId ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20}/></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            
                            <div><label style={labelForm}>Nama / Alias *</label><input type="text" name="nama_pengguna" value={formData.nama_pengguna} onChange={handleInputChange} required style={inputForm} /></div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={labelForm}>Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={inputForm} /></div>
                                <div><label style={labelForm}>Telepon / WA</label><input type="text" name="telepon" value={formData.telepon} onChange={handleInputChange} style={inputForm} /></div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={labelForm}>Label Akun</label>
                                    <select name="tipe_akun" value={formData.tipe_akun} onChange={handleInputChange} style={inputForm}>
                                        <option value="admin">Admin</option>
                                        <option value="cs">CS</option>
                                        <option value="mitra">Mitra</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelForm}>Status Akun</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} style={inputForm}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label style={labelForm}>Instansi / LPK (Opsional)</label>
                                <input type="text" name="instansi" value={formData.instansi} onChange={handleInputChange} placeholder="Cth: LPK DEWATA BALI" style={inputForm} />
                            </div>

                            <div>
                                <label style={labelForm}>Alamat Domisili / Instansi</label>
                                <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} rows="2" style={{...inputForm, resize: 'vertical'}}></textarea>
                            </div>

                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
                            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', background: brandNavy, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>{isLoading ? 'Menyimpan...' : 'Simpan Akun'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

// Styles
const labelForm = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' };
const inputForm = { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#f8fafc' };
const viewBtnS = (active) => ({ padding: '6px 10px', border:'none', borderRadius:'6px', cursor:'pointer', background: active ? 'white' : 'transparent', color: active ? brandNavy : '#94a3b8', transition: '0.2s', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' });
const thP = { padding: '18px 25px', textAlign:'left', fontSize:'0.75rem', textTransform:'uppercase', color:'#94a3b8', letterSpacing: '1px', fontWeight: 800 };
const tdP = { padding: '18px 25px', verticalAlign: 'middle' };

const dropdownContainer = { position: 'absolute', right: '0', top: '25px', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '120px', zIndex: 50, padding: '5px', textAlign: 'left' };
const dropdownItemS = { width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', borderRadius: '4px', transition: 'background 0.2s' };