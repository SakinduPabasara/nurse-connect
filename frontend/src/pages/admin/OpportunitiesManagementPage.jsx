import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import SearchableSelect from "../../components/SearchableSelect";
import * as Ic from "../../components/icons";

const TYPES = ["international", "local", "training", "certification"];

const TYPE_CONFIG = {
  international:  { icon: <Ic.Globe size={18} />, color: "#22d3ee", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)" },
  local:          { icon: <Ic.MapPin size={18} />, color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  training:       { icon: <Ic.Award size={18} />, color: "#60a5fa", bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.25)" },
  certification:  { icon: <Ic.Check size={18} />, color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
};

export default function OpportunitiesManagementPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const [form, setForm] = useState({ title: "", description: "", type: "international", location: "", deadline: "" });
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

  useEffect(() => { fetchItems(); }, []);

  const filtered = useMemo(() => {
    return items.filter(o => {
      const matchSearch = o.title.toLowerCase().includes(search.toLowerCase()) || (o.location || "").toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || o.type === filterType;
      return matchSearch && matchType;
    });
  }, [items, search, filterType]);

  const stats = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return {
      total: items.length,
      intl: items.filter(i => i.type === "international").length,
      urgent: items.filter(i => i.deadline && new Date(i.deadline) < nextWeek).length
    };
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.deadline) { notify.error("Title, description and deadline required."); return; }
    setSubmitting(true);
    try {
      await API.post("/opportunities", form);
      notify.success("Opportunity posted successfully!");
      setForm({ title: "", description: "", type: "international", location: "", deadline: "" });
      setShowForm(false);
      fetchItems();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to post.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (o) => {
    const isConfirmed = await confirm({ 
      title: "Delete Opportunity", 
      message: `Are you sure you want to delete "${o.title}"?`, 
      confirmText: "Delete",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/opportunities/${o._id}`);
      setItems(prev => prev.filter(item => item._id !== o._id));
      notify.success("Opportunity deleted.");
    } catch (err) {
      notify.error("Failed to delete opportunity.");
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.4s ease" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .opp-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .opp-card:hover { 
          transform: translateY(-2px); 
          border-color: rgba(148,163,184,0.25);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        .deadline-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
        }
        .deadline-urgent { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .deadline-normal { background: rgba(148,163,184,0.1); color: var(--text3); border: 1px solid var(--border); }
        
        .skeleton-opp {
          height: 110px;
          background: linear-gradient(90deg, var(--surface) 25%, var(--bg3) 50%, var(--surface) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 16px;
          border: 1px solid var(--border);
          margin-bottom: 12px;
        }
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .section-title { font-size: 1.1rem; font-weight: 700; color: var(--text); }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">🌐 Opportunities Management</div>
          <div className="page-subtitle">Manage international and local career growth opportunities</div>
        </div>
        <button
          className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <Ic.X size={18}/> : <Ic.Plus size={18} />}
          {showForm ? "Cancel" : "Post Opportunity"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Listings</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--primary)', opacity:0.15 }}><Ic.Globe size={32} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">International Roles</div>
          <div className="stat-value" style={{ color:'var(--accent)' }}>{stats.intl}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--accent)', opacity:0.15 }}><Ic.Globe size={32} /></div>
        </div>
        <div className="stat-card" style={{ borderBottom: stats.urgent > 0 ? '2px solid var(--danger)' : 'none' }}>
          <div className="stat-label">Closing Soon</div>
          <div className="stat-value" style={{ color: stats.urgent > 0 ? 'var(--danger)' : 'var(--text)' }}>{stats.urgent}</div>
          <div style={{ position:'absolute', top:22, right:22, color: stats.urgent > 0 ? 'var(--danger)' : 'var(--text3)', opacity:0.15 }}><Ic.Clock size={32} /></div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 26, animation: "slideUp 0.3s ease" }}>
          <div className="section-title" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ padding:8, borderRadius:8, background:'var(--primary-glow)', color:'var(--primary)' }}><Ic.Plus size={18}/></div>
            Post Career Opportunity
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Position Title *</label>
              <input
                className="form-input"
                placeholder="Senior Nurse Practitioner..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Job Description *</label>
              <textarea
                className="form-textarea"
                placeholder="Focus on key requirements and benefits..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Opportunity Type</label>
                <SearchableSelect
                  options={TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                  value={form.type}
                  onChange={(val) => setForm({ ...form, type: val })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  placeholder="e.g. London, UK"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Application Deadline *</label>
              <input
                className="form-input"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={submitting}
              style={{ height: 46, marginTop: 12 }}
            >
              {submitting ? "Posting..." : "✓ Publish Opportunity"}
            </button>
          </form>
        </div>
      )}

      {/* Control Bar */}
      <div className="filter-bar" style={{ background:'rgba(255,255,255,0.02)', padding:'14px 16px', borderRadius:14, border:'1px solid var(--border)', marginBottom:24 }}>
        <div className="topbar-search-wrap" style={{ maxWidth:'none', flex:1 }}>
          <Ic.Search size={18} />
          <input
            className="topbar-search-input"
            style={{ width:'100%', height:40, background:'transparent', border:'none', paddingLeft:38 }}
            placeholder="Search roles or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width:1, height:24, background:'var(--border)', margin:'0 8px' }} />
        <div style={{ display:'flex', gap:6 }}>
          {['all', ...TYPES].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`btn btn-xs ${filterType === t ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform:'capitalize' }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton-opp" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌐</div>
          <div className="empty-state-text">No opportunities found matching your criteria.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((o) => {
            const cfg = TYPE_CONFIG[o.type] || {};
            const dDate = new Date(o.deadline);
            const isUrgent = dDate < new Date(Date.now() + 7 * 86400000);
            
            return (
              <div key={o._id} className="opp-card">
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                    <div style={{ 
                      width:44, height:44, borderRadius:12, background:cfg.bg, color:cfg.color, 
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      border: `1px solid ${cfg.border}`
                    }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>{o.title}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text3)', fontWeight:600, display:'flex', alignItems:'center', gap:14, marginTop:2 }}>
                        {o.location && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Ic.MapPin size={12}/> {o.location}</span>}
                        <span className={`deadline-badge ${isUrgent ? 'deadline-urgent' : 'deadline-normal'}`}>
                          <Ic.Clock size={12} />
                          Deadline: {dDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span style={{ 
                      fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em',
                      padding:'3px 10px', borderRadius:8, background:cfg.bg, color:cfg.color,
                      border: `1px solid ${cfg.border}`
                    }}>
                      {o.type}
                    </span>
                    <button className="btn btn-ghost btn-xs" onClick={() => handleDelete(o)}>
                       <Ic.Trash size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize:'0.88rem', color:'var(--text2)', lineHeight:1.6, maxWidth:'95%' }}>
                   {o.description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
