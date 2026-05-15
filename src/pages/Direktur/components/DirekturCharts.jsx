import React from 'react';
import { PieChart, BarChart } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function DirekturCharts({ chartData, pipeline, maxChartValue, setDetailModal }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '30px' }}>
            <div style={styles.cardStyle}>
                <h3 style={styles.cardHeaderStyle}><PieChart size={20}/> Distribusi Status Siswa</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '30px' }}>Klik pada diagram batang untuk melihat detail siswa.</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '220px', paddingBottom: '10px' }}>
                    {chartData.map((data, idx) => {
                        const heightPct = data.value === 0 ? 5 : (data.value / maxChartValue) * 100;
                        return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative' }}>
                                <div style={{ marginBottom: '10px', fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>{data.value}</div>
                                <div 
                                    onClick={() => data.value > 0 && setDetailModal(data)} 
                                    style={{ width: '100%', background: data.color, height: `${heightPct}%`, borderRadius: '6px 6px 0 0', opacity: data.value === 0 ? 0.2 : 1, cursor: data.value > 0 ? 'pointer' : 'default', transition: 'transform 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                ></div>
                                <div style={{ position: 'absolute', bottom: '-25px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textAlign: 'center', width: '100%' }}>{data.label}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div style={styles.cardStyle}>
                <h3 style={styles.cardHeaderStyle}><BarChart size={20}/> Makro Pipeline & Bottleneck Indikator</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>Sebaran siswa aktif di tiap Divisi. Klik pada baris untuk melihat detail.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                    {pipeline.map((p, idx) => {
                        const pCount = p.items.length;
                        const maxPipe = Math.max(...pipeline.map(x => x.items.length), 1);
                        const widthPct = maxPipe === 0 ? 0 : (pCount / maxPipe) * 100;
                        return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '140px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>{p.label}</div>
                                <div style={{ flex: 1, height: '30px', background: '#f1f5f9', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                                    <div 
                                        onClick={() => pCount > 0 && setDetailModal({ label: p.label, items: p.items })} 
                                        style={{ width: `${widthPct}%`, height: '100%', background: `linear-gradient(90deg, ${brandNavy}, #3b82f6)`, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px', color: 'white', fontWeight: 900, fontSize: '0.85rem', cursor: pCount > 0 ? 'pointer' : 'default', transition: 'transform 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {pCount > 0 ? pCount : ''}
                                    </div>
                                </div>
                                <div style={{ width: '30px', fontWeight: 900, color: '#1e293b' }}>{pCount}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}