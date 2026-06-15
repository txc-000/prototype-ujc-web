import React from 'react';
import { Calendar, Briefcase, Edit2 } from 'lucide-react';
import { daysOfWeek, monthNames, getStatusColorMap, formatYMD } from './utils';

export const CalendarView = ({ calendarDays, getEventsForDay, handleDayClick }) => {
  return (
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
  );
};

export const GanttView = ({ month, year, schedules, handleEdit, handleAddNewEvent }) => {
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
    <div style={{ overflowX: 'auto', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 'max-content' }}>
        <thead>
            <tr style={{ background: '#f8fafc' }}>
                <th rowSpan="2" style={{ padding: '12px 15px', fontSize: '0.8rem', color: '#64748b', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 30, minWidth: '150px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontWeight: 800 }}>KUMIAI</th>
                <th rowSpan="2" style={{ padding: '12px 15px', fontSize: '0.8rem', color: '#64748b', position: 'sticky', left: '150px', background: '#f8fafc', zIndex: 30, minWidth: '250px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontWeight: 800 }}>KEGIATAN / ORDER UP</th>
                {monthsData.map((mData, idx) => (
                    <th key={idx} colSpan={mData.days} style={{ padding: '8px 0', fontSize: '0.85rem', color: '#1e293b', textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontWeight: 900, background: '#f1f5f9' }}>{mData.name} {year}</th>
                ))}
            </tr>
            <tr style={{ background: '#f8fafc' }}>
                {ganttDays.map((dObj, idx) => (
                    <th key={idx} style={{ padding: '8px 0', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', minWidth: '30px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', fontWeight: 800, background: '#f8fafc' }}>{dObj.day}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {quarterSchedules.length === 0 ? (
                <tr><td colSpan={ganttDays.length + 2} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Tidak ada kegiatan di kuartal ini.</td></tr>
            ) : (
                (() => {
                    const groupedGanttSchedules = Object.values(quarterSchedules.reduce((acc, evt) => {
                        const baseKegiatan = evt.kegiatan.replace(/^\[.*?\]\s*/, '');
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
                                    <td key={idx} onClick={() => handleAddNewEvent(dStr, group)} style={{ padding: '4px 0', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', textAlign: 'center', background: isWeekend ? '#fafafa' : 'white', verticalAlign: 'top', cursor: 'cell' }}>
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
      </table>
    </div>
  );
};

export const ListView = ({ sortedGroups, handleEdit }) => {
  return (
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
                  <th style={{ padding: '15px 20px', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: item.status === 'CANCELLED' ? 0.6 : 1 }}>
                    <td onClick={() => handleEdit(item)} style={{ padding: '15px 20px', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>
                      <span style={{ textDecoration: item.status === 'CANCELLED' ? 'line-through' : 'none' }}>{item.kegiatan}</span>
                      {item.job_order_id && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', marginLeft: '10px' }}><Briefcase size={12}/> Link Job Order</span>}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>{item.kumiai || '-'}</td>
                    <td style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>{item.employees?.nama_lengkap || '-'}</td>
                    <td style={{ padding: '15px 20px', color: '#475569', fontSize: '0.9rem' }}><b>{new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</b> s/d <b>{new Date(item.tanggal_selesai || item.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</b></td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}><span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, ...getStatusColorMap(item.status || 'PENDING') }}>{item.status || 'PENDING'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};