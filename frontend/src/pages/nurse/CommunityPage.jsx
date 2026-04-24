import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import * as Ic from '../../components/icons';
import { notify } from '../../utils/toast';

const CAT = {
  discussion: { color: '#60a5fa', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)',  label: 'Discussion' },
  advice:     { color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'Advice'      },
  experience: { color: '#22d3ee', bg: 'rgba(6,182,212,0.1)',  border: 'rgba(6,182,212,0.2)',  label: 'Experience'  },
  support:    { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Support'     },
};
const getCat = c => CAT[c] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)', label: c };

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime(), m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SkeletonPost() {
  return (
    <div className="skeleton-card" style={{ borderRadius: 14 }}>
      <div className="skeleton-row">
        <div className="skeleton skeleton-avatar" style={{ width: 38, height: 38, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton skeleton-text" style={{ width: '45%' }} />
          <div className="skeleton skeleton-text" style={{ width: '30%' }} />
        </div>
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="skeleton skeleton-title" style={{ width: '75%' }} />
      <div className="skeleton skeleton-text" style={{ width: '100%' }} />
      <div className="skeleton skeleton-text" style={{ width: '90%' }} />
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [comment, setComment] = useState('');
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'discussion' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url = cat === 'all' ? '/community' : `/community?category=${cat}`;
      const { data } = await API.get(url);
      setPosts(data);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, [cat]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openPost = async id => {
    setExpanded(id);
    if (!detail[id]) {
      try { const { data } = await API.get(`/community/${id}`); setDetail(d => ({ ...d, [id]: data })); }
      catch {}
    }
  };

  const handleComment = async pId => {
    if (!comment.trim()) return;
    try {
      await API.post(`/community/${pId}/comments`, { content: comment });
      setComment('');
      const { data } = await API.get(`/community/${pId}`);
      setDetail(d => ({ ...d, [pId]: data }));
    } catch (err) { notify.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this post?')) return;
    await API.delete(`/community/${id}`).catch(() => {});
    setExpanded(null);
    fetchPosts();
  };

  const handleDeleteComment = async (pId, cId) => {
    if (!window.confirm('Delete comment?')) return;
    await API.delete(`/community/${pId}/comments/${cId}`).catch(() => {});
    const { data } = await API.get(`/community/${pId}`);
    setDetail(d => ({ ...d, [pId]: data }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.content) { notify.error('Title and content required'); return; }
    setSubmitting(true);
    try {
      await API.post('/community', form);
      notify.success('Post published!');
      setForm({ title: '', content: '', category: 'discussion' });
      setComposing(false);
      fetchPosts();
    } catch (err) { notify.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const filtered = posts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.author?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease', maxWidth: 720, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--primary)', display: 'flex' }}><Ic.Chat size={22} /></span>
            Community
          </div>
          <div className="page-subtitle">Connect and share with fellow nurses</div>
        </div>
        <button className={`btn ${composing ? 'btn-outline' : 'btn-primary'} btn-sm`} onClick={() => setComposing(c => !c)}>
          {composing ? (
            <><Ic.X size={14} /> Cancel</>
          ) : (
            <><Ic.Plus size={14} /> New Post</>
          )}
        </button>
      </div>

      {/* ── Compose ── */}
      {composing && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 22, backdropFilter: 'blur(16px)', animation: 'fadeInUp 0.2s ease' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>Create a Post</div>
          <form onSubmit={handleSubmit}>
            {/* Category selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {Object.entries(CAT).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setForm(f => ({ ...f, category: key }))}
                  style={{ padding: '5px 14px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.15s', border: '1px solid', background: form.category === key ? cfg.color : cfg.bg, color: form.category === key ? '#fff' : cfg.color, borderColor: form.category === key ? cfg.color : cfg.border }}>
                  {cfg.label}
                </button>
              ))}
            </div>
            <div className="form-group">
              <input className="form-input" placeholder="Post title…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <textarea className="form-textarea" style={{ minHeight: 100 }} placeholder="Share your thoughts…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish'} {!submitting && <Ic.ArrowRight size={14} />}
            </button>
          </form>
        </div>
      )}

      {/* ── Filter row ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', display: 'flex' }}>
            <Ic.Search size={14} />
          </span>
          <input style={{ width: '100%', height: 36, padding: '0 14px 0 32px', background: 'rgba(8,15,30,0.6)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', fontFamily: 'Inter,sans-serif', fontSize: '0.83rem', outline: 'none' }}
            placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'discussion', 'advice', 'experience', 'support'].map(c => {
          const cfg = c === 'all' ? { color: '#60a5fa', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)' } : getCat(c);
          const active = cat === c;
          return (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '5px 13px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.15s', background: active ? cfg.color : cfg.bg, color: active ? '#fff' : cfg.color, borderColor: active ? cfg.color : cfg.border }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          );
        })}
      </div>

      {/* ── Feed ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SkeletonPost /><SkeletonPost /><SkeletonPost />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text3)', marginBottom: 10 }}><Ic.Chat size={36} /></div>
          <div className="empty-state-text">{search ? 'No matching posts' : 'No posts yet'}</div>
          {!composing && <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setComposing(true)}><Ic.Plus size={14} /> Start the conversation</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(p => {
            const cfg = getCat(p.category);
            const isOpen = expanded === p._id;
            const postDetail = detail[p._id];

            return (
              <div key={p._id} className="feed-post" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                {/* Post header */}
                <div className="feed-post-body" style={{ cursor: 'pointer', paddingBottom: isOpen ? 16 : 20 }} onClick={() => isOpen ? setExpanded(null) : openPost(p._id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    {/* Avatar */}
                    <div style={{ 
                      width: 34, height: 34, borderRadius: '50%', 
                      background: p.author?.profilePic 
                        ? `url(http://localhost:5000${p.author.profilePic}) center/cover no-repeat` 
                        : `linear-gradient(135deg,${cfg.color},var(--bg3))`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.82rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                      border: p.author?.profilePic ? '1px solid var(--border)' : 'none',
                      textIndent: p.author?.profilePic ? '-9999px' : '0'
                    }}>
                      {(p.author?.name || 'N')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{p.author?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{timeAgo(p.createdAt)}</div>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999, textTransform: 'capitalize', flexShrink: 0 }}>
                      {p.category}
                    </span>
                    <span style={{ color: 'var(--text3)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'flex', flexShrink: 0 }}>
                      <Ic.ChevronDown size={16} />
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{p.title}</h3>
                </div>

                {/* Expanded content */}
                {isOpen && postDetail && (
                  <div>
                    <div style={{ padding: '0 24px 16px', color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.75, borderBottom: '1px solid var(--border-light)' }}>
                      {postDetail.content}
                      {(user?._id === postDetail.author?._id || user?.id === postDetail.author?._id || user?.role === 'admin') && (
                        <button className="btn btn-danger btn-sm" style={{ marginTop: 14 }} onClick={() => handleDelete(p._id)}>
                          <Ic.Trash size={13} /> Delete Post
                        </button>
                      )}
                    </div>

                    {/* Comments */}
                    <div style={{ padding: '14px 24px 0' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        {postDetail.comments?.length || 0} Comments
                      </div>
                      {postDetail.comments?.map(c => (
                        <div key={c._id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                          <div style={{ 
                            width: 28, height: 28, borderRadius: '50%', 
                            background: c.author?.profilePic 
                              ? `url(http://localhost:5000${c.author.profilePic}) center/cover no-repeat` 
                              : 'linear-gradient(135deg,var(--primary),var(--accent))', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                            border: c.author?.profilePic ? '1px solid var(--border)' : 'none',
                            textIndent: c.author?.profilePic ? '-9999px' : '0'
                          }}>
                            {(c.author?.name || 'N')[0]}
                          </div>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-light)', borderRadius: 9, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{c.author?.name}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{timeAgo(c.createdAt)}</span>
                              {(user?._id === c.author?._id || user?.id === c.author?._id || user?.role === 'admin') && (
                                <button className="btn-ghost btn-xs btn" style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text3)', padding: '2px 8px' }} onClick={() => handleDeleteComment(p._id, c._id)}>
                                  <Ic.Trash size={11} /> Delete
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>{c.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer: actions + comment */}
                <div className="feed-post-footer">
                  <button className={`feed-action-btn ${isOpen ? 'active' : ''}`} onClick={() => isOpen ? setExpanded(null) : openPost(p._id)}>
                    <Ic.Chat size={14} />
                    {p.comments?.length || 0} comments
                  </button>
                  {isOpen && (
                    <div style={{ display: 'flex', gap: 8, flex: 1, marginLeft: 8 }}>
                      <input
                        style={{ flex: 1, height: 32, padding: '0 12px', background: 'rgba(8,15,30,0.6)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'Inter,sans-serif', fontSize: '0.82rem', outline: 'none' }}
                        placeholder="Write a comment…"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleComment(p._id)}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleComment(p._id)}>Post</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
