import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import * as Ic from "../../components/icons";

const CAT_CONFIG = {
  healthcare:   { icon: Ic.Activity, color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", label: "Clinical" },
  policy:       { icon: Ic.FileText, color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", label: "Policy" },
  professional: { icon: Ic.Award,    color: "#06b6d4", bg: "rgba(6,182,212,0.12)",  border: "rgba(6,182,212,0.25)",  label: "Education" },
  industry:     { icon: Ic.Globe,    color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)",  label: "Industry" },
};

export default function NewsManagementPage() {
  const confirm = useConfirm();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  
  const [form, setForm] = useState({ title: "", content: "", category: "healthcare", source: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchNews = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await API.get("/news");
      setNews(Array.isArray(data) ? data : []);
    } catch {
      setNews([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const filtered = useMemo(() => {
    return news.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || (n.source || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || n.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [news, search, filterCat]);

  const stats = useMemo(() => {
    return {
      total: news.length,
      healthcare: news.filter(n => n.category === "healthcare").length,
      sources: [...new Set(news.map(n => n.source).filter(Boolean))].length
    };
  }, [news]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) { notify.error("Title and content required."); return; }
    setSubmitting(true);
    try {
      await API.post("/news", form);
      notify.success("Intelligence report published!");
      setForm({ title: "", content: "", category: "healthcare", source: "" });
      setIsDrawerOpen(false);
      fetchNews(true);
    } catch (err) {
      notify.error("Failed to publish report.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (n) => {
    const isConfirmed = await confirm({ 
      title: "Retract Publication", 
      message: `Are you sure you want to remove "${n.title}" from the intelligence feed?`, 
      confirmText: "Delete Article",
      confirmStyle: { background: '#ef4444' }
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/news/${n._id}`);
      fetchNews(true);
      notify.success("Article retracted.");
    } catch (err) {
      notify.error("Operation failed.");
    }
  };

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Clinical Intelligence</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.News size={24} color="#fff" />
             </div>
             News & Reports
          </div>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          style={{ 
            padding: '12px 24px', borderRadius: 14, background: '#10b981', color: '#fff', 
            fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
          }}
        >
          <Ic.Plus size={18} /> Publish Report
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Intelligence Feed', value: stats.total, color: '#10b981', icon: Ic.News },
          { label: 'Clinical Focus', value: stats.healthcare, color: '#6366f1', icon: Ic.Activity },
          { label: 'Verified Sources', value: stats.sources, color: '#f59e0b', icon: Ic.Globe },
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
            placeholder="Search news by headline or source..." 
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
                background: filterCat === c ? '#10b98115' : 'transparent',
                color: filterCat === c ? '#10b981' : '#64748b',
                border: `1px solid ${filterCat === c ? '#10b98144' : 'transparent'}`,
                transition: 'all 0.2s'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── News List ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 120, borderRadius: 24 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Inbox size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>No reports published in this view.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(n => {
            const cfg = CAT_CONFIG[n.category] || CAT_CONFIG.healthcare;
            return (
              <div key={n._id} style={{ 
                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: 24, padding: '24px', display: 'flex', gap: 24,
                transition: 'all 0.3s ease', backdropFilter: 'blur(12px)'
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}><Ic.ExternalLink size={12} /> {n.source || 'Intel Hub'}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Calendar size={12} /> {new Date(n.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(n)} style={{ all: 'unset', cursor: 'pointer', color: '#64748b', padding: 8, borderRadius: 10, background: 'rgba(239,68,68,0.1)', transition: 'all 0.2s' }} onMouseEnter={el => el.currentTarget.style.color = '#ef4444'} onMouseLeave={el => el.currentTarget.style.color = '#64748b'}>
                      <Ic.Trash size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {n.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Publication Drawer ── */}
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
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>Publish Intelligence Report</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Content Management v2.0</div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ all: 'unset', cursor: 'pointer', color: '#94a3b8' }}>
                <Ic.X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Article Headline</label>
                <input className="form-input" placeholder="e.g. Breakthrough in Cardiovascular Nursing" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Source / Origin</label>
                  <input className="form-input" placeholder="WHO / Lancet / etc." value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Classification</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {Object.keys(CAT_CONFIG).map(c => <option key={c} value={c}>{CAT_CONFIG[c].label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Executive Summary</label>
                <textarea className="form-input" style={{ minHeight: 250 }} placeholder="Write the news article or clinical report summary..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
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
                  style={{ flex: 2, padding: '14px', borderRadius: 14, background: '#10b981', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}
                >
                  {submitting ? 'Publishing...' : 'Deploy Report'}
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
