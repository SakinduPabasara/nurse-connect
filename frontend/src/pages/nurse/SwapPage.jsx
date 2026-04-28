import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useToastMessage from '../../hooks/useToastMessage';
import { notify } from '../../utils/toast';
import * as Ic from '../../components/icons';

const STATUS_CFG = {
  pending:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  label: 'Pending'  },
  approved: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)',  label: 'Approved' },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   label: 'Rejected' },
};
const SHIFTS = ['7AM-1PM', '1PM-7PM', '7AM-7PM', '7PM-7AM'];

export default function SwapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [swaps, setSwaps]           = useState([]);
  const [nurses, setNurses]         = useState([]);
  const [myRoster, setMyRoster]     = useState([]);       // logged-in nurse's upcoming shifts
  const [targetRoster, setTargetRoster] = useState([]);   // selected target nurse's upcoming shifts
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('list');
  // form: myShiftId is the _id of the selected roster entry; targetShiftId is the target's entry _id
  const [form, setForm]             = useState({ targetNurse: '', myShiftId: '', targetShiftId: '', reason: '' });
  const [submitting, setSubmitting]  = useState(false);
  const [msg, setMsg]               = useState({ type: '', text: '' });
  useToastMessage(msg);
  const { user } = useAuth();

  const fetchSwaps = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const { data } = await API.get('/swap/my'); setSwaps(data); }
    catch { setSwaps([]); } finally { if (!silent) setLoading(false); }
  }, []);

  const fetchNurses = useCallback(async () => {
    try { const { data } = await API.get('/auth/nurses'); setNurses(data); }
    catch { setNurses([]); }
  }, []);

  const fetchMyRoster = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await API.get('/roster/my');
      // Only upcoming shifts
      setMyRoster(Array.isArray(data) ? data.filter(s => s.date >= today) : []);
    } catch { setMyRoster([]); }
  }, []);

  useEffect(() => { 
    fetchSwaps();
    fetchNurses();
    fetchMyRoster();
  }, [fetchSwaps, fetchNurses, fetchMyRoster]);

  // Read navigation state from My Roster page — auto-open new tab with pre-filled data
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    if (state.autoTab === 'new') {
      setTab('new');
    }
    if (state.prefill) {
      // We prefill by finding the matching roster entry by date+shift
      // myRoster may not be loaded yet, so store the prefill intent and handle in the myRoster effect
      window.__swapPrefill = state.prefill;
    }
    // Clear the state from history so back-navigation doesn't re-trigger this
    navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Once myRoster is loaded, apply any pending prefill from navigation state
  useEffect(() => {
    if (!window.__swapPrefill || myRoster.length === 0) return;
    const { requesterShiftDate, requesterShift } = window.__swapPrefill;
    const match = myRoster.find(s => s.date === requesterShiftDate && s.shift === requesterShift);
    if (match) {
      setForm(prev => ({ ...prev, myShiftId: match._id }));
    }
    window.__swapPrefill = null;
  }, [myRoster]);

  // Fetch target nurse's roster when targetNurse changes
  useEffect(() => {
    if (!form.targetNurse) { setTargetRoster([]); return; }
    setLoadingTarget(true);
    setForm(prev => ({ ...prev, targetShiftId: '' }));
    API.get(`/roster/nurse/${form.targetNurse}`)
      .then(r => setTargetRoster(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTargetRoster([]))
      .finally(() => setLoadingTarget(false));
  }, [form.targetNurse]);

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
    if (!form.targetNurse || !form.myShiftId || !form.targetShiftId) {
      setMsg({ type: 'error', text: 'Please select your shift and the target nurse shift.' }); return;
    }
    // Derive the actual date/shift from selected roster entry IDs
    const myEntry     = myRoster.find(s => s._id === form.myShiftId);
    const targetEntry = targetRoster.find(s => s._id === form.targetShiftId);
    if (!myEntry || !targetEntry) {
      setMsg({ type: 'error', text: 'Invalid shift selection. Please try again.' }); return;
    }
    setSubmitting(true);
    try {
      await API.post('/swap', {
        targetNurse:       form.targetNurse,
        requesterShiftDate: myEntry.date,
        requesterShift:    myEntry.shift,
        targetShiftDate:   targetEntry.date,
        targetShift:       targetEntry.shift,
        reason:            form.reason,
      });
      setMsg({ type: 'success', text: 'Swap request initiated successfully!' });
      setForm({ targetNurse: '', myShiftId: '', targetShiftId: '', reason: '' });
      setTargetRoster([]);
      fetchSwaps(); setTab('list');
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed.' }); }
    finally { setSubmitting(false); }
  };

  const handleRespond = async (id, status) => {
    try { await API.put(`/swap/${id}`, { status }); fetchSwaps(); notify.success(`Swap request ${status}.`); }
    catch (err) { notify.error(err.response?.data?.message || 'Action failed.'); }
  };

  const pending = swaps.filter(s => s.status === 'pending').length;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div className="page-title-icon" style={{ background: 'linear-gradient(135deg, #fb923c, #f43f5e)', boxShadow: '0 8px 24px rgba(251,146,60,0.35)' }}>
              <Ic.Transfer size={22} />
            </div>
            Shift Swap Requests
          </div>
          <div className="page-subtitle">Facilitate nurse-to-nurse shift exchanges with full tracking</div>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 16, border: '1px solid var(--border)' }}>
          <button className={`chip-tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
            Active Requests
            {pending > 0 && (
              <span style={{ marginLeft: 7, background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 999, letterSpacing: '0.02em' }}>
                {pending}
              </span>
            )}
          </button>
          <button className={`chip-tab ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>+ New Request</button>
        </div>
      </div>

      {tab === 'list' ? (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ height: 160, borderRadius: 20 }} />
            ))}
          </div>
        ) : swaps.length === 0 ? (
          <div className="empty-state">
            <div style={{ color: 'var(--text4)', marginBottom: 16, display: 'flex', justifyContent: 'center', opacity: 0.3 }}><Ic.Transfer size={48} /></div>
            <div className="empty-state-text">No shift swap activity recorded</div>
            <div className="empty-state-sub">Initiate a swap request with a nurse</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => setTab('new')}>Create Request</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {swaps.map(s => {
              const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending;
              const isTargetNurse = s.targetNurse?._id === user?._id;

              return (
                <div key={s._id} style={{
                  background: 'var(--surface)',
                  border: `1px solid ${s.status === 'pending' && isTargetNurse ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                  borderRadius: 20,
                  padding: '22px 24px',
                  backdropFilter: 'blur(18px)',
                  transition: 'all 0.25s ease',
                  boxShadow: s.status === 'pending' && isTargetNurse ? '0 0 20px rgba(245,158,11,0.08)' : 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = s.status === 'pending' && isTargetNurse ? '0 0 20px rgba(245,158,11,0.08)' : 'none'; }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Ic.Clock size={11} />
                        {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {s.status === 'pending' && isTargetNurse && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleRespond(s._id, 'approved')}>
                          ✓ Accept
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                          onClick={() => handleRespond(s._id, 'rejected')}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Exchange visual */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '16px 20px' }}>
                    {/* Requester */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {(s.requester?.name || 'N')[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)' }}>{s.requester?.name}</div>
                          <div style={{ fontSize: '0.69rem', color: 'var(--text3)', marginTop: 2 }}>Requester</div>
                        </div>
                      </div>
                      <div style={{ padding: '6px 12px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, fontSize: '0.73rem', color: '#60a5fa', fontWeight: 600 }}>
                        {s.requesterShiftDate} · {s.requesterShift}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(37,99,235,0.12)', border: '2px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0, boxShadow: '0 0 16px rgba(37,99,235,0.2)' }}>
                      <Ic.ArrowRight size={18} />
                    </div>

                    {/* Target */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #fb923c, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {(s.targetNurse?.name || 'N')[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)' }}>{s.targetNurse?.name}</div>
                          <div style={{ fontSize: '0.69rem', color: 'var(--text3)', marginTop: 2 }}>Target Nurse</div>
                        </div>
                      </div>
                      <div style={{ padding: '6px 12px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8, fontSize: '0.73rem', color: '#fb923c', fontWeight: 600 }}>
                        {s.targetShiftDate} · {s.targetShift}
                      </div>
                    </div>
                  </div>

                  {s.reason && (
                    <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text3)', fontStyle: 'italic', borderLeft: '3px solid var(--border)' }}>
                      "{s.reason}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="form-card-premium" style={{ animation: 'fadeInUp 0.35s ease', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <Ic.Transfer size={20} style={{ color: 'var(--primary-light)' }} />
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>New Shift Exchange</div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>You can only swap shifts that are actually assigned to you by the admin</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>

            {/* Target Nurse */}
            <div className="form-group">
              <label className="form-label">Target Nurse (Your Ward Only)</label>
              <SearchableSelect
                options={nurses
                  .filter(n => n._id !== user?._id && n.ward === user?.ward)
                  .map(n => ({ value: n._id, label: n.name }))
                }
                value={form.targetNurse}
                onChange={val => setForm({ ...form, targetNurse: val })}
                placeholder="Select a nurse to swap with..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Your Shift — from real roster */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa' }} />
                  Your Shift
                </div>
                <div className="form-group">
                  <label className="form-label">Select Your Assigned Shift</label>
                  {myRoster.length === 0 ? (
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text3)' }}>
                      No upcoming assigned shifts found.
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      name="myShiftId"
                      value={form.myShiftId}
                      onChange={handleChange}
                    >
                      <option value="">Choose your shift to offer...</option>
                      {myRoster.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.date} · {s.shift} · {s.ward}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {/* Show selected entry details */}
                {form.myShiftId && (() => {
                  const e = myRoster.find(s => s._id === form.myShiftId);
                  return e ? (
                    <div style={{ padding: '8px 14px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, fontSize: '0.76rem', color: '#60a5fa', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontWeight: 700 }}>{e.date} — {e.shift}</span>
                      <span style={{ opacity: 0.8 }}>Ward: {e.ward}</span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Target Shift — from target nurse's real roster */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fb923c' }} />
                  Target Nurse Shift
                </div>
                <div className="form-group">
                  <label className="form-label">Select Their Assigned Shift</label>
                  {!form.targetNurse ? (
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text3)' }}>
                      Select a target nurse first.
                    </div>
                  ) : loadingTarget ? (
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text3)' }}>
                      Loading shifts...
                    </div>
                  ) : targetRoster.length === 0 ? (
                    <div style={{ padding: '12px 16px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, fontSize: '0.8rem', color: '#f87171' }}>
                      This nurse has no upcoming assigned shifts.
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      name="targetShiftId"
                      value={form.targetShiftId}
                      onChange={handleChange}
                    >
                      <option value="">Choose their shift to receive...</option>
                      {targetRoster.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.date} · {s.shift} · {s.ward}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {/* Show selected target entry details */}
                {form.targetShiftId && (() => {
                  const e = targetRoster.find(s => s._id === form.targetShiftId);
                  return e ? (
                    <div style={{ padding: '8px 14px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 10, fontSize: '0.76rem', color: '#fb923c', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontWeight: 700 }}>{e.date} — {e.shift}</span>
                      <span style={{ opacity: 0.8 }}>Ward: {e.ward}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Context / Reason</label>
              <textarea className="form-input form-textarea" style={{ minHeight: 100 }} name="reason" placeholder="Explain the reason for this swap..." value={form.reason} onChange={handleChange} />
            </div>

            <button className="btn btn-primary btn-full" style={{ padding: '14px', borderRadius: 14, fontSize: '0.92rem' }} type="submit" disabled={submitting || !form.myShiftId || !form.targetShiftId}>
              {submitting ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Processing...</>
              ) : 'Initiate Exchange Request'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
