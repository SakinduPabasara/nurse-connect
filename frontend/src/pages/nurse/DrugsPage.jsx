import { useState, useEffect } from 'react';
import API from '../../api/axios';

const expiryInfo = (date) => {
  const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'Expired' };
  if (diff < 30) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: `${Math.ceil(diff)}d left` };
  return { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: 'Valid' };
};

export default function DrugsPage() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [ward, setWard] = useState('');
  const [search, setSearch] = useState('');

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const url = ward ? `/drugs?ward=${encodeURIComponent(ward)}` : '/drugs';
      const { data } = await API.get(url);
      setDrugs(data);
    } catch { setDrugs([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDrugs(); }, [ward]);

  useEffect(() => {
    API.get('/wards').then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const filtered = drugs.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.ward || '').toLowerCase().includes(search.toLowerCase())
  );

  const expired = drugs.filter(d => new Date(d.expiryDate) < new Date()).length;
  const expiringSoon = drugs.filter(d => { const diff = (new Date(d.expiryDate) - new Date()) / 86400000; return diff > 0 && diff < 30; }).length;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .drug-card {
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
        .drug-card:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(0,0,0,0.22); }
        .search-wrap { position: relative; flex: 1; min-width: 180px; }
        .search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }
        .drug-search { width: 100%; padding: 9px 16px 9px 38px; background: rgba(15,23,42,0.6); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family:'Inter',sans-serif; font-size:0.875rem; outline:none; }
        .drug-search:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(37,99,235,0.15); }
        .drug-search::placeholder { color:var(--text3); }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">💊 Drug Inventory</div>
          <div className="page-subtitle">{drugs.length} items in inventory</div>
        </div>
      </div>

      {/* Stats */}
      {drugs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Items', value: drugs.length, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', icon: '💊' },
            { label: 'Expiring Soon', value: expiringSoon, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', icon: '⚠️' },
            { label: 'Expired', value: expired, color: '#f87171', bg: 'rgba(239,68,68,0.12)', icon: '❌' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bg.replace('0.12','0.3')}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '0.71rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="drug-search" placeholder="Search drug name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="form-select"
          style={{ width: 180 }}
          value={ward}
          onChange={e => setWard(e.target.value)}
        >
          <option value="">All Wards</option>
          {wards.map(w => (
            <option key={w._id} value={w.name}>{w.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="spinner" style={{ margin: 0 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '70px 20px' }}>
          <div className="empty-state-icon">💊</div>
          <div className="empty-state-text" style={{ fontWeight: 600 }}>No drugs found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(d => {
            const exp = expiryInfo(d.expiryDate);
            return (
              <div key={d._id} className="drug-card">
                {/* Drug icon */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                  💊
                </div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)', marginBottom: 4 }}>{d.name}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text2)', flexWrap: 'wrap' }}>
                    <span>🏥 {d.ward || '—'}</span>
                    <span>📦 {d.quantity} {d.unit}</span>
                    <span>📅 Expiry: {new Date(d.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {/* Expiry badge */}
                <span style={{ background: exp.bg, color: exp.color, border: `1px solid ${exp.border}`, padding: '5px 13px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                  {exp.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
