import { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const TYPE_CFG = {
  international: { color: '#22d3ee', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', Icon: Ic.Globe, label: 'International' },
  local:         { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Ic.Hospital, label: 'Local' },
  training:      { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', Icon: Ic.Award, label: 'Training' },
  certification: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', Icon: Ic.Check, label: 'Certification' },
};

const getType = t => TYPE_CFG[t] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', Icon: Ic.Globe, label: t };

const deadlineInfo = (dl) => {
  const diff = (new Date(dl) - new Date()) / 86400000;
  if (diff < 0) return { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', label: 'Closed', Icon: Ic.X };
  if (diff < 7) return { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)', label: `${Math.ceil(diff)}d left`, Icon: Ic.AlertTriangle };
  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: `${Math.ceil(diff)} days`, Icon: Ic.Clock };
};

export default function OpportunitiesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = type === 'all' ? '/opportunities' : `/opportunities?type=${type}`;
      const { data } = await API.get(url);
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [type]);

  const filtered = useMemo(() => {
    return items.filter(o =>
      (!search || o.title.toLowerCase().includes(search.toLowerCase()) || (o.description || '').toLowerCase().includes(search.toLowerCase()))
    );
  }, [items, search]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      active: items.filter(o => new Date(o.deadline) >= today).length,
      urgent: items.filter(o => {
        const d = (new Date(o.deadline)-today)/86400000;
        return d > 0 && d < 7;
      }).length,
    };
  }, [items]);

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Career Advancement</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Globe size={24} color="#fff" />
             </div>
             Global Opportunities
          </div>
        </div>
      </div>

      {/* ── Status KPIs ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
        {[
          { label: 'Total Listings', value: items.length, color: '#6366f1', Icon: Ic.Inbox },
          { label: 'Active Openings', value: stats.active, color: '#10b981', Icon: Ic.Check },
          { label: 'Closing Soon', value: stats.urgent, color: '#fb923c', Icon: Ic.Clock },
        ].map(s => (
          <div 
            key={s.label}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 12, 
              padding: '12px 20px', borderRadius: 18, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              <s.Icon size={16} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>{s.label}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 48, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', height: 52, borderRadius: 16 }} 
            placeholder="Search roles, locations, or specialties..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'international', 'local', 'training'].map(t => {
            const active = type === t;
            const cfg = t === 'all' ? { color: '#fff', label: 'All Pathways' } : getType(t);
            return (
              <button 
                key={t}
                onClick={() => setType(t)}
                style={{ 
                  all: 'unset', cursor: 'pointer', padding: '0 20px', height: 52, borderRadius: 16,
                  fontSize: '0.82rem', fontWeight: 700,
                  background: active ? '#f59e0b15' : 'rgba(255,255,255,0.02)',
                  color: active ? '#f59e0b' : '#94a3b8',
                  border: `1px solid ${active ? '#f59e0b44' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Opportunities Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 260, borderRadius: 24 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Globe size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>No opportunities found in this archive.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {filtered.map(o => {
            const cfg = getType(o.type);
            const dl = deadlineInfo(o.deadline);
            
            return (
              <div key={o._id} style={{ 
                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: 24, padding: '28px', display: 'flex', flexDirection: 'column',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', backdropFilter: 'blur(20px)',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-8px)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: cfg.color, background: `${cfg.color}15`, padding: '4px 10px', borderRadius: 8, border: `1px solid ${cfg.border}` }}>
                     {cfg.label}
                   </span>
                   <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: dl.color, background: `${dl.color}15`, padding: '4px 10px', borderRadius: 8, border: `1px solid ${dl.border}` }}>
                     {dl.label}
                   </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>{o.title}</div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {o.description}
                  </div>
                </div>

                <div style={{ 
                  marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>
                         <Ic.MapPin size={14} color={cfg.color} /> {o.location || 'Global'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Closing: {new Date(o.deadline).toLocaleDateString()}</div>
                   </div>
                   <button style={{ all: 'unset', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 18px', borderRadius: 12, color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={el => { el.currentTarget.style.background = '#f59e0b'; el.currentTarget.style.borderColor = '#f59e0b'; }} onMouseLeave={el => { el.currentTarget.style.background = 'rgba(255,255,255,0.03)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                     Learn More <Ic.ExternalLink size={14} />
                   </button>
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
