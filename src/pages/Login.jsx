import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const G = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }

@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  15%     { transform: translateX(-8px); }
  30%     { transform: translateX(8px); }
  45%     { transform: translateX(-6px); }
  60%     { transform: translateX(6px); }
  75%     { transform: translateX(-3px); }
  90%     { transform: translateX(3px); }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pill-drop {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.card  { animation: fade-up 0.55s cubic-bezier(.22,1,.36,1) both; }
.shake { animation: shake 0.5s ease both; }

.field {
  width: 100%;
  padding: 11px 14px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  color: #0c0a1e;
  background: #fafafe;
  border: 1.5px solid #e8e6f4;
  border-radius: 10px;
  outline: none;
  transition: border-color .18s, box-shadow .18s;
}
.field:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124,58,237,.1);
  background: #fff;
}
.field.err { border-color: #ef4444; }
.field.err:focus { box-shadow: 0 0 0 3px rgba(239,68,68,.1); }

.submit-btn {
  width: 100%;
  padding: 13px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 600;
  color: #fff; background: #0c0a1e;
  border: none; border-radius: 100px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background .18s, box-shadow .2s, transform .15s;
  box-shadow: 0 4px 16px rgba(12,10,30,.22);
}
.submit-btn:hover:not(:disabled) {
  background: #1c1840;
  box-shadow: 0 6px 24px rgba(12,10,30,.3);
  transform: translateY(-1px);
}
.submit-btn:disabled { opacity: .65; cursor: not-allowed; transform: none; }

.pill-drop { animation: pill-drop 0.5s cubic-bezier(.22,1,.36,1) both; }
.nl {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 400;
  color: rgba(12,10,30,.52); text-decoration: none;
  transition: color .18s; padding: 7px 12px; border-radius: 100px;
}
.nl:hover { color: #0c0a1e; }
.nb {
  display: inline-flex; align-items: center;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13.5px; font-weight: 600;
  color: #fff; background: #0c0a1e;
  border: none; border-radius: 100px;
  padding: 9px 20px; cursor: pointer; text-decoration: none;
  transition: background .18s, box-shadow .18s;
  box-shadow: 0 2px 10px rgba(12,10,30,.22);
}
.nb:hover { background: #1c1840; }
`;

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const cardRef = useRef(null);

  function triggerShake() {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
    setTimeout(() => setShaking(false), 520);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.detail || "Something went wrong. Try again.";
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{G}</style>

      {/* floating pill nav */}
      <nav className="pill-drop" style={{
        position: "fixed", top: 16, left: "50%",
        transform: "translateX(-50%)", zIndex: 100,
        display: "flex", alignItems: "center",
        padding: "6px 6px 6px 20px", gap: 2,
        background: "rgba(255,255,255,.7)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        border: "1px solid rgba(255,255,255,.9)",
        borderRadius: 100,
        boxShadow: "0 2px 20px rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.95)",
        whiteSpace: "nowrap",
      }}>
        <Link to="/" style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontWeight: 800, fontSize: 16, color: "#0c0a1e",
          textDecoration: "none", letterSpacing: "-.025em",
          display: "flex", alignItems: "center", gap: 6, marginRight: 12,
        }}>
          <span style={{ color: "#7c3aed" }}>✦</span> Conjure
        </Link>
        <Link to="/login" className="nl">Sign in</Link>
        <Link to="/signup" className="nb">Get Started →</Link>
      </nav>

      {/* page */}
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px 24px 60px",
        backgroundImage: "url('/landing.png')",
        backgroundSize: "cover", backgroundPosition: "center top",
        position: "relative",
      }}>
        {/* bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 240,
          background: "linear-gradient(to bottom, transparent, #eef2ff)",
          pointerEvents: "none",
        }}/>

        {/* card */}
        <div
          ref={cardRef}
          className={`card${shaking ? " shake" : ""}`}
          style={{
            position: "relative", zIndex: 1,
            width: "100%", maxWidth: 420,
            background: "rgba(255,255,255,.82)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid rgba(255,255,255,.9)",
            borderRadius: 24,
            padding: "40px 36px",
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.95), 0 20px 60px rgba(12,10,30,.12), 0 4px 16px rgba(109,40,217,.06)",
          }}
        >
          {/* logo */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 800, fontSize: 22, color: "#0c0a1e",
              letterSpacing: "-.03em", marginBottom: 12,
            }}>
              <span style={{ color: "#7c3aed" }}>✦</span> Conjure
            </div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 700, fontSize: 22, color: "#0c0a1e",
              letterSpacing: "-.03em", marginBottom: 6,
            }}>Welcome back</h2>
            <p style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontSize: 14, color: "rgba(12,10,30,.45)", fontWeight: 400,
            }}>Sign in to your workspace</p>
          </div>

          {/* divider */}
          <div style={{ height: 1, background: "rgba(12,10,30,.07)", marginBottom: 28 }}/>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* email */}
            <div>
              <label style={{
                display: "block", marginBottom: 6,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontSize: 13, fontWeight: 600, color: "#0c0a1e",
              }}>Email</label>
              <input
                type="email"
                className="field"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                required
                autoComplete="email"
              />
            </div>

            {/* password */}
            <div>
              <label style={{
                display: "block", marginBottom: 6,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontSize: 13, fontWeight: 600, color: "#0c0a1e",
              }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  className="field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute", right: 13, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(12,10,30,.4)", display: "flex", padding: 2,
                  }}
                ><EyeIcon open={showPw} /></button>
              </div>
            </div>

            {/* error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,.07)",
                border: "1px solid rgba(239,68,68,.18)",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontSize: 13, color: "#dc2626", fontWeight: 500,
              }}>{error}</div>
            )}

            {/* submit */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,.3)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}/>
                  Signing in…
                </>
              ) : "Sign in →"}
            </button>
          </form>

          {/* switch link */}
          <p style={{
            textAlign: "center", marginTop: 24,
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontSize: 13.5, color: "rgba(12,10,30,.45)",
          }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{
              color: "#7c3aed", fontWeight: 600, textDecoration: "none",
            }}>Sign up →</Link>
          </p>
        </div>
      </div>
    </>
  );
}
