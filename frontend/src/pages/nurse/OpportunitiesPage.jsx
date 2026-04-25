import { useState, useEffect } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const TYPE_CFG = {
  international: { color: '#22d3ee', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', Icon: Ic.Globe },
  local:         { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Ic.Hospital },
  training:      { color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)', Icon: Ic.Award },
  certification: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', Icon: Ic.Check },
};

const getType = t => TYPE_CFG[t] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', Icon: Ic.Globe };
const TYPES = ['all','international','local','training','certification'];

const deadlineInfo = (dl) => {
  const diff = (new Date(dl) - new Date()) / 86400000;
  if (diff < 0) return { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'Applications Closed', Icon: Ic.X };
  if (diff < 7) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: `Closing in ${Math.ceil(diff)}d`, Icon: Ic.AlertTriangle };
  return { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: `${Math.ceil(diff)} days remaining`, Icon: Ic.Clock };
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
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [type]);

  const filtered = items.filter(o =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || (o.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = items.filter(o => new Date(o.deadline) >= new Date()).length;
  const closingSoonCount = items.filter(o => { const d = (new Date(o.deadline)-new Date())/86400000; return d > 0 && d < 7; }).length;

  return (
    <div className="opportunities-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .stats-grid-compact {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .opp-stat-card {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 16px;
           padding: 20px;
           display: flex;
           align-items: center;
           gap: 16px;
           backdrop-filter: blur(20px);
        }
        .opp-grid {
           display: grid;
           grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
           gap: 20px;
        }
        .opp-card-modern {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 20px;
           padding: 28px;
           display: flex;
           flex-direction: column;
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           position: relative;
           overflow: hidden;
        }
        .opp-card-modern:hover {
           transform: translateY(-6px);
           border-color: var(--primary-light);
           box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .opp-card-modern::after {
           content: '';
           position: absolute;
           top: 0; right: 0; width: 100px; height: 100px;
           background: radial-gradient(circle at top right, var(--primary-glow), transparent 70%);
           pointer-events: none;
        }
        .opp-type-badge {
           display: inline-flex;
           align-items: center;
           gap: 6px;
           padding: 4px 12px;
           border-radius: 999px;
           font-size: 0.7rem;
           font-weight: 700;
           text-transform: uppercase;
           letter-spacing: 0.05em;
           margin-bottom: 16px;
        }
        .opp-title-main {
           font-family: 'DM Sans', sans-serif;
           font-size: 1.25rem;
           font-weight: 700;
           color: var(--text);
           line-height: 1.4;
           margin-bottom: 12px;
        }
        .opp-desc-main {
           font-size: 0.9rem;
           color: var(--text3);
           line-height: 1.6;
           margin-bottom: 24px;
           flex: 1;
        }
        .opp-footer-main {
           display: flex;
           align-items: center;
           justify-content: space-between;
           padding-top: 20px;
           border-top: 1px solid var(--border-light);
        }
        .opp-meta-item {
           font-size: 0.78rem;
           color: var(--text3);
           display: flex;
           align-items: center;
           gap: 6px;
        }
        
        @media (max-width: 640px) {
           .opp-grid {
              grid-template-columns: 1fr;
           }
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Ic.Globe size={24} />
            </div>
            Global Career Pathways
          </div>
          <div className="page-subtitle">Curated professional opportunities for specialized nursing careers</div>
        </div>
      </div>

      <div className="stats-grid-compact">
         <div className="opp-stat-card">
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Globe size={20} />
            </div>
            <div>
               <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{items.length}</div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>Active Postings</div>
            </div>
         </div>
         <div className="opp-stat-card">
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Check size={20} />
            </div>
            <div>
               <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeCount}</div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>Opening Now</div>
            </div>
         </div>
         <div className="opp-stat-card">
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.AlertTriangle size={20} />
            </div>
            <div>
               <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{closingSoonCount}</div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>Closing within 7d</div>
            </div>
         </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
         <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input 
               className="form-input" 
               style={{ paddingLeft: 42, background: 'var(--surface)', height: 44, borderRadius: 14 }} 
               placeholder="Filter by keyword (e.g. ICU, Dubai, UK)..." 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
            />
         </div>
         <div style={{ display: 'flex', gap: 8 }}>
            {TYPES.slice(0, 3).map(t => (
               <button 
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                     padding: '0 18px',
                     height: 44,
                     borderRadius: 14,
                     fontSize: '0.82rem',
                     fontWeight: 600,
                     border: '1px solid',
                     cursor: 'pointer',
                     transition: 'all 0.2s',
                     background: type === t ? 'var(--primary)' : 'var(--bg2)',
                     color: type === t ? '#fff' : 'var(--text3)',
                     borderColor: type === t ? 'var(--primary)' : 'var(--border)'
                  }}
               >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
               </button>
            ))}
         </div>
      </div>

      {loading ? (
        <div className="opp-grid">
           {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="skeleton-card" style={{ height: 300, borderRadius: 20 }} />
           ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
           <Ic.Globe size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
           <div className="empty-state-text">No opportunities found for the selected criteria</div>
        </div>
      ) : (
        <div className="opp-grid">
          {filtered.map(o => {
            const typeCfg = getType(o.type);
            const dl = deadlineInfo(o.deadline);
            const TypeIcon = typeCfg.Icon;
            const DeadlineIcon = dl.Icon;
            
            return (
              <div key={o._id} className="opp-card-modern">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                   <div className="opp-type-badge" style={{ background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}` }}>
                      <TypeIcon size={12} />
                      {o.type}
                   </div>
                   <div className="opp-type-badge" style={{ background: dl.bg, color: dl.color, border: `1px solid ${dl.border}` }}>
                      <DeadlineIcon size={12} />
                      {dl.label}
                   </div>
                </div>
                
                <h3 className="opp-title-main">{o.title}</h3>
                <p className="opp-desc-main">{o.description}</p>
                
                <div className="opp-footer-main">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="opp-meta-item">
                      <Ic.MapPin size={14} /> {o.location || 'Remote/Flexible'}
                    </div>
                    <div className="opp-meta-item">
                      <Ic.Calendar size={14} /> Deadline: {new Date(o.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <button className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>
                    <Ic.ExternalLink size={14} /> Access
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

