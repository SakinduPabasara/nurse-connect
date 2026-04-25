import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import SearchableSelect from "../../components/SearchableSelect";
import * as Ic from "../../components/icons";

const CATS = ["circular", "training", "guideline", "alert"];

const CAT_CONFIG = {
  circular:  { icon: <Ic.FileText size={18} />, color: "#60a5fa", bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.25)" },
  training:  { icon: <Ic.Award size={18} />,    color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  guideline: { icon: <Ic.Check size={18} />,    color: "#22d3ee", bg: "rgba(6,182,212,0.12)",  border: "rgba(6,182,212,0.25)" },
  alert:     { icon: <Ic.AlertTriangle size={18} />, color: "#f87171", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
};

export default function NoticeManagementPage() {
  const confirm = useConfirm();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  
  const [form, setForm] = useState({ title: "", content: "", category: "circular" });
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

  useEffect(() => { fetchNotices(); }, []);

  const filtered = useMemo(() => {
    return notices.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || n.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [notices, search, filterCat]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: notices.length,
      alerts: notices.filter(n => n.category === "alert").length,
      today: notices.filter(n => n.createdAt?.split('T')[0] === today).length
    };
  }, [notices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) { notify.error("Title and content required."); return; }
    setSubmitting(true);
    try {
      await API.post("/notices", form);
      notify.success("Notice posted successfully!");
      setForm({ title: "", content: "", category: "circular" });
      setShowForm(false);
      fetchNotices();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to post notice.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (notice) => {
    const isConfirmed = await confirm({ 
      title: "Delete Notice", 
      message: `Are you sure you want to delete "${notice.title}"? This will remove it for all nurses.`, 
      confirmText: "Delete Notice",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/notices/${notice._id}`);
      setNotices(prev => prev.filter(n => n._id !== notice._id));
      notify.success("Notice deleted.");
    } catch (err) {
      notify.error("Failed to delete notice.");
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.4s ease" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .notice-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .notice-card:hover { 
          transform: translateY(-2px); 
          border-color: rgba(148,163,184,0.25);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        .notice-card.alert-cat {
          border-left: 4px solid var(--danger);
          background: linear-gradient(135deg, rgba(239,68,68,0.04), var(--surface));
        }
        .notice-card.alert-cat:hover { box-shadow: 0 12px 30px rgba(239,68,68,0.1); }
        
        .skeleton-notice {
          height: 120px;
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
          <div className="page-title">📋 Notice Board Management</div>
          <div className="page-subtitle">Publish system-wide updates and critical alerts</div>
        </div>
        <button
          className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <Ic.X size={18}/> : <Ic.Plus size={18} />}
          {showForm ? "Cancel" : "Post New Notice"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Notices</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--primary)', opacity:0.15 }}><Ic.FileText size={32} /></div>
        </div>
        <div className="stat-card" style={{ borderBottom:'2px solid var(--danger)' }}>
          <div className="stat-label">Critical Alerts</div>
          <div className="stat-value" style={{ color:'var(--danger)' }}>{stats.alerts}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--danger)', opacity:0.15 }}><Ic.AlertTriangle size={32} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Posted Today</div>
          <div className="stat-value" style={{ color:'var(--success)' }}>{stats.today}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--success)', opacity:0.15 }}><Ic.TrendUp size={32} /></div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 26, animation: "slideUp 0.3s ease" }}>
          <div className="section-title" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ padding:8, borderRadius:8, background:'var(--primary-glow)', color:'var(--primary)' }}><Ic.Plus size={18}/></div>
            Post New Notice
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                placeholder="Brief title of the notice..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content *</label>
              <textarea
                className="form-textarea"
                placeholder="Write the detailed message here..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <SearchableSelect
                  options={CATS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                />
              </div>
              <div className="form-group">
                <button
                  className="btn btn-primary btn-full"
                  type="submit"
                  disabled={submitting}
                  style={{ height: 46 }}
                >
                  {submitting ? "Posting..." : "✓ Publish Notice"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Control Bar */}
      <div className="filter-bar" style={{ background:'rgba(255,255,255,0.02)', padding:'14px 16px', borderRadius:14, border:'1px solid var(--border)', marginBottom:24 }}>
        <div className="topbar-search-wrap" style={{ maxWidth:'none', flex:1 }}>
          <Ic.Search size={18} />
          <input
            className="topbar-search-input"
            style={{ width:'100%', height:42, background:'transparent', border:'none', paddingLeft:38 }}
            placeholder="Search notices by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width:1, height:24, background:'var(--border)', margin:'0 8px' }} />
        <div style={{ display:'flex', gap:6 }}>
          {['all', ...CATS].map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`btn btn-xs ${filterCat === c ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform:'capitalize' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton-notice" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No notices found matching your criteria.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((n) => {
            const cfg = CAT_CONFIG[n.category] || {};
            return (
              <div key={n._id} className={`notice-card ${n.category === 'alert' ? 'alert-cat' : ''}`}>
                <div style={{ display:'flex', gap:20 }}>
                  <div style={{ 
                    width:48, height:48, borderRadius:12, background:cfg.bg, color:cfg.color, 
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    border: `1px solid ${cfg.border}`
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                      <div>
                        <div style={{ 
                          fontSize:'1.05rem', fontWeight:700, color:'var(--text)', 
                          marginBottom:4, letterSpacing:'-0.01em' 
                        }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text3)', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                          <Ic.Calendar size={13} />
                          {new Date(n.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span style={{ 
                          fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em',
                          padding:'3px 10px', borderRadius:999, background:cfg.bg, color:cfg.color,
                          border: `1px solid ${cfg.border}`
                        }}>
                          {n.category}
                        </span>
                        <button
                          className="btn btn-ghost btn-xs"
                          style={{ color:'var(--text4)' }}
                          onClick={() => handleDelete(n)}
                        >
                          <Ic.Trash size={16} />
                        </button>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize:'0.88rem', color:'var(--text2)', lineHeight:1.6, 
                      whiteSpace:'pre-wrap', maxWidth:'90%'
                    }}>
                      {n.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
