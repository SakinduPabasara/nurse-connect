import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";

export default function WardManagementPage() {
  const confirm = useConfirm();
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: "", description: "" });
  useToastMessage(msg);

  const fetchWards = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/wards");
      setWards(data);
    } catch {
      setWards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWards(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!form.name.trim()) {
      setMsg({ type: "error", text: "Ward name is required." });
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/wards", form);
      setMsg({ type: "success", text: `Ward "${form.name.trim()}" added!` });
      setForm({ name: "", description: "" });
      fetchWards();
      setTab("list");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add ward." });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (ward) => {
    setEditId(ward._id);
    setEditData({ name: ward.name, description: ward.description || "" });
  };

  const handleUpdate = async (id) => {
    if (!editData.name.trim()) {
      notify.error("Ward name cannot be empty.");
      return;
    }
    try {
      await API.put(`/wards/${id}`, editData);
      setEditId(null);
      fetchWards();
      notify.success("Ward updated.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to update ward.");
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({ title: "Delete Ward", message: `Are you sure you want to delete ward "${name}"? This cannot be undone.`, confirmText: "Delete Ward" });
    if (!isConfirmed) return;
    try {
      await API.delete(`/wards/${id}`);
      fetchWards();
      notify.success("Ward deleted.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete ward.");
    }
  };

  return (
    <div>
      <style>{`
        .ward-chip {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2);
          border-radius: 10px; padding: 6px 12px;
          font-size: 0.82rem; color: var(--text);
        }
        .ward-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
        }
        .ward-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s;
        }
        .ward-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          border-color: rgba(37,99,235,0.3);
        }
        .ward-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.15));
          border: 1px solid rgba(37,99,235,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
        }
        .ward-edit-input {
          background: rgba(15,23,42,0.6);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 7px 10px;
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
        }
        .ward-edit-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">🏥 Ward Management</div>
          <div className="page-subtitle">
            {wards.length} ward{wards.length !== 1 ? "s" : ""} configured in the system
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setTab(tab === "list" ? "add" : "list")}
        >
          {tab === "list" ? "+ Add Ward" : "← Back to Wards"}
        </button>
      </div>

      {/* Add Ward Form */}
      {tab === "add" && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="section-title" style={{ marginBottom: 20 }}>Add New Ward</div>
          {msg.text && (
            <div className={`alert alert-${msg.type === "error" ? "error" : "success"}`}>
              {msg.text}
            </div>
          )}
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Ward Name *</label>
              <input
                className="form-input"
                placeholder="e.g. ICU, Ward A, Maternity..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input
                className="form-input"
                placeholder="Brief description of the ward..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "✓ Add Ward"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setTab("list"); setMsg({ type: "", text: "" }); setForm({ name: "", description: "" }); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ward List */}
      {tab === "list" && (
        loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : wards.length === 0 ? (
          <div className="empty-state" style={{ padding: "70px 20px" }}>
            <div className="empty-state-icon">🏥</div>
            <div className="empty-state-text" style={{ fontWeight: 600 }}>No wards configured yet</div>
            <div style={{ color: "var(--text3)", fontSize: "0.875rem", marginTop: 8 }}>
              Add wards so nurses can select them during registration
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => setTab("add")}>
              + Add First Ward
            </button>
          </div>
        ) : (
          <div className="ward-grid">
            {wards.map((ward) => (
              <div key={ward._id} className="ward-card">
                {editId === ward._id ? (
                  /* ── Edit Mode ── */
                  <>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Editing Ward
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: "0.75rem" }}>Ward Name *</label>
                      <input
                        className="ward-edit-input"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        autoFocus
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: "0.75rem" }}>Description</label>
                      <input
                        className="ward-edit-input"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleUpdate(ward._id)}>
                        Save
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── View Mode ── */
                  <>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                      <div className="ward-icon">🏥</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", marginBottom: 3, wordBreak: "break-word" }}>
                          {ward.name}
                        </div>
                        {ward.description && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text3)", lineHeight: 1.5, wordBreak: "break-word" }}>
                            {ward.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8 }}>
                         <span style={{ fontSize: '10px' }}>👥</span>
                         <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>{ward.userCount || 0} Nurses</span>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text4)", fontWeight: 500 }}>
                        {ward.createdAt ? `Joined ${new Date(ward.createdAt).toLocaleDateString()}` : "—"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => startEdit(ward)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(ward._id, ward.name)}
                        >
                          Delete
                        </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
