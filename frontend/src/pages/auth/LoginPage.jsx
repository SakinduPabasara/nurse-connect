import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

/* ─── Icons ─── */
const EyeOn  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const ArrowR = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>;
const ShieldIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

const FEATURES = [
  { icon: '📅', title: 'Smart Roster Management',   desc: 'AI-assisted shift scheduling & swap requests'    },
  { icon: '🔔', title: 'Real-time Notifications',   desc: 'Instant alerts for roster changes & approvals'  },
  { icon: '🏥', title: 'Inter-Hospital Transfers',  desc: 'Seamlessly manage ward & hospital transfers'    },
  { icon: '💊', title: 'Resource Inventory',        desc: 'Track drugs, equipment & ward supplies'         },
];

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const inputRef   = useRef(null);

  const [form,        setForm]        = useState({ nic: '', password: '' });
  const [showPass,    setShowPass]    = useState(false);
  const [nicFocus,    setNicFocus]    = useState(false);
  const [passFocus,   setPassFocus]   = useState(false);
  const [errors,      setErrors]      = useState({});
  const [globalErr,   setGlobalErr]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [featIdx,     setFeatIdx]     = useState(0);
  const [stats,       setStats]       = useState({ nurses: null, hospitals: null });

  /* Auto-cycle feature cards */
  useEffect(() => {
    const t = setInterval(() => setFeatIdx(i => (i + 1) % FEATURES.length), 3600);
    return () => clearInterval(t);
  }, []);

  /* Auto-focus */
  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Live stats */
  useEffect(() => {
    API.get('/auth/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const onChange = ({ target: { name, value } }) => {
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
    if (globalErr)    setGlobalErr('');
  };

  const validate = () => {
    const e = {};
    if (!form.nic.trim()) e.nic      = 'NIC number is required';
    if (!form.password)   e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', {
        nic:      form.nic.trim().toUpperCase(),
        password: form.password,
      });
      login(data, data.token);
      navigate(data.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setGlobalErr(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const feat = FEATURES[featIdx];

  /* ── Derived floats ── */
  const nicRaised  = nicFocus  || form.nic.length > 0;
  const passRaised = passFocus || form.password.length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes fadeUp      { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeLeft    { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes glow-pulse  { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
        @keyframes shimmer     { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }
        @keyframes feat-slide  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Layout ── */
        .lp-root {
          height: 100vh;
          display: flex;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          background: #05080f;
        }

        /* ── Brand panel ── */
        .lp-brand {
          width: 460px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 48px 50px 44px;
          background: linear-gradient(160deg, #060c1c 0%, #091525 55%, #0c1e3c 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
        }

        /* subtle mesh gradient orbs */
        .lp-brand::before {
          content: '';
          position: absolute;
          top: -120px; left: -80px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .lp-brand::after {
          content: '';
          position: absolute;
          bottom: -100px; right: -80px;
          width: 360px; height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 65%);
          pointer-events: none;
        }

        .lp-brand-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* ── Form panel ── */
        .lp-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 40px;
          overflow-y: auto;
          background: #070c18;
          position: relative;
        }

        /* dot-grid texture */
        .lp-form-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(37,99,235,0.07) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }

        /* ── Card ── */
        .lp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.4s cubic-bezier(.4,0,.2,1);
        }

        /* ── Input wrapper ── */
        .lp-field {
          position: relative;
          margin-bottom: 14px;
        }

        .lp-field-box {
          position: relative;
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          transition: border-color .18s, box-shadow .18s, background .18s;
        }

        .lp-field-box.focused {
          border-color: rgba(59,130,246,0.6);
          background: rgba(59,130,246,0.06);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }

        .lp-field-box.has-error {
          border-color: rgba(239,68,68,0.55);
          background: rgba(239,68,68,0.04);
          box-shadow: 0 0 0 4px rgba(239,68,68,0.07);
        }

        .lp-label {
          position: absolute;
          left: 44px;
          pointer-events: none;
          transition: all .17s cubic-bezier(.4,0,.2,1);
          font-family: 'Inter', sans-serif;
          color: rgba(148,163,184,0.65);
        }

        .lp-label.lowered {
          top: 50%;
          transform: translateY(-50%);
          font-size: .88rem;
          font-weight: 400;
          letter-spacing: 0;
        }

        .lp-label.raised {
          top: 8px;
          transform: none;
          font-size: .6rem;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: rgba(96,165,250,.85);
        }

        .lp-label.raised.err { color: rgba(252,165,165,.8); }

        .lp-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(100,116,139,.55);
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color .18s;
        }

        .lp-field-box.focused .lp-icon { color: rgba(96,165,250,.75); }

        .lp-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #e2e8f0;
          font-family: 'Inter', sans-serif;
          font-size: .93rem;
          padding-left: 44px;
          padding-right: 44px;
          line-height: 1;
        }

        .lp-input.lowered   { padding-top: 14px; padding-bottom: 14px; }
        .lp-input.raised    { padding-top: 24px; padding-bottom: 8px; }
        .lp-input::placeholder { color: transparent; }

        .lp-eye {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: rgba(100,116,139,.5);
          padding: 5px;
          border-radius: 7px;
          transition: color .15s, background .15s;
        }
        .lp-eye:hover { color: rgba(148,163,184,.85); background: rgba(255,255,255,.05); }

        .lp-err-msg {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          padding-left: 2px;
          color: #f87171;
          font-size: .73rem;
          font-weight: 500;
          animation: fadeUp .15s ease;
        }

        /* ── Submit button ── */
        .lp-submit {
          width: 100%;
          margin-top: 8px;
          padding: 15px 24px;
          border: none;
          border-radius: 14px;
          font-family: 'Inter', sans-serif;
          font-size: .92rem;
          font-weight: 700;
          letter-spacing: .01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: all .2s ease;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #fff;
          box-shadow: 0 4px 24px rgba(37,99,235,.45);
          position: relative;
          overflow: hidden;
        }

        .lp-submit::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.08) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 2.5s ease infinite;
        }

        .lp-submit:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(37,99,235,.6);
        }
        .lp-submit:not(:disabled):active { transform: translateY(0); }
        .lp-submit:disabled { opacity: .65; cursor: not-allowed; }

        /* ── Global error banner ── */
        .lp-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px 15px;
          margin-bottom: 18px;
          border-radius: 12px;
          background: rgba(220,38,38,.08);
          border: 1px solid rgba(220,38,38,.2);
          color: #fca5a5;
          font-size: .82rem;
          font-weight: 500;
          line-height: 1.5;
          animation: fadeUp .2s ease;
        }

        /* ── Feature card ── */
        .lp-feat {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
          animation: feat-slide .3s ease;
        }

        /* ── Stat skeleton ── */
        .lp-skel {
          display: inline-block;
          width: 44px;
          height: 20px;
          border-radius: 5px;
          background: linear-gradient(90deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.12) 50%, rgba(255,255,255,.06) 100%);
          background-size: 300px 100%;
          animation: shimmer 1.4s ease infinite;
          vertical-align: middle;
        }

        /* ── Responsive ── */
        @media (max-width: 860px) { .lp-brand { display: none !important; } }
      `}</style>

      <div className="lp-root">

        {/* ════════════ BRAND PANEL ════════════ */}
        <div className="lp-brand">
          <div className="lp-brand-inner">

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 52 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                boxShadow: '0 4px 20px rgba(37,99,235,.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                  <rect x="13" y="3" width="6" height="26" rx="2.5" fill="white" opacity=".95"/>
                  <rect x="3" y="13" width="26" height="6" rx="2.5" fill="white" opacity=".95"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:'1.25rem', color:'#fff', letterSpacing:'-0.02em' }}>NurseConnect</div>
                <div style={{ fontSize:'.62rem', fontWeight:600, color:'rgba(255,255,255,.3)', letterSpacing:'.12em', textTransform:'uppercase', marginTop:2 }}>Healthcare Platform</div>
              </div>
            </div>

            {/* Headline */}
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:'2.7rem', lineHeight:1.13, letterSpacing:'-0.03em', color:'#fff', marginBottom:14 }}>
              Healthcare<br/>
              Workforce<br/>
              <span style={{ background:'linear-gradient(90deg,#60a5fa,#34d399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Reimagined.</span>
            </div>
            <p style={{ fontSize:'.88rem', color:'rgba(255,255,255,.34)', lineHeight:1.8, maxWidth:310, marginBottom:44 }}>
              The intelligent platform connecting healthcare professionals for better patient outcomes.
            </p>

            {/* Rotating feature card */}
            <div className="lp-feat" key={featIdx}>
              <div style={{
                width:44, height:44, borderRadius:12, flexShrink:0,
                background:'rgba(37,99,235,.18)', border:'1px solid rgba(37,99,235,.3)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem',
              }}>
                {feat.icon}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:'.9rem', color:'#f1f5f9', marginBottom:4 }}>{feat.title}</div>
                <div style={{ fontSize:'.77rem', color:'rgba(255,255,255,.38)', lineHeight:1.55 }}>{feat.desc}</div>
              </div>
            </div>

            {/* Dot progress */}
            <div style={{ display:'flex', gap:6, marginTop:14 }}>
              {FEATURES.map((_, i) => (
                <button key={i} onClick={() => setFeatIdx(i)} style={{
                  width: i === featIdx ? 22 : 7, height:4, borderRadius:999,
                  border:'none', cursor:'pointer', padding:0,
                  background: i === featIdx ? '#60a5fa' : 'rgba(255,255,255,.15)',
                  transition:'all .3s ease',
                }}/>
              ))}
            </div>

            {/* Stats */}
            <div style={{ marginTop:'auto', paddingTop:36, display:'flex', gap:32 }}>
              {[
                { val: stats.nurses,    suf: '+', label: 'Verified Nurses' },
                { val: stats.hospitals, suf: '',  label: 'Hospitals'       },
                { val: '24/7',          suf: '',  label: 'Always On'       },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:'1.6rem', color:'#60a5fa', lineHeight:1 }}>
                    {s.val === null ? <span className="lp-skel"/> : <>{s.val}{s.suf}</>}
                  </div>
                  <div style={{ fontSize:'.68rem', fontWeight:600, color:'rgba(255,255,255,.28)', letterSpacing:'.07em', textTransform:'uppercase', marginTop:4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ════════════ FORM PANEL ════════════ */}
        <div className="lp-form-panel">
          <div className="lp-card">

            {/* ── Card header ── */}
            <div style={{ marginBottom: 36 }}>
              {/* Live badge */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 13px', borderRadius:999, background:'rgba(37,99,235,.1)', border:'1px solid rgba(37,99,235,.2)', marginBottom:22 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 6px rgba(52,211,153,.6)', display:'inline-block', animation:'glow-pulse 2s ease infinite' }}/>
                <span style={{ fontSize:'.68rem', fontWeight:700, color:'#93c5fd', letterSpacing:'.08em', textTransform:'uppercase' }}>Secure Portal</span>
              </div>

              <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:'2.1rem', color:'#f1f5f9', letterSpacing:'-0.025em', lineHeight:1.18, marginBottom:8 }}>
                Welcome back 👋
              </h1>
              <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.7)', fontWeight:400, lineHeight:1.5 }}>
                Sign in to your NurseConnect account to continue
              </p>
            </div>

            {/* ── Global error ── */}
            {globalErr && (
              <div className="lp-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {globalErr}
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} noValidate>

              {/* NIC field */}
              <div className="lp-field">
                <div className={`lp-field-box${nicFocus ? ' focused' : ''}${errors.nic ? ' has-error' : ''}`}>
                  <span className="lp-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                  </span>
                  <label className={`lp-label ${nicRaised ? 'raised' : 'lowered'}${errors.nic ? ' err' : ''}`}>
                    NIC Number
                  </label>
                  <input
                    ref={inputRef}
                    name="nic"
                    type="text"
                    value={form.nic}
                    onChange={onChange}
                    onFocus={() => setNicFocus(true)}
                    onBlur={() => setNicFocus(false)}
                    autoComplete="username"
                    className={`lp-input ${nicRaised ? 'raised' : 'lowered'}`}
                    id="nic-input"
                  />
                </div>
                {errors.nic && (
                  <div className="lp-err-msg">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {errors.nic}
                  </div>
                )}
              </div>

              {/* Password field */}
              <div className="lp-field">
                <div className={`lp-field-box${passFocus ? ' focused' : ''}${errors.password ? ' has-error' : ''}`}>
                  <span className="lp-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <label className={`lp-label ${passRaised ? 'raised' : 'lowered'}${errors.password ? ' err' : ''}`}>
                    Password
                  </label>
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={onChange}
                    onFocus={() => setPassFocus(true)}
                    onBlur={() => setPassFocus(false)}
                    autoComplete="current-password"
                    className={`lp-input ${passRaised ? 'raised' : 'lowered'}`}
                    id="password-input"
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Hide' : 'Show'}>
                    {showPass ? <EyeOn/> : <EyeOff/>}
                  </button>
                </div>
                {errors.password && (
                  <div className="lp-err-msg">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button type="submit" className="lp-submit" disabled={loading} id="login-submit-btn">
                {loading ? (
                  <>
                    <span style={{ width:17, height:17, border:'2.5px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block', flexShrink:0 }}/>
                    Authenticating…
                  </>
                ) : (
                  <>Sign In <ArrowR/></>
                )}
              </button>
            </form>

            {/* ── Footer ── */}
            <div style={{ marginTop:28, display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>

              {/* Register link */}
              <p style={{ fontSize:'.84rem', color:'rgba(148,163,184,.6)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color:'#60a5fa', fontWeight:700, textDecoration:'none' }}
                  onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                  Register as a nurse →
                </Link>
              </p>

              {/* Security notice */}
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(100,116,139,.4)', fontSize:'.69rem', fontWeight:500, letterSpacing:'.01em' }}>
                <ShieldIcon/>
                256-bit TLS · JWT Auth · HIPAA Compliant
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
