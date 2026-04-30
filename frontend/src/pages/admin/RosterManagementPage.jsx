import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import SearchableSelect from "../../components/SearchableSelect";
import * as Ic from "../../components/icons";
import { getSocket } from "../../utils/socketClient";

const SHIFTS = ["7AM-1PM", "1PM-7PM", "7AM-7PM", "7PM-7AM"];
const SHIFT_MAP = {
  "7AM-1PM": {
    label: "M",
    title: "Morning",
    color: "#60a5fa",
    bg: "rgba(37,99,235,0.1)",
    border: "rgba(37,99,235,0.2)",
  },
  "1PM-7PM": {
    label: "A",
    title: "Afternoon",
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.2)",
  },
  "7AM-7PM": {
    label: "F",
    title: "Full Day",
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
  },
  "7PM-7AM": {
    label: "N",
    title: "Night",
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.2)",
  },
};

export default function RosterManagementPage() {
  const confirm = useConfirm();
  const [nurses, setNurses] = useState([]);
  const [wards, setWards] = useState([]);
  const [roster, setRoster] = useState([]);
  const [rosterWard, setRosterWard] = useState("");
  const [rosterHospital, setRosterHospital] = useState(""); // NEW: hospital filter for view tab
  const [tab, setTab] = useState("view");
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const [form, setForm] = useState({
    nurse: "",
    ward: "",
    dates: [""],
    shift: "7AM-1PM",
    month: "",
  });
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const dayOptions = useMemo(() => {
    if (!form.month) return [];
    const [y, m] = form.month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) => String(i + 1));
  }, [form.month]);

  useEffect(() => {
    API.get("/auth/users?role=nurse&isVerified=true")
      .then((r) => setNurses(r.data))
      .catch(() => {});
    API.get("/hospitals")
      .then((r) => setHospitals(r.data))
      .catch(() => {});
    API.get("/wards")
      .then((r) =>
        setWards(Array.isArray(r.data) ? r.data.map((w) => w.name) : []),
      )
      .catch(() => []);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onUserUpdated = (updated) => {
      if (!updated?._id) return;
      setNurses((prev) =>
        prev.map((n) => (n._id === updated._id ? { ...n, ...updated } : n)),
      );
    };

    socket.on("user:updated", onUserUpdated);
    return () => socket.off("user:updated", onUserUpdated);
  }, []);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(
        `/roster/all?month=${month}&ward=${rosterWard}`,
      );
      setRoster(data);
    } catch {
      setRoster([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [rosterWard, month]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const cleanedDays = [...new Set(form.dates.filter(Boolean))];
    if (!form.nurse || !form.ward || !form.month || cleanedDays.length === 0) {
      notify.error("Incomplete deployment configuration.");
      return;
    }
    setSubmitting(true);
    try {
      const dates = cleanedDays.map(
        (d) => `${form.month}-${String(d).padStart(2, "0")}`,
      );
      await API.post("/roster/bulk", { ...form, dates });
      notify.success("Roster session broadcasted.");
      setForm({
        nurse: "",
        ward: "",
        dates: [""],
        shift: "7AM-1PM",
        month: "",
      });
      fetchRoster();
      setTab("view");
    } catch (err) {
      notify.error("Deployment failure.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Cancel Shift",
      message: "Confirm cancellation of this roster entry?",
      confirmText: "Cancel Shift",
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/roster/${id}`);
      fetchRoster();
      notify.success("Entry voided.");
    } catch (err) {
      notify.error("Action denied.");
    }
  };

  const daysInMonth = useMemo(() => {
    if (!month) return [];
    const [y, m] = month.split("-").map(Number);
    return Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => i + 1);
  }, [month]);

  // Wards available in the view filter — when a hospital is selected, only show wards
  // that have at least one nurse belonging to that hospital.
  const viewWards = useMemo(() => {
    if (!rosterHospital) return wards;
    const wardsInHospital = new Set(
      nurses
        .filter((n) => n.hospital === rosterHospital)
        .map((n) => n.ward)
        .filter(Boolean),
    );
    return wards.filter((w) => wardsInHospital.has(w));
  }, [rosterHospital, nurses, wards]);

  const groupedRoster = useMemo(() => {
    const g = {};
    roster
      .filter((r) => !rosterHospital || r.nurse?.hospital === rosterHospital)
      .forEach((r) => {
        const nurseId = r.nurse?._id || (typeof r.nurse === "string" ? r.nurse : null) || "unknown";
        const name = r.nurse?.name || r.nurseName || "Unknown Nurse";
        if (!g[nurseId]) g[nurseId] = { name, days: {} };
        const day = parseInt(r.date.split("-").pop());
        g[nurseId].days[day] = r;
      });
    return g;
  }, [roster, rosterHospital]);

  const handleDeleteNurseMonth = async (nurseId, nurseName) => {
    if (!nurseId || nurseId === "unknown") {
      notify.error("Cannot resolve target nurse identity.");
      return;
    }
    const isConfirmed = await confirm({
      title: "Delete Monthly Roster",
      message: `Delete all roster entries for ${nurseName} in ${month}?`,
      confirmText: "Delete Month",
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/roster/nurse/${nurseId}?month=${month}`);
      fetchRoster();
      notify.success("Monthly roster removed.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to remove monthly roster.");
    }
  };

  return (
    <div
      className="roster-mgmt-container"
      style={{ animation: "fadeIn 0.4s ease" }}
    >
      <style>{`
        .roster-explorer {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 24px;
           overflow: hidden;
           margin-top: 24px;
           backdrop-filter: blur(20px);
        }
        .roster-table {
           width: 100%;
           border-collapse: collapse;
           font-size: 0.8rem;
        }
        .roster-table th {
           background: var(--bg2);
           padding: 12px 8px;
           text-transform: uppercase;
           font-size: 0.65rem;
           font-weight: 800;
           color: var(--text3);
           border-bottom: 1px solid var(--border);
           border-right: 1px solid var(--border);
        }
        .roster-table td {
           padding: 8px;
           border-bottom: 1px solid var(--border);
           border-right: 1px solid var(--border);
           text-align: center;
        }
        .sticky-nurse {
           position: sticky;
           left: 0;
           background: var(--surface);
           z-index: 5;
           text-align: left !important;
           padding-left: 16px !important;
           padding-right: 12px !important;
           font-weight: 700;
           width: 200px;
           border-right: 2px solid var(--border) !important;
        }
        .nurse-cell-content {
           display: flex;
           align-items: center;
           justify-content: space-between;
           gap: 12px;
           width: 100%;
        }
        .nurse-name-text {
           white-space: nowrap;
           overflow: hidden;
           text-overflow: ellipsis;
           flex: 1;
           font-size: 0.85rem;
           color: var(--text1);
        }
        .nurse-delete-btn {
           opacity: 0.6;
           transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
           color: #f43f5e;
           background: rgba(244,63,94,0.08);
           border: 1px solid rgba(244,63,94,0.15);
           border-radius: 8px;
           width: 28px;
           height: 28px;
           display: flex;
           align-items: center;
           justify-content: center;
           cursor: pointer;
           flex-shrink: 0;
        }
        .nurse-delete-btn:hover {
           opacity: 1;
           background: #f43f5e;
           color: #fff;
           box-shadow: 0 4px 12px rgba(244,63,94,0.3);
           transform: scale(1.05);
        }
        .duty-marker {
           width: 24px;
           height: 24px;
           border-radius: 8px;
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 0.7rem;
           font-weight: 900;
           margin: 0 auto;
            cursor: default;
           transition: all 0.2s;
           position: relative;
        }
        .duty-marker:hover {
           transform: scale(1.2);
           z-index: 10;
        }
          .duty-cell { position: relative; display: inline-flex; align-items: center; justify-content: center; }
          .duty-delete {
            position: absolute;
            top: -10px;
            right: -10px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #f43f5e;
            color: #fff;
            border: none;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(244,63,94,0.35);
          }
          .duty-cell:hover .duty-delete { display: flex; }
          @media (max-width: 768px) {
            .sticky-nurse { width: 120px !important; font-size: 0.75rem; padding-left: 10px !important; }
            .roster-table th, .roster-table td { padding: 6px 4px; }
            .roster-explorer { border-radius: 12px; }
          }
      `}</style>

      <div className="page-header">
        <div>
          <div
            className="page-title"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "var(--primary-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <Ic.Calendar size={24} />
            </div>
            Institutional Workforce Planning
          </div>
          <div className="page-subtitle">
            Synchronized scheduling and clinical resource allocation
          </div>
        </div>

        <button
          className={`btn ${tab === "create" ? "btn-outline" : "btn-primary"}`}
          style={{ borderRadius: 12, justifyContent: "center" }}
          onClick={() => setTab(tab === "view" ? "create" : "view")}
        >
          {tab === "view" ? "+ Create Roster" : "← Back to Roster"}
        </button>
      </div>

      {tab === "create" ? (
        <div
          className="form-card-premium"
          style={{ maxWidth: 800, margin: "40px auto" }}
        >
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 24 }}>
            Strategic Shift Allocation
          </h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: 24 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Medical Center Filter</label>
                <SearchableSelect
                  options={hospitals.map((h) => ({
                    value: h.name,
                    label: h.name,
                  }))}
                  value={selectedHospital}
                  onChange={setSelectedHospital}
                  placeholder="Filter by Institution"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Personnel</label>
                <SearchableSelect
                  options={nurses
                    .filter(
                      (n) =>
                        !selectedHospital || n.hospital === selectedHospital,
                    )
                    .filter((n) => !form.ward || n.ward === form.ward)
                    .map((n) => ({ value: n._id, label: n.name }))}
                  value={form.nurse}
                  onChange={(id) => {
                    const n = nurses.find((nu) => nu._id === id);
                    setForm({
                      ...form,
                      nurse: id,
                      ward: form.ward || n?.ward || "",
                    });
                  }}
                  placeholder="Target Nurse"
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Deployment Block (Ward)</label>
                <SearchableSelect
                  options={wards.map((w) => ({ value: w, label: w }))}
                  value={form.ward}
                  onChange={(v) => setForm({ ...form, ward: v, nurse: "" })}
                  placeholder="Target Block"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Planning Cycle (Month)</label>
                <input
                  className="form-input"
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  style={{ background: "var(--bg2)", height: 48 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Shift Identification</label>
                <select
                  className="form-input"
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  style={{ background: "var(--bg2)", height: 48 }}
                >
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                background: "var(--bg2)",
                padding: 24,
                borderRadius: 20,
                border: "1px dashed var(--border)",
              }}
            >
              <label
                className="form-label"
                style={{ marginBottom: 16, display: "block" }}
              >
                Duty Sequence (Select Days)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {dayOptions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`btn btn-sm ${form.dates.includes(d) ? "btn-primary" : "btn-ghost"}`}
                    style={{ borderRadius: 8, width: 44, height: 44 }}
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        dates: f.dates.includes(d)
                          ? f.dates.filter((x) => x !== d)
                          : [...f.dates, d],
                      }));
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {!form.month && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text3)",
                    marginTop: 12,
                  }}
                >
                  Initialize planning cycle to activate day sequence.
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{
                padding: "14px",
                borderRadius: 14,
                fontWeight: 700,
                justifyContent: "center",
              }}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Assigning..." : "Assign Duty"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div
            className="filter-bar-premium mobile-stack"
            style={{
              background: "var(--surface)",
              padding: 16,
              borderRadius: 18,
              border: "1px solid var(--border)",
              display: "flex",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            {/* Hospital filter */}
            <div className="mobile-w-full" style={{ width: 220 }}>
              <SearchableSelect
                options={hospitals.map((h) => ({
                  value: h.name,
                  label: h.name,
                }))}
                value={rosterHospital}
                onChange={(v) => {
                  setRosterHospital(v);
                  setRosterWard("");
                }}
                placeholder="Filter by Hospital"
              />
            </div>
            {/* Ward filter — narrows to wards in selected hospital */}
            <div className="mobile-w-full" style={{ width: 220 }}>
              <SearchableSelect
                options={viewWards.map((w) => ({ value: w, label: w }))}
                value={rosterWard}
                onChange={setRosterWard}
                placeholder="Filter by Ward"
              />
            </div>
            <input
              type="month"
              className="form-input mobile-w-full"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{
                width: 180,
                background: "var(--bg2)",
                border: "none",
                height: 48,
              }}
            />

            <div
              style={{
                flex: 1,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {Object.entries(SHIFT_MAP).map(([s, cfg]) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6rem",
                    }}
                  >
                    {cfg.label}
                  </div>
                  <span style={{ color: "var(--text3)" }}>{cfg.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="roster-explorer">
            {loading ? (
              <div
                style={{
                  padding: 100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div className="spinner" />
              </div>
            ) : Object.keys(groupedRoster).length === 0 ? (
              <div className="empty-state" style={{ padding: 100 }}>
                <Ic.Calendar
                  size={48}
                  style={{ opacity: 0.1, marginBottom: 20 }}
                />
                <div className="empty-state-text">
                  No workforce sequence recorded for this cycle.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th className="sticky-nurse">Medical Officer</th>
                      {daysInMonth.map((d) => (
                        <th key={d}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedRoster)
                      .sort((a, b) => a[1].name.localeCompare(b[1].name))
                      .map(([nurseId, info]) => (
                        <tr key={nurseId}>
                          <td className="sticky-nurse">
                            <div className="nurse-cell-content">
                              <span className="nurse-name-text" title={info.name}>
                                {info.name}
                              </span>
                              <button
                                type="button"
                                className="nurse-delete-btn"
                                onClick={() => handleDeleteNurseMonth(nurseId, info.name)}
                                title="Delete Monthly Roster"
                              >
                                <Ic.Trash size={14} />
                              </button>
                            </div>
                          </td>
                          {daysInMonth.map((d) => {
                            const entry = info.days[d];
                            const cfg = entry ? SHIFT_MAP[entry.shift] : null;
                            return (
                              <td key={d}>
                                {entry && cfg && (
                                  <div className="duty-cell">
                                    <div
                                      className="duty-marker"
                                      style={{
                                        background: cfg.bg,
                                        color: cfg.color,
                                        border: `1px solid ${cfg.border}`,
                                      }}
                                      title={`Shift ${cfg.title}`}
                                    >
                                      {cfg.label}
                                    </div>
                                    <button
                                      className="duty-delete"
                                      type="button"
                                      title="Delete roster entry"
                                      onClick={() => handleDelete(entry._id)}
                                    >
                                      <Ic.Trash size={10} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
