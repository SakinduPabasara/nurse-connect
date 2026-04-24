import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import useToastMessage from "../../hooks/useToastMessage";

/* ── SVG Icons ── */
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const ExpandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
  </svg>
);

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [msg, setMsg] = useState({ type: "", text: "" });
  useToastMessage(msg);

  const [loading, setLoading] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: "",
    telephone: "",
    address: "",
    hospital: "",
    ward: "",
    email: "",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setPersonalForm({
        name: user.name || "",
        telephone: user.telephone || "",
        address: user.address || "",
        hospital: user.hospital || "",
        ward: user.ward || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handlePersonalChange = (e) => {
    setPersonalForm({ ...personalForm, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurityForm({ ...securityForm, [e.target.name]: e.target.value });
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.put("/auth/profile", personalForm);
      login(data, data.token || localStorage.getItem("token"));
      setMsg({ type: "success", text: "Personal information updated successfully." });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.put("/auth/profile", {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      login(data, data.token || localStorage.getItem("token"));
      setMsg({ type: "success", text: "Password updated successfully." });
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to update password." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    setLoadingAvatar(true);
    try {
      const { data } = await API.delete("/auth/avatar");
      login(data.user, localStorage.getItem("token"));
      setMsg({ type: "success", text: "Profile picture removed." });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to remove image." });
    } finally {
      setLoadingAvatar(false);
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.35s ease" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .profile-grid { grid-template-columns: 1.6fr 1fr; }
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .section-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: var(--radius);
          background: rgba(37,99,235,0.1);
          color: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .section-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .section-subtitle {
          font-size: 0.8rem;
          color: var(--text3);
          margin-top: 2px;
        }

        .locked-field {
          background: rgba(8, 15, 30, 0.4);
          border: 1px dashed var(--border);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .locked-field-icon {
          color: var(--text3);
          margin-top: 2px;
        }
        .locked-field-info h4 {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text3);
          margin-bottom: 4px;
        }
        .locked-field-info p {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .locked-field-info span {
          font-size: 0.75rem;
          color: var(--warning);
          background: rgba(245,158,11,0.1);
          padding: 3px 8px;
          border-radius: 4px;
        }
        .avatar-overlay:hover { opacity: 1 !important; }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: "40px", alignItems: "center", position: 'relative' }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", width: '100%', flexWrap: 'wrap' }}>
          
          {/* ── Avatar Section ── */}
          <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => document.getElementById('avatar-input').click()}>
            <div style={{ 
              width: 88, height: 88, borderRadius: '50%', 
              background: user?.profilePic 
                ? `url(${API.defaults.baseURL.replace('/api', '')}${user.profilePic}) center/cover no-repeat` 
                : 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', fontWeight: 700, color: '#fff',
              boxShadow: '0 12px 32px rgba(37,99,235,0.2), 0 0 0 4px var(--bg1)',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {!user?.profilePic && (user?.name?.charAt(0)?.toUpperCase() || "U")}
            </div>
            
            {/* Camera Overlay on Hover */}
            <div className="avatar-overlay" style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', opacity: 0, transition: 'opacity 0.25s ease',
              backdropFilter: 'blur(2px)'
            }}>
              <CameraIcon />
            </div>
            
            {loadingAvatar && (
               <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                 <div className="spinner" style={{ width: 28, height: 28, margin: 0 }}></div>
               </div>
            )}
            
            {/* Small camera badge always visible on initials */}
            {!user?.profilePic && (
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg1)', color: '#fff' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            )}
          </div>

          {/* ── Identity & Stats ── */}
          <div style={{ flex: 1, minWidth: 'min-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem' }}>{user?.name || "Your Profile"}</h1>
              {user?.isVerified && (
                <div title="Verified Professional" style={{ color: 'var(--primary-light)', display: 'flex' }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="page-subtitle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldIcon /> {user?.role === "admin" ? "System Administrator" : "Healthcare Professional"}
              </div>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text3)' }}></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user?.hospital || "Standard Hospital"}
              </div>
            </div>

            {/* Quick Actions Row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button 
                className="btn btn-outline btn-sm" 
                style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
                onClick={() => document.getElementById('avatar-input').click()}
              >
                Change Photo
              </button>
              
              {user?.profilePic && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ width: 32, height: 32, padding: 0, borderRadius: '8px', border: '1px solid var(--border)' }}
                    title="View Full Size" 
                    onClick={() => setShowModal(true)}
                  >
                    <ExpandIcon />
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ width: 32, height: 32, padding: 0, borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--danger)' }}
                    title="Delete Photo" 
                    onClick={handleDeleteAvatar}
                  >
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          </div>

          <input 
            type="file" 
            id="avatar-input" 
            hidden 
            accept="image/*" 
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              
              const formData = new FormData();
              formData.append('avatar', file);
              
              setLoadingAvatar(true);
              try {
                const { data } = await API.post('/auth/avatar', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                login(data.user, localStorage.getItem('token'));
                setMsg({ type: 'success', text: 'Avatar updated successfully!' });
              } catch (err) {
                setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to upload image.' });
              } finally {
                setLoadingAvatar(false);
              }
            }} 
          />
        </div>
      </div>

      {/* View Modal */}
      {showModal && user?.profilePic && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 2000 }}>
          <div className="modal" style={{ maxWidth: 600, padding: 0, overflow: 'hidden', background: '#000' }} onClick={e => e.stopPropagation()}>
            <img 
               src={`http://localhost:5000${user.profilePic}`} 
               style={{ width: '100%', height: 'auto', display: 'block' }} 
               alt="Profile Large" 
            />
            <button 
              className="btn btn-outline" 
              style={{ position: 'absolute', top: 10, right: 10, borderRadius: '50%', width: 32, height: 32, padding: 0, justifyContent: 'center' }}
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="profile-grid">
        {/* ── Left Column: Personal Data ── */}
        <div className="card">
          <div className="section-header">
            <div className="section-icon-wrap"><UserIcon /></div>
            <div>
              <h2 className="section-title">Personal Information</h2>
              <p className="section-subtitle">Update your contact details and hospital assignment.</p>
            </div>
          </div>

          <form onSubmit={handlePersonalSubmit}>
            {/* Read Only NIC Field */}
            <div className="locked-field">
              <div className="locked-field-icon"><ShieldIcon /></div>
              <div className="locked-field-info">
                <h4>National ID Card (NIC)</h4>
                <p>{user?.nic}</p>
                <span>Permanent Identity Record</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                className="form-input" 
                type="text" 
                name="name" 
                value={personalForm.name} 
                onChange={handlePersonalChange} 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Telephone</label>
                <input 
                  className="form-input" 
                  type="text" 
                  name="telephone" 
                  value={personalForm.telephone} 
                  onChange={handlePersonalChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  className="form-input" 
                  type="email" 
                  name="email" 
                  value={personalForm.email} 
                  onChange={handlePersonalChange} 
                  placeholder="name@example.com (Optional)" 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Physical Address</label>
              <input 
                className="form-input" 
                type="text" 
                name="address" 
                value={personalForm.address} 
                onChange={handlePersonalChange} 
                required 
              />
            </div>

            <div className="form-row" style={{ marginTop: "24px" }}>
              <div className="form-group">
                <label className="form-label">Assigned Hospital</label>
                <input 
                  className="form-input" 
                  type="text" 
                  name="hospital" 
                  value={personalForm.hospital} 
                  onChange={handlePersonalChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ward / Unit</label>
                <input 
                  className="form-input" 
                  type="text" 
                  name="ward" 
                  value={personalForm.ward} 
                  onChange={handlePersonalChange} 
                  placeholder="e.g., ICU, OP-1" 
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Save Information"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right Column: Security ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="card">
            <div className="section-header">
              <div className="section-icon-wrap" style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)" }}>
                <LockIcon />
              </div>
              <div>
                <h2 className="section-title">Change Password</h2>
                <p className="section-subtitle">Keep your account secure.</p>
              </div>
            </div>

            <form onSubmit={handleSecuritySubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  className="form-input" 
                  type="password" 
                  name="currentPassword" 
                  value={securityForm.currentPassword} 
                  onChange={handleSecurityChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  className="form-input" 
                  type="password" 
                  name="newPassword" 
                  value={securityForm.newPassword} 
                  onChange={handleSecurityChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  className="form-input" 
                  type="password" 
                  name="confirmPassword" 
                  value={securityForm.confirmPassword} 
                  onChange={handleSecurityChange} 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-warning btn-full" style={{ marginTop: "8px" }} disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Minimal Info Card */}
          <div className="card" style={{ background: "rgba(37,99,235,0.04)", borderColor: "rgba(37,99,235,0.15)" }}>
             <h4 style={{ fontSize: "0.85rem", color: "var(--text)", marginBottom: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
               <ShieldIcon /> Account Safety
             </h4>
             <p style={{ fontSize: "0.8rem", color: "var(--text2)", lineHeight: "1.5" }}>
               Strong passwords include uppercase, lowercase, numbers, and symbols. If you notice unauthorized changes to your account or roster, contact your system administrator immediately.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}
