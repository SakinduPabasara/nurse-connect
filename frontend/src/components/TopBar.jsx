import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useNotifications } from "../context/NotificationContext";
import { notify } from "../utils/toast";

/* ── All navigable links ── */
const nurseLinks = [
  { to: "/dashboard",     label: "Dashboard" },
  { to: "/my-roster",     label: "My Roster" },
  { to: "/ward-roster",   label: "Ward Roster" },
  { to: "/swap",          label: "Shift Swap" },
  { to: "/transfer",      label: "Transfer" },
  { to: "/leave",         label: "Leave" },
  { to: "/overtime",      label: "Overtime" },
  { to: "/notifications", label: "Notifications" },
  { to: "/notices",       label: "Notice Board" },
  { to: "/news",          label: "Health News" },
  { to: "/drugs",         label: "Drug Inventory" },
  { to: "/equipment",     label: "Equipment" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/community",     label: "Community" },
  { to: "/documents",     label: "Documents" },
];

const adminLinks = [
  { to: "/admin",                   label: "Admin Dashboard" },
  { to: "/admin/users",             label: "Users" },
  { to: "/admin/verify",            label: "Verify Nurses" },
  { to: "/admin/wards",             label: "Wards" },
  { to: "/admin/roster",            label: "Roster Management" },
  { to: "/admin/leave",             label: "Leave Management" },
  { to: "/admin/overtime",          label: "Overtime" },
  { to: "/admin/notices",           label: "Notice Board" },
  { to: "/admin/news",              label: "Health News" },
  { to: "/admin/drugs",             label: "Drug Inventory" },
  { to: "/admin/equipment",         label: "Equipment" },
  { to: "/admin/opportunities",     label: "Opportunities" },
  { to: "/admin/documents",         label: "Documents" },
  { to: "/admin/community",         label: "Community" },
  { to: "/notifications",           label: "Notifications" },
];

/* ── Breadcrumb map ── */
const BREADCRUMB = {
  "/dashboard":          ["Nurse Portal", "Dashboard"],
  "/my-roster":          ["Nurse Portal", "My Roster"],
  "/ward-roster":        ["Nurse Portal", "Ward Roster"],
  "/swap":               ["Nurse Portal", "Shift Swap"],
  "/transfer":           ["Nurse Portal", "Transfer"],
  "/leave":              ["Nurse Portal", "My Leave"],
  "/overtime":           ["Nurse Portal", "Overtime"],
  "/notifications":      ["Portal", "Notifications"],
  "/notices":            ["Nurse Portal", "Notice Board"],
  "/news":               ["Nurse Portal", "Health News"],
  "/drugs":              ["Nurse Portal", "Drug Inventory"],
  "/equipment":          ["Nurse Portal", "Equipment"],
  "/opportunities":      ["Nurse Portal", "Opportunities"],
  "/community":          ["Nurse Portal", "Community"],
  "/documents":          ["Nurse Portal", "Documents"],
  "/admin":              ["Admin Portal", "Dashboard"],
  "/admin/users":        ["Admin Portal", "Users"],
  "/admin/verify":       ["Admin Portal", "Verify Nurses"],
  "/admin/roster":       ["Admin Portal", "Roster"],
  "/admin/leave":        ["Admin Portal", "Leave"],
  "/admin/overtime":     ["Admin Portal", "Overtime"],
  "/admin/notices":      ["Admin Portal", "Notices"],
  "/admin/news":         ["Admin Portal", "Health News"],
  "/admin/drugs":        ["Admin Portal", "Drugs"],
  "/admin/equipment":    ["Admin Portal", "Equipment"],
  "/admin/opportunities":["Admin Portal", "Opportunities"],
  "/admin/documents":    ["Admin Portal", "Documents"],
  "/admin/community":    ["Admin Portal", "Community"],
  "/admin/wards":        ["Admin Portal", "Ward Management"],
};

/* ── SVG helpers ── */
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export default function TopBar() {
  const { user } = useAuth();
  const { toggle } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const [query, setQuery] = useState("");
  const [time, setTime] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { unreadCount } = useNotifications();

  const links = user?.role === "admin" ? adminLinks : nurseLinks;
  const crumb = BREADCRUMB[location.pathname] || [
    user?.role === "admin" ? "Admin Portal" : "Nurse Portal",
    links.find(l => l.to === location.pathname)?.label || "Page",
  ];

  /* ── Live clock ── */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  /* ── Command palette search ── */
  const searchable = useMemo(
    () => links.filter(l => l.to !== location.pathname),
    [links, location.pathname]
  );

  const onQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    const kw = val.toLowerCase();
    const matches = searchable.filter(l =>
      l.label.toLowerCase().includes(kw) || l.to.toLowerCase().includes(kw)
    ).slice(0, 5);
    setSuggestions(matches);
    setShowSuggestions(true);
  };

  const goTo = (to) => {
    navigate(to);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) { goTo(suggestions[0].to); return; }
    if (!query.trim()) return;
    notify.info("No matching page found.");
    setQuery("");
  };

  /* Close suggestions on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="topbar">
      {/* Hamburger — mobile only */}
      <button
        className="topbar-hamburger"
        onClick={toggle}
        aria-label="Open navigation menu"
      >
        <HamburgerIcon />
      </button>

      {/* Left: breadcrumb + search */}
      <div className="topbar-left">
        <div className="topbar-breadcrumb" aria-label="Breadcrumb">
          <span>{crumb[0]}</span>
          <span className="topbar-breadcrumb-sep">/</span>
          <span className="topbar-breadcrumb-current">{crumb[1]}</span>
        </div>

        {/* Search */}
        <div className="topbar-search-wrap" ref={searchRef}>
          <SearchIcon />
          <form onSubmit={onSubmit} style={{ display: 'contents' }}>
            <input
              className="topbar-search-input"
              value={query}
              onChange={onQueryChange}
              onFocus={() => query && setShowSuggestions(true)}
              placeholder="Quick navigate…"
              aria-label="Quick navigate between pages"
              autoComplete="off"
            />
          </form>
          <span className="topbar-search-hint">⌘K</span>

          {/* Dropdown suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'rgba(13,24,41,0.98)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 10,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              zIndex: 500,
              backdropFilter: 'blur(20px)',
            }}>
              {suggestions.map(s => (
                <div
                  key={s.to}
                  onMouseDown={() => goTo(s.to)}
                  style={{
                    padding: '9px 14px',
                    fontSize: '0.82rem',
                    color: 'var(--text2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--text3)', fontSize: '0.72rem', fontWeight: 600 }}>→</span>
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: clock + bell + user */}
      <div className="topbar-actions">
        <span className="topbar-time" aria-label="Current time">{time}</span>

        <div className="topbar-divider" aria-hidden="true" />

        <button
          type="button"
          className="topbar-icon-btn"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          onClick={() => navigate("/notifications")}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="topbar-bell-badge" aria-hidden="true">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div className="topbar-divider" aria-hidden="true" />

        <button
          className="topbar-user-pill"
          role="button"
          aria-label="Edit Profile"
          onClick={() => navigate("/profile")}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div className="topbar-user-meta">
            <div className="topbar-user-name">{user?.name || "User"}</div>
            <div className="topbar-user-role">
              {user?.role === "admin" ? "Administrator" : "Nurse"}
            </div>
          </div>
          <div 
            className="topbar-avatar" 
            aria-hidden="true"
            style={user?.profilePic ? {
              background: `url(http://localhost:5000${user.profilePic}) center/cover no-repeat`,
              textIndent: '-9999px',
              border: '1px solid var(--border)'
            } : {}}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </button>
      </div>
    </header>
  );
}
