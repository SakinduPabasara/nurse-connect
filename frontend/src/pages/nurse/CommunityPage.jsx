import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import * as Ic from '../../components/icons';
import { notify } from '../../utils/toast';
import { useConfirm } from '../../context/ConfirmContext';

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
  const confirm = useConfirm();
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
    const isConfirmed = await confirm({ title: "Delete Post", message: "Are you sure you want to delete this post?", confirmText: "Delete Post" });
    if (!isConfirmed) return;
    await API.delete(`/community/${id}`).catch(() => {});
    setExpanded(null);
    fetchPosts();
  };

  const handleDeleteComment = async (pId, cId) => {
    const isConfirmed = await confirm({ title: "Delete Comment", message: "Are you sure you want to delete this comment?", confirmText: "Delete Comment" });
    if (!isConfirmed) return;
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
        <div style={{ 
          background: 'rgba(23, 31, 48, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.12)', 
          borderRadius: 24, 
          padding: '32px', 
          marginBottom: 32, 
          backdropFilter: 'blur(24px)', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)',
          animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37, 99, 235, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Plus size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>Create a Publication</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Share insights, ask for advice, or support your colleagues.</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
            {/* Category selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Select Category</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {Object.entries(CAT).map(([key, cfg]) => {
                  const isActive = form.category === key;
                  return (
                    <button 
                      key={key} 
                      type="button" 
                      onClick={() => setForm(f => ({ ...f, category: key }))}
                      style={{ 
                        padding: '10px 18px', 
                        borderRadius: 14, 
                        fontSize: '0.82rem', 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                        border: '1px solid', 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: isActive ? cfg.color : 'rgba(255,255,255,0.03)', 
                        color: isActive ? '#fff' : 'var(--text2)', 
                        borderColor: isActive ? cfg.color : 'rgba(255,255,255,0.1)',
                        boxShadow: isActive ? `0 8px 20px ${cfg.bg}` : 'none',
                        transform: isActive ? 'translateY(-2px)' : 'none'
                      }}
                    >
                      <div style={{ opacity: isActive ? 1 : 0.6 }}>
                        {key === 'discussion' && <Ic.Chat size={14} />}
                        {key === 'advice' && <Ic.Info size={14} />}
                        {key === 'experience' && <Ic.Globe size={14} />}
                        {key === 'support' && <Ic.Heart size={14} />}
                      </div>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <input 
                className="form-input" 
                placeholder="Give your post a compelling title..." 
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', height: 50, borderRadius: 14, fontSize: '1rem', fontWeight: 600 }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea 
                className="form-textarea" 
                style={{ minHeight: 140, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px', lineHeight: 1.6 }} 
                placeholder="What's on your mind? Detailed thoughts encourage better engagement..." 
                value={form.content} 
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
               <button type="button" className="btn btn-outline" style={{ borderRadius: 12, height: 48, padding: '0 24px' }} onClick={() => setComposing(false)}>Discard</button>
               <button className="btn btn-primary" type="submit" disabled={submitting} style={{ borderRadius: 12, height: 48, padding: '0 32px', fontWeight: 700 }}>
                 {submitting ? 'Publishing Post...' : 'Publish to Community'} {!submitting && <Ic.ArrowRight size={16} style={{ marginLeft: 8 }} />}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter row ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', display: 'flex' }}>
            <Ic.Search size={16} />
          </span>
          <input 
            style={{ 
              width: '100%', 
              height: 48, 
              padding: '0 14px 0 42px', 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: 14, 
              color: 'var(--text)', 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '0.88rem', 
              outline: 'none',
              transition: 'all 0.2s'
            }}
            placeholder="Search discussions or colleagues..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'discussion', 'advice', 'experience', 'support'].map(c => {
            const cfg = c === 'all' ? { color: '#60a5fa', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)' } : getCat(c);
            const active = cat === c;
            return (
              <button 
                key={c} 
                onClick={() => setCat(c)} 
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: 12, 
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  border: '1px solid', 
                  cursor: 'pointer', 
                  fontFamily: "'Inter', sans-serif", 
                  transition: 'all 0.2s', 
                  background: active ? cfg.color : 'rgba(255,255,255,0.03)', 
                  color: active ? '#fff' : 'var(--text2)', 
                  borderColor: active ? cfg.color : 'rgba(255,255,255,0.1)' 
                }}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            );
          })}
        </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(p => {
            const cfg = getCat(p.category);
            const isOpen = expanded === p._id;
            const postDetail = detail[p._id];

            return (
              <div key={p._id} className="feed-post" style={{ 
                borderLeft: `none`,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 20,
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: cfg.color, opacity: 0.8 }} />
                
                {/* Post header */}
                <div className="feed-post-body" style={{ cursor: 'pointer', padding: '24px 28px', paddingBottom: isOpen ? 16 : 24 }} onClick={() => isOpen ? setExpanded(null) : openPost(p._id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    {/* Avatar */}
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 14, 
                      background: p.author?.profilePic 
                        ? `url(http://localhost:5000${p.author.profilePic}) center/cover no-repeat` 
                        : `linear-gradient(135deg, ${cfg.color}, #1e293b)`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.9rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      border: p.author?.profilePic ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      textIndent: p.author?.profilePic ? '-9999px' : '0'
                    }}>
                      {(p.author?.name || 'N')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{p.author?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 500 }}>{timeAgo(p.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                       {(user?._id === p.author?._id || user?.id === p.author?._id || user?.role === 'admin') && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                           style={{ 
                             background: 'rgba(239, 68, 68, 0.1)', 
                             border: '1px solid rgba(239, 68, 68, 0.2)', 
                             color: '#f87171', 
                             width: 32, height: 32, 
                             borderRadius: 8, 
                             display: 'flex', 
                             alignItems: 'center', 
                             justifyContent: 'center',
                             cursor: 'pointer',
                             transition: 'all 0.2s'
                           }}
                           onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                           onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#f87171'; }}
                         >
                           <Ic.Trash size={14} />
                         </button>
                       )}
                       <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '0.7rem', fontWeight: 800, padding: '4px 12px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                         {p.category}
                       </span>
                       <span style={{ color: 'var(--text3)', opacity: 0.5, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                         <Ic.ChevronDown size={18} />
                       </span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', lineHeight: 1.5, letterSpacing: '-0.01em' }}>{p.title}</h3>
                </div>

                {/* Expanded content */}
                {isOpen && postDetail && (
                  <div>
                    <div style={{ padding: '0 28px 24px', color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {postDetail.content}
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
