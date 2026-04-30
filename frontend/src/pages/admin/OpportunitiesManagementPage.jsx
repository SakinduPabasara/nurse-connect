import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import * as Ic from "../../components/icons";

const TYPE_CONFIG = {
  international:  { icon: Ic.Globe, color: "#22d3ee", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)", label: "International" },
  local:          { icon: Ic.MapPin, color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", label: "Local Role" },
  training:       { icon: Ic.Award,    color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", label: "Training" },
  certification:  { icon: Ic.Check,    color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", label: "Certification" },
};

export default function OpportunitiesManagementPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const [form, setForm] = useState({ title: "", description: "", type: "international", location: "", deadline: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get("/opportunities");
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const stats = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return {
      total: items.length,
      intl: items.filter(i => i.type === "international").length,
      urgent: items.filter(i => i.deadline && new Date(i.deadline) < nextWeek).length
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(o => {
      const matchSearch = o.title.toLowerCase().includes(search.toLowerCase()) || (o.location || "").toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || o.type === filterType;
      return matchSearch && matchType;
    });
  }, [items, search, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.deadline) { notify.error("Title, description and deadline are mandatory."); return; }
    setSubmitting(true);
    try {
      await API.post("/opportunities", form);
      notify.success("Opportunity published successfully!");
      setForm({ title: "", description: "", type: "international", location: "", deadline: "" });
      setIsDrawerOpen(false);
      fetchItems(true);
    } catch (err) {
      notify.error("Failed to post opportunity.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (o) => {
    const isConfirmed = await confirm({ 
      title: "Retract Opportunity", 
      message: `Are you sure you want to remove "${o.title}" from the career board?`, 
      confirmText: "Delete",
      confirmStyle: { background: '#ef4444' }
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/opportunities/${o._id}`);
      fetchItems(true);
      notify.success("Opportunity retracted.");
    } catch (err) {
      notify.error("Deletion failed.");
    }
  };

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Career Pathways</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Globe size={24} color="#fff" />
             </div>
             Opportunities Management
          </div>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          style={{ 
            padding: '12px 24px', borderRadius: 14, background: '#f59e0b', color: '#fff', 
            fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
          }}
        >
          <Ic.Plus size={18} /> Post Opportunity
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[
          { label: 'Active Listings', value: stats.total, color: '#f59e0b', icon: Ic.Inbox },
          { label: 'International Roles', value: stats.intl, color: '#22d3ee', icon: Ic.Globe },
          { label: 'Closing Soon', value: stats.urgent, color: '#f43f5e', icon: Ic.Clock },
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
      <div style={{ 
        display: 'flex', gap: 15, marginBottom: 24, padding: '16px 20px', 
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }} 
            placeholder="Search roles by title, hospital or location..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', ...Object.keys(TYPE_CONFIG)].map(c => (
            <button
              key={c}
              onClick={() => setFilterType(c)}
              style={{
                all: 'unset', cursor: 'pointer', padding: '8px 16px', borderRadius: 12,
                fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                background: filterType === c ? '#f59e0b15' : 'transparent',
                color: filterType === c ? '#f59e0b' : '#64748b',
                border: `1px solid ${filterType === c ? '#f59e0b44' : 'transparent'}`,
                transition: 'all 0.2s'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Opportunity List ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 140, borderRadius: 24 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Globe size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>No career opportunities listed in this view.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(o => {
            const cfg = TYPE_CONFIG[o.type] || TYPE_CONFIG.local;
            const isUrgent = o.deadline && (new Date(o.deadline) - new Date()) / (1000 * 60 * 60 * 24) < 7;
            
            return (
              <div key={o._id} style={{ 
                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: 24, padding: '24px', display: 'flex', gap: 24,
                transition: 'all 0.3s ease', backdropFilter: 'blur(12px)',
                position: 'relative'
              }}
              onMouseEnter={el => { el.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; el.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)'; }}
              onMouseLeave={el => { el.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; el.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'; }}
              >
                <div style={{ 
                  width: 56, height: 56, borderRadius: 16, background: `${cfg.color}15`, 
                  border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', color: cfg.color, flexShrink: 0
                }}>
                  <cfg.icon size={26} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{o.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.MapPin size={12} /> {o.location || 'Remote'}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: isUrgent ? '#f43f5e' : '#94a3b8' }}>
                          <Ic.Clock size={12} /> Deadline: {new Date(o.deadline).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(o)} style={{ all: 'unset', cursor: 'pointer', color: '#64748b', padding: 8, borderRadius: 10, background: 'rgba(239,68,68,0.1)', transition: 'all 0.2s' }} onMouseEnter={el => el.currentTarget.style.color = '#ef4444'} onMouseLeave={el => el.currentTarget.style.color = '#64748b'}>
                      <Ic.Trash size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '95%' }}>
                    {o.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Opportunity Drawer ── */}
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
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>Post Career Opportunity</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Career Management v2.0</div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ all: 'unset', cursor: 'pointer', color: '#94a3b8' }}>
                <Ic.X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Opportunity Title</label>
                <input className="form-input" placeholder="e.g. Senior ICU Specialist - London" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Global Location</label>
                  <input className="form-input" placeholder="City, Country" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Classification</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {Object.keys(TYPE_CONFIG).map(c => <option key={c} value={c}>{TYPE_CONFIG[c].label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Application Deadline</label>
                <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Requirements & Description</label>
                <textarea className="form-input" style={{ minHeight: 200 }} placeholder="Outline key requirements and professional benefits..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
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
                  style={{ flex: 2, padding: '14px', borderRadius: 14, background: '#f59e0b', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)' }}
                >
                  {submitting ? 'Publishing...' : 'Deploy Posting'}
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
