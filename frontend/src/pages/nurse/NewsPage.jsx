import { useState, useEffect } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const CAT = {
  general:   { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.2)',  Icon: Ic.Info },
  covid:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  Icon: Ic.AlertTriangle },
  wellness:  { color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  Icon: Ic.Sun },
  policy:    { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  Icon: Ic.Tag },
  training:  { color: '#a78bfa', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.2)',  Icon: Ic.Award },
};

const getCat = c => CAT[c] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)', Icon: Ic.News };

function SkeletonArticle() {
  return (
    <div className="skeleton-card" style={{ height: 260, borderRadius: 20 }}>
      <div style={{ height: 160, borderRadius: 14, marginBottom: 16 }} className="skeleton" />
      <div className="skeleton skeleton-title" style={{ width: '80%', marginBottom: 10 }} />
      <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: 6 }} />
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
    <div className="news-page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .news-bento {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }
        .news-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .news-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        .news-card-header {
          position: relative;
          height: 180px;
          background: linear-gradient(135deg, var(--bg3), var(--bg4));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text4);
          overflow: hidden;
        }
        .news-card-header::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 60%, rgba(8,15,30,0.8));
          pointer-events: none;
        }
        .news-card-header svg {
          opacity: 0.2;
          transform: scale(3);
          transition: transform 0.6s ease;
        }
        .news-card:hover .news-card-header svg {
          transform: scale(3.5) rotate(5deg);
        }
        .news-card-body {
          padding: 24px;
          flex: 1;
        }
        .news-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .category-badge {
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .news-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.4;
          color: var(--text);
          margin-bottom: 12px;
        }
        .news-excerpt {
          font-size: 0.88rem;
          color: var(--text3);
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .read-more-btn {
          color: var(--primary-light);
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: gap 0.2s;
        }
        .read-more-btn:hover {
          color: var(--primary);
          gap: 10px;
        }
        
        @media (min-width: 1024px) {
          .news-card.featured {
            grid-column: span 2;
            flex-direction: row;
          }
          .news-card.featured .news-card-header {
            width: 40%;
            height: auto;
          }
          .news-card.featured .news-card-body {
            width: 60%;
          }
          .news-card.featured .news-title {
            font-size: 1.6rem;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 20px var(--primary-glow)' }}>
              <Ic.News size={24} />
            </div>
            Health News & Updates
          </div>
          <div className="page-subtitle">Disseminating essential medical insights and clinical breakthroughs</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['all', 'general', 'covid', 'wellness', 'policy', 'training'].map(c => {
            const active = cat === c;
            const cfg = c === 'all' ? { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' } : getCat(c);
            return (
              <button 
                key={c} 
                onClick={() => setCat(c)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: active ? cfg.color : 'var(--bg3)',
                  color: active ? '#fff' : 'var(--text3)',
                  borderColor: active ? cfg.color : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: active ? `0 4px 15px ${cfg.bg}` : 'none'
                }}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            );
          })}
        </div>
        
        <div style={{ position: 'relative', minWidth: 260 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'var(--bg2)', height: 42 }} 
            placeholder="Search news articles..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="news-bento">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonArticle key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Ic.News size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div className="empty-state-text">No articles found in this category</div>
        </div>
      ) : (
        <div className="news-bento">
          {filtered.map((n, idx) => {
            const cfg = getCat(n.category);
            const Icon = cfg.Icon;
            const isFeatured = idx === 0 && cat === 'all' && !search;
            
            return (
              <div key={n._id} className={`news-card ${isFeatured ? 'featured' : ''}`}>
                <div className="news-card-header">
                  <Icon size={48} />
                  <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1 }}>
                     <span className="category-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, backdropFilter: 'blur(10px)' }}>
                        <Icon size={12} />
                        {n.category || 'General'}
                     </span>
                  </div>
                </div>
                
                <div className="news-card-body">
                  <div className="news-meta">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Ic.Calendar size={14} />
                      {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <h3 className="news-title">{n.title}</h3>
                  <p className="news-excerpt" style={{ -webkit-line-clamp: isFeatured ? 4 : 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.content}
                  </p>
                  
                  <button className="read-more-btn">
                    Read Intelligence Report
                    <Ic.ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

