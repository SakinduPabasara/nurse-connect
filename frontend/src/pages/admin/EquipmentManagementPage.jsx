import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";

const STATUSES = ["available", "maintenance", "unavailable"];
const statusColor = {
  available: "badge-green",
  maintenance: "badge-yellow",
  unavailable: "badge-red",
};

export default function EquipmentManagementPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({
    name: "",
    ward: "",
    status: "available",
    lastMaintenance: "",
  });
  const [editId, setEditId] = useState(null);
  const [editStatus, setEditStatus] = useState("available");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchEq = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/equipment");
      setEquipment(data);
    } catch {
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEq();
    API.get("/wards").then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!form.name || !form.ward) {
      setMsg({ type: "error", text: "Name and ward required." });
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/equipment", form);
      setMsg({ type: "success", text: "Equipment added!" });
      setForm({ name: "", ward: "", status: "available", lastMaintenance: "" });
      fetchEq();
      setTab("list");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id) => {
    try {
      await API.put(`/equipment/${id}`, { status: editStatus });
      setEditId(null);
      fetchEq();
      notify.success("Equipment status updated.");
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to update equipment status.",
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete equipment?")) return;
    try {
      await API.delete(`/equipment/${id}`);
      fetchEq();
      notify.success("Equipment deleted.");
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to delete equipment.",
      );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🔧 Equipment Management</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setTab(tab === "list" ? "add" : "list")}
        >
          {tab === "list" ? "+ Add Equipment" : "← Back"}
        </button>
      </div>

      {tab === "add" && (
        <div className="card">
          <div className="section-title">Add Equipment</div>
          {msg.text && (
            <div
              className={`alert alert-${msg.type === "error" ? "error" : "success"}`}
            >
              {msg.text}
            </div>
          )}
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Equipment Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ward *</label>
                <select
                  className="form-select"
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                >
                  <option value="">— Select Ward —</option>
                  {wards.map((w) => (
                    <option key={w._id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Last Maintenance</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.lastMaintenance}
                  onChange={(e) =>
                    setForm({ ...form, lastMaintenance: e.target.value })
                  }
                />
              </div>
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Equipment"}
            </button>
          </form>
        </div>
      )}

      {tab === "list" &&
        (loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : equipment.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <div className="empty-state-text">No equipment.</div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Ward</th>
                    <th>Status</th>
                    <th>Last Maintenance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((e) => (
                    <tr key={e._id}>
                      <td>
                        <strong>{e.name}</strong>
                      </td>
                      <td>{e.ward}</td>
                      <td>
                        {editId === e._id ? (
                          <select
                            className="form-select"
                            style={{ width: "auto" }}
                            value={editStatus}
                            onChange={(x) => setEditStatus(x.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`badge ${statusColor[e.status] || "badge-gray"}`}
                          >
                            {e.status}
                          </span>
                        )}
                      </td>
                      <td>
                        {e.lastMaintenance
                          ? new Date(e.lastMaintenance).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {editId === e._id ? (
                          <div className="flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateStatus(e._id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setEditId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => {
                                setEditId(e._id);
                                setEditStatus(e.status);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(e._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}
