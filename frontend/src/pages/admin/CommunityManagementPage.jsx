import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import * as Ic from "../../components/icons";

const CAT_COLORS = {
  discussion: "badge-blue",
  advice: "badge-green",
  experience: "badge-cyan",
  support: "badge-yellow",
};

export default function CommunityManagementPage() {
  const confirm = useConfirm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/community");
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || (p.author?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || p.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [posts, search, filterCat]);

  const stats = useMemo(() => {
    const totalComments = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);
    return {
      total: posts.length,
      engagement: posts.length > 0 ? (totalComments / posts.length).toFixed(1) : 0,
      supportNeeded: posts.filter(p => p.category === "support").length
    };
  }, [posts]);

  const handleDelete = async (p) => {
    const isConfirmed = await confirm({ 
      title: "Delete Post", 
      message: `Are you sure you want to delete "${p.title}" and all its comments?`, 
      confirmText: "Delete Post",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/community/${p._id}`);
      setPosts(prev => prev.filter(item => item._id !== p._id));
      notify.success("Community post removed.");
    } catch (err) {
      notify.error("Failed to delete post.");
    }
  };

  const handleDeleteComment = async (postId, cid) => {
    const isConfirmed = await confirm({ 
      title: "Delete Comment", 
      message: "Remove this comment from the discussion?", 
      confirmText: "Delete Comment",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      await API.delete(`/community/${postId}/comments/${cid}`);
      fetchPosts();
      notify.success("Comment removed.");
    } catch (err) {
      notify.error("Failed to delete comment.");
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.4s ease" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .post-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 26px;
          margin-bottom: 24px;
        }
        .comment-item {
          display: flex;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(0,0,0,0.18);
          border-radius: 14px;
          margin-bottom: 10px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .comment-item:hover {
          border-color: rgba(148,163,184,0.15);
          background: rgba(0,0,0,0.25);
        }
        .skeleton-post {
          height: 180px;
          background: linear-gradient(90deg, var(--surface) 25%, var(--bg3) 50%, var(--surface) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 20px;
          border: 1px solid var(--border);
          margin-bottom: 16px;
        }
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">💬 Community Moderation</div>
          <div className="page-subtitle">Monitor discussions and maintain community standards</div>
        </div>
      </div>

       {/* Stats Grid */}
       <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Posts</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--primary)', opacity:0.15 }}><Ic.Chat size={32} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Engagement Rate</div>
          <div className="stat-value" style={{ color:'var(--accent)' }}>{stats.engagement}<span style={{fontSize:'1.2rem', opacity:0.6}}> avg</span></div>
          <div style={{ position:'absolute', top:22, right:22, color:'var(--accent)', opacity:0.15 }}><Ic.TrendUp size={32} /></div>
        </div>
        <div className="stat-card" style={{ borderBottom: stats.supportNeeded > 0 ? '2px solid var(--warning)' : 'none' }}>
          <div className="stat-label">Support Tasks</div>
          <div className="stat-value" style={{ color: stats.supportNeeded > 0 ? 'var(--warning)' : 'var(--text)' }}>{stats.supportNeeded}</div>
          <div style={{ position:'absolute', top:22, right:22, color: stats.supportNeeded > 0 ? 'var(--warning)' : 'var(--text3)', opacity:0.15 }}><Ic.AlertTriangle size={32} /></div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="filter-bar" style={{ background:'rgba(255,255,255,0.02)', padding:'14px 16px', borderRadius:14, border:'1px solid var(--border)', marginBottom:26 }}>
        <div className="topbar-search-wrap" style={{ maxWidth:'none', flex:1 }}>
          <Ic.Search size={18} />
          <input
            className="topbar-search-input"
            style={{ width:'100%', height:42, background:'transparent', border:'none', paddingLeft:38 }}
            placeholder="Search posts or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width:1, height:24, background:'var(--border)', margin:'0 10px' }} />
        <div style={{ display:'flex', gap:6 }}>
          {['all', 'discussion', 'advice', 'experience', 'support'].map(c => (
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
          {[1,2].map(i => <div key={i} className="skeleton-post" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">No community discussions found.</div>
        </div>
      ) : (
        <div>
          {filtered.map((p) => (
            <div key={p._id} className="post-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div style={{ display:'flex', gap:14 }}>
                  <div style={{ 
                    width:42, height:42, borderRadius:99, background:'linear-gradient(135deg, var(--primary), var(--accent))',
                    display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'0.9rem'
                  }}>
                    {p.author?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize:'1.15rem', fontWeight:800, color:'var(--text)', marginBottom:4 }}>{p.title}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text3)', fontWeight:600, display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ color:'var(--text2)' }}>By {p.author?.name}</span>
                      <span>•</span>
                      <Ic.Calendar size={13} />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span className={`badge ${CAT_COLORS[p.category] || "badge-gray"}`} style={{ textTransform:'uppercase', fontSize:'0.65rem', padding:'4px 10px' }}>
                    {p.category}
                  </span>
                  <button className="btn btn-danger btn-xs" onClick={() => handleDelete(p)}>
                    Delete Post
                  </button>
                </div>
              </div>

              {p.comments?.length > 0 ? (
                <div style={{ marginTop:24 }}>
                  <div style={{ fontSize:'0.75rem', fontWeight:800, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                    <Ic.Chat size={14} />
                    Thread Participants ({p.comments.length})
                  </div>
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {p.comments.map((c) => (
                      <div key={c._id} className="comment-item">
                        <div style={{ width:24, height:24, borderRadius:99, background:'var(--bg3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', color:'var(--text2)', fontWeight:800, flexShrink:0 }}>
                          {c.author?.name?.charAt(0)}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text2)', marginBottom:2 }}>{c.author?.name}</div>
                            <button className="btn btn-ghost btn-xs" style={{ padding:2, color:'var(--text4)' }} onClick={() => handleDeleteComment(p._id, c._id)}>
                               <Ic.Trash size={13} />
                            </button>
                          </div>
                          <div style={{ fontSize:'0.84rem', color:'var(--text3)', lineHeight:1.5 }}>{c.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding:'20px', borderRadius:14, background:'rgba(0,0,0,0.1)', border:'1px dashed var(--border)', textAlign:'center', fontSize:'0.82rem', color:'var(--text4)' }}>
                   No comments yet on this discussion.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
