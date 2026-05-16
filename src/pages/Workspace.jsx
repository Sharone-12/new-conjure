import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`;

const C = {
  dark:    "#0c0a1e",
  violet:  "#7c3aed",
  bg:      "#eef2ff",
  muted:   "rgba(12,10,30,.42)",
  border:  "rgba(12,10,30,.07)",
};

/* Landing's exact .fc card style */
const fc = (extra = {}) => ({
  background: "rgba(255,255,255,.52)",
  backdropFilter: "blur(28px) saturate(180%)",
  WebkitBackdropFilter: "blur(28px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.82)",
  boxShadow:
    "inset 0 1.5px 0 rgba(255,255,255,.95), inset 0 -1px 0 rgba(109,40,217,.03), 0 2px 4px rgba(0,0,0,.03), 0 8px 24px rgba(109,40,217,.06)",
  ...extra,
});

/* Slightly deeper glass for interactive elements */
const glass = (alpha = ".72", blur = 20) => ({
  background: `rgba(255,255,255,${alpha})`,
  backdropFilter: `blur(${blur}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
  border: "1px solid rgba(255,255,255,.88)",
  boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.95), 0 2px 12px rgba(109,40,217,.05)",
});

const TAG_PAL = [
  { bg:"#f3f0ff", text:"#7c3aed", border:"#ddd0ff" },
  { bg:"#eff6ff", text:"#2563eb", border:"#bfdbfe" },
  { bg:"#f0fdf4", text:"#16a34a", border:"#bbf7d0" },
  { bg:"#fff7ed", text:"#ea580c", border:"#fed7aa" },
  { bg:"#fdf2f8", text:"#db2777", border:"#fbcfe8" },
];
const ACCENTS = ["#7c3aed","#2563eb","#16a34a","#ea580c","#db2777"];
function tagColor(t){ const n=[...(t||"")].reduce((a,c)=>a+c.charCodeAt(0),0); return TAG_PAL[n%TAG_PAL.length]; }
function tagAccent(t){ const n=[...(t||"")].reduce((a,c)=>a+c.charCodeAt(0),0); return ACCENTS[n%ACCENTS.length]; }
function rel(dt){
  if(!dt) return "";
  const ms=Date.now()-new Date(dt.endsWith("Z")?dt:dt+"Z").getTime();
  const m=Math.floor(ms/60000),h=Math.floor(ms/3600000),d=Math.floor(ms/86400000);
  if(m<1) return "Just now"; if(m<60) return `${m}m ago`;
  if(h<24) return `${h}h ago`; if(d===1) return "Yesterday";
  return `${d}d ago`;
}

/* SVG icon wrapper */
function Ic({ size=16, stroke="currentColor", sw=1.8, style={}, children }){
  return(
    <svg width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={style}>
      {children}
    </svg>
  );
}
const I = {
  note:    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  archive: <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></>,
  trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
  share:   <><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>,
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
  logout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  tag:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  chevron: <><path d="M6 9l6 6 6-6"/></>,
  menu:    <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
};

