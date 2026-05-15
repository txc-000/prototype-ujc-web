export const brandNavy = '#101869';
export const brandYellow = '#fdfb06';

export const styles = {
    // ── KUMPULAN STYLE TABEL & BADGE ──
    tableContainer: { background: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    tableS: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    theadS: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    thStyle: { padding: '15px 25px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' },
    tdStyle: { padding: '15px 25px', verticalAlign: 'middle', fontSize: '0.9rem', color: '#334155' },
    trS: { borderBottom: '1px solid #f1f5f9' },
    badgeMitra: { padding: '4px 10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', marginTop: '5px' },
    badgeReguler: { padding: '4px 10px', background: '#f0fdf4', color: '#16a34a', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', marginTop: '5px' },
    badgeS: { fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: '#e0e7ff', color: '#3730a3', fontWeight: 800, display: 'inline-block' },
    
    // ── KUMPULAN STYLE TOMBOL ──
    btnPrimary: { background: brandNavy, color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16,24,105,0.2)' },
    btnLink: (color) => ({ border:'none', background:'none', color:color, fontWeight:800, padding:0, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.75rem', marginTop: '8px' }),
    btnA: (c) => ({ background: 'white', border: `1px solid ${c}40`, color: c, padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800, fontSize: '0.75rem', transition: '0.2s' }),
    btnAddArray: { background: '#eff6ff', color: '#3b82f6', border: '1px dashed #3b82f6', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' },
    btnDel: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px' },
    closeBtn: { border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    submitBtn: { flex: 1, background: brandNavy, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    cancelBtn: { padding: '12px 25px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 },

    // ── KUMPULAN STYLE MODAL, FORM & DROPDOWN ──
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1100, padding: '40px 20px', overflowY: 'auto', backdropFilter: 'blur(4px)' },
    modalContent: { background: 'white', padding: '40px 50px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', margin: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    col: { display: 'flex', flexDirection: 'column', gap: '8px' },
    lb: { fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
    inp: { padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '100%', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', backgroundColor: '#f8fafc', transition: 'border 0.2s' },
    inpSm: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', backgroundColor: '#f8fafc' },
    cardArray: { background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px' },
    dropdownContainer: { position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '180px', zIndex: 50, padding: '5px', textAlign: 'left' },
    dropdownItemS: { width: '100%', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', borderRadius: '6px', transition: 'background 0.2s' },

    // ── KUMPULAN STYLE KPI & FILTER SPV (NEW) ──
    kpiCard: { background: 'white', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
    kpiLabel: { fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', marginBottom: '8px', letterSpacing: '1px' },
    kpiSub: { fontSize: '0.9rem', color: '#64748b', fontWeight: 700 },
    filterLabel: { fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' },
    filterInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem', color: '#1e293b', background: '#f8fafc', width: '100%', minWidth: '120px' },

    // ── KUMPULAN STYLE SIDEBAR LAMA (REGULER) ──
    activeMenuS: { width: '100%', padding: '12px 15px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', background: '#eff6ff', color: brandNavy, border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s' },
    inactiveMenuS: { width: '100%', padding: '12px 15px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' },
    sidebarLabel: { fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', marginTop: '20px', marginBottom: '5px', paddingLeft: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }
};

// ── FUNGSI HELPER STYLE DINAMIS ──
export const actionBtn = (color) => ({ background: 'white', border: `1px solid ${color}40`, color: color, cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s', fontSize: '0.8rem', fontWeight: 700 });

export const kpiValue = (color) => ({ fontSize: '2.5rem', fontWeight: 900, color: color, lineHeight: '1' });
export const viewBtnS = (active) => ({ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: active ? 'white' : 'transparent', color: active ? brandNavy : '#94a3b8', transition: '0.2s', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' });
export const tabS = (active) => ({ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: active ? brandNavy : 'transparent', fontWeight: 700, color: active ? 'white' : '#64748b', fontSize: '0.8rem', transition: '0.2s' });

// Fungsi untuk menentukan warna Badge Status
export const tagS = (st) => {
    const s = st ? String(st).trim().toLowerCase() : '';
    let bg = '#fef3c7', col = '#92400e'; 
    if (['lulus', 'aktif', 'open'].includes(s)) { bg = '#dcfce7'; col = '#166534'; } 
    else if (['gagal', 'gagal seleksi', 'penuh', 'cancel'].includes(s)) { bg = '#fee2e2'; col = '#991b1b'; } 
    else if (['cetak', 'wawancara'].includes(s)) { bg = '#dbeafe'; col = brandNavy; } 
    return { padding: '5px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900, background: bg, color: col, whiteSpace: 'nowrap' };
};

// ── FUNGSI STYLE KHUSUS SIDEBAR SUPERVISOR (BRANDED) ──
export const menuS = (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: isActive ? brandYellow : 'rgba(255, 255, 255, 0.7)', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', transition: '0.3s' });
export const menuDropdownBtn = (isOpen) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: isOpen ? 'white' : 'rgba(255, 255, 255, 0.7)', border: 'none', borderRadius: isOpen ? '10px 10px 0 0' : '10px', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', transition: '0.3s' });
export const subMenuContainer = (isOpen) => ({ maxHeight: isOpen ? '300px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '0 0 10px 10px', marginTop: '-5px', paddingBottom: isOpen ? '10px' : '0' });
export const subMenuS = (isActive) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px 10px 40px', background: 'transparent', color: isActive ? brandYellow : 'rgba(255, 255, 255, 0.6)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', transition: '0.2s' });
export const subDot = (isActive) => ({ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? brandYellow : 'rgba(255, 255, 255, 0.4)', transition: '0.2s' });
export const smallKanjiList = { color: '#cbd5e1', fontSize: '0.65rem', fontWeight: 800, marginLeft: 'auto' };