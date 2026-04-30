import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function TransferManagementPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get("/transfers?status=open");
      setTransfers(Array.isArray(data) ? data : []);
    } catch {
      setTransfers([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  useEffect(() => {
    let socket;
    import("../../utils/socketClient").then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;
      const onUpdate = () => fetchTransfers(true);
      socket.on("transfer:updated", onUpdate);
    });

    return () => {
      if (socket) socket.off("transfer:updated");
    };
  }, [fetchTransfers]);

  const { pairs, singles } = useMemo(() => {
    const pairKeySet = new Set();
    const pairList = [];
    const hasMatch = new Set();

    for (let i = 0; i < transfers.length; i += 1) {
      const a = transfers[i];
      for (let j = i + 1; j < transfers.length; j += 1) {
        const b = transfers[j];
        if (a.requester?._id === b.requester?._id) continue;

        const reciprocal =
          a.currentHospital === b.desiredHospital &&
          b.currentHospital === a.desiredHospital &&
          a.transferTimeframe === b.transferTimeframe;

        if (!reciprocal) continue;

        const key = [a._id, b._id].sort().join(":");
        if (pairKeySet.has(key)) continue;

        pairKeySet.add(key);
        pairList.push({ a, b });
        hasMatch.add(a._id);
        hasMatch.add(b._id);
      }
    }

    const singleList = transfers.filter((t) => !hasMatch.has(t._id));

    return { pairs: pairList, singles: singleList };
  }, [transfers]);

  const handleApprovePair = async (aId, bId) => {
    const confirmed = await confirm({
      title: "Approve Transfer Pair",
      message:
        "Approve and execute this reciprocal transfer? This will clear wards and remove future rosters.",
      confirmText: "Approve",
    });
    if (!confirmed) return;

    try {
      const { data } = await API.post("/transfers/approve-pair", {
        requestAId: aId,
        requestBId: bId,
      });
      notify.success("Transfer pair approved.");
      const approved = Array.isArray(data?.approved) ? data.approved : [];
      const names = approved.map((r) => r?.requester?.name).filter(Boolean);
      const label = names.length ? names.join(" and ") : "the approved users";
      const goAssign = await confirm({
        title: "Assign New Wards",
        message: `Assign new wards for ${label} now?`,
        confirmText: "Go to Users",
      });
      if (goAssign) {
        navigate("/admin/users");
      }
      fetchTransfers();
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to approve transfer pair.",
      );
    }
  };

  const handleReject = async (id, name) => {
    const confirmed = await confirm({
      title: "Reject Transfer Request",
      message: `Reject ${name}'s transfer request?`,
      confirmText: "Reject",
    });
    if (!confirmed) return;

    try {
      await API.put(`/transfers/${id}/reject`);
      notify.success("Transfer request rejected.");
      fetchTransfers();
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to reject transfer request.",
      );
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.35s ease" }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .transfer-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 22px;
          transition: all 0.2s ease;
        }
        .transfer-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
          border-color: rgba(37,99,235,0.25);
        }
        .transfer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          background: rgba(37,99,235,0.12);
          color: var(--primary-light);
          border: 1px solid rgba(37,99,235,0.3);
        }
        .transfer-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .transfer-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .transfer-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
        }
        .transfer-route {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text1);
        }
        .transfer-meta {
          font-size: 0.72rem;
          color: var(--text3);
        }
        .transfer-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">↔ Hospital Transfer Management</div>
          <div className="page-subtitle">
            Approve reciprocal transfer pairs or reject individual requests
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : transfers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">↔</div>
          <div className="empty-state-text">No open transfer requests.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {pairs.map(({ a, b }) => (
            <div key={`${a._id}-${b._id}`} className="transfer-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div className="transfer-badge">
                  Pair Match · {a.transferTimeframe}
                </div>
                <div className="transfer-meta">
                  Created {fmtDate(a.createdAt)}
                </div>
              </div>

              <div className="transfer-pair">
                {[a, b].map((t) => (
                  <div
                    key={t._id}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div className="transfer-user">
                      <div className="transfer-avatar">
                        {t.requester?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {t.requester?.name}
                        </div>
                        <div className="transfer-meta">
                          {t.requester?.nic || "—"}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div className="transfer-route">
                        {t.currentHospital} → {t.desiredHospital}
                      </div>
                      <div className="transfer-meta">
                        Current Ward: {t.currentWard || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="transfer-actions" style={{ marginTop: 14 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleApprovePair(a._id, b._id)}
                >
                  Approve Pair
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    handleReject(a._id, a.requester?.name || "Requester")
                  }
                >
                  Reject {a.requester?.name || "A"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    handleReject(b._id, b.requester?.name || "Requester")
                  }
                >
                  Reject {b.requester?.name || "B"}
                </button>
              </div>
            </div>
          ))}

          {singles.length > 0 && (
            <div
              className="card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 14 }}>
                Unmatched Requests
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {singles.map((t) => (
                  <div
                    key={t._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: 12,
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.requester?.name}</div>
                      <div className="transfer-meta">
                        {t.currentHospital} → {t.desiredHospital} ·{" "}
                        {t.transferTimeframe}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={() =>
                        handleReject(t._id, t.requester?.name || "Requester")
                      }
                    >
                      Reject
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
