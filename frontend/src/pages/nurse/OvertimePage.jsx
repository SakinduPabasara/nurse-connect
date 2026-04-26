import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../api/axios';
import useToastMessage from '../../hooks/useToastMessage';
import { notify } from '../../utils/toast';
import { useConfirm } from '../../context/ConfirmContext';
import * as Ic from '../../components/icons';

const OT_HOURLY_RATE = 150;

const SHIFTS = [
  { id: 'morning', Icon: Ic.Sun,      label: 'Morning', time: '6 AM – 2 PM',   color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.22)'  },
  { id: 'evening', Icon: Ic.Sunset,   label: 'Evening', time: '2 PM – 10 PM',  color: '#fb923c', bg: 'rgba(249,115,22,0.12)',   border: 'rgba(249,115,22,0.22)'  },
  { id: 'night',   Icon: Ic.Moon,     label: 'Night',   time: '10 PM – 6 AM',  color: '#a78bfa', bg: 'rgba(139,92,246,0.12)',   border: 'rgba(139,92,246,0.22)'  },
  { id: 'custom',  Icon: Ic.Clock,    label: 'Custom',  time: 'Other / split', color: '#94a3b8', bg: 'rgba(100,116,139,0.12)',  border: 'rgba(100,116,139,0.22)' },
];

