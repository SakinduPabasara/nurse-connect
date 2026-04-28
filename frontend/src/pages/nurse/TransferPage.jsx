import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useToastMessage from '../../hooks/useToastMessage';
import SearchableSelect from '../../components/SearchableSelect';
import * as Ic from '../../components/icons';

const STATUS_CFG = {
  open:    { color: '#34d399', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.25)',   label: 'Open'    },
  matched: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',   border: 'rgba(34,211,238,0.25)',   label: 'Matched' },
  closed:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)',  label: 'Closed'  },
};

export default function TransferPage() {
  const [transfers, setTransfers]   = useState([]);
  const [matches, setMatches]       = useState([]);
  const [wards, setWards]           = useState([]);
  const [hospitals, setHospitals]   = useState([]);
  const [tab, setTab]               = useState('my');
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState({ currentHospital: '', currentWard: '', desiredHospital: '', desiredWard: '', transferTimeframe: '', reason: '' });
  const [msg, setMsg]               = useState({ type: '', text: '' });
  const [submitting, setSubmitting]  = useState(false);
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

  const currentWards = useMemo(() => {
    if (!form.currentHospital) return [];
    return wards.filter(w => w.hospital === form.currentHospital);
  }, [wards, form.currentHospital]);

  const desiredWards = useMemo(() => {
    if (!form.desiredHospital) return [];
    return wards.filter(w => w.hospital === form.desiredHospital);
  }, [wards, form.desiredHospital]);

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
      setMsg({ type: 'error', text: 'Mandatory fields missing.' }); return;
    }
    setSubmitting(true);
    try {
      await API.post('/transfers', form);
      setMsg({ type: 'success', text: 'Transfer request initiated.' });
      fetchTransfers(); setTab('my'); setShowForm(false);
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setSubmitting(false); }
  };

  const activeList = tab === 'my' ? transfers : matches;

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div className="page-title-icon" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}>
              <Ic.Transfer size={22} />
            </div>
            Hospital Transfer Portal
          </div>
          <div className="page-subtitle">Coordinate inter-hospital mobility and mutual staffing exchanges</div>
        </div>

        <button
          className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
          style={{ borderRadius: 14, padding: '10px 22px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Initiate Request'}
        </button>
      </div>

      {/* ── Form ── */}
      {showForm ? (
        <div className="form-card-premium" style={{ animation: 'fadeInUp 0.35s ease', maxWidth: 900, margin: '0 auto 36px' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>New Transfer Intent</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Register your inter-hospital mobility preference for HR matching</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>

            {/* Current deployment */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa' }} />
                Current Deployment
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Hospital</label>
                  <SearchableSelect
                    options={hospitals.map(h => ({ value: h.name, label: h.name }))}
                    value={form.currentHospital}
                    onChange={val => setForm({ ...form, currentHospital: val })}
                    placeholder="Select hospital..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Ward</label>
                  <SearchableSelect
                    options={currentWards.map(w => ({ value: w.name, label: w.name }))}
                    value={form.currentWard}
                    onChange={val => setForm({ ...form, currentWard: val })}
                    placeholder={form.currentHospital ? "Select ward..." : "Select Hospital First"}
                    disabled={!form.currentHospital}
                  />
                </div>
              </div>
            </div>

            {/* Desired destination */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22d3ee' }} />
                Desired Destination
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Target Hospital</label>
                  <SearchableSelect
                    options={hospitals.map(h => ({ value: h.name, label: h.name }))}
                    value={form.desiredHospital}
                    onChange={val => setForm({ ...form, desiredHospital: val })}
                    placeholder="Select hospital..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Ward</label>
                  <SearchableSelect
                    options={desiredWards.map(w => ({ value: w.name, label: w.name }))}
                    value={form.desiredWard}
                    onChange={val => setForm({ ...form, desiredWard: val })}
                    placeholder={form.desiredHospital ? "Select ward..." : "Select Hospital First"}
                    disabled={!form.desiredHospital}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Timeframe</label>
                <input className="form-input" type="month" value={form.transferTimeframe} onChange={e => setForm({ ...form, transferTimeframe: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Reasoning (optional)</label>
                <input className="form-input" placeholder="Optional context..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>

            <button className="btn btn-primary btn-full" style={{ padding: '14px', borderRadius: 14, fontSize: '0.92rem' }} type="submit" disabled={submitting}>
              {submitting ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Submitting...</>
              ) : 'Broadcast Transfer Intent'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { id: 'my',      label: 'Registered Intents', count: transfers.length, color: 'var(--primary)' },
              { id: 'matches', label: 'Mutual Matches',      count: matches.length,   color: '#22d3ee', highlight: true },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 24px',
                  borderRadius: 14, fontSize: '0.84rem', fontWeight: 700,
                  border: '1px solid',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.18s ease',
                  background: tab === t.id ? (t.highlight ? 'rgba(6,182,212,0.15)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))') : 'rgba(255,255,255,0.03)',
                  color: tab === t.id ? (t.highlight ? '#22d3ee' : '#fff') : 'var(--text3)',
                  borderColor: tab === t.id ? (t.highlight ? 'rgba(6,182,212,0.35)' : 'transparent') : 'var(--border)',
                  boxShadow: tab === t.id ? `0 6px 20px ${t.highlight ? 'rgba(6,182,212,0.2)' : 'rgba(37,99,235,0.3)'}` : 'none',
                }}
              >
                {t.label}
                <span style={{ background: tab === t.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', padding: '1px 8px', borderRadius: 999, fontSize: '0.75rem' }}>
                  {t.count}
                </span>
                {t.highlight && matches.length > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', animation: 'glow-pulse 2s ease infinite', flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 180, borderRadius: 20 }} />)}
            </div>
          ) : activeList.length === 0 ? (
            <div className="empty-state">
              <div style={{ color: 'var(--text4)', marginBottom: 16, display: 'flex', justifyContent: 'center', opacity: 0.3 }}>
                {tab === 'my' ? <Ic.Transfer size={48} /> : <Ic.Search size={48} />}
              </div>
              <div className="empty-state-text">
                {tab === 'my' ? 'No active transfer requests' : 'Monitoring for mutual matches...'}
              </div>
              <div className="empty-state-sub">
                {tab === 'my' ? 'Use the button above to register a transfer intent' : 'Matches appear when another nurse requests the same exchange'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeList.map((t, idx) => {
                const cfg  = STATUS_CFG[t.status] || STATUS_CFG.open;
                const isMatch = tab === 'matches';

                return (
                  <div key={t._id} style={{
                    background: isMatch ? 'rgba(6,182,212,0.03)' : 'var(--surface)',
                    border: `1px solid ${isMatch ? 'rgba(6,182,212,0.3)' : 'var(--border)'}`,
                    borderRadius: 20,
                    padding: '24px',
                    position: 'relative', overflow: 'hidden',
                    transition: 'all 0.25s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {isMatch && (
                      <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '5px 14px', borderRadius: '0 0 0 12px', letterSpacing: '0.08em' }}>
                        MATCH FOUND
                      </div>
                    )}

                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                      {isMatch ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.15))', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee', fontWeight: 800, fontSize: '1rem' }}>
                            {(t.requester?.name || 'N')[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>{t.requester?.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 1 }}>Potential Transfer Partner</div>
                          </div>
                        </div>
                      ) : (
                        <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                      )}
                      <span style={{ fontSize: '0.76rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ic.Calendar size={12} />
                        {t.transferTimeframe}
                      </span>
                    </div>

                    {/* Route visualization */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '18px 20px' }}>
                      {/* Origin */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                          {isMatch ? 'Their Current' : 'Origin'}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t.currentHospital}</div>
                        <div style={{ fontSize: '0.75rem', color: '#22d3ee' }}>{t.currentWard}</div>
                      </div>

                      {/* Route line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, var(--primary), #22d3ee)', borderRadius: 999, position: 'relative' }}>
                          <div style={{ position: 'absolute', right: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>→</div>
                      </div>

                      {/* Destination */}
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                          {isMatch ? 'Their Goal' : 'Destination'}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t.desiredHospital}</div>
                        <div style={{ fontSize: '0.75rem', color: '#34d399' }}>{t.desiredWard}</div>
                      </div>
                    </div>

                    {/* Footer */}
                    {(t.reason || isMatch) && (
                      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        {t.reason && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontStyle: 'italic', flex: 1 }}>"{t.reason}"</div>
                        )}
                        {isMatch && (
                          <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                            Contact Nurse
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
