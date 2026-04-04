import React, { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase"; // Sesuaikan path koneksi Supabase Tuan

export default function ManajemenRole() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  // Daftar modul yang ada di sistem Tuan
  const daftarModul = ['Dashboard', 'Siswa', 'Rekrutmen', 'Mitra', 'User', 'Laporan', 'Pengaturan'];
  
  // Daftar aksi per modul
  const daftarAksi = ['lihat', 'tambah', 'edit', 'hapus', 'cetak'];

  // 1. Ambil daftar Master Role saat halaman dimuat
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data, error } = await supabase.from('master_role').select('*');
    if (!error && data) setRoles(data);
  };

  // 2. Ambil izin akses saat sebuah Role dipilih dari Dropdown
  const handleRoleChange = async (e) => {
    const roleId = e.target.value;
    setSelectedRoleId(roleId);
    
    if (!roleId) {
      setPermissions({});
      return;
    }

    setLoading(true);
    // Ambil data permission untuk role ini
    const { data, error } = await supabase
      .from('role_permission')
      .select('modul, hak_akses')
      .eq('role_id', roleId);

    if (!error && data) {
      // Ubah format array dari DB menjadi object agar mudah dibaca checkbox
      const permObj = {};
      data.forEach(item => {
        permObj[item.modul] = item.hak_akses;
      });
      setPermissions(permObj);
    }
    setLoading(false);
  };

  // 3. Handle saat checkbox dicentang/dihapus centangnya
  const handleCheckboxChange = (modul, aksi, isChecked) => {
    setPermissions(prev => ({
      ...prev,
      [modul]: {
        ...(prev[modul] || {}),
        [aksi]: isChecked
      }
    }));
  };

  // 4. Simpan ke Database
  const handleSimpan = async () => {
    if (!selectedRoleId) return alert("Pilih Role terlebih dahulu!");
    
    setLoading(true);
    
    // Siapkan data untuk di-upsert (insert atau update)
    const upsertData = Object.keys(permissions).map(modul => ({
      role_id: selectedRoleId,
      modul: modul,
      hak_akses: permissions[modul]
    }));

    // Hapus data lama untuk role ini agar bersih, lalu masukkan yang baru
    await supabase.from('role_permission').delete().eq('role_id', selectedRoleId);
    const { error } = await supabase.from('role_permission').insert(upsertData);

    setLoading(false);
    
    if (error) {
      alert("Gagal menyimpan hak akses: " + error.message);
    } else {
      alert("Hak akses berhasil disimpan!");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Manajemen Role & Hak Akses</h2>
      
      {/* Dropdown Pilih Role */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Pilih Role Jabatan:</label>
        <select value={selectedRoleId} onChange={handleRoleChange} style={{ padding: '8px' }}>
          <option value="">-- Pilih Role --</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.nama_role}</option>
          ))}
        </select>
      </div>

      {loading && <p>Memuat data...</p>}

      {/* Tabel Checkbox Matrix */}
      {selectedRoleId && !loading && (
        <>
          <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
            <thead style={{ backgroundColor: '#f4f4f4' }}>
              <tr>
                <th style={{ textAlign: 'left' }}>Modul</th>
                {daftarAksi.map(aksi => <th key={aksi}>{aksi.toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody>
              {daftarModul.map(modul => (
                <tr key={modul}>
                  <td style={{ fontWeight: 'bold' }}>{modul}</td>
                  {daftarAksi.map(aksi => {
                    const isChecked = permissions[modul]?.[aksi] || false;
                    return (
                      <td key={aksi} style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => handleCheckboxChange(modul, aksi, e.target.checked)}
                          style={{ cursor: 'pointer', transform: 'scale(1.5)' }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            onClick={handleSimpan} 
            style={{ padding: '10px 20px', backgroundColor: '#22B14C', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Simpan Hak Akses
          </button>
        </>
      )}
    </div>
  );
}