const STATUS_CFG = {
  pending:  { label: 'Awaiting Review', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  approved: { label: 'Approved',        color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  rejected: { label: 'Rejected',        color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)'  },
};

const FILTER_TABS = ['all', 'pending', 'approved', 'rejected'];

export default function OvertimePage() {
  const confirm = useConfirm();
  const [tab, setTab]               = useState('my');
  const [data, setData]             = useState({ totalApprovedHours: 0, pendingCount: 0, records: [] });
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm]             = useState({ date: new Date().toISOString().split('T')[0], shift: 'morning', extraHours: '', reason: '' });
  const [submitting, setSubmitting]  = useState(false);
  const [msg, setMsg]               = useState({ type: '', text: '' });
  useToastMessage(msg);

  const fetchRecords = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: d } = await API.get('/overtime/my');
      setData(d);
    } catch { setData({ totalApprovedHours: 0, pendingCount: 0, records: [] }); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    let socket;
    import('../../utils/socketClient').then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      socket.on('overtime:updated', () => fetchRecords(true));
    });
    return () => { if (socket) socket.off('overtime:updated'); };
  }, [fetchRecords]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.extraHours || Number(form.extraHours) <= 0) {
      setMsg({ type: 'error', text: 'Valid work duration required.' }); return;
    }
    setSubmitting(true);
    try {
      await API.post('/overtime', { ...form, extraHours: Number(form.extraHours) });
      setMsg({ type: 'success', text: 'Application recorded for verification.' });
      setForm({ date: new Date().toISOString().split('T')[0], shift: 'morning', extraHours: '', reason: '' });
      fetchRecords(); setTab('my');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed.' });
    } finally { setSubmitting(false); }
  };

  const handleWithdraw = async id => {
    const isConfirmed = await confirm({ title: 'Withdraw Overtime Entry', message: 'This action will remove the record from verification.', confirmText: 'Remove Entry' });
    if (!isConfirmed) return;
    try { await API.delete(`/overtime/withdraw/${id}`); notify.success('Record removed.'); fetchRecords(); }
    catch { notify.error('Failed to remove.'); }
  };

  /* ── Monthly Earnings Calculation ── */
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const getMonthKey = dStr => {
    const d = new Date(dStr);
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const currentMonthKey = getMonthKey(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  const earningsData = useMemo(() => {
    const monthly = {};
    let allTime = 0;
    
    data.records.forEach(r => {
      // For earnings, we only count approved sessions (as requested "exact OT earning")
      // BUT if the user wants "Estimated", maybe include pending too? 
      // User said "exact OT earning for a specific month", implying verified/payout.
      // However, usually "Estimated" means all. Let's include everything that isn't rejected
      // to match the "Estimated" label, but highlight approved as "Verified".
      if (r.status === 'rejected') return;
      
      const key = getMonthKey(r.date);
      const amount = r.approvedAmount || (r.extraHours * OT_HOURLY_RATE);
      
      monthly[key] = (monthly[key] || 0) + amount;
      allTime += amount;
    });
    
    return { monthly, allTime };
  }, [data.records]);

  const monthOptions = useMemo(() => {
    const keys = Object.keys(earningsData.monthly);
    if (!keys.includes(currentMonthKey)) keys.push(currentMonthKey);
    // Sort chronologically: convert key back to date for sorting
    return keys.sort((a, b) => {
      const [ma, ya] = a.split(' ');
      const [mb, yb] = b.split(' ');
      return new Date(`${ma} 1, ${ya}`) > new Date(`${mb} 1, ${yb}`) ? -1 : 1;
    });
  }, [earningsData.monthly, currentMonthKey]);

  const activeMonthEarnings = earningsData.monthly[selectedMonth] || 0;
  
  const filtered = statusFilter === 'all' ? data.records : data.records.filter(r => r.status === statusFilter);

  const fmtCurrency = (val) => new Intl.NumberFormat('en-LK', { 
    style: 'currency', 
    currency: 'LKR',
    minimumFractionDigits: 2 
  }).format(val);

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div className="page-title-icon" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}>
              <Ic.Clock size={22} />
            </div>
            Occupational Overtime
          </div>
          <div className="page-subtitle">Track additional duty hours and clinical compensation earned</div>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 16, border: '1px solid var(--border)' }}>
          <button className={`chip-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>Work Journals</button>
          <button className={`chip-tab ${tab === 'apply' ? 'active' : ''}`} onClick={() => setTab('apply')}>+ Log Session</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stat-hero-grid">
        {/* Total hours */}
        <div className="stat-hero-card" style={{ '--glow-color': 'rgba(37,99,235,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Verified Hours</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '2.6rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {data.totalApprovedHours}
                <span style={{ fontSize: '1rem', color: 'var(--text3)', fontWeight: 500, marginLeft: 6 }}>hrs</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
              <Ic.Clock size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, marginTop: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'glow-pulse 2s ease infinite' }} />
            Active duty cycle: {currentMonthKey}
          </div>
          {data.pendingCount > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 5 }}>
              ⏳ {data.pendingCount} session{data.pendingCount > 1 ? 's' : ''} pending review
            </div>
          )}
        </div>

        {/* Earnings */}
        <div className="stat-hero-card" style={{ '--glow-color': 'rgba(16,185,129,0.1)', overflow: 'hidden' }}>
          {/* subtle background pattern icon */}
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.03, transform: 'rotate(-15deg)' }}>
            <Ic.TrendUp size={140} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Earnings Breakdown
              </div>
              
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    appearance: 'none',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text2)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '6px 32px 6px 14px',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                  className="month-hover-select"
                >
                  {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--text3)' }}>
                  <Ic.ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontWeight: 500, marginBottom: 4 }}>
                {selectedMonth} verified total
              </div>
              <div style={{ 
                fontFamily: "'DM Sans',sans-serif", 
                fontSize: '2.4rem', 
                fontWeight: 800, 
                color: '#34d399', 
                letterSpacing: '-0.04em', 
                lineHeight: 1,
                textShadow: '0 0 20px rgba(52,211,153,0.15)'
              }}>
                {fmtCurrency(activeMonthEarnings)}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: '0.76rem', fontWeight: 500 }}>
                <Ic.TrendUp size={14} color="#34d399" />
                Rate: {fmtCurrency(OT_HOURLY_RATE)}/hr
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end'
              }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Career Total</span>
                <span style={{ fontSize: '0.86rem', color: 'var(--text2)', fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>
                  {fmtCurrency(earningsData.allTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {tab === 'apply' ? (
        <div className="form-card-premium" style={{ animation: 'fadeInUp 0.35s ease', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Document Work Session</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Log your additional duty hours for verification and compensation</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22 }}>
            {/* Shift picker */}
            <div>
              <div className="form-label" style={{ marginBottom: 12 }}>Shift Identification</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {SHIFTS.map(s => {
                  const Icon = s.Icon;
                  const active = form.shift === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setForm({ ...form, shift: s.id })}
                      style={{
                        padding: '16px 12px',
                        borderRadius: 14,
                        border: `1px solid ${active ? s.color : 'var(--border)'}`,
                        background: active ? s.bg : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.18s ease',
                        boxShadow: active ? `0 6px 18px ${s.color}22` : 'none',
                      }}
                    >
                      <div style={{ color: active ? s.color : 'var(--text3)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}><Icon size={22} /></div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: active ? s.color : 'var(--text2)', marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text4)' }}>{s.time}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date + Hours */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duty Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Hours)</label>
                <input className="form-input" type="number" step="0.5" min="0.5" max="24" placeholder="e.g. 4.0" value={form.extraHours} onChange={e => setForm({ ...form, extraHours: e.target.value })} />
              </div>
            </div>

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Log Description</label>
              <textarea className="form-input form-textarea" placeholder="Justify the additional work period (e.g. Emergency support, staff shortage...)" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={{ minHeight: 100 }} />
            </div>

            {/* Preview */}
            {form.extraHours && Number(form.extraHours) > 0 && (
              <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Estimated compensation:</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', fontFamily: "'DM Sans',sans-serif" }}>
                  {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(form.extraHours) * OT_HOURLY_RATE)}
                </span>
              </div>
            )}

            <button className="btn btn-primary btn-full" style={{ padding: '14px', borderRadius: 14, fontSize: '0.92rem' }} type="submit" disabled={submitting}>
              {submitting ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Recording...</>
              ) : 'Submit Work Session'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
            {FILTER_TABS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 10,
                  fontSize: '0.79rem',
                  fontWeight: 700,
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  background: statusFilter === f ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'rgba(255,255,255,0.03)',
                  color: statusFilter === f ? '#fff' : 'var(--text3)',
                  borderColor: statusFilter === f ? 'transparent' : 'var(--border)',
                  boxShadow: statusFilter === f ? '0 3px 12px rgba(37,99,235,0.35)' : 'none',
                }}
              >
                {f}
                <span style={{ marginLeft: 6, fontSize: '0.7rem', opacity: 0.7 }}>
                  {f === 'all' ? data.records.length : data.records.filter(r => r.status === f).length}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 108, borderRadius: 18 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ color: 'var(--text4)', marginBottom: 16, display: 'flex', justifyContent: 'center', opacity: 0.3 }}><Ic.Clock size={48} /></div>
              <div className="empty-state-text">No work sessions matched the criteria</div>
              <div className="empty-state-sub">Try a different filter or log a new session</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(r => {
                const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                const sh  = SHIFTS.find(s => s.id === r.shift) || SHIFTS[3];
                const Icon = sh.Icon;
                return (
                  <div key={r._id} className="action-card">
                    {/* Left accent */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: cfg.color, borderRadius: '20px 0 0 20px' }} />

                    <div className="action-card-icon" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                      <Icon size={20} />
                    </div>

                    <div className="action-card-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                          {new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text3)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Ic.Clock size={12} /> {sh.label} Block · {sh.time}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Ic.TrendUp size={12} /> {r.extraHours} clinical hours</span>
                      </div>
                    </div>

                    {/* Earnings */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Earnings</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', fontWeight: 800, color: r.status === 'approved' ? '#34d399' : 'var(--text3)' }}>
                        {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(r.approvedAmount || (r.extraHours * OT_HOURLY_RATE))}
                      </div>
                    </div>

                    {r.status === 'pending' && (
                      <button
                        className="icon-btn"
                        onClick={() => handleWithdraw(r._id)}
                        title="Withdraw"
                        style={{ border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', background: 'rgba(239,68,68,0.08)' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
