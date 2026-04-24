import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useToastMessage from '../../hooks/useToastMessage';

const STATUS_CFG = {
  open:    { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  matched: { color: '#22d3ee', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.3)'  },
  closed:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
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
      setForm(prev => ({
        ...prev,
        currentHospital: user.hospital || '',
        currentWard: user.ward || ''
      }));
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
      setMsg({ type:'error', text:'Please fill all required fields.' }); return;
    }
    setSubmitting(true);
    try {
      await API.post('/transfers', form);
      setMsg({ type:'success', text:'Transfer request posted!' });
      fetchTransfers(); setTab('my'); setShowForm(false);
    } catch (err) { setMsg({ type:'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .transfer-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 24px;
          backdrop-filter: blur(12px);
          transition: all 0.2s;
        }
        .transfer-card:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
        .match-card {
          background: rgba(6,182,212,0.06);
          border: 1px solid rgba(6,182,212,0.2);
          border-radius: 14px;
          padding: 20px 24px;
          backdrop-filter: blur(12px);
          transition: all 0.2s;
        }
        .match-card:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
        .hosp-arrow { font-size: 1.4rem; color: var(--text3); }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">🚀 Inter-Hospital Transfer</div>
          <div className="page-subtitle">Request transfers and find mutual matches</div>
        </div>
        <button className={`btn ${showForm ? 'btn-outline' : 'btn-primary'} btn-sm`} onClick={() => setShowForm(p => !p)}>
          {showForm ? '✕ Hide Form' : '+ New Request'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'My Requests', value: transfers.length, color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', icon: '🚀' },
          { label: 'Matches Found', value: matches.length, color: '#22d3ee', bg: 'rgba(6,182,212,0.12)', icon: '🎯' },
          { label: 'Open', value: transfers.filter(t => t.status === 'open').length, color: '#34d399', bg: 'rgba(16,185,129,0.12)', icon: '🟢' },
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

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', backdropFilter: 'blur(12px)', marginBottom: 24 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>🚀 Post Transfer Request</div>
          <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#60a5fa' }}>
            ℹ️ Your current hospital/ward are pre-filled. Fill desired location to get matched.
          </div>
          {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Current Hospital *</label>
                <select className="form-select" name="currentHospital" value={form.currentHospital} onChange={e => setForm({...form, currentHospital: e.target.value})}>
                  <option value="">Select hospital</option>
                  {hospitals.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
                  {!hospitals.some(h => h.name === form.currentHospital) && form.currentHospital && (
                    <option value={form.currentHospital}>{form.currentHospital}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Current Ward *</label>
                <select className="form-select" name="currentWard" value={form.currentWard} onChange={e => setForm({...form, currentWard: e.target.value})}>
                  <option value="">Select ward</option>
                  {wards.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
                  {!wards.some(w => w.name === form.currentWard) && form.currentWard && (
                    <option value={form.currentWard}>{form.currentWard}</option>
                  )}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Desired Hospital *</label>
                <select className="form-select" name="desiredHospital" value={form.desiredHospital} onChange={e => setForm({...form, desiredHospital: e.target.value})}>
                  <option value="">Select hospital</option>
                  {hospitals.map(h => <option key={`d-${h._id}`} value={h.name}>{h.name}</option>)}
                </select>
              </div>
            <div className="form-group">
              <label className="form-label">Desired Ward *</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                gap: 10,
                marginTop: 8
              }}>
                {wards.map(w => {
                  const active = form.desiredWard === w.name;
                  return (
                    <div 
                      key={`d-${w._id}`}
                      onClick={() => setForm(f => ({ ...f, desiredWard: w.name }))}
                      style={{
                        background: active ? 'rgba(37,99,235,0.12)' : 'rgba(8,15,30,0.5)',
                        border: `1.5px solid ${active ? '#3b82f6' : 'rgba(148,163,184,0.1)'}`,
                        borderRadius: 12,
                        padding: '12px 10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                        boxShadow: active ? '0 4px 12px rgba(37,99,235,0.15)' : 'none',
                        transform: active ? 'translateY(-2px)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>🏥</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: active ? '#fff' : '#e8edf5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                      <div style={{ fontSize: '0.65rem', color: active ? '#93c5fd' : 'rgba(148,163,184,0.4)', fontWeight: 600 }}>{w.userCount || 0} Nurses</div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Timeframe *</label>
                <input className="form-input" type="month" name="transferTimeframe" value={form.transferTimeframe} onChange={e => setForm({...form, transferTimeframe: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Reason (optional)</label>
                <input className="form-input" name="reason" placeholder="Short reason…" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Posting…' : '→ Post Request'}</button>
          </form>
        </div>
      )}

      <div className="tabs">
        <button className={`tab-btn ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>My Requests ({transfers.length})</button>
        <button className={`tab-btn ${tab === 'matches' ? 'active' : ''}`} onClick={() => setTab('matches')}>
          🎯 Matches ({matches.length})
        </button>
      </div>

      {tab === 'my' && (loading ? (
        <div className="loading-center" style={{ flexDirection:'column', gap:16 }}>
          <div className="spinner" style={{ margin:0 }} />
        </div>
      ) : transfers.length === 0 ? (
        <div className="empty-state" style={{ padding:'70px 20px' }}>
          <div className="empty-state-icon">🚀</div>
          <div className="empty-state-text" style={{ fontWeight:600 }}>No transfer requests yet</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop:20 }} onClick={() => setShowForm(true)}>+ Post Request</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {transfers.map(t => {
            const cfg = STATUS_CFG[t.status] || STATUS_CFG.open;
            return (
              <div key={t._id} className="transfer-card" style={{ borderLeft:`3px solid ${cfg.color}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontSize:'0.8rem', color:'var(--text3)', marginBottom:2 }}>From</div>
                      <div style={{ fontWeight:700, color:'var(--text)' }}>{t.currentHospital}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--text2)' }}>{t.currentWard}</div>
                    </div>
                    <span className="hosp-arrow">→</span>
                    <div>
                      <div style={{ fontSize:'0.8rem', color:'var(--text3)', marginBottom:2 }}>To</div>
                      <div style={{ fontWeight:700, color:'var(--text)' }}>{t.desiredHospital}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--text2)' }}>{t.desiredWard}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                    <span style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, padding:'4px 12px', borderRadius:999, fontSize:'0.75rem', fontWeight:700, textTransform:'capitalize' }}>{t.status}</span>
                    <span style={{ fontSize:'0.78rem', color:'var(--text3)' }}>📅 {t.transferTimeframe}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {tab === 'matches' && (matches.length === 0 ? (
        <div className="empty-state" style={{ padding:'70px 20px' }}>
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text" style={{ fontWeight:600 }}>No mutual matches yet</div>
          <div style={{ color:'var(--text3)', fontSize:'0.875rem', marginTop:8 }}>Post a transfer request to get matched</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {matches.map(m => (
            <div key={m._id} className="match-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#06b6d4,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:700, color:'#fff' }}>
                    {(m.requester?.name || 'N')[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{m.requester?.name}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text2)' }}>{m.currentHospital} → {m.desiredHospital}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text3)' }}>{m.currentWard} → {m.desiredWard}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ background:'rgba(6,182,212,0.15)', color:'#22d3ee', border:'1px solid rgba(6,182,212,0.3)', padding:'4px 12px', borderRadius:999, fontSize:'0.75rem', fontWeight:700 }}>🎯 Match</span>
                  <div style={{ fontSize:'0.78rem', color:'var(--text3)', marginTop:4 }}>📅 {m.transferTimeframe}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
