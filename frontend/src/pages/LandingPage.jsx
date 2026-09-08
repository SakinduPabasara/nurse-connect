import { useState } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [copiedField, setCopiedField] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 8vw;
          backdrop-filter: blur(24px) saturate(1.6);
          background: rgba(6,13,28,0.92);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3);
          position: relative;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--text);
          text-decoration: none;
          flex-shrink: 0;
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
          color: #fff;
          flex-shrink: 0;
        }

        .desktop-nav-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .desktop-demo-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #93c5fd;
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.28);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .desktop-demo-btn:hover {
          background: rgba(37, 99, 235, 0.18);
          border-color: rgba(37, 99, 235, 0.45);
          color: #bfdbfe;
        }
        .demo-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px rgba(52, 211, 153, 0.8);
          display: inline-block;
        }

        .mobile-nav-controls {
          display: none;
          align-items: center;
          gap: 8px;
        }

        .mobile-quick-demo {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 600;
          color: #93c5fd;
          background: rgba(37, 99, 235, 0.12);
          border: 1px solid rgba(37, 99, 235, 0.3);
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .mobile-quick-demo:hover {
          background: rgba(37, 99, 235, 0.2);
          border-color: rgba(37, 99, 235, 0.45);
        }

        .mobile-menu-toggle {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }
        .mobile-menu-toggle:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .mobile-menu-toggle .bar {
          width: 16px;
          height: 1.5px;
          background: #cbd5e1;
          border-radius: 2px;
          transition: transform 0.2s ease, opacity 0.2s ease;
          transform-origin: center;
        }
        .mobile-menu-toggle.active .bar-top {
          transform: translateY(3.25px) rotate(45deg);
        }
        .mobile-menu-toggle.active .bar-bot {
          transform: translateY(-3.25px) rotate(-45deg);
        }

        /* Solid, bespoke mobile drawer sheet */
        .mobile-drawer-sheet {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #080e1b;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 48px -8px rgba(0, 0, 0, 0.9);
          padding: 16px 5vw 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: drawerSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 100;
        }

        @keyframes drawerSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .drawer-nav-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .drawer-nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .drawer-nav-item:hover, .drawer-nav-item:active {
          color: #f1f5f9;
          background: rgba(255, 255, 255, 0.04);
        }
        .drawer-nav-tag {
          font-size: 0.68rem;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .drawer-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 0;
        }

        /* Handcrafted Sandbox Card */
        .drawer-sandbox-card {
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(26, 38, 64, 0.5) 0%, rgba(13, 20, 36, 0.7) 100%);
          border: 1px solid rgba(59, 130, 246, 0.28);
          padding: 14px 16px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .sandbox-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .sandbox-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #60a5fa;
          text-transform: uppercase;
        }
        .sandbox-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px rgba(52, 211, 153, 0.8);
          display: inline-block;
        }
        .sandbox-role {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 500;
        }

        .sandbox-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 4px;
        }
        .sandbox-sub {
          font-size: 0.78rem;
          color: #94a3b8;
          line-height: 1.45;
          margin-bottom: 12px;
        }

        .sandbox-cred-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        .sandbox-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(7, 12, 23, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 6px 10px;
        }
        .chip-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.04em;
        }
        .chip-value {
          font-size: 0.76rem;
          font-family: 'Fira Code', 'Courier New', monospace;
          color: #cbd5e1;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sandbox-launch-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: 100%;
          padding: 9px 14px;
          border-radius: 8px;
          background: #2563eb;
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s ease;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
        }
        .sandbox-launch-btn:hover {
          background: #1d4ed8;
          color: #ffffff;
        }

        /* Auth buttons row */
        .drawer-actions-row {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 10px;
        }
        .drawer-btn-signin {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: #e2e8f0;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .drawer-btn-signin:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.16);
        }
        .drawer-btn-signup {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 8px;
          background: linear-gradient(135deg, hsl(226, 70%, 55%), hsl(188, 85%, 45%));
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
          transition: transform 0.15s ease;
        }
        .drawer-btn-signup:hover {
          transform: translateY(-1px);
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
          line-height: 1;
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
          padding: 40px 48px;
          background: linear-gradient(135deg, rgba(37,99,235,0.12), rgba(6,182,212,0.06));
          border: 1px solid rgba(37,99,235,0.25);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 36px;
        }

        .cta-banner h3 { font-size: 1.6rem; font-weight: 800; }
        .cta-banner p { color: var(--text2); font-size: 0.95rem; }

        /* ── Admin Demo Card (Portfolio Review) ── */
        .admin-demo-card {
          background: linear-gradient(145deg, rgba(13, 23, 42, 0.95), rgba(7, 12, 24, 0.98));
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 20px;
          padding: 24px 26px;
          width: 100%;
          max-width: 420px;
          flex-shrink: 0;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(245, 158, 11, 0.1);
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          text-align: left;
        }

        .admin-demo-card::before {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        .admin-demo-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .admin-demo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15));
          border: 1px solid rgba(245, 158, 11, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fbbf24;
          flex-shrink: 0;
        }

        .admin-demo-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          font-size: 0.62rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 2px;
        }

        .admin-demo-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.01em;
        }

        .admin-demo-sub {
          font-size: 0.78rem;
          color: var(--text3);
          line-height: 1.45;
          margin-bottom: 16px;
        }

        .admin-demo-fields {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .admin-demo-field {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .admin-demo-label {
          color: var(--text3);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          width: 75px;
          flex-shrink: 0;
        }

        .admin-demo-val {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          color: #60a5fa;
          font-size: 0.85rem;
          font-weight: 700;
          flex: 1;
          letter-spacing: 0.04em;
        }

        .admin-demo-copy-btn {
          all: unset;
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .admin-demo-copy-btn:hover {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.35);
          color: #fbbf24;
        }

        .admin-demo-copy-btn.copied {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.35);
          color: #34d399;
        }

        .admin-demo-launch-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, #d97706, #b45309);
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 18px rgba(217, 119, 6, 0.35);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .admin-demo-launch-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(217, 119, 6, 0.5);
          color: #fff;
        }

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
          .cta-banner { flex-direction: column; text-align: left; align-items: stretch; gap: 28px; }
          .admin-demo-card { max-width: 100%; }
        }

        @media (max-width: 768px) {
          .desktop-nav-actions {
            display: none !important;
          }
          .mobile-nav-controls {
            display: flex !important;
          }
        }

        @media (max-width: 640px) {
          .landing-nav {
            padding: 12px 4vw;
          }
          .brand {
            font-size: 0.95rem;
            gap: 8px;
          }
          .brand-badge {
            width: 30px;
            height: 30px;
            font-size: 0.85rem;
            border-radius: 8px;
          }
          .hero, .section, .footer {
            padding-left: 4vw;
            padding-right: 4vw;
          }
          .hero {
            padding-top: 24px;
            padding-bottom: 24px;
            gap: 20px;
          }
          .hero-tag {
            font-size: 0.72rem;
            padding: 4px 11px;
            margin-bottom: 10px;
            white-space: normal;
          }
          .hero-title {
            font-size: clamp(1.65rem, 6.2vw, 2.2rem);
            line-height: 1.15;
            margin: 10px 0 12px;
            word-break: break-word;
          }
          .hero-sub {
            font-size: 0.88rem;
            line-height: 1.55;
            margin-bottom: 18px;
          }
          .hero-cta {
            flex-direction: column;
            width: 100%;
            gap: 10px;
            margin-top: 16px;
          }
          .hero-cta .btn {
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
            padding: 12px 16px;
            font-size: 0.88rem;
          }
          .hero-metrics {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 18px;
          }
          .metric-card {
            padding: 12px 14px;
          }
          .metric-card h4 {
            font-size: 1.2rem;
          }
          .hero-panel {
            padding: 16px 14px;
            border-radius: 16px;
          }
          .panel-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .panel-card {
            padding: 12px;
          }
          .cta-banner {
            margin: 24px 4vw 48px;
            padding: 22px 16px;
          }
          .footer {
            flex-direction: column;
            text-align: center;
            gap: 8px;
            padding-top: 24px;
            padding-bottom: 24px;
          }
        }

        @media (max-width: 360px) {
          .brand span:last-child {
            font-size: 0.86rem;
          }
          .mobile-quick-demo {
            padding: 4px 8px;
            font-size: 0.7rem;
          }
        }
      `}</style>

      <nav className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-badge">N</span>
          <span>NurseConnect</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-nav-actions">
          <Link
            to="/login"
            state={{ demoNic: "ADMIN000000", demoPassword: "Admin@1234" }}
            className="desktop-demo-btn"
            title="Explore Admin Command Center with pre-filled demo details"
          >
            <span className="demo-live-dot" />
            <span>Admin Demo</span>
          </Link>
          <Link to="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary">
            Request Access
          </Link>
        </div>

        {/* Mobile Navigation Controls */}
        <div className="mobile-nav-controls">
          <Link
            to="/login"
            state={{ demoNic: "ADMIN000000", demoPassword: "Admin@1234" }}
            className="mobile-quick-demo"
            title="Admin Demo"
          >
            <span className="demo-live-dot" />
            <span>Demo</span>
          </Link>

          <button
            type="button"
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="bar bar-top" />
            <span className="bar bar-bot" />
          </button>
        </div>

        {/* Mobile Dropdown Menu (Handcrafted Human Design) */}
        {mobileMenuOpen && (
          <div className="mobile-drawer-sheet">
            {/* Quick in-page navigation links */}
            <div className="drawer-nav-list">
              <a href="#features" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                <span>Platform Capabilities</span>
                <span className="drawer-nav-tag">Core</span>
              </a>
              <a href="#workflows" className="drawer-nav-item" onClick={() => setMobileMenuOpen(false)}>
                <span>Clinical Operating Steps</span>
                <span className="drawer-nav-tag">Workflow</span>
              </a>
            </div>

            <div className="drawer-divider" />

            {/* Handcrafted Portfolio Sandbox Card */}
            <div className="drawer-sandbox-card">
              <div className="sandbox-top">
                <div className="sandbox-badge">
                  <span className="sandbox-pulse" />
                  Portfolio Evaluation
                </div>
                <span className="sandbox-role">Administrator</span>
              </div>

              <div className="sandbox-title">Admin Command Center</div>
              <div className="sandbox-sub">
                Explore live ward rosters, swap requests, overtime queues and clinical resource tracking.
              </div>

              <div className="sandbox-cred-row">
                <div className="sandbox-chip">
                  <span className="chip-label">NIC</span>
                  <span className="chip-value">ADMIN000000</span>
                </div>
                <div className="sandbox-chip">
                  <span className="chip-label">PASS</span>
                  <span className="chip-value">Admin@1234</span>
                </div>
              </div>

              <Link
                to="/login"
                state={{ demoNic: "ADMIN000000", demoPassword: "Admin@1234" }}
                className="sandbox-launch-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Launch Admin Demo</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            {/* Bottom standard actions */}
            <div className="drawer-actions-row">
              <Link
                to="/login"
                className="drawer-btn-signin"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="drawer-btn-signup"
                onClick={() => setMobileMenuOpen(false)}
              >
                Request Access
              </Link>
            </div>
          </div>
        )}
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

      <section id="features" className="section">
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

      <section id="workflows" className="section">
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
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#60a5fa', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            <span>⚡</span> Enterprise Ready
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: 10, lineHeight: 1.25 }}>
            Ready to elevate workforce coordination?
          </h3>
          <p style={{ color: 'var(--text2)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: 480, marginBottom: 24 }}>
            Launch NurseConnect for your hospital and get a guided onboarding plan. Explore shift swaps, ward rosters, and clinical resource tracking live.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary">
              Start onboarding
            </Link>
            <Link
              to="/login"
              state={{ demoNic: "ADMIN000000", demoPassword: "Admin@1234" }}
              className="btn btn-ghost"
              title="Click to go to Admin Login with pre-filled demo details"
            >
              Admin login
            </Link>
          </div>
        </div>

        {/* ── Admin Demo Login Card (Portfolio Showcase) ── */}
        <div className="admin-demo-card">
          <div className="admin-demo-header">
            <div className="admin-demo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div className="admin-demo-badge">Portfolio Demo</div>
              <div className="admin-demo-title">Admin Demo Login</div>
            </div>
          </div>

          <p className="admin-demo-sub">
            Exploring for client or recruiter evaluation? Use these credentials to test the full Administrator Command Center:
          </p>

          <div className="admin-demo-fields">
            <div className="admin-demo-field">
              <span className="admin-demo-label">NIC:</span>
              <code className="admin-demo-val">ADMIN000000</code>
              <button
                type="button"
                className={`admin-demo-copy-btn ${copiedField === "nic" ? "copied" : ""}`}
                onClick={() => copyToClipboard("ADMIN000000", "nic")}
                title="Copy NIC to clipboard"
              >
                {copiedField === "nic" ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <div className="admin-demo-field">
              <span className="admin-demo-label">Password:</span>
              <code className="admin-demo-val">Admin@1234</code>
              <button
                type="button"
                className={`admin-demo-copy-btn ${copiedField === "pass" ? "copied" : ""}`}
                onClick={() => copyToClipboard("Admin@1234", "pass")}
                title="Copy password to clipboard"
              >
                {copiedField === "pass" ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <Link
            to="/login"
            state={{ demoNic: "ADMIN000000", demoPassword: "Admin@1234" }}
            className="admin-demo-launch-btn"
          >
            <span>One-Click Admin Demo Login</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
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
