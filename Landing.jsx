import { useEffect, useRef, useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: #080810;
    color: #f8fafc;
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #080810; }
  ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 3px; }

  @keyframes blob-pulse {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.12); opacity: 1; }
  }

  @keyframes blob-drift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.05); }
    66% { transform: translate(-20px, 15px) scale(0.97); }
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes nav-drop {
    from { opacity: 0; transform: translateY(-16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes float-card {
    0%, 100% { transform: perspective(1000px) rotateX(5deg) translateY(0px); }
    50%       { transform: perspective(1000px) rotateX(5deg) translateY(-10px); }
  }

  @keyframes noise {
    0%   { background-position: 0 0; }
    100% { background-position: 200px 200px; }
  }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .conjure-nav {
    animation: nav-drop 0.6s ease forwards;
  }

  .fade-up-0  { animation: fade-up 0.7s ease 0.1s both; }
  .fade-up-1  { animation: fade-up 0.7s ease 0.25s both; }
  .fade-up-2  { animation: fade-up 0.7s ease 0.4s both; }
  .fade-up-3  { animation: fade-up 0.7s ease 0.55s both; }
  .fade-up-4  { animation: fade-up 0.7s ease 0.7s both; }
  .fade-up-5  { animation: fade-up 0.7s ease 0.85s both; }
  .fade-up-6  { animation: fade-up 0.7s ease 1.0s both; }

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  .blob-main {
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(124,58,237,0.45) 0%, rgba(109,40,217,0.2) 50%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -55%);
    animation: blob-pulse 6s ease-in-out infinite, blob-drift 12s ease-in-out infinite;
  }

  .blob-secondary {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%);
    top: 30%;
    right: 10%;
    animation: blob-pulse 8s ease-in-out 2s infinite;
  }

  .blob-tertiary {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(59,7,100,0.4) 0%, transparent 70%);
    bottom: 20%;
    left: 8%;
    animation: blob-pulse 10s ease-in-out 4s infinite;
  }

  .noise-overlay {
    position: absolute;
    inset: 0;
    opacity: 0.035;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  .gradient-text {
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 40%, #c4b5fd 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  .btn-primary {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    color: #fff;
    border: none;
    border-radius: 100px;
    padding: 14px 28px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: box-shadow 0.25s ease, transform 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
  }
  .btn-primary:hover {
    box-shadow: 0 0 30px rgba(124,58,237,0.6), 0 4px 20px rgba(124,58,237,0.3);
    transform: translateY(-1px);
  }

  .btn-ghost {
    background: rgba(255,255,255,0.05);
    color: #f8fafc;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 100px;
    padding: 14px 28px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
  }
  .btn-ghost:hover {
    background: rgba(255,255,255,0.09);
    border-color: rgba(255,255,255,0.25);
    transform: translateY(-1px);
  }

  .nav-link {
    color: #64748b;
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 400;
    transition: color 0.2s;
    cursor: pointer;
  }
  .nav-link:hover { color: #f8fafc; }

  .stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 100px;
    font-size: 13px;
    color: #94a3b8;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, color 0.2s;
  }
  .stat-pill:hover {
    border-color: rgba(124,58,237,0.4);
    color: #c4b5fd;
  }

  .app-mockup {
    border-radius: 20px;
    background: #0f0f1a;
    border: 1px solid #1e1e2e;
    box-shadow:
      0 0 80px rgba(124,58,237,0.25),
      0 0 200px rgba(124,58,237,0.1),
      0 40px 80px rgba(0,0,0,0.6);
    animation: float-card 5s ease-in-out infinite;
    overflow: hidden;
    transform: perspective(1000px) rotateX(5deg);
  }

  .feature-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid #1e1e2e;
    border-radius: 16px;
    padding: 32px;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .feature-card:hover {
    transform: translateY(-4px);
    border-color: rgba(124,58,237,0.35);
    box-shadow: 0 8px 32px rgba(124,58,237,0.12);
  }

  .mobile-menu {
    display: none;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    padding: 4px;
  }
  .mobile-menu span {
    display: block;
    width: 22px;
    height: 2px;
    background: #94a3b8;
    border-radius: 2px;
    transition: background 0.2s;
  }
  .mobile-menu:hover span { background: #f8fafc; }

  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .mobile-menu { display: flex; }
    .hero-h1 { font-size: 48px !important; }
    .hero-sub { font-size: 16px !important; }
    .features-grid { grid-template-columns: 1fr !important; }
    .cta-row { flex-direction: column !important; align-items: center !important; }
    .stats-row { flex-wrap: wrap !important; justify-content: center !important; }
    .nav-right { gap: 8px !important; }
  }

  @media (max-width: 480px) {
    .hero-h1 { font-size: 36px !important; }
    .features-grid { grid-template-columns: 1fr !important; }
  }

  .section-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(124,58,237,0.1);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 500;
    color: #a78bfa;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .footer-link {
    color: #64748b;
    text-decoration: none;
    font-size: 13px;
    transition: color 0.2s;
  }
  .footer-link:hover { color: #f8fafc; }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #1e1e2e, transparent);
    margin: 0 auto;
    width: 100%;
  }
