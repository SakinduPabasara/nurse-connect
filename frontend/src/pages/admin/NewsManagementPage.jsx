import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import SearchableSelect from "../../components/SearchableSelect";
import * as Ic from "../../components/icons";

const CATS = ["healthcare", "policy", "professional", "industry"];

const CAT_CONFIG = {
  healthcare:   { icon: <Ic.Edit size={16} />, color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  policy:       { icon: <Ic.FileText size={16} />, color: "#60a5fa", bg: "rgba(37,99,235,0.12)", border: "rgba(37,99,235,0.25)" },
  professional: { icon: <Ic.Award size={16} />, color: "#22d3ee", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)" },
  industry:     { icon: <Ic.Globe size={16} />, color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
};

export default function NewsManagementPage() {
  const confirm = useConfirm();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  
  const [form, setForm] = useState({ title: "", content: "", category: "healthcare", source: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/news");
      setNews(data);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
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
      notify.success("News article published!");
      setForm({ title: "", content: "", category: "healthcare", source: "" });
      setShowForm(false);
      fetchNews();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to post news.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (n) => {
    const isConfirmed = await confirm({ 
      title: "Delete Article", 
      message: `Are you sure you want to delete "${n.title}"?`, 
      confirmText: "Delete Article",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/news/${n._id}`);
      setNews(prev => prev.filter(item => item._id !== n._id));
      notify.success("News article deleted.");
    } catch (err) {
      notify.error("Failed to delete article.");
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.4s ease" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .news-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .news-card:hover { 
          transform: translateY(-2px); 
          border-color: rgba(148,163,184,0.25);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        .skeleton-news {
          height: 100px;
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
          <div className="page-title">📰 Healthcare News Management</div>
          <div className="page-subtitle">Curate professional news and industry policy updates</div>
        </div>
        <button
          className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <Ic.X size={18}/> : <Ic.Plus size={18} />}
          {showForm ? "Cancel" : "Post News Article"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total News</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--primary)', opacity:0.15 }}><Ic.News size={32} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Healthcare Topics</div>
          <div className="stat-value" style={{ color:'var(--success)' }}>{stats.healthcare}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--success)', opacity:0.15 }}><Ic.Edit size={32} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Trusted Sources</div>
          <div className="stat-value" style={{ color:'var(--accent)' }}>{stats.sources}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--accent)', opacity:0.15 }}><Ic.ExternalLink size={32} /></div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 26, animation: "slideUp 0.3s ease" }}>
          <div className="section-title" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ padding:8, borderRadius:8, background:'var(--primary-glow)', color:'var(--primary)' }}><Ic.Plus size={18}/></div>
            Publish News Article
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Article Title *</label>
              <input
                className="form-input"
                placeholder="Industry Headline..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Summary Content *</label>
              <textarea
                className="form-textarea"
                placeholder="News summary and key points..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <SearchableSelect
                  options={CATS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">News Source</label>
                <input
                  className="form-input"
                  placeholder="e.g. WHO Official, Health Dept..."
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
              </div>
            </div>
            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={submitting}
              style={{ height: 46, marginTop: 12 }}
            >
              {submitting ? "Publishing..." : "✓ Publish Article"}
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
            placeholder="Search news or sources..."
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
          {[1,2,3].map(i => <div key={i} className="skeleton-news" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📰</div>
          <div className="empty-state-text">No articles found matching your criteria.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((n) => {
            const cfg = CAT_CONFIG[n.category] || {};
            return (
              <div key={n._id} className="news-card">
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ 
                      width:36, height:36, borderRadius:10, background:cfg.bg, color:cfg.color, 
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      border: `1px solid ${cfg.border}`
                    }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>{n.title}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text3)', fontWeight:600, display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                        {n.source && <><span style={{ color:'var(--accent)' }}>{n.source}</span> • </>}
                        <Ic.Calendar size={13} />
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span style={{ 
                      fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em',
                      padding:'2px 8px', borderRadius:6, background:cfg.bg, color:cfg.color,
                      border: `1px solid ${cfg.border}`
                    }}>
                      {n.category}
                    </span>
                    <button className="btn btn-ghost btn-xs" onClick={() => handleDelete(n)}>
                       <Ic.Trash size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize:'0.88rem', color:'var(--text2)', lineHeight:1.6, maxHeight:'3.2em', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                  {n.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
