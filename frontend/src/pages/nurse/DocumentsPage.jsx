import { useState, useEffect } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';
import { notify } from '../../utils/toast';

const CAT = {
  guideline: { color: '#60a5fa', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)', Icon: Ic.FileText },
  protocol:  { color: '#22d3ee', bg: 'rgba(6,182,212,0.1)',  border: 'rgba(6,182,212,0.2)', Icon: Ic.Tag },
  training:  { color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', Icon: Ic.Award },
  reference: { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', Icon: Ic.Info },
  other:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)', Icon: Ic.FileText },
};
const getCat = c => CAT[c] || CAT.other;

function SkeletonDocCard() {
  return (
    <div className="skeleton-card masonry-item" style={{ borderRadius: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10 }} className="skeleton" />
      <div className="skeleton skeleton-title" style={{ width: '80%' }} />
      <div className="skeleton skeleton-text" style={{ width: '100%' }} />
      <div className="skeleton skeleton-text" style={{ width: '70%' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton skeleton-btn" style={{ flex: 1 }} />
        <div className="skeleton skeleton-btn" style={{ width: 56 }} />
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  const fetchDocs = async (q) => {
    setLoading(true);
    try {
      let url = '/documents';
      const params = [];
      if (cat !== 'all') params.push(`category=${cat}`);
      if (q?.trim()) params.push(`search=${encodeURIComponent(q.trim())}`);
      if (params.length) url += '?' + params.join('&');
      const { data } = await API.get(url);
      setDocs(data);
    } catch { setDocs([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(''); }, [cat]); // reset search on category change


  const handleSearch = e => { e.preventDefault(); fetchDocs(search); };

  const parseBlobErr = async blob => { try { return JSON.parse(await blob.text())?.message || ''; } catch { return ''; } };
  const triggerDownload = (blob, name) => {
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const downloadFrom = async (url, doc) => {
    const r = await API.get(url, { responseType: 'blob' });
    if ((r.headers['content-type'] || '').includes('application/json')) {
      const m = await parseBlobErr(r.data); throw new Error(m || 'Error');
    }
    const cd = r.headers['content-disposition'];
    const m = cd?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
    triggerDownload(r.data, m?.[1] ? decodeURIComponent(m[1].replace(/"/g,'').trim()) : (doc.fileName || doc.title || 'document'));
  };
  const handleDownload = async doc => {
    try {
      try { await downloadFrom(`/documents/${doc._id}/download`, doc); }
      catch { try { await downloadFrom(`/documents/download/${doc._id}`, doc); }
        catch { if (!doc.fileUrl || doc.fileUrl === 'none') throw new Error('No file.'); await downloadFrom(doc.fileUrl, doc); }
      }
      notify.success('Download started');
    } catch (err) { notify.error(err.message || 'Download failed'); }
  };

  const filtered = docs.filter(d =>
    (cat === 'all' || d.category === cat) &&
    (!search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.description||'').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--primary)', display: 'flex' }}><Ic.FileText size={22} /></span>
            Document Library
          </div>
          <div className="page-subtitle">{docs.length} documents across {Object.keys(CAT).filter(k => docs.some(d => d.category === k)).length} categories</div>
        </div>
      </div>

      {/* ── Search ── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', display: 'flex' }}><Ic.Search size={14} /></span>
          <input className="form-input" style={{ paddingLeft: 34, height: 38 }} placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-outline btn-sm" type="submit">Search</button>
        {(search || cat !== 'all') && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setSearch(''); setCat('all'); }}>
            <Ic.X size={13} /> Clear
          </button>
        )}
      </form>

      {/* ── Category tabs ── */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {['all', ...Object.keys(CAT)].map(c => {
          const cfg = c === 'all' ? null : getCat(c);
          const count = c === 'all' ? docs.length : docs.filter(d => d.category === c).length;
          return (
            <button key={c} className={`tab-btn${cat === c ? ' active' : ''}`} onClick={() => setCat(c)} style={cat === c && cfg ? { background: cfg.color } : {}}>
              {cfg && cfg.Icon ? <cfg.Icon size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> : null}
              {c.charAt(0).toUpperCase() + c.slice(1)}
              {count > 0 && <span style={{ marginLeft: 6, background: cat === c ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)', borderRadius: 999, padding: '0 6px', fontSize: '0.68rem', fontWeight: 700 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Masonry grid ── */}
      {loading ? (
        <div className="masonry-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonDocCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text3)', marginBottom: 12 }}><Ic.FileText size={36} /></div>
          <div className="empty-state-text">No documents found</div>
          {(cat !== 'all' || search) && (
            <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => { setCat('all'); setSearch(''); }}>
              <Ic.X size={13} /> Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="masonry-grid">
          {filtered.map(d => {
            const cfg = getCat(d.category);
            const Icon = cfg.Icon;
            return (
              <div key={d._id} className="masonry-item">
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '20px 22px',
                  backdropFilter: 'blur(16px)',
                  transition: 'all 0.18s',
                  borderTop: `3px solid ${cfg.color}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Icon + category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999, textTransform: 'capitalize' }}>
                      {d.category}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text3)' }}>
                      {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '0.93rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 8 }}>{d.title}</h3>

                  {/* Description */}
                  {d.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text3)', lineHeight: 1.65, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {d.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleDownload(d)} style={{ flex: 1, justifyContent: 'center' }}>
                      <Ic.Download size={13} /> Download
                    </button>
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                      <Ic.ExternalLink size={13} />
                    </a>
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
