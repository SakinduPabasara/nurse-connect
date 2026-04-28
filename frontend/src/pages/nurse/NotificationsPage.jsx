import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { notify } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useConfirm } from "../../context/ConfirmContext";

/* ── Smart deep-link resolver ─────────────────────────────────── */
// Returns the destination route for a notification based on its
// message content and the role of the current user.
function resolveNotificationLink(message, type, role) {
  const m = (message || "").toLowerCase();
  const t = (type || "").toLowerCase();

  /* ── ADMIN routes ── */
  if (role === "admin") {
    // 1. Level: Specific Action/Management Requests
    if (
      t === "overtime" ||
      m.includes("overtime") ||
      m.includes(" applied for ot")
    )
      return "/admin/overtime";

    if (
      t === "leave" ||
      (m.includes("leave") &&
        (m.includes("request") ||
          m.includes("applied") ||
          m.includes("approval")))
    )
      return "/admin/leave";

    if (t === "swap" || m.includes("swap request")) return "/admin/swaps";

    if (
      m.includes("verification") ||
      m.includes("registration pending") ||
      m.includes("new nurse registration")
    )
      return "/admin/verify";

    // 2. Level: Dynamic/Content
    if (t === "news" || m.includes("news")) return "/admin/news";
    if (t === "notice" || m.includes("notice")) return "/admin/notices";
    if (t === "community" || m.includes("post") || m.includes("community"))
      return "/admin/community";
    if (m.includes("drug") || m.includes("medication")) return "/admin/drugs";
    if (m.includes("equipment")) return "/admin/equipment";
    if (m.includes("document")) return "/admin/documents";
    if (m.includes("opportunit")) return "/admin/opportunities";

    // 3. Level: Core Infrastructure
    if (t === "roster" || m.includes("roster") || m.includes("shift"))
      return "/admin/roster";
    if (m.includes("hospital")) return "/admin/hospitals";
    if (m.includes("ward")) return "/admin/wards";

    return null;
  }

  /* ── NURSE routes ── */
  // 1. Level: Personal Status/Requests
  if (t === "overtime" || m.includes("overtime")) return "/overtime";
  if (t === "leave" || m.includes("leave")) return "/leave";
  if (t === "swap" || m.includes("swap")) return "/swap";
  if (t === "transfer" || m.includes("transfer")) return "/transfer";

  if (
    m.includes("verified") ||
    m.includes("account approved") ||
    m.includes("registration approved")
  )
    return "/dashboard";

  // 2. Level: Core Operations
  if (t === "roster" || m.includes("roster") || m.includes("shift"))
    return "/my-roster";

  // 3. Level: Hospital Content
  if (t === "news" || m.includes("news")) return "/news";
  if (t === "notice" || m.includes("notice")) return "/notices";
  if (m.includes("drug") || m.includes("medication")) return "/drugs";
  if (m.includes("equipment")) return "/equipment";
  if (m.includes("document")) return "/documents";
  if (m.includes("community") || m.includes("post") || m.includes("community"))
    return "/community";
  if (m.includes("opportunit")) return "/opportunities";

  return null;
}

/* ── Type config ──────────────────────────────────────────────── */
const TYPE_CONFIG = {
  announcement: {
    label: "Announcement",
    icon: "📢",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
    badge: "badge-yellow",
  },
  swap: {
    label: "Shift Swap",
    icon: "🔄",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
    border: "rgba(6,182,212,0.35)",
    badge: "badge-cyan",
  },
  leave: {
    label: "Leave",
    icon: "🌴",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.35)",
    badge: "badge-green",
  },
  roster: {
    label: "Roster",
    icon: "📅",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.12)",
    border: "rgba(37,99,235,0.35)",
    badge: "badge-blue",
  },
  transfer: {
    label: "Transfer",
    icon: "🚀",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.35)",
    badge: "badge-purple",
  },
  news: {
    label: "Health News",
    icon: "🏥",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
    badge: "badge-red",
  },
  overtime: {
    label: "Overtime",
    icon: "⏰",
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.12)",
    border: "rgba(6,182,212,0.35)",
    badge: "badge-cyan",
  },
  leave: {
    label: "Leave",
    icon: "🌴",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.35)",
    badge: "badge-green",
  },
  transfer: {
    label: "Transfer",
    icon: "🚀",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.35)",
    badge: "badge-purple",
  },
};

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] || {
    label: "General",
    icon: "🔔",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.25)",
    badge: "badge-gray",
  };

