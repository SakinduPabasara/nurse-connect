import { useState, useEffect } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

function groupByMonth(shifts) {
  const groups = {};
  shifts.forEach(s => {
    const d = new Date(s.date);
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return groups;
}

export default function MyRosterPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // all | upcoming | past

  useEffect(() => {
    API.get('/roster/my')
      .then(({ data }) => setShifts(Array.isArray(data) ? data : []))
      .catch(() => setShifts([]))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const sorted = [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const upcomingShifts = sorted.filter(s => new Date(s.date) >= now);
  const nextShift = upcomingShifts[0];

  const filtered = sorted.filter(s => {
    const d = new Date(s.date);
    if (filter === 'upcoming') return d >= now;
    if (filter === 'past') return d < now;
    return true;
  });

  const grouped = groupByMonth(filtered);

  return (
    <div className="roster-page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .next-shift-hero {
          background: linear-gradient(135deg, var(--bg3), var(--bg4));
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 40px;
          display: flex;
          align-items: center;
          gap: 32px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        .next-shift-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, var(--primary-glow), transparent 60%);
          opacity: 0.4;
        }
        .hero-icon-box {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 15px 35px var(--primary-glow);
          z-index: 1;
        }
        .hero-content {
          flex: 1;
          z-index: 1;
        }
        .hero-label {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--primary-light);
          margin-bottom: 8px;
          display: block;
        }
        .hero-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 4px;
        }
        
        .timeline-section {
          padding-left: 20px;
          border-left: 2px dashed var(--border);
          margin-left: 10px;
          position: relative;
        }
        .month-divider {
          position: sticky;
          top: 0;
          z-index: 10;
          padding: 20px 0;
          background: var(--bg);
          margin-left: -32px;
          padding-left: 22px;
        }
        .month-chip {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 6px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(10px);
        }
        .roster-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
          position: relative;
        }
        .roster-card:hover {
          transform: translateX(8px);
          border-color: var(--primary-light);
          background: var(--surface-raised);
        }
        .roster-card.today {
          border-color: #34d399;
          box-shadow: 0 0 25px rgba(52,211,153,0.15);
        }
        .date-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 50px;
          flex-shrink: 0;
        }
        .day-num {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
        }
        .day-name {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text3);
          text-transform: uppercase;
        }
        .shift-badge {
          padding: 4px 12px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 20px var(--primary-glow)' }}>
              <Ic.Calendar size={24} />
            </div>
            Clinical Duty Roster
          </div>
          <div className="page-subtitle">Your personalized shift schedule and ward assignments</div>
        </div>
      </div>

      {nextShift && filter === 'upcoming' && (
        <div className="next-shift-hero">
          <div className="hero-icon-box">
             {Ic.shiftIcon(nextShift.shift)}
          </div>
          <div className="hero-content">
            <span className="hero-label">Immediate Assignment</span>
            <div className="hero-title">{nextShift.shift} Shift</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, color: var(--text3), fontSize: '0.9rem' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Calendar size={18} /> {new Date(nextShift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Hospital size={18} /> {nextShift.ward}</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Clock size={18} /> {nextShift.startTime} — {nextShift.endTime}</span>
            </div>
          </div>
          <div style={{ zIndex: 1 }}>
             <button className="btn btn-primary" style={{ height: 48, padding: '0 24px', borderRadius: 14 }}>
                Check-In Required
             </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {['all', 'upcoming', 'past'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            style={{
              padding: '10px 24px',
              borderRadius: '14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filter === f ? 'var(--primary)' : 'var(--bg2)',
              color: filter === f ? '#fff' : 'var(--text3)',
              borderColor: filter === f ? 'var(--primary)' : 'var(--border)'
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="skeleton-card" style={{ height: 100, borderRadius: 20 }} />
           ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
           <Ic.Calendar size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
           <div className="empty-state-text">No shifts found for this criteria</div>
        </div>
      ) : (
        Object.entries(grouped).map(([month, monthShifts]) => (
          <div key={month} style={{ position: 'relative' }}>
            <div className="month-divider">
              <div className="month-chip">
                <Ic.Calendar size={14} />
                {month}
              </div>
            </div>

            <div className="timeline-section">
              {monthShifts.map(s => {
                const d = new Date(s.date);
                const isToday = d.toDateString() === now.toDateString();
                const cfg = Ic.shiftColor(s.shift);
                
                return (
                  <div key={s._id} className={`roster-card ${isToday ? 'today' : ''}`}>
                    <div className="date-box">
                       <span className="day-name">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                       <span className="day-num">{d.getDate()}</span>
                    </div>

                    <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {Ic.shiftIcon(s.shift)}
                    </div>

                    <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.shift} Duty</span>
                          {isToday && <span style={{ background: '#34d399', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>Active Now</span>}
                       </div>
                       <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text3)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic.Clock size={12} /> {s.startTime} — {s.endTime}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic.Hospital size={12} /> {s.ward}</span>
                       </div>
                    </div>

                    <div className="shift-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                       {s.shift}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

