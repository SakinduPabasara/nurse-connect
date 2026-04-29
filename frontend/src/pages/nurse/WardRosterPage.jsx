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
    Promise.all([
      API.get("/wards")
        .then((r) => (Array.isArray(r.data) ? r.data.map((w) => w.name) : []))
        .catch(() => []),
      API.get("/roster/wards")
        .then((r) => (Array.isArray(r.data) ? r.data : []))
        .catch(() => []),
    ]).then(([managed, rosterWards]) => {
      const merged = [...new Set([...managed, ...rosterWards])].sort();
      setWards(merged);
    });
  }, []);

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
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            zIndex: 1,
            alignItems: "center",
          }}
        >
          <div style={{ width: 220 }}>
            <SearchableSelect
              options={wardOptions}
              value={ward}
              onChange={setWard}
              placeholder="Select Ward"
            />
          </div>
          <input
            type="month"
            className="form-input"
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
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
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
        /* Flat grid — all entries */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((entry) => {
            const isMe = entry.nurse?._id === user?._id;
            const meta = getMeta(entry.shift);
            const dateObj = new Date(entry.date);
            const isToday = dateObj.toDateString() === now.toDateString();
            const nurseName = entry.nurse?.name || "Assigned Nurse";
            const grad = avatarGradient(nurseName);

            return (
              <div
                key={entry._id}
                style={{
                  background: isMe ? "rgba(37,99,235,0.06)" : "var(--surface)",
                  border: `1px solid ${isMe ? "rgba(37,99,235,0.3)" : "var(--border)"}`,
                  borderRadius: 18,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transition: "all 0.22s ease",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: isMe ? "0 0 20px rgba(37,99,235,0.1)" : "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(0,0,0,0.4)";
                  e.currentTarget.style.borderColor = isMe
                    ? "rgba(37,99,235,0.5)"
                    : "rgba(148,163,184,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = isMe
                    ? "0 0 20px rgba(37,99,235,0.1)"
                    : "none";
                  e.currentTarget.style.borderColor = isMe
                    ? "rgba(37,99,235,0.3)"
                    : "var(--border)";
                }}
              >
                {/* Date mini badge */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 44,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 11,
                    padding: "7px 4px",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "var(--text3)",
                      textTransform: "uppercase",
                    }}
                  >
                    {dateObj.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: isToday ? "#34d399" : "var(--text)",
                      lineHeight: 1,
                    }}
                  >
                    {dateObj.getDate()}
                  </span>
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    flexShrink: 0,
                    background: entry.nurse?.profilePic ? "transparent" : grad,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
                    overflow: "hidden",
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
                      gap: 7,
                      marginBottom: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {nurseName}
                    </span>
                    {isMe && (
                      <span
                        style={{
                          background: "var(--primary)",
                          color: "#fff",
                          fontSize: "0.56rem",
                          fontWeight: 900,
                          padding: "2px 7px",
                          borderRadius: 5,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          flexShrink: 0,
                        }}
                      >
                        Me
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.73rem",
                      color: "var(--text3)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Ic.Clock size={11} /> {entry.shift}
                    </span>
                    {ward === "__ALL__" && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Ic.Hospital size={11} /> {entry.ward}
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
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: meta.color,
                      boxShadow: `0 0 8px ${meta.color}`,
                    }}
                  />
                  {isToday && (
                    <span
                      style={{
                        fontSize: "0.57rem",
                        fontWeight: 800,
                        color: "#34d399",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        animation: "glow-pulse 2s ease infinite",
                      }}
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
