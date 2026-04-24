import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useToastMessage from '../../hooks/useToastMessage';
import { notify } from '../../utils/toast';

const STATUS_CFG = {
  pending:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: 'Pending'  },
  approved: { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  label: 'Approved' },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   label: 'Rejected' },
};
const SHIFTS = ['7AM-1PM','1PM-7PM','7AM-7PM','7PM-7AM'];

export default function SwapPage() {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list');
  const [form, setForm] = useState({ targetNurse:'', requesterShiftDate:'', requesterShift:'7AM-1PM', targetShiftDate:'', targetShift:'7AM-1PM', reason:'' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });
  useToastMessage(msg);
  const { user } = useAuth();

  const fetchSwaps = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const { data } = await API.get('/swap/my'); setSwaps(data); }
    catch { setSwaps([]); } finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);

  useEffect(() => {
    let socket;
    import('../../utils/socketClient').then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      socket.on('swap:updated', () => fetchSwaps(true));
    });
    return () => { if (socket) socket.off('swap:updated'); };
  }, [fetchSwaps]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.targetNurse || !form.requesterShiftDate || !form.targetShiftDate) {
      setMsg({ type: 'error', text: 'Please fill all required fields.' }); return;
    }
    setSubmitting(true);
    try {
      await API.post('/swap', form);
      setMsg({ type: 'success', text: 'Swap request sent!' });
      setForm({ targetNurse:'', requesterShiftDate:'', requesterShift:'7AM-1PM', targetShiftDate:'', targetShift:'7AM-1PM', reason:'' });
      fetchSwaps(); setTab('list');
    } catch (err) { setMsg({ type:'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setSubmitting(false); }
  };

  const handleRespond = async (id, status) => {
    try { await API.put(`/swap/${id}`, { status }); fetchSwaps(); notify.success(`Swap ${status}.`); }
    catch (err) { notify.error(err.response?.data?.message || 'Failed.'); }
  };

  const pending = swaps.filter(s => s.status === 'pending').length;
  const approved = swaps.filter(s => s.status === 'approved').length;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .swap-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 22px;
          backdrop-filter: blur(12px);
          transition: all 0.2s;
        }
        .swap-card:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.26); }
        .shift-pill { padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: rgba(37,99,235,0.15); color: #60a5fa; border: 1px solid rgba(37,99,235,0.3); }
        .arrow-icon { color: var(--text3); font-size: 1.1rem; }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">🔄 Shift Swap</div>
          <div className="page-subtitle">Manage your shift swap requests</div>
        </div>
        <button className={`btn ${tab === 'list' ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setTab(tab === 'list' ? 'new' : 'list')}>
          {tab === 'list' ? '+ New Swap Request' : '← Back to List'}
        </button>
      </div>

      {/* Stats */}
      {swaps.length > 0 && tab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total', value: swaps.length, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', icon: '🔄' },
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

      {tab === 'new' ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            🔄 Send Swap Request
          </div>
          {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Target Nurse ID *</label>
              <input className="form-input" name="targetNurse" placeholder="Paste nurse user ID from ward roster" value={form.targetNurse} onChange={handleChange} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 4 }}>💡 Get the nurse ID from the ward roster page</div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Your Shift Date *</label>
                <input className="form-input" type="date" name="requesterShiftDate" value={form.requesterShiftDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Your Shift *</label>
                <select className="form-select" name="requesterShift" value={form.requesterShift} onChange={handleChange}>
                  {SHIFTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Shift Date *</label>
                <input className="form-input" type="date" name="targetShiftDate" value={form.targetShiftDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Target Shift *</label>
                <select className="form-select" name="targetShift" value={form.targetShift} onChange={handleChange}>
                  {SHIFTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason (optional)</label>
              <input className="form-input" name="reason" placeholder="Reason for swap…" value={form.reason} onChange={handleChange} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : '→ Send Request'}
            </button>
          </form>
        </div>
      ) : loading ? (
        <div className="loading-center" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="spinner" style={{ margin: 0 }} />
        </div>
      ) : swaps.length === 0 ? (
        <div className="empty-state" style={{ padding: '70px 20px' }}>
          <div className="empty-state-icon">🔄</div>
          <div className="empty-state-text" style={{ fontWeight: 600 }}>No swap requests yet</div>
          <div style={{ color: 'var(--text3)', fontSize: '0.875rem', marginTop: 8 }}>Create your first swap request above</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => setTab('new')}>+ New Request</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {swaps.map(s => {
            const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending;
            const isTargetAndPending = s.targetNurse?._id === user?._id && s.status === 'pending';
            return (
              <div key={s._id} className="swap-card" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    {/* Requester → Target */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                          {(s.requester?.name || 'N')[0]}
                        </div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.requester?.name}</span>
                      </div>
                      <span className="arrow-icon">⇄</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                          {(s.targetNurse?.name || 'N')[0]}
                        </div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.targetNurse?.name}</span>
                      </div>
                    </div>
                    {/* Shift details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text2)' }}>
                      <span>📅 {s.requesterShiftDate}</span>
                      <span className="shift-pill">{s.requesterShift}</span>
                      <span style={{ color: 'var(--text3)' }}>→</span>
                      <span>📅 {s.targetShiftDate}</span>
                      <span className="shift-pill" style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', borderColor: 'rgba(6,182,212,0.3)' }}>{s.targetShift}</span>
                    </div>
                  </div>
                  {/* Status & actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
                      {cfg.label}
                    </span>
                    {s.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleRespond(s._id, 'approved')}>✓ Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRespond(s._id, 'rejected')}>✕ Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
