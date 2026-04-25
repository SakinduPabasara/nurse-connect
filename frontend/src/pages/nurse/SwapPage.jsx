import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useToastMessage from '../../hooks/useToastMessage';
import { notify } from '../../utils/toast';
import * as Ic from '../../components/icons';

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
      setMsg({ type: 'success', text: 'Swap request initiated successfully!' });
      setForm({ targetNurse:'', requesterShiftDate:'', requesterShift:'7AM-1PM', targetShiftDate:'', targetShift:'7AM-1PM', reason:'' });
      fetchSwaps(); setTab('list');
    } catch (err) { setMsg({ type:'error', text: err.response?.data?.message || 'Submission failed.' }); }
    finally { setSubmitting(false); }
  };

  const handleRespond = async (id, status) => {
    try { await API.put(`/swap/${id}`, { status }); fetchSwaps(); notify.success(`Swap request ${status}.`); }
    catch (err) { notify.error(err.response?.data?.message || 'Action failed.'); }
  };

  const pending = swaps.filter(s => s.status === 'pending').length;

  return (
    <div className="swap-page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .exchange-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 20px;
          backdrop-filter: blur(20px);
          position: relative;
          transition: all 0.3s ease;
        }
        .exchange-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary-light);
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }
        .exchange-flow {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-top: 20px;
          padding: 16px;
          background: var(--bg2);
          border-radius: 16px;
          border: 1px solid var(--border);
        }
        .staff-info-mini {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mini-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg3);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--text);
        }
        .swap-arrow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--primary);
          box-shadow: 0 0 15px var(--primary-glow);
          flex-shrink: 0;
        }
        
        .form-card-premium {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 32px;
          max-width: 800px;
          margin: 0 auto;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #fb923c, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Ic.Transfer size={24} />
            </div>
            Duty Exchange Requests
          </div>
          <div className="page-subtitle">Facilitating colleague-to-colleague shift swaps and operational flexibility</div>
        </div>
        
        <div className="tab-group" style={{ background: 'var(--bg2)', padding: 4, borderRadius: 14, border: '1px solid var(--border)' }}>
          <button className={`btn btn-sm ${tab === 'list' ? 'btn-primary' : ''}`} style={{ borderRadius: 10 }} onClick={() => setTab('list')}>Active Requests</button>
          <button className={`btn btn-sm ${tab === 'new' ? 'btn-primary' : ''}`} style={{ borderRadius: 10 }} onClick={() => setTab('new')}>+ Create New</button>
        </div>
      </div>

      {tab === 'list' ? (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ height: 160, borderRadius: 20 }} />
            ))}
          </div>
        ) : swaps.length === 0 ? (
          <div className="empty-state">
            <Ic.Transfer size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
            <div className="empty-state-text">No shift swap activity recorded</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => setTab('new')}>Initiate First Exchange</button>
          </div>
        ) : (
          <div className="swap-feed">
            {swaps.map(s => {
              const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending;
              const isTargetNurse = s.targetNurse?._id === user?._id;
              
              return (
                <div key={s._id} className="exchange-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                       <div style={{ padding: '4px 12px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 8, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          {s.status}
                       </div>
                       <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Requested {new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {s.status === 'pending' && isTargetNurse && (
                       <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleRespond(s._id, 'approved')}>✓ Accept</button>
                          <button className="btn btn-outline btn-sm" style={{ color: '#f87171', borderColor: '#f87171' }} onClick={() => handleRespond(s._id, 'rejected')}>✕ Decline</button>
                       </div>
                    )}
                  </div>

                  <div className="exchange-flow">
                    <div className="staff-info-mini">
                       <div className="mini-avatar">{(s.requester?.name || 'N')[0]}</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.requester?.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Offering: {s.requesterShiftDate} ({s.requesterShift})</div>
                       </div>
                    </div>
                    
                    <div className="swap-arrow">
                       <Ic.ArrowRight size={20} />
                    </div>

                    <div className="staff-info-mini">
                       <div className="mini-avatar">{(s.targetNurse?.name || 'N')[0]}</div>
                       <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.targetNurse?.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Target: {s.targetShiftDate} ({s.targetShift})</div>
                       </div>
                    </div>
                  </div>

                  {s.reason && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 12, fontSize: '0.85rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                       "{s.reason}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="form-card-premium" style={{ animation: 'fadeInUp 0.4s ease' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
             <Ic.Transfer size={24} color="var(--primary)" />
             New Exchange Request
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Target Colleague Personnel ID</label>
              <div style={{ position: 'relative' }}>
                <Ic.User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input className="form-input" style={{ paddingLeft: 44, background: 'var(--bg2)' }} name="targetNurse" placeholder="Paste the nurse object ID from Ward Roster..." value={form.targetNurse} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
               <div className="form-group">
                 <label className="form-label" style={{ fontWeight: 700 }}>Your Shift Date</label>
                 <input className="form-input" type="date" style={{ background: 'var(--bg2)' }} name="requesterShiftDate" value={form.requesterShiftDate} onChange={handleChange} />
               </div>
               <div className="form-group">
                 <label className="form-label" style={{ fontWeight: 700 }}>Your Shift Period</label>
                 <select className="form-select" style={{ background: 'var(--bg2)' }} name="requesterShift" value={form.requesterShift} onChange={handleChange}>
                   {SHIFTS.map(s => <option key={s}>{s}</option>)}
                 </select>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
               <div className="form-group">
                 <label className="form-label" style={{ fontWeight: 700 }}>Target Shift Date</label>
                 <input className="form-input" type="date" style={{ background: 'var(--bg2)' }} name="targetShiftDate" value={form.targetShiftDate} onChange={handleChange} />
               </div>
               <div className="form-group">
                 <label className="form-label" style={{ fontWeight: 700 }}>Target Shift Period</label>
                 <select className="form-select" style={{ background: 'var(--bg2)' }} name="targetShift" value={form.targetShift} onChange={handleChange}>
                   {SHIFTS.map(s => <option key={s}>{s}</option>)}
                 </select>
               </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Context / Reason</label>
              <textarea className="form-input" style={{ background: 'var(--bg2)', minHeight: 100, paddingTop: 12 }} name="reason" placeholder="Explain the context to your colleague..." value={form.reason} onChange={handleChange} />
            </div>

            <button className="btn btn-primary" style={{ padding: '14px', borderRadius: 14, fontWeight: 700 }} type="submit" disabled={submitting}>
              {submitting ? 'Processing Submission...' : 'Initiate Exchange Request'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

