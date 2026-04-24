import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import * as Ic from '../../components/icons';

const SHIFT_COLORS = {
  '7AM-1PM': { label: '7AM–1PM', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.2)',  Icon: Ic.Sun },
  '1PM-7PM': { label: '1PM–7PM', color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.2)',  Icon: Ic.Sunset },
  '7AM-7PM': { label: '7AM–7PM', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)',  Icon: Ic.Sun },
  '7PM-7AM': { label: '7PM–7AM', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)', Icon: Ic.Moon },
};

const getShift = t => {
  if (!t) return { label: '—', color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.2)', Icon: Ic.Clock };
  return SHIFT_COLORS[t] || { label: t, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.2)', Icon: Ic.Clock };
};

function SkeletonShift() {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
      <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="skeleton skeleton-text" style={{ width: '55%' }} />
        <div className="skeleton skeleton-text" style={{ width: '35%' }} />
      </div>
      <div className="skeleton skeleton-badge" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [stats, setStats] = useState({ total: 0, morning: 0, night: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/roster/my').then(({ data }) => {
      const list = Array.isArray(data) ? data : [];
      const now = new Date();
      setShifts(list);
      const morning = list.filter(s => s.shift === '7AM-1PM' || s.shift === '7AM-7PM').length;
      const night   = list.filter(s => s.shift === '7PM-7AM').length;
      const upcoming = list.filter(s => new Date(s.date) >= now).length;
      setStats({ total: list.length, morning, night, upcoming });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upcoming = shifts.filter(s => new Date(s.date) >= new Date()).sort((a,b) => new Date(a.date)-new Date(b.date));
  const recent   = shifts.filter(s => new Date(s.date) < new Date()).sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const GreetIcon = hour < 12 ? Ic.Sun : hour < 17 ? Ic.Sunset : Ic.Moon;

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* ── Welcome banner (full-width bento cell) ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(6,182,212,0.06) 100%)',
        border: '1px solid rgba(37,99,235,0.15)',
        borderRadius: 16, padding: '20px 26px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            width: 44, height: 44, borderRadius: 12, 
            background: user?.profilePic 
              ? `url(http://localhost:5000${user.profilePic}) center/cover no-repeat` 
              : 'linear-gradient(135deg,var(--primary),var(--accent))', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', 
            fontSize: '1.2rem', fontWeight: 800, flexShrink: 0,
            border: user?.profilePic ? '1px solid var(--border)' : 'none',
            textIndent: user?.profilePic ? '-9999px' : '0'
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <span style={{ color: 'var(--text3)' }}><GreetIcon size={14} /></span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text3)', fontWeight: 600 }}>{greeting}</span>
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }}>
              {user?.hospital || 'Nurse Connect'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Shifts', value: stats.total, color: '#60a5fa' },
            { label: 'Upcoming', value: stats.upcoming, color: '#34d399' },
            { label: 'Night Shifts', value: stats.night, color: '#818cf8' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 18px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bento grid ── */}
      <div className="bento-grid">

        {/* Upcoming shifts — tall left column */}
        <div className="bento-cell bento-tall">
          <div className="bento-label bento-cell-pad" style={{ borderBottom: '1px solid var(--border-light)', marginBottom: 0, paddingBottom: 14 }}>
            <Ic.Calendar size={13} /> Upcoming Shifts
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'none', fontWeight: 400 }}>
              {upcoming.length} scheduled
            </span>
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonShift key={i} />)
          ) : upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ color: 'var(--text3)', marginBottom: 8 }}><Ic.Calendar size={28} /></div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text3)', fontWeight: 500 }}>No upcoming shifts</div>
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
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Shift type icon box */}
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {s.shift || 'Shift'}
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: 'var(--text3)', flexWrap: 'wrap' }}>
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
                      <span style={{ background: 'rgba(16,185,129,0.14)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.66rem', fontWeight: 800, padding: '2px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                        Today
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: two cells stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Shift breakdown mini-chart */}
          <div className="bento-cell bento-cell-pad">
            <div className="bento-label"><Ic.TrendUp size={13} /> Shift Breakdown</div>
            {[
              { type: 'Day Shifts',  count: stats.morning, color: '#fbbf24', Icon: Ic.Sun },
              { type: 'Night Shift', count: stats.night,   color: '#818cf8', Icon: Ic.Moon },
              { type: 'Eve / Other', count: Math.max(0, stats.total - stats.morning - stats.night), color: '#60a5fa', Icon: Ic.Clock },
            ].map(r => (
              <div key={r.type} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <span style={{ color: r.color }}><r.Icon size={13} /></span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text2)' }}>{r.type}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700, color: r.color }}>{r.count}</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: stats.total ? `${(r.count/stats.total)*100}%` : '0%', background: r.color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent shifts */}
          <div className="bento-cell bento-cell-pad" style={{ flex: 1 }}>
            <div className="bento-label"><Ic.Clock size={13} /> Recent Past</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10 }} />)}
              </div>
            ) : recent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: '0.82rem' }}>No past shifts yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recent.map((s, i) => {
                  const cfg = getShift(s.shift);
                  const Icon = cfg.Icon;
                  return (
                    <div key={s._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 9, border: '1px solid var(--border-light)' }}>
                      <span style={{ color: cfg.color }}><Icon size={14} /></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{s.shift || 'Shift'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <span style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--text3)', fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>Done</span>
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
