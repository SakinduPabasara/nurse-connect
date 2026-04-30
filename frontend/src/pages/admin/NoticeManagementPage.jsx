import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import * as Ic from "../../components/icons";

const CAT_CONFIG = {
  circular:  { icon: Ic.FileText, color: "#60a5fa", bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.25)", label: "Circular" },
  training:  { icon: Ic.Award,    color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", label: "Training" },
  guideline: { icon: Ic.Check,    color: "#22d3ee", bg: "rgba(6,182,212,0.12)",  border: "rgba(6,182,212,0.25)",  label: "Guideline" },
  alert:     { icon: Ic.AlertTriangle, color: "#f43f5e", bg: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.25)",   label: "Critical Alert" },
};

export default function NoticeManagementPage() {
  const confirm = useConfirm();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  
  const [form, setForm] = useState({ title: "", content: "", category: "circular" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchNotices = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get("/notices");
      setNotices(Array.isArray(data) ? data : []);
    } catch {
      setNotices([]);
    } finally {
      if (!silent) setLoading(false);
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
      notify.success("Intelligence broadcast successful!");
      setForm({ title: "", content: "", category: "circular" });
      setIsDrawerOpen(false);
      fetchNotices(true);
    } catch (err) {
      notify.error("Failed to broadcast notice.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (notice) => {
    const isConfirmed = await confirm({ 
      title: "Decommission Broadcast", 
      message: `Are you sure you want to remove "${notice.title}"? This action will sync across all personnel dashboards immediately.`, 
      confirmText: "Delete Notice",
      confirmStyle: { background: '#ef4444' }
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/notices/${notice._id}`);
      fetchNotices(true);
      notify.success("Broadcast removed.");
    } catch (err) {
      notify.error("Operation failed.");
    }
  };

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Communications Hub</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.FileText size={24} color="#fff" />
             </div>
             Notice Management
          </div>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          style={{ 
            padding: '12px 24px', borderRadius: 14, background: '#6366f1', color: '#fff', 
            fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Ic.Plus size={18} /> New Broadcast
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[
          { label: 'Active Broadcasts', value: stats.total, color: '#6366f1', icon: Ic.Inbox },
          { label: 'Critical Alerts', value: stats.alerts, color: '#f43f5e', icon: Ic.AlertTriangle },
          { label: 'Deployed Today', value: stats.today, color: '#10b981', icon: Ic.TrendUp },
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
            placeholder="Search broadcasts by keywords..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', ...Object.keys(CAT_CONFIG)].map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              style={{
                all: 'unset', cursor: 'pointer', padding: '8px 16px', borderRadius: 12,
                fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                background: filterCat === c ? '#6366f115' : 'transparent',
                color: filterCat === c ? '#6366f1' : '#64748b',
                border: `1px solid ${filterCat === c ? '#6366f144' : 'transparent'}`,
                transition: 'all 0.2s'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notice Grid ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 140, borderRadius: 24 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Inbox size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>Clear communications archive.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(n => {
            const cfg = CAT_CONFIG[n.category] || CAT_CONFIG.circular;
            return (
              <div key={n._id} className="notice-card" style={{ 
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
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{n.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Calendar size={12} /> {new Date(n.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                        <span>•</span>
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(n)} style={{ all: 'unset', cursor: 'pointer', color: '#64748b', padding: 8, borderRadius: 10, background: 'rgba(239,68,68,0.1)', transition: 'all 0.2s' }} onMouseEnter={el => el.currentTarget.style.color = '#ef4444'} onMouseLeave={el => el.currentTarget.style.color = '#64748b'}>
                      <Ic.Trash size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxWidth: '90%' }}>
                    {n.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Broadcast Drawer ── */}
      {isDrawerOpen && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 1000, 
          display: 'flex', justifyContent: 'flex-end',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => setIsDrawerOpen(false)}>
          <div className="broadcast-drawer" style={{ 
            width: '100%', maxWidth: 450, background: '#0f172a', height: '100%', 
            padding: '40px', display: 'flex', flexDirection: 'column', 
            boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', borderLeft: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>New Intelligence Broadcast</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Communication Network v2.0</div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ all: 'unset', cursor: 'pointer', color: '#94a3b8' }}>
                <Ic.X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Broadcast Title</label>
                <input className="form-input" placeholder="e.g. Critical Safety Protocol Update" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Priority Intelligence Category</label>
                <div className="grid-2" style={{ gap: 10 }}>
                  {Object.keys(CAT_CONFIG).map(s => (
                    <button 
                      key={s} type="button" 
                      onClick={() => setForm({...form, category: s})}
                      style={{ 
                        padding: '12px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800,
                        border: `1px solid ${form.category === s ? CAT_CONFIG[s].color : 'rgba(255,255,255,0.1)'}`,
                        background: form.category === s ? CAT_CONFIG[s].bg : 'rgba(255,255,255,0.02)',
                        color: form.category === s ? CAT_CONFIG[s].color : '#64748b',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 10
                      }}
                    >
                      {form.category === s ? <Ic.Check size={14} /> : <div style={{ width: 14 }} />}
                      {CAT_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Content</label>
                <textarea className="form-input" style={{ minHeight: 200 }} placeholder="Write the full broadcast content here..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
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
                  {submitting ? 'Broadcasting...' : 'Publish Intelligence'}
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
        @media (max-width: 768px) {
          .broadcast-drawer { padding: 24px !important; width: 100% !important; }
          .notice-card { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>
    </div>
  );
}
