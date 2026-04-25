import { useState, useEffect } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const expiryInfo = (date) => {
  const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'Expired', status: 'critical' };
  if (diff < 30) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: `${Math.ceil(diff)}d left`, status: 'warning' };
  return { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: 'Secure', status: 'safe' };
};

export default function DrugsPage() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [ward, setWard] = useState('');
  const [search, setSearch] = useState('');

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const url = ward ? `/drugs?ward=${encodeURIComponent(ward)}` : '/drugs';
      const { data } = await API.get(url);
      setDrugs(Array.isArray(data) ? data : []);
    } catch { setDrugs([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDrugs(); }, [ward]);

  useEffect(() => {
    API.get('/wards').then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const filtered = drugs.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.ward || '').toLowerCase().includes(search.toLowerCase())
  );

  const expiredCount = drugs.filter(d => new Date(d.expiryDate) < new Date()).length;
  const expiringSoonCount = drugs.filter(d => { const diff = (new Date(d.expiryDate) - new Date()) / 86400000; return diff > 0 && diff < 30; }).length;

  return (
    <div className="drugs-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        .premium-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }
        .premium-stat-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, var(--accent-glow), transparent 70%);
          pointer-events: none;
        }
        .stat-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .stat-value-big {
          font-family: 'DM Sans', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-label-dim {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .inventory-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 16px;
        }
        .drug-item-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 18px;
          transition: all 0.3s ease;
          position: relative;
        }
        .drug-item-card:hover {
          transform: translateX(6px);
          border-color: var(--primary-light);
          background: var(--surface-raised);
        }
        .drug-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: var(--bg3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
          border: 1px solid var(--border);
        }
        .drug-name-main {
          font-weight: 700;
          font-size: 1rem;
          color: var(--text);
          margin-bottom: 4px;
        }
        .drug-meta-row {
          display: flex;
          gap: 12px;
          font-size: 0.78rem;
          color: var(--text3);
        }
        .status-indicator {
           padding: 4px 12px;
           border-radius: 999px;
           font-size: 0.72rem;
           font-weight: 800;
           text-transform: uppercase;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Ic.Pill size={24} />
            </div>
            Pharmaceutical Inventory
          </div>
          <div className="page-subtitle">Real-time stock management and medication tracking dashboard</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="premium-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
            <Ic.Pill size={24} />
          </div>
          <div className="stat-value-big">{drugs.length}</div>
          <div className="stat-label-dim">Total SKUs in Stock</div>
        </div>
        <div className="premium-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
            <Ic.AlertTriangle size={24} />
          </div>
          <div className="stat-value-big">{expiringSoonCount}</div>
          <div className="stat-label-dim">Expiring (30 Days)</div>
        </div>
        <div className="premium-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}>
            <Ic.X size={24} />
          </div>
          <div className="stat-value-big">{expiredCount}</div>
          <div className="stat-label-dim">Expired / Critical</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'var(--surface)', height: 42 }} 
            placeholder="Search medications, salts, or wards..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <select
          className="form-select"
          style={{ width: 220, height: 42, background: 'var(--surface)' }}
          value={ward}
          onChange={e => setWard(e.target.value)}
        >
          <option value="">All Hospital Wards</option>
          {wards.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-center" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
           <Ic.Inbox size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
           <div className="empty-state-text">No medication matches found</div>
        </div>
      ) : (
        <div className="inventory-list">
          {filtered.map(d => {
            const exp = expiryInfo(d.expiryDate);
            return (
              <div key={d._id} className="drug-item-card">
                <div className="drug-icon-box">
                  <Ic.Pill size={24} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div className="drug-name-main">{d.name}</div>
                  <div className="drug-meta-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Ic.Hospital size={12} /> {d.ward || 'General'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Ic.Clock size={12} /> {d.quantity} {d.unit}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                       <Ic.Calendar size={12} /> {new Date(d.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div 
                   className="status-indicator" 
                   style={{ background: exp.bg, color: exp.color, border: `1px solid ${exp.border}` }}
                >
                  {exp.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

