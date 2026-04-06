import { t } from '../../translations';

export default function LatarBelakang({ lang }) {
  const text = {
    ID: {
      title: "Latar Belakang",
      sub: "Sejarah & Dedikasi Universal Japan Course",
      p1: "Bapak Aris Sutikno S.S. merupakan eks IM Japan dan pernah tinggal di Jepang selama 3 tahun. Selama berada di Jepang, beliau belajar bahasa Jepang, kehidupan orang Jepang serta etos kerja orang Jepang dan kembali ke Indonesia dengan keinginan untuk membuka kesempatan belajar etos kerja orang Jepang secara langsung di Jepang dengan jalur pemagangan.",
      p2: "Beliau kemudian mendirikan LPK Universal Japan Course untuk menjembatani para pemuda di Indonesia yang ingin magang di Jepang. Dengan dibukanya program magang ke Jepang ini, diharapkan siswa-siswi dapat menyalurkan ilmu yang diperoleh sebagai media transfer kedisiplinan kerja, keterampilan kerja serta etos kerja yang tinggi.",
      p3: "Kami harap siswa-siswi yang kami kirim nantinya dapat menjadi pribadi yang unggul, berkualitas, berwawasan serta menguasai teknologi yang baik untuk mendorong kemajuan dan kesejahteraan ekonomi baik secara pribadi maupun secara umum di masyarakat."
    },
    JP: {
      title: "沿革 / 背景",
      sub: "ユニバーサル・ジャパン・コースの歴史と献身",
      p1: "創設者のアリス・スティクノ（Aris Sutikno S.S.）は、元IMジャパンの研修生として日本に3年間滞在しました。日本滞在中、彼は日本語だけでなく、日本人の生活習慣や労働倫理を学びました。帰国後、日本での技能実習制度を通じて、日本流の仕事の進め方を直接学ぶ機会をインドネシアの若者に提供したいという強い願い抱きました。",
      p2: "その後、日本での実習を希望するインドネシアの若者との架け橋となるべく、LPK Universal Japan Courseを設立しました。このプログラムを通じて、学生たちが日本で得た知識、規律、技術をインドネシアに持ち帰り、社会に貢献することを期待しています。",
      p3: "私たちが送り出す学生たちが、優れた技術と広い視野を持ち、最新のテクノロジーを駆使して、個人および社会全体の経済的繁栄と進歩を促進する存在になることを願っています。"
    }
  };

  const content = text[lang];
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', padding: '80px 5%' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>
             Establishment Story
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--ink)', marginBottom: '10px' }}>
            {content.title}
          </h2>
          <p style={{ color: '#888', fontStyle: 'italic' }}>"{content.sub}"</p>
        </header>

        {/* Content Section */}
        <div style={{ background: 'var(--white)', padding: '50px', borderRadius: '12px', boxShadow: '0 10px 40px var(--shadow)', borderTop: '4px solid var(--red)' }}>
          
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', marginBottom: '40px' }}>
             {/* Simbol Quote Besar */}
             <div style={{ fontSize: '5rem', color: 'var(--red-light)', lineHeight: '1', fontFamily: 'var(--font-serif)', opacity: 0.5 }}>“</div>
             <p style={{ fontSize: '1.15rem', lineHeight: '1.8', color: 'var(--ink)', fontWeight: 500 }}>
               {content.p1}
             </p>
          </div>

          <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#444', marginBottom: '30px', paddingLeft: '65px' }}>
            {content.p2}
          </p>

          <div style={{ background: 'var(--cream)', padding: '30px', borderRadius: '8px', marginLeft: '65px', borderLeft: '4px solid var(--red)' }}>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--ink)', fontWeight: 600 }}>
              {content.p3}
            </p>
          </div>

          <div style={{ marginTop: '50px', textAlign: 'right', paddingRight: '20px' }}>
            <p style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1.1rem' }}>Aris Sutikno, S.S.</p>
            <p style={{ color: 'var(--red)', fontSize: '0.85rem', fontWeight: 600 }}>Founder / Direktur LPK UJC</p>
          </div>
        </div>

      </div>
    </div>
  );
}
