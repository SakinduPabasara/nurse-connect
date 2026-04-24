import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";

const CATS = ["guideline", "protocol", "training", "reference", "other"];
const catColor = {
  guideline: "badge-blue",
  protocol: "badge-cyan",
  training: "badge-green",
  reference: "badge-yellow",
  other: "badge-gray",
};

export default function DocumentsManagementPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "guideline",
    fileUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/documents");
      setDocs(data);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!form.title.trim()) {
      setMsg({ type: "error", text: "Title is required." });
      return;
    }
    if (!selectedFile && !form.fileUrl.trim()) {
      setMsg({
        type: "error",
        text: "Upload a file or provide a document URL.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("category", form.category);
      if (form.fileUrl.trim()) payload.append("fileUrl", form.fileUrl.trim());
      if (selectedFile) payload.append("file", selectedFile);

      await API.post("/documents", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg({ type: "success", text: "Document uploaded!" });
      setForm({
        title: "",
        description: "",
        category: "guideline",
        fileUrl: "",
      });
      setSelectedFile(null);
      setFileInputKey((k) => k + 1);
      fetchDocs();
      setTab("list");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete document?")) return;
    try {
      await API.delete(`/documents/${id}`);
      fetchDocs();
      notify.success("Document deleted.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete document.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📁 Document Library Management</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setTab(tab === "list" ? "add" : "list")}
        >
          {tab === "list" ? "+ Add Document" : "← Back"}
        </button>
      </div>

      {tab === "add" && (
        <div className="card">
          <div className="section-title">Add Document</div>
          <div className="alert alert-info">
            Upload file formats: PDF, Word, Excel, PowerPoint, TXT (max 10 MB).
            URL is optional when uploading a file.
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
              <label className="form-label">Description</label>
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
                <label className="form-label">File URL (Optional)</label>
                <input
                  className="form-input"
                  value={form.fileUrl}
                  onChange={(e) =>
                    setForm({ ...form, fileUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Upload Document File (Optional)
              </label>
              <input
                key={fileInputKey}
                className="form-input"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile ? (
                <div className="text-muted text-sm" style={{ marginTop: 8 }}>
                  Selected: {selectedFile.name}
                </div>
              ) : null}
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Add Document"}
            </button>
          </form>
        </div>
      )}

      {tab === "list" &&
        (loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <div className="empty-state-text">No documents.</div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Source</th>
                    <th>Description</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <strong>{d.title}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${catColor[d.category] || "badge-gray"}`}
                        >
                          {d.category}
                        </span>
                      </td>
                      <td className="text-muted text-sm">
                        {d.fileName
                          ? `Uploaded file (${d.fileName})`
                          : "URL link"}
                      </td>
                      <td className="text-muted text-sm">
                        {d.description?.slice(0, 60)}
                        {d.description?.length > 60 ? "..." : ""}
                      </td>
                      <td className="text-muted text-sm">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                          >
                            Open
                          </a>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(d._id)}
                          >
                            Delete
                          </button>
                        </div>
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
