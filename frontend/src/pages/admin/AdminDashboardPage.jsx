import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const AdminCross = () => (
  <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="7" fill="url(#ag)" />
    <rect x="11" y="5" width="6" height="18" rx="2" fill="white" opacity="0.95" />
    <rect x="5" y="11" width="18" height="6" rx="2" fill="white" opacity="0.95" />
    <defs>
      <linearGradient id="ag" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
  </svg>
);

const QUICK_ACTIONS = [
  { to: '/admin/verify',    icon: '✅', label: 'Verify Nurses',    desc: 'Review pending registrations',   color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  { to: '/admin/roster',   icon: '📅', label: 'Manage Roster',    desc: 'Create & update shift schedules', color: '#60a5fa', bg: 'rgba(37,99,235,0.1)' },
  { to: '/admin/leave',    icon: '🌴', label: 'Review Leave',      desc: 'Approve or reject applications',  color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  { to: '/admin/overtime', icon: '⏰', label: 'Log Overtime',      desc: 'Record extra hours for nurses',   color: '#22d3ee', bg: 'rgba(6,182,212,0.1)' },
  { to: '/admin/notices',  icon: '📋', label: 'Post Notice',       desc: 'Publish circular or guideline',   color: '#a78bfa', bg: 'rgba(139,92,246,0.1)' },
  { to: '/admin/news',     icon: '📰', label: 'Post News',         desc: 'Share healthcare news updates',   color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, totalNurses: 0, pendingLeave: 0, unreadNotifs: 0 });
  const [recentVerifs, setRecentVerifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/auth/users?isVerified=false'),
      API.get('/auth/users?role=nurse&isVerified=true'),
      API.get('/leave?status=pending').catch(() => ({ data: [] })),
      API.get('/notifications'),
    ]).then(([pending, nurses, leave, notifs]) => {
      setStats({
        pending: pending.data.length,
        totalNurses: nurses.data.length,
        pendingLeave: leave.data.length,
        unreadNotifs: notifs.data.filter(n => !n.isRead).length,
      });
      setRecentVerifs(pending.data.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    {
      icon: '⏳', label: 'Pending Verifications', value: stats.pending,
      link: '/admin/verify', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
      badge: stats.pending > 0 ? 'Needs Action' : null,
    },
    {
      icon: '👩‍⚕️', label: 'Active Nurses', value: stats.totalNurses,
      link: '/admin/users', color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
    },
    {
      icon: '🌴', label: 'Pending Leave', value: stats.pendingLeave,
      link: '/admin/leave', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
      badge: stats.pendingLeave > 0 ? 'Review' : null,
    },
    {
      icon: '🔔', label: 'Unread Notifications', value: stats.unreadNotifs,
      link: '/notifications', color: '#60a5fa', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)',
    },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Welcome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(217,119,6,0.06) 0%, rgba(16,185,129,0.04) 100%)',
        border: '1px solid rgba(217,119,6,0.12)',
        borderRadius: 14, flexWrap: 'wrap',
      }}>
        <AdminCross />
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 2 }}>
            Here's your hospital operations snapshot
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display:'flex', gap:8 }}>
          <span style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.2)', color: '#fbbf24', padding: '4px 12px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Administrator
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="spinner" style={{ margin: 0 }} />
          <span style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>Loading dashboard…</span>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
            {STAT_CARDS.map(c => (
              <Link key={c.label} to={c.link} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 14, padding: '20px 22px',
                  transition: 'all 0.18s ease',
                  position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: '1.4rem' }}>{c.icon}</span>
                    {c.badge && (
                      <span style={{ background: c.color, color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '2.2rem', fontWeight: 800, color: c.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{c.value}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Two-column layout: Quick Actions + Recent Pending */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

            {/* Quick Actions */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', backdropFilter: 'blur(16px)' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚡ Quick Actions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {QUICK_ACTIONS.map(a => (
                  <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: a.bg, border: `1px solid ${a.color}22`,
                      borderRadius: 10, padding: '12px 14px',
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 14px rgba(0,0,0,0.3)`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ fontSize: '1.1rem', marginBottom: 6 }}>{a.icon}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{a.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', lineHeight: 1.4 }}>{a.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Pending Verifications */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', backdropFilter: 'blur(16px)' }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span>⏳ Pending Verifications</span>
                {recentVerifs.length > 0 && (
                  <Link to="/admin/verify" style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>
                    View all →
                  </Link>
                )}
              </div>
              {recentVerifs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text3)', fontWeight: 500 }}>All nurses verified</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text4)', marginTop: 4 }}>No pending registrations</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentVerifs.map(n => (
                    <div key={n._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px',
                      background: 'rgba(239,68,68,0.05)',
                      border: '1px solid rgba(239,68,68,0.12)',
                      borderRadius: 9,
                    }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {(n.name || 'N')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{n.hospital || n.nic}</div>
                      </div>
                      <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
