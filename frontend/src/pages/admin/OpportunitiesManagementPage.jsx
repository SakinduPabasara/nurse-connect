import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";

const TYPES = ["international", "local", "training", "certification"];

export default function OpportunitiesManagementPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "international",
    location: "",
    deadline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/opportunities");
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!form.title || !form.description || !form.deadline) {
      setMsg({
        type: "error",
        text: "Title, description and deadline required.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/opportunities", form);
      setMsg({ type: "success", text: "Opportunity posted!" });
      setForm({
        title: "",
        description: "",
        type: "international",
        location: "",
        deadline: "",
      });
      fetchItems();
      setTab("list");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({ title: "Delete Opportunity", message: "Are you sure you want to delete this opportunity?", confirmText: "Delete" });
    if (!isConfirmed) return;
    try {
      await API.delete(`/opportunities/${id}`);
      fetchItems();
      notify.success("Opportunity deleted.");
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to delete opportunity.",
      );
    }
  };

  const typeColor = {
    international: "badge-cyan",
    local: "badge-green",
    training: "badge-blue",
    certification: "badge-yellow",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🌐 Opportunities Management</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setTab(tab === "list" ? "new" : "list")}
        >
          {tab === "list" ? "+ Post Opportunity" : "← Back"}
        </button>
      </div>

      {tab === "new" && (
        <div className="card">
          <div className="section-title">Post Opportunity</div>
          {msg.text && (
            <div
              className={`alert alert-${msg.type === "error" ? "error" : "success"}`}
            >
              {msg.text}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-textarea"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Dubai, UAE"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline *</label>
              <input
                className="form-input"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Post Opportunity"}
            </button>
          </form>
        </div>
      )}

      {tab === "list" &&
        (loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌐</div>
            <div className="empty-state-text">No opportunities posted.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((o) => (
              <div key={o._id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.title}</div>
                    <div
                      className="text-muted text-sm"
                      style={{ marginTop: 4 }}
                    >
                      {o.location && `📍 ${o.location} • `}⏰ Deadline:{" "}
                      {new Date(o.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span
                      className={`badge ${typeColor[o.type] || "badge-gray"}`}
                    >
                      {o.type}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(o._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
