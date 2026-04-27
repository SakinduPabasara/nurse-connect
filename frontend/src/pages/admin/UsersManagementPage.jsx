import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import SearchableSelect from "../../components/SearchableSelect";
import * as Ic from "../../components/icons";

export default function UsersManagementPage() {
  const confirm = useConfirm();
  const { user: loggedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHospital, setFilterHospital] = useState("");
  const [filterWard, setFilterWard] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [wards, setWards] = useState([]);

  const fetchFilters = async () => {
    try {
      const [hRes, wRes] = await Promise.all([API.get("/hospitals"), API.get("/wards")]);
      setHospitals(hRes.data || []);
      setWards(wRes.data || []);
    } catch (err) { console.error("Filter fetch failed", err); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/auth/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); fetchFilters(); }, []);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (filterHospital) list = list.filter(u => u.hospital === filterHospital);
    if (filterWard) list = list.filter(u => u.ward === filterWard);
    const keyword = search.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter(u =>
        u.name?.toLowerCase().includes(keyword) ||
        u.nic?.toLowerCase().includes(keyword) ||
        u.hospital?.toLowerCase().includes(keyword) ||
        u.ward?.toLowerCase().includes(keyword) ||
        u.telephone?.toLowerCase().includes(keyword) ||
        u.role?.toLowerCase().includes(keyword)
    );
  }, [users, search, filterHospital, filterWard]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    nurses: users.filter(u => u.role === 'nurse').length,
    pending: users.filter(u => !u.isVerified).length
  }), [users]);

  const handleDelete = async (targetUser) => {
    if (String(targetUser._id) === String(loggedInUser?._id)) {
      notify.error("You cannot delete your own session."); return;
    }
    const confirmed = await confirm({
      title: "Terminate User Identity",
      message: `Permanently delete ${targetUser.name}? This will revoke all system access immediately.`,
      confirmText: "Terminate Access"
    });
    if (!confirmed) return;
    setDeletingId(targetUser._id);
    try {
      await API.delete(`/auth/users/${targetUser._id}`);
      setUsers(prev => prev.filter(u => u._id !== targetUser._id));
      notify.success("Identity purged.");
    } catch (err) { notify.error("Failed to revoke access."); }
    finally { setDeletingId(""); }
  };

  return (
    <div className="users-mgmt-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        .user-list {
           display: flex;
           flex-direction: column;
           gap: 12px;
           margin-top: 24px;
        }
        .user-row-premium {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 16px;
           padding: 14px 24px;
           display: flex;
           align-items: center;
           gap: 20px;
           transition: all 0.2s ease;
           position: relative;
        }
        .user-row-premium:hover {
           border-color: var(--primary-light);
           background: var(--bg2);
           transform: translateX(6px);
        }
        .col-main { flex: 2.2; display: flex; align-items: center; gap: 16px; min-width: 220px; }
        .col-hospital { flex: 1.8; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text2); min-width: 180px; overflow: hidden; }
        .col-ward { flex: 1.5; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text2); min-width: 150px; overflow: hidden; }
        .col-meta { flex: 1; text-align: right; min-width: 130px; }
        .col-actions { width: 50px; display: flex; justify-content: flex-end; }
        .btn-delete-premium {
           width: 38px;
           height: 38px;
           border-radius: 12px;
           background: rgba(244,63,94,0.1);
           border: 1px solid rgba(244,63,94,0.2);
           color: #f43f5e;
           display: flex;
           align-items: center;
           justify-content: center;
           transition: all 0.2s ease;
           cursor: pointer;
           padding: 0;
        }
        .btn-delete-premium:hover {
           background: #f43f5e;
           color: #fff;
           transform: scale(1.05);
           box-shadow: 0 4px 12px rgba(244,63,94,0.3);
        }
        .btn-delete-premium:disabled {
           opacity: 0.5;
           cursor: not-allowed;
        }
        .avatar-box {
           width: 54px;
           height: 54px;
           border-radius: 16px;
           background: var(--bg3);
           display: flex;
           align-items: center;
           justify-content: center;
           color: var(--primary);
           font-weight: 800;
           font-size: 1.2rem;
           border: 1px solid var(--border);
        }
        .stats-strip {
           display: flex;
           gap: 12px;
           margin-bottom: 24px;
           overflow-x: auto;
           padding-bottom: 8px;
        }
        .mini-stat {
           background: var(--bg2);
           border: 1px solid var(--border);
           padding: 12px 20px;
           border-radius: 14px;
           flex: 1;
           min-width: 140px;
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Ic.User size={24} />
            </div>
            Institutional Identity Management
          </div>
          <div className="page-subtitle">Governance of professional credentials and access tiers</div>
        </div>
      </div>

      <div className="stats-strip">
         <div className="mini-stat">
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Consolidated Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.total}</div>
         </div>
         <div className="mini-stat">
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Authorities (Admins)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{stats.admins}</div>
         </div>
         <div className="mini-stat">
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Medical Staff</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.nurses}</div>
         </div>
         <div className="mini-stat">
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Unverified</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e' }}>{stats.pending}</div>
         </div>
      </div>

      <div className="filter-bar-premium" style={{ background: 'var(--surface)', padding: 16, borderRadius: 18, border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
         <div style={{ flex: 1, position: 'relative' }}>
            <Ic.User size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--text3)' }} />
            <input className="form-input" placeholder="Query name, NIC, or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44, background: 'var(--bg2)', border: 'none' }} />
         </div>
         <div style={{ width: 220 }}>
            <SearchableSelect options={hospitals.map(h => ({ value: h.name, label: h.name }))} value={filterHospital} onChange={setFilterHospital} placeholder="Global Hospitals" />
         </div>
         <div style={{ width: 200 }}>
            <SearchableSelect options={wards.map(w => ({ value: w.name, label: w.name }))} value={filterWard} onChange={setFilterWard} placeholder="Global Wards" />
         </div>
         <button className="btn btn-ghost" onClick={() => {setSearch(""); setFilterHospital(""); setFilterWard("");}} style={{ color: 'var(--text3)' }}>Reset</button>
      </div>

      {loading ? (
        <div className="user-list">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 72, borderRadius: 16 }} />)}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <Ic.User size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div className="empty-state-text">No identity certificates found</div>
        </div>
      ) : (
        <div className="user-list">
           {filteredUsers.map(u => {
              const isSelf = String(u._id) === String(loggedInUser?._id);
              return (
                 <div key={u._id} className="user-row-premium">
                    <div className="col-main">
                       <div className="avatar-box" style={{ width: 44, height: 44, fontSize: '1rem', borderRadius: 12 }}>
                          {u.name?.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text1)' }}>
                             {u.name} {isSelf && <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>{u.nic} • {u.telephone || 'N/A'}</div>
                       </div>
                    </div>

                    <div className="col-hospital">
                       <Ic.Hospital size={15} style={{ color: 'var(--primary)', opacity: 0.8, flexShrink: 0 }} />
                       <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.hospital || 'Not Assigned'}</span>
                    </div>

                    <div className="col-ward">
                       <Ic.Calendar size={15} style={{ color: 'var(--primary)', opacity: 0.8, flexShrink: 0 }} />
                       <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.ward || 'General Pool'}</span>
                    </div>

                    <div className="col-meta">
                       <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 6 }}>
                          <span style={{ 
                             background: u.role === 'admin' ? 'rgba(251,191,36,0.1)' : 'rgba(37,99,235,0.1)', 
                             color: u.role === 'admin' ? '#fbbf24' : 'var(--primary)',
                             padding: '3px 10px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase'
                          }}>{u.role}</span>
                          {!u.isVerified && <span style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '3px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700 }}>PENDING</span>}
                       </div>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</div>
                    </div>

                    <div className="col-actions">
                       {!isSelf && (
                          <button 
                             className="btn-delete-premium" 
                             onClick={() => handleDelete(u)} 
                             disabled={deletingId === u._id}
                             title="Terminate Access"
                          >
                             {deletingId === u._id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Ic.Trash size={18} />}
                          </button>
                       )}
                    </div>
                 </div>
              )
           })}
        </div>
      )}
    </div>
  );
}

