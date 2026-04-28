import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import * as Ic from "../../components/icons";

const STATUS_CFG = {
  available:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', label: 'Available', Icon: Ic.Check },
  maintenance: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)', label: 'Maintenance', Icon: Ic.Wrench },
  unavailable: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)',  label: 'Unavailable', Icon: Ic.X },
};

export default function EquipmentManagementPage() {
  const confirm = useConfirm();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    hospital: "",
    name: "",
    ward: "",
    serialNumber: "",
    description: "",
    status: "available",
    lastMaintenance: "",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchEq = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get("/equipment");
      setEquipment(Array.isArray(data) ? data : []);
    } catch {
      setEquipment([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEq();
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
    const total = equipment.length;
    const available = equipment.filter(e => e.status === 'available').length;
    const maintenance = equipment.filter(e => e.status === 'maintenance').length;
    const overdue = equipment.filter(e => {
        if (!e.lastMaintenance) return true;
        const last = new Date(e.lastMaintenance);
        const diff = (new Date() - last) / (1000 * 60 * 60 * 24);
        return diff > 180; // 6 months
    }).length;
    return { total, available, maintenance, overdue };
  }, [equipment]);

  const filtered = useMemo(() => {
    return equipment.filter(e => {
      const matchSearch   = !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.serialNumber || '').toLowerCase().includes(search.toLowerCase());
      const matchHospital = hospitalFilter === 'all' || e.hospital === hospitalFilter;
      const matchWard     = wardFilter === 'all' || e.ward === wardFilter;
      const matchStatus   = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchHospital && matchWard && matchStatus;
    });
  }, [equipment, search, hospitalFilter, wardFilter, statusFilter]);

  const openDrawer = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        hospital: item.hospital,
        name: item.name,
        ward: item.ward,
        serialNumber: item.serialNumber || "",
        description: item.description || "",
        status: item.status,
        lastMaintenance: item.lastMaintenance || "",
      });
    } else {
      setEditingItem(null);
      setForm({ hospital: "", name: "", ward: "", serialNumber: "", description: "", status: "available", lastMaintenance: "" });
    }
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospital || !form.name || !form.ward) {
      notify.error("Hospital, name and ward are mandatory.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await API.put(`/equipment/${editingItem._id}`, form);
        notify.success("Asset updated successfully.");
      } else {
        await API.post("/equipment", form);
        notify.success("New asset registered.");
      }
      setIsDrawerOpen(false);
      fetchEq(true);
    } catch (err) {
      notify.error(err.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Decommission Asset",
      message: "Are you sure you want to permanently remove this asset from the registry?",
      confirmText: "Delete Permanently",
      confirmStyle: { background: '#ef4444' }
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/equipment/${id}`);
      fetchEq(true);
      notify.success("Asset decommissioned.");
    } catch (err) {
      notify.error("Deletion failed.");
    }
  };

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      {/* ── Header & KPI Section ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Asset Inventory</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Wrench size={24} color="#fff" />
             </div>
             Equipment Management
          </div>
        </div>
        <button 
          onClick={() => openDrawer()}
          style={{ 
            padding: '12px 24px', borderRadius: 14, background: '#6366f1', color: '#fff', 
            fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Ic.Plus size={18} /> Register Asset
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Assets', value: stats.total, color: '#6366f1', icon: Ic.Award },
          { label: 'Available', value: stats.available, color: '#10b981', icon: Ic.Check },
          { label: 'Maintenance', value: stats.maintenance, color: '#f59e0b', icon: Ic.Wrench },
          { label: 'Health Overdue', value: stats.overdue, color: '#ef4444', icon: Ic.AlertTriangle },
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

      {/* ── Filters ── */}
      <div style={{ 
        display: 'flex', gap: 15, marginBottom: 24, padding: '16px 20px', 
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }} 
            placeholder="Search by name, serial number or model..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="form-select" 
          style={{ width: 180, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          value={hospitalFilter}
          onChange={e => setHospitalFilter(e.target.value)}
        >
          <option value="all">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
        </select>
        <select 
          className="form-select" 
          style={{ width: 180, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          value={wardFilter}
          onChange={e => setWardFilter(e.target.value)}
        >
          <option value="all">All Wards</option>
          {filteredWards.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
        </select>
        <select 
          className="form-select" 
          style={{ width: 160, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Any Status</option>
          {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
      </div>

      {/* ── Asset Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 200, borderRadius: 24 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Wrench size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>No assets found matching the filter criteria.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map(e => {
            const cfg = STATUS_CFG[e.status] || STATUS_CFG.available;
            const overdue = e.lastMaintenance ? (new Date() - new Date(e.lastMaintenance)) / (1000 * 60 * 60 * 24) > 180 : true;
            
            return (
              <div key={e._id} style={{ 
                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: 24, padding: '24px', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s ease', backdropFilter: 'blur(12px)'
              }}
              onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-5px)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                {/* Health Indicator Line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: overdue ? '#ef4444' : '#10b981', opacity: 0.6 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cfg.color}15`, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                    <cfg.Icon size={22} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openDrawer(e)} style={{ all: 'unset', cursor: 'pointer', color: '#94a3b8', padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.05)', transition: 'all 0.2s' }} onMouseEnter={el => el.currentTarget.style.color = '#fff'} onMouseLeave={el => el.currentTarget.style.color = '#94a3b8'}>
                      <Ic.Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(e._id)} style={{ all: 'unset', cursor: 'pointer', color: '#94a3b8', padding: 6, borderRadius: 8, background: 'rgba(239,68,68,0.1)', transition: 'all 0.2s' }} onMouseEnter={el => el.currentTarget.style.color = '#ef4444'} onMouseLeave={el => el.currentTarget.style.color = '#94a3b8'}>
                      <Ic.Trash size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{e.name}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SN: {e.serialNumber || 'N/A'} • {e.hospital} • {e.ward}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 12, marginBottom: 20 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>
                      <span>Maintenance Health</span>
                      <span style={{ color: overdue ? '#ef4444' : '#10b981', fontWeight: 800 }}>{overdue ? 'Critical' : 'Healthy'}</span>
                   </div>
                   <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: overdue ? '20%' : '100%', height: '100%', background: overdue ? '#ef4444' : '#10b981', transition: 'width 1s ease' }} />
                   </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
                    <Ic.Clock size={12} />
                    Last Service: {e.lastMaintenance ? new Date(e.lastMaintenance).toLocaleDateString() : 'Never'}
                  </div>
                  <span style={{ 
                    fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', 
                    color: cfg.color, background: `${cfg.color}15`, padding: '4px 10px', 
                    borderRadius: 8, border: `1px solid ${cfg.border}`
                  }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Asset Registration Drawer ── */}
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
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{editingItem ? 'Edit Asset' : 'Register New Asset'}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>System Asset Registry v2.0</div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ all: 'unset', cursor: 'pointer', color: '#94a3b8' }}>
                <Ic.X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input className="form-input" placeholder="e.g. Philips Ventilator X3" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Hospital</label>
                <SearchableSelect
                  options={hospitals.map(h => ({ value: h.name, label: h.name }))}
                  value={form.hospital}
                  onChange={val => setForm({...form, hospital: val, ward: ""})}
                  placeholder="Select Hospital"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Ward / Location</label>
                  <SearchableSelect
                    options={formWards.map(w => ({ value: w.name, label: w.name }))}
                    value={form.ward}
                    onChange={val => setForm({...form, ward: val})}
                    placeholder={form.hospital ? "Select Ward" : "Select Hospital First"}
                    disabled={!form.hospital}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input className="form-input" placeholder="SN-8829-X" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Operational Status</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {Object.keys(STATUS_CFG).map(s => (
                    <button 
                      key={s} type="button" 
                      onClick={() => setForm({...form, status: s})}
                      style={{ 
                        flex: 1, padding: '10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 800,
                        border: `1px solid ${form.status === s ? STATUS_CFG[s].color : 'rgba(255,255,255,0.1)'}`,
                        background: form.status === s ? STATUS_CFG[s].bg : 'rgba(255,255,255,0.02)',
                        color: form.status === s ? STATUS_CFG[s].color : '#64748b',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Last Maintenance Date</label>
                <input className="form-input" type="date" value={form.lastMaintenance} onChange={e => setForm({...form, lastMaintenance: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Technical Description / Notes</label>
                <textarea className="form-input" style={{ minHeight: 100 }} placeholder="Add technical specs or maintenance notes..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
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
                  style={{ flex: 2, padding: '14px', borderRadius: 14, background: '#6366f1', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' }}
                >
                  {submitting ? 'Processing...' : (editingItem ? 'Save Changes' : 'Complete Registration')}
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
