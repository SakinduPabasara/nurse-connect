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
        .user-grid {
           display: grid;
           grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
           gap: 16px;
           margin-top: 24px;
        }
        .user-card-premium {
           background: var(--surface);
           border: 1px solid var(--border);
           border-radius: 20px;
           padding: 24px;
           position: relative;
           transition: all 0.25s ease;
           display: flex;
           flex-direction: column;
           gap: 16px;
        }
        .user-card-premium:hover {
           transform: translateY(-4px);
           border-color: var(--primary-light);
           box-shadow: 0 12px 30px rgba(0,0,0,0.2);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 200, borderRadius: 20 }} />)}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <Ic.User size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div className="empty-state-text">No identity certificates found</div>
        </div>
      ) : (
        <div className="user-grid">
           {filteredUsers.map(u => {
              const isSelf = String(u._id) === String(loggedInUser?._id);
              return (
                 <div key={u._id} className="user-card-premium">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div className="avatar-box">
                          {u.name?.charAt(0).toUpperCase()}
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ 
                             background: u.role === 'admin' ? 'rgba(251,191,36,0.1)' : 'rgba(37,99,235,0.1)', 
                             color: u.role === 'admin' ? '#fbbf24' : 'var(--primary)',
                             padding: '4px 12px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase'
                          }}>{u.role}</span>
                          {!u.isVerified && <span style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700 }}>UNVERIFIED</span>}
                       </div>
                    </div>

                    <div>
                       <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>{u.name} {isSelf && <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>(You)</span>}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Ic.User size={12} /> {u.nic}
                       </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'grid', gap: 10 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: 'var(--text2)' }}>
                          <Ic.Hospital size={14} style={{ color: 'var(--text3)' }} /> {u.hospital || 'N/A'}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: 'var(--text2)' }}>
                          <Ic.Calendar size={14} style={{ color: 'var(--text3)' }} /> {u.ward || 'General Pool'}
                       </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</div>
                       {!isSelf && (
                          <button className="btn btn-ghost" onClick={() => handleDelete(u)} disabled={deletingId === u._id} style={{ color: '#f43f5e', padding: '6px' }}>
                             {deletingId === u._id ? '...' : <Ic.Transfer size={16} /> /* Using Transfer as a placeholder for "Delete/Purge" action look */}
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

