import { useState, useEffect } from 'react';
import API from '../../api/axios';

const TYPE_CFG = {
  international: { color: '#22d3ee', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', icon: '🌍' },
  local:         { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '🏠' },
  training:      { color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)', icon: '📚' },
  certification: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '🏆' },
};
const getType = t => TYPE_CFG[t] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: '🌐' };
const TYPES = ['all','international','local','training','certification'];

const deadlineInfo = (dl) => {
  const diff = (new Date(dl) - new Date()) / 86400000;
  if (diff < 0) return { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'Closed', icon: '❌' };
  if (diff < 7) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: `${Math.ceil(diff)}d left`, icon: '⚠️' };
  return { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: `${Math.ceil(diff)}d left`, icon: '✅' };
};

export default function OpportunitiesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const url = type === 'all' ? '/opportunities' : `/opportunities?type=${type}`;
      const { data } = await API.get(url);
      setItems(data);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [type]);

  const filtered = items.filter(o =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || (o.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const active = items.filter(o => new Date(o.deadline) >= new Date()).length;
  const closingSoon = items.filter(o => { const d = (new Date(o.deadline)-new Date())/86400000; return d > 0 && d < 7; }).length;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .opp-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px 26px;
          backdrop-filter: blur(12px);
          transition: all 0.2s;
        }
        .opp-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.28); }
        .type-chip { padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; border: 1px solid; cursor: pointer; transition: all 0.15s; }
        .search-wrap { position: relative; flex: 1; min-width: 200px; }
        .search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }
        .opp-search { width: 100%; padding: 9px 16px 9px 38px; background: rgba(15,23,42,0.6); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family:'Inter',sans-serif; font-size:0.875rem; outline:none; }
        .opp-search:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(37,99,235,0.15); }
        .opp-search::placeholder { color:var(--text3); }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">🌐 Opportunities</div>
          <div className="page-subtitle">Professional opportunities for nurses</div>
        </div>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total', value: items.length, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', icon: '🌐' },
            { label: 'Active', value: active, color: '#34d399', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
            { label: 'Closing Soon', value: closingSoon, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', icon: '⚠️' },
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

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <div className="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="opp-search" placeholder="Search opportunities…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Type chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TYPES.map(t => {
          const cfg = t === 'all' ? { color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)', icon: '' } : getType(t);
          const active = type === t;
          return (
            <button key={t} className="type-chip" onClick={() => setType(t)}
              style={{ background: active ? cfg.color : cfg.bg, color: active ? '#fff' : cfg.color, borderColor: active ? cfg.color : cfg.border }}>
              {cfg.icon && cfg.icon + ' '}{t.charAt(0).toUpperCase() + t.slice(1)}
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
          <div className="empty-state-icon">🌐</div>
          <div className="empty-state-text" style={{ fontWeight: 600 }}>No opportunities available</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
          {filtered.map(o => {
            const typeCfg = getType(o.type);
            const dl = deadlineInfo(o.deadline);
            return (
              <div key={o._id} className="opp-card" style={{ borderTop: `3px solid ${typeCfg.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}`, padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                    {typeCfg.icon} {o.type}
                  </span>
                  <span style={{ background: dl.bg, color: dl.color, border: `1px solid ${dl.border}`, padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                    {dl.icon} {dl.label}
                  </span>
                </div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 10 }}>{o.title}</h3>
                <p style={{ color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: 14 }}>{o.description}</p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text3)' }}>
                  {o.location && <span>📍 {o.location}</span>}
                  <span>📅 Deadline: {new Date(o.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
