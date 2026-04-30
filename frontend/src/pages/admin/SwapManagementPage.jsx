import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';
import { notify } from '../../utils/toast';
import { useConfirm } from '../../context/ConfirmContext';

const STATUS_CFG = {
  pending:  { icon: '⏳', label: 'Pending',  color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  approved: { icon: '✅', label: 'Approved', color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
  rejected: { icon: '❌', label: 'Rejected', color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
};

const fmtDate = (ds) => {
  if (!ds) return '—';
  return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function SwapManagementPage() {
  const confirm = useConfirm();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchSwaps = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = filter === 'all' ? '/swap' : `/swap?status=${filter}`;
      const { data } = await API.get(url);
      setSwaps(data);
    } catch (err) {
      setSwaps([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  const handleDelete = async (id, label) => {
    const confirmed = await confirm({
      title: "Delete Swap Request",
      message: `Delete swap request${label ? ` for ${label}` : ""}? This cannot be undone.`,
      confirmText: "Delete",
    });
    if (!confirmed) return;

    try {
      await API.delete(`/swap/${id}`);
      notify.success("Swap request deleted.");
      fetchSwaps();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete swap request.");
    }
  };

  useEffect(() => {
    let socket;
    import('../../utils/socketClient').then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      
      const onUpdate = () => fetchSwaps(true);
      socket.on('swap:updated', onUpdate);
    });

    return () => {
      if (socket) {
        socket.off('swap:updated');
      }
    };
  }, [fetchSwaps]);

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .swap-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(16px);
          transition: all 0.2s ease;
        }
        .swap-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.4); border-color: rgba(37,99,235,0.25); }
        .swap-nurse { display: flex; alignItems: center; gap: 12px; }
        .swap-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(37,99,235,0.4), rgba(6,182,212,0.4));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; color: #fff; font-size: 0.9rem;
        }
        .swap-arrow { color: var(--text3); font-size: 1.2rem; }
        .swap-shift-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          flex: 1;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">🔄 Shift Swap Management</div>
          <div className="page-subtitle">Monitor and oversee nurse shift swap requests</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            className={`tab-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading && swaps.length === 0 ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : swaps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔄</div>
          <div className="empty-state-text">No {filter !== 'all' ? filter : ''} swap requests found.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {swaps.map(s => (
            <div key={s._id} className="swap-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                
                {/* Requester */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Requester</div>
                  <div className="swap-nurse">
                    <div className="swap-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>{s.requester?.name?.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.requester?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.requester?.ward || '—'} · {s.requester?.nic}</div>
                    </div>
                  </div>
                  <div className="swap-shift-box" style={{ marginTop: 12 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtDate(s.requesterShiftDate)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>{s.requesterShift}</div>
                  </div>
                </div>

                <div className="swap-arrow">⇄</div>

                {/* Target */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Target Nurse</div>
                  <div className="swap-nurse">
                    <div className="swap-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>{s.targetNurse?.name?.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.targetNurse?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.targetNurse?.ward || '—'} · {s.targetNurse?.nic}</div>
                    </div>
                  </div>
                  <div className="swap-shift-box" style={{ marginTop: 12 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtDate(s.targetShiftDate)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, marginTop: 2 }}>{s.targetShift}</div>
                  </div>
                </div>

                {/* Status & Options */}
                <div style={{ minWidth: 180, textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
                    color: STATUS_CFG[s.status]?.color,
                    background: STATUS_CFG[s.status]?.bg,
                    border: `1px solid ${STATUS_CFG[s.status]?.border}`,
                    marginBottom: 12
                  }}>
                    <span>{STATUS_CFG[s.status]?.icon}</span>
                    {s.status.toUpperCase()}
                  </div>
                  <div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#f43f5e', border: '1px solid rgba(244,63,94,0.25)' }}
                      onClick={() => handleDelete(s._id, s.requester?.name)}
                    >
                      Delete
                    </button>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text4)' }}>
                    Created: {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {s.reason && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                  "{s.reason}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
