import React from 'react';
import { X, Plus, Edit2, Loader2, MessageSquare, Send, CornerUpRight } from 'lucide-react';
import { getStatusColorMap } from './utils';

export const DayViewModal = ({ dayViewDate, setDayViewDate, getEventsForDay, handleEdit, handleAddNewEvent }) => {
  if (!dayViewDate) return null;
  return (
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
          <button onClick={() => handleAddNewEvent(dayViewDate)} style={{ background: '#3b82f6', color: 'white', padding: '12px 25px', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Tambah Kegiatan Baru</button>
        </div>
      </div>
    </div>
  )
};

export const FormModal = ({
  isModalOpen, setIsModalOpen, selectedSchedule, formData, setFormData, jobOrders, handleJobOrderSelect,
  handleSubmit, isSubmitting, currentUser, employees, discussions, discussionForm, setDiscussionForm, handleForward
}) => {
  if (!isModalOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: selectedSchedule ? '1000px' : '700px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ background: '#f8fafc', padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>{selectedSchedule ? 'Edit Kegiatan Timeline' : 'Tambah Kegiatan Baru'}</h2>
          <button onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: selectedSchedule ? '1.7fr 1fr' : '1fr', gap: '0' }}>
          <form onSubmit={handleSubmit} style={{ padding: '30px', borderRight: selectedSchedule ? '1px solid #e2e8f0' : 'none' }}>
          <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '15px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e40af', marginBottom: '8px' }}>Tautkan ke Job Order (Opsional)</label>
            <select value={formData.job_order_id} onChange={handleJobOrderSelect} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
              <option value="">-- Tidak ditautkan (Kegiatan Internal LPK) --</option>
              {jobOrders.map(jo => <option key={jo.id} value={jo.id}>{jo.perusahaan} ({jo.kumiai || 'Tanpa Kumiai'})</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Kumiai</label><input required type="text" value={formData.kumiai} onChange={(e) => setFormData({...formData, kumiai: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="Nama Kumiai..." /></div>
            <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Kegiatan / Order Up</label><input required type="text" value={formData.kegiatan} onChange={(e) => setFormData({...formData, kegiatan: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="Deskripsi Kegiatan..." /></div>
            <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Tanggal Mulai</label><input required type="date" value={formData.tanggal_mulai} onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div>
            <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Tanggal Selesai</label><input required type="date" value={formData.tanggal_selesai} onChange={(e) => setFormData({...formData, tanggal_selesai: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div>
            <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>PIC / Penginput</label><input readOnly value={employees.find(e => e.id === formData.pic_id)?.nama_lengkap || currentUser?.nama_lengkap || 'Akun Anda'} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#64748b', fontWeight: 700 }} /></div>
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
          {selectedSchedule && (
            <div style={{ padding: '30px', background: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '550px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={16} color="#3b82f6" /> Riwayat & Forward Tugas</h3>
              <div style={{ flex: 1, overflowY: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {discussions.length === 0 ? <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', margin: 'auto 0' }}>Belum ada instruksi atau tugas yang diforward.</div> : discussions.map((d, i) => (
                      <div key={i} style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><strong style={{ color: '#3b82f6', fontSize: '0.75rem' }}>{d.sender_name}</strong><span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{new Date(d.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
                          <div style={{ color: '#1e293b', marginBottom: '8px', lineHeight: '1.4' }}>{d.message}</div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}><CornerUpRight size={12} /> Diteruskan ke: {d.receiver_name}</div>
                      </div>
                  ))}
              </div>
              {['SUPER ADMIN', 'ADMINISTRASI', 'REKRUTMEN', 'REGULER'].includes((currentUser?.role_name || '').toUpperCase()) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <select value={discussionForm.receiver_id} onChange={e => setDiscussionForm({...discussionForm, receiver_id: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}><option value="">-- Pilih Staf Penerima Tugas --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.nama_lengkap}</option>)}</select>
                      <textarea rows="2" placeholder="Tulis instruksi pengerjaan..." value={discussionForm.message} onChange={e => setDiscussionForm({...discussionForm, message: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}></textarea>
                      <button type="button" onClick={handleForward} disabled={!discussionForm.receiver_id || !discussionForm.message || isSubmitting} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (!discussionForm.receiver_id || !discussionForm.message) ? 0.5 : 1 }}>{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Forward Tugas Ini</button>
                  </div>
              ) : (
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center', background: '#fef2f2', padding: '12px', borderRadius: '8px', fontWeight: 600, border: '1px dashed #fca5a5' }}>Hanya Admin, Div. Rekrutmen, dan Reguler yang diizinkan untuk meneruskan (forward) tugas.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};