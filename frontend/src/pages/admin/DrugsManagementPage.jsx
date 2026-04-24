import { useState, useEffect } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";

export default function DrugsManagementPage() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({
    name: "",
    ward: "",
    quantity: "",
    unit: "tablets",
    expiryDate: "",
  });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ quantity: "", expiryDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/drugs");
      setDrugs(data);
    } catch {
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDrugs();
    API.get("/wards").then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!form.name || !form.ward || !form.quantity || !form.expiryDate) {
      setMsg({ type: "error", text: "All fields required." });
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/drugs", { ...form, quantity: Number(form.quantity) });
      setMsg({ type: "success", text: "Drug added!" });
      setForm({
        name: "",
        ward: "",
        quantity: "",
        unit: "tablets",
        expiryDate: "",
      });
      fetchDrugs();
      setTab("list");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await API.put(`/drugs/${id}`, {
        quantity: Number(editData.quantity),
        expiryDate: editData.expiryDate,
      });
      setEditId(null);
      fetchDrugs();
      notify.success("Drug updated.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to update drug.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete drug?")) return;
    try {
      await API.delete(`/drugs/${id}`);
      fetchDrugs();
      notify.success("Drug deleted.");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to delete drug.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">💊 Drug Inventory Management</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setTab(tab === "list" ? "add" : "list")}
        >
          {tab === "list" ? "+ Add Drug" : "← Back"}
        </button>
      </div>

      {tab === "add" && (
        <div className="card">
          <div className="section-title">Add Drug</div>
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
                <label className="form-label">Drug Name *</label>
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
                <label className="form-label">Quantity *</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-select"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {[
                    "tablets",
                    "capsules",
                    "ml",
                    "mg",
                    "units",
                    "vials",
                    "ampoules",
                  ].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date *</label>
              <input
                className="form-input"
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Drug"}
            </button>
          </form>
        </div>
      )}

      {tab === "list" &&
        (loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : drugs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💊</div>
            <div className="empty-state-text">No drugs in inventory.</div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Drug</th>
                    <th>Ward</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <strong>{d.name}</strong>
                      </td>
                      <td>{d.ward}</td>
                      <td>
                        {editId === d._id ? (
                          <input
                            className="form-input"
                            style={{ width: 80 }}
                            type="number"
                            value={editData.quantity}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                quantity: e.target.value,
                              })
                            }
                          />
                        ) : (
                          d.quantity
                        )}
                      </td>
                      <td>{d.unit}</td>
                      <td>
                        {editId === d._id ? (
                          <input
                            className="form-input"
                            type="date"
                            value={editData.expiryDate}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                expiryDate: e.target.value,
                              })
                            }
                          />
                        ) : (
                          new Date(d.expiryDate).toLocaleDateString()
                        )}
                      </td>
                      <td>
                        {editId === d._id ? (
                          <div className="flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdate(d._id)}
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
                                setEditId(d._id);
                                setEditData({
                                  quantity: d.quantity,
                                  expiryDate: d.expiryDate?.split("T")[0] || "",
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(d._id)}
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
