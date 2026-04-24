import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";

const SHIFTS = ["7AM-1PM", "1PM-7PM", "7AM-7PM", "7PM-7AM"];
const shiftColor = (s) =>
  s === "7PM-7AM"
    ? "badge-cyan"
    : s === "7AM-7PM"
      ? "badge-yellow"
      : "badge-blue";
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
    try {
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      if (rosterWard.trim()) params.append("ward", rosterWard.trim());
      const { data } = await API.get(`/roster/all?${params.toString()}`);
      setRoster(data);
    } catch {
      setRoster([]);
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

  const handleNurseChange = (nurseId) => {
    const nurse = nurses.find((n) => n._id === nurseId);
    setForm((prev) => ({
      ...prev,
      nurse: nurseId,
      ward: (nurse?.ward || "").trim(),
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
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
    <div>
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
            <div className="form-group">
              <label className="form-label">Select Nurse *</label>
              <select
                className="form-select"
                value={form.nurse}
                onChange={(e) => handleNurseChange(e.target.value)}
              >
                <option value="">-- Select Nurse --</option>
                {nurses.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.name} ({n.hospital}) {n.ward ? `- ${n.ward}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ward *</label>
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
                  <div className="form-hint" style={{ marginTop: 8 }}>
                    Auto-filled from selected nurse profile.
                  </div>
                ) : null}
              </div>
              <div className="form-group">
                <label className="form-label">Month *</label>
                <input
                  className="form-input"
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Shift *</label>
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
            </div>

            <div className="form-group">
              <label className="form-label">Duty Date/s (Day Only) *</label>
              {!form.month && (
                <div className="form-hint" style={{ marginBottom: 8 }}>
                  Select month first to choose day numbers.
                </div>
              )}
              {form.dates.map((dayValue, index) => (
                <div
                  key={index}
                  className="flex gap-2"
                  style={{ marginBottom: 10 }}
                >
                  <select
                    className="form-select"
                    value={dayValue}
                    onChange={(e) => updateDateAt(index, e.target.value)}
                    disabled={!form.month}
                  >
                    <option value="">Select day</option>
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
                      onClick={() => removeDateInput(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addDateInput}
              >
                + Add Another Date
              </button>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Duties"}
            </button>
          </form>
        </div>
      )}

      {tab === "view" && (
        <>
          <div className="filter-bar">
            <select
              className="form-select"
              style={{ minWidth: 180 }}
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
              style={{ width: "auto" }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="alert alert-info">
            Viewing all rosters
            {rosterWard.trim() ? ` filtered by ward: ${rosterWard.trim()}` : ""}
            .
          </div>
          {roster.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-text">
                No roster entries for the selected filters.
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nurse</th>
                      <th>Date</th>
                      <th>Shift</th>
                      <th>Ward</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((r) => (
                      <tr key={r._id}>
                        <td>
                          {r.nurse?.name || r.nurseName || "Deleted user"}
                        </td>
                        <td>{r.date}</td>
                        <td>
                          <span className={`badge ${shiftColor(r.shift)}`}>
                            {r.shift}
                          </span>
                        </td>
                        <td>{r.ward}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(r._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
