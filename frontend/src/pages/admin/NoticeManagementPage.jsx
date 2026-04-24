import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import SearchableSelect from "../../components/SearchableSelect";

const CATS = ["circular", "training", "guideline", "alert"];

export default function NoticeManagementPage() {
  const confirm = useConfirm();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "circular",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/notices");
      setNotices(data);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!form.title || !form.content) {
      setMsg({ type: "error", text: "Title and content required." });
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/notices", form);
      setMsg({
        type: "success",
        text: "Notice posted! All nurses notified automatically.",
      });
      setForm({ title: "", content: "", category: "circular" });
      fetchNotices();
      setTab("list");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({ title: "Delete Notice", message: "Are you sure you want to delete this notice? This action cannot be undone.", confirmText: "Delete Notice" });
    if (!isConfirmed) return;
    try {
      await API.delete(`/notices/${id}`);
      fetchNotices();
      notify.success("Notice deleted.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete notice.");
    }
  };

  const catColor = {
    circular: "badge-blue",
    training: "badge-green",
    guideline: "badge-cyan",
    alert: "badge-red",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📋 Notice Board Management</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setTab(tab === "list" ? "new" : "list")}
        >
          {tab === "list" ? "+ Post Notice" : "← Back"}
        </button>
      </div>

      {tab === "new" && (
        <div className="card">
          <div className="section-title">Post New Notice</div>
          <div className="alert alert-info">
            📢 This notice will automatically send a notification to all nurses.
          </div>
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
              <label className="form-label">Content *</label>
              <textarea
                className="form-textarea"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <SearchableSelect
                options={CATS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
                value={form.category}
                onChange={(val) => setForm({ ...form, category: val })}
                placeholder="Select Category..."
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Post Notice"}
            </button>
          </form>
        </div>
      )}

      {tab === "list" &&
        (loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : notices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No notices yet.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notices.map((n) => (
              <div key={n._id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    <div
                      className="text-muted text-sm"
                      style={{ marginTop: 4 }}
                    >
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span
                      className={`badge ${catColor[n.category] || "badge-gray"}`}
                    >
                      {n.category}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(n._id)}
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
