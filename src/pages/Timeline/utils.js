export const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const getStatusColorMap = (status) => {
    switch (status) {
        case 'COMPLETED': return { bg: '#e0ffe0', color: '#00b840', border: '#a5f3c5' }; // Hijau Cerah
        case 'IN PROGRESS': return { bg: '#e0f0ff', color: '#0055ff', border: '#a3cfff' }; // Biru Cerah
        case 'CANCELLED': return { bg: '#ffebee', color: '#ff1744', border: '#ffb3b3' }; // Merah Cerah
        default: return { bg: '#fff8e1', color: '#f57c00', border: '#ffe0b2' }; // PENDING (Oranye Cerah)
    }
};

export const formatYMD = (d) => {
  let year = d.getFullYear();
  if (year < 100) year += 2000;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${month}-${day}`;
};

export const parseCSVDate = (dateStr) => {
  if (!dateStr || !String(dateStr).trim()) return null;
  let cleanStr = String(dateStr).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/"/g, '');
  cleanStr = cleanStr.replace(/[\sT]\d{1,2}:\d{2}(:\d{2})?.*$/, '');

  if (/^\d{5}$/.test(cleanStr)) {
    const jsDate = new Date(Math.round((Number(cleanStr) - 25569) * 86400 * 1000));
    return formatYMD(jsDate);
  }

  const idMonths = { 'januari':'jan', 'februari':'feb', 'maret':'mar', 'april':'apr', 'mei':'may', 'juni':'jun', 'juli':'jul', 'agustus':'aug', 'september':'sep', 'oktober':'oct', 'november':'nov', 'desember':'dec' };
  let enStr = cleanStr.toLowerCase();
  for (const [id, en] of Object.entries(idMonths)) {
      enStr = enStr.replace(new RegExp(id, 'g'), en);
  }

  let standardizedStr = enStr.replace(/[\s\.\/]/g, '-').replace(/-+/g, '-');
  if (standardizedStr.includes('-')) {
    const parts = standardizedStr.split('-');
    if (parts.length >= 3) {
      let y = parts[2], m = parts[1], d = parts[0];
      if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; } 
      else if (!isNaN(parts[1]) && Number(parts[1]) > 12) { m = parts[0]; d = parts[1]; y = parts[2]; }
      let mNum = Number(m);
      if (isNaN(mNum)) {
          const mIndex = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].findIndex(mn => String(m).toLowerCase().includes(mn));
          if (mIndex !== -1) mNum = mIndex + 1;
      }
      if (!isNaN(Number(y)) && !isNaN(mNum) && !isNaN(Number(d))) {
         let yNum = Number(y);
         if (yNum < 100) yNum += 2000;
         return `${String(yNum).padStart(4, '0')}-${String(mNum).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
      }
    }
  }
  const d = new Date(standardizedStr);
  if (!isNaN(d.getTime())) return formatYMD(d);
  return null; 
};