/* ── Time helpers ─────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getGroup(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This Week";
  if (days < 30) return "This Month";
  return "Older";
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "This Month", "Older"];

/* ── Main Component ───────────────────────────────────────────── */
export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { refresh: refreshBadge, notifications: newSocketNotifs } =
    useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const role = user?.role || "nurse";

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get("/notifications");
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Check if socket is connected
    import("../../utils/socketClient").then(({ getSocket }) => {
      const socket = getSocket();
      if (socket) {
        setSocketConnected(socket.connected);
        socket.on("connect", () => setSocketConnected(true));
        socket.on("disconnect", () => setSocketConnected(false));
      }
    });
  }, []);

  // Prepend real-time socket notifications
  useEffect(() => {
    if (newSocketNotifs?.length > 0) {
      setNotifications((prev) => {
        // Prevent duplicates
        const existingIds = new Set(prev.map((n) => n._id));
        const toAdd = newSocketNotifs.filter((n) => !existingIds.has(n._id));
        if (toAdd.length === 0) return prev;
        return [...toAdd, ...prev];
      });
    }
  }, [newSocketNotifs]);

  /* ── Derived counts ── */
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  /* ── Filter & search ── */
  const visible = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === "unread" && n.isRead) return false;
      if (filterTab === "read" && !n.isRead) return false;
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (
        search.trim() &&
        !n.message.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [notifications, filterTab, typeFilter, search]);

  /* ── Group by time ── */
  const grouped = useMemo(() => {
    const map = {};
    visible.forEach((n) => {
      const g = getGroup(n.createdAt);
      if (!map[g]) map[g] = [];
      map[g].push(n);
    });
    return map;
  }, [visible]);

  /* ── Actions ── */
  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setSelected((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      refreshBadge(); // update sidebar badge immediately
    } catch {
      notify.error("Failed to mark as read.");
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      await API.put(`/notifications/mark-all-read`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setSelected(new Set());
      notify.success("All notifications marked as read.");
      refreshBadge(); // update sidebar badge immediately
    } catch {
      notify.error("Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteAll = async () => {
    if (notifications.length === 0) return;

    // Show modern confirmation modal
    const confirmed = await confirm({
      title: "🗑️ Clear All Notifications",
      message: `Are you sure you want to delete all ${notifications.length} notifications? This action cannot be undone.`,
      confirmText: "Delete All",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setDeletingAll(true);
    try {
      await API.delete("/notifications");
      setNotifications([]);
      setSelected(new Set());
      notify.success("All notifications deleted successfully.");
      refreshBadge(); // update sidebar badge immediately
    } catch {
      notify.error("Failed to delete all notifications.");
    } finally {
      setDeletingAll(false);
    }
  };

  const markSelectedRead = async () => {
    const ids = [...selected].filter(
      (id) => !notifications.find((n) => n._id === id)?.isRead,
    );
    try {
      await Promise.all(ids.map((id) => API.put(`/notifications/${id}/read`)));
      setNotifications((prev) =>
        prev.map((n) => (selected.has(n._id) ? { ...n, isRead: true } : n)),
      );
      setSelected(new Set());
      notify.success(`${ids.length} notification(s) marked as read.`);
      refreshBadge(); // update sidebar badge immediately
    } catch {
      notify.error("Failed to mark selected as read.");
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === visible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map((n) => n._id)));
    }
  };

  /* ── Unique types present ── */
  const presentTypes = useMemo(() => {
    const types = [...new Set(notifications.map((n) => n.type))];
    return types;
  }, [notifications]);

  /* ── Stats ── */
  const statsData = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const today = notifications.filter(
      (n) => getGroup(n.createdAt) === "Today",
    ).length;
    return { total, unread, today };
  }, [notifications]);

  /* ── Render ── */
  return (
    <div style={{ animation: "fadeInUp 0.35s ease" }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: 0.6; }
        }
        .notif-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          transition: all 0.2s ease;
          backdrop-filter: blur(12px);
          cursor: default;
          position: relative;
          overflow: hidden;
          animation: slideIn 0.25s ease;
        }
        .notif-card.clickable {
          cursor: pointer;
        }
        .notif-card.clickable:hover {
          border-color: rgba(37,99,235,0.4) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        }
        .notif-card:not(.clickable):hover {
          border-color: rgba(148,163,184,0.28);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        }
        .notif-card.unread::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          border-radius: 14px 0 0 14px;
        }
        .notif-icon-wrap {
          width: 42px; height: 42px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .notif-checkbox {
          width: 18px; height: 18px;
          border-radius: 5px;
          border: 1.5px solid var(--border);
          background: transparent;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          transition: all 0.15s;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .notif-checkbox:checked {
          background: var(--primary);
          border-color: var(--primary);
          background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
        }
        .notif-checkbox:hover { border-color: var(--primary); }
        .unread-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--primary);
          flex-shrink: 0;
          margin-top: 7px;
          animation: pulse-dot 2s ease infinite;
        }
        .group-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text3);
          padding: 6px 0 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .group-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .type-chip {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .type-chip:hover { opacity: 0.85; }
        .mark-read-btn {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text2);
          font-size: 0.78rem;
          font-weight: 500;
          padding: 5px 12px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
        }
        .mark-read-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(37,99,235,0.08);
        }
        .notif-stats-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .notif-stat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px 20px;
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          gap: 14px;
          transition: transform 0.2s;
        }
        .notif-stat:hover { transform: translateY(-2px); }
        .notif-stat-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem;
        }
        .notif-stat-label { font-size: 0.78rem; color: var(--text2); font-weight: 500; }
        .notif-stat-value { font-size: 1.6rem; font-weight: 800; color: var(--text); line-height: 1; }
        .bulk-bar {
          background: rgba(37,99,235,0.12);
          border: 1px solid rgba(37,99,235,0.3);
          border-radius: 12px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          animation: slideIn 0.2s ease;
        }
        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .search-wrap svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text3);
          pointer-events: none;
        }
        .notif-search {
          width: 100%;
          padding: 9px 16px 9px 38px;
          background: rgba(15,23,42,0.6);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .notif-search:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
        .notif-search::placeholder { color: var(--text3); }
        @media (max-width: 768px) {
          .notif-stats-bar { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">
            <span style={{ marginRight: 10 }}>🔔</span>
            Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  marginLeft: 12,
                  background: "var(--danger)",
                  color: "#fff",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "2px 9px",
                  borderRadius: 999,
                  verticalAlign: "middle",
                }}
              >
                {unreadCount} new
              </span>
            )}
            {socketConnected && (
              <span
                style={{
                  marginLeft: 12,
                  color: "#10b981",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background: "rgba(16,185,129,0.1)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(16,185,129,0.3)",
                  verticalAlign: "middle",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title="Real-time updates active"
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10b981",
                    animation: "pulse-dot 2s infinite",
                  }}
                />
                Live
              </span>
            )}
          </div>
          <div className="page-subtitle">
            Stay updated with all your activities and alerts
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {unreadCount > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={markAllRead}
              disabled={markingAll}
            >
              {markingAll ? "Marking…" : "✓ Mark All Read"}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={deleteAll}
              disabled={deletingAll}
              title="Delete all notifications"
            >
              {deletingAll ? "Deleting…" : "🗑️ Clear All"}
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={fetchNotifications}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {!loading && notifications.length > 0 && (
        <div className="notif-stats-bar">
          <div className="notif-stat">
            <div
              className="notif-stat-icon"
              style={{
                background: "rgba(37,99,235,0.15)",
                color: "#60a5fa",
              }}
            >
              🔔
            </div>
            <div>
              <div className="notif-stat-label">Total</div>
              <div className="notif-stat-value">{statsData.total}</div>
            </div>
          </div>
          <div className="notif-stat">
            <div
              className="notif-stat-icon"
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#f87171",
              }}
            >
              ✉️
            </div>
            <div>
              <div className="notif-stat-label">Unread</div>
              <div className="notif-stat-value">{statsData.unread}</div>
            </div>
          </div>
          <div className="notif-stat">
            <div
              className="notif-stat-icon"
              style={{
                background: "rgba(16,185,129,0.15)",
                color: "#34d399",
              }}
            >
              📅
            </div>
            <div>
              <div className="notif-stat-label">Today</div>
              <div className="notif-stat-value">{statsData.today}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter tabs + Search ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div className="tabs" style={{ marginBottom: 0, flexShrink: 0 }}>
          {[
            { key: "all", label: `All (${notifications.length})` },
            { key: "unread", label: `Unread (${unreadCount})` },
            {
              key: "read",
              label: `Read (${notifications.length - unreadCount})`,
            },
          ].map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${filterTab === t.key ? "active" : ""}`}
              onClick={() => setFilterTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="notif-search"
            placeholder="Search notifications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Type chips ── */}
      {presentTypes.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <button
            className="type-chip"
            onClick={() => setTypeFilter("all")}
            style={{
              background:
                typeFilter === "all"
                  ? "var(--primary)"
                  : "rgba(148,163,184,0.1)",
              color: typeFilter === "all" ? "#fff" : "var(--text2)",
              borderColor:
                typeFilter === "all"
                  ? "var(--primary)"
                  : "rgba(148,163,184,0.2)",
            }}
          >
            All Types
          </button>
          {presentTypes.map((type) => {
            const cfg = getTypeConfig(type);
            const active = typeFilter === type;
            return (
              <button
                key={type}
                className="type-chip"
                onClick={() => setTypeFilter(active ? "all" : type)}
                style={{
                  background: active ? cfg.color : cfg.bg,
                  color: active ? "#fff" : cfg.color,
                  borderColor: active ? cfg.color : cfg.border,
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <input
            type="checkbox"
            className="notif-checkbox"
            checked={selected.size === visible.length}
            onChange={toggleSelectAll}
          />
          <span
            style={{ fontSize: "0.875rem", color: "#93c5fd", fontWeight: 600 }}
          >
            {selected.size} selected
          </span>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={markSelectedRead}
          >
            ✓ Mark Selected Read
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setSelected(new Set())}
          >
            ✕ Deselect
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div
          className="loading-center"
          style={{ flexDirection: "column", gap: 16 }}
        >
          <div className="spinner" style={{ margin: 0 }} />
          <span style={{ color: "var(--text2)", fontSize: "0.875rem" }}>
            Loading notifications…
          </span>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state" style={{ padding: "80px 20px" }}>
          <div className="empty-state-icon">
            {search ? "🔍" : filterTab === "unread" ? "✅" : "🔔"}
          </div>
          <div
            className="empty-state-text"
            style={{ fontSize: "1.1rem", fontWeight: 600 }}
          >
            {search
              ? "No notifications match your search"
              : filterTab === "unread"
                ? "You're all caught up!"
                : "No notifications yet"}
          </div>
          <div
            style={{
              color: "var(--text3)",
              fontSize: "0.875rem",
              marginTop: 8,
            }}
          >
            {search
              ? "Try a different keyword"
              : filterTab === "unread"
                ? "All notifications have been read"
                : "Notifications will appear here"}
          </div>
          {(search || filterTab !== "all" || typeFilter !== "all") && (
            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 20 }}
              onClick={() => {
                setSearch("");
                setFilterTab("all");
                setTypeFilter("all");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Select-all row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 4px",
              marginBottom: 4,
            }}
          >
            <input
              type="checkbox"
              className="notif-checkbox"
              checked={visible.length > 0 && selected.size === visible.length}
              onChange={toggleSelectAll}
            />
            <span style={{ fontSize: "0.78rem", color: "var(--text3)" }}>
              Select all
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.78rem",
                color: "var(--text3)",
              }}
            >
              {visible.length} notification{visible.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Grouped notifications */}
          {GROUP_ORDER.filter((g) => grouped[g]).map((group) => (
            <div key={group} style={{ marginBottom: 8 }}>
              <div className="group-label">{group}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {grouped[group].map((n) => {
                  const cfg = getTypeConfig(n.type);
                  const isSelected = selected.has(n._id);
                  const dest = resolveNotificationLink(n.message, n.type, role);

                  const handleCardClick = (e) => {
                    // Don't trigger if user clicked checkbox or Mark Read button
                    if (
                      e.target.closest('input[type="checkbox"]') ||
                      e.target.closest(".mark-read-btn")
                    )
                      return;
                    if (!dest) return;
                    if (!n.isRead) markRead(n._id);
                    navigate(dest);
                  };

                  return (
                    <div
                      key={n._id}
                      className={`notif-card${!n.isRead ? " unread" : ""}${dest ? " clickable" : ""}`}
                      onClick={handleCardClick}
                      title={dest ? `Go to ${dest}` : undefined}
                      style={{
                        borderLeftColor: !n.isRead ? cfg.color : "transparent",
                        background: isSelected
                          ? "rgba(37,99,235,0.08)"
                          : n.isRead
                            ? "var(--surface)"
                            : cfg.bg,
                        borderColor: isSelected
                          ? "rgba(37,99,235,0.4)"
                          : !n.isRead
                            ? cfg.border
                            : "var(--border)",
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        className="notif-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(n._id)}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Icon */}
                      <div
                        className="notif-icon-wrap"
                        style={{
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                        }}
                      >
                        {cfg.icon}
                      </div>

                      {/* Body */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: cfg.color,
                              background: cfg.bg,
                              border: `1px solid ${cfg.border}`,
                              padding: "2px 8px",
                              borderRadius: 999,
                            }}
                          >
                            {cfg.label}
                          </span>
                          {!n.isRead && (
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: "var(--primary)",
                                background: "rgba(37,99,235,0.12)",
                                padding: "1px 7px",
                                borderRadius: 999,
                                border: "1px solid rgba(37,99,235,0.3)",
                              }}
                            >
                              NEW
                            </span>
                          )}
                          {/* Deep-link badge */}
                          {dest && (
                            <span
                              style={{
                                fontSize: "0.66rem",
                                fontWeight: 700,
                                color: "rgba(96,165,250,0.8)",
                                background: "rgba(37,99,235,0.1)",
                                padding: "1px 8px",
                                borderRadius: 999,
                                border: "1px solid rgba(37,99,235,0.2)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              View →
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: n.isRead ? "var(--text2)" : "var(--text)",
                            fontWeight: n.isRead ? 400 : 500,
                            lineHeight: 1.5,
                            marginBottom: 6,
                          }}
                        >
                          {n.message}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text3)",
                            }}
                          >
                            🕐 {timeAgo(n.createdAt)}
                          </span>
                          <span style={{ color: "var(--border)" }}>·</span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text3)",
                            }}
                          >
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Right action */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {!n.isRead ? (
                          <>
                            <div className="unread-dot" />
                            <button
                              className="mark-read-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead(n._id);
                              }}
                            >
                              Mark Read
                            </button>
                          </>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: "var(--text3)",
                              background: "rgba(100,116,139,0.12)",
                              border: "1px solid rgba(100,116,139,0.2)",
                              padding: "2px 9px",
                              borderRadius: 999,
                            }}
                          >
                            ✓ Read
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
