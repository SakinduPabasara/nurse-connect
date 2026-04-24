import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../api/axios';
import useToastMessage from '../../hooks/useToastMessage';
import { notify } from '../../utils/toast';
import { useConfirm } from '../../context/ConfirmContext';

/* ─────────────────────────────────── constants ── */
const OT_HOURLY_RATE = 150; // LKR per hour — update to match hospital policy

/* ─────────────────────────────────── helpers ── */
const todayStr = () => new Date().toISOString().split('T')[0];

const minDateStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
};

const fmtDate = (ds) => {
  if (!ds) return '—';
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
};

const fmtAmount = (hours) =>
  `LKR ${(hours * OT_HOURLY_RATE).toLocaleString('en-LK', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

const fmtMonthKey = (ds) => {
  if (!ds) return '';
  const [y, m] = ds.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/* ─────────────────────────────────── config maps ── */
const SHIFTS = [
  { id: 'morning', icon: '🌅', label: 'Morning', time: '6 AM – 2 PM',  color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  { id: 'evening', icon: '🌇', label: 'Evening', time: '2 PM – 10 PM', color: '#fb923c', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)'  },
  { id: 'night',   icon: '🌙', label: 'Night',   time: '10 PM – 6 AM', color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)'  },
  { id: 'custom',  icon: '⚙️', label: 'Custom',  time: 'Other / split', color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)' },
];

const STATUS_CFG = {
  pending:  { icon: '⏳', label: 'Pending Review', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  approved: { icon: '✅', label: 'Approved',        color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
  rejected: { icon: '❌', label: 'Rejected',         color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)'   },
};

const getShift = (id) => SHIFTS.find((s) => s.id === id) || SHIFTS[3];

/* ─────────────────────────────────── skeleton ── */
function SkeletonCard() {
  return (
    <div className="ot-app-card" style={{ opacity: 0.45 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(148,163,184,0.1)' }} />
        <div>
          <div style={{ width: 120, height: 12, borderRadius: 4, background: 'rgba(148,163,184,0.12)', marginBottom: 6 }} />
          <div style={{ width: 80, height: 10, borderRadius: 4, background: 'rgba(148,163,184,0.08)' }} />
        </div>
        <div style={{ marginLeft: 'auto', width: 60, height: 22, borderRadius: 999, background: 'rgba(148,163,184,0.1)' }} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: '45%', height: 10, borderRadius: 4, background: 'rgba(148,163,184,0.08)' }} />
        <div style={{ width: '30%', height: 10, borderRadius: 4, background: 'rgba(148,163,184,0.06)' }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function OvertimePage() {
  const confirm = useConfirm();
  const [tab, setTab] = useState('my');
  const [data, setData] = useState({ totalApprovedHours: 0, pendingCount: 0, records: [] });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  /* ── form ── */
  const [form, setForm] = useState({ date: todayStr(), shift: 'morning', extraHours: '', reason: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  useToastMessage(msg);

  /* ── withdraw ── */
  const [withdrawingId, setWithdrawingId] = useState(null);

  /* ── fetch ── */
  const fetchRecords = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: d } = await API.get('/overtime/my');
      setData(d);
    } catch {
      setData({ totalApprovedHours: 0, pendingCount: 0, records: [] });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    let socket;
    import('../../utils/socketClient').then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      const onUpdate = () => fetchRecords(true);
      socket.on('overtime:updated', onUpdate);
      socket.on('overtime:deleted', onUpdate);
    });
    return () => {
      if (socket) {
        socket.off('overtime:updated');
        socket.off('overtime:deleted');
      }
    };
  }, [fetchRecords]);

  /* ── derived stats ── */
  const approved = useMemo(() => data.records.filter((r) => r.status === 'approved'), [data.records]);
  const rejected = useMemo(() => data.records.filter((r) => r.status === 'rejected'), [data.records]);

  /* Total earned: use actual admin-set approvedAmount from DB when available */
  const totalApprovedAmount = useMemo(
    () => approved.reduce((sum, r) =>
      sum + (r.approvedAmount != null ? r.approvedAmount : r.extraHours * OT_HOURLY_RATE), 0),
    [approved],
  );

  const curMonthKey = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const thisMonthHours = useMemo(
    () => approved.filter((r) => fmtMonthKey(r.date) === curMonthKey).reduce((s, r) => s + r.extraHours, 0),
    [approved, curMonthKey],
  );
  /* This month earned amount using actual approvedAmount */
  const thisMonthAmount = useMemo(
    () => approved
      .filter((r) => fmtMonthKey(r.date) === curMonthKey)
      .reduce((s, r) => s + (r.approvedAmount != null ? r.approvedAmount : r.extraHours * OT_HOURLY_RATE), 0),
    [approved, curMonthKey],
  );

  /* ── duplicate check ── */
  const isDuplicate = useMemo(
    () => data.records.some((r) => r.date === form.date && r.shift === form.shift),
    [data.records, form.date, form.shift],
  );

  /* ── filtered list ── */
  const filtered = useMemo(() => {
    if (statusFilter === 'all') return data.records;
    return data.records.filter((r) => r.status === statusFilter);
  }, [data.records, statusFilter]);

  /* ── form submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.date) errors.date = 'Date is required.';
    if (form.date > todayStr()) errors.date = 'Cannot apply OT for a future date.';
    if (!form.extraHours || Number(form.extraHours) < 0.5) errors.extraHours = 'Minimum 0.5 hours.';
    if (Number(form.extraHours) > 24) errors.extraHours = 'Cannot exceed 24 hours.';
    if (isDuplicate) errors.shift = `You already have a ${form.shift} shift application for this date.`;
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    setSubmitting(true);
    try {
      await API.post('/overtime', {
        date: form.date,
        shift: form.shift,
        extraHours: Number(form.extraHours),
        reason: form.reason,
      });
      setMsg({ type: 'success', text: 'OT application submitted! Awaiting admin review.' });
      setForm({ date: todayStr(), shift: 'morning', extraHours: '', reason: '' });
      fetchRecords();
      setTab('my');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit OT application.' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── withdraw ── */
  const handleWithdraw = async (id) => {
    const isConfirmed = await confirm({ title: "Withdraw Application", message: "Withdraw this OT application? This cannot be undone.", confirmText: "Withdraw" });
    if (!isConfirmed) return;
    setWithdrawingId(id);
    try {
      await API.delete(`/overtime/withdraw/${id}`);
      notify.success('OT application withdrawn.');
      fetchRecords();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  /* ── potential earning preview ── */
  const preview = form.extraHours && !isNaN(Number(form.extraHours))
    ? fmtAmount(Number(form.extraHours))
    : null;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Stat cards ── */
        .ot-n-stat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          backdrop-filter: blur(14px);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ot-n-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.3); }

        /* ── Tab strip ── */
        .ot-tabs {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          width: fit-content;
        }
        .ot-tab {
          padding: 8px 22px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: var(--text3);
          font-family: 'Inter', sans-serif;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .ot-tab.active { background: var(--primary); color: #fff; box-shadow: 0 2px 10px rgba(37,99,235,0.35); }
        .ot-tab:hover:not(.active) { color: var(--text); background: rgba(255,255,255,0.05); }
        .ot-tab-badge {
          background: rgba(255,255,255,0.2);
          border-radius: 999px;
          padding: 1px 7px;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .ot-tab:not(.active) .ot-tab-badge {
          background: rgba(245,158,11,0.15);
          color: #fbbf24;
        }

        /* ── Status filter chips ── */
        .ot-filter-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; }
        .ot-chip {
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text3);
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }
        .ot-chip:hover { color: var(--text); border-color: rgba(148,163,184,0.25); background: rgba(255,255,255,0.04); }
        .ot-chip.active { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 2px 8px rgba(37,99,235,0.3); }

        /* ── Application card ── */
        .ot-app-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 22px;
          margin-bottom: 10px;
          backdrop-filter: blur(14px);
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
          position: relative;
          overflow: hidden;
        }
        .ot-app-card:hover {
          transform: translateX(3px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.28);
        }

        /* ── Shift pill ── */
        .ot-shift-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 11px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid;
        }

        /* ── Form panel ── */
        .ot-form-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px 32px;
          backdrop-filter: blur(16px);
          box-shadow: var(--shadow);
          animation: fadeInUp 0.25s ease;
        }

        /* ── Shift selector ── */
        .ot-shift-btn {
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text3);
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 82px;
        }
        .ot-shift-btn:hover { border-color: rgba(148,163,184,0.3); color: var(--text); background: rgba(255,255,255,0.04); }
        .ot-shift-btn.selected { background: var(--bg3); }

        /* ── Field error ── */
        .ot-field-err { color: var(--danger); font-size: 0.76rem; margin-top: 4px; display: flex; align-items: center; gap: 4px; }

        /* ── Earning preview box ── */
        .ot-preview-box {
          background: rgba(16,185,129,0.07);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 10px;
          padding: 11px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          font-size: 0.84rem;
        }

        /* ── Admin note (rejected) ── */
        .ot-admin-note {
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.8rem;
          color: #fca5a5;
          margin-top: 10px;
          display: flex;
          gap: 7px;
          align-items: flex-start;
        }

        /* ── Amount badge ── */
        .ot-amount-badge {
          background: rgba(16,185,129,0.12);
          color: #34d399;
          border: 1px solid rgba(16,185,129,0.28);
          border-radius: 999px;
          padding: 5px 16px;
          font-size: 0.92rem;
          font-weight: 800;
          flex-shrink: 0;
          letter-spacing: -0.02em;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Hours bubble ── */
        .ot-hours-big {
          background: rgba(6,182,212,0.1);
          color: #22d3ee;
          border: 1px solid rgba(6,182,212,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          text-align: center;
          min-width: 64px;
          flex-shrink: 0;
        }

        /* ── Duplicate warning ── */
        .ot-dup-warn {
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.82rem;
          color: #fbbf24;
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 14px;
        }

        /* ── Responsive ── */
        @media (max-width: 720px) {
          .ot-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .ot-form-panel { padding: 20px; }
          .ot-shift-btn { min-width: 70px; font-size: 0.75rem; }
        }
        @media (max-width: 420px) {
          .ot-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">⏰ My Overtime</div>
          <div className="page-subtitle">Submit and track your overtime work sessions</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setTab('apply')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Apply for OT
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="ot-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 26 }}>
        {[
          { icon: '✅', label: 'Approved Hours',   value: `${data.totalApprovedHours}h`, sub: 'total all time',  color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
          { icon: '💰', label: 'Total Earned',      value: loading ? '…' : `LKR ${totalApprovedAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, sub: 'admin-approved payout', color: '#22d3ee', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)'   },
          { icon: '⏳', label: 'Pending Review',    value: data.pendingCount,              sub: 'awaiting admin',  color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
          { icon: '📅', label: 'This Month',        value: loading ? '…' : `LKR ${thisMonthAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, sub: `${thisMonthHours}h approved`,  color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
        ].map((s) => (
          <div key={s.label} className="ot-n-stat">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              {loading ? <div style={{ width: 20, height: 20, borderRadius: 50, background: 'rgba(148,163,184,0.15)' }} /> : s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
              {loading
                ? <div style={{ width: 54, height: 20, borderRadius: 4, background: 'rgba(148,163,184,0.1)' }} />
                : <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
              }
              {!loading && <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 3 }}>{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab strip ── */}
      <div className="ot-tabs">
        <button className={`ot-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
          📋 My Applications
          {data.pendingCount > 0 && <span className="ot-tab-badge">{data.pendingCount}</span>}
        </button>
        <button className={`ot-tab ${tab === 'apply' ? 'active' : ''}`} onClick={() => setTab('apply')}>
          ➕ Apply for OT
        </button>
      </div>

      {/* ════════════════ TAB: MY APPLICATIONS ════════════════ */}
      {tab === 'my' && (
        <>
          {/* Status filter chips */}
          {data.records.length > 0 && (
            <div className="ot-filter-bar">
              {[
                { id: 'all',      label: `All (${data.records.length})` },
                { id: 'pending',  label: `⏳ Pending (${data.pendingCount})` },
                { id: 'approved', label: `✅ Approved (${approved.length})` },
                { id: 'rejected', label: `❌ Rejected (${rejected.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`ot-chip ${statusFilter === f.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '72px 20px' }}>
              <div className="empty-state-icon">⏰</div>
              <div className="empty-state-text" style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text2)', marginBottom: 10 }}>
                {statusFilter !== 'all' ? `No ${statusFilter} applications` : 'No OT applications yet'}
              </div>
              <div style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: 18 }}>
                {statusFilter !== 'all'
                  ? 'Try selecting a different filter'
                  : 'Apply for overtime when you work extra hours'}
              </div>
              {statusFilter === 'all' && (
                <button className="btn btn-primary btn-sm" onClick={() => setTab('apply')}>
                  + Apply for OT
                </button>
              )}
              {statusFilter !== 'all' && (
                <button className="btn btn-outline btn-sm" onClick={() => setStatusFilter('all')}>
                  View All
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((r) => {
                const st = STATUS_CFG[r.status] || STATUS_CFG.pending;
                const sh = getShift(r.shift);
                return (
                  <div
                    key={r._id}
                    className="ot-app-card"
                    style={{ borderLeft: `3px solid ${st.color}` }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                      {/* Date + hours bubble */}
                      <div className="ot-hours-big">
                        <div style={{ fontSize: '0.62rem', color: '#22d3ee', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {r.date ? new Date(...r.date.split('-').map(Number)).toLocaleDateString('en-US', { month: 'short' }) : ''}
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>
                          {r.date ? Number(r.date.split('-')[2]) : ''}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span
                            className="ot-shift-pill"
                            style={{ color: sh.color, background: sh.bg, borderColor: sh.border }}
                          >
                            {sh.icon} {sh.label}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{fmtDate(r.date)}</span>
                        </div>

                        {/* Reason */}
                        <div style={{ fontSize: '0.875rem', color: r.reason ? 'var(--text2)' : 'var(--text3)', fontStyle: r.reason ? 'normal' : 'italic', marginBottom: 6, lineHeight: 1.5 }}>
                          {r.reason || 'No reason provided'}
                        </div>

                        {/* Meta */}
                        <div style={{ fontSize: '0.76rem', color: 'var(--text3)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span>
                            Applied: {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {r.reviewedBy?.name && (
                            <span>Reviewed by: <strong style={{ color: 'var(--text2)' }}>{r.reviewedBy.name}</strong></span>
                          )}
                        </div>

                        {/* Admin note for rejected */}
                        {r.status === 'rejected' && r.adminNote && (
                          <div className="ot-admin-note">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="1" fill="currentColor" />
                            </svg>
                            <span><strong>Admin note:</strong> {r.adminNote}</span>
                          </div>
                        )}
                      </div>

                      {/* Right side actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                        {/* Hours or Amount badge */}
                        {r.status === 'approved' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 999, padding: '4px 12px', fontSize: '0.9rem', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>
                              {r.extraHours}h
                            </span>
                            {/* Show actual DB approvedAmount set by admin */}
                            <span className="ot-amount-badge">
                              LKR {(r.approvedAmount != null ? r.approvedAmount : r.extraHours * OT_HOURLY_RATE).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </span>
                            {/* Indicate if admin set a custom rate */}
                            {r.approvedAmount != null && r.approvedAmount !== r.extraHours * OT_HOURLY_RATE && (
                              <span style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: 600, textAlign: 'right' }}>
                                ✦ Custom amount
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 999, padding: '5px 14px', fontSize: '0.9rem', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>
                            {r.extraHours}h
                          </span>
                        )}

                        {/* Status badge */}
                        <span
                          style={{
                            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                            borderRadius: 999, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700,
                          }}
                        >
                          {st.icon} {st.label}
                        </span>

                        {/* Withdraw (pending only) */}
                        {r.status === 'pending' && (
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => handleWithdraw(r._id)}
                            disabled={withdrawingId === r._id}
                            style={{ fontSize: '0.72rem', opacity: withdrawingId === r._id ? 0.5 : 1 }}
                          >
                            {withdrawingId === r._id ? 'Withdrawing…' : 'Withdraw'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Summary footer */}
              {statusFilter === 'approved' && filtered.length > 0 && (
                <div style={{ marginTop: 10, padding: '14px 20px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text3)' }}>
                    Total approved: <strong style={{ color: '#34d399' }}>{filtered.reduce((s, r) => s + r.extraHours, 0)}h</strong>
                  </span>
                  <span style={{ fontSize: '0.83rem', color: '#34d399', fontWeight: 700 }}>
                    {fmtAmount(filtered.reduce((s, r) => s + r.extraHours, 0))}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════ TAB: APPLY FOR OT ════════════════ */}
      {tab === 'apply' && (
        <div className="ot-form-panel">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              📋
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Apply for Overtime</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 2 }}>Fill in the details for your overtime work session</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date Worked *</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                min={minDateStr()}
                max={todayStr()}
                onChange={(e) => { setForm({ ...form, date: e.target.value }); setFormErrors((p) => ({ ...p, date: '' })); }}
                style={formErrors.date ? { borderColor: 'var(--danger)' } : {}}
              />
              {formErrors.date && <div className="ot-field-err"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>{formErrors.date}</div>}
              <div className="form-hint">Cannot be a future date or more than 3 months ago</div>
            </div>

            {/* Shift selector */}
            <div className="form-group">
              <label className="form-label">Shift *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SHIFTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`ot-shift-btn ${form.shift === s.id ? 'selected' : ''}`}
                    style={form.shift === s.id ? { borderColor: s.border, color: s.color, boxShadow: `0 0 0 2px ${s.border}` } : {}}
                    onClick={() => { setForm({ ...form, shift: s.id }); setFormErrors((p) => ({ ...p, shift: '' })); }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: form.shift === s.id ? s.color : undefined }}>{s.label}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 400 }}>{s.time}</span>
                  </button>
                ))}
              </div>
              {formErrors.shift && <div className="ot-field-err" style={{ marginTop: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>{formErrors.shift}</div>}
            </div>

            {/* Duplicate warning */}
            {isDuplicate && (
              <div className="ot-dup-warn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                You already have a <strong>{form.shift}</strong> shift application for <strong>{fmtDate(form.date)}</strong>. Choose a different date or shift.
              </div>
            )}

            {/* Extra hours */}
            <div className="form-group">
              <label className="form-label">Extra Hours Worked *</label>
              <div style={{ position: 'relative', maxWidth: 200 }}>
                <input
                  className="form-input"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  placeholder="e.g. 3.5"
                  value={form.extraHours}
                  onChange={(e) => { setForm({ ...form, extraHours: e.target.value }); setFormErrors((p) => ({ ...p, extraHours: '' })); }}
                  style={{ paddingRight: 36, ...(formErrors.extraHours ? { borderColor: 'var(--danger)' } : {}) }}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.82rem', fontWeight: 700, color: form.extraHours ? '#22d3ee' : 'var(--text3)', pointerEvents: 'none' }}>h</span>
              </div>
              {formErrors.extraHours && <div className="ot-field-err"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>{formErrors.extraHours}</div>}
              <div className="form-hint">Minimum 0.5 hours, maximum 24 hours</div>
            </div>

            {/* Reason */}
            <div className="form-group">
              <label className="form-label">Reason / Description <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(recommended)</span></label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe what required overtime work — e.g. Emergency patient intake, ICU support during night, Staff shortage coverage, Critical surgery assistance…"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                style={{ minHeight: 80 }}
              />
              <div className="form-hint">The more detail you provide, the easier it is for admin to approve</div>
            </div>

            {/* Potential earning preview */}
            {preview && !isDuplicate && (
              <div className="ot-preview-box">
                <span style={{ fontSize: '1.1rem' }}>💰</span>
                <span style={{ color: 'var(--text3)' }}>If approved, you will earn: </span>
                <strong style={{ color: '#34d399', fontSize: '1rem', fontFamily: "'DM Sans', sans-serif" }}>{preview}</strong>
                <span style={{ color: 'var(--text3)', fontSize: '0.78rem', marginLeft: 4 }}>({Number(form.extraHours)}h × LKR {OT_HOURLY_RATE})</span>
              </div>
            )}

            {/* Rate info */}
            <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 9, padding: '9px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text3)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#60a5fa', flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
              Overtime compensation rate: <strong style={{ color: '#60a5fa' }}>LKR {OT_HOURLY_RATE}/hour</strong>. Payment is processed after admin approval.
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="submit" disabled={submitting || isDuplicate}>
                {submitting ? (
                  <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: 50, animation: 'spin 0.7s linear infinite' }} />Submitting…</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Submit Application</>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setForm({ date: todayStr(), shift: 'morning', extraHours: '', reason: '' }); setFormErrors({}); }}
              >
                Reset
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('my')}>
                ← View My Applications
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
