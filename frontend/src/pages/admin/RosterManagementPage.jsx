import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";

const SHIFTS = ["7AM-1PM", "1PM-7PM", "7AM-7PM", "7PM-7AM"];
const SHIFT_MAP = {
  "7AM-1PM": { label: "M", title: "Morning (7AM-1PM)", color: "#60a5fa", bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.3)" },
  "1PM-7PM": { label: "A", title: "Afternoon (1PM-7PM)", color: "#22d3ee", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.3)" },
  "7AM-7PM": { label: "F", title: "Full Day (7AM-7PM)", color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  "7PM-7AM": { label: "N", title: "Night (7PM-7AM)", color: "#a78bfa", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)" },
};

const shiftColor = (s) => (SHIFT_MAP[s] ? `badge-${SHIFT_MAP[s].color === '#fbbf24' ? 'yellow' : SHIFT_MAP[s].color === '#a78bfa' ? 'cyan' : 'blue'}` : 'badge-gray');
const emptyDay = "";

const getDaysInMonth = (monthStr) => {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) return [];
  const [yearStr, monthPart] = monthStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthPart);
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => String(i + 1));
};

export default function RosterManagementPage() {
  const confirm = useConfirm();
  const [nurses, setNurses] = useState([]);
  const [wards, setWards] = useState([]);
  const [roster, setRoster] = useState([]);
  const [rosterWard, setRosterWard] = useState("");
  const [tab, setTab] = useState("view");
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const [form, setForm] = useState({
    nurse: "",
    ward: "",
    dates: [emptyDay],
    shift: "7AM-1PM",
    month: "",
  });
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const selectedNurse = nurses.find((n) => n._id === form.nurse);
  const selectedNurseWard = (selectedNurse?.ward || "").trim();
  const dayOptions = getDaysInMonth(form.month);

  useEffect(() => {
    API.get("/auth/users?role=nurse&isVerified=true")
      .then((r) => setNurses(r.data))
      .catch(() => {});
    API.get("/hospitals")
      .then((r) => setHospitals(r.data))
      .catch(() => {});
    // Merge managed wards (/api/wards) with wards already in roster entries
    Promise.all([
      API.get("/wards").then(r => (Array.isArray(r.data) ? r.data.map(w => w.name) : [])).catch(() => []),
      API.get("/roster/wards").then(r => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
    ]).then(([managed, roster]) => {
      const merged = [...new Set([...managed, ...roster])].sort();
      setWards(merged);
    });
  }, []);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      if (rosterWard.trim()) params.append("ward", rosterWard.trim());
      const { data } = await API.get(`/roster/all?${params.toString()}`);
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

  const updateDateAt = (index, value) => {
    setForm((prev) => ({
      ...prev,
      dates: prev.dates.map((d, i) => (i === index ? value : d)),
    }));
  };

  const addDateInput = () => {
    setForm((prev) => ({ ...prev, dates: [...prev.dates, emptyDay] }));
  };

  const removeDateInput = (index) => {
    setForm((prev) => {
      if (prev.dates.length === 1) return prev;
      return { ...prev, dates: prev.dates.filter((_, i) => i !== index) };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const cleanedDays = [
      ...new Set(form.dates.map((d) => d.trim()).filter(Boolean)),
    ];

    const invalidDay = cleanedDays.find((d) => {
      const day = Number(d);
      return !Number.isInteger(day) || day < 1 || day > dayOptions.length;
    });

    if (
      !form.nurse ||
      !form.ward.trim() ||
      !form.month ||
      cleanedDays.length === 0
    ) {
      setMsg({
        type: "error",
        text: "Nurse, ward, month, and at least one duty day are required.",
      });
      return;
    }
    if (invalidDay) {
      setMsg({
        type: "error",
        text: "Please select valid duty days for the selected month.",
      });
      return;
    }

    const cleanedDates = cleanedDays.map(
      (day) => `${form.month}-${String(Number(day)).padStart(2, "0")}`,
    );

    setSubmitting(true);
    try {
      const payload = { ...form, ward: form.ward.trim(), dates: cleanedDates };
      const { data } = await API.post("/roster/bulk", payload);
      const successText = data?.skippedCount
        ? `Created ${data.createdCount} duties. Skipped ${data.skippedCount} duplicate date(s).`
        : `Created ${data?.createdCount || 0} duties successfully.`;
      setMsg({ type: "success", text: successText });
      setForm({
        nurse: "",
        ward: "",
        dates: [emptyDay],
        shift: "7AM-1PM",
        month: "",
      });
      fetchRoster();
      // Refresh ward list after creating roster entries
      Promise.all([
        API.get("/wards").then(r => (Array.isArray(r.data) ? r.data.map(w => w.name) : [])).catch(() => []),
        API.get("/roster/wards").then(r => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
      ]).then(([managed, roster]) => {
        const merged = [...new Set([...managed, ...roster])].sort();
        setWards(merged);
      });
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to create roster entries.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHospitalChange = (hosp) => {
    setSelectedHospital(hosp);
    setForm(prev => ({ ...prev, nurse: "", ward: "" }));
  };

  const handleNurseChange = (nurseId) => {
    const nurse = nurses.find((n) => n._id === nurseId);
    setForm((prev) => ({
      ...prev,
      nurse: nurseId,
      ward: (nurse?.ward || "").trim(),
    }));
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({ title: "Delete Entry", message: "Are you sure you want to delete this roster entry? This action cannot be undone.", confirmText: "Delete Entry" });
    if (!isConfirmed) return;
    try {
      await API.delete(`/roster/${id}`);
      fetchRoster();
      notify.success("Roster entry deleted.");
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to delete roster entry.",
      );
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.35s ease" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .roster-grid-wrap {
          overflow-x: auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          margin-top: 16px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .roster-grid {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
          font-size: 0.82rem;
        }
        .roster-grid th, .roster-grid td {
          border-bottom: 1px solid var(--border);
          border-right: 1px solid var(--border);
          padding: 10px;
          text-align: center;
          min-width: 44px;
        }
        .roster-grid th {
          background: rgba(15,23,42,0.6);
          color: var(--text2);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.05em;
        }
        .roster-grid .sticky-col {
          position: sticky;
          left: 0;
          background: #0f172a;
          z-index: 10;
          min-width: 180px;
          text-align: left;
          border-right: 2px solid var(--border);
          font-weight: 600;
          color: var(--text);
        }
        .shift-marker {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.1s;
          position: relative;
        }
        .shift-marker:hover { transform: scale(1.15); z-index: 5; }
        .shift-marker .del-btn {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 14px;
          height: 14px;
          background: #ef4444;
          color: #fff;
          border-radius: 50%;
          font-size: 8px;
          display: none;
          align-items: center;
          justify-content: center;
          border: 1px solid #fff;
        }
        .shift-marker:hover .del-btn { display: flex; }
        
        .legend-grid {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding: 14px 20px;
          background: rgba(30,41,59,0.4);
          border-radius: 12px;
          border: 1px dashed var(--border);
        }
        .legend-item { display: flex; alignItems: center; gap: 8px; font-size: 0.75rem; color: var(--text2); }
        .legend-box { width: 14px; height: 14px; border-radius: 3px; }
      `}</style>
      <div className="page-header">
        <div>
          <div className="page-title">📅 Roster Management</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setTab(tab === "view" ? "create" : "view")}
        >
          {tab === "view" ? "+ Add Entry" : "← View Roster"}
        </button>
      </div>

      {tab === "create" && (
        <div className="card">
          <div className="section-title">
            Create Roster Duties (Multiple Dates)
          </div>
          {msg.text && (
            <div
              className={`alert alert-${msg.type === "error" ? "error" : "success"}`}
            >
              {msg.text}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hospital *</label>
                <select
                  className="form-select"
                  value={selectedHospital}
                  onChange={(e) => handleHospitalChange(e.target.value)}
                >
                  <option value="">-- All Hospitals --</option>
                  {hospitals.map((h) => (
                    <option key={h._id} value={h.name}>{h.name}</option>
                  ))}
                </select>
                <div className="form-hint" style={{ marginTop: 4 }}>
                  Select hospital first to filter nurses.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nurse *</label>
                <select
                  className="form-select"
                  value={form.nurse}
                  onChange={(e) => handleNurseChange(e.target.value)}
                  disabled={!selectedHospital && nurses.filter(n => !selectedHospital || n.hospital === selectedHospital).length > 20}
                >
                  <option value="">-- Select Nurse --</option>
                  {nurses
                    .filter((n) => !selectedHospital || n.hospital === selectedHospital)
                    .map((n) => (
                      <option key={n._id} value={n._id}>
                        {n.name} {n.ward ? `[Ward: ${n.ward}]` : ""}
                      </option>
                    ))}
                </select>
                {!selectedHospital && (
                  <div className="form-hint" style={{ marginTop: 4, color: 'var(--warning)' }}>
                    Filter by hospital for a cleaner list.
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assigned Ward *</label>
                <select
                  className="form-select"
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  disabled={Boolean(selectedNurseWard)}
                >
                  <option value="">— Select Ward —</option>
                  {wards.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                {selectedNurseWard ? (
                  <div className="form-hint" style={{ marginTop: 6, color: '#34d399', fontWeight: 600 }}>
                    ✓ Linked to nurse's profile.
                  </div>
                ) : (
                  <div className="form-hint" style={{ marginTop: 6 }}>
                    Select manually if not in nurse profile.
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Roster Month *</label>
                <input
                  className="form-input"
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label">Shift Type *</label>
                <select
                  className="form-select"
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                >
                  {SHIFTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                 <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text3)' }}>
                    ℹ️ You can select multiple days for this shift in one go.
                 </div>
              </div>
            </div>

            <div 
              style={{ 
                marginTop: 24, 
                padding: 24, 
                background: 'rgba(15,23,42,0.3)', 
                borderRadius: 16, 
                border: '1px solid var(--border)' 
              }}
            >
              <label className="form-label" style={{ marginBottom: 16, display: 'block', fontSize: '0.9rem', fontWeight: 700 }}>
                📅 Duty Date/s (Select multiple days)
              </label>
              
              {!form.month && (
                <div className="alert alert-warning" style={{ fontSize: '0.8rem', padding: '10px 14px' }}>
                  Please select the **Roster Month** above to enable date selection.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {form.dates.map((dayValue, index) => (
                  <div
                    key={index}
                    className="flex gap-2"
                    style={{ alignItems: 'center' }}
                  >
                    <select
                      className="form-select"
                      value={dayValue}
                      onChange={(e) => updateDateAt(index, e.target.value)}
                      disabled={!form.month}
                    >
                      <option value="">Day</option>
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    {form.dates.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '8px 12px' }}
                        onClick={() => removeDateInput(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginTop: 16, borderColor: 'rgba(148,163,184,0.3)' }}
                onClick={addDateInput}
                disabled={!form.month}
              >
                + Add Another Date
              </button>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
                style={{ minWidth: 160, height: 46, fontSize: '1rem' }}
              >
                {submitting ? "Creating..." : "✓ Create Roster Duties"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "view" && (
        <>
          <div className="filter-bar" style={{ gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              <select
                className="form-select"
                style={{ width: 180 }}
                value={rosterWard}
                onChange={(e) => setRosterWard(e.target.value)}
              >
                <option value="">All Wards</option>
                {wards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              <input
                type="month"
                className="form-input"
                style={{ width: 160 }}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            
            <div className="legend-grid" style={{ 
              marginTop: 0, 
              padding: '12px 20px', 
              background: 'rgba(15,23,42,0.6)', 
              border: '1px solid var(--border)',
              borderRadius: '12px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '0.05em' }}>Legend:</span>
              {Object.entries(SHIFT_MAP).map(([key, cfg]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: 6, 
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800
                  }}>
                    {cfg.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
                      {cfg.title.split(' (')[0]}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 500 }}>
                      {key}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0, padding: '10px 16px', fontSize: '0.85rem' }}>
             📅 {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })} Roster View 
             {rosterWard.trim() ? ` — Filtered by: ${rosterWard.trim()}` : ""}
          </div>

          {loading ? (
            <div className="loading-center" style={{ minHeight: 300 }}>
              <div className="spinner" />
            </div>
          ) : roster.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 320 }}>
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-text">
                No roster entries found for this month/ward.
              </div>
            </div>
          ) : (
            <div className="roster-grid-wrap">
              <table className="roster-grid">
                <thead>
                  <tr>
                    <th className="sticky-col">Nurse Name</th>
                    {getDaysInMonth(month).map(d => (
                      <th key={d}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grouped = {};
                    roster.forEach(r => {
                      const name = r.nurse?.name || r.nurseName || "Unknown Nurse";
                      if (!grouped[name]) grouped[name] = {};
                      const day = parseInt(r.date.split('-').pop());
                      grouped[name][day] = r;
                    });

                    return Object.entries(grouped).sort().map(([name, days]) => (
                      <tr key={name}>
                        <td className="sticky-col">{name}</td>
                        {getDaysInMonth(month).map(d => {
                          const entry = days[parseInt(d)];
                          const cfg = entry ? SHIFT_MAP[entry.shift] : null;
                          return (
                            <td key={d}>
                              {entry && cfg ? (
                                <div 
                                  className="shift-marker" 
                                  title={`${cfg.title}\nWard: ${entry.ward}`}
                                  style={{ background: cfg.bg, color: cfg.color, border: `1.1px solid ${cfg.border}` }}
                                >
                                  {cfg.label}
                                  <div className="del-btn" onClick={() => handleDelete(entry._id)}>✕</div>
                                </div>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
