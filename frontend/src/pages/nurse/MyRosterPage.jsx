import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

const FILTER_BTNS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'all',      label: 'All'      },
  { id: 'past',     label: 'Past'     },
];

export default function MyRosterPage() {
  const navigate = useNavigate();
  const [shifts, setShifts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('upcoming');

  const fetchRoster = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get('/roster/my');
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      setShifts([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  useEffect(() => {
    let socket;
    import('../../utils/socketClient').then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      
      const onUpdate = () => fetchRoster(true);
      socket.on('roster:updated', onUpdate);
      socket.on('swap:updated', onUpdate);
    });

    return () => {
      if (socket) {
        socket.off('roster:updated');
        socket.off('swap:updated');
      }
    };
  }, [fetchRoster]);

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

  /* Days until next shift */
  const daysUntil = nextShift
    ? Math.ceil((new Date(nextShift.date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
    : null;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div className="page-title-icon" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}>
              <Ic.Calendar size={22} />
            </div>
            Clinical Duty Roster
          </div>
          <div className="page-subtitle">Your personalized shift schedule and ward assignments</div>
        </div>
      </div>

      {/* ── Next Shift Hero ── */}
      {nextShift && filter === 'upcoming' && !loading && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(6,182,212,0.07) 100%)',
          border: '1px solid rgba(37,99,235,0.22)',
          borderRadius: 22,
          padding: '28px 32px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
          position: 'relative', overflow: 'hidden',
          animation: 'scale-in 0.35s ease',
        }}>
          <div style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Icon box */}
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 14px 36px rgba(37,99,235,0.42)', zIndex: 1, flexShrink: 0 }}>
            {Ic.shiftIcon(nextShift.shift)}
          </div>

          <div style={{ flex: 1, zIndex: 1 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
              {daysUntil === 0 ? '🟢 Active Today' : `Next Assignment · ${daysUntil}d away`}
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.02em' }}>
              {nextShift.shift} Shift
            </div>
            <div style={{ display: 'flex', gap: 20, color: 'var(--text3)', fontSize: '0.84rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ic.Calendar size={15} />
                {new Date(nextShift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ic.Hospital size={15} />
                {nextShift.ward || 'Ward TBD'}
              </span>
              {nextShift.startTime && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ic.Clock size={15} />
                  {nextShift.startTime} — {nextShift.endTime}
                </span>
              )}
            </div>
          </div>

          {daysUntil === 0 && (
            <div style={{ zIndex: 1 }}>
              <button className="btn btn-success" style={{ padding: '12px 24px', borderRadius: 14, fontSize: '0.88rem' }}>
                Check-In Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {FILTER_BTNS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '9px 22px',
              borderRadius: 12,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              background: filter === f.id ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'rgba(255,255,255,0.03)',
              color: filter === f.id ? '#fff' : 'var(--text3)',
              borderColor: filter === f.id ? 'transparent' : 'var(--border)',
              boxShadow: filter === f.id ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
            }}
          >
            {f.label}
            <span style={{ marginLeft: 8, fontSize: '0.72rem', opacity: 0.7 }}>
              {f.id === 'upcoming' ? upcomingShifts.length : f.id === 'past' ? shifts.filter(s => new Date(s.date) < now).length : shifts.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ height: 96, borderRadius: 18 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ color: 'var(--text4)', marginBottom: 14, display: 'flex', justifyContent: 'center' }}><Ic.Calendar size={44} /></div>
          <div className="empty-state-text">No shifts found for this filter</div>
          <div className="empty-state-sub">Try switching to a different view above</div>
        </div>
      ) : (
        Object.entries(grouped).map(([month, monthShifts]) => (
          <div key={month} style={{ marginBottom: 32 }}>

            {/* Month label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                padding: '6px 16px', borderRadius: 999,
                fontSize: '0.77rem', fontWeight: 700, color: 'var(--text2)',
                backdropFilter: 'blur(12px)',
              }}>
                <Ic.Calendar size={12} />
                {month}
              </div>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
              <span style={{ fontSize: '0.68rem', color: 'var(--text4)', fontWeight: 600 }}>{monthShifts.length} shifts</span>
            </div>

            {/* Shift cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {monthShifts.map(s => {
                const d = new Date(s.date);
                const isToday = d.toDateString() === now.toDateString();
                const cfg = Ic.shiftColor(s.shift);

                return (
                  <div key={s._id} style={{
                    background: 'var(--surface)',
                    border: `1px solid ${isToday ? '#34d399' : 'var(--border)'}`,
                    borderRadius: 18,
                    padding: '18px 22px',
                    display: 'flex', alignItems: 'center', gap: 18,
                    transition: 'all 0.22s ease',
                    boxShadow: isToday ? '0 0 24px rgba(52,211,153,0.12)' : 'none',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px)'; e.currentTarget.style.borderColor = isToday ? '#34d399' : 'rgba(37,99,235,0.28)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = isToday ? '#34d399' : 'var(--border)'; e.currentTarget.style.boxShadow = isToday ? '0 0 24px rgba(52,211,153,0.12)' : 'none'; }}
                  >
                    {/* Date box */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 46, flexShrink: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '8px 4px', border: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{d.getDate()}</span>
                    </div>

                    {/* Shift icon */}
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {Ic.shiftIcon(s.shift)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{s.shift} Duty</span>
                        {isToday && (
                          <span style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', fontSize: '0.62rem', fontWeight: 800, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em', animation: 'glow-pulse 2s ease infinite' }}>
                            Active Now
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: '0.76rem', color: 'var(--text3)', flexWrap: 'wrap' }}>
                        {s.startTime && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Ic.Clock size={12} /> {s.startTime} — {s.endTime}
                          </span>
                        )}
                        {s.ward && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Ic.Hospital size={12} /> {s.ward}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action area */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{ padding: '4px 12px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 8, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {s.shift}
                      </div>
                      {new Date(s.date) >= now && (
                        <button
                          onClick={() => navigate('/swap', {
                            state: {
                              autoTab: 'new',
                              prefill: {
                                requesterShiftDate: s.date,
                                requesterShift: s.shift,
                              }
                            }
                          })}
                          style={{
                            all: 'unset', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 14px', borderRadius: 8,
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            color: '#818cf8', fontSize: '0.68rem', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            transition: 'all 0.18s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = '#818cf8'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                          title="Request a shift swap for this duty"
                        >
                          <Ic.Swap size={12} />
                          Swap
                        </button>
                      )}
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
