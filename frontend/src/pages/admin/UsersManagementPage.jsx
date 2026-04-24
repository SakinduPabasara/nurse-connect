import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { notify } from "../../utils/toast";
import { useConfirm } from "../../context/ConfirmContext";
import SearchableSelect from "../../components/SearchableSelect";

const roleBadgeClass = (role) =>
  role === "admin" ? "badge-yellow" : "badge-blue";

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
      const [hRes, wRes] = await Promise.all([
        API.get("/hospitals"),
        API.get("/wards")
      ]);
      setHospitals(hRes.data || []);
      setWards(wRes.data || []);
    } catch (err) {
      console.error("Filter fetch failed", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/auth/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchFilters();
  }, []);

  const filteredUsers = useMemo(() => {
    let list = users;
    
    // Filter by Hospital
    if (filterHospital) {
      list = list.filter(u => u.hospital === filterHospital);
    }
    
    // Filter by Ward
    if (filterWard) {
      list = list.filter(u => u.ward === filterWard);
    }

    const keyword = search.trim().toLowerCase();
    if (!keyword) return list;
    
    return list.filter(
      (u) =>
        u.name?.toLowerCase().includes(keyword) ||
        u.nic?.toLowerCase().includes(keyword) ||
        u.hospital?.toLowerCase().includes(keyword) ||
        u.ward?.toLowerCase().includes(keyword) ||
        u.telephone?.toLowerCase().includes(keyword) ||
        u.role?.toLowerCase().includes(keyword),
    );
  }, [users, search, filterHospital, filterWard]);

  const handleDelete = async (targetUser) => {
    const isSelf = String(targetUser._id) === String(loggedInUser?._id);
    if (isSelf) {
      notify.error("You cannot delete your own account while logged in.");
      return;
    }

    const confirmed = await confirm({
      title: "Delete User",
      message: `Are you sure you want to delete user ${targetUser.name} (${targetUser.nic})? This action cannot be undone.`,
      confirmText: "Delete User"
    });
    if (!confirmed) return;

    setDeletingId(targetUser._id);
    try {
      await API.delete(`/auth/users/${targetUser._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
      notify.success("User deleted successfully.");
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (message) {
        notify.error(message);
      } else if (status === 404) {
        notify.error(
          "Delete API not found on backend. Restart backend server and try again.",
        );
      } else {
        notify.error("Failed to delete user. Please try again.");
      }
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">👥 Users Management</div>
          <div className="page-subtitle">
            {filteredUsers.length} user(s) found
          </div>
        </div>
      <div className="filter-bar" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            className="search-input"
            style={{ width: '100%', height: 48 }}
            placeholder="Search name, NIC, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width: 220 }}>
          <SearchableSelect
            options={hospitals.map(h => ({ value: h.name, label: h.name }))}
            value={filterHospital}
            onChange={setFilterHospital}
            placeholder="All Hospitals"
          />
        </div>
        <div style={{ width: 220 }}>
          <SearchableSelect
            options={wards.map(w => ({ value: w.name, label: w.name }))}
            value={filterWard}
            onChange={setFilterWard}
            placeholder="All Wards"
          />
        </div>
        <button 
          className="btn btn-outline" 
          style={{ height: 48 }} 
          onClick={() => {setSearch(""); setFilterHospital(""); setFilterWard("");}}
        >
          Reset
        </button>
      </div>
    </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <div className="empty-state-text">
            No users found for the current filter.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>NIC</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Hospital</th>
                  <th>Ward</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = String(u._id) === String(loggedInUser?._id);
                  return (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.nic}</td>
                      <td>{u.telephone || "-"}</td>
                      <td>
                        <span className={`badge ${roleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.isVerified ? "Yes" : "No"}</td>
                      <td>{u.hospital || "-"}</td>
                      <td>
                        {u.ward ? (
                          <span style={{ 
                            background: 'rgba(139,92,246,0.1)', 
                            color: '#a78bfa', 
                            border: '1px solid rgba(139,92,246,0.22)', 
                            borderRadius: 999, 
                            padding: '4px 12px', 
                            fontSize: '0.72rem', 
                            fontWeight: 600, 
                            whiteSpace: 'nowrap' 
                          }}>
                            {u.ward}
                          </span>
                         ) : "-"}
                      </td>
                      <td>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(u)}
                          disabled={isSelf || deletingId === u._id}
                          title={
                            isSelf
                              ? "You cannot delete your own account while logged in"
                              : ""
                          }
                        >
                          {deletingId === u._id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
