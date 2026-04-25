import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../api/axios';
import useToastMessage from '../../hooks/useToastMessage';
import { notify } from '../../utils/toast';
import { useConfirm } from '../../context/ConfirmContext';
import * as Ic from '../../components/icons';

const OT_HOURLY_RATE = 150;

const SHIFTS = [
  { id: 'morning', icon: <Ic.Calendar size={18} />, label: 'Morning', time: '6 AM – 2 PM',  color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
  { id: 'evening', icon: <Ic.Clock size={18} />,    label: 'Evening', time: '2 PM – 10 PM', color: '#fb923c', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)'  },
  { id: 'night',   icon: <Ic.Transfer size={18} />, label: 'Night',   time: '10 PM – 6 AM', color: '#818cf8', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)'  },
  { id: 'custom',  icon: <Ic.User size={18} />,     label: 'Custom',  time: 'Other / split', color: '#94a3b8', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' },
];

const STATUS_CFG = {
  pending:  { label: 'Awaiting Review', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  approved: { label: 'Approved',       color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  rejected: { label: 'Rejected',       color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.3)'  },
};

export default function OvertimePage() {
  const confirm = useConfirm();
  const [tab, setTab] = useState('my');
  const [data, setData] = useState({ totalApprovedHours: 0, pendingCount: 0, records: [] });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], shift: 'morning', extraHours: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  useToastMessage(msg);

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
    const isConfirmed = await confirm({ title: "Withdraw Overtime Entry", message: "This action will remove the record from verification.", confirmText: "Remove Entry" });
    if (!isConfirmed) return;
    try {
      await API.delete(`/overtime/withdraw/${id}`);
      notify.success('Record removed.');
      fetchRecords();
    } catch (err) { notify.error('Failed to remove.'); }
  };

  const filtered = statusFilter === 'all' ? data.records : data.records.filter(r => r.status === statusFilter);

  return (
    <div className="overtime-page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .stats-hero {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
           gap: 20px;
           margin-bottom: 32px;
        }
        .stat-card-premium {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 24px;
           padding: 28px;
           backdrop-filter: blur(20px);
           position: relative;
           overflow: hidden;
        }
        .stat-card-premium::before {
           content: '';
           position: absolute;
           top: -50px;
           right: -50px;
           width: 150px;
           height: 150px;
           background: var(--primary-glow);
           filter: blur(80px);
           opacity: 0.3;
        }
        
        .ot-history-card {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 20px;
           padding: 24px;
           margin-bottom: 12px;
           display: flex;
           align-items: center;
           gap: 20px;
           transition: all 0.3s ease;
        }
        .ot-history-card:hover {
           transform: translateX(6px);
           border-color: var(--primary-light);
        }
        
        .shift-picker {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
           gap: 12px;
        }
        .shift-option {
           background: var(--bg2);
           border: 1px solid var(--border);
           border-radius: 16px;
           padding: 16px;
           text-align: center;
           cursor: pointer;
           transition: all 0.2s;
        }
        .shift-option.active {
           background: var(--primary-glow);
           border-color: var(--primary);
           box-shadow: 0 8px 20px rgba(37,99,235,0.2);
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Ic.Clock size={24} />
            </div>
            Occupational Overtime 
          </div>
          <div className="page-subtitle">Verify and track additional duty hours and clinical compensation</div>
        </div>
        
        <div className="tab-group" style={{ background: 'var(--bg2)', padding: 4, borderRadius: 14, border: '1px solid var(--border)' }}>
          <button className={`btn btn-sm ${tab === 'my' ? 'btn-primary' : ''}`} style={{ borderRadius: 10 }} onClick={() => setTab('my')}>Work Journals</button>
          <button className={`btn btn-sm ${tab === 'apply' ? 'btn-primary' : ''}`} style={{ borderRadius: 10 }} onClick={() => setTab('apply')}>+ Log Session</button>
        </div>
      </div>

      <div className="stats-hero">
         <div className="stat-card-premium">
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Total Verified Hours</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{data.totalApprovedHours} <span style={{ fontSize: '1rem', color: 'var(--text3)' }}>Unit Hours</span></div>
            <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Active duty cycle: April 2026</div>
         </div>
         <div className="stat-card-premium">
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Estimated Earnings</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(data.totalApprovedHours * OT_HOURLY_RATE)}</div>
            <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text3)' }}>Calculated at standard hospital base rate</div>
         </div>
      </div>

      {tab === 'apply' ? (
        <div className="form-card-premium" style={{ animation: 'fadeInUp 0.4s ease', maxWidth: 800, margin: '0 auto' }}>
           <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24 }}>Document Work Session</h3>
           <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
              <div className="form-group">
                 <label className="form-label">Shift Identification</label>
                 <div className="shift-picker">
                    {SHIFTS.map(s => (
                       <div key={s.id} className={`shift-option ${form.shift === s.id ? 'active' : ''}`} onClick={() => setForm({...form, shift: s.id})}>
                          <div style={{ color: form.shift === s.id ? 'var(--primary)' : 'var(--text3)', marginBottom: 8 }}>{s.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.label}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{s.time}</div>
                       </div>
                    ))}
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                 <div className="form-group">
                    <label className="form-label">Duty Date</label>
                    <input className="form-input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ background: 'var(--bg2)', height: 44 }} />
                 </div>
                 <div className="form-group">
                    <label className="form-label">Duration (Hours)</label>
                    <input className="form-input" type="number" step="0.5" placeholder="e.g. 4.0" value={form.extraHours} onChange={e => setForm({...form, extraHours: e.target.value})} style={{ background: 'var(--bg2)', height: 44 }} />
                 </div>
              </div>

              <div className="form-group">
                 <label className="form-label">Log Description</label>
                 <textarea className="form-input" placeholder="Justify the additional work period (e.g. Emergency support, staff shortage...)" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} style={{ background: 'var(--bg2)', minHeight: 100, paddingTop: 12 }} />
              </div>

              <button className="btn btn-primary" style={{ padding: '14px', borderRadius: 14, fontWeight: 700 }} type="submit" disabled={submitting}>
                 {submitting ? 'Recording Credentials...' : 'Broadcast Work Session'}
              </button>
           </form>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
             {['all','pending','approved','rejected'].map(f => (
                <button key={f} className={`ot-chip ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
                   {f.toUpperCase()}
                </button>
             ))}
          </div>

          {loading ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 110, borderRadius: 20 }} />)}
             </div>
          ) : filtered.length === 0 ? (
             <div className="empty-state">
                <Ic.Clock size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
                <div className="empty-state-text">No work sessions matched the criteria</div>
             </div>
          ) : (
             <div className="ot-feed">
                {filtered.map(r => {
                   const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                   const sh = SHIFTS.find(s => s.id === r.shift) || SHIFTS[3];
                   return (
                      <div key={r._id} className="ot-history-card">
                         <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sh.icon}
                         </div>
                         
                         <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                               <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                               <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '2px 10px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>{cfg.label}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 12 }}>
                               <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Clock size={14}/> {sh.label} Block</span>
                               <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Transfer size={14}/> {r.extraHours} Clinical Hours</span>
                            </div>
                         </div>

                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Earnings</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: r.status === 'approved' ? '#10b981' : 'var(--text3)' }}>
                               {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(r.approvedAmount || (r.extraHours * OT_HOURLY_RATE))}
                            </div>
                         </div>
                         
                         {r.status === 'pending' && (
                            <button className="btn btn-ghost" onClick={() => handleWithdraw(r._id)} style={{ color: '#f43f5e' }}>✕</button>
                         )}
                      </div>
                   )
                })}
             </div>
          )}
        </>
      )}
    </div>
  );
}

