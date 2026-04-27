import { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const NOTICE_TYPES = {
  circular:   { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.2)',  Icon: Ic.FileText, label: 'Circular' },
  alert:      { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  Icon: Ic.AlertTriangle, label: 'Urgent' },
  guideline:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  Icon: Ic.Tag, label: 'Policy' },
  training:   { color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  Icon: Ic.Award, label: 'Training' },
};

const getType = t => NOTICE_TYPES[t] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)', Icon: Ic.Info, label: t };

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

  const filtered = useMemo(() => {
    return notices.filter(n =>
      (type === 'all' || n.category === type) &&
      (!search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase()))
    );
  }, [notices, type, search]);

  const urgentCount = useMemo(() => notices.filter(n => n.category === 'alert').length, [notices]);

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Intelligence Network</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Bell size={24} color="#fff" />
             </div>
             Broadcast Center
          </div>
        </div>
        
        {urgentCount > 0 && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '10px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 12,
            fontSize: '0.85rem', color: '#f87171', fontWeight: 700, animation: 'pulse 2s infinite'
          }}>
            <Ic.AlertTriangle size={18} />
            {urgentCount} Priority Alerts
          </div>
        )}
      </div>

      {/* ── Type Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
        {['all', 'circular', 'alert', 'guideline', 'training'].map(t => {
          const active = type === t;
          const cfg = t === 'all' ? { color: '#fff', bg: 'rgba(255,255,255,0.05)', Icon: Ic.Inbox, label: 'All Intelligence' } : getType(t);
          return (
            <button 
              key={t}
              onClick={() => setType(t)}
              style={{ 
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, 
                padding: '12px 20px', borderRadius: 18, background: active ? `${cfg.color}15` : 'rgba(255,255,255,0.02)',
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

      <div style={{ position: 'relative', marginBottom: 32 }}>
        <Ic.Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input 
          className="form-input" 
          style={{ paddingLeft: 48, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', height: 52, borderRadius: 16 }} 
          placeholder="Filter broadcast archives..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {/* ── Masonry-style Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 200, borderRadius: 24 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Inbox size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>No communications found.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>
          {filtered.map((n, idx) => {
            const cfg = getType(n.category);
            const isAlert = n.category === 'alert';
            const isOpen = expanded === n._id;
            
            return (
              <div 
                key={n._id} 
                onClick={() => setExpanded(isOpen ? null : n._id)}
                style={{ 
                  background: isAlert ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(239, 68, 68, 0.05))' : 'rgba(30, 41, 59, 0.4)', 
                  border: `1px solid ${isAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 24, padding: '28px', cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', backdropFilter: 'blur(12px)',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-6px)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; el.currentTarget.style.borderColor = isAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.06)'; }}
              >
                {isAlert && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: '#ef4444' }} />}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cfg.color}15`, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                    <cfg.Icon size={24} />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: cfg.color, background: `${cfg.color}15`, padding: '4px 10px', borderRadius: 8, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </span>
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.4 }}>{n.title}</div>
                
                <div style={{ 
                  fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, 
                  display: isOpen ? 'block' : '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden', transition: 'all 0.3s'
                }}>
                  {n.content}
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#64748b' }}>
                    <Ic.Calendar size={14} />
                    {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isOpen ? 'Close Intel' : 'Expand Report'}
                    <Ic.ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes screen-entry { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}
