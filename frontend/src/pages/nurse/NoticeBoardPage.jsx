import { useState, useEffect } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const NOTICE_TYPES = {
  general:    { color: '#60a5fa', bg: 'rgba(37,99,235,0.1)',  border: 'rgba(37,99,235,0.2)',  Icon: Ic.Info },
  urgent:     { color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  Icon: Ic.AlertTriangle },
  policy:     { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', Icon: Ic.Tag },
  event:      { color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', Icon: Ic.Calendar },
};
const getType = t => NOTICE_TYPES[t] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)', Icon: Ic.Info };

function SkeletonNotice() {
  return (
    <div className="skeleton-card" style={{ borderRadius: 12, borderLeft: '3px solid rgba(255,255,255,0.06)' }}>
      <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
        <div className="skeleton skeleton-text" style={{ width: '50%' }} />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="skeleton skeleton-text" style={{ width: '100%' }} />
      <div className="skeleton skeleton-text" style={{ width: '75%' }} />
    </div>
  );
}

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get('/notices')
      .then(({ data }) => setNotices(Array.isArray(data) ? data : []))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = notices.filter(n =>
    (type === 'all' || n.type === type) &&
    (!search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase()))
  );

  const urgentCount = notices.filter(n => n.type === 'urgent').length;

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* ── Header — no stats bar ── */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--primary)', display: 'flex' }}><Ic.FileText size={22} /></span>
            Notice Board
          </div>
          <div className="page-subtitle">
            {notices.length} active notices
            {urgentCount > 0 && (
              <span style={{ marginLeft: 10, background: 'rgba(239,68,68,0.14)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)', fontSize: '0.7rem', fontWeight: 700, padding: '1px 8px', borderRadius: 999, verticalAlign: 'middle' }}>
                {urgentCount} urgent
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Search + filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', display: 'flex' }}><Ic.Search size={14} /></span>
          <input className="form-input" style={{ paddingLeft: 34, height: 38 }} placeholder="Search notices…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'general', 'urgent', 'policy', 'event'].map(t => {
            const cfg = t === 'all' ? { color: '#60a5fa', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)' } : getType(t);
            const active = type === t;
            return (
              <button key={t} onClick={() => setType(t)} style={{ padding: '5px 13px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.15s', background: active ? cfg.color : cfg.bg, color: active ? '#fff' : cfg.color, borderColor: active ? cfg.color : cfg.border }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notice list ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonNotice key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text3)', marginBottom: 12 }}><Ic.FileText size={36} /></div>
          <div className="empty-state-text">{search ? 'No matching notices' : 'No notices yet'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(n => {
            const cfg = getType(n.type);
            const Icon = cfg.Icon;
            const isOpen = expanded === n._id;
            return (
              <div key={n._id} style={{
                background: 'var(--surface)', border: `1px solid ${cfg.border}`,
                borderLeft: `3px solid ${cfg.color}`,
                borderRadius: 12, overflow: 'hidden', backdropFilter: 'blur(14px)',
                transition: 'all 0.18s',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : n._id)}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                    <Icon size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{n.title}</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: 'var(--text3)', flexWrap: 'wrap' }}>
                      {n.type && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Icon size={10} /> {n.type}
                        </span>
                      )}
                      {n.createdAt && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Ic.Calendar size={10} />
                          {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text3)', display: 'flex', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                    <Ic.ChevronDown size={16} />
                  </span>
                </div>
                {/* Expanded content */}
                {isOpen && (
                  <div style={{ padding: '0 18px 16px 18px', borderTop: '1px solid var(--border-light)' }}>
                    <p style={{ paddingTop: 14, color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.75 }}>{n.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
