import { useState, useEffect } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const NOTICE_TYPES = {
  general:    { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.2)',  Icon: Ic.Info },
  urgent:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  Icon: Ic.AlertTriangle },
  policy:     { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  Icon: Ic.Tag },
  event:      { color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  Icon: Ic.Calendar },
};

const getType = t => NOTICE_TYPES[t] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)', Icon: Ic.Info };

function SkeletonNotice() {
  return (
    <div className="skeleton-card" style={{ height: 180, borderRadius: 20 }}>
      <div className="skeleton-row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="skeleton skeleton-badge" style={{ width: 80 }} />
        <div className="skeleton skeleton-badge" style={{ width: 40 }} />
      </div>
      <div className="skeleton skeleton-title" style={{ width: '90%', marginBottom: 12 }} />
      <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: '70%' }} />
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
    <div className="notice-board-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .notice-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }
        .notice-card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .notice-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .notice-card.urgent {
          border-color: rgba(248, 113, 113, 0.3);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.05);
        }
        .notice-card.urgent::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #f87171, transparent);
        }
        .notice-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: transform 0.3s ease;
        }
        .notice-card:hover .notice-icon-box {
          transform: scale(1.1) rotate(-5deg);
        }
        .notice-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 12px;
          line-height: 1.4;
        }
        .notice-content {
          font-size: 0.88rem;
          color: var(--text2);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 20px;
          flex: 1;
        }
        .notice-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid var(--border-light);
          font-size: 0.75rem;
          color: var(--text3);
        }
        .notice-expanded-content {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border-light);
          color: var(--text2);
          font-size: 0.9rem;
          line-height: 1.7;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .filter-btn {
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg3);
          color: var(--text3);
        }
        .filter-btn:hover {
          background: var(--bg4);
          color: var(--text2);
        }
        .filter-btn.active {
          background: var(--primary);
          color: #fff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Ic.FileText size={24} />
            </div>
            Notice Board
          </div>
          <div className="page-subtitle">
            Stay updated with the latest hospital announcements and policies
          </div>
        </div>
        
        {urgentCount > 0 && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '8px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.85rem',
            color: '#f87171',
            fontWeight: 600
          }}>
            <Ic.AlertTriangle size={16} />
            {urgentCount} Critical Actions Pending
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'general', 'urgent', 'policy', 'event'].map(t => {
            const active = type === t;
            const Icon = t === 'all' ? Ic.Search : NOTICE_TYPES[t].Icon;
            return (
              <button key={t} onClick={() => setType(t)} className={`filter-btn ${active ? 'active' : ''}`}>
                <Icon size={14} />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'var(--bg2)', border: '1px solid var(--border)' }} 
            placeholder="Search announcements..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="notice-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonNotice key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '100px 20px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--text4)' }}>
            <Ic.FileText size={40} />
          </div>
          <div className="empty-state-text">No announcements found matching your criteria</div>
        </div>
      ) : (
        <div className="notice-grid">
          {filtered.map((n, idx) => {
            const cfg = getType(n.type);
            const Icon = cfg.Icon;
            const isUrgent = n.type === 'urgent';
            const isOpen = expanded === n._id;
            
            return (
              <div 
                key={n._id} 
                className={`notice-card ${isUrgent ? 'urgent' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => setExpanded(isOpen ? null : n._id)}
              >
                <div className="notice-icon-box" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  <Icon size={20} />
                </div>
                
                <div className="notice-title">{n.title}</div>
                <div className="notice-content" style={{ -webkit-line-clamp: isOpen ? 'unset' : 3 }}>
                  {n.content}
                </div>
                
                <div className="notice-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Ic.Calendar size={12} />
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize', color: cfg.color, fontWeight: 700 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
                    {n.type}
                  </div>
                </div>
                
                {isOpen && (
                  <div className="notice-expanded-content">
                    {/* Additional details could go here if available in model */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                       <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); /* handle action */ }}>
                        <Ic.Check size={14} /> Acknowledge
                       </button>
                    </div>
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

