import { useState, useEffect, useCallback, useMemo } from "react";
import API from "../../api/axios";
import { notify } from "../../utils/toast";
import SearchableSelect from "../../components/SearchableSelect";

const statusColor = {
  pending: "badge-yellow",
  approved: "badge-green",
  rejected: "badge-red",
};

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");

  const fetchLeaves = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = filter === "all" ? "/leave" : `/leave?status=${filter}`;
      const { data } = await API.get(url);
      setLeaves(data);
    } catch {
      setLeaves([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [hRes, wRes] = await Promise.all([
        API.get("/hospitals"),
        API.get("/wards"),
      ]);
      setHospitals(hRes.data);
      setWards(wRes.data);
    } catch (err) {
      console.error("Failed to fetch hospital/ward data");
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchInitialData();
  }, [fetchLeaves, fetchInitialData]);

  const filteredWards = useMemo(() => {
    if (hospitalFilter === "all") return wards;
    return wards.filter((w) => w.hospital === hospitalFilter);
  }, [wards, hospitalFilter]);

  useEffect(() => {
    setWardFilter("all");
  }, [hospitalFilter]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const hMatch =
        hospitalFilter === "all" || l.nurse?.hospital === hospitalFilter;
      const wMatch = wardFilter === "all" || l.nurse?.ward === wardFilter;
      return hMatch && wMatch;
    });
  }, [leaves, hospitalFilter, wardFilter]);

  useEffect(() => {
    let socket;
    import("../../utils/socketClient").then(({ getSocket }) => {
      socket = getSocket();
      if (!socket) return;

      const onUpdate = () => fetchLeaves(true);
      socket.on("leave:created", onUpdate);
      socket.on("leave:updated", onUpdate);
    });

    return () => {
      if (socket) {
        socket.off('leave:updated');
      }
    };
  }, [fetchLeaves]);

  const handleAction = async (id, status) => {
    try {
      await API.put(`/leave/${id}`, { status });
      fetchLeaves();
      notify.success(`Leave request ${status}.`);
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to update leave status.",
      );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🌴 Leave Management</div>
          <div className="page-subtitle">{leaves.length} request(s)</div>
        </div>
      </div>
      <div className="tabs">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            className={`tab-btn ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌴</div>
          <div className="empty-state-text">No {filter} leave requests.</div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nurse</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <strong>{l.nurse?.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {l.leaveType?.replace("_", " ")}
                      </span>
                    </td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td className="text-muted text-sm">{l.reason || "—"}</td>
                    <td>
                      <span
                        className={`badge ${statusColor[l.status] || "badge-gray"}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {l.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleAction(l._id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleAction(l._id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
