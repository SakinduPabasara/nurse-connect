import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import * as Ic from "../../components/icons";
import SearchableSelect from "../../components/SearchableSelect";

export default function WardManagementPage() {
  const confirm = useConfirm();
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({ hospital: "", name: "", description: "" });
  const [hospitals, setHospitals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    hospital: "",
  });
  const [hospitalFilter, setHospitalFilter] = useState("all");
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

  useEffect(() => {
    fetchWards();
    API.get("/hospitals")
      .then((r) => setHospitals(r.data))
      .catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.hospital) {
      notify.error("Hospital selection required.");
      return;
    }
    if (!form.name.trim()) {
      notify.error("Scientific ward designation required.");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/wards", form);
      notify.success(`Ward "${form.name.trim()}" commissioned.`);
      setForm({ hospital: "", name: "", description: "" });
      fetchWards();
      setTab("list");
    } catch (err) {
      notify.error(err.response?.data?.message || "Commissioning failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editData.name.trim()) {
      notify.error("Scientific name cannot be null.");
      return;
    }
    try {
      await API.put(`/wards/${id}`, editData);
      setEditId(null);
      fetchWards();
      notify.success("Configuration updated.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to reconfigure.");
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: "Decommission Ward",
      message: `Confirm decommissioning of "${name}"? This will displace all associated staff.`,
      confirmText: "Decommission",
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/wards/${id}`);
      fetchWards();
      notify.success("Ward decommissioned.");
    } catch (err) {
      notify.error("Decommissioning blocked.");
    }
  };

  const filteredWards = useMemo(() => {
    if (hospitalFilter === "all") return wards;
    return wards.filter((w) => w.hospital === hospitalFilter);
  }, [wards, hospitalFilter]);

  const stats = useMemo(
    () => ({
      total: filteredWards.length,
      totalStaff: filteredWards.reduce((s, w) => s + (w.userCount || 0), 0),
    }),
    [filteredWards],
  );

  return (
    <div
      className="ward-mgmt-container"
      style={{ animation: "fadeIn 0.4s ease" }}
    >
      <style>{`
        .ward-bento-grid {
           display: grid;
           grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
           gap: 20px;
           margin-top: 32px;
        }
        .ward-card-premium {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 24px;
           padding: 30px;
           position: relative;
           overflow: hidden;
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ward-card-premium:hover {
           transform: translateY(-6px) scale(1.01);
           border-color: var(--primary);
           box-shadow: 0 15px 40px rgba(0,0,0,0.25);
        }
        .staff-bubble {
           background: var(--bg3);
           padding: 6px 14px;
           border-radius: 12px;
           font-size: 0.75rem;
           font-weight: 700;
           display: flex;
           align-items: center;
           gap: 6px;
           color: var(--text2);
        }
        .ward-icon-box {
           width: 50px;
           height: 50px;
           border-radius: 16px;
           background: var(--primary-glow);
           display: flex;
           align-items: center;
           justify-content: center;
           color: var(--primary);
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
            Clinical Ward Configuration
          </div>
          <div className="page-subtitle">
            Spatial governance and staff density management across medical
            blocks
          </div>
        </div>

        <div className="mobile-stack" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {tab === "list" && (
            <div className="mobile-w-full" style={{ width: 220 }}>
              <SearchableSelect
                options={[
                  { value: "all", label: "All Hospitals" },
                  ...hospitals.map((h) => ({ value: h.name, label: h.name })),
                ]}
                value={hospitalFilter}
                onChange={setHospitalFilter}
                placeholder="Filter by Hospital"
              />
            </div>
          )}
          <div
            className="mini-stat"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "4px 16px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 42,
            }}
          >
            <Ic.User size={16} style={{ color: "var(--primary)" }} />
            <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
              {stats.totalStaff}{" "}
              <span style={{ fontWeight: 400, color: "var(--text3)" }}>
                Personnel
              </span>
            </div>
          </div>
          <button
            className={`btn ${tab === "add" ? "btn-outline" : "btn-primary"}`}
            style={{ borderRadius: 12, height: 42 }}
            onClick={() => setTab(tab === "list" ? "add" : "list")}
          >
            {tab === "list" ? "+ Commission" : "← Back"}
          </button>
        </div>
      </div>

      {tab === "add" ? (
        <div
          className="form-card-premium"
          style={{ maxWidth: 600, margin: "40px auto" }}
        >
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 24 }}>
            Commission Medical Ward
          </h3>
          <form onSubmit={handleAdd} style={{ display: "grid", gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Parent Hospital</label>
              <SearchableSelect
                options={hospitals.map((h) => ({
                  value: h.name,
                  label: h.name,
                }))}
                value={form.hospital}
                onChange={(val) => setForm({ ...form, hospital: val })}
                placeholder="Select Hospital"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Scientific Ward Designation</label>
              <input
                className="form-input"
                placeholder="e.g. Intensive Care Unit (ICU-01)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ background: "var(--bg2)", height: 48 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Clinical Scope / Description</label>
              <textarea
                className="form-input"
                placeholder="Primary medical focus and spatial capacity..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                style={{
                  background: "var(--bg2)",
                  minHeight: 100,
                  paddingTop: 12,
                }}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: "14px", borderRadius: 14, fontWeight: 700 }}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Commissioning..." : "Confirm Ward Activation"}
            </button>
          </form>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="ward-bento-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-card"
                  style={{ height: 240, borderRadius: 24 }}
                />
              ))}
            </div>
          ) : filteredWards.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 80 }}>
              <div style={{ fontSize: "3rem", opacity: 0.2, marginBottom: 20 }}>
                🏥
              </div>
              <div className="empty-state-text">
                No active medical wards found in the inventory
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 20 }}
                onClick={() => setTab("add")}
              >
                Start Commissioning
              </button>
            </div>
          ) : (
            <div className="ward-bento-grid">
              {filteredWards.map((w) => (
                <div key={w._id} className="ward-card-premium">
                  {editId === w._id ? (
                    <div style={{ display: "grid", gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Hospital</label>
                        <SearchableSelect
                          options={hospitals.map((h) => ({
                            value: h.name,
                            label: h.name,
                          }))}
                          value={editData.hospital}
                          onChange={(val) =>
                            setEditData({ ...editData, hospital: val })
                          }
                          placeholder="Select Hospital"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Ward Name</label>
                        <input
                          className="form-input"
                          value={editData.name}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          style={{ background: "var(--bg3)" }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          value={editData.description}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              description: e.target.value,
                            })
                          }
                          style={{ background: "var(--bg3)", minHeight: 80 }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdate(w._id)}
                        >
                          Apply
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 20,
                        }}
                      >
                        <div className="ward-icon-box">
                          <Ic.Hospital size={24} />
                        </div>
                        <div className="staff-bubble">
                          <Ic.User size={14} /> {w.userCount || 0} Registered
                          Staff
                        </div>
                      </div>

                      <h3
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          marginBottom: 4,
                        }}
                      >
                        {w.name}
                      </h3>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--primary)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 12,
                        }}
                      >
                        {w.hospital}
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text3)",
                          lineHeight: 1.6,
                          marginBottom: 24,
                          minHeight: 40,
                        }}
                      >
                        {w.description ||
                          "Global clinical block for general nurse deployment."}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: "1px solid var(--border)",
                          paddingTop: 20,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text3)",
                            fontWeight: 600,
                          }}
                        >
                          ID: {w._id.slice(-6).toUpperCase()}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setEditId(w._id);
                              setEditData({
                                name: w.name,
                                description: w.description || "",
                                hospital: w.hospital,
                              });
                            }}
                            style={{ color: "var(--text2)" }}
                          >
                            <Ic.Edit size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(w._id, w.name)}
                            style={{ color: "#f43f5e" }}
                          >
                            <Ic.Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
