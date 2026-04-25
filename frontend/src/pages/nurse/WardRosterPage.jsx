import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import * as Ic from '../../components/icons';

const SHIFT_META = {
  '7AM-1PM':  { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.2)' },
  '1PM-7PM':  { color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)',   border: 'rgba(45,212,191,0.2)' },
  '7AM-7PM':  { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.2)' },
  '7PM-7AM':  { color: '#a78bfa', bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.2)' },
};
const getMeta = s => SHIFT_META[s] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };

export default function WardRosterPage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  const [ward, setWard] = useState(user?.ward || '');
  const [wards, setWards] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const wardOptions = [...new Set([...(user?.ward ? [user.ward] : []), ...wards])];

  useEffect(() => {
    Promise.all([
      API.get('/wards').then(r => (Array.isArray(r.data) ? r.data.map(w => w.name) : [])).catch(() => []),
      API.get('/roster/wards').then(r => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
    ]).then(([managed, roster]) => {
      const merged = [...new Set([...managed, ...roster])].sort();
      setWards(merged);
    });
  }, []);

  useEffect(() => {
    if (!ward) { setRoster([]); return; }
    setLoading(true);
    API.get(`/roster/ward/${ward === '__ALL__' ? 'all' : encodeURIComponent(ward)}?month=${month}`)
      .then(r => setRoster(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRoster([]))
      .finally(() => setLoading(false));
  }, [month, ward]);

  const filtered = roster.filter(e =>
    !search || (e.nurse?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.ward || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ward-roster-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .ward-header-card {
          background: linear-gradient(135deg, var(--bg3), var(--bg4));
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }
        .ward-header-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, var(--info-glow), transparent 60%);
          opacity: 0.3;
        }
        
        .roster-staff-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        .staff-shift-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
          position: relative;
        }
        .staff-shift-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary-light);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        .staff-shift-card.me {
          border-color: var(--primary);
          background: rgba(37,99,235,0.04);
        }
        .staff-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: var(--bg3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          font-weight: 700;
          border: 1px solid var(--border);
          flex-shrink: 0;
        }
        .date-badge-mini {
          width: 50px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .date-badge-mini .mon {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text3);
        }
        .date-badge-mini .day {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text);
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Ic.Hospital size={24} />
            </div>
            Ward Occupancy & Roster
          </div>
          <div className="page-subtitle">Synchronized staffing schedule for unit operations</div>
        </div>
      </div>

      <div className="ward-header-card">
         <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--info)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Operational Unit</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{ward === '__ALL__' ? 'Hospital-Wide Overview' : ward || 'Unit Not Selected'}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
               <span style={{ fontSize: '0.85rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Calendar size={14} /> {new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
               <span style={{ fontSize: '0.85rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}><Ic.User size={14} /> staff on duty: {roster.length}</span>
            </div>
         </div>
         
         <div style={{ display: 'flex', gap: 12, zIndex: 1 }}>
            <select className="form-select" style={{ width: 220, background: 'var(--bg2)', height: 44 }} value={ward} onChange={e => setWard(e.target.value)}>
              <option value="">Select Ward</option>
              <option value="__ALL__">All Departments</option>
              {wardOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <input type="month" className="form-input" style={{ width: 160, background: 'var(--bg2)', height: 44 }} value={month} onChange={e => setMonth(e.target.value)} />
         </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'var(--surface)', height: 44 }} 
            placeholder="Search by personnel name or department..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="roster-staff-grid">
           {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="skeleton-card" style={{ height: 100, borderRadius: 20 }} />
           ))}
        </div>
      ) : !ward ? (
        <div className="empty-state">
           <Ic.Hospital size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
           <div className="empty-state-text">Select an operational unit to examine staffing</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
           <Ic.Inbox size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
           <div className="empty-state-text">No rostered personnel found targeting these criteria</div>
        </div>
      ) : (
        <div className="roster-staff-grid">
          {filtered.map(entry => {
            const isMe = entry.nurse?._id === user?._id;
            const meta = getMeta(entry.shift);
            const dateObj = new Date(entry.date);
            
            return (
              <div key={entry._id} className={`staff-shift-card ${isMe ? 'me' : ''}`}>
                <div className="date-badge-mini">
                   <span className="mon">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                   <span className="day">{dateObj.getDate()}</span>
                </div>
                
                <div className="staff-avatar">
                   {entry.nurse?.profilePic ? (
                     <img src={`http://localhost:5000${entry.nurse.profilePic}`} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                   ) : (
                     (entry.nurse?.name || 'N')[0].toUpperCase()
                   )}
                </div>
                
                <div style={{ flex: 1 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{entry.nurse?.name || 'Assigned Nurse'}</span>
                      {isMe && <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Me</span>}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: 'var(--text3)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic.Clock size={12} /> {entry.shift}</span>
                      {ward === '__ALL__' && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic.Hospital size={12} /> {entry.ward}</span>}
                   </div>
                </div>
                
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

