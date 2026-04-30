import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import * as Ic from "../../components/icons";

const expiryInfo = (date) => {
  const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)', label: 'Expired', status: 'critical' };
  if (diff < 30) return { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)', label: `${Math.ceil(diff)}d left`, status: 'warning' };
  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Secure', status: 'safe' };
};

export default function DrugsManagementPage() {
  const confirm = useConfirm();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  
  const [form, setForm] = useState({
    hospital: "",
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

  const fetchDrugs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get("/drugs");
      setDrugs(Array.isArray(data) ? data : []);
    } catch {
      setDrugs([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
    API.get("/hospitals").then(r => setHospitals(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    API.get("/wards").then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const filteredWards = useMemo(() => {
    if (hospitalFilter === 'all') return wards;
    return wards.filter(w => w.hospital === hospitalFilter);
  }, [wards, hospitalFilter]);

  const formWards = useMemo(() => {
    if (!form.hospital) return [];
    return wards.filter(w => w.hospital === form.hospital);
  }, [wards, form.hospital]);

  useEffect(() => {
    setWardFilter("all");
  }, [hospitalFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: drugs.length,
      expiring: drugs.filter(d => {
        const diff = (new Date(d.expiryDate) - today) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff < 30;
      }).length,
      expired: drugs.filter(d => new Date(d.expiryDate) < today).length,
    };
  }, [drugs]);

  const filtered = useMemo(() => {
    return drugs.filter(d => {
      const matchSearch   = d.name.toLowerCase().includes(search.toLowerCase());
      const matchHospital = hospitalFilter === 'all' || d.hospital === hospitalFilter;
      const matchWard     = wardFilter === 'all' || d.ward === wardFilter;
      return matchSearch && matchHospital && matchWard;
    });
  }, [drugs, search, hospitalFilter, wardFilter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.hospital || !form.name || !form.ward || !form.quantity || !form.expiryDate) {
      notify.error("All inventory fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/drugs", { ...form, quantity: Number(form.quantity) });
      notify.success("Pharmaceutical stock registered.");
      setForm({ hospital: "", name: "", ward: "", quantity: "", unit: "tablets", expiryDate: "" });
      setIsDrawerOpen(false);
      fetchDrugs(true);
    } catch (err) {
      notify.error(err.response?.data?.message || "Operation failed.");
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
      fetchDrugs(true);
      notify.success("Stock level adjusted.");
    } catch (err) {
      notify.error("Failed to update stock.");
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({ 
      title: "Remove Medication", 
      message: "Are you sure you want to permanently remove this medication from the inventory? This cannot be undone.", 
      confirmText: "Delete Drug",
      confirmStyle: { background: '#ef4444' }
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/drugs/${id}`);
      fetchDrugs(true);
      notify.success("Medication removed.");
    } catch (err) {
      notify.error("Deletion failed.");
    }
  };

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      {/* ── Header ── */}
      <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Pharmacy Inventory</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Pill size={24} color="#fff" />
             </div>
             Drug Management
          </div>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          style={{ 
            padding: '12px 24px', borderRadius: 14, background: '#ec4899', color: '#fff', 
            fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.4)'
          }}
        >
          <Ic.Plus size={18} /> Register Medication
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[
          { label: 'Inventory SKU', value: stats.total, color: '#6366f1', icon: Ic.Inbox },
          { label: 'Expiring Soon', value: stats.expiring, color: '#f59e0b', icon: Ic.AlertTriangle },
          { label: 'Expired / Critical', value: stats.expired, color: '#f43f5e', icon: Ic.X },
        ].map(k => (
          <div key={k.label} style={{ 
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
            padding: '24px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 18
          }}>
            <div style={{ width: 50, height: 50, borderRadius: 15, background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
              <k.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{k.value}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Control Bar ── */}
      <div className="mobile-stack" style={{ 
        display: 'flex', gap: 15, marginBottom: 24, padding: '16px 20px', 
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18
      }}>
        <div className="mobile-w-full" style={{ position: 'relative', flex: 1 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }} 
            placeholder="Search medications by name or salt..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="form-select mobile-w-full" 
          style={{ width: 220, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          value={hospitalFilter}
          onChange={e => setHospitalFilter(e.target.value)}
        >
          <option value="all">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
        </select>
        <select 
          className="form-select mobile-w-full" 
          style={{ width: 220, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          value={wardFilter}
          onChange={e => setWardFilter(e.target.value)}
        >
          <option value="all">All Hospital Wards</option>
          {filteredWards.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
        </select>
      </div>

      {/* ── Stock List ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
           {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 80, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Inbox size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>Inventory search returned no matches.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 }}>
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Medication</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Ward</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Stock Level</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Expiry Health</th>
                  <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Operations</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const exp = expiryInfo(d.expiryDate);
                  const isEditing = editId === d._id;
                  
                  return (
                    <tr key={d._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{d.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Pharmaceutical Unit: {d.unit}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Ic.Hospital size={14} style={{ color: '#ec4899' }} />
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{d.hospital}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Ic.Inbox size={12} /> {d.ward}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {isEditing ? (
                          <input 
                            className="form-input" type="number" 
                            style={{ width: 100, height: 38, background: 'rgba(255,255,255,0.05)' }} 
                            value={editData.quantity} 
                            onChange={e => setEditData({...editData, quantity: e.target.value})} 
                          />
                        ) : (
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: d.quantity < 10 ? '#f43f5e' : '#fff' }}>
                            {d.quantity} <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>{d.unit}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                         {isEditing ? (
                           <input 
                              className="form-input" type="date" 
                              style={{ width: 160, height: 38, background: 'rgba(255,255,255,0.05)' }} 
                              value={editData.expiryDate} 
                              onChange={e => setEditData({...editData, expiryDate: e.target.value})} 
                           />
                         ) : (
                           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                             <div style={{ width: 8, height: 8, borderRadius: '50%', background: exp.color }} />
                             <span style={{ fontSize: '0.8rem', fontWeight: 700, color: exp.color }}>{exp.label}</span>
                             <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({new Date(d.expiryDate).toLocaleDateString()})</span>
                           </div>
                         )}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => handleUpdate(d._id)} style={{ all: 'unset', cursor: 'pointer', background: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>Save</button>
                            <button onClick={() => setEditId(null)} style={{ all: 'unset', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => { setEditId(d._id); setEditData({ quantity: d.quantity, expiryDate: d.expiryDate?.split("T")[0] || "" }); }} 
                              style={{ all: 'unset', cursor: 'pointer', color: '#94a3b8' }}
                            >
                              <Ic.Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(d._id)} style={{ all: 'unset', cursor: 'pointer', color: '#64748b' }}>
                              <Ic.Trash size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Medication Drawer ── */}
      {isDrawerOpen && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 1000, 
          display: 'flex', justifyContent: 'flex-end',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => setIsDrawerOpen(false)}>
          <div style={{ 
            width: '100%', maxWidth: 450, background: '#0f172a', height: '100%', 
            padding: '40px', display: 'flex', flexDirection: 'column', 
            boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', borderLeft: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>Register New Medication</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Pharmaceutical Inventory v2.0</div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ all: 'unset', cursor: 'pointer', color: '#94a3b8' }}>
                <Ic.X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Medication Name</label>
                <input className="form-input" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Select Hospital</label>
                <SearchableSelect
                  options={hospitals.map(h => ({ value: h.name, label: h.name }))}
                  value={form.hospital}
                  onChange={val => setForm({...form, hospital: val, ward: ""})}
                  placeholder="Select Hospital"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign to Ward</label>
                <SearchableSelect
                  options={formWards.map(w => ({ value: w.name, label: w.name }))}
                  value={form.ward}
                  onChange={val => setForm({...form, ward: val})}
                  placeholder={form.hospital ? "Select Hospital Ward" : "Select Hospital First"}
                  disabled={!form.hospital}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Packaging Unit</label>
                  <select className="form-select" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    {["tablets", "capsules", "ml", "mg", "units", "vials", "ampoules"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Batch Expiry Date</label>
                <input className="form-input" type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} />
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                <button 
                  type="button" onClick={() => setIsDrawerOpen(false)}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={submitting}
                  style={{ flex: 2, padding: '14px', borderRadius: 14, background: '#ec4899', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.4)' }}
                >
                  {submitting ? 'Registering...' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes screen-entry {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
