import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useToastMessage from '../../hooks/useToastMessage';
import SearchableSelect from '../../components/SearchableSelect';
import * as Ic from '../../components/icons';

const STATUS_CFG = {
  open:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  matched: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  border: 'rgba(6,182,212,0.2)'  },
  closed:  { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' },
};

export default function TransferPage() {
  const [transfers, setTransfers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [wards, setWards] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [tab, setTab] = useState('my');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ currentHospital:'', currentWard:'', desiredHospital:'', desiredWard:'', transferTimeframe:'', reason:'' });
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [submitting, setSubmitting] = useState(false);
  useToastMessage(msg);
  const { user } = useAuth();

  const fetchTransfers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [myRes, matchRes] = await Promise.all([API.get('/transfers/my'), API.get('/transfers/matches')]);
      setTransfers(myRes.data); setMatches(matchRes.data);
    } catch { setTransfers([]); setMatches([]); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTransfers();
    API.get('/wards').then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    API.get('/hospitals').then(r => setHospitals(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [fetchTransfers]);

  useEffect(() => {
    if (user) {
      setForm(prev => ({ ...prev, currentHospital: user.hospital || '', currentWard: user.ward || '' }));
    }
  }, [user]);

  useEffect(() => {
    let socket;
    import('../../utils/socketClient').then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      socket.on('transfer:updated', () => fetchTransfers(true));
    });
    return () => { if (socket) socket.off('transfer:updated'); };
  }, [fetchTransfers]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.desiredHospital || !form.desiredWard || !form.transferTimeframe) {
      setMsg({ type:'error', text:'Mandatory fields missing.' }); return;
    }
    setSubmitting(true);
    try {
      await API.post('/transfers', form);
      setMsg({ type:'success', text:'Transfer request initiated.' });
      fetchTransfers(); setTab('my'); setShowForm(false);
    } catch (err) { setMsg({ type:'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="transfer-page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .route-card {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 20px;
           padding: 24px;
           margin-bottom: 16px;
           transition: all 0.3s ease;
           position: relative;
           overflow: hidden;
        }
        .route-card:hover {
           transform: translateY(-4px);
           border-color: var(--primary-light);
           box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        .route-visual {
           display: flex;
           align-items: center;
           gap: 24px;
           background: var(--bg2);
           padding: 20px;
           border-radius: 16px;
           margin: 16px 0;
           border: 1px solid var(--border);
        }
        .hosp-point {
           flex: 1;
        }
        .point-label {
           font-size: 0.65rem;
           font-weight: 800;
           text-transform: uppercase;
           color: var(--text3);
           margin-bottom: 4px;
        }
        .point-name {
           font-size: 0.95rem;
           font-weight: 700;
           color: var(--text);
        }
        .point-sub {
           font-size: 0.75rem;
           color: var(--info);
        }
        .route-line {
           flex: 0 0 40px;
           height: 2px;
           background: linear-gradient(90deg, var(--primary), var(--info));
           position: relative;
        }
        .route-line::after {
           content: '';
           position: absolute;
           right: -4px;
           top: -4px;
           width: 10px;
           height: 10px;
           border-radius: 50%;
           background: var(--info);
           box-shadow: 0 0 10px var(--info);
        }
        
        .match-glow {
           border-color: var(--info) !important;
           background: rgba(6,182,212,0.03) !important;
        }
        .match-glow::before {
           content: 'MATCH FOUND';
           position: absolute;
           top: 0;
           right: 0;
           background: var(--info);
           color: #fff;
           font-size: 0.6rem;
           font-weight: 900;
           padding: 4px 12px;
           border-radius: 0 0 0 12px;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Ic.Transfer size={24} />
            </div>
            Hospital Transfer Portal
          </div>
          <div className="page-subtitle">Coordinate inter-hospital mobility and mutual staffing exchanges</div>
        </div>
        <button className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`} style={{ borderRadius: 14 }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel Request' : '+ Initiate Request'}
        </button>
      </div>

      {showForm ? (
        <div className="form-card-premium" style={{ animation: 'fadeInUp 0.4s ease', maxWidth: 900, margin: '0 auto 40px' }}>
           <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 24 }}>New Transfer Intent</h3>
           <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                 <div className="form-group">
                    <label className="form-label">Current Deployment</label>
                    <SearchableSelect
                      options={hospitals.map(h => ({ value: h.name, label: h.name }))}
                      value={form.currentHospital}
                      onChange={val => setForm({...form, currentHospital: val})}
                      placeholder="Current Hospital"
                    />
                 </div>
                 <div className="form-group" style={{ marginTop: 24 }}>
                    <SearchableSelect
                      options={wards.map(w => ({ value: w.name, label: w.name }))}
                      value={form.currentWard}
                      onChange={val => setForm({...form, currentWard: val})}
                      placeholder="Current Ward"
                    />
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                 <div className="form-group">
                    <label className="form-label">Desired Destination</label>
                    <SearchableSelect
                      options={hospitals.map(h => ({ value: h.name, label: h.name }))}
                      value={form.desiredHospital}
                      onChange={val => setForm({...form, desiredHospital: val})}
                      placeholder="Target Hospital"
                    />
                 </div>
                 <div className="form-group" style={{ marginTop: 24 }}>
                    <SearchableSelect
                      options={wards.map(w => ({ value: w.name, label: w.name }))}
                      value={form.desiredWard}
                      onChange={val => setForm({...form, desiredWard: val})}
                      placeholder="Target Ward"
                    />
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                 <div className="form-group">
                    <label className="form-label">Target Timeframe</label>
                    <input className="form-input" type="month" value={form.transferTimeframe} onChange={e => setForm({...form, transferTimeframe: e.target.value})} style={{ background: 'var(--bg2)', height: 44 }} />
                 </div>
                 <div className="form-group">
                    <label className="form-label">Reasoning</label>
                    <input className="form-input" placeholder="Optional context..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} style={{ background: 'var(--bg2)', height: 44 }} />
                 </div>
              </div>

              <button className="btn btn-primary" style={{ padding: '14px', borderRadius: 14, fontWeight: 700 }} type="submit" disabled={submitting}>
                 {submitting ? 'Posting Intent...' : 'Broadcast Transfer Intent'}
              </button>
           </form>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            {[
              { id: 'my', label: 'Registered Intents', count: transfers.length },
              { id: 'matches', label: 'Mutual Matches', count: matches.length, highlight: true }
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: tab === t.id ? (t.highlight ? 'var(--info)' : 'var(--primary)') : 'var(--bg2)',
                  color: tab === t.id ? '#fff' : 'var(--text3)',
                  borderColor: tab === t.id ? 'transparent' : 'var(--border)',
                  boxShadow: tab === t.id ? `0 8px 20px ${t.highlight ? 'var(--info-glow)' : 'var(--primary-glow)'}` : 'none'
                }}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {loading ? (
             <div style={{ display: 'grid', gap: 16 }}>
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 180, borderRadius: 20 }} />)}
             </div>
          ) : (tab === 'my' ? (
            transfers.length === 0 ? (
               <div className="empty-state">
                  <Ic.Transfer size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
                  <div className="empty-state-text">No active transfer requests</div>
               </div>
            ) : (
               <div className="route-list">
                  {transfers.map(t => {
                     const cfg = STATUS_CFG[t.status] || STATUS_CFG.open;
                     return (
                        <div key={t._id} className="route-card">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <div style={{ padding: '4px 12px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 8, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                 {t.status}
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Target: {t.transferTimeframe}</span>
                           </div>

                           <div className="route-visual">
                              <div className="hosp-point">
                                 <div className="point-label">Origin</div>
                                 <div className="point-name">{t.currentHospital}</div>
                                 <div className="point-sub">{t.currentWard}</div>
                              </div>
                              <div className="route-line" />
                              <div className="hosp-point">
                                 <div className="point-label">Destination</div>
                                 <div className="point-name">{t.desiredHospital}</div>
                                 <div className="point-sub">{t.desiredWard}</div>
                              </div>
                           </div>
                           
                           {t.reason && <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontStyle: 'italic', marginTop: 12 }}>"{t.reason}"</div>}
                        </div>
                     )
                  })}
               </div>
            )
          ) : (
            matches.length === 0 ? (
               <div className="empty-state">
                  <Ic.Search size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
                  <div className="empty-state-text">Patiently monitoring for mutual matches...</div>
               </div>
            ) : (
               <div className="route-list">
                  {matches.map(m => (
                     <div key={m._id} className="route-card match-glow">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                           <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                              {(m.requester?.name || 'N')[0]}
                           </div>
                           <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{m.requester?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Potential Transfer Exchange</div>
                           </div>
                        </div>

                        <div className="route-visual">
                           <div className="hosp-point">
                              <div className="point-label">Their Current</div>
                              <div className="point-name">{m.currentHospital}</div>
                              <div className="point-sub">{m.currentWard}</div>
                           </div>
                           <div className="route-line" />
                           <div className="hosp-point">
                              <div className="point-label">Their Goal</div>
                              <div className="point-name">{m.desiredHospital}</div>
                              <div className="point-sub">{m.desiredWard}</div>
                           </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                           <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Synchronized Timeframe: {m.transferTimeframe}</span>
                           <button className="btn btn-primary btn-sm">Contact Nurse</button>
                        </div>
                     </div>
                  ))}
               </div>
            )
          ))}
        </>
      )}
    </div>
  );
}

