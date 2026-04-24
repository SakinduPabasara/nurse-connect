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

function SkeletonTimelineItem() {
  return (
    <div className="timeline-item">
      <div className="timeline-dot" style={{ background: 'var(--border)', boxShadow: 'none' }} />
      <div className="skeleton-card">
        <div className="skeleton-row">
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
          <div className="skeleton skeleton-badge" />
        </div>
      </div>
    </div>
  );
}

export default function MyRosterPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | upcoming | past

  useEffect(() => {
    API.get('/roster/my')
      .then(({ data }) => setShifts(Array.isArray(data) ? data : []))
      .catch(() => setShifts([]))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const filtered = shifts.filter(s => {
    const d = new Date(s.date);
    if (filter === 'upcoming') return d >= now;
    if (filter === 'past') return d < now;
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcoming = shifts.filter(s => new Date(s.date) >= now).length;
  const grouped  = groupByMonth(filtered);

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--primary)', display: 'flex' }}><Ic.Calendar size={22} /></span>
            My Roster
          </div>
          <div className="page-subtitle">{shifts.length} shifts assigned · {upcoming} upcoming</div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {[
          { key: 'all',      label: 'All Shifts' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past',     label: 'Past' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '6px 16px', borderRadius: 999, border: '1px solid',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'Inter, sans-serif',
            background: filter === f.key ? 'var(--primary)' : 'transparent',
            color: filter === f.key ? '#fff' : 'var(--text3)',
            borderColor: filter === f.key ? 'var(--primary)' : 'var(--border)',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="timeline">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonTimelineItem key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ color: 'var(--text3)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Ic.Calendar size={36} /></div>
          <div className="empty-state-text">No shifts found</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 6 }}>
            {filter !== 'all' ? 'Try changing the filter above' : 'Your assigned shifts will appear here'}
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([month, monthShifts]) => (
          <div key={month} style={{ marginBottom: 32 }}>
            {/* Month label */}
            <div className="timeline-date-chip">
              <Ic.Calendar size={10} />
              {month}
              <span style={{ color: 'var(--primary-light)', marginLeft: 2 }}>{monthShifts.length}</span>
            </div>

            <div className="timeline">
              {monthShifts.map((s, i) => {
                const d    = new Date(s.date);
                const isPast = d < now;
                const isToday = d.toDateString() === now.toDateString();
                const cfg  = Ic.shiftColor(s.shift);

                return (
                  <div key={s._id || i} className="timeline-item">
                    <div className="timeline-dot" style={{
                      background: isToday ? '#34d399' : isPast ? 'var(--bg3)' : 'var(--primary)',
                      boxShadow: isToday ? '0 0 0 4px rgba(52,211,153,0.25)' : isPast ? 'none' : '0 0 0 3px rgba(37,99,235,0.2)',
                    }} />
                    <div className="timeline-block" style={{ opacity: isPast ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Type icon */}
                        <div style={{ width: 42, height: 42, borderRadius: 11, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg.color }}>
                          {Ic.shiftIcon(s.shift)}
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                              {s.shift || 'Shift'}
                            </span>
                            {isToday && (
                              <span style={{ background: 'rgba(52,211,153,0.14)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', fontSize: '0.62rem', fontWeight: 800, padding: '1px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Today
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: '0.77rem', color: 'var(--text3)', flexWrap: 'wrap' }}>
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
                            {s.startTime && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Ic.Clock size={11} />
                                {s.startTime}{s.endTime ? ` – ${s.endTime}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Status pill */}
                        <span style={{
                          padding: '4px 12px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                          background: isPast ? 'rgba(100,116,139,0.1)' : 'rgba(37,99,235,0.12)',
                          color: isPast ? 'var(--text3)' : '#60a5fa',
                          border: `1px solid ${isPast ? 'rgba(100,116,139,0.15)' : 'rgba(37,99,235,0.2)'}`,
                        }}>
                          {isPast ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>
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
