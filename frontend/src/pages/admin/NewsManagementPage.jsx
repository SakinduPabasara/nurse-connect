import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";

const CATS = ["healthcare", "policy", "professional", "industry"];

export default function NewsManagementPage() {
  const confirm = useConfirm();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "healthcare",
    source: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/news");
      setNews(data);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchNews();
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
      await API.post("/news", form);
      setMsg({
        type: "success",
        text: "News article posted! All nurses notified.",
      });
      setForm({ title: "", content: "", category: "healthcare", source: "" });
      fetchNews();
      setTab("list");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({ title: "Delete Article", message: "Are you sure you want to delete this article? This action cannot be undone.", confirmText: "Delete Article" });
    if (!isConfirmed) return;
    try {
      await API.delete(`/news/${id}`);
      fetchNews();
      notify.success("News article deleted.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete article.");
    }
  };

  const catColor = {
    healthcare: "badge-green",
    policy: "badge-blue",
    professional: "badge-cyan",
    industry: "badge-yellow",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📰 Healthcare News Management</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setTab(tab === "list" ? "new" : "list")}
        >
          {tab === "list" ? "+ Post Article" : "← Back"}
        </button>
      </div>

      {tab === "new" && (
        <div className="card">
          <div className="section-title">Post News Article</div>
          <div className="alert alert-info">
            📢 This article will automatically notify all nurses.
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
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Source</label>
                <input
                  className="form-input"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="e.g. WHO Website"
                />
              </div>
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Post Article"}
            </button>
          </form>
        </div>
      )}

      {tab === "list" &&
        (loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : news.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <div className="empty-state-text">No news articles.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {news.map((n) => (
              <div key={n._id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    <div
                      className="text-muted text-sm"
                      style={{ marginTop: 4 }}
                    >
                      {n.source && `Source: ${n.source} • `}
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
