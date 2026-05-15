import React, { useState, useEffect } from 'react';
import { supervisorService } from '../../services/supervisorService'; 
import { Plus, Trash2, Loader2, Layers } from 'lucide-react';

// IMPORT STYLES SENTRAL
import { styles, brandNavy } from '../Reguler/components/dashboardStyles';

export default function MasterBidang() {
    const [bidang, setBidang] = useState([]);
    const [newBidang, setNewBidang] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchBidang(); }, []);

    const fetchBidang = async () => {
        setIsLoading(true);
        try {
            const data = await supervisorService.getMasterBidangList();
            setBidang(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if(!newBidang.trim()) return;
        setIsSubmitting(true);
        
        try {
            await supervisorService.addMasterBidang(newBidang);
            setNewBidang(''); 
            fetchBidang(); 
        } catch (error) {
            alert("Gagal menambahkan. Pastikan nama bidang belum ada.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, nama) => {
        if(!window.confirm(`Yakin ingin menghapus bidang: ${nama}?`)) return;
        
        try {
            await supervisorService.deleteMasterBidang(id);
            fetchBidang();
        } catch (error) {
            alert("Gagal menghapus data.");
        }
    };

    return (
        <div className="fade-in">
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px' }}>
                    <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}><Layers size={22} color={brandNavy} /> Master Bidang / Jurusan</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Kelola daftar keahlian/jurusan yang akan dipilih saat mendaftarkan siswa baru.</p>
                </div>

                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                    <input 
                        type="text" 
                        placeholder="Contoh: TEKNIK PENGELASAN" 
                        value={newBidang} 
                        onChange={(e) => setNewBidang(e.target.value)} 
                        required
                        style={{ ...styles.inp, flex: 1 }} 
                    />
                    <button type="submit" disabled={isSubmitting} style={{ ...styles.btnPrimary, padding: '0 25px' }}>
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Tambah Bidang</>}
                    </button>
                </form>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}><Loader2 className="animate-spin" color={brandNavy} /></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                        {bidang.map(b => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 15px', borderRadius: '8px' }}>
                                <span style={{ fontWeight: 700, color: '#334155' }}>{b.nama_bidang}</span>
                                <button onClick={() => handleDelete(b.id, b.nama_bidang)} style={styles.btnDel}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}