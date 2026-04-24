import { useState, useEffect } from 'react';
import API from '../../api/axios';
import SearchableSelect from '../../components/SearchableSelect';

const STATUS_CFG = {
  available:   { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '✅' },
  maintenance: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '🔧' },
  unavailable: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '❌' },
};
const getCfg = s => STATUS_CFG[s] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: '❓' };

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [ward, setWard] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const url = ward ? `/equipment?ward=${encodeURIComponent(ward)}` : '/equipment';
      const { data } = await API.get(url);
      setEquipment(data);
    } catch { setEquipment([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchEquipment(); }, [ward]);

  useEffect(() => {
    API.get('/wards').then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const filtered = equipment.filter(e =>
    (statusFilter === 'all' || e.status === statusFilter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.ward || '').toLowerCase().includes(search.toLowerCase()))
  );

  const counts = { available: 0, maintenance: 0, unavailable: 0 };
  equipment.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .equip-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          backdrop-filter: blur(12px);
          transition: all 0.2s;
        }
        .equip-card:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(0,0,0,0.22); }
        .status-chip { padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; border: 1px solid; cursor: pointer; transition: all 0.15s; }
        .search-wrap { position: relative; flex: 1; min-width: 180px; }
        .search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }
        .equip-search { width: 100%; padding: 9px 16px 9px 38px; background: rgba(15,23,42,0.6); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family:'Inter',sans-serif; font-size:0.875rem; outline:none; }
        .equip-search:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(37,99,235,0.15); }
        .equip-search::placeholder { color:var(--text3); }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">🔧 Equipment</div>
          <div className="page-subtitle">{equipment.length} total items in inventory</div>
        </div>
      </div>

      {/* Stats */}
      {equipment.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total', value: equipment.length, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', icon: '🔧' },
            { label: 'Available', value: counts.available, color: '#34d399', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
            { label: 'Maintenance', value: counts.maintenance, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', icon: '🔨' },
            { label: 'Unavailable', value: counts.unavailable, color: '#f87171', bg: 'rgba(239,68,68,0.12)', icon: '❌' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bg.replace('0.12','0.3')}`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => setStatusFilter(s.label === 'Total' ? 'all' : s.label.toLowerCase())}>
              <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="equip-search" placeholder="Search equipment…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <SearchableSelect
          className="compact"
          style={{ width: 220 }}
          options={wards.map(w => ({ value: w.name, label: w.name }))}
          value={ward}
          onChange={setWard}
          placeholder="All Wards"
        />
        {['all','available','maintenance','unavailable'].map(s => {
          const cfg = s === 'all' ? { color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)' } : getCfg(s);
          const active = statusFilter === s;
          return (
            <button key={s} className="status-chip" onClick={() => setStatusFilter(s)}
              style={{ background: active ? cfg.color : cfg.bg, color: active ? '#fff' : cfg.color, borderColor: active ? cfg.color : cfg.border }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="spinner" style={{ margin: 0 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '70px 20px' }}>
          <div className="empty-state-icon">🔧</div>
          <div className="empty-state-text" style={{ fontWeight: 600 }}>No equipment found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(e => {
            const cfg = getCfg(e.status);
            return (
              <div key={e._id} className="equip-card" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  🔧
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)', marginBottom: 4 }}>{e.name}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text2)', flexWrap: 'wrap' }}>
                    <span>🏥 {e.ward || '—'}</span>
                    {e.lastMaintenance && <span>🔨 Last: {new Date(e.lastMaintenance).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '5px 13px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, textTransform: 'capitalize' }}>
                  {cfg.icon} {e.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
