import { useState, useEffect } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const CAT = {
  general:   { color: '#60a5fa', bg: 'rgba(37,99,235,0.1)',  border: 'rgba(37,99,235,0.2)'   },
  covid:     { color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)'   },
  wellness:  { color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)'  },
  policy:    { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)'  },
  training:  { color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)'  },
};
const getCat = c => CAT[c] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)' };

function SkeletonArticle() {
  return (
    <div className="skeleton-card" style={{ borderRadius: 14 }}>
      <div style={{ height: 6, borderRadius: 6, marginBottom: 4 }} className="skeleton" />
      <div className="skeleton skeleton-title" style={{ width: '80%' }} />
      <div className="skeleton skeleton-text" style={{ width: '100%' }} />
      <div className="skeleton skeleton-text" style={{ width: '90%' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
    </div>
  );
}

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get('/news')
      .then(({ data }) => setNews(Array.isArray(data) ? data : []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = news.filter(n =>
    (cat === 'all' || n.category === cat) &&
    (!search || n.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* ── Header — clean, no stats bar ── */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--primary)', display: 'flex' }}><Ic.News size={22} /></span>
            Health News
          </div>
          <div className="page-subtitle">{news.length} articles · Stay informed</div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', display: 'flex' }}><Ic.Search size={14} /></span>
          <input className="form-input" style={{ paddingLeft: 34, height: 38 }} placeholder="Search articles…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Category chips ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
        {['all', 'general', 'covid', 'wellness', 'policy', 'training'].map(c => {
          const cfg = c === 'all' ? { color: '#60a5fa', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)' } : getCat(c);
          const active = cat === c;
          const count = c === 'all' ? news.length : news.filter(n => n.category === c).length;
          if (count === 0 && c !== 'all') return null;
          return (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '5px 13px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.15s', background: active ? cfg.color : cfg.bg, color: active ? '#fff' : cfg.color, borderColor: active ? cfg.color : cfg.border, display: 'flex', alignItems: 'center', gap: 5 }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
              {count > 0 && <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)', borderRadius: 999, padding: '0 5px', fontSize: '0.65rem', fontWeight: 700 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Article feed ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonArticle key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text3)', marginBottom: 12 }}><Ic.News size={36} /></div>
          <div className="empty-state-text">{search ? 'No matching articles' : 'No articles yet'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {filtered.map(n => {
            const cfg = getCat(n.category);
            const isOpen = expanded === n._id;
            return (
              <div key={n._id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderTop: `3px solid ${cfg.color}`, borderRadius: 14,
                backdropFilter: 'blur(14px)', transition: 'all 0.18s',
                display: 'flex', flexDirection: 'column',
              }}
                onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ padding: '18px 20px', flex: 1 }}>
                  {/* Category + date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999, textTransform: 'capitalize' }}>
                      {n.category || 'General'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Ic.Calendar size={11} />
                      {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.93rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 8 }}>{n.title}</h3>
                  <p style={{
                    fontSize: '0.83rem', color: 'var(--text3)', lineHeight: 1.7,
                    display: '-webkit-box', WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: isOpen ? 'unset' : 3, overflow: 'hidden',
                  }}>
                    {n.content}
                  </p>
                </div>
                {/* Read more / less */}
                {n.content?.length > 150 && (
                  <div style={{ padding: '0 20px 14px', borderTop: isOpen ? '1px solid var(--border-light)' : 'none', paddingTop: isOpen ? 12 : 0 }}>
                    <button className="feed-action-btn" onClick={() => setExpanded(isOpen ? null : n._id)} style={{ paddingLeft: 0 }}>
                      {isOpen ? <><Ic.ChevronUp size={13} /> Show less</> : <><Ic.ChevronDown size={13} /> Read more</>}
                    </button>
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
