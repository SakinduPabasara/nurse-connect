import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import * as Ic from '../../components/icons';

const SHIFT_COLORS = {
  '7AM-1PM': { label: '7AM–1PM', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.22)', Icon: Ic.Sun },
  '1PM-7PM': { label: '1PM–7PM', color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.22)', Icon: Ic.Sunset },
  '7AM-7PM': { label: '7AM–7PM', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)', Icon: Ic.Sun },
  '7PM-7AM': { label: '7PM–7AM', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.22)', Icon: Ic.Moon },
};

const getShift = t => {
  if (!t) return { label: '—', color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.22)', Icon: Ic.Clock };
  return SHIFT_COLORS[t] || { label: t, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.22)', Icon: Ic.Clock };
};

function SkeletonShift() {
  return (
    <div style={{ padding: '14px 20px', display: 'flex', gap: 14, alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton skeleton-text" style={{ width: '55%' }} />
        <div className="skeleton skeleton-text" style={{ width: '38%' }} />
      </div>
      <div className="skeleton skeleton-badge" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [shifts, setShifts]   = useState([]);
  const [stats, setStats]     = useState({ total: 0, morning: 0, night: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  const fetchRoster = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get('/roster/my');
      const list = Array.isArray(data) ? data : [];
      const now = new Date();
      setShifts(list);
      const morning  = list.filter(s => s.shift === '7AM-1PM' || s.shift === '7AM-7PM').length;
      const night    = list.filter(s => s.shift === '7PM-7AM').length;
      const upcoming = list.filter(s => new Date(s.date) >= now).length;
      setStats({ total: list.length, morning, night, upcoming });
    } catch {
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
      
      const onRosterUpdate = () => fetchRoster(true);
      socket.on('roster:updated', onRosterUpdate);
    });

    return () => {
      if (socket) {
        socket.off('roster:updated');
      }
    };
  }, [fetchRoster]);

  const upcoming = shifts.filter(s => new Date(s.date) >= new Date()).sort((a,b) => new Date(a.date)-new Date(b.date));
  const recent   = shifts.filter(s => new Date(s.date) < new Date()).sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const GreetIcon = hour < 12 ? Ic.Sun : hour < 17 ? Ic.Sunset : Ic.Moon;

  /* Days until next shift */
  const nextDate = upcoming[0] ? new Date(upcoming[0].date) : null;
  const daysUntil = nextDate
    ? Math.ceil((nextDate.setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
    : null;

  const METRIC_STATS = [
    { label: 'Total Shifts',  value: stats.total,    color: '#60a5fa', glow: 'rgba(96,165,250,0.15)'  },
    { label: 'Upcoming',      value: stats.upcoming, color: '#34d399', glow: 'rgba(52,211,153,0.15)'  },
    { label: 'Night Shifts',  value: stats.night,    color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>

      {/* ── Welcome Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(6,182,212,0.06) 60%, rgba(99,102,241,0.04) 100%)',
        border: '1px solid rgba(37,99,235,0.18)',
        borderRadius: 22,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        marginBottom: 22,
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient orb */}
        <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: user?.profilePic
              ? `url(http://localhost:5000${user.profilePic}) center/cover no-repeat`
              : 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.3rem', fontWeight: 800,
            boxShadow: '0 6px 24px rgba(37,99,235,0.35)',
            border: user?.profilePic ? '2px solid rgba(255,255,255,0.12)' : 'none',
          }}>
            {!user?.profilePic && user?.name?.charAt(0)?.toUpperCase()}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ color: 'var(--text3)', display: 'flex' }}><GreetIcon size={13} /></span>
              <span style={{ fontSize: '0.73rem', color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.02em' }}>{greeting}</span>
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 3 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Ic.Hospital size={11} />
                {user?.hospital || 'NurseConnect'}
              </span>
              <span>·</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Metrics chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {METRIC_STATS.map(s => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '12px 20px',
              background: s.glow,
              border: `1px solid ${s.color}22`,
              borderRadius: 14,
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}

          {daysUntil !== null && (
            <div style={{
              textAlign: 'center', padding: '12px 20px',
              background: daysUntil === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.12)',
              border: `1px solid ${daysUntil === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.22)'}`,
              borderRadius: 14,
            }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: daysUntil === 0 ? '#34d399' : '#22d3ee', lineHeight: 1 }}>
                {daysUntil === 0 ? 'Today' : `${daysUntil}d`}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Next Shift</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bento grid ── */}
      <div className="bento-grid">

        {/* Upcoming shifts */}
        <div className="bento-cell bento-tall">
          <div className="bento-label bento-cell-pad" style={{ borderBottom: '1px solid var(--border-light)', marginBottom: 0, paddingBottom: 14 }}>
            <Ic.Calendar size={12} /> Upcoming Shifts
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'none', fontWeight: 500 }}>
              {upcoming.length} scheduled
            </span>
          </div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonShift key={i} />)
          ) : upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '52px 20px' }}>
              <div style={{ color: 'var(--text4)', marginBottom: 10 }}><Ic.Calendar size={30} /></div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text3)', fontWeight: 500 }}>No upcoming shifts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text4)', marginTop: 4 }}>Your schedule will appear here</div>
            </div>
          ) : (
            <div>
              {upcoming.map((s, i) => {
                const cfg = getShift(s.shift);
                const Icon = cfg.Icon;
                const d = new Date(s.date);
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <div key={s._id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                        {s.shift || 'Shift'}
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.73rem', color: 'var(--text3)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Ic.Calendar size={11} />
                          {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        {s.ward && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Ic.Hospital size={11} />
                            {s.ward}
                          </span>
                        )}
                      </div>
                    </div>
                    {isToday && (
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.28)', fontSize: '0.63rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, animation: 'glow-pulse 2s ease infinite' }}>
                        Today
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Shift breakdown */}
          <div className="bento-cell bento-cell-pad">
            <div className="bento-label"><Ic.TrendUp size={12} /> Shift Breakdown</div>
            {[
              { type: 'Day Shifts',  count: stats.morning, color: '#fbbf24', Icon: Ic.Sun  },
              { type: 'Night Shift', count: stats.night,   color: '#a78bfa', Icon: Ic.Moon },
              { type: 'Eve / Other', count: Math.max(0, stats.total - stats.morning - stats.night), color: '#60a5fa', Icon: Ic.Clock },
            ].map(r => (
              <div key={r.type} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: r.color, display: 'flex' }}><r.Icon size={13} /></span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text2)' }}>{r.type}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'DM Sans',sans-serif", fontSize: '0.9rem', fontWeight: 800, color: r.color }}>{r.count}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: stats.total ? `${(r.count/stats.total)*100}%` : '0%', background: r.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent past */}
          <div className="bento-cell bento-cell-pad" style={{ flex: 1 }}>
            <div className="bento-label"><Ic.Clock size={12} /> Recent Past</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 50, borderRadius: 12 }} />)}
              </div>
            ) : recent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '0.8rem' }}>No past shifts yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recent.map((s, i) => {
                  const cfg = getShift(s.shift);
                  const Icon = cfg.Icon;
                  return (
                    <div key={s._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 11, border: '1px solid var(--border-light)' }}>
                      <span style={{ color: cfg.color, display: 'flex' }}><Icon size={14} /></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{s.shift || 'Shift'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <span style={{ background: 'rgba(100,116,139,0.14)', color: 'var(--text3)', fontSize: '0.63rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>Done</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
