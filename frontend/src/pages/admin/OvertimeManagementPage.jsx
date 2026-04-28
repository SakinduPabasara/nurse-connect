import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../api/axios';
import { notify } from '../../utils/toast';

/* ─────────────────────────────────── constants ── */
const OT_HOURLY_RATE = 150; // LKR per hour

/* ─────────────────────────────────── helpers ── */
const fmtDate = (ds) => {
  if (!ds) return '—';
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtAmount = (hours) =>
  `LKR ${(hours * OT_HOURLY_RATE).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const fmtMonthKey = (ds) => {
  if (!ds) return '';
  const [y, m] = ds.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/* ─────────────────────────────────── config maps ── */
const SHIFTS = {
  morning: { icon: '🌅', label: 'Morning', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)'  },
  evening: { icon: '🌇', label: 'Evening', color: '#fb923c', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.28)'  },
  night:   { icon: '🌙', label: 'Night',   color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.28)'  },
  custom:  { icon: '⚙️', label: 'Custom',  color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.28)' },
};

const STATUS_CFG = {
  pending:  { icon: '⏳', label: 'Pending',  badgeCls: 'badge-yellow', color: '#fbbf24' },
  approved: { icon: '✅', label: 'Approved', badgeCls: 'badge-green',  color: '#34d399' },
  rejected: { icon: '❌', label: 'Rejected',  badgeCls: 'badge-red',   color: '#f87171' },
};

const getShift = (id) => SHIFTS[id] || SHIFTS.custom;
const getStatus = (st) => STATUS_CFG[st] || STATUS_CFG.pending;

/* ─────────────────────────────────── Review Modal ── */
function ReviewModal({ nurseGroup, allRecords, onClose, onReview }) {
  const [notes, setNotes] = useState({});
  const [amounts, setAmounts] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  /* Derive pending entries from live allRecords */
  const pendingEntries = useMemo(
    () => allRecords.filter((r) => r.nurse?._id === nurseGroup.nurse._id && r.status === 'pending'),
    [allRecords, nurseGroup.nurse._id],
  );

  /* Pre-fill amounts with default calculated rate whenever entries change */
  useEffect(() => {
    setAmounts((prev) => {
      const next = { ...prev };
      pendingEntries.forEach((e) => {
        if (next[e._id] === undefined) next[e._id] = e.extraHours * OT_HOURLY_RATE;
      });
      return next;
    });
  }, [pendingEntries]);

  const handleReview = async (recordId, status) => {
    setProcessingId(recordId);
    try {
      const approvedAmount = status === 'approved' ? (Number(amounts[recordId]) || 0) : undefined;
      await onReview(recordId, status, notes[recordId] || '', approvedAmount);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAll = async () => {
    setBulkLoading(true);
    for (const entry of pendingEntries) {
      try {
        const approvedAmount = Number(amounts[entry._id]) || entry.extraHours * OT_HOURLY_RATE;
        await onReview(entry._id, 'approved', notes[entry._id] || '', approvedAmount);
      } catch {/* continue */}
    }
    setBulkLoading(false);
    notify.success(`${pendingEntries.length} OT application(s) approved!`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="ot-review-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Nurse header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 50, background: 'linear-gradient(135deg, rgba(37,99,235,0.5), rgba(6,182,212,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {nurseGroup.nurse.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 3 }}>{nurseGroup.nurse.name}</div>
            <div style={{ fontSize: '0.79rem', color: 'var(--text3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {nurseGroup.nurse.ward && <span>🏥 {nurseGroup.nurse.ward}</span>}
              {nurseGroup.nurse.hospital && <span>🏨 {nurseGroup.nurse.hospital}</span>}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ flexShrink: 0 }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sub-stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Pending',         value: pendingEntries.length,                                                     color: '#fbbf24' },
            { label: 'Pending Hours',  value: `${pendingEntries.reduce((s, r) => s + r.extraHours, 0)}h`,                 color: '#22d3ee' },
            { label: 'Approved Total', value: `${nurseGroup.totalApprovedHours}h`,                                        color: '#34d399' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stat.color, fontFamily: "'DM Sans', sans-serif" }}>{stat.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Pending Applications
        </div>

        {/* Entries */}
        {pendingEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎉</div>
            <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>All done!</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text3)' }}>All applications have been reviewed.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '50vh', overflowY: 'auto', paddingRight: 4 }}>
            {pendingEntries.map((entry) => {
              const sh = getShift(entry.shift);
              const isProcessing = processingId === entry._id;
              return (
                <div key={entry._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                  {/* Entry header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ background: sh.bg, border: `1px solid ${sh.border}`, borderRadius: 9, padding: '8px 12px', textAlign: 'center', minWidth: 58, flexShrink: 0 }}>
                      <div style={{ fontSize: '1.1rem' }}>{sh.icon}</div>
                      <div style={{ fontSize: '0.62rem', color: sh.color, fontWeight: 700, marginTop: 2 }}>{sh.label}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', marginBottom: 4 }}>{fmtDate(entry.date)}</div>
                      {entry.reason ? (
                        <div style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.5 }}>"{entry.reason}"</div>
                      ) : (
                        <div style={{ fontSize: '0.83rem', color: 'var(--text3)', fontStyle: 'italic' }}>No reason provided</div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 999, padding: '4px 13px', fontWeight: 800, fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                        {entry.extraHours}h
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#34d399', fontWeight: 600 }}>{fmtAmount(entry.extraHours)}</div>
                    </div>
                  </div>

                  {/* Amount + Note inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    {/* Approved amount */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                        💰 Approved Amount (LKR)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', pointerEvents: 'none' }}>LKR</span>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          step="50"
                          style={{ paddingLeft: 42, fontSize: '0.9rem', fontWeight: 700, color: '#34d399', borderColor: amounts[entry._id] !== entry.extraHours * OT_HOURLY_RATE ? 'rgba(37,99,235,0.5)' : undefined }}
                          value={amounts[entry._id] ?? entry.extraHours * OT_HOURLY_RATE}
                          onChange={(e) => setAmounts((p) => ({ ...p, [entry._id]: e.target.value }))}
                          disabled={isProcessing}
                        />
                      </div>
                      {amounts[entry._id] !== undefined && Number(amounts[entry._id]) !== entry.extraHours * OT_HOURLY_RATE && (
                        <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: 3 }}>
                          Default: LKR {(entry.extraHours * OT_HOURLY_RATE).toLocaleString()} · Custom set
                        </div>
                      )}
                      {amounts[entry._id] !== undefined && Number(amounts[entry._id]) === entry.extraHours * OT_HOURLY_RATE && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 3 }}>
                          {entry.extraHours}h × LKR {OT_HOURLY_RATE} (default)
                        </div>
                      )}
                    </div>
                    {/* Admin note */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                        Admin Note
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: '0.84rem' }}
                        placeholder="Reason / remarks…"
                        value={notes[entry._id] || ''}
                        onChange={(e) => setNotes((p) => ({ ...p, [entry._id]: e.target.value }))}
                        disabled={isProcessing}
                      />
                      <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 3 }}>Optional for approve</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleReview(entry._id, 'approved')}
                      disabled={isProcessing || bulkLoading}
                    >
                      {isProcessing ? (
                        <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: 50, animation: 'spin 0.7s linear infinite' }} />Processing…</>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Approve</>
                      )}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleReview(entry._id, 'rejected')}
                      disabled={isProcessing || bulkLoading}
                    >
                      {isProcessing ? '…' : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {pendingEntries.length > 1 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-success"
              onClick={handleApproveAll}
              disabled={bulkLoading || processingId !== null}
            >
              {bulkLoading
                ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: 50, animation: 'spin 0.7s linear infinite' }} />Approving all…</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Approve All ({pendingEntries.length})</>
              }
            </button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        )}
        {pendingEntries.length <= 1 && pendingEntries.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Delete Confirm Modal ── */
function DeleteModal({ open, nurseName, onCancel, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🗑️</div>
          <div className="modal-title" style={{ textAlign: 'center', marginBottom: 8 }}>Delete OT Record?</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text3)' }}>
            Permanently delete this overtime record{nurseName ? <> for <strong style={{ color: 'var(--text2)' }}>{nurseName}</strong></> : ''}? This cannot be undone.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function OvertimeManagementPage() {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  /* modal */
  const [reviewNurse, setReviewNurse] = useState(null); // nurse group obj
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nurseName }
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* all-records table filters */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [nurseFilter, setNurseFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [hospitals, setHospitals] = useState([]);
  const [wards, setWards] = useState([]);

  /* ── Fetch all OT records ── */
  const fetchRecords = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get('/overtime');
      setAllRecords(data);
    } catch {
      setAllRecords([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchRecords(); 
    API.get('/hospitals').then(r => setHospitals(r.data || [])).catch(() => {});
    API.get('/wards').then(r => setWards(r.data || [])).catch(() => {});
  }, [fetchRecords]);

  const filteredWards = useMemo(() => {
    if (hospitalFilter === 'all') return wards;
    return wards.filter(w => w.hospital === hospitalFilter);
  }, [wards, hospitalFilter]);

  useEffect(() => {
    setWardFilter("all");
  }, [hospitalFilter]);

  useEffect(() => {
    let socket;
    import("../../utils/socketClient").then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      
      const onUpdate = () => fetchRecords(true);
      socket.on('overtime:created', onUpdate);
      socket.on('overtime:updated', onUpdate);
      socket.on('overtime:deleted', onUpdate);
    });

    return () => {
      if (socket) {
        socket.off('overtime:created');
        socket.off('overtime:updated');
        socket.off('overtime:deleted');
      }
    };
  }, [fetchRecords]);

  /* ── Stats ── */
  const totalPending      = useMemo(() => allRecords.filter((r) => r.status === 'pending').length, [allRecords]);
  const totalApproved     = useMemo(() => allRecords.filter((r) => r.status === 'approved'), [allRecords]);
  const totalApprovedHrs  = useMemo(() => totalApproved.reduce((s, r) => s + r.extraHours, 0), [totalApproved]);
  const totalApprovedAmt  = totalApprovedHrs * OT_HOURLY_RATE;
  const uniqueNursesCount = useMemo(() => new Set(allRecords.map((r) => r.nurse?._id)).size, [allRecords]);

  /* ── Pending grouped by nurse ── */
  const pendingByNurse = useMemo(() => {
    const map = {};
    allRecords.forEach((r) => {
      const nid = r.nurse?._id;
      if (!nid) return;
      if (!map[nid]) {
        map[nid] = {
          nurse: r.nurse,
          pendingCount: 0,
          pendingHours: 0,
          totalApprovedHours: 0,
        };
      }
      if (r.status === 'pending') {
        map[nid].pendingCount += 1;
        map[nid].pendingHours += r.extraHours;
      }
      if (r.status === 'approved') {
        map[nid].totalApprovedHours += r.extraHours;
      }
    });
    return Object.values(map).filter((g) => g.pendingCount > 0);
  }, [allRecords]);

  /* ── Nurse / month options for filters ── */
  const nurseOptions = useMemo(() => {
    const map = {};
    allRecords.forEach((r) => { if (r.nurse?._id) map[r.nurse._id] = r.nurse.name; });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [allRecords]);

  const monthOptions = useMemo(() => {
    const seen = new Set();
    allRecords.forEach((r) => seen.add(fmtMonthKey(r.date)));
    return Array.from(seen);
  }, [allRecords]);

  /* ── Filtered all-records ── */
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch   = !search || (r.nurse?.name || '').toLowerCase().includes(q) || (r.reason || '').toLowerCase().includes(q);
      const matchHospital = hospitalFilter === 'all' || r.nurse?.hospital === hospitalFilter;
      const matchWard     = wardFilter === 'all' || r.nurse?.ward === wardFilter;
      const matchStatus   = statusFilter === 'all' || r.status === statusFilter;
      const matchNurse    = nurseFilter  === 'all' || r.nurse?._id === nurseFilter;
      const matchMonth    = monthFilter  === 'all' || fmtMonthKey(r.date) === monthFilter;
      return matchSearch && matchHospital && matchWard && matchStatus && matchNurse && matchMonth;
    }).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [allRecords, search, hospitalFilter, wardFilter, statusFilter, nurseFilter, monthFilter]);

  /* ── Review handler (called from modal) ── */
  const handleReview = async (recordId, status, adminNote, approvedAmount) => {
    const payload = { status, adminNote };
    if (status === 'approved' && approvedAmount !== undefined) {
      payload.approvedAmount = Number(approvedAmount);
    }
    await API.put(`/overtime/${recordId}`, payload);
    /* Optimistic update */
    setAllRecords((prev) =>
      prev.map((r) =>
        r._id === recordId
          ? { ...r, status, adminNote, approvedAmount: status === 'approved' ? Number(approvedAmount) : null, reviewedAt: new Date().toISOString() }
          : r,
      ),
    );
    notify.success(status === 'approved' ? `OT approved ✓  LKR ${Number(approvedAmount).toLocaleString()}` : 'OT rejected ✗');
  };

  /* ── Delete handler ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/overtime/${deleteTarget.id}`);
      setAllRecords((prev) => prev.filter((r) => r._id !== deleteTarget.id));
      notify.success('Record deleted.');
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete record.');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  /* Sum actual approvedAmount from DB for approved records */
  const totalPaidOut = useMemo(
    () => totalApproved.reduce((s, r) => s + (r.approvedAmount != null ? r.approvedAmount : r.extraHours * OT_HOURLY_RATE), 0),
    [totalApproved],
  );

  const STATS = [
    { icon: '⏳', label: 'Pending Reviews',   value: totalPending,                                                                  sub: 'need action',           color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
    { icon: '✅', label: 'Total Approved Hrs', value: `${totalApprovedHrs}h`,                                                        sub: `${totalApproved.length} sessions`, color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
    { icon: '💰', label: 'Total Paid Out',     value: loading ? '…' : `LKR ${totalPaidOut.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, sub: 'actual approved payout', color: '#22d3ee', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)' },
    { icon: '👥', label: 'Active Nurses',       value: uniqueNursesCount,                                                             sub: 'with OT records',        color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* ── Stat card ── */
        .ot-a-stat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          backdrop-filter: blur(14px);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ot-a-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.3); }

        /* ── Tab strip ── */
        .ot-a-tabs {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          width: fit-content;
        }
        .ot-a-tab {
          padding: 8px 22px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: var(--text3);
          font-family: 'Inter', sans-serif;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .ot-a-tab.active { background: var(--primary); color: #fff; box-shadow: 0 2px 10px rgba(37,99,235,0.35); }
        .ot-a-tab:hover:not(.active) { color: var(--text); background: rgba(255,255,255,0.05); }
        .ot-a-tab-badge {
          background: rgba(239,68,68,0.2);
          color: #f87171;
          border-radius: 999px;
          padding: 1px 7px;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .ot-a-tab.active .ot-a-tab-badge { background: rgba(255,255,255,0.2); color: #fff; }

        /* ── Nurse card (pending) ── */
        .ot-nurse-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 22px;
          backdrop-filter: blur(16px);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          display: flex;
          flex-direction: column;
          gap: 14px;
          cursor: default;
        }
        .ot-nurse-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(0,0,0,0.35);
          border-color: rgba(37,99,235,0.25);
        }

        /* ── Filter bar ── */
        .ot-a-bar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; align-items: center; }
        .ot-a-search-wrap { position: relative; flex: 1; min-width: 200px; }
        .ot-a-search-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }
        .ot-a-search {
          width: 100%;
          padding: 9px 14px 9px 36px;
          background: rgba(8,15,30,0.65);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.18s;
        }
        .ot-a-search:focus { border-color: var(--border-focus); background: rgba(8,15,30,0.85); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
        .ot-a-search::placeholder { color: var(--text3); }
        .ot-a-filter-select {
          padding: 8px 12px;
          background: rgba(8,15,30,0.65);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          outline: none;
          cursor: pointer;
          transition: all 0.18s;
          min-width: 140px;
        }
        .ot-a-filter-select:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
        .ot-a-filter-select option { background: #0d1829; }

        /* ── Shift pill ── */
        .ot-shift-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 9px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid;
        }

        /* ── Review modal ── */
        .ot-review-modal {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 28px 30px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
          animation: modalIn 0.22s ease;
        }

        /* ── Table ── */
        .ot-a-table-wrap { overflow-x: auto; border-radius: var(--radius); }
        .ot-nurse-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(37,99,235,0.5), rgba(6,182,212,0.5));
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .ot-a-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ot-nurse-cards-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important; }
        }
        @media (max-width: 600px) {
          .ot-a-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .ot-a-bar { flex-direction: column; align-items: stretch; }
          .ot-review-modal { padding: 20px; }
        }
        @media (max-width: 420px) {
          .ot-a-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ animation: 'fadeInUp 0.35s ease' }}>

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <div className="page-title">⏰ Overtime Management</div>
            <div className="page-subtitle">Review nurse overtime applications and track approved hours</div>
          </div>
          {totalPending > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 18px', fontSize: '0.82rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: 50, background: '#ef4444' }} />
              {totalPending} pending review{totalPending !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="ot-a-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 26 }}>
          {STATS.map((s) => (
            <div key={s.label} className="ot-a-stat">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                {loading && allRecords.length === 0 ? <div style={{ width: 20, height: 20, borderRadius: 50, background: 'rgba(148,163,184,0.12)' }} /> : s.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
                {loading && allRecords.length === 0
                  ? <div style={{ width: 52, height: 22, borderRadius: 4, background: 'rgba(148,163,184,0.1)' }} />
                  : <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
                }
                {!(loading && allRecords.length === 0) && <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 3 }}>{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="ot-a-tabs">
          <button className={`ot-a-tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
            ⏳ Pending Reviews
            {totalPending > 0 && <span className="ot-a-tab-badge">{totalPending}</span>}
          </button>
          <button className={`ot-a-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            📋 All Records
          </button>
        </div>

        {/* ════════════ TAB: PENDING REVIEWS ════════════ */}
        {tab === 'pending' && (
          <>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : pendingByNurse.length === 0 ? (
              <div className="empty-state" style={{ padding: '80px 20px' }}>
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-text" style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text2)', marginBottom: 10 }}>
                  No pending reviews
                </div>
                <div style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: 18 }}>
                  All overtime applications have been reviewed
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setTab('all')}>View All Records</button>
              </div>
            ) : (
              <div className="ot-nurse-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {pendingByNurse.map((group) => (
                  <div key={group.nurse._id} className="ot-nurse-card">
                    {/* Nurse info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 50, background: 'linear-gradient(135deg, rgba(37,99,235,0.5), rgba(6,182,212,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {group.nurse.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.nurse.name}</div>
                        <div style={{ fontSize: '0.77rem', color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {group.nurse.ward && <span>🏥 {group.nurse.ward}</span>}
                          {group.nurse.hospital && <span>{group.nurse.hospital}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '9px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', fontFamily: "'DM Sans', sans-serif" }}>{group.pendingCount}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Pending</div>
                      </div>
                      <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, padding: '9px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22d3ee', fontFamily: "'DM Sans', sans-serif" }}>{group.pendingHours}h</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Pending Hrs</div>
                      </div>
                      <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '9px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', fontFamily: "'DM Sans', sans-serif" }}>{group.totalApprovedHours}h</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Approved</div>
                      </div>
                    </div>

                    {/* Potential payout info */}
                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 9, padding: '8px 12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text3)' }}>If all approved:</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>{fmtAmount(group.pendingHours)}</span>
                    </div>

                    {/* Review button */}
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setReviewNurse(group)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Review {group.pendingCount} Application{group.pendingCount !== 1 ? 's' : ''}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════ TAB: ALL RECORDS ════════════ */}
        {tab === 'all' && (
          <>
            {/* Filter bar */}
            <div className="ot-a-bar">
              <div className="ot-a-search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="ot-a-search"
                  placeholder="Search nurse or reason…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="ot-a-filter-select" value={hospitalFilter} onChange={(e) => setHospitalFilter(e.target.value)}>
                <option value="all">All Hospitals</option>
                {hospitals.map((h) => <option key={h._id} value={h.name}>{h.name}</option>)}
              </select>
              <select className="ot-a-filter-select" value={wardFilter} onChange={(e) => setWardFilter(e.target.value)}>
                <option value="all">All Wards</option>
                {filteredWards.map((w) => <option key={w._id} value={w.name}>{w.name}</option>)}
              </select>
              <select className="ot-a-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="rejected">❌ Rejected</option>
              </select>
              <select className="ot-a-filter-select" value={nurseFilter} onChange={(e) => setNurseFilter(e.target.value)}>
                <option value="all">All Nurses</option>
                {nurseOptions.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <select className="ot-a-filter-select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                <option value="all">All Months</option>
                {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {(search || hospitalFilter !== 'all' || wardFilter !== 'all' || statusFilter !== 'all' || nurseFilter !== 'all' || monthFilter !== 'all') && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setHospitalFilter('all'); setWardFilter('all'); setStatusFilter('all'); setNurseFilter('all'); setMonthFilter('all'); }}>
                  Clear Filters
                </button>
              )}
            </div>

            {/* Count row */}
            {!loading && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 14 }}>
                Showing <strong style={{ color: 'var(--text2)' }}>{filteredRecords.length}</strong> of <strong style={{ color: 'var(--text2)' }}>{allRecords.length}</strong> records
                {statusFilter === 'approved' && filteredRecords.length > 0 && (
                  <> · <strong style={{ color: '#34d399' }}>{fmtAmount(filteredRecords.reduce((s, r) => s + r.extraHours, 0))}</strong> total</>
                )}
              </div>
            )}

            {loading ? (
              <div className="card" style={{ padding: 0 }}>
                <div className="ot-a-table-wrap">
                  <table>
                    <thead><tr><th>Nurse</th><th>Date</th><th>Shift</th><th>Hours</th><th>Status</th><th>Amount</th><th>Action</th></tr></thead>
                    <tbody>
                      {[...Array(6)].map((_, i) => (
                        <tr key={i} style={{ opacity: 0.5 }}>
                          {[...Array(7)].map((_, j) => (
                            <td key={j}><div style={{ height: 13, borderRadius: 4, background: 'rgba(148,163,184,0.1)', width: j === 0 ? '70%' : '55%' }} /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="empty-state" style={{ padding: '72px 20px' }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text" style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>No matching records</div>
                <div style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: 16 }}>
                  {allRecords.length === 0 ? 'No overtime applications submitted yet.' : 'Try adjusting your filters.'}
                </div>
                {allRecords.length > 0 && (
                  <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setStatusFilter('all'); setNurseFilter('all'); setMonthFilter('all'); }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <div className="ot-a-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nurse</th>
                        <th>Date</th>
                        <th>Shift</th>
                        <th>Hours</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r) => {
                        const sh = getShift(r.shift);
                        const st = getStatus(r.status);
                        return (
                          <tr key={r._id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="ot-nurse-avatar">{(r.nurse?.name || '?').charAt(0).toUpperCase()}</div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.nurse?.name || '—'}</div>
                                  {r.nurse?.ward && <div style={{ fontSize: '0.73rem', color: 'var(--text3)' }}>{r.nurse.ward}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text2)', fontWeight: 500, fontSize: '0.84rem' }}>{fmtDate(r.date)}</td>
                            <td>
                              <span className="ot-shift-pill" style={{ color: sh.color, background: sh.bg, borderColor: sh.border }}>
                                {sh.icon} {sh.label}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-cyan" style={{ fontWeight: 800, fontSize: '0.82rem' }}>{r.extraHours}h</span>
                            </td>
                            <td>
                              <span className={`badge ${st.badgeCls}`} style={{ fontSize: '0.75rem' }}>
                                {st.icon} {st.label}
                              </span>
                            </td>
                            <td>
                              {r.status === 'approved' ? (
                                <div>
                                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.84rem' }}>
                                    LKR {(r.approvedAmount != null ? r.approvedAmount : r.extraHours * OT_HOURLY_RATE).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                  </div>
                                  {r.approvedAmount != null && r.approvedAmount !== r.extraHours * OT_HOURLY_RATE && (
                                    <div style={{ fontSize: '0.65rem', color: '#60a5fa', marginTop: 2, fontWeight: 600 }}>Custom rate</div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                {r.status === 'pending' && (
                                  <button
                                    className="btn btn-outline btn-xs"
                                    onClick={() => {
                                      const group = pendingByNurse.find((g) => g.nurse._id === r.nurse?._id);
                                      if (group) setReviewNurse(group);
                                    }}
                                  >
                                    Review
                                  </button>
                                )}
                                <button
                                  className="btn btn-danger btn-xs"
                                  onClick={() => setDeleteTarget({ id: r._id, nurseName: r.nurse?.name })}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Review Modal ── */}
      {reviewNurse && (
        <ReviewModal
          nurseGroup={reviewNurse}
          allRecords={allRecords}
          onClose={() => setReviewNurse(null)}
          onReview={handleReview}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      <DeleteModal
        open={!!deleteTarget}
        nurseName={deleteTarget?.nurseName}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </>
  );
}
