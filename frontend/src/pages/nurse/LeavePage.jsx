import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import useToastMessage from '../../hooks/useToastMessage';
import * as Ic from '../../components/icons';

const TYPES = ['annual','sick','casual','overtime_comp'];
const STATUS_CFG = {
  pending:  { color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' },
  approved: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  rejected: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.2)'  },
};
const TYPE_META = { 
  annual: { icon: <Ic.Calendar size={18} />, color: '#60a5fa' },
  sick: { icon: <Ic.User size={18} />, color: '#f43f5e' },
  casual: { icon: <Ic.Clock size={18} />, color: '#10b981' },
  overtime_comp: { icon: <Ic.Transfer size={18} />, color: '#fb923c' }
};

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
    if (!form.startDate || !form.endDate) { setMsg({ type:'error', text:'Selection of dates is mandatory.' }); return; }
    if (new Date(form.startDate) > new Date(form.endDate)) { setMsg({ type:'error', text:'Invalid date sequence.' }); return; }
    setSubmitting(true);
    try {
      await API.post('/leave', form);
      setMsg({ type:'success', text:'Application recorded. Awaiting clinical head approval.' });
      setForm({ leaveType:'annual', startDate:'', endDate:'', reason:'' });
      fetchLeaves(); setTab('my');
    } catch (err) { setMsg({ type:'error', text: err.response?.data?.message || 'Submission failed.' }); }
    finally { setSubmitting(false); }
  };

  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const totalDays = approvedLeaves.reduce((sum, l) => {
    return sum + (Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1);
  }, 0);

  return (
    <div className="leave-page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .allowance-dashboard {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
           gap: 20px;
           margin-bottom: 32px;
        }
        .allowance-card {
           background: linear-gradient(135deg, var(--bg3), var(--bg4));
           border: 1px solid var(--border);
           border-radius: 24px;
           padding: 24px;
           position: relative;
           overflow: hidden;
           backdrop-filter: blur(20px);
        }
        .allowance-progress {
           margin-top: 16px;
           height: 8px;
           background: var(--bg);
           border-radius: 4px;
           overflow: hidden;
        }
        .progress-bar {
           height: 100%;
           border-radius: 4px;
           transition: width 1s ease-in-out;
        }
        
        .leave-item-card {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 20px;
           padding: 24px;
           margin-bottom: 16px;
           display: flex;
           align-items: center;
           gap: 20px;
           transition: all 0.3s ease;
        }
        .leave-item-card:hover {
           transform: translateX(8px);
           border-color: var(--primary-light);
           background: var(--surface-raised);
        }
        
        .type-chip {
           padding: 8px 16px;
           border-radius: 12px;
           border: 1px solid var(--border);
           background: var(--bg3);
           color: var(--text3);
           display: flex;
           align-items: center;
           gap: 8px;
           cursor: pointer;
           transition: all 0.2s;
           font-weight: 700;
           font-size: 0.85rem;
        }
        .type-chip.active {
           background: var(--primary);
           color: #fff;
           border-color: var(--primary);
           box-shadow: 0 4px 15px var(--primary-glow);
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Ic.Transfer size={24} />
            </div>
            Time Off & Leave Management
          </div>
          <div className="page-subtitle">Personal attendance tracking and clinical leave coordination</div>
        </div>
        
        <div className="tab-group" style={{ background: 'var(--bg2)', padding: 4, borderRadius: 14, border: '1px solid var(--border)' }}>
          <button className={`btn btn-sm ${tab === 'my' ? 'btn-primary' : ''}`} style={{ borderRadius: 10 }} onClick={() => setTab('my')}>Historical Record</button>
          <button className={`btn btn-sm ${tab === 'apply' ? 'btn-primary' : ''}`} style={{ borderRadius: 10 }} onClick={() => setTab('apply')}>+ Apply Leave</button>
        </div>
      </div>

      <div className="allowance-dashboard">
         <div className="allowance-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Annual Utilization</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{totalDays} <span style={{ fontSize: '0.9rem', color: 'var(--text3)', fontWeight: 600 }}>/ 24 days used</span></div>
               </div>
               <div style={{ padding: 10, background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', borderRadius: 12 }}><Ic.Calendar size={24}/></div>
            </div>
            <div className="allowance-progress">
               <div className="progress-bar" style={{ width: `${(totalDays/24)*100}%`, background: 'var(--primary)' }} />
            </div>
         </div>
         
         <div className="allowance-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Pending Approvals</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fb923c', marginTop: 4 }}>{leaves.filter(l => l.status === 'pending').length}</div>
               </div>
               <div style={{ padding: 10, background: 'rgba(251,146,60,0.1)', color: '#fb923c', borderRadius: 12 }}><Ic.Clock size={24}/></div>
            </div>
            <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text3)' }}>Awaiting Human Resources review</div>
         </div>
      </div>

      {tab === 'apply' ? (
        <div className="form-card-premium" style={{ animation: 'fadeInUp 0.4s ease', maxWidth: 800, margin: '0 auto 40px' }}>
           <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24 }}>New Leave Application</h3>
           <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
              <div className="form-group">
                 <label className="form-label" style={{ fontWeight: 700 }}>Leave Category</label>
                 <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {TYPES.map(t => (
                       <div key={t} className={`type-chip ${form.leaveType === t ? 'active' : ''}`} onClick={() => setForm({...form, leaveType: t})}>
                          {TYPE_META[t].icon}
                          {t.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
                       </div>
                    ))}
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                 <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Effective From</label>
                    <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={{ background: 'var(--bg2)', height: 44 }} />
                 </div>
                 <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Effective To</label>
                    <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={{ background: 'var(--bg2)', height: 44 }} />
                 </div>
              </div>

              <div className="form-group">
                 <label className="form-label" style={{ fontWeight: 700 }}>Supportive Context / Reason</label>
                 <textarea className="form-input" placeholder="Detail the necessity for this leave..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} style={{ background: 'var(--bg2)', minHeight: 120, paddingTop: 12 }} />
              </div>

              <button className="btn btn-primary" style={{ padding: '14px', borderRadius: 14, fontWeight: 700 }} type="submit" disabled={submitting}>
                 {submitting ? 'Recording Application...' : 'Broadcast Leave Application'}
              </button>
           </form>
        </div>
      ) : (
        loading ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 100, borderRadius: 20 }} />)}
           </div>
        ) : leaves.length === 0 ? (
           <div className="empty-state">
              <Ic.Transfer size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
              <div className="empty-state-text">No attendance variations recorded</div>
           </div>
        ) : (
           <div className="leave-feed">
             {leaves.map(l => {
                const cfg = STATUS_CFG[l.status] || STATUS_CFG.pending;
                const meta = TYPE_META[l.leaveType] || TYPE_META.annual;
                const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1;
                
                return (
                   <div key={l._id} className="leave-item-card">
                      <div style={{ width: 50, height: 50, borderRadius: 14, background: meta.color + '15', color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {meta.icon}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>{l.leaveType.replace('_',' ')} Application</span>
                            <div style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '2px 10px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                               {l.status}
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text3)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Calendar size={14} /> {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Clock size={14} /> {days} Unit Days</span>
                         </div>
                      </div>

                      {l.reviewedBy && (
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Reviewed By</div>
                           <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{l.reviewedBy.name}</div>
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

