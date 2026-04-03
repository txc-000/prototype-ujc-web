export default function Legalitas({ lang }) {
  return (
    <section style={{ padding: '80px 5%', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--ink)', marginBottom: '40px' }}>
        Legalitas Perusahaan
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid var(--mist)' }}>
        <tbody style={{ fontSize: '0.95rem' }}>
          {[
            ["Nama Lembaga", "LPK UNIVERSAL JAPAN COURSE"],
            ["Direktur", "Aris Sutikno, S.S."],
            ["Akta Pendirian", "Notaris Sari Nitiyudo, S.H. No: 24 (19 Mei 2006)"],
            ["Ijin Depnaker", "Nomor: 241/LATTAS/IX/2006"],
            ["Ijin Perpanjangan", "KEP.249/LATTAS/X/2015"],
            ["Ijin Walikota Smg", "No. Kep: 563/1675/2014"]
          ].map(([label, val], i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--mist)' }}>
              <td style={{ padding: '15px', fontWeight: '700', width: '30%', background: 'var(--cream)' }}>{label}</td>
              <td style={{ padding: '15px' }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}