import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing-root">
      <style>{`
        .landing-root {
          min-height: 100vh;
          background: var(--bg);
          background-image:
            radial-gradient(ellipse 90% 60% at 10% -10%, rgba(37,99,235,0.07) 0%, transparent 65%),
            radial-gradient(ellipse 70% 50% at 90% 110%, rgba(6,182,212,0.05) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.03) 0%, transparent 70%);
          color: var(--text);
          font-family: 'Inter', 'DM Sans', sans-serif;
        }

        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 8vw;
          backdrop-filter: blur(24px) saturate(1.6);
          background: rgba(6,13,28,0.9);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--text);
        }
        .brand-badge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), var(--primary-light));
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(37,99,235,0.35);
          font-weight: 700;
        }

        .nav-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn {
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 10px 18px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-ghost {
          color: var(--text2);
          border-color: var(--border);
          background: rgba(255,255,255,0.04);
        }
        .btn-ghost:hover { border-color: var(--border-hover); color: var(--text); }

        .btn-primary {
          color: #fff;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          box-shadow: 0 16px 32px rgba(37,99,235,0.25);
        }
        .btn-primary:hover { transform: translateY(-1px); }

        .hero {
          padding: 80px 8vw 40px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 36px;
          align-items: center;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--primary-light);
          background: rgba(37,99,235,0.12);
          border: 1px solid rgba(37,99,235,0.25);
        }

        .hero-title {
          font-size: clamp(2.2rem, 3.2vw, 3.6rem);
          line-height: 1.08;
          margin: 16px 0 12px;
          color: var(--text);
        }

        .hero-sub {
          color: var(--text2);
          font-size: 1.02rem;
          max-width: 560px;
        }

        .hero-cta {
          display: flex;
          gap: 14px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 28px;
        }

        .metric-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
        }
        .metric-card h4 { font-size: 1.3rem; margin-bottom: 4px; }
        .metric-card span { color: var(--text2); font-size: 0.78rem; }

        .hero-panel {
          background: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
          animation: float 6s ease-in-out infinite;
        }

        .glow-orb {
          position: absolute;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(37,99,235,0.28), transparent 65%);
          top: -40px;
          right: -40px;
        }

        .panel-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .panel-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .panel-card {
          background: rgba(255,255,255,0.03);
          border-radius: 14px;
          border: 1px solid var(--border-light);
          padding: 14px;
          min-height: 90px;
        }
        .panel-card h5 { font-size: 0.88rem; margin-bottom: 6px; }
        .panel-card p { font-size: 0.72rem; color: var(--text2); }

        .section {
          padding: 70px 8vw;
        }

        .section-title {
          font-size: clamp(1.6rem, 2.4vw, 2.2rem);
          margin-bottom: 8px;
        }

        .section-sub {
          color: var(--text2);
          font-size: 0.95rem;
          margin-bottom: 28px;
          max-width: 600px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .feature {
          background: var(--surface);
          border-radius: 18px;
          border: 1px solid var(--border);
          padding: 20px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .feature:hover { transform: translateY(-4px); border-color: rgba(37,99,235,0.35); }
        .feature h4 { margin: 12px 0 8px; font-size: 1.05rem; }
        .feature p { color: var(--text2); font-size: 0.85rem; }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .step {
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 18px;
          display: grid;
          gap: 10px;
        }

        .step span {
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--primary-light);
          letter-spacing: 0.08em;
        }

        .cta-banner {
          margin: 40px 8vw 80px;
          padding: 36px;
          background: linear-gradient(135deg, rgba(37,99,235,0.14), rgba(6,182,212,0.14));
          border: 1px solid rgba(37,99,235,0.25);
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .cta-banner h3 { font-size: 1.4rem; }
        .cta-banner p { color: var(--text2); }

        .footer {
          padding: 40px 8vw;
          border-top: 1px solid var(--border);
          color: var(--text3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.78rem;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @media (max-width: 1024px) {
          .hero { grid-template-columns: 1fr; }
          .hero-panel { order: -1; }
          .feature-grid, .steps { grid-template-columns: 1fr; }
          .hero-metrics { grid-template-columns: 1fr 1fr; }
          .cta-banner { flex-direction: column; text-align: center; }
        }

        @media (max-width: 640px) {
          .landing-nav, .hero, .section, .cta-banner, .footer { padding-left: 6vw; padding-right: 6vw; }
          .hero-metrics { grid-template-columns: 1fr; }
          .panel-grid { grid-template-columns: 1fr; }
          .nav-actions { flex-direction: column; }
        }
      `}</style>

      <nav className="landing-nav">
        <div className="brand">
          <span className="brand-badge">N</span>
          NurseConnect
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary">
            Request Access
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div>
          <span className="hero-tag">Built for modern nurse teams</span>
          <h1 className="hero-title">
            Unify shifts, leave, and clinical updates in one premium workspace.
          </h1>
          <p className="hero-sub">
            NurseConnect keeps staffing decisions, swap requests, overtime
            approvals, and hospital-wide updates in a single, secure command
            center. Designed for clarity, speed, and accountability.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary">
              Book a demo
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Explore live
            </Link>
          </div>
          <div className="hero-metrics">
            <div className="metric-card">
              <h4>42% faster</h4>
              <span>Shift swap approvals</span>
            </div>
            <div className="metric-card">
              <h4>98% on-time</h4>
              <span>Roster publishing rate</span>
            </div>
            <div className="metric-card">
              <h4>24/7</h4>
              <span>Secure staff access</span>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="glow-orb" />
          <div className="panel-title">Live Operations Snapshot</div>
          <div className="panel-grid">
            <div className="panel-card">
              <h5>Overtime Queue</h5>
              <p>8 requests awaiting approval, auto-sorted by priority.</p>
            </div>
            <div className="panel-card">
              <h5>Shift Coverage</h5>
              <p>Ward 3A coverage at 96%, no critical gaps.</p>
            </div>
            <div className="panel-card">
              <h5>Announcements</h5>
              <p>2 urgent clinical updates scheduled for today.</p>
            </div>
            <div className="panel-card">
              <h5>Verification</h5>
              <p>4 new nurse profiles pending admin review.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          Designed for care teams who need clarity.
        </h2>
        <p className="section-sub">
          Every touchpoint is built to reduce administrative friction and keep
          the clinical floor informed.
        </p>
        <div className="feature-grid">
          <div className="feature">
            <div style={{ fontSize: "1.6rem" }}>🧭</div>
            <h4>Command-grade dashboards</h4>
            <p>
              Surface real-time staffing insights, approvals, and alerts with
              zero noise.
            </p>
          </div>
          <div className="feature">
            <div style={{ fontSize: "1.6rem" }}>🔁</div>
            <h4>Instant swap workflows</h4>
            <p>
              Match shifts by ward, validate rosters, and track approvals
              end-to-end.
            </p>
          </div>
          <div className="feature">
            <div style={{ fontSize: "1.6rem" }}>🔔</div>
            <h4>Targeted notifications</h4>
            <p>
              Keep nurses informed without flooding inboxes or missing critical
              alerts.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How NurseConnect drives outcomes</h2>
        <p className="section-sub">
          A proven, three-step operating rhythm that aligns admin teams and
          nurses.
        </p>
        <div className="steps">
          <div className="step">
            <span>STEP 01</span>
            <h4>Plan with confidence</h4>
            <p>
              Roster planning, leave approvals, and overtime allocations in one
              secure pipeline.
            </p>
          </div>
          <div className="step">
            <span>STEP 02</span>
            <h4>Execute without chaos</h4>
            <p>
              Swap requests and shift changes verified instantly with real-time
              visibility.
            </p>
          </div>
          <div className="step">
            <span>STEP 03</span>
            <h4>Communicate in seconds</h4>
            <p>
              Announcements, notices, and incident updates reach the right staff
              every time.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div>
          <h3>Ready to elevate workforce coordination?</h3>
          <p>
            Launch NurseConnect for your hospital and get a guided onboarding
            plan.
          </p>
        </div>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary">
            Start onboarding
          </Link>
          <Link to="/login" className="btn btn-ghost">
            Admin login
          </Link>
        </div>
      </section>

      <footer className="footer">
        <span>Trusted by modern care teams</span>
        <span>Security-first. Audit-ready. Built for compliance.</span>
      </footer>
    </div>
  );
}
