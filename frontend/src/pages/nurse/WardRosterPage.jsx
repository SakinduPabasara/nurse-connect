import { useState, useEffect, useMemo } from "react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import * as Ic from "../../components/icons";
import SearchableSelect from "../../components/SearchableSelect";

const SHIFT_META = {
  "7AM-1PM": {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.22)",
  },
  "1PM-7PM": {
    color: "#2dd4bf",
    bg: "rgba(45,212,191,0.12)",
    border: "rgba(45,212,191,0.22)",
  },
  "7AM-7PM": {
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.22)",
  },
  "7PM-7AM": {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.22)",
  },
};
const getMeta = (s) =>
  SHIFT_META[s] || {
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.22)",
  };

/* Derive gradient from initials */
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #2563eb, #06b6d4)",
  "linear-gradient(135deg, #7c3aed, #2563eb)",
  "linear-gradient(135deg, #059669, #06b6d4)",
  "linear-gradient(135deg, #d97706, #10b981)",
  "linear-gradient(135deg, #db2777, #7c3aed)",
  "linear-gradient(135deg, #0891b2, #6366f1)",
];
const avatarGradient = (name) =>
  AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

export default function WardRosterPage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const [ward, setWard] = useState(user?.ward || "");
  const [wards, setWards] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const wardOptions = useMemo(() => {
    const unique = [
      ...new Set([...(user?.ward ? [user.ward] : []), ...wards]),
    ].sort();
    return [
      { value: "__ALL__", label: "All Departments" },
      ...unique.map((w) => ({ value: w, label: w })),
    ];
  }, [user?.ward, wards]);

  useEffect(() => {
    if (!user?.hospital) {
      setWards(user?.ward ? [user.ward] : []);
      return;
    }

    API.get(`/wards?hospital=${encodeURIComponent(user.hospital)}`)
      .then((r) => (Array.isArray(r.data) ? r.data.map((w) => w.name) : []))
      .then((managed) => {
        const merged = [
          ...new Set([...(user?.ward ? [user.ward] : []), ...managed]),
        ].sort();
        setWards(merged);
      })
      .catch(() => setWards(user?.ward ? [user.ward] : []));
  }, [user?.hospital, user?.ward]);

  useEffect(() => {
    setWard(user?.ward || "");
  }, [user?.ward]);

  useEffect(() => {
    if (!ward) {
      setRoster([]);
      return;
    }
    setLoading(true);
    API.get(
      `/roster/ward/${ward === "__ALL__" ? "all" : encodeURIComponent(ward)}?month=${month}`,
    )
      .then((r) => setRoster(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRoster([]))
      .finally(() => setLoading(false));
  }, [month, ward]);

  const filtered = roster.filter(
    (e) =>
      !search ||
      (e.nurse?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.ward || "").toLowerCase().includes(search.toLowerCase()),
  );

  /* Group by date */
  const byDate = filtered.reduce((acc, e) => {
    const key = new Date(e.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div style={{ animation: "fadeInUp 0.35s ease" }}>
      <style>{`
        @media (max-width: 768px) {
          .roster-item-card { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .roster-item-card > div { width: 100%; }
        }
      `}</style>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div
            className="page-title"
            style={{ display: "flex", alignItems: "center", gap: 13 }}
          >
            <div
              className="page-title-icon"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--info))",
                boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
              }}
            >
              <Ic.Hospital size={22} />
            </div>
            Ward Roster & Occupancy
          </div>
          <div className="page-subtitle">
            Synchronized staffing schedule for unit operations
          </div>
        </div>
      </div>

      {/* ── Control Panel ── */}
      <div
        className="mobile-stack"
        style={{
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(6,182,212,0.04) 100%)",
          border: "1px solid rgba(37,99,235,0.15)",
          borderRadius: 22,
          padding: "24px 28px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -40,
            width: 200,
            height: 200,
            background:
              "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Ward info */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 6,
            }}
          >
            Operational Unit
          </div>
          <div
            style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            {ward === "__ALL__"
              ? "Hospital-Wide Overview"
              : ward || "Select a Ward"}
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: "0.76rem",
              color: "var(--text3)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Ic.Calendar size={13} />
              {new Date(month).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Ic.User size={13} />
              {roster.length} staff on duty
            </span>
          </div>
        </div>

        {/* Controls */}
        <div
          className="mobile-stack"
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            zIndex: 1,
            alignItems: "center",
          }}
        >
          <div className="mobile-w-full" style={{ width: 220 }}>
            <SearchableSelect
              options={wardOptions}
              value={ward}
              onChange={setWard}
              placeholder="Select Ward"
            />
          </div>
          <input
            type="month"
            className="form-input mobile-w-full"
            style={{
              width: 160,
              height: 48,
              background: "var(--input-bg, #1e293b)",
              border: "1px solid var(--border)",
            }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text3)",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          <Ic.Search size={16} />
        </span>
        <input
          className="form-input"
          style={{ paddingLeft: 42, height: 46, background: "var(--surface)" }}
          placeholder="Search by personnel name or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-card"
              style={{ height: 96, borderRadius: 18 }}
            />
          ))}
        </div>
      ) : !ward ? (
        <div className="empty-state">
          <div
            style={{
              color: "var(--text4)",
              marginBottom: 16,
              display: "flex",
              justifyContent: "center",
              opacity: 0.3,
            }}
          >
            <Ic.Hospital size={48} />
          </div>
          <div className="empty-state-text">Select an operational unit</div>
          <div className="empty-state-sub">
            Choose a ward from the dropdown above to view staffing
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div
            style={{
              color: "var(--text4)",
              marginBottom: 16,
              display: "flex",
              justifyContent: "center",
              opacity: 0.3,
            }}
          >
            <Ic.Inbox size={48} />
          </div>
          <div className="empty-state-text">No rostered personnel found</div>
          <div className="empty-state-sub">
            Try adjusting your search or selecting a different month
          </div>
        </div>
      ) : (
        <div className="bento-grid">
          {filtered.map((entry) => {
            const isMe = entry.nurse?._id === user?._id;
            const meta = getMeta(entry.shift);
            const dateObj = new Date(entry.date);
            const isToday = dateObj.toDateString() === now.toDateString();
            const nurseName = entry.nurse?.name || "Assigned Personnel";
            const grad = avatarGradient(nurseName);

            return (
              <div
                key={entry._id}
                className="bento-cell"
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  borderColor: isMe ? "var(--primary)" : "var(--border)",
                  background: isMe ? "hsla(226, 70%, 55%, 0.05)" : "var(--glass)",
                }}
              >
                {/* Date mini badge */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 48,
                    flexShrink: 0,
                    background: "var(--border-light)",
                    borderRadius: 14,
                    padding: "8px 4px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="sidebar-group-label"
                    style={{ fontSize: "0.55rem", padding: 0 }}
                  >
                    {dateObj.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: isToday ? "var(--success)" : "var(--text)",
                      lineHeight: 1,
                    }}
                  >
                    {dateObj.getDate()}
                  </span>
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 15,
                    flexShrink: 0,
                    background: entry.nurse?.profilePic ? "transparent" : grad,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "1rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    overflow: "hidden",
                    border: "2px solid var(--border)",
                  }}
                >
                  {entry.nurse?.profilePic ? (
                    <img
                      src={`http://localhost:5000${entry.nurse.profilePic}`}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    nurseName[0].toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      className="nurse-name-text"
                      style={{ fontWeight: 700, fontSize: "0.95rem" }}
                    >
                      {nurseName}
                    </span>
                    {isMe && <span className="badge badge-blue">Me</span>}
                  </div>
                  <div
                    className="page-subtitle"
                    style={{
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Ic.Clock size={12} /> {entry.shift}
                    </span>
                    {ward === "__ALL__" && (
                      <span
                        style={{ display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Ic.Hospital size={12} /> {entry.ward}
                      </span>
                    )}
                  </div>
                </div>

                {/* Shift color dot */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: meta.color,
                      boxShadow: `0 0 10px ${meta.color}`,
                    }}
                  />
                  {isToday && (
                    <span
                      className="badge badge-green"
                      style={{ fontSize: "0.5rem" }}
                    >
                      Live
                    </span>
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
