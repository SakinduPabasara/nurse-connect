import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useNotifications } from "../context/NotificationContext";
import "./Sidebar.css";

/* ── Icons ── */
const Icon = ({ d, d2, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
);

const ICONS = {
  dashboard:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  roster:        "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  ward:          "M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z",
  swap:          "M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4",
  transfer:      "M5 12h14m-7-7 7 7-7 7",
  leave:         "M3 6h18M3 10h18M3 14h18M3 18h18",
  overtime:      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm0-6v-4l3 1.5",
  notification:  "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 0 1-3.46 0",
  noticeboard:   "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  news:          "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2",
  drugs:         "M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2.5M12 11v6M9 14h6",
  equipment:     "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z",
  opportunity:   "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.5 4.5-9 9M8.5 8.5h7v7",
  community:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  documents:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
  users:         "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  verify:        "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  hospital:      "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M10 9h4M12 7v4",
  logout:        "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

const NurseNavIcon = ({ name }) => <Icon d={ICONS[name] || ICONS.dashboard} />;

const NURSE_GROUPS = [
  {
    label: "Overview",
    links: [
      { to: "/dashboard",    icon: "dashboard",    label: "Dashboard" },
      { to: "/notifications",icon: "notification",  label: "Notifications", badge: true },
    ],
  },
  {
    label: "Scheduling",
    links: [
      { to: "/my-roster",    icon: "roster",       label: "My Roster" },
      { to: "/ward-roster",  icon: "ward",         label: "Ward Roster" },
      { to: "/swap",         icon: "swap",         label: "Shift Swap" },
      { to: "/transfer",     icon: "transfer",     label: "Transfer" },
      { to: "/leave",        icon: "leave",        label: "My Leave" },
      { to: "/overtime",     icon: "overtime",     label: "Overtime" },
    ],
  },
  {
    label: "Resources",
    links: [
      { to: "/notices",      icon: "noticeboard",  label: "Notice Board" },
      { to: "/news",         icon: "news",         label: "Health News" },
      { to: "/drugs",        icon: "drugs",        label: "Drug Inventory" },
      { to: "/equipment",    icon: "equipment",    label: "Equipment" },
      { to: "/opportunities",icon: "opportunity",  label: "Opportunities" },
    ],
  },
  {
    label: "Connect",
    links: [
      { to: "/community",    icon: "community",    label: "Community" },
      { to: "/documents",    icon: "documents",    label: "Documents" },
    ],
  },
];

const ADMIN_GROUPS = [
  {
    label: "Overview",
    links: [
      { to: "/admin",         icon: "dashboard",    label: "Dashboard" },
      { to: "/notifications", icon: "notification", label: "Notifications", badge: true },
    ],
  },
  {
    label: "Staff",
    links: [
      { to: "/admin/users",   icon: "users",        label: "Users" },
      { to: "/admin/verify",  icon: "verify",       label: "Verify Nurses" },
      { to: "/admin/hospitals", icon: "hospital",    label: "Hospitals" },
      { to: "/admin/wards",   icon: "ward",         label: "Wards" },
      { to: "/admin/roster",  icon: "roster",       label: "Roster" },
      { to: "/admin/swaps",   icon: "swap",         label: "Shift Swaps" },
      { to: "/admin/transfers", icon: "transfer",   label: "Transfers" },
      { to: "/admin/leave",   icon: "leave",        label: "Leave" },
      { to: "/admin/overtime",icon: "overtime",     label: "Overtime" },
    ],
  },
  {
    label: "Content",
    links: [
      { to: "/admin/notices", icon: "noticeboard",  label: "Notices" },
      { to: "/admin/news",    icon: "news",         label: "Health News" },
      { to: "/admin/opportunities", icon: "opportunity", label: "Opportunities" },
      { to: "/admin/community",icon: "community",   label: "Community" },
    ],
  },
  {
    label: "Inventory",
    links: [
      { to: "/admin/drugs",     icon: "drugs",      label: "Drugs" },
      { to: "/admin/equipment", icon: "equipment",  label: "Equipment" },
      { to: "/admin/documents", icon: "documents",  label: "Documents" },
    ],
  },
];

/* ── Medical Cross SVG Logo Mark ── */
const MedCross = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="url(#g1)" />
    <rect x="13" y="6" width="6" height="20" rx="2" fill="white" opacity="0.95" />
    <rect x="6" y="13" width="20" height="6" rx="2" fill="white" opacity="0.95" />
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

const AdminCross = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="url(#g2)" />
    <rect x="13" y="6" width="6" height="20" rx="2" fill="white" opacity="0.95" />
    <rect x="6" y="13" width="20" height="6" rx="2" fill="white" opacity="0.95" />
    <defs>
      <linearGradient id="g2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, close } = useSidebar();
  const { unreadCount } = useNotifications();
  const isAdmin = user?.role === "admin";
  const groups = isAdmin ? ADMIN_GROUPS : NURSE_GROUPS;

  const handleNavClick = () => {
    close(); // close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isAdmin ? "sidebar-admin" : ""} ${isOpen ? "sidebar-open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          {isAdmin ? <AdminCross /> : <MedCross />}
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">NurseConnect</div>
            <div className="sidebar-brand-role">{isAdmin ? "Admin Portal" : "Staff Portal"}</div>
          </div>
          {/* Close button — mobile only */}
          <button
            className="sidebar-close-btn"
            onClick={close}
            aria-label="Close navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {groups.map((group) => (
            <div key={group.label} className="sidebar-group">
              <div className="sidebar-group-label">{group.label}</div>
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/admin" || link.to === "/dashboard"}
                  className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                  onClick={handleNavClick}
                >
                  <span className="sidebar-link-icon">
                    <NurseNavIcon name={link.icon} />
                  </span>
                  <span className="sidebar-link-label">{link.label}</span>
                  {link.badge && unreadCount > 0 && (
                    <span
                      className="sidebar-notif-badge"
                      aria-label={`${unreadCount} unread notifications`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: user + logout */}
        <div className="sidebar-footer">
          <button 
            className="sidebar-user" 
            onClick={() => { navigate("/profile"); close(); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', flex: 1 }}
            aria-label="Edit Profile"
          >
            <div 
              className="sidebar-avatar"
              style={user?.profilePic ? {
                background: `url(http://localhost:5000${user.profilePic}) center/cover no-repeat`,
                textIndent: '-9999px',
              } : {}}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-sub">{user?.hospital || user?.nic}</div>
            </div>
          </button>
          <button className="sidebar-logout" onClick={() => { logout(); navigate("/login"); }} aria-label="Logout">
            <Icon d={ICONS.logout} size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
