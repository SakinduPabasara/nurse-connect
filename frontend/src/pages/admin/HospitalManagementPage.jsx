import { useState, useEffect } from "react";
import API from "../../api/axios";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";

const HospitalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
    <path d="M10 9h4" />
    <path d="M12 7v4" />
  </svg>
);

export default function HospitalManagementPage() {
  const confirm = useConfirm();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({ name: "", location: "", description: "" });
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/hospitals");
      setHospitals(data);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      notify.error("Hospital name is required.");
      return;
    }
    setSubmitting(true);
    try {
      if (editTarget) {
        await API.put(`/hospitals/${editTarget._id}`, form);
        notify.success("Hospital updated successfully.");
      } else {
        await API.post("/hospitals", form);
        notify.success("Hospital added successfully.");
      }
      setForm({ name: "", location: "", description: "" });
      setEditTarget(null);
      setTab("list");
      fetchHospitals();
    } catch (err) {
      notify.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (h) => {
    setEditTarget(h);
    setForm({ name: h.name, location: h.location || "", description: h.description || "" });
    setTab("add");
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Remove Hospital",
      message: "Are you sure you want to remove this hospital? This might affect nurses already registered under this hospital.",
      confirmText: "Delete Hospital",
    });
    if (!isConfirmed) return;

    try {
      await API.delete(`/hospitals/${id}`);
      notify.success("Hospital removed.");
      fetchHospitals();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete.");
    }
  };

  const toggleActive = async (h) => {
    try {
      await API.put(`/hospitals/${h._id}`, { isActive: !h.isActive });
      fetchHospitals();
      notify.success(`Hospital ${h.isActive ? "deactivated" : "activated"}.`);
    } catch {
      notify.error("Failed to update status.");
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.3s ease" }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .hsp-row:hover td { background: rgba(255,255,255,0.02); }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'rgba(37,99,235,0.1)', color: '#3b82f6', borderRadius: 10 }}>
              <HospitalIcon />
            </div>
            Hospital Management
          </div>
          <div className="page-subtitle">Configure healthcare facilities available in the system</div>
        </div>
        <button
          className={tab === "list" ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => {
            setTab(tab === "list" ? "add" : "list");
            if (tab === "add") { setEditTarget(null); setForm({ name: "", location: "", description: "" }); }
          }}
        >
          {tab === "list" ? "+ Add Facility" : "← Back to List"}
        </button>
      </div>

      {tab === "add" ? (
        <div className="card" style={{ maxWidth: 600, margin: '20px auto 0' }}>
          <div className="section-title" style={{ marginBottom: 24 }}>
            {editTarget ? "🏥 Edit Hospital Details" : "🏥 Register New Hospital"}
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Full Hospital Name *</label>
              <input
                className="form-input"
                placeholder="e.g. National Hospital of Sri Lanka"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location / City</label>
              <input
                className="form-input"
                placeholder="e.g. Colombo 07"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Internal Description (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Provide details about the facility..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="mobile-stack" style={{ display:'flex', gap:10, marginTop:10 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? "Processing..." : editTarget ? "Update Facility" : "Create Facility"}
              </button>
              {editTarget && (
                 <button className="btn btn-outline" type="button" onClick={() => { setTab("list"); setEditTarget(null); setForm({ name:"", location:"", description:"" }); }}>
                    Cancel
                 </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : hospitals.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 20 }}>🏥</div>
              <div className="empty-state-text" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>No hospitals registered</div>
              <div style={{ color: 'var(--text3)', fontSize: '0.9rem', maxWidth: 300, margin: '0 auto' }}>Add your first healthcare facility to start registering staff.</div>
              <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setTab("add")}>+ Add New Hospital</button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hospital Name</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map((h) => (
                      <tr key={h._id} className="hsp-row">
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:h.isActive ? 'rgba(37,99,235,0.1)' : 'rgba(148,163,184,0.1)', color:h.isActive ? '#3b82f6' : 'var(--text4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>🏥</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize:'0.9rem', color: h.isActive ? 'var(--text)' : 'var(--text3)' }}>{h.name}</div>
                              {h.description && <div style={{ fontSize:'0.75rem', color:'var(--text4)', maxWidth: 200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={h.description}>{h.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ color:'var(--text2)', fontSize:'0.85rem' }}>{h.location || "—"}</td>
                        <td>
                          <button
                            onClick={() => toggleActive(h)}
                            style={{
                              padding: '2px 10px', borderRadius: 999, border: '1px solid transparent',
                              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                              background: h.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: h.isActive ? '#4ade80' : '#f87171',
                              borderColor: h.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                            }}
                          >
                            {h.isActive ? "● Active" : "○ Inactive"}
                          </button>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-warning btn-sm" onClick={() => handleEditInit(h)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(h._id)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
          )}
        </>
      )}
    </div>
  );
}
