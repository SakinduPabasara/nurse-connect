import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import SearchableSelect from '../../components/SearchableSelect';

/* ── Icons ── */
const ChevR = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>;
const ChevL = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>;
const Check = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
const EyeOpen = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOff  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const AlertIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

/* ── Password strength ── */
function getStrength(p) {
  if (!p) return { score: 0, label: '', color: '' };
  let s = 0;
  if (p.length >= 8)  s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/\d/.test(p))  s++;
  if (/[@$!%*?&]/.test(p)) s++;
  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Very Weak', color: '#ef4444' },
    { score: 2, label: 'Weak', color: '#f97316' },
    { score: 3, label: 'Fair', color: '#eab308' },
    { score: 4, label: 'Strong', color: '#22c55e' },
    { score: 5, label: 'Very Strong', color: '#06b6d4' },
  ];
  return levels[Math.min(s, 5)];
}

/* ── Floating label field ── */
function Field({ id, label, type = 'text', value, onChange, error, autoComplete, suffix, hint }) {
  const [focused, setFocused] = useState(false);
  const raised = focused || (value != null && value.length > 0);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        position: 'relative',
        border: `1.5px solid ${error ? 'rgba(239,68,68,0.6)' : focused ? 'rgba(37,99,235,0.7)' : 'rgba(148,163,184,0.12)'}`,
        borderRadius: 11,
        background: focused ? 'rgba(8,15,30,0.8)' : 'rgba(8,15,30,0.5)',
        transition: 'all 0.18s ease',
        boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : error ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
      }}>
        <label htmlFor={id} style={{
          position: 'absolute', left: 13,
          top: raised ? 7 : '50%', transform: raised ? 'none' : 'translateY(-50%)',
          fontSize: raised ? '0.62rem' : '0.85rem',
          fontWeight: raised ? 700 : 400,
          color: error ? '#f87171' : focused ? '#93c5fd' : 'rgba(100,116,139,0.7)',
          letterSpacing: raised ? '0.06em' : 0,
          textTransform: raised ? 'uppercase' : 'none',
          transition: 'all 0.16s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: 'none', zIndex: 1,
        }}>{label}</label>
        <input
          id={id} type={type} value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          placeholder=""
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            color: '#e8edf5', fontSize: '0.88rem', fontFamily: "'Inter',sans-serif",
            paddingTop: raised ? 22 : 13, paddingBottom: raised ? 6 : 13,
            paddingLeft: 13, paddingRight: suffix ? 44 : 13, lineHeight: 1,
          }}
        />
        {suffix && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
      </div>
      {hint && !error && <div style={{ fontSize: '0.72rem', color: 'rgba(100,116,139,0.55)', marginTop: 4, paddingLeft: 2 }}>{hint}</div>}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, color: '#f87171', fontSize: '0.73rem', fontWeight: 500, animation: 'fadeSlideDown 0.18s ease' }}>
          <AlertIcon />{error}
        </div>
      )}
    </div>
  );
}

