import React from 'react';
import { Users, CheckCircle2, Building2, Briefcase } from 'lucide-react';
import { styles } from '../../Reguler/components/dashboardStyles';

const KpiCard = ({ icon, title, value, subtitle, borderTop }) => (
    <div style={{ ...styles.cardStyle, borderTop: `4px solid ${borderTop}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '10px' }}>{icon}</div>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', margin: '5px 0' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{subtitle}</div>
    </div>
);

export default function DirekturKpiCards({ kpi, filterText }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <KpiCard icon={<Users size={28} color="#3b82f6"/>} title="Total Pendaftar" value={kpi.totalSiswa} subtitle={`Periode: ${filterText}`} borderTop="#3b82f6" />
            <KpiCard icon={<CheckCircle2 size={28} color="#10b981"/>} title="Berhasil Lulus" value={kpi.siswaLulus} subtitle={`Tingkat Konversi: ${kpi.konversiRate}%`} borderTop="#10b981" />
            <KpiCard icon={<Building2 size={28} color="#f59e0b"/>} title="Mitra Kaisha (Job)" value={kpi.totalKaisha} subtitle="Kaisha Unik" borderTop="#f59e0b" />
            <KpiCard icon={<Briefcase size={28} color="#8b5cf6"/>} title="Job Order Aktif" value={kpi.totalJobAktif} subtitle="Permintaan rekrutmen" borderTop="#8b5cf6" />
        </div>
    );
}