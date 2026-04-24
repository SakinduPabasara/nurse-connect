import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const SHIFT_META = {
  '7AM-1PM':  { color: '#2563eb', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)', badge: 'badge-blue' },
  '1PM-7PM':  { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', badge: 'badge-cyan' },
  '7AM-7PM':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', badge: 'badge-yellow' },
  '7PM-7AM':  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', badge: 'badge-cyan' },
};
const getMeta = s => SHIFT_META[s] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', badge: 'badge-gray' };

export default function WardRosterPage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  const [ward, setWard] = useState(user?.ward || '');
  const [wards, setWards] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const wardOptions = [...new Set([...(user?.ward ? [user.ward] : []), ...wards])];

  useEffect(() => {
    // Merge managed wards with wards that exist in roster data
    Promise.all([
      API.get('/wards').then(r => (Array.isArray(r.data) ? r.data.map(w => w.name) : [])).catch(() => []),
      API.get('/roster/wards').then(r => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
    ]).then(([managed, roster]) => {
      const merged = [...new Set([...managed, ...roster])].sort();
      setWards(merged);
    });
  }, []);

  useEffect(() => {
    if (!ward) { setRoster([]); return; }
    setLoading(true);
    API.get(`/roster/ward/${ward === '__ALL__' ? 'all' : encodeURIComponent(ward)}?month=${month}`)
      .then(r => setRoster(r.data))
      .catch(() => setRoster([]))
      .finally(() => setLoading(false));
  }, [month, ward]);

  const filtered = roster.filter(e =>
    !search || (e.nurse?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.ward || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .ward-row {
          display: grid;
          grid-template-columns: 80px 1fr auto auto;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          backdrop-filter: blur(12px);
          transition: all 0.2s;
        }
        .ward-row:hover { transform: translateX(3px); box-shadow: 0 4px 14px rgba(0,0,0,0.22); }
        .ward-row.me { border-color: rgba(37,99,235,0.4); background: rgba(37,99,235,0.06); }
        .search-wrap { position: relative; flex: 1; }
        .search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }
        .ward-search { width: 100%; padding: 9px 16px 9px 38px; background: rgba(15,23,42,0.6); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family:'Inter',sans-serif; font-size:0.875rem; outline:none; }
        .ward-search:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(37,99,235,0.15); }
        .ward-search::placeholder { color:var(--text3); }
        @media(max-width:600px) { .ward-row { grid-template-columns:65px 1fr; } }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">🏥 Ward Roster</div>
          <div className="page-subtitle">{roster.length} entries for the selected ward & month</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 200 }} value={ward} onChange={e => setWard(e.target.value)}>
            <option value="">Select ward</option>
            <option value="__ALL__">All Wards</option>
            {wardOptions.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <input type="month" className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)} />
        </div>
      </div>

      {/* Search */}
      {roster.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="ward-search" placeholder="Search by nurse name or ward…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      )}

      {!ward ? (
        <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 12, padding: '18px 22px', color: '#60a5fa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>ℹ️</span> Select a ward above to view the roster
        </div>
      ) : loading ? (
        <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="spinner" style={{ margin: 0 }} />
          <span style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Loading roster…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '70px 20px' }}>
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text" style={{ fontWeight: 600 }}>{search ? 'No matching entries' : 'No roster entries found'}</div>
          <div style={{ color: 'var(--text3)', fontSize: '0.875rem', marginTop: 8 }}>Try a different ward or month</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(entry => {
            const isMe = entry.nurse?._id === user?._id;
            const meta = getMeta(entry.shift);
            return (
              <div key={entry._id} className={`ward-row${isMe ? ' me' : ''}`}>
                {/* Date */}
                <div style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.63rem', color: meta.color, fontWeight: 700, textTransform: 'uppercase' }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
                    {new Date(entry.date).getDate()}
                  </div>
                </div>
                {/* Nurse info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: '50%', 
                      background: entry.nurse?.profilePic 
                        ? `url(http://localhost:5000${entry.nurse.profilePic}) center/cover no-repeat` 
                        : 'linear-gradient(135deg,var(--primary),#06b6d4)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                      border: entry.nurse?.profilePic ? '1px solid var(--border)' : 'none',
                      textIndent: entry.nurse?.profilePic ? '-9999px' : '0'
                    }}>
                      {(entry.nurse?.name || 'D')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                      {entry.nurse?.name || 'Deleted user'}
                    </span>
                    {isMe && <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.65rem', padding: '2px 7px', borderRadius: 999, fontWeight: 700 }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>🏥 {entry.ward}</div>
                </div>
                {/* Shift */}
                <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, padding: '4px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {entry.shift}
                </span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