/* ── Step indicator ── */
function StepBar({ step, total }) {
  const labels = ['Personal Info', 'Professional', 'Security'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < total - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, transition: 'all 0.25s ease',
                background: done ? 'linear-gradient(135deg,#22c55e,#16a34a)' : active ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done ? '#22c55e' : active ? 'rgba(37,99,235,0.8)' : 'rgba(148,163,184,0.1)'}`,
                color: done || active ? '#fff' : 'rgba(100,116,139,0.5)',
                boxShadow: active ? '0 0 16px rgba(37,99,235,0.35)' : done ? '0 0 12px rgba(34,197,94,0.25)' : 'none',
              }}>
                {done ? <Check /> : i + 1}
              </div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: done ? '#4ade80' : active ? '#93c5fd' : 'rgba(100,116,139,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {labels[i]}
              </div>
            </div>
            {i < total - 1 && (
              <div style={{ flex: 1, height: 2, marginTop: -16, background: done ? 'rgba(34,197,94,0.4)' : 'rgba(148,163,184,0.08)', transition: 'background 0.3s ease', marginLeft: 6, marginRight: 6 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Password strength bar ── */
function StrengthBar({ password }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  const rules = [
    { ok: password.length >= 8, text: '8+ chars' },
    { ok: /[A-Z]/.test(password), text: 'Uppercase' },
    { ok: /[a-z]/.test(password), text: 'Lowercase' },
    { ok: /\d/.test(password), text: 'Number' },
    { ok: /[@$!%*?&]/.test(password), text: 'Symbol' },
  ];
  return (
    <div style={{ marginTop: 8, marginBottom: 16 }}>
      {/* Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} style={{ flex: 1, height: 3, borderRadius: 999, background: n <= score ? color : 'rgba(148,163,184,0.1)', transition: 'background 0.25s ease' }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rules.map(r => (
            <span key={r.text} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', fontWeight: 600, color: r.ok ? '#4ade80' : 'rgba(100,116,139,0.45)', transition: 'color 0.2s' }}>
              {r.ok ? '✓' : '○'} {r.text}
            </span>
          ))}
        </div>
        {label && <span style={{ fontSize: '0.7rem', fontWeight: 700, color, letterSpacing: '0.04em' }}>{label}</span>}
      </div>
    </div>
  );
}

/* ── Match indicator ── */
function MatchBadge({ password, confirm }) {
  if (!confirm) return null;
  const match = password === confirm;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: -8, marginBottom: 12, fontSize: '0.73rem', fontWeight: 600, color: match ? '#4ade80' : '#f87171', animation: 'fadeSlideDown 0.18s ease' }}>
      {match ? '✓ Passwords match' : '✗ Passwords do not match'}
    </div>
  );
}

/* ── Success Screen ── */
function SuccessScreen({ name, onGoLogin }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeSlideUp 0.4s ease' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '2rem', boxShadow: '0 0 40px rgba(34,197,94,0.4)' }}>
        ✓
      </div>
      <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#e8edf5', marginBottom: 10, letterSpacing: '-0.02em' }}>Registration Successful!</h2>
      <p style={{ fontSize: '0.88rem', color: 'rgba(100,116,139,0.75)', lineHeight: 1.7, marginBottom: 8, maxWidth: 320, margin: '0 auto 8px' }}>
        Welcome, <strong style={{ color: '#e8edf5' }}>{name}</strong>! Your account has been created and is awaiting admin verification.
      </p>
      <p style={{ fontSize: '0.82rem', color: 'rgba(100,116,139,0.5)', marginBottom: 28 }}>You'll be notified once your account is approved.</p>
      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(74,222,128,0.8)', marginBottom: 26, textAlign: 'left' }}>
        📧 Next steps: Contact your hospital admin and ask them to verify your account in the admin portal.
      </div>
      <button onClick={onGoLogin} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontFamily: "'Inter',sans-serif", fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
        Go to Login →
      </button>
    </div>
  );
}

/* ── Main Component ── */
const INITIAL = { name: '', nic: '', telephone: '', address: '', hospital: '', ward: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [wards, setWards] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  // Fetch system data for dropdowns (public endpoints)
  useEffect(() => {
    API.get('/wards').then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => setWards([]));
    API.get('/hospitals').then(r => setHospitals(Array.isArray(r.data) ? r.data : [])).catch(() => setHospitals([]));
  }, []);

  const filteredWards = useMemo(() => {
    if (!form.hospital) return [];
    return wards.filter(w => w.hospital === form.hospital);
  }, [wards, form.hospital]);

  useEffect(() => {
    if (form.hospital) set('ward', '');
  }, [form.hospital]);

  const set = useCallback((name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
    if (globalError) setGlobalError('');
  }, [errors, globalError]);

  /* ── Per-step validation ── */
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = 'Full name is required';
      else if (form.name.trim().length < 3) e.name = 'Name must be at least 3 characters';
      const nic = form.nic.trim();
      if (!nic) e.nic = 'NIC number is required';
      else if (!/^(\d{9}[VvXx]|\d{12})$/.test(nic)) e.nic = 'Invalid NIC (9 digits + V/X, or 12 digits)';
      const tel = form.telephone.trim();
      const digitsOnly = tel.replace(/\D/g, '');
      if (!tel) e.telephone = 'Telephone is required';
      else if (digitsOnly.length !== 10) e.telephone = 'Must be exactly 10 digits (e.g. 0712345678)';
    }
    if (s === 1) {
      if (!form.hospital.trim()) e.hospital = 'Hospital name is required';
      if (!form.ward) e.ward = 'Please select your ward';
      if (!form.address.trim()) e.address = 'Address is required';
      else if (form.address.trim().length < 5) e.address = 'Address must be at least 5 characters';
    }
    if (s === 2) {
      if (!form.password) e.password = 'Password is required';
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(form.password))
        e.password = 'Password must have 8+ chars, uppercase, lowercase, number & symbol (@$!%*?&)';
      if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
      else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    return e;
  };

  const handleNext = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleBack = () => { setErrors({}); setGlobalError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    const e = validateStep(2);
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const payload = {
        name:      form.name.trim(),
        nic:       form.nic.trim().toUpperCase(),
        telephone: form.telephone.trim(),
        address:   form.address.trim(),
        hospital:  form.hospital.trim(),
        ward:      form.ward.trim(),
        password:  form.password,
        confirmPassword: form.confirmPassword,
      };
      await API.post('/auth/register', payload);
      setSuccess(true);
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeSlideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn        { from{opacity:0} to{opacity:1} }
        @keyframes spin          { to{transform:rotate(360deg)} }
        @keyframes stepIn        { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
        @keyframes stepBack      { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
        .reg-root { height:100vh; display:flex; background:#060d1a; font-family:'Inter',sans-serif; overflow:hidden; }
        .reg-brand {
          width: 380px; flex-shrink: 0;
          background: linear-gradient(155deg,#030a14 0%,#07112a 50%,#0b1c3a 100%);
          border-right: 1px solid rgba(37,99,235,0.1);
          display: flex; flex-direction: column;
          padding: 44px 44px 36px; position: relative;
          overflow-y: auto; overflow-x: hidden; height: 100%;
        }
        .reg-form-panel {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          padding: 0 32px; position: relative;
          overflow-y: auto; overflow-x: hidden; height: 100%;
          background: radial-gradient(ellipse 60% 70% at 50% 30%,rgba(37,99,235,0.04) 0%,transparent 70%);
        }
        .reg-card { width:100%; max-width:460px; padding: 40px 0; margin: auto 0; animation:fadeSlideUp 0.35s ease; }
        .step-content { animation: stepIn 0.22s ease; }
        .reg-btn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          padding: 12px 22px; border:none; border-radius:11px;
          font-family:'Inter',sans-serif; font-size:0.88rem; font-weight:700;
          cursor:pointer; transition:all 0.2s ease; letter-spacing:0.01em;
        }
        .reg-btn-primary {
          background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff;
          box-shadow: 0 4px 18px rgba(37,99,235,0.38);
        }
        .reg-btn-primary:not(:disabled):hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(37,99,235,0.5); }
        .reg-btn-primary:disabled { opacity:0.65; cursor:not-allowed; }
        .reg-btn-ghost { background:rgba(255,255,255,0.04); color:rgba(148,163,184,0.7); border:1px solid rgba(148,163,184,0.1); }
        .reg-btn-ghost:hover { background:rgba(255,255,255,0.08); color:#e8edf5; }
        .global-error {
          background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.22);
          border-radius:10px; padding:11px 14px; display:flex; align-items:flex-start; gap:10px;
          margin-bottom:18px; animation:fadeSlideDown 0.2s ease; color:#fca5a5;
          font-size:0.82rem; font-weight:500; line-height:1.5;
        }
        .eyetoggle { background:transparent; border:none; cursor:pointer; color:rgba(100,116,139,0.55); display:flex; align-items:center; padding:4px; border-radius:6px; transition:color 0.15s; }
        .eyetoggle:hover { color:rgba(148,163,184,0.85); }
        @media(max-width:900px) { .reg-brand { display:none; } }
        @media(max-width:520px)  { .reg-form-panel { padding:24px 16px; } }
      `}</style>

      <div className="reg-root">
        {/* ─── Brand Panel ─── */}
        <div className="reg-brand">
          {/* Grid background */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(37,99,235,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.06) 1px,transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }} />
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} aria-hidden="true">
            <circle cx="80%" cy="20%" r="180" fill="rgba(37,99,235,0.06)"><animate attributeName="r" values="180;200;180" dur="10s" repeatCount="indefinite"/></circle>
            <circle cx="20%" cy="80%" r="140" fill="rgba(6,182,212,0.05)"><animate attributeName="r" values="140;160;140" dur="13s" repeatCount="indefinite"/></circle>
          </svg>

          <div style={{ position:'relative', zIndex:1 }}>
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:13, marginBottom:52 }}>
              <div style={{ width:42, height:42, borderRadius:11, background:'linear-gradient(135deg,#2563eb,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 18px rgba(37,99,235,0.4)', flexShrink:0 }}>
                <svg width="21" height="21" viewBox="0 0 32 32" fill="none"><rect x="13" y="4" width="6" height="24" rx="2" fill="white" opacity="0.95"/><rect x="4" y="13" width="24" height="6" rx="2" fill="white" opacity="0.95"/></svg>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'1.2rem', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>NurseConnect</div>
                <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.3)', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase' }}>Healthcare Platform</div>
              </div>
            </div>

            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'2.2rem', fontWeight:800, color:'#fff', lineHeight:1.15, letterSpacing:'-0.03em', marginBottom:14 }}>
              Join the<br />
              <span style={{ background:'linear-gradient(90deg,#60a5fa,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Healthcare</span><br />
              Community
            </div>
            <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.35)', lineHeight:1.8, maxWidth:280, marginBottom:44 }}>
              Create your account in 3 simple steps. Admin verification required for security.
            </div>

            {/* Step mini-guide */}
            {[
              { n: '01', label: 'Personal Information', desc: 'Name, NIC & contact' },
              { n: '02', label: 'Professional Details', desc: 'Hospital & ward assignment' },
              { n: '03', label: 'Secure Password', desc: 'Strong password with validation' },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:20 }}>
                <div style={{
                  width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', fontWeight:800,
                  background: step > i ? 'rgba(34,197,94,0.2)' : step === i ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${step > i ? 'rgba(34,197,94,0.4)' : step === i ? 'rgba(37,99,235,0.5)' : 'rgba(148,163,184,0.08)'}`,
                  color: step > i ? '#4ade80' : step === i ? '#93c5fd' : 'rgba(100,116,139,0.35)',
                  transition:'all 0.25s',
                }}>
                  {step > i ? '✓' : s.n}
                </div>
                <div>
                  <div style={{ fontSize:'0.82rem', fontWeight:700, color: step >= i ? (step > i ? '#4ade80' : '#93c5fd') : 'rgba(100,116,139,0.4)', transition:'color 0.25s' }}>{s.label}</div>
                  <div style={{ fontSize:'0.73rem', color:'rgba(100,116,139,0.35)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ position:'relative', zIndex:1, marginTop:'auto', fontSize:'0.72rem', color:'rgba(100,116,139,0.3)', lineHeight:1.6 }}>
            🔒 Your data is encrypted end-to-end.<br />
            NurseConnect · © {new Date().getFullYear()}
          </div>
        </div>

        {/* ─── Form Panel ─── */}
        <div className="reg-form-panel">
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(37,99,235,0.05) 1px,transparent 1px)', backgroundSize:'26px 26px', pointerEvents:'none' }} />

          <div className="reg-card">
            {/* Header */}
            <div style={{ marginBottom:32 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(37,99,235,0.09)', border:'1px solid rgba(37,99,235,0.18)', borderRadius:999, padding:'4px 12px', marginBottom:18 }}>
                <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#93c5fd', letterSpacing:'0.08em', textTransform:'uppercase' }}>Create Account</span>
              </div>
              <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'1.85rem', fontWeight:800, color:'#e8edf5', margin:'0 0 6px', letterSpacing:'-0.025em', lineHeight:1.2 }}>
                {success ? 'You\'re all set!' : step === 0 ? 'Personal Information' : step === 1 ? 'Professional Details' : 'Create Password'}
              </h1>
              {!success && <p style={{ fontSize:'0.85rem', color:'rgba(100,116,139,0.7)', fontWeight:400 }}>
                {step === 0 ? 'Enter your basic personal details' : step === 1 ? 'Tell us about your hospital and ward' : 'Choose a strong password to secure your account'}
              </p>}
            </div>

            {success ? (
              <SuccessScreen name={form.name} onGoLogin={() => navigate('/login')} />
            ) : (
              <>
                {/* Step bar */}
                <StepBar step={step} total={3} />

                {/* Global error */}
                {globalError && (
                  <div className="global-error">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    {globalError}
                  </div>
                )}

                {/* ─── Step 0: Personal Info ─── */}
                {step === 0 && (
                  <div className="step-content">
                    <Field id="name" label="Full Name" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} autoComplete="name" hint="As per your official identification" />
                    <div className="grid-2">
                      <Field id="nic" label="NIC Number" value={form.nic} onChange={e => set('nic', e.target.value.toUpperCase())} error={errors.nic} autoComplete="off" hint="9V/X or 12-digit format" />
                      <Field id="telephone" label="Telephone" value={form.telephone} onChange={e => set('telephone', e.target.value)} error={errors.telephone} autoComplete="tel" hint="e.g. 0712345678" />
                    </div>
                  </div>
                )}

                {/* ─── Step 1: Professional Details ─── */}
                {step === 1 && (
                  <div className="step-content">
                    {/* Hospital dropdown */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{
                        position: 'relative',
                        border: `1.5px solid ${errors.hospital ? 'rgba(239,68,68,0.6)' : form.hospital ? 'rgba(37,99,235,0.7)' : 'rgba(148,163,184,0.12)'}`,
                        borderRadius: 11,
                        background: 'rgba(8,15,30,0.5)',
                        boxShadow: errors.hospital ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
                        transition: 'all 0.18s ease',
                      }}>
                        <label style={{
                          display: 'block',
                          position: 'absolute', left: 13, top: 7,
                          fontSize: '0.62rem', fontWeight: 700,
                          color: errors.hospital ? '#f87171' : '#93c5fd',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          pointerEvents: 'none', zIndex: 1,
                        }}>Hospital Name *</label>
                        <SearchableSelect
                          options={hospitals.map(h => ({ value: h.name, label: h.name }))}
                          value={form.hospital}
                          onChange={val => set('hospital', val)}
                          placeholder="Search Hospital..."
                          className="registration-select"
                        />
                        <style>{`
                          .registration-select .searchable-select-trigger {
                            background: transparent !important;
                            border: none !important;
                            padding-top: 22px !important;
                            padding-bottom: 6px !important;
                            min-height: 48px !important;
                          }
                        `}</style>
                      </div>
                      {hospitals.length === 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.4)', marginTop: 4, paddingLeft: 2 }}>
                          No hospitals initialized in system.
                        </div>
                      )}
                      {errors.hospital && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, color: '#f87171', fontSize: '0.73rem', fontWeight: 500 }}>
                          <AlertIcon />{errors.hospital}
                        </div>
                      )}
                    </div>

                    {/* Ward Selection Grid — Interactive Chips */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.62rem', fontWeight: 700,
                        color: errors.ward ? '#f87171' : '#93c5fd',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        marginBottom: 10, paddingLeft: 4
                      }}>Select Your Ward *</label>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                        gap: 10,
                        maxHeight: 220,
                        overflowY: 'auto',
                        padding: '4px',
                        marginBottom: 8
                      }}>
                        {filteredWards.map(w => {
                          const active = form.ward === w.name;
                          return (
                            <div 
                              key={w._id}
                              onClick={() => set('ward', w.name)}
                              style={{
                                background: active ? 'rgba(37,99,235,0.15)' : 'rgba(8,15,30,0.5)',
                                border: `1.5px solid ${active ? '#3b82f6' : 'rgba(148,163,184,0.12)'}`,
                                borderRadius: 12,
                                padding: '12px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: 'center',
                                boxShadow: active ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                                transform: active ? 'translateY(-2px)' : 'none'
                              }}
                            >
                              <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>🏥</div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: active ? '#fff' : '#e8edf5', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: active ? '#93c5fd' : 'rgba(148,163,184,0.5)' }}>
                                {w.userCount || 0} Nurses
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {filteredWards.length === 0 && (
                        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.25)', borderRadius: 11, padding: '16px', textAlign: 'center' }}>
                           <span style={{ fontSize: '0.78rem', color: 'rgba(245,158,11,0.7)' }}>
                             {form.hospital ? '⚠️ No wards configured for this hospital.' : '👈 Please select a hospital first.'}
                           </span>
                        </div>
                      )}
                      
                      {errors.ward && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, color: '#f87171', fontSize: '0.73rem', fontWeight: 500 }}>
                          <AlertIcon />{errors.ward}
                        </div>
                      )}
                    </div>

                    <Field id="address" label="Home Address" value={form.address} onChange={e => set('address', e.target.value)} error={errors.address} autoComplete="street-address" hint="Your residential address" />
                    <div style={{ background:'rgba(37,99,235,0.07)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:11, padding:'12px 14px', fontSize:'0.78rem', color:'rgba(148,163,184,0.6)', lineHeight:1.6 }}>
                      ℹ️ Your hospital and ward can be updated later by an administrator once you're verified.
                    </div>
                  </div>
                )}

                {/* ─── Step 2: Security ─── */}
                {step === 2 && (
                  <div className="step-content">
                    <Field
                      id="password" label="Password"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      error={errors.password}
                      autoComplete="new-password"
                      suffix={
                        <button type="button" className="eyetoggle" onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                          {showPass ? <EyeOpen /> : <EyeOff />}
                        </button>
                      }
                    />
                    <StrengthBar password={form.password} />

                    <Field
                      id="confirmPassword" label="Confirm Password"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                      error={errors.confirmPassword}
                      autoComplete="new-password"
                      suffix={
                        <button type="button" className="eyetoggle" onClick={() => setShowConfirm(v => !v)} aria-label="Toggle confirm password">
                          {showConfirm ? <EyeOpen /> : <EyeOff />}
                        </button>
                      }
                    />
                    <MatchBadge password={form.password} confirm={form.confirmPassword} />

                    {/* Summary of filled data */}
                    <div style={{ background:'rgba(8,15,30,0.6)', border:'1px solid rgba(148,163,184,0.08)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
                      <div style={{ fontSize:'0.68rem', fontWeight:700, color:'rgba(100,116,139,0.5)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Registration Summary</div>
                      {[
                        ['Name',      form.name],
                        ['NIC',       form.nic],
                        ['Phone',     form.telephone],
                        ['Hospital',  form.hospital],
                        ['Ward',      form.ward || '—'],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', marginBottom:6 }}>
                          <span style={{ color:'rgba(100,116,139,0.55)', fontWeight:500 }}>{k}</span>
                          <span style={{ color:'#e8edf5', fontWeight:600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Navigation Buttons ─── */}
                <div style={{ display:'flex', gap:10, marginTop:6 }}>
                  {step > 0 && (
                    <button className="reg-btn reg-btn-ghost" onClick={handleBack} style={{ flex:1 }}>
                      <ChevL /> Back
                    </button>
                  )}
                  {step < 2 ? (
                    <button className="reg-btn reg-btn-primary" onClick={handleNext} style={{ flex:2 }}>
                      Continue <ChevR />
                    </button>
                  ) : (
                    <button className="reg-btn reg-btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex:2 }}>
                      {loading ? (
                        <>
                          <span style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                          Creating Account…
                        </>
                      ) : (
                        <> Create Account <ChevR /> </>
                      )}
                    </button>
                  )}
                </div>

                {/* Progress indicator */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:22, color:'rgba(100,116,139,0.35)', fontSize:'0.72rem' }}>
                  Step {step + 1} of 3
                  <div style={{ display:'flex', gap:4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:i === step ? 16 : 5, height:4, borderRadius:999, background:i === step ? '#3b82f6' : i < step ? 'rgba(34,197,94,0.4)' : 'rgba(148,163,184,0.1)', transition:'all 0.25s' }} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {!success && (
              <div style={{ textAlign:'center', marginTop:24, fontSize:'0.82rem', color:'rgba(100,116,139,0.55)' }}>
                Already registered?{' '}
                <Link to="/login" style={{ color:'#60a5fa', fontWeight:600, textDecoration:'none' }}
                  onMouseEnter={e => e.target.style.textDecoration='underline'}
                  onMouseLeave={e => e.target.style.textDecoration='none'}>
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
