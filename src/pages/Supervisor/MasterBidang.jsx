import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Loader2, Layers } from 'lucide-react';

const brandNavy = '#101869';

export default function MasterBidang() {
    const [bidang, setBidang] = useState([]);
    const [newBidang, setNewBidang] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchBidang(); }, []);

    const fetchBidang = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('master_bidang').select('*').order('nama_bidang', { ascending: true });
        if (!error && data) setBidang(data);
        setIsLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if(!newBidang.trim()) return;
        setIsSubmitting(true);
        const { error } = await supabase.from('master_bidang').insert([{ nama_bidang: newBidang.toUpperCase() }]);
        setIsSubmitting(false);
        if (error) {
            alert("Gagal menambahkan. Pastikan nama bidang belum ada.");
        } else { 
            setNewBidang(''); 
            fetchBidang(); 
        }
    };

    const handleDelete = async (id, nama) => {
        if(!window.confirm(`Yakin ingin menghapus bidang: ${nama}?`)) return;
        const { error } = await supabase.from('master_bidang').delete().eq('id', id);
        if(!error) fetchBidang();
        else alert("Gagal menghapus data.");
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
                        style={{ flex: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc' }} 
                    />
                    <button type="submit" disabled={isSubmitting} style={{ background: brandNavy, color: 'white', border: 'none', padding: '0 25px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                <button onClick={() => handleDelete(b.id, b.nama_bidang)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
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