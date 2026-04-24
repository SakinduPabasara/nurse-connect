import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { notify } from '../../utils/toast';

/* ─────────────────────────────────── Reject Modal ── */
function RejectModal({ nurse, onCancel, onConfirm, loading }) {
  const [reason, setReason] = useState('');

  if (!nurse) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 50, flexShrink: 0,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>
            ❌
          </div>
          <div>
            <div className="modal-title" style={{ marginBottom: 2 }}>Reject Registration</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
              This will permanently remove the nurse's registration
            </div>
          </div>
        </div>

        {/* Nurse summary card */}
        <div style={{
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 50, flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(239,68,68,0.4),rgba(248,113,113,0.3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: '#fff', fontSize: '0.95rem',
            }}>
              {nurse.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{nurse.name}</div>
              <div style={{ fontSize: '0.77rem', color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>NIC: <strong style={{ color: 'var(--text2)' }}>{nurse.nic}</strong></span>
                {nurse.hospital && <span>🏥 {nurse.hospital}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Reason input */}
        <div className="form-group">
          <label className="form-label">
            Reason for Rejection
            <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>(optional)</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="e.g. Incomplete documentation, duplicate NIC detected, invalid hospital affiliation…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            style={{ minHeight: 80 }}
          />
          <div className="form-hint">The reason will be logged for audit purposes but not sent to the nurse</div>
        </div>

        {/* Warning */}
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 9, padding: '9px 14px', marginBottom: 20,
          display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: '0.79rem', color: '#fbbf24',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
          <span>
            This action <strong>cannot be undone</strong>. The nurse will need to register again if rejected by mistake.
          </span>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onConfirm(reason)}
            disabled={loading}
          >
            {loading ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: 50, animation: 'spin 0.7s linear infinite' }} />Rejecting…</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Confirm Rejection</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Verify Modal ── */
function VerifyModal({ nurse, onCancel, onConfirm, loading }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (nurse) {
      setMessage(`Hello ${nurse.name}, your Nurse Connect account has been verified by the admin. You can now log in using your NIC.`);
    }
  }, [nurse]);

  if (!nurse) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 50, flexShrink: 0,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>
            ✅
          </div>
          <div>
            <div className="modal-title" style={{ marginBottom: 2 }}>Verify Registration</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
              This will activate the nurse's account
            </div>
          </div>
        </div>

        {/* Nurse summary card */}
        <div style={{
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 50, flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(16,185,129,0.4),rgba(52,211,153,0.3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: '#fff', fontSize: '0.95rem',
            }}>
              {nurse.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{nurse.name}</div>
              <div style={{ fontSize: '0.77rem', color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>NIC: <strong style={{ color: 'var(--text2)' }}>{nurse.nic}</strong></span>
                {nurse.hospital && <span>🏥 {nurse.hospital}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Message input */}
        <div className="form-group">
          <label className="form-label">
            Verification Message
            <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>(Sent via SMS)</span>
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            style={{ minHeight: 80 }}
          />
          <div className="form-hint">This message will be sent to the nurse's registered telephone number.</div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={() => onConfirm(message)}
            disabled={loading}
          >
            {loading ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: 50, animation: 'spin 0.7s linear infinite' }} />Verifying…</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Send Verification</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function PendingVerificationsPage() {
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/auth/users?isVerified=false&role=nurse');
      setNurses(data);
    } catch {
      setNurses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  /* ── Verify ── */
  const handleVerify = async (message) => {
    if (!verifyTarget) return;
    setVerifyLoading(true);
    try {
      await API.put(`/auth/verify/${verifyTarget._id}`, { message });
      notify.success('Nurse verified successfully. SMS notification sent.');
      setVerifyTarget(null);
      fetchPending();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to verify nurse.');
    } finally {
      setVerifyLoading(false);
    }
  };

  /* ── Reject ── */
  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await API.delete(`/auth/reject/${rejectTarget._id}`, { data: { reason } });
      notify.success(`Registration for ${rejectTarget.name} has been rejected.`);
      setRejectTarget(null);
      fetchPending();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to reject registration.');
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pv-row { animation: fadeInUp 0.25s ease both; }
        .pv-row:hover td { background: rgba(255,255,255,0.02); }

        .pv-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(37,99,235,0.45), rgba(6,182,212,0.45));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; color: #fff; font-size: 0.88rem; flex-shrink: 0;
        }

        .pv-stat-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .pv-stat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .pv-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }

        @media (max-width: 600px) {
          .pv-stat-bar { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div style={{ animation: 'fadeInUp 0.3s ease' }}>

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <div className="page-title">🔍 Pending Nurse Verifications</div>
            <div className="page-subtitle">
              {loading ? 'Loading…' : `${nurses.length} nurse${nurses.length !== 1 ? 's' : ''} awaiting verification`}
            </div>
          </div>
          {!loading && nurses.length > 0 && (
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700,
              color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 50, background: '#f59e0b' }} />
              {nurses.length} pending action{nurses.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Stat Cards ── */}
        {!loading && (
          <div className="pv-stat-bar">
            {[
              { icon: '⏳', label: 'Awaiting Review', value: nurses.length,          color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
              { icon: '🏥', label: 'Hospitals',       value: new Set(nurses.map((n) => n.hospital).filter(Boolean)).size, color: '#22d3ee', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)' },
              { icon: '📅', label: 'Oldest Pending',  value: nurses.length ? new Date(nurses[nurses.length - 1]?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—', color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
            ].map((s) => (
              <div key={s.label} className="pv-stat">
                <div style={{ width: 42, height: 42, borderRadius: 11, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Info banner ── */}
        {!loading && nurses.length > 0 && (
          <div className="alert alert-info" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="1" fill="currentColor"/>
            </svg>
            Review each nurse's details carefully before taking action.
            <strong> Verify</strong> to activate the account.
            <strong> Reject</strong> to permanently remove the registration.
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>

        /* ── Empty ── */
        ) : nurses.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text" style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text2)', marginBottom: 8 }}>
              No pending verifications
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>
              All nurse registrations have been reviewed. Great work!
            </div>
          </div>

        /* ── Table ── */
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nurse</th>
                    <th>NIC</th>
                    <th>Hospital</th>
                    <th>Ward</th>
                    <th>Address</th>
                    <th>Telephone</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {nurses.map((n, i) => (
                    <tr
                      key={n._id}
                      className="pv-row"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      {/* Nurse column with avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
                          <div className="pv-avatar">{(n.name || '?').charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{n.name}</div>
                            {n.email && <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{n.email}</div>}
                          </div>
                        </div>
                      </td>

                      {/* NIC */}
                      <td>
                        <span style={{
                          background: 'rgba(34,211,238,0.1)', padding: '5px 10px',
                          borderRadius: 6, fontSize: '0.8rem', letterSpacing: '0.04em',
                          color: '#22d3ee', fontWeight: 600, whiteSpace: 'nowrap',
                          border: '1px solid rgba(34,211,238,0.15)'
                        }}>{n.nic}</span>
                      </td>

                      {/* Hospital */}
                      <td style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{n.hospital || '—'}</td>

                      {/* Ward */}
                      <td>
                        {n.ward ? (
                          <span style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 999, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {n.ward}
                          </span>
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>

                      {/* Address */}
                      <td className="text-muted text-sm" style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={n.address}>{n.address || '—'}</td>

                      {/* Telephone */}
                      <td style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{n.telephone || '—'}</td>

                      {/* Registered */}
                      <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                          {/* Verify button */}
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => setVerifyTarget(n)}
                            disabled={rejectLoading}
                            style={{ minWidth: 90 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Verify
                          </button>

                          {/* Reject button */}
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setRejectTarget(n)}
                            disabled={rejectLoading}
                            style={{ minWidth: 80 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── Reject Confirmation Modal ── */}
      <RejectModal
        nurse={rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onConfirm={handleReject}
        loading={rejectLoading}
      />

      {/* ── Verify Confirmation Modal ── */}
      <VerifyModal
        nurse={verifyTarget}
        onCancel={() => setVerifyTarget(null)}
        onConfirm={handleVerify}
        loading={verifyLoading}
      />
    </>
  );
}
