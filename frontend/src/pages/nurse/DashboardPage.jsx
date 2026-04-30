import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import * as Ic from '../../components/icons';

const THEME = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#f8fafc',
  textDim: '#94a3b8',
  glass: 'rgba(15, 23, 42, 0.65)',
  border: 'rgba(255, 255, 255, 0.08)',
};

const SHIFT_CFG = {
  '7AM-1PM': { label: 'Morning', color: '#fbbf24', Icon: Ic.Sun },
  '1PM-7PM': { label: 'Afternoon', color: '#fb923c', Icon: Ic.Sunset },
  '7AM-7PM': { label: 'Day Long', color: '#f59e0b', Icon: Ic.Sun },
  '7PM-7AM': { label: 'Night Shift', color: '#818cf8', Icon: Ic.Moon },
};

const getShiftCfg = t => SHIFT_CFG[t] || { label: t || 'Clinical', color: '#6366f1', Icon: Ic.Clock };

/* ── UI Components: Ultra Premium ── */

function DigitalClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const it = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(it);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: '1.6rem', fontWeight: 900, color: THEME.text, letterSpacing: '-0.04em' }}>
        {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
      </span>
      <span style={{ fontSize: '0.85rem', color: THEME.textDim, fontWeight: 700, width: 22, textAlign: 'center' }}>
        {time.toLocaleTimeString('en-US', { second: '2-digit' })}
      </span>
    </div>
  );
}

function StatusIndicator({ online }) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', 
      background: online ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', 
      border: `1px solid ${online ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 10, fontSize: '0.7rem', fontWeight: 800, color: online ? THEME.success : THEME.danger,
      textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      <span style={{ 
        width: 6, height: 6, borderRadius: '50%', background: online ? THEME.success : THEME.danger,
        boxShadow: online ? `0 0 8px ${THEME.success}` : 'none',
        animation: online ? 'glow-pulse 2s infinite' : 'none'
      }} />
      {online ? 'System Active' : 'Offline'}
    </div>
  );
}

function ShiftIntensityMap({ shifts }) {
  // Mocking an intensity heat-line based on shift variety
  return (
    <div style={{ height: 40, width: '100%', display: 'flex', gap: 3, alignItems: 'center', marginTop: 15 }}>
      {Array.from({ length: 24 }).map((_, i) => {
        const height = 15 + Math.random() * 25;
        const opacity = 0.1 + (i / 24) * 0.4;
        return (
          <div key={i} style={{ 
            flex: 1, height, background: THEME.primary, 
            borderRadius: 2, opacity, transition: 'height 0.3s ease' 
          }} />
        );
      })}
    </div>
  );
}

const COUNTDOWN_STYLES = `
  @keyframes cd-rotate-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes cd-glow-pulse { 0%, 100% { filter: drop-shadow(0 0 8px var(--status-color)); } 50% { filter: drop-shadow(0 0 16px var(--status-color)); } }
