import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import useToastMessage from '../../hooks/useToastMessage';

const TYPES = ['annual','sick','casual','overtime_comp'];
const STATUS_CFG = {
  pending:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  approved: { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
};
const TYPE_ICON = { annual:'🌞', sick:'🤒', casual:'☕', overtime_comp:'💼' };

export default function LeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('my');
  const [form, setForm] = useState({ leaveType:'annual', startDate:'', endDate:'', reason:'' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });
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
    if (!form.startDate || !form.endDate) { setMsg({ type:'error', text:'Start and end dates are required.' }); return; }
    if (new Date(form.startDate) > new Date(form.endDate)) { setMsg({ type:'error', text:'Start date cannot be after end date.' }); return; }
    setSubmitting(true);
    try {
      await API.post('/leave', form);
      setMsg({ type:'success', text:'Leave application submitted!' });
      setForm({ leaveType:'annual', startDate:'', endDate:'', reason:'' });
      fetchLeaves(); setTab('my');
    } catch (err) { setMsg({ type:'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setSubmitting(false); }
  };

  const pending = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .leave-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 22px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          backdrop-filter: blur(12px);
          transition: all 0.2s;
        }
        .leave-card:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">🌴 My Leave</div>
          <div className="page-subtitle">Apply and track your leave requests</div>
        </div>
        <button className={`btn ${tab === 'my' ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setTab(tab === 'my' ? 'apply' : 'my')}>
          {tab === 'my' ? '+ Apply Leave' : '← Back to My Leaves'}
        </button>
      </div>

      {/* Stats */}
      {leaves.length > 0 && tab === 'my' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total', value: leaves.length, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', icon: '🌴' },
            { label: 'Pending', value: pending, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', icon: '⏳' },
            { label: 'Approved', value: approved, color: '#34d399', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bg.replace('0.12','0.3')}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '0.71rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'apply' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', backdropFilter: 'blur(12px)', marginBottom: 24 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            🌴 Apply for Leave
          </div>
          {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                {TYPES.map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setForm({ ...form, leaveType: t })}
                    style={{
                      padding: '7px 14px', borderRadius: 999,fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      background: form.leaveType === t ? 'var(--primary)' : 'rgba(148,163,184,0.1)',
                      color: form.leaveType === t ? '#fff' : 'var(--text2)',
                      border: `1px solid ${form.leaveType === t ? 'var(--primary)' : 'var(--border)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {TYPE_ICON[t]} {t.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-textarea" placeholder="Reason for leave…" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : '→ Submit Application'}
            </button>
          </form>
        </div>
      )}

      {tab === 'my' && (
        loading ? (
          <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
            <div className="spinner" style={{ margin: 0 }} />
          </div>
        ) : leaves.length === 0 ? (
          <div className="empty-state" style={{ padding: '70px 20px' }}>
            <div className="empty-state-icon">🌴</div>
            <div className="empty-state-text" style={{ fontWeight: 600 }}>No leave requests yet</div>
            <div style={{ color: 'var(--text3)', fontSize: '0.875rem', marginTop: 8 }}>Apply for your first leave above</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => setTab('apply')}>+ Apply Leave</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaves.map(l => {
              const cfg = STATUS_CFG[l.status] || STATUS_CFG.pending;
              const icon = TYPE_ICON[l.leaveType] || '🌴';
              const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1;
              return (
                <div key={l._id} className="leave-card" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                  {/* Type icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                    {icon}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', textTransform: 'capitalize' }}>
                        {l.leaveType.replace('_',' ')} Leave
                      </span>
                      <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '2px 9px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' }}>
                        {l.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text2)', flexWrap: 'wrap' }}>
                      <span>📅 {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</span>
                      <span style={{ color: cfg.color, fontWeight: 600 }}>{days} day{days !== 1 ? 's' : ''}</span>
                    </div>
                    {l.reason && <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 4 }}>"{l.reason}"</div>}
                    {l.reviewedBy?.name && <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 4 }}>Reviewed by: {l.reviewedBy.name}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
