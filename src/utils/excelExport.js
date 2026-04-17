import * as XLSX from 'xlsx';

/**
 * Fungsi Universal Export ke Excel
 * @param {Array} data - Data mentah dari Supabase
 * @param {String} fileName - Nama file yang diinginkan
 * @param {String} sheetName - Nama sheet di dalam Excel
 */
export const exportToExcel = (data, fileName = 'Laporan_UJC', sheetName = 'Data') => {
    if (!data || data.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }

    // 1. Transformasi Data agar lebih manusiawi di Excel
    const formattedData = data.map((item, index) => ({
        'No': index + 1,
        'Nama Lengkap': item.nama_lengkap || '-',
        'NIK': item.nik || '-',
        'Tahap Sekarang': item.tahap_sekarang || '-',
        'Status Akhir': (item.status_akhir || 'PROSES').toUpperCase(),
        'Perusahaan Tujuan': item.perusahaan_tujuan || 'Belum Ada',
        'Tanggal Daftar': item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
    }));

    // 2. Buat Worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 3. Atur Lebar Kolom Otomatis (Opsional tapi rapi)
    const columnWidths = [
        { wch: 5 },  // No
        { wch: 30 }, // Nama
        { wch: 20 }, // NIK
        { wch: 25 }, // Tahap
        { wch: 15 }, // Status
        { wch: 30 }, // Perusahaan
        { wch: 15 }, // Tanggal
    ];
    worksheet['!cols'] = columnWidths;

    // 4. Buat Workbook dan simpan file
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate file dan trigger download
    XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
};