`;

function ShiftCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00', p: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const it = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00', p: 100 });
        return;
      }
      const d = String(Math.floor(diff / 86400000)).padStart(2, '0');
      const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      
      // Use a 30-day scale for the progress bar so it's visible for long-term shifts
      const maxRange = 30 * 86400000; 
      const progress = Math.max(0, Math.min(100, (1 - diff / maxRange) * 100));
      
      setTimeLeft({ d, h, m, s, p: progress });
    }, 1000);
    return () => clearInterval(it);
  }, [targetDate]);

  const diffHours = parseInt(timeLeft.d) * 24 + parseInt(timeLeft.h);
  const getStatus = () => {
    if (diffHours < 2) return { text: 'Critical Prep', color: THEME.danger, Icon: Ic.AlertCircle };
    if (diffHours < 12) return { text: 'Active Readiness', color: THEME.warning, Icon: Ic.Activity };
    if (diffHours < 24) return { text: 'Standby Phase', color: THEME.primary, Icon: Ic.Clock };
    return { text: 'Deep Rest', color: THEME.success, Icon: Ic.Moon };
  };
  const status = getStatus();

  // SVG Config
  const size = 210;
  const center = size / 2;
  const radius = 80;
  const dash = 2 * Math.PI * radius;
  const offset = dash - (dash * timeLeft.p / 100);

  return (
    <div style={{ 
      position: 'relative', width: size, height: size, margin: '15px auto',
      '--status-color': status.color
    }}>
      <style>{COUNTDOWN_STYLES}</style>

      {/* ── HUD SVG Layer ── */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* Outer Dotted HUD Ring */}
        <circle cx={center} cy={center} r={radius + 20} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="1 8" />
        
        {/* Inner Dotted HUD Ring (Subtle) */}
        <circle cx={center} cy={center} r={radius - 18} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="1 6" />
        
        {/* Glass Base Track */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
        
        {/* Progress Path (The Glass Tube Effect) */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={status.color} strokeWidth="10" strokeOpacity="0.3"
          strokeDasharray={dash} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 1s linear', filter: 'blur(3px)' }}
        />
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={status.color} strokeWidth="2"
          strokeDasharray={dash} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />

        {/* HUD Tick Marks */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line
            key={deg} x1={center} y1={center - radius - 12} x2={center} y2={center - radius + 2}
            stroke="rgba(255,255,255,0.12)" strokeWidth={deg % 90 === 0 ? "2" : "1"}
            transform={`rotate(${deg} ${center} ${center})`}
          />
        ))}

        {/* Floating Status Icon (e.g. Moon) */}
        <g transform={`rotate(-135 ${center} ${center}) translate(0, ${-radius - 25}) rotate(135 0 0)`}>
          <status.Icon size={16} color={status.color} style={{ filter: `drop-shadow(0 0 5px ${status.color}aa)` }} />
        </g>

        {/* Tip Indicator */}
        <g transform={`rotate(${(timeLeft.p * 3.6) - 90} ${center} ${center})`}>
          <circle cx={center + radius} cy={center} r="6" fill="#fff" style={{ filter: `drop-shadow(0 0 10px ${status.color})` }} />
        </g>
      </svg>

      {/* ── HUD Center Display ── */}
      <div style={{
        position: 'absolute', inset: 30, borderRadius: '50%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 1
      }}>
        {/* Status Badge */}
        <div style={{
          background: `${status.color}15`, padding: '4px 16px', borderRadius: 20,
          border: `1px solid ${status.color}44`, marginBottom: 15
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: status.color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {status.text}
          </span>
        </div>
        
        {/* Time Display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {parseInt(timeLeft.d) > 0 && (
            <>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>{timeLeft.d}</span>
              <span style={{ fontSize: '0.9rem', color: status.color, marginRight: 5, fontWeight: 700 }}>d</span>
            </>
          )}
          <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>{timeLeft.h}</span>
          <span style={{ fontSize: '0.9rem', color: status.color, marginRight: 5, fontWeight: 700 }}>h</span>
          <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>{timeLeft.m}</span>
          <span style={{ fontSize: '0.9rem', color: status.color, fontWeight: 700 }}>m</span>
        </div>
        
        <div style={{ fontSize: '0.6rem', color: THEME.textDim, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.35em', marginTop: 10, opacity: 0.6 }}>
          Until Log-In
        </div>
      </div>
    </div>
  );
}

function DistributionBarChart({ config }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160, padding: '15px 0' }}>
      {config.map((c, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: c.color }}>{c.count}</div>
          <div style={{ 
            width: '100%', height: `${c.percent}%`, 
            background: `linear-gradient(to top, ${c.color}22, ${c.color})`, 
            borderRadius: '8px 8px 4px 4px',
            minHeight: 6, transition: 'height 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: `0 4px 15px ${c.color}22`
          }} />
          <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, 
            background: 'rgba(255,255,255,0.03)', padding: '8px 4px', width: '100%', borderRadius: 12,
            border: '1px solid var(--border-light)'
          }}>
            <c.Icon size={14} color={c.color} />
            <span style={{ fontSize: '0.55rem', fontWeight: 900, color: THEME.textDim, textTransform: 'uppercase' }}>{c.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function HUD_Header({ status }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2, marginBottom: 10 }}>
      <div>
        <div className="sidebar-group-label" style={{ padding: 0, marginBottom: 4 }}>Mission Intel</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 800 }}>
          <Ic.Activity size={14} /> ACTIVE
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="sidebar-group-label" style={{ padding: 0, marginBottom: 4 }}>System Real-Time</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: '0.8rem', fontWeight: 800, justifyContent: 'flex-end' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: `0 0 8px var(--success)` }} /> LIVE
        </div>
      </div>
    </div>
  );
}

function EarningsChart({ data }) {
  if (!data || data.length < 2) return <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textDim }}>Awaiting log cycle...</div>;
  const width = 400, height = 120, padding = 15;
  const maxVal = Math.max(...data.map(d => d.value)) || 1000;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (width - padding * 2) + padding,
    y: height - ((d.value / maxVal) * (height - padding * 2) + padding)
  }));
  const path = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const cp1x = a[i - 1].x + (p.x - a[i - 1].x) / 2;
    return `${acc} C ${cp1x},${a[i - 1].y} ${cp1x},${p.y} ${p.x},${p.y}`;
  }, "");
  const fill = `${path} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={THEME.success} stopOpacity="0.2" />
            <stop offset="100%" stopColor={THEME.success} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#chartGrad)" />
        <path d={path} fill="none" stroke={THEME.success} strokeWidth="3" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${THEME.success}66)` }}>
          <animate attributeName="stroke-dasharray" from="0,1000" to="1000,0" dur="2s" />
        </path>
      </svg>
    </div>
  );
}

/* ── MAIN DASHBOARD ── */

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shifts, setShifts]     = useState([]);
  const [otData, setOtData]     = useState({ records: [] });
  const [notices, setNotices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState({ total: 0, morning: 0, night: 0, upcoming: 0 });
  const [leaveDays, setLeaveDays] = useState(0);
  const [pendingSwaps, setPendingSwaps] = useState(0);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rRes, otRes, nRes, lRes, sRes] = await Promise.all([
        API.get('/roster/my'),
        API.get('/overtime/my'),
        API.get('/notices'),
        API.get('/leave/my'),
        API.get('/swap/my')
      ]);
      const rList = Array.isArray(rRes.data) ? rRes.data : [];
      setShifts(rList);
      setOtData(otRes.data);
      setNotices(Array.isArray(nRes.data) ? nRes.data.slice(0, 3) : []);

      const now = new Date();
      const morning  = rList.filter(s => s.shift?.includes('7AM')).length;
      const night    = rList.filter(s => s.shift?.includes('7PM')).length;
      const upcoming = rList.filter(s => new Date(s.date) >= now).length;
      setStats({ total: rList.length, morning, night, upcoming });

      // Calculate utilized leave days
      const approvedLeaves = Array.isArray(lRes.data) ? lRes.data.filter(l => l.status === 'approved') : [];
      const used = approvedLeaves.reduce((sum, l) =>
        sum + (Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1), 0);
      setLeaveDays(Math.max(0, 24 - used));

      // Count pending swaps
      const pSwaps = Array.isArray(sRes.data) ? sRes.data.filter(s => s.status === 'pending').length : 0;
      setPendingSwaps(pSwaps);
    } catch (err) {
      console.error('Core Dashboard Error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let socket;
    import('../../utils/socketClient').then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      const onUpdate = () => fetchData(true);
      socket.on('roster:updated', onUpdate);
      socket.on('overtime:updated', onUpdate);
      socket.on('notice:created', onUpdate);
    });
    return () => {
      if (socket) {
        socket.off('roster:updated');
        socket.off('overtime:updated');
        socket.off('notice:created');
      }
    };
  }, [fetchData]);

  const upcoming = shifts.filter(s => new Date(s.date) >= new Date()).sort((a,b) => new Date(a.date)-new Date(b.date));
  const nextShiftDate = upcoming[0] ? new Date(upcoming[0].date) : null;
  const readiness = useMemo(() => Math.max(45, 96 - (stats.upcoming * 4) - (stats.night * 5)), [stats]);

  const diffHours = nextShiftDate ? (nextShiftDate - new Date()) / 3600000 : 100;
  const status = (() => {
    if (diffHours < 2) return { color: THEME.danger };
    if (diffHours < 12) return { color: THEME.warning };
    if (diffHours < 24) return { color: THEME.primary };
    return { color: THEME.success };
  })();

  const greeting = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening';

  return (
    <div className="animate-fade-up">
      
      {/* ── High-Fidelity Header ── */}
      <div className="page-header">
        <div>
          <div className="sidebar-brand-role" style={{ color: 'var(--primary)', marginBottom: 8 }}>Command Center v2.5</div>
          <div className="stat-value-premium" style={{ fontSize: '2rem' }}>
            <DigitalClock />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="btn btn-outline" style={{ cursor: 'default' }}>
            <Ic.Sunset size={16} color="var(--warning)" />
            <span>28°C Optimal</span>
          </div>
          <StatusIndicator online={true} />
        </div>
      </div>

      {/* ── Executive Hero Card ── */}
      <div className="glass-card-premium" style={{ marginBottom: 28 }}>
        <div className="mesh-bg" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1, marginBottom: 32 }}>
          <div className="topbar-avatar" style={{ 
            width: 80, height: 80, fontSize: '2rem', 
            background: user?.profilePic ? `url(http://localhost:5000${user.profilePic}) center/cover` : undefined 
          }}>
            {!user?.profilePic && user?.name?.charAt(0)}
          </div>
          <div>
            <div className="page-subtitle">Good {greeting},</div>
            <div className="page-title" style={{ fontSize: '2.2rem' }}>{user?.name}</div>
            <div style={{ display: 'flex', gap: 15, marginTop: 8 }} className="page-subtitle">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Hospital size={14} /> {user?.hospital}</span>
              <span style={{ opacity: 0.2 }}>|</span>
              <span style={{ fontWeight: 600, color: 'var(--text2)' }}>Ward: {user?.ward}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Operational Duty', value: stats.total, color: 'var(--primary)', icon: Ic.Activity },
            { label: 'Night Resilience', value: stats.night, color: 'var(--info)', icon: Ic.Moon },
            { label: 'Extra Earnings', value: `LKR ${((otData.totalApprovedHours || 0) * 150).toLocaleString()}`, color: 'var(--success)', icon: Ic.TrendUp },
          ].map(m => (
            <div key={m.label} className="bento-cell" style={{ padding: '24px', '--glow-color': `${m.color}22` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <div className="stat-value-premium" style={{ color: m.color, fontSize: m.value.toString().length > 8 ? '1.5rem' : '2rem' }}>
                    {m.value}
                 </div>
                 <div style={{ padding: 8, borderRadius: 12, background: `${m.color}15`, display: 'flex' }}>
                    <m.icon size={18} color={m.color} />
                 </div>
              </div>
              <div className="sidebar-group-label" style={{ padding: 0 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Intel Bar ── */}
      {notices.length > 0 && (
        <div
          onClick={() => navigate('/notices')}
          style={{ 
            background: THEME.glass, border: `1px solid ${THEME.border}`, borderRadius: 16, 
            padding: '12px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 15,
            cursor: 'pointer', transition: 'border-color 0.2s'
          }}
        >
          <div style={{ 
            background: 'rgba(239,68,68,0.15)', color: THEME.danger, fontSize: '0.6rem', 
            fontWeight: 900, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0
          }}>Broadcast</div>
          <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: THEME.text }}>
            <span style={{ color: THEME.textDim }}>{notices[0].title} — {notices[0].content.slice(0, 80)}...</span>
          </div>
          <Ic.ArrowRight size={14} color={THEME.textDim} />
        </div>
      )}

      {/* ── Quick Actions Row ── */}
      <div className="quick-actions-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: Ic.Calendar, label: 'My Roster', sub: 'View schedule', path: '/my-roster', color: THEME.primary },
          { icon: Ic.Leave,    label: 'Leave',     sub: 'Apply / track', path: '/leave',     color: THEME.success },
          { icon: Ic.Clock,    label: 'Overtime',  sub: 'Log extra hrs', path: '/overtime',  color: THEME.warning },
          { icon: Ic.Swap,     label: 'Swap',      sub: 'Request swap',  path: '/swap',      color: '#818cf8' },
          { icon: Ic.Bell,     label: 'Notices',   sub: 'Board updates', path: '/notices',   color: THEME.danger },
        ].map(({ icon: Icon, label, sub, path, color }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{
              all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, padding: '16px 8px', borderRadius: 16,
              background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`,
              backdropFilter: 'blur(10px)', transition: 'all 0.2s ease', textAlign: 'center',
              position: 'relative'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}44`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {label === 'Swap' && pendingSwaps > 0 && (
              <div style={{ 
                position: 'absolute', top: 12, right: 12, background: THEME.danger, 
                color: '#fff', fontSize: '0.6rem', fontWeight: 900, width: 18, height: 18, 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 10px ${THEME.danger}66`, zIndex: 2
              }}>
                {pendingSwaps}
              </div>
            )}
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: THEME.text }}>{label}</div>
              <div style={{ fontSize: '0.62rem', color: THEME.textDim, marginTop: 2 }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Modern Bento Grid ── */}
      <div className="bento-grid dashboard-bento">
        
        {/* Column 1: Readiness & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="bento-cell hero-card" style={{ 
        padding: '24px 28px', background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,27,75,0.6))', 
        border: `1px solid ${diffHours < 2 ? THEME.danger + '66' : 'rgba(255,255,255,0.08)'}`,
        position: 'relative', overflow: 'hidden', minHeight: 460
      }}>
        {/* Animated Background Pulse */}
        <div style={{ 
          position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
          background: `radial-gradient(circle, ${status.color}10 0%, transparent 60%)`,
          animation: 'cd-rota      {/* ── Modern Bento Grid ── */}
      <div className="bento-grid">
        
        {/* Column 1: Readiness & Stats */}
        <div className="bento-stack">
          <div className="glass-card-premium" style={{ 
            padding: '32px', border: `1px solid ${diffHours < 2 ? 'var(--danger)' : 'var(--border)'}`,
            minHeight: 480
          }}>
            <HUD_Header status={status} />
            <ShiftCountdown targetDate={nextShiftDate} />

            <div style={{ textAlign: 'center', marginTop: 24, position: 'relative', zIndex: 2 }}>
              <div className="page-title" style={{ fontSize: '1.5rem' }}>
                {getShiftCfg(upcoming[0]?.shift).label} Deployment
              </div>
              <div className="page-subtitle" style={{ marginTop: 8 }}>
                {upcoming[0]?.date && new Date(upcoming[0].date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 24 }} className="btn btn-outline">
                <Ic.MapPin size={14} color="var(--primary)" />
                <span style={{ fontWeight: 700 }}>{upcoming[0]?.ward || 'TBA'} Station</span>
              </div>
            </div>
          </div>

          <div className="bento-cell" style={{ padding: 32 }}>
            <div className="bento-label"><Ic.TrendUp size={14} /> Shift Density Index</div>
            <DistributionBarChart config={[
              { type: 'Day', count: stats.morning, color: 'var(--warning)', Icon: Ic.Sun, percent: (stats.morning/stats.total)*100 || 0 },
              { type: 'Night', count: stats.night, color: 'var(--info)', Icon: Ic.Moon, percent: (stats.night/stats.total)*100 || 0 },
              { type: 'Other', count: Math.max(0, stats.total - stats.morning - stats.night), color: 'var(--primary)', Icon: Ic.Clock, percent: ((stats.total - stats.morning - stats.night)/stats.total)*100 || 0 },
            ]} />
          </div>
        </div>

        {/* Column 2: The Core Roster */}
        <div className="bento-cell" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="sidebar-group-label" style={{ color: 'var(--text)', padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Ic.Calendar size={18} color="var(--primary)" /> Active Deployment Roster
            </div>
            <span className="badge badge-blue">{upcoming.length} Sessions</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {upcoming.length === 0 ? (
               <div style={{ padding: 100, textAlign: 'center', color: 'var(--text3)' }}>No active deployments found.</div>
            ) : upcoming.map((s, i) => {
              const cfg = getShiftCfg(s.shift);
              const isToday = new Date(s.date).toDateString() === new Date().toDateString();
              return (
                <div key={s._id} style={{ 
                  display: 'flex', alignItems: 'center', gap: 20, padding: '20px 32px', 
                  borderBottom: '1px solid var(--border-light)', background: isToday ? 'hsla(226, 70%, 55%, 0.05)' : 'transparent',
                  transition: 'background var(--transition)'
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${cfg.color}15`, border: `1px solid ${cfg.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                    <cfg.Icon size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{cfg.label} Log</div>
                    <div className="page-subtitle" style={{ fontSize: '0.75rem' }}>
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {isToday ? <span className="badge badge-green">LIVE</span> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Insights & Actions */}
        <div className="bento-stack">
          <div className="bento-cell" style={{ padding: 32 }}>
            <div className="bento-label"><Ic.TrendUp size={14} color="var(--success)" /> Financial Growth Trend</div>
            <EarningsChart data={otData.records?.filter(r => r.status !== 'rejected').slice(0, 6).reverse().map(r => ({ value: r.approvedAmount || (r.extraHours * 150) }))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div>
                <div className="sidebar-group-label" style={{ padding: 0 }}>Available Payout</div>
                <div className="stat-value-premium" style={{ color: 'var(--success)', fontSize: '1.5rem' }}>LKR {((otData.totalApprovedHours || 0) * 150).toLocaleString()}</div>
              </div>
              <button onClick={() => navigate('/overtime')} className="btn btn-ghost" style={{ padding: 10 }}>
                <Ic.ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button onClick={() => navigate('/ward-roster')} className="bento-cell" style={{ padding: 24, textAlign: 'center' }}>
              <Ic.Moon size={24} color="var(--info)" />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 12 }}>Ward Roster</div>
            </button>
            <button onClick={() => navigate('/overtime')} className="bento-cell" style={{ padding: 24, textAlign: 'center' }}>
              <Ic.Clock size={24} color="var(--warning)" />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 12 }}>Overtime</div>
            </button>
          </div>

          <div className="bento-cell" style={{ padding: 24, background: 'linear-gradient(135deg, hsla(226, 70%, 55%, 0.1), transparent)', borderColor: 'hsla(226, 70%, 55%, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Ic.Hospital size={16} color="var(--primary)" />
              <span className="sidebar-brand-name" style={{ fontSize: '0.85rem' }}>Stability Insight</span>
            </div>
            <p className="page-subtitle" style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
              {readiness > 85 ? "Your circadian rhythm alignment is optimal for the current week." : "High night shift density detected. Recommend 90min morning rest."}
            </p>
          </div>
        </div>

      </div>
. Recommend 90min morning rest."}
            </p>
          </div>
        </div>

      </div>
      <style>{`
        .hero-card-container {
          background: linear-gradient(165deg, #0f172a 0%, #1e1b4b 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 32px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .hero-metrics-grid {
          display: flex;
          gap: 16px;
        }
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        .dashboard-bento {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 1200px) {
          .dashboard-bento { grid-template-columns: 1fr; }
        }
        .hero-name {
          word-wrap: break-word;
          overflow-wrap: break-word;
          line-height: 1.2;
        }
        @media (max-width: 1024px) {
          .hero-card-container { flex-direction: column; align-items: stretch; gap: 24px; padding: 24px; }
          .hero-metrics-grid { flex-direction: column; }
          .hero-metrics-grid > div { min-width: 0 !important; }
        }
        @media (max-width: 768px) {
          .hero-card-container { padding: 20px 16px; border-radius: 20px; }
          .hero-name { font-size: 1.4rem !important; }
          .quick-actions-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .quick-actions-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
