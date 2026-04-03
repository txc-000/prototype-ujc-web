export default function VisiMisi({ lang }) {
  return (
    <section style={{ padding: '80px 5%', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', borderBottom: '3px solid var(--red)', paddingBottom: '10px', marginBottom: '40px' }}>
        {lang === 'ID' ? 'Visi & Misi' : 'ビジョンとミッション'}
      </h2>
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'var(--red)', marginBottom: '15px' }}>VISI</h3>
        <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#444' }}>
          "Mencetak generasi muda yang handal, berkualitas, berwawasan, mempunyai semangat serta inovasi tinggi untuk memenangkan kompetisi global."
        </p>
      </div>
      <div>
        <h3 style={{ color: 'var(--red)', marginBottom: '15px' }}>MISI</h3>
        <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
          <li>Memberikan pelatihan untuk meningkatkan kualitas SDM, meningkatkan semangat kerja dan disiplin.</li>
          <li>Mensosialisasikan dan menjembatani program pemagangan, pembekalan teknik dan keterampilan.</li>
        </ul>
      </div>
    </section>
  );
}