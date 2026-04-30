import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import useToastMessage from '../../hooks/useToastMessage';
import * as Ic from '../../components/icons';

const TYPES = ['annual','sick','casual','overtime_comp'];

const TYPE_META = {
  annual:       { Icon: Ic.Calendar, color: '#60a5fa', bg: 'rgba(96,165,250,0.14)',  border: 'rgba(96,165,250,0.25)',  label: 'Annual Leave'        },
  sick:         { Icon: Ic.User,     color: '#f43f5e', bg: 'rgba(244,63,94,0.14)',  border: 'rgba(244,63,94,0.25)',   label: 'Sick Leave'          },
  casual:       { Icon: Ic.Clock,    color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.25)',  label: 'Casual Leave'        },
  overtime_comp:{ Icon: Ic.Transfer, color: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.25)',  label: 'Overtime Comp'       },
};

const STATUS_CFG = {
  pending:  { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)',  label: 'Pending'  },
  approved: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)',  label: 'Approved' },
  rejected: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.25)',   label: 'Rejected' },
};

export default function LeavePage() {
  const [leaves, setLeaves]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('my');
  const [form, setForm]           = useState({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState({ type: '', text: '' });
  useToastMessage(msg);

  const fetchLeaves = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const { data } = await API.get('/leave/my'); setLeaves(data); }
    catch { setLeaves([]); } finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  useEffect(() => {
    let socket;
    import('../../utils/socketClient').then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      socket.on('leave:updated', () => fetchLeaves(true));
    });
    return () => { if (socket) socket.off('leave:updated'); };
  }, [fetchLeaves]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) { setMsg({ type: 'error', text: 'Selection of dates is mandatory.' }); return; }
    if (new Date(form.startDate) > new Date(form.endDate)) { setMsg({ type: 'error', text: 'Invalid date sequence.' }); return; }
    setSubmitting(true);
    try {
      await API.post('/leave', form);
      setMsg({ type: 'success', text: 'Application recorded. Awaiting clinical head approval.' });
      setForm({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
      fetchLeaves(); setTab('my');
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed.' }); }
    finally { setSubmitting(false); }
  };

  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const totalDays = approvedLeaves.reduce((sum, l) =>
    sum + (Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1), 0);

  const pendingCount  = leaves.filter(l => l.status === 'pending').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div className="page-title-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
              <Ic.Calendar size={22} />
            </div>
            Time Off & Leave
          </div>
          <div className="page-subtitle">Personal attendance tracking and clinical leave coordination</div>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 16, border: '1px solid var(--border)' }}>
          <button className={`chip-tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>Leave History</button>
          <button className={`chip-tab ${tab === 'apply' ? 'active' : ''}`} onClick={() => setTab('apply')}>+ Apply Leave</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stat-hero-grid">
        {/* Annual utilization */}
        <div className="stat-hero-card" style={{ '--glow-color': 'rgba(37,99,235,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Annual Utilized</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '2.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {totalDays}
                <span style={{ fontSize: '0.95rem', color: 'var(--text3)', fontWeight: 500, marginLeft: 6 }}>/ 24 days</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
              <Ic.Calendar size={22} />
            </div>
          </div>
          <div className="progress-track" style={{ marginTop: 20 }}>
            <div className="progress-fill" style={{ width: `${Math.min((totalDays / 24) * 100, 100)}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 8 }}>{Math.max(0, 24 - totalDays)} days remaining this year</div>
        </div>

        {/* Pending */}
        <div className="stat-hero-card" style={{ '--glow-color': 'rgba(251,146,60,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pending Approvals</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '2.4rem', fontWeight: 800, color: '#fb923c', letterSpacing: '-0.03em', lineHeight: 1 }}>{pendingCount}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb923c', flexShrink: 0 }}>
              <Ic.Clock size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 16 }}>
            {pendingCount > 0 ? 'Awaiting HR & clinical review' : 'No requests pending review'}
          </div>
          {rejectedCount > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>⚠</span> {rejectedCount} request{rejectedCount > 1 ? 's' : ''} declined
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {tab === 'apply' ? (

        <div className="form-card-premium" style={{ animation: 'fadeInUp 0.35s ease', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>New Leave Application</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Submit your request for review by the clinical head</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22 }}>

            {/* Leave type picker */}
            <div>
              <div className="form-label" style={{ marginBottom: 12 }}>Leave Category</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {TYPES.map(t => {
                  const meta = TYPE_META[t];
                  const Icon = meta.Icon;
                  const active = form.leaveType === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setForm({ ...form, leaveType: t })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '10px 18px',
                        borderRadius: 12,
                        border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                        background: active ? meta.bg : 'rgba(255,255,255,0.03)',
                        color: active ? meta.color : 'var(--text3)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        transition: 'all 0.18s ease',
                        boxShadow: active ? `0 4px 14px ${meta.color}22` : 'none',
                      }}
                    >
                      <Icon size={16} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Effective From</label>
                <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Effective To</label>
                <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Supportive Context / Reason</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Detail the necessity for this leave..."
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                style={{ minHeight: 120 }}
              />
            </div>

            <button className="btn btn-primary btn-full" style={{ padding: '14px', borderRadius: 14, fontSize: '0.92rem', marginTop: 4 }} type="submit" disabled={submitting}>
              {submitting ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Recording Application...</>
              ) : 'Submit Leave Application'}
            </button>
          </form>
        </div>

      ) : (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ height: 96, borderRadius: 18 }} />
            ))}
          </div>
        ) : leaves.length === 0 ? (
          <div className="empty-state">
            <div style={{ color: 'var(--text4)', marginBottom: 16, display: 'flex', justifyContent: 'center', opacity: 0.4 }}><Ic.Calendar size={48} /></div>
            <div className="empty-state-text">No leave requests recorded</div>
            <div className="empty-state-sub">Apply for leave using the button above</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => setTab('apply')}>Apply Now</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {leaves.map(l => {
              const cfg  = STATUS_CFG[l.status] || STATUS_CFG.pending;
              const meta = TYPE_META[l.leaveType] || TYPE_META.annual;
              const Icon = meta.Icon;
              const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1;
              return (
                <div key={l._id} className="action-card">
                  {/* Left accent bar */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: meta.color, borderRadius: '18px 0 0 18px' }} />

                  <div className="action-card-icon" style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
                    <Icon size={20} />
                  </div>

                  <div className="action-card-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', textTransform: 'capitalize' }}>
                        {l.leaveType.replace('_', ' ')} Leave
                      </span>
                      <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 18, fontSize: '0.76rem', color: 'var(--text3)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ic.Calendar size={12} />
                        {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ic.Clock size={12} />
                        {days} day{days > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {l.reviewedBy && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Reviewed By</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text2)' }}>{l.reviewedBy.name}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
