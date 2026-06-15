import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Edit2, Loader2, X, Briefcase, ChevronLeft, ChevronRight, LayoutList, Upload, Trash2, AlignLeft } from 'lucide-react';

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const getStatusColorMap = (status) => {
    switch (status) {
        case 'COMPLETED': return { bg: '#e0ffe0', color: '#00b840', border: '#a5f3c5' }; // Hijau Cerah
        case 'IN PROGRESS': return { bg: '#e0f0ff', color: '#0055ff', border: '#a3cfff' }; // Biru Cerah
        case 'CANCELLED': return { bg: '#ffebee', color: '#ff1744', border: '#ffb3b3' }; // Merah Cerah
        default: return { bg: '#fff8e1', color: '#f57c00', border: '#ffe0b2' }; // PENDING (Oranye Cerah)
    }
};

const formatYMD = (d) => {
  let year = d.getFullYear();
  if (year < 100) year += 2000; // Pastikan format tahun menjadi 4 digit (misal: 13 -> 2013)
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${month}-${day}`;
};

export default function TimelinePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fileInputRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('CALENDAR'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayViewDate, setDayViewDate] = useState(null); // State Modal Detail Hari

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [formData, setFormData] = useState({
    job_order_id: '',
    kumiai: '',
    kegiatan: '',
    divisi: 'REGULER',
    tanggal_mulai: '',
    tanggal_selesai: '',
    pic_id: '',
    status: 'PENDING'
  });

  // UJC BRAND COLORS
  const brandNavy = '#101869';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil Sesi User Saat Ini untuk Auto-PIC
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: empData } = await supabase.from('employees').select('nama_lengkap').eq('id', session.user.id).maybeSingle();
        setCurrentUser({ ...session.user, nama_lengkap: empData?.nama_lengkap });
      }

      // Fetch Timeline Data
      const { data: timelineData, error: timelineErr } = await supabase
        .from('company_timeline')
        .select(`
          *,
          employees:pic_id (id, nama_lengkap)
        `)
        .order('tanggal_mulai', { ascending: true });
      if (timelineErr) throw timelineErr;
      setSchedules(timelineData || []);

      // Fetch Job Orders untuk Dropdown Link
      const { data: jobData } = await supabase.from('job_orders').select('id, perusahaan, kumiai');
      setJobOrders(jobData || []);

    } catch (err) {
      console.error('Error fetching timeline data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setSelectedSchedule(null);
    setFormData({ 
      job_order_id: '', 
      kumiai: '', 
      kegiatan: '', 
      divisi: 'REGULER', 
      tanggal_mulai: '', 
      tanggal_selesai: '', 
      pic_id: currentUser?.id || '', // OTOMATIS TERISI USER YG LOGIN
      status: 'PENDING' 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      job_order_id: schedule.job_order_id || '',
      kumiai: schedule.kumiai || '',
      kegiatan: schedule.kegiatan || '',
      divisi: schedule.divisi || 'REGULER',
      tanggal_mulai: schedule.tanggal_mulai || '',
      tanggal_selesai: schedule.tanggal_selesai || '',
      pic_id: schedule.pic_id || '',
      status: schedule.status || 'PENDING'
    });
    setIsModalOpen(true);
  };

  const handleJobOrderSelect = (e) => {
    const jobId = e.target.value;
    if (!jobId) {
      setFormData({ ...formData, job_order_id: '' });
      return;
    }
    const selectedJob = jobOrders.find(j => j.id === jobId);
    if (selectedJob) {
      setFormData({ 
        ...formData, 
        job_order_id: jobId, 
        kumiai: selectedJob.kumiai || '', 
        kegiatan: `Job: ${selectedJob.perusahaan}` 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { 
        ...formData, 
        job_order_id: formData.job_order_id || null, 
        pic_id: formData.pic_id || currentUser?.id || null 
      };
      if (selectedSchedule) {
        await supabase.from('company_timeline').update(payload).eq('id', selectedSchedule.id);
        alert('Jadwal berhasil diperbarui!');
      } else {
        await supabase.from('company_timeline').insert([payload]);
        alert('Jadwal baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parser Tanggal Super Fleksibel (Membaca Angka Serial Excel, Teks dengan Spasi, DD/MM/YYYY, dll)
  const parseCSVDate = (dateStr) => {
    if (!dateStr || !String(dateStr).trim()) return null;
    let cleanStr = String(dateStr).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/"/g, '');
    
    // Hapus bagian waktu (jam:menit:detik) tanpa memotong spasi pada format seperti "15 Mei 2026"
    cleanStr = cleanStr.replace(/[\sT]\d{1,2}:\d{2}(:\d{2})?.*$/, '');

    // 1. Cek jika Excel menyimpannya sebagai Angka Serial (misal: 46105)
    if (/^\d{5}$/.test(cleanStr)) {
      const jsDate = new Date(Math.round((Number(cleanStr) - 25569) * 86400 * 1000));
      return formatYMD(jsDate);
    }

    // Terjemahkan bulan Indonesia ke Inggris jika formatnya teks (misal: 15-Mei-2026 -> 15-may-2026)
    const idMonths = { 'januari':'jan', 'februari':'feb', 'maret':'mar', 'april':'apr', 'mei':'may', 'juni':'jun', 'juli':'jul', 'agustus':'aug', 'september':'sep', 'oktober':'oct', 'november':'nov', 'desember':'dec' };
    let enStr = cleanStr.toLowerCase();
    for (const [id, en] of Object.entries(idMonths)) {
        enStr = enStr.replace(new RegExp(id, 'g'), en);
    }

    // Samakan separator spasi, titik, dan garis miring menjadi strip (-)
    let standardizedStr = enStr.replace(/[\s\.\/]/g, '-').replace(/-+/g, '-');

    // 2. Jika formatnya memiliki 3 bagian (Tgl-Bln-Thn)
    if (standardizedStr.includes('-')) {
      const parts = standardizedStr.split('-');
      if (parts.length >= 3) {
        let y = parts[2], m = parts[1], d = parts[0];
        if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; } // YYYY-MM-DD
        else if (!isNaN(parts[1]) && Number(parts[1]) > 12) { m = parts[0]; d = parts[1]; y = parts[2]; } // MM-DD-YYYY
        
        let mNum = Number(m);
        if (isNaN(mNum)) {
            const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
            const mIndex = monthNames.findIndex(mn => String(m).toLowerCase().includes(mn));
            if (mIndex !== -1) mNum = mIndex + 1;
        }

        if (!isNaN(Number(y)) && !isNaN(mNum) && !isNaN(Number(d))) {
           let yNum = Number(y);
           if (yNum < 100) yNum += 2000;
           return `${String(yNum).padStart(4, '0')}-${String(mNum).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
        }
      }
      
      // Jika formatnya hanya 2 bagian (Misal: "Sep-26" atau "Mei 2026")
      if (parts.length === 2) {
        let m = parts[0], y = parts[1];
        if (!isNaN(parts[0]) && parts[0].length >= 4) { y = parts[0]; m = parts[1]; } 
        
        let mNum = Number(m);
        if (isNaN(mNum)) {
            const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
            const mIndex = monthNames.findIndex(mn => String(m).toLowerCase().includes(mn));
            if (mIndex !== -1) mNum = mIndex + 1;
        }
        if (!isNaN(mNum) && !isNaN(Number(y))) {
            let yNum = Number(y);
            if (yNum < 100) yNum += 2000;
            return `${String(yNum).padStart(4, '0')}-${String(mNum).padStart(2, '0')}-01`; // Dianggap tanggal 1
        }
      }
    }

    // 3. Coba parsing Javascript standar
    const d = new Date(standardizedStr);
    if (!isNaN(d.getTime())) return formatYMD(d);
    
    // 4. Gagal parsing
    return null; 
  };

  // ---- LOGIKA HAPUS SEMUA DATA ----
  const handleClearAll = async () => {
    if (window.confirm("PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data jadwal di timeline? Data yang dihapus tidak dapat dikembalikan.")) {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('company_timeline').delete().not('id', 'is', null);
        if (error) throw error;
        alert('Semua data timeline berhasil dikosongkan!');
        fetchData();
      } catch (err) {
        alert('Gagal menghapus data: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ---- LOGIKA IMPORT CSV ----
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSubmitting(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/); // Membaca \r\n dari Windows/Excel
        const payload = [];
        
        let delimiter = ',';
        if (lines.length > 0) {
          const header = lines[0];
          const commas = (header.match(/,/g) || []).length;
          const semicolons = (header.match(/;/g) || []).length;
          const tabs = (header.match(/\t/g) || []).length;
          if (semicolons > commas && semicolons > tabs) delimiter = ';';
          else if (tabs > commas && tabs > semicolons) delimiter = '\t';
        }
        const splitRegex = new RegExp(`${delimiter === ';' ? ';' : delimiter === '\t' ? '\\t' : ','}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
        
        let invalidDateCount = 0;
        let invalidDateSamples = []; 

        // DETEKSI OTOMATIS: Apakah ini Format Kalender Horizontal (Gantt Chart)?
        let isGanttMode = false;
        let dayHeaderIndex = -1;
        let kumiaiColIdx = -1;
        let kegiatanColIdx = -1;

        for (let i = 0; i < Math.min(lines.length, 15); i++) {
          const cols = lines[i].split(splitRegex).map(c => c.replace(/^"|"$/g, '').trim().toUpperCase());
          const kIdx = cols.findIndex(c => c.includes('KUMIAI'));
          const oIdx = cols.findIndex(c => c.includes('ORDER UP') || c.includes('KEGIATAN'));
          
          if (kIdx !== -1 && oIdx !== -1 && cols.length > 10) {
            isGanttMode = true;
            dayHeaderIndex = i;
            kumiaiColIdx = kIdx;
            kegiatanColIdx = oIdx;
            break;
          }
        }

        if (isGanttMode) {
          // PARSER KHUSUS GANTT CHART EXCEL (OTOMATIS KONVERSI KE VERTIKAL)
          const colDates = {}; 
          let currentMonth = 0;
          let currentYear = 0;

          if (dayHeaderIndex > 0) {
            const monthCols = lines[dayHeaderIndex - 1].split(splitRegex).map(c => c.replace(/^"|"$/g, '').trim().toLowerCase());
            const idMonths = { 'januari':1, 'februari':2, 'maret':3, 'april':4, 'mei':5, 'juni':6, 'juli':7, 'agustus':8, 'september':9, 'sep':9, 'oktober':10, 'oct':10, 'november':11, 'nov':11, 'desember':12, 'dec':12 };
            for (let c = 0; c < monthCols.length; c++) {
              const val = monthCols[c];
              if (!val) continue;
              for (const [mName, mNum] of Object.entries(idMonths)) {
                if (val.includes(mName)) {
                  currentMonth = mNum;
                  const matchYear = val.match(/\d{4}/);
                  if (matchYear) currentYear = parseInt(matchYear[0]);
                  else { const matchYr2 = val.match(/\d{2}/); if (matchYr2) currentYear = 2000 + parseInt(matchYr2[0]); }
                  break;
                }
              }
              if (currentMonth > 0) break;
            }
          }

          if (currentMonth === 0) { currentMonth = new Date().getMonth() + 1; currentYear = new Date().getFullYear(); }
          const dayCols = lines[dayHeaderIndex].split(splitRegex).map(c => c.replace(/^"|"$/g, '').trim());
          let prevDay = 0;

          for (let c = 0; c < dayCols.length; c++) {
            const dayVal = parseInt(dayCols[c]);
            if (!isNaN(dayVal) && dayVal >= 1 && dayVal <= 31) {
              if (prevDay > 0 && dayVal < prevDay) {
                currentMonth++;
                if (currentMonth > 12) { currentMonth = 1; currentYear++; }
              }
              colDates[c] = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
              prevDay = dayVal;
            }
          }

          let currentCategory = '';
          for (let i = dayHeaderIndex + 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(splitRegex).map(c => c.replace(/^"|"$/g, '').trim());
            if (cols[0]) currentCategory = cols[0].toUpperCase();
            
            const kumiai = cols[kumiaiColIdx] || '';
            const kegiatan = cols[kegiatanColIdx] || '';
            
            if (kumiai.toUpperCase().includes('GLOSARIUM') || kegiatan.toUpperCase().includes('GLOSARIUM') || currentCategory.includes('GLOSARIUM')) break;
            if (!kumiai && !kegiatan) continue; 
            if (kumiai.toUpperCase() === 'KUMIAI') continue; 
            
            // 1. PENENTUAN DIVISI BERDASARKAN STRUKTUR CSV
            let divisi = 'REKRUTMEN';
            if (currentCategory.includes('教育') || currentCategory.includes('PASCA') || currentCategory.includes('PENDIDIKAN')) {
                divisi = 'PENDIDIKAN';
            }

            // 2. PENENTUAN STATUS BERDASARKAN KATEGORI JEPANG DI CSV ANDA
            let status = 'PENDING'; 
            if (currentCategory.includes('終了') || currentCategory.includes('SELESAI')) {
                status = 'COMPLETED';
            } else if (currentCategory.includes('キャンセル') || currentCategory.includes('中止') || currentCategory.includes('BATAL')) {
                status = 'CANCELLED';
            } else if (
                currentCategory.includes('選考') ||           // Seleksi
                currentCategory.includes('履歴書送付済') || // CV Dikirim
                currentCategory.includes('面接待ち') ||     // Nunggu Mensetsu
                currentCategory.includes('結果待ち') ||     // Nunggu Hasil
                currentCategory.includes('教育中') ||       // Sedang Pendidikan
                currentCategory.includes('中') || 
                currentCategory.includes('PROSES')
            ) {
                status = 'IN PROGRESS';
            }

            let currentEvent = null, currentEventStart = null, currentEventEnd = null;
            for (let c = 0; c < cols.length; c++) {
              if (colDates[c]) {
                const cellVal = cols[c];
                if (cellVal) {
                  if (currentEvent === cellVal) { currentEventEnd = colDates[c]; } 
                  else {
                    if (currentEvent) payload.push({ kumiai: kumiai || '-', kegiatan: `[${currentEvent}] ${kegiatan}`.trim(), tanggal_mulai: currentEventStart, tanggal_selesai: currentEventEnd, divisi, status, pic_id: currentUser?.id || null });
                    currentEvent = cellVal; currentEventStart = colDates[c]; currentEventEnd = colDates[c];
                  }
                } else {
                  if (currentEvent) {
                    payload.push({ kumiai: kumiai || '-', kegiatan: `[${currentEvent}] ${kegiatan}`.trim(), tanggal_mulai: currentEventStart, tanggal_selesai: currentEventEnd, divisi, status, pic_id: currentUser?.id || null });
                    currentEvent = null;
                  }
                }
              }
            }
            if (currentEvent) payload.push({ kumiai: kumiai || '-', kegiatan: `[${currentEvent}] ${kegiatan}`.trim(), tanggal_mulai: currentEventStart, tanggal_selesai: currentEventEnd, divisi, status, pic_id: currentUser?.id || null });
          }

        } else {
          // PARSER TABEL VERTIKAL STANDAR
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(splitRegex).map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length >= 2) {
              let dStartIndex = 2; // Default (Kolom ke-3)
              for (let j = 1; j < Math.min(cols.length, 5); j++) {
                if (parseCSVDate(cols[j])) { dStartIndex = j; break; }
              }
              
              const tMulaiStr = cols[dStartIndex];
              const tSelesaiStr = cols[dStartIndex + 1] && cols[dStartIndex + 1].trim() ? cols[dStartIndex + 1] : tMulaiStr;
              
              const pMulai = parseCSVDate(tMulaiStr);
              const pSelesai = parseCSVDate(tSelesaiStr);
              
              if (!pMulai) {
                  invalidDateCount++;
                  if (invalidDateSamples.length < 5) invalidDateSamples.push(`"${tMulaiStr}"`);
              }

              payload.push({
                kumiai: cols[dStartIndex - 2] || '-',
                kegiatan: cols[dStartIndex - 1] || 'Tanpa Nama',
                tanggal_mulai: pMulai || formatYMD(new Date()),
                tanggal_selesai: pSelesai || pMulai || formatYMD(new Date()),
                divisi: cols[dStartIndex + 2] || 'REGULER',
                status: cols[dStartIndex + 3] || 'PENDING',
                pic_id: currentUser?.id || null
              });
            }
          }
        }
        
        if (payload.length > 0) {
          const { error } = await supabase.from('company_timeline').insert(payload);
          if (error) throw error;
          
          let alertMsg = `Berhasil mengimpor ${payload.length} jadwal kegiatan!`;
          if (invalidDateCount > 0) alertMsg += `\n\nPERINGATAN: Ada ${invalidDateCount} baris jadwal yang format tanggalnya gagal dibaca (kosong atau tidak sesuai) sehingga otomatis dipindahkan ke tanggal hari ini.\n\nContoh teks yang gagal dibaca: ${invalidDateSamples.join(', ')}`;
          alert(alertMsg);
          fetchData();
        } else alert('File CSV kosong atau format tidak sesuai.');
      } catch (err) { alert("Error Impor CSV: " + err.message); } 
      finally { setIsSubmitting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsText(file);
  };

  // Grouping timeline by Kuartal (Per 3 Bulan)
  const groupedSchedules = schedules.reduce((acc, curr) => {
    const d = new Date(curr.tanggal_mulai);
    if (isNaN(d.getTime())) {
      if (!acc['Tidak Diketahui']) acc['Tidak Diketahui'] = [];
      acc['Tidak Diketahui'].push(curr);
      return acc;
    }
    const month = d.getMonth();
    const year = d.getFullYear();
    let label = '';
    if (month < 3) label = `Q1 (Januari - Maret) ${year}`;
    else if (month < 6) label = `Q2 (April - Juni) ${year}`;
    else if (month < 9) label = `Q3 (Juli - September) ${year}`;
    else label = `Q4 (Oktober - Desember) ${year}`;
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(curr);
    return acc;
  }, {});
  
  const sortedGroups = Object.entries(groupedSchedules).sort((a, b) => {
    if (a[0] === 'Tidak Diketahui') return 1;
    if (b[0] === 'Tidak Diketahui') return -1;
    return new Date(a[1][0].tanggal_mulai) - new Date(b[1][0].tanggal_mulai);
  });

  // ---- LOGIKA KALENDER ----
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (viewMode === 'GANTT' ? 3 : 1), 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - (viewMode === 'GANTT' ? 3 : 1), 1));
  const today = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); 

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));
  const totalSlots = Math.ceil(calendarDays.length / 7) * 7;
  while (calendarDays.length < totalSlots) calendarDays.push(null);

  const getEventsForDay = (date) => {
    if (!date) return [];
    const dStr = formatYMD(date);
    return schedules.filter(s => dStr >= s.tanggal_mulai && dStr <= (s.tanggal_selesai || s.tanggal_mulai));
  };
  
  const handleDayClick = (date) => {
    if(!date) return;
    setDayViewDate(date);
  };

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <button 
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'white', border: '1px solid #cbd5e1', color: '#475569',
            fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', marginBottom: '20px',
            fontSize: '0.9rem', width: 'fit-content', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <ArrowLeft size={18} /> Kembali
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: brandNavy, margin: '0 0 5px 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={32} color="#3b82f6" /> Global Timeline
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Manajemen jadwal terpusat & integrasi Job Order ERP.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setViewMode('CALENDAR')} style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', background: viewMode === 'CALENDAR' ? 'white' : 'transparent', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: viewMode === 'CALENDAR' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: viewMode === 'CALENDAR' ? '#3b82f6' : '#64748b', transition: 'all 0.2s' }}><Calendar size={16}/> Kalender</button>
              <button onClick={() => setViewMode('GANTT')} style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', background: viewMode === 'GANTT' ? 'white' : 'transparent', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: viewMode === 'GANTT' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: viewMode === 'GANTT' ? '#3b82f6' : '#64748b', transition: 'all 0.2s' }}><AlignLeft size={16}/> Tabel Excel</button>
              <button onClick={() => setViewMode('LIST')} style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', background: viewMode === 'LIST' ? 'white' : 'transparent', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: viewMode === 'LIST' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: viewMode === 'LIST' ? '#3b82f6' : '#64748b', transition: 'all 0.2s' }}><LayoutList size={16}/> Daftar Tabel</button>
            </div>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} style={{ display: 'none' }} />
            <button onClick={handleClearAll} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 15px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} title="Hapus Semua Data"><Trash2 size={18} /> Kosongkan</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: 'white', color: '#10b981', border: '1px solid #10b981', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={18} /> Import CSV</button>
            <button onClick={handleCreate} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Tambah Kegiatan</button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}><Loader2 className="animate-spin" size={40} style={{margin:'0 auto'}}/> Memuat timeline...</div>
        ) : Object.keys(groupedSchedules).length === 0 ? (
          <div style={{ background: 'white', padding: '50px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0', fontWeight: 600 }}>Belum ada data timeline. Silakan buat kegiatan baru.</div>
        ) : viewMode === 'CALENDAR' || viewMode === 'GANTT' ? (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            {/* Header Kalender */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                {viewMode === 'GANTT' 
                  ? `Kuartal ${Math.floor(currentDate.getMonth() / 3) + 1} - ${currentDate.getFullYear()}` 
                  : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={prevMonth} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#475569' }}><ChevronLeft size={20}/></button>
                <button onClick={today} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 15px', cursor: 'pointer', fontWeight: 800, color: '#475569' }}>Hari Ini</button>
                <button onClick={nextMonth} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#475569' }}><ChevronRight size={20}/></button>
              </div>
            </div>
            
            {viewMode === 'CALENDAR' ? (
            <React.Fragment>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
               {daysOfWeek.map(d => <div key={d} style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
               {calendarDays.map((day, idx) => {
                 if (!day) return <div key={`empty-${idx}`} style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', minHeight: '120px' }}></div>;
                 const evts = getEventsForDay(day);
                 const isToday = formatYMD(day) === formatYMD(new Date());
                 return (
                   <div key={idx} onClick={() => handleDayClick(day)} style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', minHeight: '120px', padding: '12px', cursor: 'pointer', background: isToday ? '#eff6ff' : 'white', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                     <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                       <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isToday ? '#2563eb' : '#64748b', background: isToday ? '#bfdbfe' : 'transparent', padding: isToday ? '2px 8px' : '2px', borderRadius: '10px' }}>{day.getDate()}</span>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                       {evts.slice(0, 3).map(evt => {
                         const isCancelled = evt.status === 'CANCELLED';
                         const colors = getStatusColorMap(evt.status);
                         const shortStatus = evt.status === 'IN PROGRESS' ? 'PROGRESS' : evt.status;
                         return (
                           <div key={evt.id} style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`, padding: '3px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: isCancelled ? 0.6 : 1 }} title={`${evt.kegiatan} - ${evt.kumiai || ''}${isCancelled ? ' (BATAL)' : ''}`}>
                             <span style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>[{shortStatus}] {evt.kegiatan}</span>
                           </div>
                         )
                       })}
                       {evts.length > 3 && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textAlign: 'center' }}>+{evts.length - 3} lainnya</span>}
                     </div>
                   </div>
                 )
               })}
            </div>
            </React.Fragment>
            ) : (
            <div style={{ overflowX: 'auto', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 'max-content' }}>
                {(() => {
                  // Logika Kuartal (3 Bulan)
                  const qStartMonth = Math.floor(month / 3) * 3;
                  const monthsData = [];
                  const ganttDays = [];
                  for (let m = 0; m < 3; m++) {
                      const currentM = qStartMonth + m;
                      const daysInM = new Date(year, currentM + 1, 0).getDate();
                      monthsData.push({ monthIndex: currentM, name: monthNames[currentM], days: daysInM });
                      for (let d = 1; d <= daysInM; d++) {
                          ganttDays.push({ year: year, month: currentM, day: d, dStr: formatYMD(new Date(year, currentM, d)) });
                      }
                  }
                  
                  const startOfQuarterStr = ganttDays[0].dStr;
                  const endOfQuarterStr = ganttDays[ganttDays.length - 1].dStr;
                  const quarterSchedules = schedules.filter(s => s.tanggal_mulai <= endOfQuarterStr && (s.tanggal_selesai || s.tanggal_mulai) >= startOfQuarterStr);

                  return (
                      <>
                          <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                  <th rowSpan="2" style={{ padding: '12px 15px', fontSize: '0.8rem', color: '#64748b', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 30, minWidth: '150px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontWeight: 800 }}>KUMIAI</th>
                                  <th rowSpan="2" style={{ padding: '12px 15px', fontSize: '0.8rem', color: '#64748b', position: 'sticky', left: '150px', background: '#f8fafc', zIndex: 30, minWidth: '250px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontWeight: 800 }}>KEGIATAN / ORDER UP</th>
                                  {monthsData.map((mData, idx) => (
                                      <th key={idx} colSpan={mData.days} style={{ padding: '8px 0', fontSize: '0.85rem', color: '#1e293b', textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontWeight: 900, background: '#f1f5f9' }}>
                                          {mData.name} {year}
                                      </th>
                                  ))}
                              </tr>
                              <tr style={{ background: '#f8fafc' }}>
                                  {ganttDays.map((dObj, idx) => (
                                      <th key={idx} style={{ padding: '8px 0', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', minWidth: '30px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', fontWeight: 800, background: '#f8fafc' }}>
                                          {dObj.day}
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody>
                              {quarterSchedules.length === 0 ? (
                                  <tr><td colSpan={ganttDays.length + 2} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Tidak ada kegiatan di kuartal ini.</td></tr>
                              ) : (
                                  (() => {
                                      // Menggabungkan jadwal yang memiliki Kumiai dan Job Order yang sama ke dalam satu baris
                                      const groupedGanttSchedules = Object.values(quarterSchedules.reduce((acc, evt) => {
                                          const baseKegiatan = evt.kegiatan.replace(/^\[.*?\]\s*/, ''); // Hilangkan awalan seperti [O], [P]
                                          const key = `${evt.kumiai}_${baseKegiatan}`;
                                          if (!acc[key]) acc[key] = { kumiai: evt.kumiai, baseKegiatan, events: [] };
                                          acc[key].events.push(evt);
                                          return acc;
                                      }, {}));

                                      return groupedGanttSchedules.map((group, groupIdx) => (
                                          <tr key={groupIdx}>
                                              <td style={{ padding: '8px 15px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', position: 'sticky', left: 0, background: 'white', zIndex: 10, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #f1f5f9' }}>{group.kumiai || '-'}</td>
                                              <td style={{ padding: '8px 15px', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', position: 'sticky', left: '150px', background: 'white', zIndex: 10, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #f1f5f9' }} title={group.baseKegiatan}>{group.baseKegiatan}</td>
                                              {ganttDays.map((dObj, idx) => {
                                                  const dStr = dObj.dStr;
                                                  const isWeekend = new Date(dObj.year, dObj.month, dObj.day).getDay() % 6 === 0;
                                                  const activeEvents = group.events.filter(e => dStr >= e.tanggal_mulai && dStr <= (e.tanggal_selesai || e.tanggal_mulai));
                                                  
                                                  return (
                                                      <td key={idx} 
                                                          onClick={() => {
                                                              setSelectedSchedule(null);
                                                              setFormData({ 
                                                                  job_order_id: group.events[0]?.job_order_id || '', 
                                                                  kumiai: group.kumiai || '', 
                                                                  kegiatan: group.baseKegiatan || '', 
                                                                  divisi: group.events[0]?.divisi || 'REGULER', 
                                                                  tanggal_mulai: dStr, 
                                                                  tanggal_selesai: dStr, 
                                                                  pic_id: currentUser?.id || '', 
                                                                  status: 'PENDING' 
                                                              });
                                                              setIsModalOpen(true);
                                                          }}
                                                          style={{ padding: '4px 0', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', textAlign: 'center', background: isWeekend ? '#fafafa' : 'white', verticalAlign: 'top', cursor: 'cell' }}
                                                      >
                                                          {activeEvents.map((evt, eIdx) => {
                                                              const colors = getStatusColorMap(evt.status);
                                                              const isCancelled = evt.status === 'CANCELLED';
                                                              const isStart = dStr === evt.tanggal_mulai;
                                                              const isEnd = dStr === (evt.tanggal_selesai || evt.tanggal_mulai);
                                                              const prefix = evt.kegiatan.match(/^\[.*?\]/)?.[0] || '';
                                                              
                                                              return (
                                                                  <div key={evt.id} onClick={(e) => { e.stopPropagation(); handleEdit(evt); }} style={{ height: '24px', background: colors.bg, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, borderLeft: isStart ? `1px solid ${colors.border}` : 'none', borderRight: isEnd ? `1px solid ${colors.border}` : 'none', borderRadius: (isStart && isEnd) ? '6px' : isStart ? '6px 0 0 6px' : isEnd ? '0 6px 6px 0' : '0', opacity: isCancelled ? 0.4 : 1, cursor: 'pointer', margin: `0 -1px ${eIdx < activeEvents.length - 1 ? '4px' : '0'} -1px`, position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: isStart ? 'flex-start' : 'center', overflow: 'hidden' }} title={`[${evt.status}] ${evt.kegiatan}`}>
                                                                      {isStart && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: colors.color, paddingLeft: '4px', whiteSpace: 'nowrap' }}>{prefix}</span>}
                                                                  </div>
                                                              )
                                                          })}
                                                      </td>
                                                  )
                                              })}
                                          </tr>
                                      ));
                                  })()
                              )}
                          </tbody>
                      </>
                  );
                })()}
              </table>
            </div>
            )}
            
            {/* KETERANGAN WARNA / LEGEND */}
            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#64748b', minWidth: '180px' }}>KETERANGAN STATUS:</span>
                {['PENDING', 'IN PROGRESS', 'COMPLETED', 'CANCELLED'].map(stat => {
                  const colors = getStatusColorMap(stat);
                  const desc = stat === 'PENDING' ? 'Belum Dimulai (求人票 / 教育待ち)' : stat === 'IN PROGRESS' ? 'Sedang Proses (選考 / 面接待ち / 教育中)' : stat === 'COMPLETED' ? 'Telah Selesai (終了)' : 'Dibatalkan (キャンセル / 中止)';
                  return (
                    <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.color, boxShadow: `0 0 0 2px ${colors.bg}`, opacity: stat === 'CANCELLED' ? 0.5 : 1 }}></span>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>{stat}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {sortedGroups.map(([periodLabel, items]) => (
              <div key={periodLabel} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ background: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} color="#475569" />
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#334155', letterSpacing: '1px', textTransform: 'uppercase' }}>{periodLabel}</h2>
                  <span style={{ background: '#e0e7ff', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>{items.length} Kegiatan</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        <th style={{ padding: '15px 20px', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Kegiatan / Order Up</th>
                        <th style={{ padding: '15px 20px', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Kumiai</th>
                        <th style={{ padding: '15px 20px', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>PIC / Penginput</th>
                        <th style={{ padding: '15px 20px', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Periode Berjalan</th>
                        <th style={{ padding: '15px 20px', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '15px 20px', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: item.status === 'CANCELLED' ? 0.6 : 1 }}>
                          <td style={{ padding: '15px 20px', color: '#0f172a', fontWeight: 800 }}>
                            <span style={{ textDecoration: item.status === 'CANCELLED' ? 'line-through' : 'none' }}>{item.kegiatan}</span>
                            {item.job_order_id && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', marginLeft: '10px' }}><Briefcase size={12}/> Link Job Order</span>}
                          </td>
                          <td style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>{item.kumiai || '-'}</td>
                          <td style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>{item.employees?.nama_lengkap || '-'}</td>
                          <td style={{ padding: '15px 20px', color: '#475569', fontSize: '0.9rem' }}>
                            <b>{new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</b> s/d <b>{new Date(item.tanggal_selesai || item.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</b>
                          </td>
                          <td style={{ padding: '15px 20px' }}>
                            {(() => {
                              const colors = getStatusColorMap(item.status || 'PENDING');
                              return (
                                <span style={{
                                  padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                                  background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`
                                }}>
                                  {item.status || 'PENDING'}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                            <button onClick={() => handleEdit(item)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Edit2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DAY VIEW (DETAIL JADWAL HARIAN) */}
        {dayViewDate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div style={{ background: '#f8fafc', padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                  Jadwal: {dayViewDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => setDayViewDate(null)} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
              </div>
              <div style={{ padding: '20px 30px', overflowY: 'auto', flex: 1 }}>
                {getEventsForDay(dayViewDate).length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0', fontWeight: 600 }}>Tidak ada kegiatan pada tanggal ini.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {getEventsForDay(dayViewDate).map(evt => {
                       const isCancelled = evt.status === 'CANCELLED';
                       const colors = getStatusColorMap(evt.status);
                       return (
                         <div key={evt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', background: isCancelled ? '#f8fafc' : 'white', opacity: isCancelled ? 0.7 : 1 }}>
                           <div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                               <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.color, display: 'inline-block' }}></span>
                               <span style={{ fontSize: '0.75rem', fontWeight: 800, color: colors.color, textTransform: 'uppercase' }}>{evt.status} {isCancelled && '(BATAL)'}</span>
                             </div>
                             <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px', textDecoration: isCancelled ? 'line-through' : 'none' }}>{evt.kegiatan}</div>
                             <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Kumiai: {evt.kumiai || '-'} | PIC: {evt.employees?.nama_lengkap || '-'}</div>
                           </div>
                           <button onClick={() => handleEdit(evt)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}><Edit2 size={16}/></button>
                         </div>
                       );
                    })}
                  </div>
                )}
              </div>
              <div style={{ padding: '20px 30px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { const dStr = formatYMD(dayViewDate); setSelectedSchedule(null); setFormData({ job_order_id: '', kumiai: '', kegiatan: '', divisi: 'REGULER', tanggal_mulai: dStr, tanggal_selesai: dStr, pic_id: currentUser?.id || '', status: 'PENDING' }); setIsModalOpen(true); }} style={{ background: '#3b82f6', color: 'white', padding: '12px 25px', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Tambah Kegiatan Baru</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FORM TIMELINE (INTERNAL) */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '700px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ background: '#f8fafc', padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>{selectedSchedule ? 'Edit Kegiatan Timeline' : 'Tambah Kegiatan Baru'}</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
                
                <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '15px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e40af', marginBottom: '8px' }}>Tautkan ke Job Order (Opsional)</label>
                  <select value={formData.job_order_id} onChange={handleJobOrderSelect} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
                    <option value="">-- Tidak ditautkan (Kegiatan Internal LPK) --</option>
                    {jobOrders.map(jo => (
                      <option key={jo.id} value={jo.id}>{jo.perusahaan} ({jo.kumiai || 'Tanpa Kumiai'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Kumiai</label><input required type="text" value={formData.kumiai} onChange={(e) => setFormData({...formData, kumiai: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="Nama Kumiai..." /></div>
                  <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Kegiatan / Order Up</label><input required type="text" value={formData.kegiatan} onChange={(e) => setFormData({...formData, kegiatan: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="Deskripsi Kegiatan..." /></div>
                  
                  <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Tanggal Mulai</label><input required type="date" value={formData.tanggal_mulai} onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Tanggal Selesai</label><input required type="date" value={formData.tanggal_selesai} onChange={(e) => setFormData({...formData, tanggal_selesai: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>PIC / Penginput</label>
                    <input readOnly value={selectedSchedule?.employees?.nama_lengkap || currentUser?.nama_lengkap || 'Akun Anda'} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#64748b', fontWeight: 700 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Status Saat Ini</label>
                    <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                      <option value="PENDING">PENDING</option><option value="IN PROGRESS">IN PROGRESS</option><option value="COMPLETED">COMPLETED</option><option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'white', color: '#64748b', padding: '12px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
                  <button type="submit" disabled={isSubmitting} style={{ background: '#3b82f6', color: 'white', padding: '12px 25px', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Kegiatan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
