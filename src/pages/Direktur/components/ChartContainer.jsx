import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ChartContainer({ summary }) {
    const COLORS = ['#1e40af', '#00c49f', '#ffbb28', '#8884d8', '#ff8042', '#4ade80', '#e11d48'];
    
    const chartData = summary.rincian.map(r => ({
        name: r.BULAN,
        total: r['JUMLAH SISWA'] || 0,
        percent: summary.totalBerangkat > 0 ? ((r['JUMLAH SISWA'] / summary.totalBerangkat) * 100).toFixed(1) + '%' : '0%'
    }));

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#1e3a8a', color: 'white', padding: '10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>TREND KEBERANGKATAN SISWA PER BULAN</div>
                <div style={{ height: '300px', padding: '20px 10px 0 0' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis tick={{fontSize: 12}} />
                            <Tooltip />
                            <Legend wrapperStyle={{fontSize: '12px'}} />
                            <Line type="linear" dataKey="total" name="Jumlah Siswa Berangkat" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#2563eb' }} label={{ position: 'top', fontSize: 12, fontWeight: 'bold' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#1e3a8a', color: 'white', padding: '10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>JUMLAH KEBERANGKATAN SISWA PER BULAN</div>
                <div style={{ height: '300px', padding: '20px 10px 0 0' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis tick={{fontSize: 12}} />
                            <Tooltip />
                            <Bar dataKey="total" fill="#2563eb" label={{ position: 'top', fontSize: 12, fontWeight: 'bold' }} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#1e3a8a', color: 'white', padding: '10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>KONTRIBUSI KEBERANGKATAN PER BULAN</div>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center' }}>
                    <ResponsiveContainer width="55%" height="100%">
                        <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="total">
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ width: '45%', fontSize: '11px', fontWeight: 'bold', paddingRight: '10px' }}>
                        {chartData.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[idx % COLORS.length], marginRight: '8px' }}></div>
                                <div style={{ width: '60px' }}>{item.name}</div>
                                <div style={{ width: '30px', textAlign: 'right' }}>{item.total}</div>
                                <div style={{ marginLeft: '5px', color: '#64748b' }}>({item.percent})</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}