`;

const features = [
  {
    icon: "✦",
    title: "AI Summaries",
    desc: "Instantly summarize any note with one click. Get the gist in seconds.",
  },
  {
    icon: "⚡",
    title: "Smart Auto-save",
    desc: "Never lose a thought. Every keystroke is saved the moment you type it.",
  },
  {
    icon: "🔗",
    title: "Public Sharing",
    desc: "Share notes with a single link — no account, no friction, no login needed.",
  },
  {
    icon: "🏷️",
    title: "Tag & Filter",
    desc: "Organize notes with smart tags and find anything instantly across all your notes.",
  },
  {
    icon: "📊",
    title: "Insights Dashboard",
    desc: "Track your writing streaks, word counts, and productivity with visual stats.",
  },
  {
    icon: "🔒",
    title: "Secure Auth",
    desc: "JWT-based authentication means your notes stay completely private — always.",
  },
];

const sampleNotes = [
  { title: "Q2 Strategy Brief", tag: "Work", color: "#7c3aed", preview: "Outline key OKRs for the next quarter..." },
  { title: "Book Notes — Atomic Habits", tag: "Reading", color: "#0ea5e9", preview: "Identity-based habits vs outcome-based..." },
  { title: "Weekend Recipe Ideas", tag: "Personal", color: "#10b981", preview: "Thai green curry, sourdough starter..." },
  { title: "Meeting Notes — 14 May", tag: "Work", color: "#f59e0b", preview: "Action items: deploy by Friday, review..." },
];

function AppMockup() {
  return (
    <div className="app-mockup fade-up-6" style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", height: 520 }}>
        {/* Sidebar */}
        <div style={{
          width: 60,
          background: "#08080f",
          borderRight: "1px solid #1e1e2e",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
          gap: 20,
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#7c3aed" }}>✦</div>
          {["▦", "☰", "⊞", "◈", "◎"].map((icon, i) => (
            <div key={i} style={{
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 10,
              background: i === 1 ? "rgba(124,58,237,0.2)" : "transparent",
              color: i === 1 ? "#a78bfa" : "#334155",
              fontSize: 14,
              cursor: "pointer",
            }}>{icon}</div>
          ))}
        </div>

        {/* Notes list */}
        <div style={{
          width: 240,
          borderRight: "1px solid #1e1e2e",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 14px 12px",
            borderBottom: "1px solid #1e1e2e",
          }}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid #1e1e2e",
              borderRadius: 8,
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#334155",
              fontSize: 12,
            }}>
              <span>🔍</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif" }}>Search notes…</span>
            </div>
          </div>
          <div style={{ padding: "8px 6px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            {sampleNotes.map((note, i) => (
              <div key={i} style={{
                padding: "10px 10px",
                borderRadius: 10,
                background: i === 0 ? "rgba(124,58,237,0.12)" : "transparent",
                border: i === 0 ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: i === 0 ? "#e2d9f3" : "#94a3b8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 140,
                  }}>{note.title}</span>
                  <span style={{
                    fontSize: 9,
                    padding: "2px 6px",
                    borderRadius: 100,
                    background: `${note.color}22`,
                    color: note.color,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}>{note.tag}</span>
                </div>
                <p style={{
                  fontSize: 11,
                  color: "#334155",
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>{note.preview}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid #1e1e2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#e2d9f3" }}>
              Q2 Strategy Brief
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 100,
                background: "rgba(124,58,237,0.15)", color: "#a78bfa",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              }}>✦ Summarize</span>
              <span style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 100,
                background: "rgba(255,255,255,0.04)", color: "#64748b",
                border: "1px solid #1e1e2e",
                fontFamily: "'DM Sans', sans-serif",
              }}>Share</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Text area */}
            <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#64748b",
                marginBottom: 16,
              }}>May 14, 2026 · Work</div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#f8fafc",
                marginBottom: 14,
              }}>Q2 Strategy Brief</div>
              {[
                "Outline key OKRs for the next quarter and align the team on priorities before the planning session.",
                "Focus areas: product-led growth, retention improvements, and expanding the enterprise tier.",
                "Key metrics to move: activation rate (target 65%), monthly active writers (target 12k).",
              ].map((line, i) => (
                <p key={i} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.7,
                  marginBottom: 10,
                }}>{line}</p>
              ))}
              <div style={{
                marginTop: 16,
                height: 2,
                width: 60,
                background: "#7c3aed",
                borderRadius: 2,
                opacity: 0.8,
              }} />
            </div>

            {/* AI Panel */}
            <div style={{
              width: 180,
              borderLeft: "1px solid #1e1e2e",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "rgba(124,58,237,0.03)",
            }}>
              <div style={{
                fontSize: 11,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                color: "#a78bfa",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>✦ AI Panel</div>
              {[
                { label: "Summary", ready: true },
                { label: "Key points", ready: true },
                { label: "Action items", ready: false },
                { label: "Rewrite", ready: false },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: item.ready ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${item.ready ? "rgba(124,58,237,0.25)" : "#1e1e2e"}`,
                  fontSize: 11,
                  color: item.ready ? "#c4b5fd" : "#334155",
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <span>{item.ready ? "✓" : "○"}</span>
                  {item.label}
                </div>
              ))}
              <div style={{
                marginTop: 6,
                padding: "10px",
                borderRadius: 8,
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
                fontSize: 10,
                color: "#94a3b8",
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.6,
              }}>
                <div style={{ color: "#a78bfa", fontWeight: 600, marginBottom: 4 }}>AI Summary</div>
                Q2 focuses on growth, retention & enterprise expansion with clear KPIs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <style>{styles}</style>

      {/* NAVBAR */}
      <nav className="conjure-nav" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(8,8,16,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Logo */}
          <a href="/" style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 20,
            color: "#f8fafc",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ color: "#7c3aed" }}>✦</span>
            Conjure
          </a>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ display: "flex", gap: 36 }}>
            {["Features", "How it works", "Pricing"].map((label) => (
              <a key={label} href={`#${label.toLowerCase().replace(/ /g, "-")}`} className="nav-link">
                {label}
              </a>
            ))}
          </div>

          {/* Right */}
          <div className="nav-right" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/login" className="nav-link" style={{ fontWeight: 400 }}>Log in</a>
            <a href="/signup" className="btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>
              Get Started →
            </a>
            <div className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)}>
              <span /><span /><span />
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen ? (
          <div style={{
            background: "#0f0f1a",
            borderTop: "1px solid #1e1e2e",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            {["Features", "How it works", "Pricing"].map((label) => (
              <a key={label} href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                className="nav-link"
                onClick={() => setMobileOpen(false)}
                style={{ fontSize: 16 }}>
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </nav>

      {/* HERO */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px 80px",
        overflow: "hidden",
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1a0533 0%, #080810 65%)",
      }}>
        {/* Background blobs */}
        <div className="blob blob-main" />
        <div className="blob blob-secondary" />
        <div className="blob blob-tertiary" />
        <div className="noise-overlay" />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 820, width: "100%" }}>

          {/* Badge */}
          <div className="fade-up-0" style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: 100,
              fontSize: 13,
              color: "#c4b5fd",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              backdropFilter: "blur(8px)",
            }}>
              <span>✨</span>
              AI-Powered Notes Workspace
            </div>
          </div>

          {/* H1 */}
          <h1 className="hero-h1 fade-up-1" style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 80,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}>
            Your notes.
          </h1>
          <h1 className="hero-h1 fade-up-2" style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 80,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            marginBottom: 28,
          }}>
            <span className="gradient-text">Supercharged by AI.</span>
          </h1>

          {/* Subtext */}
          <p className="hero-sub fade-up-3" style={{
            fontSize: 19,
            color: "#64748b",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            lineHeight: 1.6,
            marginBottom: 40,
            maxWidth: 540,
            margin: "0 auto 40px",
          }}>
            Write faster. Think clearer. Let AI handle the rest.
          </p>

          {/* CTA buttons */}
          <div className="cta-row fade-up-4" style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            marginBottom: 40,
            flexWrap: "wrap",
          }}>
            <a href="/signup" className="btn-primary" style={{ fontSize: 16, padding: "15px 30px" }}>
              Start for free →
            </a>
            <a href="#demo" className="btn-ghost" style={{ fontSize: 16, padding: "15px 30px" }}>
              See a demo
            </a>
          </div>

          {/* Stat pills */}
          <div className="stats-row fade-up-5" style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            <div className="stat-pill">✦ AI Summaries</div>
            <div className="stat-pill">⚡ Auto-save</div>
            <div className="stat-pill">🔗 Public Sharing</div>
          </div>
        </div>

        {/* App Mockup */}
        <div style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 960,
          margin: "80px auto -100px",
          padding: "0 24px",
        }}>
          <AppMockup />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" style={{
        padding: "200px 24px 120px",
        maxWidth: 1200,
        margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
            <span className="section-tag">✦ Everything you need</span>
          </div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 52,
            letterSpacing: "-0.02em",
            color: "#f8fafc",
            marginBottom: 16,
            lineHeight: 1.1,
          }}>
            Built different.
          </h2>
          <p style={{
            color: "#64748b",
            fontSize: 17,
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: 480,
            margin: "0 auto",
            lineHeight: 1.6,
          }}>
            Every feature is designed to get out of your way so you can focus on what matters — your ideas.
          </p>
        </div>

        <div className="features-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{
                fontSize: 28,
                marginBottom: 18,
                width: 52,
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}>{f.icon}</div>
              <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "#f8fafc",
                marginBottom: 10,
              }}>{f.title}</h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#64748b",
                lineHeight: 1.7,
              }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: "40px 24px 120px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.08) 100%)",
          border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: 24,
          padding: "72px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 300,
            background: "radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 44,
              color: "#f8fafc",
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}>
              Start writing smarter today.
            </h2>
            <p style={{
              color: "#64748b",
              fontSize: 16,
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 36,
            }}>
              Join thousands of thinkers using Conjure to capture ideas at the speed of thought.
            </p>
            <a href="/signup" className="btn-primary" style={{ fontSize: 16, padding: "16px 36px" }}>
              Get started for free →
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid #1e1e2e",
        padding: "48px 24px",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}>
          <div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: "#f8fafc",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}>
              <span style={{ color: "#7c3aed" }}>✦</span> Conjure
            </div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#334155",
            }}>Built for thinkers.</p>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { label: "GitHub", href: "https://github.com" },
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ].map((link) => (
              <a key={link.label} href={link.href} className="footer-link">{link.label}</a>
            ))}
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "#334155",
          }}>© 2026 Conjure</p>
        </div>
      </footer>
    </>
  );
}
