import { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";

const G = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Playfair+Display:ital,wght@1,800;1,900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: #eef2ff;
  color: #0c0a1e;
  font-family: 'Plus Jakarta Sans', sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #eef2ff; }
::-webkit-scrollbar-thumb { background: rgba(109,40,217,.15); border-radius: 4px; }

@keyframes float {
  0%,100% { transform: perspective(1400px) rotateX(3deg) translateY(0px); }
  50%      { transform: perspective(1400px) rotateX(3deg) translateY(-10px); }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pill-drop {
  from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes cursor-blink {
  0%,100% { opacity: 1; } 50% { opacity: 0; }
}

.pill-drop { animation: pill-drop 0.5s cubic-bezier(.22,1,.36,1) both; }
.r0 { animation: rise 0.65s cubic-bezier(.22,1,.36,1) 0.04s both; }
.r1 { animation: rise 0.65s cubic-bezier(.22,1,.36,1) 0.15s both; }
.r2 { animation: rise 0.65s cubic-bezier(.22,1,.36,1) 0.26s both; }
.r3 { animation: rise 0.65s cubic-bezier(.22,1,.36,1) 0.37s both; }
.r4 { animation: rise 0.65s cubic-bezier(.22,1,.36,1) 0.48s both; }
.r5 { animation: rise 0.65s cubic-bezier(.22,1,.36,1) 0.61s both; }

/* nav link */
.nl {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 400;
  color: rgba(12,10,30,.52);
  text-decoration: none;
  transition: color .18s;
  white-space: nowrap;
  padding: 7px 12px;
  border-radius: 100px;
}
.nl:hover { color: #0c0a1e; }

/* nav dark button */
.nb {
  display: inline-flex; align-items: center;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13.5px; font-weight: 600;
  color: #fff; background: #0c0a1e;
  border: none; border-radius: 100px;
  padding: 9px 20px; cursor: pointer; text-decoration: none;
  transition: background .18s, box-shadow .18s, transform .15s;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(12,10,30,.22);
}
.nb:hover {
  background: #1c1840;
  box-shadow: 0 4px 18px rgba(12,10,30,.3);
  transform: translateY(-1px);
}

/* hero primary */
.hp {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 600;
  color: #fff; background: #0c0a1e;
  border: none; border-radius: 100px;
  padding: 14px 30px; cursor: pointer; text-decoration: none;
  transition: background .2s, box-shadow .2s, transform .15s;
  box-shadow: 0 4px 20px rgba(12,10,30,.25);
}
.hp:hover { background: #1c1840; box-shadow: 0 8px 28px rgba(12,10,30,.32); transform: translateY(-2px); }

/* hero ghost */
.hg {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 500;
  color: rgba(12,10,30,.68);
  background: rgba(255,255,255,.5);
  border: 1px solid rgba(255,255,255,.82);
  border-radius: 100px;
  padding: 14px 30px; cursor: pointer; text-decoration: none;
  backdrop-filter: blur(14px);
  transition: background .2s, color .2s, transform .15s;
}
.hg:hover { background: rgba(255,255,255,.72); color: #0c0a1e; transform: translateY(-2px); }

/* liquid glass feature card */
.fc {
  background: rgba(255,255,255,.38);
  border: 1px solid rgba(255,255,255,.7);
  border-radius: 20px;
  padding: 32px 28px;
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  box-shadow:
    inset 0 1.5px 0 rgba(255,255,255,.9),
    inset 0 -1px 0 rgba(109,40,217,.03),
    0 2px 4px rgba(0,0,0,.03),
    0 8px 24px rgba(109,40,217,.05);
  transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s, background .25s;
}
.fc:hover {
  transform: translateY(-4px);
  background: rgba(255,255,255,.52);
  box-shadow:
    inset 0 1.5px 0 rgba(255,255,255,.95),
    0 8px 16px rgba(0,0,0,.04),
    0 24px 48px rgba(109,40,217,.09);
}


@media (max-width: 860px) {
  .desk { display: none !important; }
  .ham  { display: flex !important; }
}
@media (max-width: 680px) {
  .hh { font-size: 48px !important; }
  .fg { grid-template-columns: 1fr !important; }
  .cr { flex-direction: column !important; align-items: center !important; }
  .cr a { width: 200px !important; justify-content: center !important; }
  .pp { flex-wrap: wrap !important; justify-content: center !important; }
}
@media (max-width: 420px) { .hh { font-size: 36px !important; } }
`;

/* ── notes list ── */
const notes = [
  { title: "2026 Annual Strategy", time: "Just now",  tag: "Work",    c: "#7c3aed" },
  { title: "Deep Work — Notes",    time: "2h ago",    tag: "Reading", c: "#0ea5e9" },
  { title: "Product Roadmap Q3",   time: "Yesterday", tag: "Work",    c: "#7c3aed" },
  { title: "Spain Trip Ideas",     time: "3d ago",    tag: "Life",    c: "#16a34a" },
];

/* ── light-themed mockup ── */
function Mockup() {
  return (
    <div style={{ display: "flex", height: 490, background: "#fff", overflow: "hidden" }}>

      {/* icon rail */}
      <div style={{
        width: 52, background: "#faf9ff",
        borderRight: "1px solid #f0eef8",
        display: "flex", flexDirection: "column",
        alignItems: "center", paddingTop: 18, gap: 5,
      }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontWeight: 800, fontSize: 15, color: "#7c3aed", marginBottom: 14,
        }}>✦</div>
        {[{i:"⊞",a:false},{i:"☰",a:true},{i:"◈",a:false},{i:"⊕",a:false}].map((x,k)=>(
          <div key={k} style={{
            width: 34, height: 34,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8,
            background: x.a ? "rgba(124,58,237,.1)" : "transparent",
            color: x.a ? "#7c3aed" : "#d4d0e8", fontSize: 14,
          }}>{x.i}</div>
        ))}
      </div>

      {/* sidebar */}
      <div style={{
        width: 218, background: "#fdfcff",
        borderRight: "1px solid #f0eef8",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "13px 11px 9px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#f4f2fc", border: "1px solid #ebe8f8",
            borderRadius: 8, padding: "7px 10px",
            color: "#c0bcd8", fontSize: 12,
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search notes…
          </div>
        </div>

        <div style={{
          padding: "3px 13px 8px",
          fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase",
          color: "#c8c4e0", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
        }}>Recent</div>

        <div style={{ flex: 1, padding: "0 5px" }}>
          {notes.map((n, i) => (
            <div key={i} style={{
              padding: "9px 10px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
              background: i===0 ? "rgba(124,58,237,.07)" : "transparent",
              border: `1px solid ${i===0 ? "rgba(124,58,237,.14)" : "transparent"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: n.c, flexShrink: 0 }}/>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  fontSize: 12, fontWeight: i===0 ? 600 : 500,
                  color: i===0 ? "#2a0f60" : "#9090b8",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 138,
                }}>{n.title}</span>
              </div>
              <div style={{ display: "flex", gap: 6, paddingLeft: 12 }}>
                <span style={{ fontSize: 10, color: "#ccc8e0", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{n.time}</span>
                <span style={{
                  fontSize: 9.5, padding: "1.5px 6px", borderRadius: 4,
                  background: `${n.c}14`, color: n.c,
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600,
                }}>{n.tag}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "9px 9px 13px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px", borderRadius: 9, cursor: "pointer",
            background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.13)",
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#7c3aed",
          }}>+ New note</div>
        </div>
      </div>

      {/* editor */}
      <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{
          height: 46, borderBottom: "1px solid #f0eef8",
          display: "flex", alignItems: "center",
          padding: "0 20px", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["B","I","—"].map((t,i)=>(
              <div key={i} style={{
                width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 5, fontSize: 12, color: "#ccc8e0",
                fontWeight: t==="B"?700:400, fontStyle: t==="I"?"italic":"normal",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}>{t}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              background: "rgba(124,58,237,.07)", border: "1px solid rgba(124,58,237,.16)",
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontSize: 11.5, fontWeight: 600, color: "#7c3aed",
            }}>✦ Summarize</div>
            <div style={{
              padding: "5px 12px", borderRadius: 8,
              border: "1px solid #ece8f8", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11.5, color: "#c0bcd8",
            }}>Share</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "22px 26px", overflowY: "auto" }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11,
            color: "#c8c4e0", marginBottom: 16,
            display: "flex", gap: 5, alignItems: "center",
          }}>
            Workspace <span>›</span> Work <span>›</span>
            <span style={{ color: "#9890c0" }}>2026 Annual Strategy</span>
          </div>

          <div style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 22,
            color: "#0c0a1e", marginBottom: 18, lineHeight: 1.22, letterSpacing: "-.025em",
          }}>
            2026 Annual Strategy
            <span style={{
              display: "inline-block", width: 2, height: "1.1em",
              background: "#7c3aed", marginLeft: 2, verticalAlign: "text-bottom",
              animation: "cursor-blink 1.1s ease-in-out infinite",
            }}/>
          </div>

          {[
            {t:"h",v:"North Star"},
            {t:"p",v:"Reach 50k monthly active writers by Q4. Focus on product-led growth, reduce time-to-value under 3 minutes."},
            {t:"h",v:"Key Initiatives"},
            {t:"li",v:"AI onboarding — personalised setup flow"},
            {t:"li",v:"Public API — enable integrations ecosystem"},
            {t:"li",v:"Mobile apps — iOS + Android native"},
          ].map((b,i) =>
            b.t==="h" ? (
              <div key={i} style={{
                fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
                fontSize:10.5, color:"#b8b4d0", letterSpacing:".09em",
                textTransform:"uppercase", margin:"16px 0 8px",
              }}>{b.v}</div>
            ) : b.t==="li" ? (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:"#d8d4ec", marginTop:6.5, flexShrink:0 }}/>
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:400, color:"#7870a8", lineHeight:1.65 }}>{b.v}</span>
              </div>
            ) : (
              <p key={i} style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, color:"#8880b8", lineHeight:1.7, marginBottom:9 }}>{b.v}</p>
            )
          )}
        </div>
      </div>

      {/* AI panel */}
      <div style={{
        width: 196, background: "#faf9ff",
        borderLeft: "1px solid #f0eef8",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "13px 13px 9px", borderBottom: "1px solid #f0eef8",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ color: "#7c3aed", fontSize: 12 }}>✦</span>
          <span style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
            fontSize:10.5, color:"#7c3aed", letterSpacing:".07em", textTransform:"uppercase",
          }}>AI Assistant</span>
        </div>

        <div style={{ flex:1, padding:"11px 10px", display:"flex", flexDirection:"column", gap:7 }}>
          <div style={{
            background:"rgba(124,58,237,.05)", border:"1px solid rgba(124,58,237,.11)",
            borderRadius:10, padding:"10px 11px",
          }}>
            <div style={{
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:700,
              color:"#7c3aed", marginBottom:5, letterSpacing:".06em",
            }}>SUMMARY</div>
            <p style={{
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11.5, fontWeight:400,
              color:"#8878b8", lineHeight:1.6,
            }}>Targeting 50k MAW via AI onboarding, public API, and mobile.</p>
          </div>

          {[
            {l:"Key actions",d:true},{l:"Rewrite intro",d:true},
            {l:"Suggest tags",d:false},{l:"Translate",d:false},
          ].map((it,i)=>(
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:7,
              padding:"7px 10px", borderRadius:8,
              background: it.d ? "rgba(124,58,237,.05)" : "transparent",
              border:`1px solid ${it.d ? "rgba(124,58,237,.12)" : "#ece8f8"}`,
              cursor:"pointer",
            }}>
              <div style={{
                width:14, height:14, borderRadius:4, flexShrink:0,
                background: it.d ? "#7c3aed" : "transparent",
                border:`1px solid ${it.d ? "#7c3aed" : "#d8d4ec"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {it.d && (
                  <svg width="8" height="6" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 12 9">
                    <path d="M1 4.5L4.5 8 11 1"/>
                  </svg>
                )}
              </div>
              <span style={{
                fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11.5, fontWeight:400,
                color: it.d ? "#6858a8" : "#c8c4e0",
              }}>{it.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── feature icon ── */
const Fi = ({d,size=16}) => (
  <svg width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    {d.map((p,i)=><path key={i} d={p}/>)}
  </svg>
);

const feats = [
  {d:["M12 2L2 7l10 5 10-5-10-5z","M2 17l10 5 10-5","M2 12l10 5 10-5"],t:"AI Summaries",b:"One click. Your note distilled to the essentials — key points, actions, decisions."},
  {d:["M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z","M13 2v7h7"],t:"Smart Auto-save",b:"Every word saved the instant you type it. Ninety days of version history."},
  {d:["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71","M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"],t:"Public Sharing",b:"A shareable page in one click. Zero friction for your readers."},
  {d:["M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z","M7 7h.01"],t:"Tags & Filters",b:"Tag anything, filter everything. Find any note in under a second."},
  {d:["M18 20V10","M12 20V4","M6 20v-6"],t:"Insights",b:"Writing streaks, word counts, focus time. Track the habit, not just the output."},
  {d:["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],t:"Secure by default",b:"JWT auth, encrypted at rest. Your notes are yours — no asterisks."},
];

/* ─────────────────────────── LANDING ─────────────────────────── */
function UserPill({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const initial = user.name.trim()[0].toUpperCase();
  const firstName = user.name.trim().split(" ")[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: open ? "rgba(124,58,237,.13)" : "rgba(124,58,237,.08)",
          border: "1px solid rgba(124,58,237,.2)",
          borderRadius: 100, padding: "5px 14px 5px 5px",
          cursor: "pointer", outline: "none",
          transition: "background .15s",
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "#7c3aed", color: "#fff", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 12, fontWeight: 700,
        }}>{initial}</div>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13.5, fontWeight: 600, color: "#0c0a1e",
          whiteSpace: "nowrap",
        }}>{firstName}</span>
        <svg width="10" height="10" fill="none" stroke="rgba(12,10,30,.35)"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
          style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          background: "rgba(255,255,255,.92)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          border: "1px solid rgba(255,255,255,.9)",
          borderRadius: 16, padding: 6,
          boxShadow: "0 8px 32px rgba(12,10,30,.13), inset 0 1.5px 0 rgba(255,255,255,.95)",
          minWidth: 180, zIndex: 200,
        }}>
          <div style={{
            padding: "10px 14px 10px",
            borderBottom: "1px solid rgba(12,10,30,.06)",
            marginBottom: 5,
          }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13.5, fontWeight: 700, color: "#0c0a1e", marginBottom: 2,
            }}>{user.name}</div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11.5, color: "rgba(12,10,30,.38)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 156,
            }}>{user.email}</div>
          </div>
          <button
            onClick={() => { setOpen(false); logout(); }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.07)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
            style={{
              width: "100%", padding: "9px 14px",
              background: "none", border: "none", borderRadius: 10,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 9,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, fontWeight: 500, color: "#dc2626",
              textAlign: "left", transition: "background .15s",
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mob, setMob] = useState(false);
  useEffect(()=>{
    document.body.style.overflow = mob ? "hidden" : "";
    return ()=>{ document.body.style.overflow=""; };
  },[mob]);

  return (
    <>
      <style>{G}</style>

      {/* ══ FLOATING PILL NAV ══ */}
      <nav className="pill-drop" style={{
        position: "fixed",
        top: 16, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex", alignItems: "center",
        padding: "6px 6px 6px 20px",
        background: "rgba(255,255,255,.7)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        border: "1px solid rgba(255,255,255,.9)",
        borderRadius: 100,
        boxShadow: "0 2px 20px rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.95)",
        whiteSpace: "nowrap",
        gap: 2,
      }}>
        {/* logo */}
        <a href="/" style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontWeight: 800, fontSize: 16, color: "#0c0a1e",
          textDecoration: "none", letterSpacing: "-.025em",
          display: "flex", alignItems: "center", gap: 6, marginRight: 8,
        }}>
          Conjure
        </a>

        <div className="desk" style={{ display: "flex" }}>
          <a href="#features" className="nl">Features</a>
        </div>

        <div className="desk" style={{
          width: 1, height: 18, background: "rgba(12,10,30,.09)",
          margin: "0 6px", flexShrink: 0,
        }}/>

        <div className="desk" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isAuthenticated ? (
            <UserPill user={user} logout={logout} />
          ) : (
            <>
              <a href="/login" className="nl">Sign in</a>
              <a href="/signup" className="nb">Get Started →</a>
            </>
          )}
        </div>

        {/* hamburger */}
        <button className="ham" onClick={()=>setMob(!mob)} style={{
          display: "none", flexDirection: "column", gap: 5,
          background: "none", border: "none", cursor: "pointer", padding: "8px 14px 8px 8px",
        }}>
          {[0,1,2].map(i=>(
            <span key={i} style={{
              display:"block", width:20, height:1.5,
              background:"rgba(12,10,30,.45)", borderRadius:2,
            }}/>
          ))}
        </button>
      </nav>

      {/* mobile overlay */}
      {mob ? (
        <div style={{
          position:"fixed", inset:0, zIndex:99,
          background:"rgba(255,255,255,.94)", backdropFilter:"blur(20px)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:28,
        }}>
          {["Features","How it works"].map(l=>(
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`}
              onClick={()=>setMob(false)} style={{
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:28, fontWeight:800, color:"#0c0a1e", textDecoration:"none",
              }}>{l}</a>
          ))}
          <div style={{ display:"flex", gap:12, marginTop:12 }}>
            {isAuthenticated ? (
              <button onClick={() => { setMob(false); logout(); }} className="hp" style={{ padding:"12px 26px", background:"#dc2626" }}>
                Sign out
              </button>
            ) : (
              <>
                <a href="/login"  className="hg" style={{ padding:"12px 26px" }}>Sign in</a>
                <a href="/signup" className="hp" style={{ padding:"12px 26px" }}>Get Started →</a>
              </>
            )}
          </div>
          <button onClick={()=>setMob(false)} style={{
            position:"absolute", top:22, right:22,
            background:"none", border:"none", fontSize:22,
            color:"rgba(12,10,30,.35)", cursor:"pointer",
          }}>✕</button>
        </div>
      ) : null}

      {/* ══ HERO ══ */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 24px 60px",
        backgroundImage: "url('/landing.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundColor: "#c8d8f0",
      }}>
        {/* barely-there tint */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "rgba(238,234,255,.07)",
          pointerEvents: "none",
        }}/>
        {/* bottom fade — sky dissolves into features bg */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 320, zIndex: 0, pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent 0%, #eef2ff 100%)",
        }}/>

        <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:860, width:"100%" }}>


          {/* headline — dark, clean, no gradient */}
          <h1 className="hh r1" style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif",
            fontSize:84, fontWeight:800, lineHeight:1.0,
            letterSpacing:"-.045em", marginBottom:4,
            color:"#0c0a1e",
          }}>Your notes.</h1>
          <h1 className="hh r2" style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif",
            fontSize:84, fontWeight:800, lineHeight:1.0,
            letterSpacing:"-.045em", marginBottom:28,
            color:"#0c0a1e",
          }}>
            <span style={{
              fontFamily:"'Playfair Display',serif",
              fontStyle:"italic",
              fontWeight:900,
              letterSpacing:"-.02em",
              marginRight:"0.18em",
            }}>Supercharged</span>
            {" by AI."}
          </h1>

          <p className="r3" style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif",
            fontSize:18, fontWeight:400,
            color:"rgba(12,10,30,.48)", lineHeight:1.65, marginBottom:40,
          }}>
            Write faster. Think clearer. Let AI handle the rest.
          </p>

          {/* CTAs */}
          <div className="cr r4" style={{
            display:"flex", gap:12, justifyContent:"center", marginBottom:46,
          }}>
            <a href={isAuthenticated ? "/app" : "/signup"} className="hp">
              {isAuthenticated ? "Open workspace →" : "Start for free →"}
            </a>
          </div>

          {/* pills */}
          <div className="pp r5" style={{ display:"flex", gap:8, justifyContent:"center" }}>
            {["AI Summaries","Auto-save","Public sharing","Encrypted"].map(p=>(
              <span key={p} style={{
                display:"inline-flex", alignItems:"center",
                padding:"7px 15px",
                background:"rgba(255,255,255,.46)",
                border:"1px solid rgba(255,255,255,.78)",
                borderRadius:100, backdropFilter:"blur(12px)",
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:12.5, fontWeight:500,
                color:"rgba(12,10,30,.44)",
                boxShadow:"inset 0 1px 0 rgba(255,255,255,.8)",
              }}>{p}</span>
            ))}
          </div>
        </div>

        {/* ── liquid glass mockup card ── */}
        <div id="demo" style={{
          position:"relative", zIndex:1,
          width:"100%", maxWidth:1040,
          margin:"62px auto -180px",
          padding:"0 20px",
          animation:"float 6s ease-in-out infinite",
          animationDelay:"1s",
        }}>
          <div style={{
            borderRadius:22,
            background:"rgba(255,255,255,.52)",
            backdropFilter:"blur(32px) saturate(200%)",
            WebkitBackdropFilter:"blur(32px) saturate(200%)",
            border:"1px solid rgba(255,255,255,.88)",
            boxShadow:`
              inset 0 2px 0 rgba(255,255,255,.95),
              inset 0 -1px 0 rgba(200,195,230,.12),
              0 40px 80px rgba(12,10,30,.13),
              0 8px 32px rgba(109,40,217,.07)
            `,
            overflow:"hidden",
          }}>
            {/* macOS title bar */}
            <div style={{
              height:40,
              background:"rgba(250,249,255,.75)",
              borderBottom:"1px solid rgba(220,216,240,.4)",
              display:"flex", alignItems:"center",
              padding:"0 16px",
            }}>
              <div style={{ display:"flex", gap:7 }}>
                {["#ff5f57","#febc2e","#28c840"].map((c,i)=>(
                  <div key={i} style={{
                    width:11, height:11, borderRadius:"50%",
                    background:c, boxShadow:"0 0 0 0.5px rgba(0,0,0,.1)",
                  }}/>
                ))}
              </div>
              <div style={{
                flex:1, display:"flex", justifyContent:"center",
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:12, fontWeight:500, color:"rgba(12,10,30,.3)",
                gap:5,
              }}>
                <span style={{ color:"#7c3aed" }}>✦</span>
                conjure.app — 2026 Annual Strategy
              </div>
            </div>
            <Mockup />
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" style={{
        padding:"260px 24px 100px",
        background:"linear-gradient(180deg, #eef2ff 0%, #f4f2ff 100%)",
      }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:54 }}>
            <span style={{
              display:"inline-flex", alignItems:"center",
              padding:"6px 16px",
              background:"rgba(124,58,237,.07)", border:"1px solid rgba(124,58,237,.14)",
              borderRadius:100,
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              fontSize:11, fontWeight:700, color:"#7c3aed",
              letterSpacing:".08em", textTransform:"uppercase", marginBottom:20,
            }}>Everything you need</span>

            <h2 style={{
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              fontSize:52, fontWeight:800, letterSpacing:"-.04em",
              color:"#0c0a1e", marginBottom:14, lineHeight:1.08,
            }}>Built for the way<br/>you actually think.</h2>

            <p style={{
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              fontSize:16, fontWeight:400,
              color:"rgba(12,10,30,.42)", maxWidth:440, margin:"0 auto", lineHeight:1.65,
            }}>
              No bloat. No configuration. Just you, your notes, and AI that stays quiet until you need it.
            </p>
          </div>

          <div className="fg" style={{
            display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14,
          }}>
            {feats.map((f,i)=>(
              <div key={i} className="fc">
                {/* bare icon — no box */}
                <div style={{ color:"rgba(109,40,217,.55)", marginBottom:20 }}>
                  <Fi d={f.d} size={20} />
                </div>
                <h3 style={{
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  fontSize:16, fontWeight:700, letterSpacing:"-.025em",
                  color:"#0c0a1e", marginBottom:9,
                }}>{f.t}</h3>
                <p style={{
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  fontSize:14, fontWeight:400,
                  color:"rgba(12,10,30,.42)", lineHeight:1.72,
                }}>{f.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section style={{
        padding:"0 24px 100px",
        background:"linear-gradient(180deg,#f4f2ff 0%,#eef2ff 100%)",
      }}>
        <div style={{
          maxWidth:1120, margin:"0 auto",
          borderRadius:24, overflow:"hidden", position:"relative",
          backgroundImage:"url('/landing.png')",
          backgroundSize:"cover", backgroundPosition:"center",
        }}>
          <div style={{
            background:"rgba(238,232,255,.32)",
            padding:"90px 40px", textAlign:"center",
          }}>
            <div style={{
              display:"inline-block",
              background:"rgba(255,255,255,.6)",
              backdropFilter:"blur(26px) saturate(200%)",
              WebkitBackdropFilter:"blur(26px) saturate(200%)",
              border:"1px solid rgba(255,255,255,.88)",
              borderRadius:22, padding:"52px 72px",
              boxShadow:"inset 0 2px 0 rgba(255,255,255,.95), 0 20px 60px rgba(12,10,30,.09)",
            }}>
              <h2 style={{
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:40, fontWeight:800, letterSpacing:"-.04em",
                color:"#0c0a1e", marginBottom:12,
              }}>Start writing smarter today.</h2>
              <a href={isAuthenticated ? "/app" : "/signup"} className="hp">
                {isAuthenticated ? "Open workspace →" : "Get started for free →"}
              </a>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
