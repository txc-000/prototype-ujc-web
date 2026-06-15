import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Loader2, LayoutList, Upload, Trash2, AlignLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { monthNames, getStatusColorMap, formatYMD, parseCSVDate } from './Timeline/utils';
import { CalendarView, GanttView, ListView } from './Timeline/TimelineViews';
import { DayViewModal, FormModal } from './Timeline/TimelineModals';


export default function TimelinePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fileInputRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('CALENDAR'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayViewDate, setDayViewDate] = useState(null); // State Modal Detail Hari

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // State untuk Chat & Forward Tugas
  const [discussions, setDiscussions] = useState([]);
  const [discussionForm, setDiscussionForm] = useState({ message: '', receiver_id: '' });

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
        const { data: empData } = await supabase.from('employees').select('nama_lengkap, master_role(nama_role)').eq('id', session.user.id).maybeSingle();
        setCurrentUser({ ...session.user, nama_lengkap: empData?.nama_lengkap, role_name: empData?.master_role?.nama_role });
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

      // Fetch Semua Pegawai untuk opsi Forward
      const { data: allEmp } = await supabase.from('employees').select('id, nama_lengkap').order('nama_lengkap');
      setEmployees(allEmp || []);

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
  
  const handleAddNewEvent = (dateOrStr, group = null) => {
      let dStr = typeof dateOrStr === 'string' ? dateOrStr : formatYMD(dateOrStr);
      setSelectedSchedule(null);
      if (group) {
          setFormData({ 
              job_order_id: group.events[0]?.job_order_id || '', kumiai: group.kumiai || '', 
              kegiatan: group.baseKegiatan || '', divisi: group.events[0]?.divisi || 'REGULER', 
              tanggal_mulai: dStr, tanggal_selesai: dStr, pic_id: currentUser?.id || '', status: 'PENDING' 
          });
      } else {
          setFormData({ 
              job_order_id: '', kumiai: '', kegiatan: '', divisi: 'REGULER', 
              tanggal_mulai: dStr, tanggal_selesai: dStr, pic_id: currentUser?.id || '', status: 'PENDING' 
          });
      }
      setIsModalOpen(true);
      if (typeof dateOrStr !== 'string') setDayViewDate(null); 
  };

  const handleEdit = async (schedule) => {
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
    
    // Load diskusi/forward terkait jadwal ini
    const { data } = await supabase.from('timeline_discussions').select('*').eq('timeline_id', schedule.id).order('created_at', { ascending: true });
    setDiscussions(data || []);
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

  // FUNGSI FORWARD TUGAS / CHAT
  const handleForward = async () => {
    if (!discussionForm.message || !discussionForm.receiver_id) return;
    setIsSubmitting(true);
    try {
        const receiver = employees.find(e => e.id === discussionForm.receiver_id);
        const payload = {
            timeline_id: selectedSchedule.id,
            sender_name: currentUser.nama_lengkap || 'Admin',
            receiver_id: receiver.id,
            receiver_name: receiver.nama_lengkap,
            message: discussionForm.message
        };
        
        await supabase.from('timeline_discussions').insert([payload]);
        
        // Otomatis ubah PIC / Penanggung jawab jadwal ini ke penerima tugas
        await supabase.from('company_timeline').update({ pic_id: receiver.id }).eq('id', selectedSchedule.id);
        
        setDiscussions([...discussions, { ...payload, created_at: new Date().toISOString() }]);
        setFormData({...formData, pic_id: receiver.id});
        setDiscussionForm({ message: '', receiver_id: '' });
        fetchData(); // Refresh bg
    } catch (e) {
        alert('Gagal meneruskan tugas: ' + e.message);
    } finally {
        setIsSubmitting(false);
    }
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
              <CalendarView calendarDays={calendarDays} getEventsForDay={getEventsForDay} handleDayClick={handleDayClick} />
            ) : (
              <GanttView month={month} year={year} daysInMonth={daysInMonth} schedules={schedules} handleEdit={handleEdit} handleAddNewEvent={handleAddNewEvent} />
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
          <ListView sortedGroups={sortedGroups} handleEdit={handleEdit} />
        )}

        {/* MODAL DAY VIEW (DETAIL JADWAL HARIAN) */}
        <DayViewModal dayViewDate={dayViewDate} setDayViewDate={setDayViewDate} getEventsForDay={getEventsForDay} handleEdit={handleEdit} handleAddNewEvent={handleAddNewEvent} />

        {/* MODAL FORM TIMELINE (INTERNAL) */}
        <FormModal 
          isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} selectedSchedule={selectedSchedule}
          formData={formData} setFormData={setFormData} jobOrders={jobOrders} handleJobOrderSelect={handleJobOrderSelect}
          handleSubmit={handleSubmit} isSubmitting={isSubmitting} currentUser={currentUser} employees={employees}
          discussions={discussions} discussionForm={discussionForm} setDiscussionForm={setDiscussionForm} handleForward={handleForward}
        />
      </div>
    </div>
  );
}
