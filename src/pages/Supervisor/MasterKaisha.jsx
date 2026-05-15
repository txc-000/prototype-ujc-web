import React, { useState, useEffect, useRef } from 'react';
import { supervisorService } from '../../services/supervisorService'; 
import { Search, Plus, MoreVertical, Edit, Trash2, X, Building2, MapPin, Phone, Mail, Briefcase, CheckCircle2, Users, FileText } from 'lucide-react';

// IMPORT STYLES SENTRAL
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

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
            const data = await supervisorService.getKaishaWithStats();
            setKaishaList(data);
        } catch (error) {
            console.error("Gagal memuat data:", error.message);
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
            await supervisorService.saveKaisha(formData, editingId);
            alert(editingId ? 'Data Kaisha berhasil diperbarui!' : 'Data Kaisha baru berhasil ditambahkan!');
            setIsModalOpen(false);
            fetchData();
        } catch (error) { 
            alert('Error: ' + error.message); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus Kaisha ${nama} secara permanen?`)) return;
        try {
            await supervisorService.deleteKaisha(id);
            alert('Data berhasil dihapus!');
            setActiveDropdown(null);
            fetchData();
        } catch (error) { 
            alert('Error: ' + error.message); 
        }
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
                    <p style={{ color: '#64748b', margin: 0 }}>Kelola profil perusahaan dan pantau statistik penempatan siswa.</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                        <input type="text" placeholder="Cari Kaisha / Kumiai..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...styles.inp, paddingLeft: '45px', width: '280px' }} />
                    </div>
                    <button onClick={() => openModal()} style={styles.btnPrimary}>
                        <Plus size={18} /> Tambah Kaisha
                    </button>
                </div>
            </header>

            {isLoading && kaishaList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}>Menyinkronkan data...</div>
            ) : filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', color: '#64748b', fontWeight: 600 }}>Belum ada data Kaisha yang cocok.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredData.map(kaisha => (
                        <div key={kaisha.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: brandNavy, flexShrink: 0 }}>
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 800, textTransform: 'uppercase' }}>{kaisha.nama_perusahaan}</h3>
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
                                        <div ref={dropdownRef} style={{ ...styles.dropdownContainer, right: '0', top: '25px', width: '140px' }}>
                                            <button onClick={() => openModal(kaisha)} style={styles.dropdownItemS}><Edit size={14} /> Lengkapi Data</button>
                                            <button onClick={() => handleDelete(kaisha.id, kaisha.nama_perusahaan)} style={{ ...styles.dropdownItemS, color: '#ef4444' }}><Trash2 size={14} /> Hapus</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', margin: '5px 0 15px 0', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#64748b', marginBottom: '3px' }}><FileText size={14}/></div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: brandNavy }}>{kaisha.stats?.joCount || 0}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Job Order</div>
                                </div>
                                <div style={{ width: '1px', background: '#cbd5e1' }}></div>
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#64748b', marginBottom: '3px' }}><Users size={14}/></div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>{kaisha.stats?.studentCount || 0}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Siswa Aktif</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}><Briefcase size={14}/> <span style={{fontWeight: 600, color:'#334155'}}>{kaisha.bidang_industri || '-'}</span></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}><Phone size={14}/> <span>{kaisha.no_telepon || '-'}</span> <span style={{color: '#cbd5e1'}}>•</span> <span>{kaisha.penanggung_jawab || '-'}</span></div>
                                {kaisha.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}><Mail size={14}/> <span>{kaisha.email}</span></div>}
                                {kaisha.alamat && <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}><MapPin size={14} style={{marginTop:'3px', flexShrink: 0}}/> <span style={{lineHeight: 1.4}}>{kaisha.alamat}</span></div>}
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Status Kemitraan:</span>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: kaisha.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: kaisha.status === 'Aktif' ? '#166534' : '#991b1b' }}>{kaisha.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <form onSubmit={handleSubmit} style={{ ...styles.modalContent, width: '600px', padding: '30px' }}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{editingId ? 'Lengkapi Profil Kaisha' : 'Tambah Master Kaisha Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={styles.closeBtn}><X size={20} color="#64748b" /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={styles.lb}>Nama Perusahaan (Kaisha) *</label><input type="text" name="nama_perusahaan" value={formData.nama_perusahaan} onChange={handleInputChange} required style={styles.inp} placeholder="Contoh: TOYOTA CORP" /></div>
                                <div><label style={styles.lb}>Nama Kumiai</label><input type="text" name="nama_kumiai" value={formData.nama_kumiai} onChange={handleInputChange} style={styles.inp} placeholder="Contoh: JITCO" /></div>
                            </div>
                            
                            <div><label style={styles.lb}>Bidang Industri</label><input type="text" name="bidang_industri" value={formData.bidang_industri} onChange={handleInputChange} style={styles.inp} placeholder="Contoh: Manufaktur / Pertanian / Perawat" /></div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div><label style={styles.lb}>Penanggung Jawab (PIC)</label><input type="text" name="penanggung_jawab" value={formData.penanggung_jawab} onChange={handleInputChange} style={styles.inp} placeholder="Nama PIC" /></div>
                                <div><label style={styles.lb}>No. Telepon / Kantor</label><input type="text" name="no_telepon" value={formData.no_telepon} onChange={handleInputChange} style={styles.inp} /></div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div><label style={styles.lb}>Email Perusahaan</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} style={styles.inp} /></div>
                                <div><label style={styles.lb}>Status Kemitraan</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} style={styles.inp}>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                        <option value="Blacklist">Blacklist</option>
                                    </select>
                                </div>
                            </div>

                            <div><label style={styles.lb}>Alamat Lengkap di Jepang</label><textarea name="alamat" value={formData.alamat} onChange={handleInputChange} rows="3" style={{ ...styles.inp, resize: 'vertical' }}></textarea></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>Batal</button>
                            <button type="submit" disabled={isLoading} style={styles.btnPrimary}>{isLoading ? 'Menyimpan...' : 'Simpan Kaisha'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}