/**
 * Shared inline SVG icon set for NurseConnect.
 * Usage: <Ic.Calendar size={16} />  or  <Ic.Search size={16} style={{ ... }} />
 * All icons use currentColor — set color via CSS or inline style.
 */

const Svg = ({ size = 16, children, className = '', style }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" className={className}
    style={style}
  >
    {children}
  </svg>
);

/* Every icon forwards both size and style so callers can do:
     <Ic.Search size={16} style={{ position: 'absolute', ... }} />
*/
export const Calendar  = ({ size, style }) => <Svg size={size} style={style}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></Svg>;
export const Clock     = ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>;
export const Sun       = ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Svg>;
export const Moon      = ({ size, style }) => <Svg size={size} style={style}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Svg>;
export const Sunset    = ({ size, style }) => <Svg size={size} style={style}><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" x2="12" y1="9" y2="2"/><line x1="4.22" x2="5.64" y1="10.22" y2="11.64"/><line x1="1" x2="3" y1="18" y2="18"/><line x1="21" x2="23" y1="18" y2="18"/><line x1="18.36" x2="19.78" y1="11.64" y2="10.22"/><line x1="23" x2="1" y1="22" y2="22"/><polyline points="16 5 12 9 8 5"/></Svg>;
export const Hospital  = ({ size, style }) => <Svg size={size} style={style}><path d="M12 6v6m3-3H9"/><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/></Svg>;
export const User      = ({ size, style }) => <Svg size={size} style={style}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;
export const Users     = ({ size, style }) => <Svg size={size} style={style}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
export const MapPin    = ({ size, style }) => <Svg size={size} style={style}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Svg>;
export const ArrowRight= ({ size, style }) => <Svg size={size} style={style}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></Svg>;
export const ArrowLeft = ({ size, style }) => <Svg size={size} style={style}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></Svg>;
export const ChevronDown = ({ size, style }) => <Svg size={size} style={style}><path d="m6 9 6 6 6-6"/></Svg>;
export const ChevronUp   = ({ size, style }) => <Svg size={size} style={style}><path d="m18 15-6-6-6 6"/></Svg>;
export const Check     = ({ size, style }) => <Svg size={size} style={style}><path d="M20 6 9 17l-5-5"/></Svg>;
export const X         = ({ size, style }) => <Svg size={size} style={style}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Svg>;
export const Bell      = ({ size, style }) => <Svg size={size} style={style}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>;
export const FileText  = ({ size, style }) => <Svg size={size} style={style}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></Svg>;
export const Download  = ({ size, style }) => <Svg size={size} style={style}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></Svg>;
export const ExternalLink = ({ size, style }) => <Svg size={size} style={style}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></Svg>;
export const Search    = ({ size, style }) => <Svg size={size} style={style}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Svg>;
export const Filter    = ({ size, style }) => <Svg size={size} style={style}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Svg>;
export const Tag       = ({ size, style }) => <Svg size={size} style={style}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" x2="7.01" y1="7" y2="7"/></Svg>;
export const Trash     = ({ size, style }) => <Svg size={size} style={style}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Svg>;
export const Edit      = ({ size, style }) => <Svg size={size} style={style}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
export const Plus      = ({ size, style }) => <Svg size={size} style={style}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></Svg>;
export const Swap      = ({ size, style }) => <Svg size={size} style={style}><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></Svg>;
export const Transfer  = ({ size, style }) => <Svg size={size} style={style}><path d="m9 18 6-6-6-6"/></Svg>;
export const Leave     = ({ size, style }) => <Svg size={size} style={style}><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></Svg>;
export const Pill      = ({ size, style }) => <Svg size={size} style={style}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><line x1="8.5" x2="15.5" y1="8.5" y2="15.5"/></Svg>;
export const Wrench    = ({ size, style }) => <Svg size={size} style={style}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/></Svg>;
export const Globe     = ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>;
export const Chat      = ({ size, style }) => <Svg size={size} style={style}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
export const News      = ({ size, style }) => <Svg size={size} style={style}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></Svg>;
export const AlertTriangle = ({ size, style }) => <Svg size={size} style={style}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></Svg>;
export const Dashboard = ({ size, style }) => <Svg size={size} style={style}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></Svg>;
export const Award     = ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></Svg>;
export const TrendUp   = ({ size, style }) => <Svg size={size} style={style}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Svg>;
export const Info      = ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></Svg>;
export const Overline  = ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>;
export const Inbox     = ({ size, style }) => <Svg size={size} style={style}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></Svg>;
export const Briefcase = ({ size, style }) => <Svg size={size} style={style}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Svg>;
export const File      = ({ size, style }) => <Svg size={size} style={style}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></Svg>;
export const Heart     = ({ size, style }) => <Svg size={size} style={style}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></Svg>;
export const Activity  = ({ size, style }) => <Svg size={size} style={style}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Svg>;
export const AlertCircle = ({ size, style }) => <Svg size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></Svg>;

// Convenience: shift type icon by name
export const shiftIcon = (type) => {
  if (!type) return <Sun size={14} />;
  if (type === '7AM-1PM' || type === '7AM-7PM') return <Sun size={14} />;
  if (type === '1PM-7PM') return <Sunset size={14} />;
  if (type === '7PM-7AM') return <Moon size={14} />;
  // Fallback: substring match for any custom strings
  const t = type.toLowerCase();
  if (t.includes('morning') || t.includes('day')) return <Sun size={14} />;
  if (t.includes('evening') || t.includes('afternoon')) return <Sunset size={14} />;
  if (t.includes('night')) return <Moon size={14} />;
  return <Clock size={14} />;
};

export const shiftColor = (type) => {
  if (!type) return { color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.25)' };
  if (type === '7AM-1PM' || type === '7AM-7PM') return { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
  if (type === '1PM-7PM') return { color: '#fb923c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' };
  if (type === '7PM-7AM') return { color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' };
  // Fallback: substring match for any custom strings
  const t = type.toLowerCase();
  if (t.includes('morning') || t.includes('day'))       return { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
  if (t.includes('evening') || t.includes('afternoon')) return { color: '#fb923c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' };
  if (t.includes('night'))   return { color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' };
  return { color: '#60a5fa', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.25)' };
};

export const statusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'approved' || s === 'active' || s === 'available') return { color:'#34d399', bg:'rgba(16,185,129,0.1)', border:'rgba(16,185,129,0.2)' };
  if (s === 'pending')    return { color:'#fbbf24', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.2)' };
  if (s === 'rejected' || s === 'unavailable') return { color:'#f87171', bg:'rgba(239,68,68,0.1)', border:'rgba(239,68,68,0.2)' };
  if (s === 'maintenance') return { color:'#fb923c', bg:'rgba(249,115,22,0.1)', border:'rgba(249,115,22,0.2)' };
  return { color:'#94a3b8', bg:'rgba(100,116,139,0.1)', border:'rgba(100,116,139,0.15)' };
};
