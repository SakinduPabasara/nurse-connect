import { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const CAT_CONFIG = {
  healthcare:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Clinical', Icon: Ic.Activity },
  policy:       { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', label: 'Policy', Icon: Ic.FileText },
  professional: { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.25)',  label: 'Education', Icon: Ic.Award },
  industry:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)',  label: 'Industry', Icon: Ic.Globe },
};

const getCat = c => CAT_CONFIG[c] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)', Icon: Ic.News, label: c };

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/news')
      .then(({ data }) => setNews(Array.isArray(data) ? data : []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return news.filter(n =>
      (cat === 'all' || n.category === cat) &&
      (!search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase()))
    );
  }, [news, cat, search]);

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Knowledge Base</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.News size={24} color="#fff" />
             </div>
             Health Intelligence
          </div>
        </div>
      </div>

      {/* ── Category Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
        {['all', ...Object.keys(CAT_CONFIG)].map(c => {
          const active = cat === c;
          const cfg = c === 'all' ? { color: '#fff', bg: 'rgba(255,255,255,0.05)', Icon: Ic.Inbox, label: 'Full Feed' } : getCat(c);
          return (
            <button 
              key={c}
              onClick={() => setCat(c)}
              style={{ 
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, 
                padding: '12px 24px', borderRadius: 20, background: active ? `${cfg.color}15` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? cfg.color : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                <cfg.Icon size={16} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: active ? '#fff' : '#94a3b8' }}>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ position: 'relative', marginBottom: 40 }}>
        <Ic.Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input 
          className="form-input" 
          style={{ paddingLeft: 48, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', height: 52, borderRadius: 16 }} 
          placeholder="Search clinical archives..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {/* ── Magazine-style Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 280, borderRadius: 28 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Inbox size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>No intelligence reports found.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32 }}>
          {filtered.map((n, idx) => {
            const cfg = getCat(n.category);
            const isFeatured = idx === 0 && cat === 'all' && !search;
            
            return (
              <div 
                key={n._id} 
                style={{ 
                  gridColumn: isFeatured ? '1 / -1' : 'span 1',
                  background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: 28, padding: isFeatured ? '48px' : '32px',
                  display: 'flex', flexDirection: isFeatured ? 'row' : 'column', gap: 32,
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', backdropFilter: 'blur(20px)',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-8px)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                {/* Visual Flair */}
                <div style={{ 
                  position: 'absolute', top: -100, right: -100, width: 250, height: 250, 
                  background: `radial-gradient(circle, ${cfg.color}15 0%, transparent 70%)`,
                  zIndex: 0, pointerEvents: 'none'
                }} />

                <div style={{ width: isFeatured ? '40%' : '100%', position: 'relative', zIndex: 1 }}>
                   <div style={{ 
                     width: isFeatured ? 80 : 56, height: isFeatured ? 80 : 56, 
                     borderRadius: 18, background: `${cfg.color}15`, 
                     border: `1px solid ${cfg.border}`, display: 'flex', 
                     alignItems: 'center', justifyContent: 'center', color: cfg.color,
                     marginBottom: 24
                   }}>
                     <cfg.Icon size={isFeatured ? 36 : 28} />
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: cfg.color, letterSpacing: '0.05em' }}>{cfg.label} Intelligence</span>
                      {isFeatured && <span style={{ padding: '4px 10px', background: '#6366f1', color: '#fff', borderRadius: 6, fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase' }}>Featured</span>}
                   </div>
                   <div style={{ fontSize: isFeatured ? '2rem' : '1.25rem', fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 20 }}>{n.title}</div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                   <div style={{ 
                     fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.7, 
                     display: '-webkit-box', WebkitLineClamp: isFeatured ? 6 : 4, WebkitBoxOrient: 'vertical', 
                     overflow: 'hidden', marginBottom: 'auto'
                   }}>
                     {n.content}
                   </div>

                   <div style={{ 
                     marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)',
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                   }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                         <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                            <Ic.ExternalLink size={14} />
                         </div>
                         <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Source</div>
                            <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>{n.source || 'Medical Board'}</div>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Published</div>
                        <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>{new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes screen-entry { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
