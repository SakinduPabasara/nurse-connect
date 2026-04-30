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
  { to: '/admin/swaps',    icon: '🔄', label: 'Shift Swaps',      desc: 'Oversee nurse shift exchanges',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { to: '/admin/leave',    icon: '🌴', label: 'Review Leave',      desc: 'Approve or reject applications',  color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  { to: '/admin/overtime', icon: '⏰', label: 'Log Overtime',      desc: 'Record extra hours for nurses',   color: '#22d3ee', bg: 'rgba(6,182,212,0.1)' },
  { to: '/admin/hospitals',icon: '🏥', label: 'Hospitals',         desc: 'Manage healthcare facilities',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    pending: 0, 
    totalNurses: 0, 
    pendingLeave: 0, 
    unreadNotifs: 0,
    pendingSwaps: 0,
    lowStockDrugs: 0,
    maintenanceEquip: 0
  });
  const [recentVerifs, setRecentVerifs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    Promise.all([
      API.get('/auth/users?isVerified=false'),
      API.get('/auth/users?role=nurse&isVerified=true'),
      API.get('/leave?status=pending').catch(() => ({ data: [] })),
      API.get('/notifications'),
      API.get('/swap?status=pending').catch(() => ({ data: [] })),
      API.get('/drugs').catch(() => ({ data: [] })),
      API.get('/equipment').catch(() => ({ data: [] })),
    ]).then(([pending, nurses, leave, notifs, swaps, drugs, equip]) => {
      const lowStock = drugs.data.filter(d => d.quantity < 20);
      const maintenance = equip.data.filter(e => e.status === 'maintenance');
      const expired = drugs.data.filter(d => d.expiryDate < today);

      setStats({
        pending: pending.data.length,
        totalNurses: nurses.data.length,
        pendingLeave: leave.data.length,
        unreadNotifs: notifs.data.filter(n => !n.isRead).length,
        pendingSwaps: swaps.data.length,
        lowStockDrugs: lowStock.length,
        maintenanceEquip: maintenance.length
      });

      // Compile alerts
      const activeAlerts = [];
      if (swaps.data.length > 0) activeAlerts.push({ type: 'swap', text: `${swaps.data.length} pending shift swaps`, color: '#8b5cf6' });
      if (lowStock.length > 0) activeAlerts.push({ type: 'inventory', text: `${lowStock.length} drugs low in stock`, color: '#f59e0b' });
      if (expired.length > 0) activeAlerts.push({ type: 'expiry', text: `${expired.length} drugs expired`, color: '#ef4444' });
      if (maintenance.length > 0) activeAlerts.push({ type: 'maintenance', text: `${maintenance.length} equipment in maintenance`, color: '#60a5fa' });
      
      setAlerts(activeAlerts);
      setRecentVerifs(pending.data.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    {
      icon: '⏳', label: 'Verifications', value: stats.pending,
      link: '/admin/verify', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
      badge: stats.pending > 0 ? 'Urgent' : null,
    },
    {
      icon: '🔄', label: 'Pending Swaps', value: stats.pendingSwaps,
      link: '/admin/swaps', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
      badge: stats.pendingSwaps > 0 ? 'Active' : null,
    },
    {
      icon: '🌴', label: 'Pending Leave', value: stats.pendingLeave,
      link: '/admin/leave', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
      badge: stats.pendingLeave > 0 ? 'Review' : null,
    },
    {
      icon: '👩‍⚕️', label: 'Total Nurses', value: stats.totalNurses,
      link: '/admin/users', color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
    },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .admin-alert-item {
          display: flex; alignItems: center; gap: 12px; padding: 12px 16px; 
          background: rgba(255,255,255,0.03); border: 1px solid var(--border); 
          border-radius: 12px; margin-bottom: 8px; transition: 0.2s;
        }
        .admin-alert-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.15); }
        
        .admin-main-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; }
        
        @media (max-width: 1024px) {
          .admin-main-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .admin-welcome-banner { padding: 16px !important; }
          .admin-welcome-banner div[style*="margin-left: auto"] { margin-left: 0 !important; margin-top: 10px; width: 100%; }
        }
      `}</style>

      {/* Welcome */}
      <div className="admin-welcome-banner" style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(217,119,6,0.06) 0%, rgba(16,185,129,0.04) 100%)',
        border: '1px solid rgba(217,119,6,0.12)',
        borderRadius: 14, flexWrap: 'wrap',
      }}>
        <AdminCross />
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Operational Command Center
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 2 }}>
            Centralized monitoring for {user?.hospital || "Hospital Management"}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display:'flex', gap:8 }}>
          <span style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.2)', color: '#fbbf24', padding: '4px 12px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Auth: Administrator
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="spinner" style={{ margin: 0 }} />
          <span style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>Synchronizing operational data…</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
            {STAT_CARDS.map(c => (
              <Link key={c.label} to={c.link} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 16, padding: '22px',
                  transition: 'all 0.2s ease',
                  position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: '1.6rem' }}>{c.icon}</span>
                    {c.badge && (
                      <span style={{ background: c.color, color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '2.4rem', fontWeight: 800, color: c.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{c.value}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="admin-main-grid">
            
            {/* Left Column: Quick Actions + Verifications */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Quick Actions */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', backdropFilter: 'blur(16px)' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 4, height: 16, background: 'var(--primary)', borderRadius: 2 }} />
                  ⚡ Management Shortcuts
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  {QUICK_ACTIONS.map(a => (
                    <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: a.bg, border: `1px solid ${a.color}22`,
                        borderRadius: 12, padding: '16px',
                        transition: 'all 0.15s',
                        cursor: 'pointer', height: '100%'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.3)`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>{a.icon}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{a.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', lineHeight: 1.4 }}>{a.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Pending Table Mini */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', backdropFilter: 'blur(16px)' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ width: 4, height: 16, background: '#f87171', borderRadius: 2 }} />
                    ⏳ Recent Registrations
                  </div>
                  <Link to="/admin/verify" style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
                </div>
                {recentVerifs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', background:'rgba(0,0,0,0.1)', borderRadius:12 }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
                    <div style={{ fontWeight: 600, color: 'var(--text3)' }}>All clear! No pending verifications.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentVerifs.map(n => (
                      <div key={n._id} className="admin-alert-item" style={{ border: '1px solid rgba(239,68,68,0.1)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.8rem' }}>
                          {n.name[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{n.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{n.hospital || 'Private registration'} · NIC: {n.nic}</div>
                        </div>
                        <Link to="/admin/verify" className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize:'0.7rem' }}>Verify</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Operational Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', height: '100%' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 4, height: 16, background: '#fbbf24', borderRadius: 2 }} />
                  🚨 Operational Alerts
                </div>
                
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🚀</div>
                    <div style={{ fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Operational Success</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text3)', lineHeight: 1.5 }}>No inventory shortages or maintenance issues detected.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alerts.map((alert, i) => (
                      <div key={i} className="admin-alert-item" style={{ borderColor: `${alert.color}33`, background: `${alert.color}08` }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: alert.color, boxShadow: `0 0 10px ${alert.color}` }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text2)', flex: 1 }}>{alert.text}</div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={alert.color} strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    ))}
                    <div style={{ marginTop: 'auto', paddingTop: 20, fontSize: '0.75rem', color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center' }}>
                      Updates in real-time as nurses log data
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