/* ── Toasts ─────────────────────────────────────────────────────────────────── */
function Toasts({ toasts, dismiss }){
  const cols = { error:["rgba(254,242,242,.95)","rgba(239,68,68,.2)","#dc2626"], success:["rgba(240,253,244,.95)","rgba(22,163,74,.2)","#16a34a"], info:["rgba(243,240,255,.95)","rgba(124,58,237,.2)",C.violet] };
  return(
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t=>{
        const [bg,br,tx]=cols[t.type]||cols.info;
        return(
          <div key={t.id} onClick={()=>dismiss(t.id)} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"12px 18px", borderRadius:14,
            background:bg, border:`1px solid ${br}`, color:tx,
            backdropFilter:"blur(20px)",
            boxShadow:"0 8px 28px rgba(12,10,30,.08)",
            fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500,
            cursor:"pointer", minWidth:240, maxWidth:340,
            animation:"rise .35s cubic-bezier(.22,1,.36,1) both",
          }}>
            <Ic size={14} stroke={tx} sw={2.5}>{I.check}</Ic>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}

/* ── Delete Modal ────────────────────────────────────────────────────────────── */
function DeleteModal({ title, onConfirm, onCancel }){
  return(
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      background:"rgba(12,10,30,.38)", backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        ...fc(), borderRadius:24, padding:"40px 44px", width:400,
        fontFamily:"'DM Sans',sans-serif",
        animation:"rise .3s cubic-bezier(.22,1,.36,1) both",
      }}>
        <div style={{
          width:52, height:52, borderRadius:16,
          background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.16)",
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px",
        }}>
          <Ic size={22} stroke="#ef4444" sw={2}>{I.trash}</Ic>
        </div>
        <h3 style={{ fontSize:18, fontWeight:800, color:C.dark, textAlign:"center", marginBottom:8, letterSpacing:"-.03em" }}>Delete note?</h3>
        <p style={{ fontSize:13.5, color:C.muted, textAlign:"center", marginBottom:30, lineHeight:1.65 }}>
          "{title||"Untitled"}" will be permanently removed.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:"12px", borderRadius:100,
            border:"1.5px solid rgba(12,10,30,.1)", background:"rgba(255,255,255,.6)",
            fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600,
            color:"rgba(12,10,30,.5)", cursor:"pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:"12px", borderRadius:100, border:"none",
            background:"#ef4444", color:"#fff",
            fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700,
            cursor:"pointer", boxShadow:"0 4px 14px rgba(239,68,68,.35)",
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────────── */
function Sidebar({ user, notes, showArchived, setShowArchived, activeTag, setActiveTag, onNewNote, onLogout }){
  const navigate = useNavigate();
  const allTags = [...new Set(notes.flatMap(n=>n.tags||[]))].sort();
  const navItems = [
    { icon:I.note,    label:"Notes",    archived:false },
    { icon:I.archive, label:"Archived", archived:true  },
  ];

  const dashIcon = <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>;

  return(
    <div style={{
      width:228, flexShrink:0, height:"100vh",
      ...fc(),
      borderRight:"1px solid rgba(255,255,255,.7)",
      borderRadius:0,
      display:"flex", flexDirection:"column",
      fontFamily:"'DM Sans',sans-serif",
      position:"relative", zIndex:2,
    }}>
      {/* Logo */}
      <div style={{ padding:"22px 18px 16px", borderBottom:"1px solid rgba(12,10,30,.06)" }}>
        <button onClick={()=>navigate("/")} style={{
          display:"flex", alignItems:"center", gap:7, marginBottom:18,
          background:"none", border:"none", cursor:"pointer", padding:0,
        }}>
          <span style={{ color:C.violet, fontSize:15, fontWeight:800 }}>✦</span>
          <span style={{ fontWeight:800, fontSize:15.5, color:C.dark, letterSpacing:"-.03em", fontFamily:"'DM Sans',sans-serif" }}>Conjure</span>
        </button>

        {user && (
          <div style={{
            display:"flex", alignItems:"center", gap:9,
            padding:"8px 10px",
            background:"rgba(124,58,237,.06)",
            border:"1px solid rgba(124,58,237,.1)",
            borderRadius:12,
          }}>
            <div style={{
              width:28, height:28, borderRadius:"50%", flexShrink:0,
              background:"linear-gradient(135deg,#7c3aed,#a855f7)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:700, color:"#fff",
            }}>{(user.name||"?")[0].toUpperCase()}</div>
            <div style={{ overflow:"hidden", flex:1 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:C.dark, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", letterSpacing:"-.01em" }}>{user.name}</div>
              <div style={{ fontSize:10.5, color:"rgba(124,58,237,.55)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontWeight:500 }}>{user.email}</div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ padding:"10px 8px 2px" }}>
        {/* Dashboard link */}
        <button onClick={()=>navigate("/dashboard")} style={{
          width:"100%", display:"flex", alignItems:"center", gap:9,
          padding:"9px 11px", borderRadius:10, border:"none", cursor:"pointer",
          background:"transparent", color:"rgba(12,10,30,.45)",
          fontFamily:"'DM Sans',sans-serif",
          fontSize:13.5, fontWeight:500,
          textAlign:"left", transition:"all .15s", marginBottom:2,
          borderLeft:"2px solid transparent",
        }}
          onMouseEnter={e=>{ e.currentTarget.style.background="rgba(124,58,237,.07)"; e.currentTarget.style.color=C.violet; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(12,10,30,.45)"; }}
        >
          <Ic size={15} stroke="currentColor" sw={1.8}>{dashIcon}</Ic>
          Dashboard
        </button>

        {navItems.map(item=>{
          const active = showArchived===item.archived;
          return(
            <button key={item.label} onClick={()=>setShowArchived(item.archived)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:9,
              padding:"9px 11px", borderRadius:10, border:"none", cursor:"pointer",
              background: active ? "rgba(124,58,237,.1)" : "transparent",
              color: active ? C.violet : "rgba(12,10,30,.45)",
              fontFamily:"'DM Sans',sans-serif",
              fontSize:13.5, fontWeight: active ? 700 : 500,
              textAlign:"left", transition:"all .15s", marginBottom:2,
              borderLeft: active ? `2px solid ${C.violet}` : "2px solid transparent",
            }}>
              <Ic size={15} stroke="currentColor" sw={active?2.2:1.8}>{item.icon}</Ic>
              {item.label}
              <span style={{
                marginLeft:"auto", fontSize:11, fontWeight:600,
                color: active ? C.violet : "rgba(12,10,30,.22)",
                background: active ? "rgba(124,58,237,.1)" : "rgba(12,10,30,.05)",
                padding:"1.5px 7px", borderRadius:100,
              }}>
                {notes.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tags */}
      {allTags.length>0 && (
        <div style={{ padding:"14px 8px 2px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"0 11px", marginBottom:8 }}>
            <Ic size={10} stroke="rgba(12,10,30,.25)" sw={2}>{I.tag}</Ic>
            <span style={{ fontSize:9.5, fontWeight:700, color:"rgba(12,10,30,.25)", letterSpacing:".12em", textTransform:"uppercase" }}>Tags</span>
          </div>
          {allTags.map(tag=>{
            const isA=activeTag===tag;
            return(
              <button key={tag} onClick={()=>setActiveTag(isA?null:tag)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:8,
                padding:"7px 11px", borderRadius:9, border:"none", cursor:"pointer",
                background: isA ? "rgba(124,58,237,.09)" : "transparent",
                fontFamily:"'DM Sans',sans-serif",
                fontSize:13, fontWeight: isA ? 600 : 400,
                color: isA ? C.violet : "rgba(12,10,30,.45)",
                textAlign:"left", transition:"all .15s", marginBottom:1,
              }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:tagAccent(tag), flexShrink:0 }}/>
                {tag}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ flex:1 }}/>

      {/* Bottom actions */}
      <div style={{ padding:"12px 10px 18px", borderTop:"1px solid rgba(12,10,30,.06)" }}>
        {/* New Note — landing's dark pill style */}
        <button onClick={onNewNote} style={{
          width:"100%", padding:"11px 16px", borderRadius:100,
          border:"none", background:C.dark, color:"#fff",
          fontFamily:"'DM Sans',sans-serif",
          fontSize:13.5, fontWeight:700, cursor:"pointer", marginBottom:7,
          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          boxShadow:"0 4px 20px rgba(12,10,30,.22)",
          letterSpacing:"-.01em",
          transition:"background .18s, box-shadow .18s, transform .15s",
        }}
          onMouseEnter={e=>{ e.currentTarget.style.background="#1c1840"; e.currentTarget.style.boxShadow="0 6px 24px rgba(12,10,30,.3)"; e.currentTarget.style.transform="translateY(-1px)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background=C.dark; e.currentTarget.style.boxShadow="0 4px 20px rgba(12,10,30,.22)"; e.currentTarget.style.transform="none"; }}
        >
          <Ic size={14} stroke="#fff" sw={2.8}>{I.plus}</Ic>
          New Note
        </button>
        <button onClick={onLogout} style={{
          width:"100%", padding:"9px", borderRadius:100,
          border:"1px solid rgba(12,10,30,.1)", background:"transparent",
          color:"rgba(12,10,30,.38)", fontFamily:"'DM Sans',sans-serif",
          fontSize:12.5, fontWeight:500, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          transition:"all .18s",
        }}
          onMouseEnter={e=>{ e.currentTarget.style.color="#dc2626"; e.currentTarget.style.borderColor="rgba(239,68,68,.25)"; e.currentTarget.style.background="rgba(239,68,68,.05)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.color="rgba(12,10,30,.38)"; e.currentTarget.style.borderColor="rgba(12,10,30,.1)"; e.currentTarget.style.background="transparent"; }}
        >
          <Ic size={13} stroke="currentColor" sw={2}>{I.logout}</Ic>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ── Note Card ────────────────────────────────────────────────────────────────── */
function NoteCard({ note, active, onClick }){
  const firstTag=(note.tags||[])[0];
  const accent=firstTag?tagAccent(firstTag):"rgba(124,58,237,.3)";
  const extra=Math.max(0,(note.tags||[]).length-2);

  return(
    <div onClick={onClick} style={{
      position:"relative", padding:"13px 14px 11px 16px",
      background: active ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.5)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: active ? "1px solid rgba(124,58,237,.22)" : "1px solid rgba(255,255,255,.78)",
      borderRadius:14, marginBottom:5,
      borderLeft:`2.5px solid ${active?C.violet:accent}`,
      cursor:"pointer", transition:"all .18s",
      boxShadow: active
        ? "inset 0 1.5px 0 rgba(255,255,255,.95), 0 4px 20px rgba(124,58,237,.1), 0 1px 6px rgba(109,40,217,.06)"
        : "inset 0 1.5px 0 rgba(255,255,255,.9), 0 1px 6px rgba(12,10,30,.04)",
    }}>
      <div style={{
        fontSize:13.5, fontWeight:700,
        color: active?"#5b21b6":C.dark,
        marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        letterSpacing:"-.02em",
      }}>
        {note.title||"Untitled"}
      </div>
      {note.content && (
        <div style={{
          fontSize:12, lineHeight:1.55, marginBottom:9,
          color: active?"rgba(91,33,182,.6)":"rgba(12,10,30,.38)",
          display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>
          {note.content}
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {(note.tags||[]).slice(0,2).map(tag=>{
            const c=tagColor(tag);
            return(
              <span key={tag} style={{
                padding:"2px 8px", borderRadius:100,
                background:c.bg, color:c.text, border:`1px solid ${c.border}`,
                fontSize:10.5, fontWeight:600,
              }}>{tag}</span>
            );
          })}
          {extra>0 && <span style={{ fontSize:10.5, color:"rgba(12,10,30,.28)" }}>+{extra}</span>}
        </div>
        <span style={{ fontSize:10.5, color:"rgba(12,10,30,.28)", letterSpacing:".01em", flexShrink:0 }}>{rel(note.updated_at)}</span>
      </div>
    </div>
  );
}

/* ── Notes List Panel ─────────────────────────────────────────────────────────── */
function NotesList({ notes, activeNoteId, onSelect, search, setSearch, sort, setSort, loading, showArchived, activeTag, sidebarOpen, onToggleSidebar }){
  return(
    <div style={{
      width:288, flexShrink:0, height:"100vh",
      ...fc(),
      borderRight:"1px solid rgba(255,255,255,.6)",
      borderRadius:0,
      display:"flex", flexDirection:"column",
      fontFamily:"'DM Sans',sans-serif",
      position:"relative", zIndex:1,
    }}>
      {/* Header */}
      <div style={{ padding:"20px 14px 12px", flexShrink:0, borderBottom:"1px solid rgba(12,10,30,.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:13 }}>
          <button
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              width:30, height:30, borderRadius:8, flexShrink:0,
              border:"1px solid rgba(12,10,30,.08)",
              background: sidebarOpen ? "rgba(124,58,237,.07)" : "rgba(255,255,255,.6)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color: sidebarOpen ? C.violet : "rgba(12,10,30,.35)",
              transition:"all .18s",
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(124,58,237,.12)"; e.currentTarget.style.color=C.violet; e.currentTarget.style.borderColor="rgba(124,58,237,.2)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=sidebarOpen?"rgba(124,58,237,.07)":"rgba(255,255,255,.6)"; e.currentTarget.style.color=sidebarOpen?C.violet:"rgba(12,10,30,.35)"; e.currentTarget.style.borderColor="rgba(12,10,30,.08)"; }}
          >
            <Ic size={14} stroke="currentColor" sw={2}>{I.menu}</Ic>
          </button>
          <div style={{ fontWeight:800, fontSize:14, color:C.dark, letterSpacing:"-.025em" }}>
            {showArchived?"Archived":activeTag?`#${activeTag}`:"All Notes"}
          </div>
        </div>

        {/* Search — landing ghost button style */}
        <div style={{ position:"relative", marginBottom:10 }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
            <Ic size={13} stroke="rgba(12,10,30,.3)" sw={2}>{I.search}</Ic>
          </span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search notes…"
            style={{
              width:"100%", padding:"9px 12px 9px 32px",
              background:"rgba(255,255,255,.5)",
              border:"1px solid rgba(255,255,255,.82)",
              backdropFilter:"blur(14px)",
              borderRadius:100, outline:"none",
              fontFamily:"'DM Sans',sans-serif",
              fontSize:13, color:C.dark, boxSizing:"border-box",
            }}
          />
        </div>

        <select value={sort} onChange={e=>setSort(e.target.value)} style={{
          padding:"6px 11px", borderRadius:100,
          background:"rgba(255,255,255,.5)", border:"1px solid rgba(255,255,255,.82)",
          backdropFilter:"blur(14px)",
          fontFamily:"'DM Sans',sans-serif",
          fontSize:12, color:C.muted, outline:"none", cursor:"pointer",
        }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A → Z</option>
        </select>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px 10px 16px" }}>
        {loading ? (
          [85,60,75,50].map((_,i)=>(
            <div key={i} style={{
              background:"rgba(255,255,255,.5)", border:"1px solid rgba(255,255,255,.78)",
              borderRadius:14, padding:"16px", marginBottom:5,
            }}>
              <div style={{ height:12, borderRadius:6, background:"rgba(12,10,30,.06)", width:"75%", marginBottom:10, animation:`pulse 1.4s ${i*.14}s ease-in-out infinite` }}/>
              <div style={{ height:10, borderRadius:6, background:"rgba(12,10,30,.04)", width:"55%", animation:`pulse 1.4s ${i*.14+.1}s ease-in-out infinite` }}/>
            </div>
          ))
        ) : notes.length===0 ? (
          <div style={{ textAlign:"center", paddingTop:64 }}>
            <div style={{
              width:52, height:52, borderRadius:16, margin:"0 auto 16px",
              ...glass(".65",20), display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Ic size={22} stroke="rgba(124,58,237,.5)" sw={1.6}>{I.note}</Ic>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:6, letterSpacing:"-.02em" }}>
              {search?"No matches":showArchived?"Nothing archived":"No notes yet"}
            </div>
            <div style={{ fontSize:12.5, color:C.muted, lineHeight:1.65 }}>
              {!search&&!showArchived&&"Create your first note →"}
            </div>
          </div>
        ) : notes.map(n=>(
          <NoteCard key={n.id} note={n} active={n.id===activeNoteId} onClick={()=>onSelect(n.id)} />
        ))}
      </div>
    </div>
  );
}

/* ── AI Panel ─────────────────────────────────────────────────────────────────── */
function TaskCard({ item, checked, onToggle }){
  const [hovered,setHovered]=useState(false);
  return(
    <div
      onClick={onToggle}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{
        display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer",
        padding:"12px 14px", borderRadius:12,
        background: checked
          ? "rgba(124,58,237,.07)"
          : hovered ? "rgba(124,58,237,.04)" : "rgba(255,255,255,.5)",
        border: checked
          ? "1px solid rgba(124,58,237,.18)"
          : `1px solid ${hovered?"rgba(124,58,237,.14)":"rgba(255,255,255,.82)"}`,
        transition:"all .18s",
      }}
    >
      <div style={{
        width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
        background: checked ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(255,255,255,.8)",
        border:`1.5px solid ${checked?C.violet:"rgba(12,10,30,.15)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: checked ? "0 2px 8px rgba(124,58,237,.3)" : "none",
        transition:"all .2s",
      }}>
        {checked&&<Ic size={11} stroke="#fff" sw={3}>{I.check}</Ic>}
      </div>
      <span style={{
        fontSize:13.5, color: checked?"rgba(124,58,237,.5)":C.dark,
        lineHeight:1.6, fontWeight: checked?400:500,
        textDecoration: checked?"line-through":"none",
        transition:"all .18s", flex:1,
      }}>{item}</span>
    </div>
  );
}

function AIPanel({ result, loading, error, onClose, onApplyTitle, onRetry }){
  const [checked, setChecked]=useState({});

  return(
    <div style={{
      width:380, minWidth:380, flexShrink:0, height:"100vh", overflowY:"auto",
      background:"rgba(255,255,255,.62)",
      backdropFilter:"blur(28px) saturate(180%)",
      WebkitBackdropFilter:"blur(28px) saturate(180%)",
      borderLeft:"3px solid transparent",
      backgroundClip:"padding-box",
      display:"flex", flexDirection:"column",
      fontFamily:"'DM Sans',sans-serif",
      position:"relative", zIndex:1,
    }}>
      {/* Violet gradient left border overlay */}
      <div style={{
        position:"absolute", left:0, top:0, bottom:0, width:3, zIndex:10,
        background:"linear-gradient(180deg,#7c3aed 0%,#a855f7 50%,rgba(168,85,247,.3) 100%)",
        pointerEvents:"none",
      }}/>

      {/* Header */}
      <div style={{
        padding:"22px 22px 18px",
        borderBottom:"1px solid rgba(12,10,30,.06)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0,
        background:"rgba(255,255,255,.82)", backdropFilter:"blur(20px)",
        zIndex:2,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:12,
            background:"linear-gradient(135deg,#7c3aed,#a855f7)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 6px 18px rgba(124,58,237,.35)",
          }}>
            <span style={{ color:"#fff", fontSize:15, fontWeight:800 }}>✦</span>
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:C.dark, letterSpacing:"-.02em" }}>AI Assistant</div>
            <div style={{ fontSize:11, color:"rgba(124,58,237,.6)", fontWeight:500, marginTop:1 }}>AI Assistant</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          width:30, height:30, borderRadius:8,
          background:"rgba(12,10,30,.05)", border:"1px solid rgba(12,10,30,.07)",
          cursor:"pointer", color:"rgba(12,10,30,.35)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, lineHeight:1, transition:"all .15s",
        }}
          onMouseEnter={e=>{ e.currentTarget.style.background="rgba(239,68,68,.08)"; e.currentTarget.style.color="#ef4444"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="rgba(12,10,30,.05)"; e.currentTarget.style.color="rgba(12,10,30,.35)"; }}
        >✕</button>
      </div>

      <div style={{ padding:"20px 18px 32px", flex:1, display:"flex", flexDirection:"column", gap:14 }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            background:"linear-gradient(135deg,rgba(124,58,237,.06),rgba(168,85,247,.03))",
            border:"1px solid rgba(124,58,237,.14)",
            borderRadius:20, padding:"24px",
          }}>
            {[88,72,80,60,68].map((w,i)=>(
              <div key={i} style={{
                height:12, borderRadius:8, background:"rgba(124,58,237,.1)",
                marginBottom:12, width:`${w}%`,
                animation:`pulse 1.4s ${i*.14}s ease-in-out infinite`,
              }}/>
            ))}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:22 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:C.violet, display:"inline-block", animation:"pulse 1s 0s ease-in-out infinite" }}/>
              <span style={{ width:7, height:7, borderRadius:"50%", background:C.violet, display:"inline-block", animation:"pulse 1s .2s ease-in-out infinite" }}/>
              <span style={{ width:7, height:7, borderRadius:"50%", background:C.violet, display:"inline-block", animation:"pulse 1s .4s ease-in-out infinite" }}/>
              <span style={{ fontSize:13, color:"rgba(124,58,237,.65)", fontWeight:600, marginLeft:4 }}>Conjure is thinking…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error&&!loading && (
          <div style={{
            background:"rgba(254,242,242,.9)", border:"1px solid rgba(239,68,68,.2)",
            borderRadius:16, padding:"20px 20px 16px",
            color:"#dc2626", fontSize:13.5, textAlign:"center", lineHeight:1.65,
          }}>
            {error}
            <button onClick={onRetry} style={{
              marginTop:14, display:"block", width:"100%",
              padding:"9px 16px", borderRadius:100, border:"none",
              background:"#ef4444", color:"#fff",
              fontFamily:"'DM Sans',sans-serif",
              fontSize:13, fontWeight:700, cursor:"pointer",
              boxShadow:"0 4px 12px rgba(239,68,68,.3)",
              transition:"box-shadow .18s, transform .15s",
            }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 6px 18px rgba(239,68,68,.4)"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 4px 12px rgba(239,68,68,.3)"; e.currentTarget.style.transform="none"; }}
            >Try again</button>
          </div>
        )}

        {result&&!loading && (<>

          {/* Summary */}
          <div style={{
            background:"linear-gradient(135deg,rgba(124,58,237,.08),rgba(168,85,247,.04))",
            border:"1px solid rgba(124,58,237,.16)",
            borderRadius:20, padding:"22px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{
                width:28, height:28, borderRadius:9,
                background:"rgba(124,58,237,.12)", border:"1px solid rgba(124,58,237,.2)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="13" height="13" fill="none" stroke={C.violet} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
                </svg>
              </div>
              <span style={{ fontSize:12, fontWeight:800, color:C.violet, letterSpacing:".06em", textTransform:"uppercase" }}>Summary</span>
            </div>
            <p style={{ fontSize:15, color:"rgba(12,10,30,.72)", lineHeight:1.8, margin:0, fontWeight:400 }}>{result.summary}</p>
          </div>

          {/* Key Actions */}
          {(result.action_items||[]).length>0 && (
            <div style={{
              background:"rgba(255,255,255,.55)",
              border:"1px solid rgba(255,255,255,.85)",
              borderRadius:20, padding:"22px",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <div style={{
                  width:28, height:28, borderRadius:9,
                  background:"rgba(124,58,237,.08)", border:"1px solid rgba(124,58,237,.16)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width="13" height="13" fill="none" stroke={C.violet} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <span style={{ fontSize:12, fontWeight:800, color:C.violet, letterSpacing:".06em", textTransform:"uppercase" }}>Key Actions</span>
                <span style={{
                  marginLeft:"auto", fontSize:11, fontWeight:700,
                  color:"rgba(124,58,237,.6)", background:"rgba(124,58,237,.1)",
                  padding:"2px 8px", borderRadius:100,
                }}>{(result.action_items||[]).length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {result.action_items.map((item,i)=>(
                  <TaskCard
                    key={i} item={item}
                    checked={!!checked[i]}
                    onToggle={()=>setChecked(p=>({...p,[i]:!p[i]}))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggested Title */}
          {result.suggested_title && (
            <div style={{
              background:"#f3f0ff",
              border:"1px solid rgba(124,58,237,.22)",
              borderRadius:20, padding:"22px",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <div style={{
                  width:28, height:28, borderRadius:9,
                  background:"rgba(124,58,237,.12)", border:"1px solid rgba(124,58,237,.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg width="13" height="13" fill="none" stroke={C.violet} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
                  </svg>
                </div>
                <span style={{ fontSize:12, fontWeight:800, color:C.violet, letterSpacing:".06em", textTransform:"uppercase" }}>Suggested Title</span>
              </div>
              <div style={{
                fontSize:18, color:C.dark, fontWeight:800,
                lineHeight:1.3, letterSpacing:"-.035em", marginBottom:18,
                padding:"14px 16px",
                background:"rgba(255,255,255,.7)",
                border:"1px solid rgba(124,58,237,.16)",
                borderRadius:12,
              }}>
                "{result.suggested_title}"
              </div>
              <button onClick={()=>onApplyTitle(result.suggested_title)} style={{
                width:"100%", padding:"13px 20px", borderRadius:100,
                border:"none",
                background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                color:"#fff",
                fontFamily:"'DM Sans',sans-serif",
                fontSize:14, fontWeight:700, cursor:"pointer",
                boxShadow:"0 6px 20px rgba(124,58,237,.38)",
                letterSpacing:"-.01em",
                transition:"box-shadow .2s, transform .15s",
              }}
                onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 10px 28px rgba(124,58,237,.48)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 6px 20px rgba(124,58,237,.38)"; e.currentTarget.style.transform="none"; }}
              >Apply title →</button>
            </div>
          )}

        </>)}
      </div>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────────────────────── */
function EmptyEditor({ user, notes, onNewNote }){
  const totalTags=[...new Set(notes.flatMap(n=>n.tags||[]))].length;
  const recent=notes.slice(0,3);

  return(
    <div style={{
      flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      padding:"40px", position:"relative", overflow:"hidden",
    }}>
      <div style={{ maxWidth:460, width:"100%", position:"relative", zIndex:1 }}>
        {/* Glass hero card — .fc style from landing */}
        <div style={{
          ...fc(),
          borderRadius:24, padding:"44px 44px 40px", textAlign:"center", marginBottom:14,
        }}>
          <div style={{
            width:62, height:62, borderRadius:20,
            background:"linear-gradient(135deg,#7c3aed,#a855f7)",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 24px",
            boxShadow:"0 8px 28px rgba(124,58,237,.32)",
          }}>
            <span style={{ color:"#fff", fontSize:28, fontWeight:800 }}>✦</span>
          </div>

          <h2 style={{
            fontFamily:"'DM Sans',sans-serif",
            fontSize:24, fontWeight:800, color:C.dark,
            letterSpacing:"-.04em", marginBottom:10, lineHeight:1.2,
          }}>
            {user?`Welcome back, ${user.name.split(" ")[0]}.`:"Your workspace."}
          </h2>
          <p style={{
            fontFamily:"'DM Sans',sans-serif",
            fontSize:14.5, color:C.muted, lineHeight:1.65, marginBottom:32,
          }}>
            {notes.length===0
              ?"Create your first note and let AI do the rest."
              :"Select a note to continue, or start a new one."}
          </p>

          {/* Stats row */}
          {notes.length>0 && (
            <div style={{ display:"flex", gap:10, marginBottom:32 }}>
              {[{v:notes.length,l:"Notes"},{v:totalTags,l:"Tags"},{v:rel(notes[0]?.updated_at),l:"Last edit"}].map(s=>(
                <div key={s.l} style={{
                  flex:1, padding:"14px 8px",
                  background:"rgba(124,58,237,.05)",
                  border:"1px solid rgba(124,58,237,.1)",
                  borderRadius:14, textAlign:"center",
                }}>
                  <div style={{ fontSize:20, fontWeight:800, color:C.dark, letterSpacing:"-.03em" }}>{s.v}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:3, fontWeight:500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* CTA — landing's .hp style */}
          <button onClick={onNewNote}
            className="hp"
            style={{
              padding:"13px 32px", borderRadius:100,
              border:"none", background:C.dark, color:"#fff",
              fontFamily:"'DM Sans',sans-serif",
              fontSize:14, fontWeight:700, cursor:"pointer",
              display:"inline-flex", alignItems:"center", gap:8,
              boxShadow:"0 4px 20px rgba(12,10,30,.22)",
              letterSpacing:"-.01em",
              transition:"background .2s, box-shadow .2s, transform .15s",
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background="#1c1840"; e.currentTarget.style.boxShadow="0 8px 28px rgba(12,10,30,.3)"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=C.dark; e.currentTarget.style.boxShadow="0 4px 20px rgba(12,10,30,.22)"; e.currentTarget.style.transform="none"; }}
          >
            <Ic size={15} stroke="#fff" sw={2.8}>{I.plus}</Ic>
            New note
          </button>
        </div>

        {/* Recent notes */}
        {recent.length>0 && (
          <div>
            <div style={{ fontSize:10.5, fontWeight:700, color:"rgba(12,10,30,.25)", letterSpacing:".1em", textTransform:"uppercase", marginBottom:8, paddingLeft:4 }}>Recent</div>
            {recent.map(n=>(
              <div key={n.id} style={{
                background:"rgba(255,255,255,.5)", border:"1px solid rgba(255,255,255,.82)",
                backdropFilter:"blur(14px)",
                borderRadius:12, padding:"11px 14px",
                display:"flex", alignItems:"center", gap:10, marginBottom:5,
              }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:n.tags?.[0]?tagAccent(n.tags[0]):"rgba(12,10,30,.15)", flexShrink:0 }}/>
                <span style={{ fontSize:13, fontWeight:600, color:C.dark, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-.01em" }}>{n.title||"Untitled"}</span>
                <span style={{ fontSize:11, color:C.muted }}>{rel(n.updated_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Selection Popover ───────────────────────────────────────────────────────── */
function SelectionPopover({ sel, aiAction, onAction, onReplace, onAddTasks, onDismiss }){
  if(!sel) return null;

  const px = Math.min(sel.x - 100, window.innerWidth - 360);
  const py = Math.max(10, sel.y - 72);

  const ACTIONS = [
    { key:"rewrite",       label:"✦ Rewrite"      },
    { key:"simplify",      label:"Simplify"        },
    { key:"extract_tasks", label:"Extract tasks"   },
  ];

  return(
    <>
      <div onClick={onDismiss} style={{ position:"fixed", inset:0, zIndex:298 }}/>
      <div style={{
        position:"fixed", left:px, top:py, zIndex:299,
        fontFamily:"'DM Sans',sans-serif",
        animation:"rise .18s cubic-bezier(.22,1,.36,1) both",
      }}>
        {/* Action pill */}
        {!aiAction?.result && (
          <div style={{
            display:"flex", gap:3,
            background:"rgba(255,255,255,.96)",
            backdropFilter:"blur(28px) saturate(200%)",
            border:"1px solid rgba(255,255,255,.92)",
            borderRadius:100, padding:"5px 6px",
            boxShadow:"inset 0 1.5px 0 rgba(255,255,255,.95), 0 8px 32px rgba(12,10,30,.14), 0 2px 8px rgba(109,40,217,.08)",
          }}>
            {ACTIONS.map(a=>(
              <button key={a.key} onClick={()=>onAction(a.key)}
                disabled={aiAction?.loading}
                style={{
                  padding:"6px 14px", borderRadius:100, border:"none",
                  background: aiAction?.loading && aiAction?.action===a.key ? "rgba(124,58,237,.12)" : "transparent",
                  color: C.violet,
                  fontFamily:"'DM Sans',sans-serif",
                  fontSize:12.5, fontWeight:700, cursor:"pointer", transition:"background .15s",
                  opacity: aiAction?.loading && aiAction?.action!==a.key ? 0.35 : 1,
                }}
                onMouseEnter={e=>{ if(!aiAction?.loading) e.currentTarget.style.background="rgba(124,58,237,.1)"; }}
                onMouseLeave={e=>{ if(!aiAction?.loading) e.currentTarget.style.background="transparent"; }}
              >
                {aiAction?.loading && aiAction?.action===a.key ? "…" : a.label}
              </button>
            ))}
          </div>
        )}

        {/* Result card */}
        {aiAction?.result && !aiAction?.loading && (
          <div style={{
            background:"rgba(255,255,255,.97)",
            backdropFilter:"blur(28px) saturate(200%)",
            border:"1px solid rgba(255,255,255,.92)",
            borderRadius:18, padding:"16px 18px",
            boxShadow:"inset 0 1.5px 0 rgba(255,255,255,.95), 0 16px 48px rgba(12,10,30,.14), 0 4px 12px rgba(109,40,217,.08)",
            maxWidth:360,
            animation:"rise .2s cubic-bezier(.22,1,.36,1) both",
          }}>
            <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(124,58,237,.55)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>
              {aiAction.action==="extract_tasks"?"Extracted Tasks":aiAction.action==="rewrite"?"Rewritten":"Simplified"}
            </div>

            {aiAction.action==="extract_tasks" ? (
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
                {(aiAction.result||[]).map((task,i)=>(
                  <div key={i} style={{ display:"flex", gap:9, alignItems:"flex-start" }}>
                    <div style={{ width:16, height:16, borderRadius:4, border:"1.5px solid rgba(124,58,237,.3)", marginTop:1.5, flexShrink:0 }}/>
                    <span style={{ fontSize:12.5, color:C.muted, lineHeight:1.55 }}>{task}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:13, color:C.dark, lineHeight:1.75, marginBottom:14, fontStyle:"italic" }}>{aiAction.result}</p>
            )}

            <div style={{ display:"flex", gap:7 }}>
              {aiAction.action!=="extract_tasks" ? (
                <button onClick={onReplace} style={{
                  padding:"7px 16px", borderRadius:100, border:"none",
                  background:C.dark, color:"#fff",
                  fontFamily:"'DM Sans',sans-serif",
                  fontSize:12, fontWeight:700, cursor:"pointer",
                  boxShadow:"0 4px 12px rgba(12,10,30,.2)",
                  transition:"background .15s",
                }}>Replace →</button>
              ) : (
                <button onClick={()=>onAddTasks(aiAction.result)} style={{
                  padding:"7px 16px", borderRadius:100, border:"none",
                  background:C.violet, color:"#fff",
                  fontFamily:"'DM Sans',sans-serif",
                  fontSize:12, fontWeight:700, cursor:"pointer",
                  boxShadow:"0 4px 12px rgba(124,58,237,.3)",
                }}>Add to note →</button>
              )}
              <button onClick={onDismiss} style={{
                padding:"7px 13px", borderRadius:100,
                border:"1px solid rgba(12,10,30,.1)", background:"transparent",
                color:"rgba(12,10,30,.4)",
                fontFamily:"'DM Sans',sans-serif",
                fontSize:12, fontWeight:600, cursor:"pointer",
              }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Error */}
        {aiAction?.error && !aiAction?.loading && (
          <div style={{
            background:"rgba(254,242,242,.97)", border:"1px solid rgba(239,68,68,.2)",
            borderRadius:12, padding:"10px 14px", maxWidth:280,
            fontSize:12.5, color:"#dc2626",
            backdropFilter:"blur(20px)",
          }}>{aiAction.error}</div>
        )}
      </div>
    </>
  );
}

/* ── Editor ──────────────────────────────────────────────────────────────────── */
function Editor({ note, saveStatus, onTitleChange, onContentChange, onAddTag, onRemoveTag, onArchive, onDelete, onShare, onSummarize, shareStatus, showArchived, user, notes, onNewNote }){
  const [tagInput,setTagInput]=useState("");
  const [sel,setSel]=useState(null);
  const [aiAction,setAiAction]=useState(null);
  const textareaRef=useRef(null);

  function handleMouseUp(e){
    const ta=textareaRef.current; if(!ta||!note) return;
    const start=ta.selectionStart, end=ta.selectionEnd;
    if(start===end){ setSel(null); return; }
    setSel({ x:e.clientX, y:e.clientY, text:ta.value.substring(start,end), start, end });
    setAiAction(null);
  }

  async function handleAIAction(action){
    if(!sel||!note) return;
    setAiAction({ loading:true, result:null, action, error:null });
    try{
      const res=await client.post(`/notes/${note.id}/ai-action`,{ action, selected_text:sel.text });
      setAiAction({ loading:false, result:res.data.result, action, error:null });
    }catch(err){
      setAiAction({ loading:false, result:null, action, error:err.response?.data?.detail||"AI request failed" });
    }
  }

  function handleReplaceText(){
    if(!sel||!aiAction?.result||!note) return;
    const newContent=note.content.substring(0,sel.start)+aiAction.result+note.content.substring(sel.end);
    onContentChange(newContent); setSel(null); setAiAction(null);
  }

  function handleAddTasks(tasks){
    if(!tasks||!note) return;
    const appended="\n\n"+tasks.map(t=>`- ${t}`).join("\n");
    onContentChange(note.content+appended); setSel(null); setAiAction(null);
  }

  function handleTagKey(e){
    if((e.key==="Enter"||e.key===",")&&tagInput.trim()){
      e.preventDefault(); onAddTag(tagInput.trim().replace(/,/g,"").toLowerCase()); setTagInput("");
    }
  }

  const words=(note?.content||"").trim().split(/\s+/).filter(Boolean).length;
  const chars=(note?.content||"").length;
  const saveColor=saveStatus==="saved"?"#16a34a":saveStatus==="error"?"#dc2626":"rgba(12,10,30,.3)";
  const saveLabel={saving:"Saving…",saved:"Saved",error:"Save failed"}[saveStatus]||"";
  const isSaving=saveStatus==="saving";

  if(!note) return <EmptyEditor user={user} notes={notes} onNewNote={onNewNote}/>;

  return(
    <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", fontFamily:"'DM Sans',sans-serif" }}>

      {/* Toolbar — glass bar */}
      <div style={{
        height:54, flexShrink:0,
        background:"rgba(255,255,255,.7)",
        backdropFilter:"blur(20px) saturate(180%)",
        borderBottom:"1px solid rgba(255,255,255,.7)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 28px",
        position:"relative", zIndex:2,
        boxShadow:"0 1px 0 rgba(12,10,30,.04)",
      }}>
        {/* Breadcrumb */}
        <div style={{ fontSize:12, display:"flex", alignItems:"center", gap:5, color:"rgba(12,10,30,.3)" }}>
          <span>Notes</span>
          {(note.tags||[])[0]&&<><span style={{ opacity:.5 }}>›</span><span style={{ color:C.violet, fontWeight:600 }}>#{note.tags[0]}</span></>}
          <span style={{ opacity:.5 }}>›</span>
          <span style={{ color:"rgba(12,10,30,.55)", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {note.title||"Untitled"}
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {saveLabel&&(
            <span style={{ fontSize:11.5, color:saveColor, fontWeight:600, marginRight:4, letterSpacing:"-.01em" }}>
              {saveStatus==="saved"&&"✓ "}{saveLabel}
            </span>
          )}

          {/* Summarize — violet pill */}
          <button onClick={onSummarize} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"7px 16px", borderRadius:100,
            background:"rgba(124,58,237,.08)", border:"1px solid rgba(124,58,237,.2)",
            color:C.violet,
            fontFamily:"'DM Sans',sans-serif",
            fontSize:12.5, fontWeight:700, cursor:"pointer",
            transition:"all .18s",
          }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(124,58,237,.14)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="rgba(124,58,237,.08)"; }}
          >
            <span style={{ fontSize:11 }}>✦</span> Summarize
          </button>

          {/* Share */}
          <button onClick={onShare} style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"7px 14px", borderRadius:100,
            background: shareStatus==="shared"?"rgba(22,163,74,.08)":"rgba(255,255,255,.6)",
            border: shareStatus==="shared"?"1px solid rgba(22,163,74,.22)":"1px solid rgba(255,255,255,.82)",
            color: shareStatus==="shared"?"#16a34a":"rgba(12,10,30,.45)",
            fontFamily:"'DM Sans',sans-serif",
            fontSize:12.5, fontWeight:600, cursor:"pointer", transition:"all .18s",
          }}>
            <Ic size={13} stroke="currentColor" sw={2}>{shareStatus==="shared"?I.check:I.share}</Ic>
            {shareStatus==="shared"?"Shared":"Share"}
          </button>

          {/* Archive */}
          <button onClick={onArchive} title={showArchived?"Unarchive":"Archive"} style={{
            width:34, height:34, borderRadius:10,
            border:"1px solid rgba(255,255,255,.82)", background:"rgba(255,255,255,.6)",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            color:"rgba(12,10,30,.35)", transition:"all .15s",
          }}>
            <Ic size={15} stroke="currentColor" sw={1.8}>{I.archive}</Ic>
          </button>

          {/* Delete */}
          <button onClick={onDelete} title="Delete" style={{
            width:34, height:34, borderRadius:10,
            border:"1px solid rgba(255,255,255,.82)", background:"rgba(255,255,255,.6)",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            color:"rgba(12,10,30,.35)", transition:"all .15s",
          }}
            onMouseEnter={e=>{ e.currentTarget.style.color="#ef4444"; e.currentTarget.style.borderColor="rgba(239,68,68,.25)"; e.currentTarget.style.background="rgba(239,68,68,.07)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.color="rgba(12,10,30,.35)"; e.currentTarget.style.borderColor="rgba(255,255,255,.82)"; e.currentTarget.style.background="rgba(255,255,255,.6)"; }}
          >
            <Ic size={15} stroke="currentColor" sw={1.8}>{I.trash}</Ic>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"40px 60px 80px" }}>
        {/* Title */}
        <input
          value={note.title} onChange={e=>onTitleChange(e.target.value)}
          placeholder="Untitled note…"
          style={{
            width:"100%", fontSize:34, fontWeight:800, color:C.dark,
            border:"none", outline:"none", background:"transparent",
            fontFamily:"'DM Sans',sans-serif",
            letterSpacing:"-.05em", marginBottom:20, lineHeight:1.15,
            boxSizing:"border-box",
          }}
        />

        {/* Tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", marginBottom:28 }}>
          {(note.tags||[]).map(tag=>{
            const c=tagColor(tag);
            return(
              <span key={tag} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"4px 10px 4px 13px", borderRadius:100,
                background:c.bg, color:c.text, border:`1px solid ${c.border}`,
                fontSize:12, fontWeight:600,
              }}>
                {tag}
                <button onClick={()=>onRemoveTag(tag)} style={{
                  background:"none", border:"none", cursor:"pointer",
                  color:c.text, fontSize:15, lineHeight:1, padding:0, opacity:.55,
                  display:"flex",
                }}>×</button>
              </span>
            );
          })}
          <input
            value={tagInput} onChange={e=>setTagInput(e.target.value)}
            onKeyDown={handleTagKey} placeholder="+ tag"
            style={{
              border:"1.5px dashed rgba(124,58,237,.3)", borderRadius:100,
              padding:"4px 12px", fontSize:12, color:C.violet,
              background:"transparent", outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              width:72,
            }}
          />
        </div>

        {/* Separator */}
        <div style={{ height:1, background:"rgba(12,10,30,.05)", marginBottom:30 }}/>

        {/* Content — pulsing glow ring on autosave */}
        <div style={{
          borderRadius:12, transition:"box-shadow .4s",
          boxShadow: isSaving ? "0 0 0 2px rgba(124,58,237,.18), 0 0 24px rgba(124,58,237,.09)" : "none",
        }}>
          <textarea
            ref={textareaRef}
            value={note.content} onChange={e=>onContentChange(e.target.value)}
            onMouseUp={handleMouseUp}
            placeholder="Start writing…  (select any text for AI actions)"
            style={{
              width:"100%", minHeight:520, border:"none", outline:"none",
              resize:"none", background:"transparent",
              fontFamily:"'DM Sans',sans-serif",
              fontSize:16, color:"rgba(12,10,30,.78)", lineHeight:1.9,
              boxSizing:"border-box", letterSpacing:"-.005em",
              padding:"12px 0",
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        height:36, flexShrink:0,
        background:"rgba(255,255,255,.6)",
        backdropFilter:"blur(20px)",
        borderTop:"1px solid rgba(255,255,255,.7)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 28px",
      }}>
        <span style={{ fontSize:11.5, color:"rgba(12,10,30,.22)", fontWeight:500 }}>{words} words · {chars} chars</span>
        {isSaving
          ? <span style={{ fontSize:11.5, color:C.violet, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:C.violet, display:"inline-block", animation:"pulse 1s ease-in-out infinite" }}/>
              Saving…
            </span>
          : <span style={{ fontSize:11.5, color:"rgba(12,10,30,.18)" }}>Auto-saved</span>
        }
      </div>

      <SelectionPopover
        sel={sel} aiAction={aiAction}
        onAction={handleAIAction}
        onReplace={handleReplaceText}
        onAddTasks={handleAddTasks}
        onDismiss={()=>{ setSel(null); setAiAction(null); }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   WORKSPACE
═══════════════════════════════════════════════════════════════════════════════ */
export default function Workspace(){
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen,setSidebarOpen]        = useState(true);

  const [notes,setNotes]                   = useState([]);
  const [loading,setLoading]               = useState(false);
  const [activeNoteId,setActiveNoteId]     = useState(null);
  const [localNote,setLocalNote]           = useState(null);
  const localNoteRef                       = useRef(null);
  const activeNoteIdRef                    = useRef(null);

  const [search,setSearch]                 = useState("");
  const [debouncedSearch,setDebouncedSearch] = useState("");
  const [sort,setSort]                     = useState("newest");
  const [showArchived,setShowArchived]     = useState(false);
  const [activeTag,setActiveTag]           = useState(null);

  const [saveStatus,setSaveStatus]         = useState("idle");
  const saveTimerRef                       = useRef(null);

  const [isAIPanelOpen,setIsAIPanelOpen]   = useState(false);
  const [aiResult,setAiResult]             = useState(null);
  const [aiLoading,setAiLoading]           = useState(false);
  const [aiError,setAiError]               = useState(null);

  const [shareStatus,setShareStatus]       = useState("idle");
  const [toasts,setToasts]                 = useState([]);
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false);

  useEffect(()=>{ localNoteRef.current=localNote; },[localNote]);
  useEffect(()=>{ activeNoteIdRef.current=activeNoteId; },[activeNoteId]);

  useEffect(()=>{
    const t=setTimeout(()=>setDebouncedSearch(search),300);
    return()=>clearTimeout(t);
  },[search]);

  const loadNotes=useCallback(async()=>{
    setLoading(true);
    try{
      const params={sort,archived:showArchived};
      if(debouncedSearch) params.search=debouncedSearch;
      if(activeTag) params.tag=activeTag;
      const res=await client.get("/notes",{params});
      setNotes(res.data);
    }catch{ addToast("error","Failed to load notes"); }
    finally{ setLoading(false); }
  },[debouncedSearch,sort,showArchived,activeTag]);

  useEffect(()=>{ loadNotes(); },[loadNotes]);

  function addToast(type,msg){
    const id=Date.now()+Math.random();
    setToasts(p=>[...p,{id,type,msg}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  }
  function dismissToast(id){ setToasts(p=>p.filter(t=>t.id!==id)); }

  function scheduleAutosave(){
    setSaveStatus("saving");
    if(saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current=setTimeout(async()=>{
      const n=localNoteRef.current; if(!n) return;
      try{
        const res=await client.patch(`/notes/${n.id}`,{title:n.title,content:n.content,tags:n.tags});
        setNotes(prev=>prev.map(x=>x.id===n.id?{...x,...res.data}:x));
        setSaveStatus("saved");
        setTimeout(()=>setSaveStatus("idle"),2000);
      }catch{ setSaveStatus("error"); }
    },1500);
  }

  function selectNote(id){
    if(saveTimerRef.current&&localNoteRef.current){
      clearTimeout(saveTimerRef.current); saveTimerRef.current=null;
      const prev=localNoteRef.current;
      client.patch(`/notes/${prev.id}`,{title:prev.title,content:prev.content,tags:prev.tags}).catch(()=>{});
    }
    const found=notes.find(n=>n.id===id); if(!found) return;
    setActiveNoteId(id); activeNoteIdRef.current=id;
    setLocalNote({id:found.id,title:found.title||"",content:found.content||"",tags:found.tags||[]});
    setSaveStatus("idle"); setShareStatus(found.is_public?"shared":"idle");
    setIsAIPanelOpen(false);
    setAiResult(found.ai_summary?{summary:found.ai_summary,action_items:found.ai_action_items||[],suggested_title:found.ai_suggested_title||""}:null);
    setAiError(null);
  }

  function handleTitleChange(v)  { setLocalNote(p=>({...p,title:v}));   scheduleAutosave(); }
  function handleContentChange(v){ setLocalNote(p=>({...p,content:v})); scheduleAutosave(); }
  function handleAddTag(tag){ if(!tag||(localNote?.tags||[]).includes(tag)) return; setLocalNote(p=>({...p,tags:[...(p.tags||[]),tag]})); scheduleAutosave(); }
  function handleRemoveTag(tag){ setLocalNote(p=>({...p,tags:(p.tags||[]).filter(t=>t!==tag)})); scheduleAutosave(); }

  async function createNote(){
    try{
      const res=await client.post("/notes",{title:"",content:"",tags:[]});
      const n=res.data;
      setNotes(p=>[n,...p]);
      setActiveNoteId(n.id); activeNoteIdRef.current=n.id;
      setLocalNote({id:n.id,title:"",content:"",tags:[]});
      setSaveStatus("idle"); setShareStatus("idle");
      setIsAIPanelOpen(false); setAiResult(null);
    }catch{ addToast("error","Could not create note"); }
  }

  async function handleArchive(){
    if(!localNote) return;
    try{
      await client.patch(`/notes/${localNote.id}`,{is_archived:!showArchived});
      setNotes(p=>p.filter(n=>n.id!==localNote.id));
      setActiveNoteId(null); setLocalNote(null);
      addToast("success",showArchived?"Note unarchived":"Note archived");
    }catch{ addToast("error","Could not archive note"); }
  }

  async function confirmDelete(){
    if(!localNote) return;
    try{
      await client.delete(`/notes/${localNote.id}`);
      setNotes(p=>p.filter(n=>n.id!==localNote.id));
      setActiveNoteId(null); setLocalNote(null);
      setShowDeleteConfirm(false); addToast("success","Note deleted");
    }catch{ addToast("error","Could not delete note"); setShowDeleteConfirm(false); }
  }

  async function handleShare(){
    if(!localNote) return;
    try{
      const res=await client.post(`/notes/${localNote.id}/share`);
      const url=`${window.location.origin}/shared/${res.data.share_id}`;
      await navigator.clipboard.writeText(url);
      setShareStatus("shared"); addToast("success","Link copied to clipboard!");
    }catch{ addToast("error","Could not share note"); }
  }

  async function handleSummarize(){
    if(!localNote) return;
    setIsAIPanelOpen(true); setAiLoading(true); setAiError(null); setAiResult(null);
    try{
      const res=await client.post(`/notes/${localNote.id}/generate-summary`);
      setAiResult(res.data); addToast("success","Summary generated!");
    }catch(err){ setAiError(err.response?.data?.detail||"Could not generate summary."); }
    finally{ setAiLoading(false); }
  }

  function applyAITitle(t){ handleTitleChange(t); addToast("info","Title applied!"); }
  function handleSetActiveTag(t){ setActiveTag(t); setShowArchived(false); }
  function handleSetShowArchived(v){ setShowArchived(v); if(v) setActiveTag(null); }

  return(
    <>
      <style>{`
        ${FONTS}
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(124,58,237,.15);border-radius:4px;}
        input::placeholder,textarea::placeholder{color:rgba(12,10,30,.25);}
        input,textarea,button,select{font-family:'DM Sans',sans-serif;}
        @keyframes rise{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:.3;}50%{opacity:.7;}}
        @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
      `}</style>

      {/* Full-page background — same as landing */}
      <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:0 }}>
        {/* Ambient violet blob — top left */}
        <div style={{
          position:"absolute", width:700, height:700, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(124,58,237,.09) 0%, transparent 65%)",
          top:-200, left:-150, pointerEvents:"none",
        }}/>
        {/* Ambient blue blob — bottom right */}
        <div style={{
          position:"absolute", width:600, height:600, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(37,99,235,.06) 0%, transparent 65%)",
          bottom:-100, right:-100, pointerEvents:"none",
        }}/>
        {/* Subtle center glow */}
        <div style={{
          position:"absolute", width:900, height:400, borderRadius:"50%",
          background:"radial-gradient(ellipse, rgba(168,85,247,.04) 0%, transparent 70%)",
          top:"30%", left:"50%", transform:"translateX(-50%)", pointerEvents:"none",
        }}/>
      </div>

      <div style={{ display:"flex", height:"100vh", overflow:"hidden", position:"relative", zIndex:1 }}>
        {/* Collapsible sidebar wrapper */}
        <div style={{
          width: sidebarOpen ? 228 : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: "width .28s cubic-bezier(.22,1,.36,1)",
        }}>
          <Sidebar
            user={user} notes={notes}
            showArchived={showArchived} setShowArchived={handleSetShowArchived}
            activeTag={activeTag} setActiveTag={handleSetActiveTag}
            onNewNote={createNote} onLogout={logout}
          />
        </div>
        <NotesList
          notes={notes} activeNoteId={activeNoteId} onSelect={selectNote}
          search={search} setSearch={setSearch} sort={sort} setSort={setSort}
          loading={loading} showArchived={showArchived} activeTag={activeTag}
          sidebarOpen={sidebarOpen} onToggleSidebar={()=>setSidebarOpen(p=>!p)}
        />
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          <Editor
            note={localNote} saveStatus={saveStatus}
            onTitleChange={handleTitleChange} onContentChange={handleContentChange}
            onAddTag={handleAddTag} onRemoveTag={handleRemoveTag}
            onArchive={handleArchive} onDelete={()=>setShowDeleteConfirm(true)}
            onShare={handleShare} onSummarize={handleSummarize}
            shareStatus={shareStatus} showArchived={showArchived}
            user={user} notes={notes} onNewNote={createNote}
          />
          {isAIPanelOpen&&(
            <AIPanel result={aiResult} loading={aiLoading} error={aiError}
              onClose={()=>setIsAIPanelOpen(false)} onApplyTitle={applyAITitle}
              onRetry={handleSummarize}
            />
          )}
        </div>
      </div>

      <Toasts toasts={toasts} dismiss={dismissToast}/>
      {showDeleteConfirm&&(
        <DeleteModal title={localNote?.title} onConfirm={confirmDelete} onCancel={()=>setShowDeleteConfirm(false)}/>
      )}
    </>
  );
}
