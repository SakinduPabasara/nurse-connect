import { useState, useEffect } from 'react';
import API from '../../api/axios';
import SearchableSelect from '../../components/SearchableSelect';
import * as Ic from '../../components/icons';

const STATUS_CFG = {
  available:   { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Ic.Check },
  maintenance: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', Icon: Ic.Wrench },
  unavailable: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  Icon: Ic.X },
};

const getCfg = s => STATUS_CFG[s] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', Icon: Ic.Info };

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [ward, setWard] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const url = ward ? `/equipment?ward=${encodeURIComponent(ward)}` : '/equipment';
      const { data } = await API.get(url);
      setEquipment(Array.isArray(data) ? data : []);
    } catch { setEquipment([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchEquipment(); }, [ward]);

  useEffect(() => {
    API.get('/wards').then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const filtered = equipment.filter(e =>
    (statusFilter === 'all' || e.status === statusFilter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.ward || '').toLowerCase().includes(search.toLowerCase()))
  );

  const counts = { available: 0, maintenance: 0, unavailable: 0 };
  equipment.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });

  return (
    <div className="equipment-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .equipment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }
        .equip-card-premium {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .equip-card-premium:hover {
          transform: translateY(-5px);
          border-color: var(--primary-light);
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }
        .equip-icon-bg {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          border: 1px solid var(--border);
        }
        .equip-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
        }
        .equip-meta {
           font-size: 0.8rem;
           color: var(--text3);
           display: flex;
           flex-direction: column;
           gap: 6px;
           margin-bottom: 20px;
        }
        .equip-status-tag {
           margin-top: auto;
           padding: 6px 14px;
           border-radius: 10px;
           font-size: 0.75rem;
           font-weight: 800;
           text-transform: uppercase;
           display: flex;
           align-items: center;
           justify-content: center;
           gap: 8px;
        }
        .stats-bar {
           display: flex;
           gap: 12px;
           margin-bottom: 32px;
           overflow-x: auto;
           padding-bottom: 8px;
        }
        .stat-pill {
           background: var(--bg2);
           border: 1px solid var(--border);
           padding: 10px 20px;
           border-radius: 999px;
           display: flex;
           align-items: center;
           gap: 12px;
           white-space: nowrap;
           cursor: pointer;
           transition: all 0.2s;
        }
        .stat-pill:hover {
           background: var(--bg3);
           border-color: var(--text4);
        }
        .stat-pill.active {
           background: var(--primary);
           border-color: var(--primary);
           color: #fff;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Ic.Wrench size={24} />
            </div>
            Critical Equipment Assets
          </div>
          <div className="page-subtitle">Monitoring and maintenance lifecycle management for medical hardware</div>
        </div>
      </div>

      <div className="stats-bar">
        {[
          { label: 'Total Assets', value: equipment.length, color: '#60a5fa', status: 'all', Icon: Ic.Wrench },
          { label: 'Available', value: counts.available, color: '#34d399', status: 'available', Icon: Ic.Check },
          { label: 'In Maintenance', value: counts.maintenance, color: '#fbbf24', status: 'maintenance', Icon: Ic.Wrench },
          { label: 'Unavailable', value: counts.unavailable, color: '#f87171', status: 'unavailable', Icon: Ic.X },
        ].map(s => (
          <div 
            key={s.status} 
            className={`stat-pill ${statusFilter === s.status ? 'active' : ''}`}
            onClick={() => setStatusFilter(s.status)}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusFilter === s.status ? '#fff' : s.color }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontWeight: 800, opacity: 0.8 }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'var(--surface)', height: 44 }} 
            placeholder="Search assets by name or ID..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <SearchableSelect
          className="compact premium"
          style={{ width: 240, height: 44 }}
          options={wards.map(w => ({ value: w.name, label: w.name }))}
          value={ward}
          onChange={setWard}
          placeholder="Filter by Hospital Ward"
        />
      </div>

      {loading ? (
        <div className="equipment-grid">
           {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="skeleton-card" style={{ height: 220, borderRadius: 20 }} />
           ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
           <Ic.Wrench size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
           <div className="empty-state-text">No equipment found matching criteria</div>
        </div>
      ) : (
        <div className="equipment-grid">
          {filtered.map(e => {
            const cfg = getCfg(e.status);
            const StatusIcon = cfg.Icon;
            return (
              <div key={e._id} className="equip-card-premium">
                <div className="equip-icon-bg" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                  <StatusIcon size={22} />
                </div>
                
                <div className="equip-name">{e.name}</div>
                
                <div className="equip-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Ic.Hospital size={14} /> {e.ward || 'General Inventory'}
                  </span>
                  {e.lastMaintenance && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Ic.Clock size={14} /> Last Service: {new Date(e.lastMaintenance).toLocaleDateString()}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Ic.Info size={14} /> Asset ID: {e._id.slice(-8).toUpperCase()}
                  </span>
                </div>
                
                <div 
                   className="equip-status-tag" 
                   style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                >
                  <StatusIcon size={14} />
                  {e.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

