import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

/* ─── fonts ──────────────────────────────────────────────────────────────────── */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
`;

/* ─── tokens ─────────────────────────────────────────────────────────────────── */
const C = {
  dark:   "#0c0a1e",
  violet: "#7c3aed",
  bg:     "#eef2ff",
  muted:  "rgba(12,10,30,.42)",
  border: "rgba(12,10,30,.07)",
};

const fc = () => ({
  background: "rgba(255,255,255,.72)",
  backdropFilter: "blur(28px) saturate(180%)",
  WebkitBackdropFilter: "blur(28px) saturate(180%)",
  border: "1px solid rgba(255,255,255,.88)",
  boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.95), 0 2px 4px rgba(0,0,0,.03), 0 8px 24px rgba(109,40,217,.06)",
});

/* ─── tag palette (same as workspace) ───────────────────────────────────────── */
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

function getGreeting(){
  const h = new Date().getHours();
  if(h < 12) return "Good morning";
  if(h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateLabel(){
  return new Date().toLocaleDateString("en-US",{ weekday:"long", month:"long", day:"numeric" });
}

/* ─── animated counter ───────────────────────────────────────────────────────── */
function useCounter(target, duration=600){
  const [val,setVal]=useState(0);
  const frame=useRef(null);
  useEffect(()=>{
    if(!target&&target!==0){ setVal(0); return; }
    const start=Date.now();
    function tick(){
      const p=Math.min((Date.now()-start)/duration,1);
      const eased=1-Math.pow(1-p,3);
      setVal(Math.round(eased*target));
      if(p<1) frame.current=requestAnimationFrame(tick);
    }
    frame.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame.current);
  },[target,duration]);
  return val;
}

/* ─── productivity score ─────────────────────────────────────────────────────── */
function calcScore(data){
  if(!data) return 0;
  const n = Math.min(35,(data.total_notes/8)*35);
  const a = Math.min(30,(data.ai_summaries_generated/4)*30);
  const t = Math.min(20,(data.unique_tags.length/5)*20);
  const w = data.weekly_activity.reduce((s,d)=>s+d.created+d.edited,0);
  const ww= Math.min(15,(w/10)*15);
  return Math.round(n+a+t+ww);
}

/* ─── SVG icon wrapper ────────────────────────────────────────────────────────── */
function Ic({ size=16, stroke="currentColor", sw=1.8, children }){
  return(
    <svg width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      {children}
    </svg>
  );
}

/* ─── Skeleton shimmer ────────────────────────────────────────────────────────── */
function Skeleton({ w="100%", h=16, r=8, style={} }){
  return(
    <div style={{
      width:w, height:h, borderRadius:r,
      background:"linear-gradient(90deg,rgba(12,10,30,.05) 25%,rgba(124,58,237,.06) 50%,rgba(12,10,30,.05) 75%)",
      backgroundSize:"200% 100%",
      animation:"shimmer 1.5s infinite",
      ...style,
    }}/>
  );
}

/* ─── Dashboard Sidebar ──────────────────────────────────────────────────────── */
function DashSidebar({ user, onLogout }){
  const navigate = useNavigate();
  const navItems = [
    {
      label:"Dashboard", path:"/dashboard", active:true,
      icon:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    },
    {
      label:"Notes", path:"/app", active:false,
      icon:<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    },
  ];

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
          <span style={{ fontWeight:800, fontSize:15.5, color:C.dark, letterSpacing:"-.03em" }}>Conjure</span>
        </button>
        {user && (
          <div style={{
            display:"flex", alignItems:"center", gap:9, padding:"8px 10px",
            background:"rgba(124,58,237,.06)", border:"1px solid rgba(124,58,237,.1)", borderRadius:12,
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
        {navItems.map(item=>(
          <button key={item.label} onClick={()=>navigate(item.path)} style={{
            width:"100%", display:"flex", alignItems:"center", gap:9,
            padding:"9px 11px", borderRadius:10, border:"none", cursor:"pointer",
            background: item.active ? "rgba(124,58,237,.1)" : "transparent",
            color: item.active ? C.violet : "rgba(12,10,30,.45)",
            fontFamily:"'DM Sans',sans-serif",
            fontSize:13.5, fontWeight: item.active ? 700 : 500,
            textAlign:"left", transition:"all .15s", marginBottom:2,
            borderLeft: item.active ? `2px solid ${C.violet}` : "2px solid transparent",
          }}>
            <Ic size={15} stroke="currentColor" sw={item.active?2.2:1.8}>{item.icon}</Ic>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1 }}/>

      <div style={{ padding:"12px 10px 18px", borderTop:"1px solid rgba(12,10,30,.06)" }}>
        <button onClick={()=>navigate("/app")} style={{
          width:"100%", padding:"11px 16px", borderRadius:100,
          border:"none", background:C.dark, color:"#fff",
          fontFamily:"'DM Sans',sans-serif",
          fontSize:13.5, fontWeight:700, cursor:"pointer", marginBottom:7,
          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          boxShadow:"0 4px 20px rgba(12,10,30,.22)",
          transition:"background .18s, box-shadow .18s, transform .15s",
        }}
          onMouseEnter={e=>{ e.currentTarget.style.background="#1c1840"; e.currentTarget.style.transform="translateY(-1px)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background=C.dark; e.currentTarget.style.transform="none"; }}
        >
          <svg width={14} height={14} fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
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
          <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────────── */
function StatCard({ icon, iconBg, iconColor, value, label, trend, trendColor, delay=0, loading }){
  const counted = useCounter(loading ? 0 : value);
  const [hov,setHov]=useState(false);

  return(
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        ...fc(), borderRadius:20, padding:"24px",
        flex:1, minWidth:0, cursor:"default",
        transition:"transform .2s, box-shadow .2s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov
          ? "inset 0 1.5px 0 rgba(255,255,255,.95), 0 8px 32px rgba(109,40,217,.12), 0 4px 12px rgba(0,0,0,.05)"
          : "inset 0 1.5px 0 rgba(255,255,255,.95), 0 2px 4px rgba(0,0,0,.03), 0 8px 24px rgba(109,40,217,.06)",
        animation:`rise .5s cubic-bezier(.22,1,.36,1) ${delay}ms both`,
        fontFamily:"'DM Sans',sans-serif",
      }}
    >
      <div style={{
        width:44, height:44, borderRadius:14,
        background:iconBg, color:iconColor,
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:18,
        boxShadow:`0 4px 16px ${iconBg}`,
      }}>
        <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.9}
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{icon}</svg>
      </div>

      {loading ? (
        <>
          <Skeleton h={36} w="60%" r={8} style={{ marginBottom:8 }}/>
          <Skeleton h={14} w="80%" r={6} style={{ marginBottom:12 }}/>
          <Skeleton h={12} w="50%" r={6}/>
        </>
      ) : (
        <>
          <div style={{
            fontFamily:"'DM Sans',sans-serif", fontSize:40, fontWeight:800,
            color:C.dark, lineHeight:1, letterSpacing:"-.05em", marginBottom:6,
          }}>{counted.toLocaleString()}</div>
          <div style={{ fontSize:13, color:C.muted, fontWeight:500, marginBottom:12 }}>{label}</div>
          <div style={{ fontSize:12, fontWeight:600, color:trendColor||"rgba(12,10,30,.3)" }}>{trend}</div>
        </>
      )}
    </div>
  );
}

/* ─── Custom Chart Tooltip ────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }){
  if(!active||!payload||!payload.length) return null;
  return(
    <div style={{
      background:"rgba(255,255,255,.96)", backdropFilter:"blur(20px)",
      border:"1px solid rgba(255,255,255,.9)",
      borderRadius:12, padding:"10px 14px",
      boxShadow:"0 8px 24px rgba(12,10,30,.1)",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:6 }}>{label}</div>
      {payload.map(p=>(
        <div key={p.name} style={{ fontSize:12, color:p.fill, fontWeight:600, marginBottom:2 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────────── */
export default function Dashboard(){
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    client.get("/dashboard/stats")
      .then(r=>setData(r.data))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const score = calcScore(data);
  const scoreCount = useCounter(loading ? 0 : score);

  const achievements = [
    { label:"AI Power User",      earned: (data?.ai_summaries_generated||0) >= 3 },
    { label:"Prolific Writer",    earned: (data?.total_notes||0) >= 5            },
    { label:"Organized Thinker",  earned: (data?.unique_tags?.length||0) >= 3    },
  ];

  const maxTagCount = data?.top_tags?.[0]?.count || 1;

  return(
    <>
      <style>{`
        ${FONTS}
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(124,58,237,.15);border-radius:4px;}
        @keyframes rise{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
        @keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
        @keyframes pulse{0%,100%{opacity:.3;}50%{opacity:.8;}}
      `}</style>

      {/* Ambient background — same as workspace */}
      <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:0 }}>
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,58,237,.08) 0%, transparent 65%)", top:-200, left:-150, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(37,99,235,.05) 0%, transparent 65%)", bottom:-100, right:-100, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", width:900, height:400, borderRadius:"50%", background:"radial-gradient(ellipse, rgba(168,85,247,.04) 0%, transparent 70%)", top:"30%", left:"50%", transform:"translateX(-50%)", pointerEvents:"none" }}/>
      </div>

      <div style={{ display:"flex", height:"100vh", overflow:"hidden", position:"relative", zIndex:1 }}>
        <DashSidebar user={user} onLogout={logout}/>

        {/* Main content */}
        <div style={{ flex:1, overflowY:"auto", padding:"36px 40px 60px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>

            {/* Page header — landing.png banner */}
            <div style={{
              borderRadius:24, overflow:"hidden", position:"relative",
              marginBottom:28,
              backgroundImage:"url('/landing.png')",
              backgroundSize:"cover", backgroundPosition:"center top",
              animation:"rise .5s cubic-bezier(.22,1,.36,1) both",
            }}>
              {/* tint */}
              <div style={{ position:"absolute", inset:0, background:"rgba(238,232,255,.18)", pointerEvents:"none" }}/>

              <div style={{
                position:"relative", zIndex:1,
                padding:"44px 48px",
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:24,
              }}>
                {/* Greeting card */}
                <div style={{
                  background:"rgba(255,255,255,.58)",
                  backdropFilter:"blur(28px) saturate(200%)",
                  WebkitBackdropFilter:"blur(28px) saturate(200%)",
                  border:"1px solid rgba(255,255,255,.9)",
                  borderRadius:18, padding:"24px 32px",
                  boxShadow:"inset 0 2px 0 rgba(255,255,255,.95), 0 8px 32px rgba(12,10,30,.08)",
                }}>
                  <h1 style={{
                    fontFamily:"'DM Sans',sans-serif",
                    fontSize:28, fontWeight:800, color:C.dark,
                    letterSpacing:"-.04em", marginBottom:6, lineHeight:1.1,
                  }}>
                    {getGreeting()}, {user?.name?.split(" ")[0]}&nbsp;
                    <span style={{ color:C.violet }}>✦</span>
                  </h1>
                  <p style={{ fontSize:14, color:C.muted, fontWeight:400 }}>
                    Here's what's happening with your notes today.
                  </p>
                </div>

                {/* Date pill */}
                <div style={{
                  padding:"10px 20px",
                  background:"rgba(255,255,255,.58)",
                  backdropFilter:"blur(20px) saturate(200%)",
                  WebkitBackdropFilter:"blur(20px) saturate(200%)",
                  border:"1px solid rgba(255,255,255,.9)",
                  borderRadius:100,
                  fontSize:13, fontWeight:600, color:"rgba(12,10,30,.6)",
                  boxShadow:"inset 0 1.5px 0 rgba(255,255,255,.95)",
                  whiteSpace:"nowrap", flexShrink:0,
                }}>{getDateLabel()}</div>
              </div>
            </div>

            {/* ROW 1 — Stat cards */}
            <div style={{ display:"flex", gap:14, marginBottom:24 }}>
              <StatCard
                delay={0} loading={loading}
                icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}
                iconBg="rgba(124,58,237,.1)" iconColor={C.violet}
                value={data?.total_notes||0}
                label="Notes created"
                trend={`+${data?.weekly_activity?.reduce((s,d)=>s+d.created,0)||0} this week`}
                trendColor="#16a34a"
              />
              <StatCard
                delay={80} loading={loading}
                icon={<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>}
                iconBg="rgba(245,158,11,.1)" iconColor="#d97706"
                value={data?.ai_summaries_generated||0}
                label="AI summaries"
                trend=""
                trendColor={C.violet}
              />
              <StatCard
                delay={160} loading={loading}
                icon={<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></>}
                iconBg="rgba(37,99,235,.08)" iconColor="#2563eb"
                value={data?.total_words||0}
                label="Total words"
                trend="Across all notes"
                trendColor="rgba(12,10,30,.3)"
              />
              <StatCard
                delay={240} loading={loading}
                icon={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>}
                iconBg="rgba(22,163,74,.08)" iconColor="#16a34a"
                value={data?.unique_tags?.length||0}
                label="Tags used"
                trend={`Across ${data?.total_notes||0} notes`}
                trendColor="rgba(12,10,30,.3)"
              />
            </div>

            {/* ROW 2 — Chart + Top Tags */}
            <div style={{ display:"flex", gap:14, marginBottom:24 }}>

              {/* Weekly activity chart */}
              <div style={{
                flex:"0 0 60%", ...fc(), borderRadius:20, padding:"26px 28px",
                animation:"rise .5s cubic-bezier(.22,1,.36,1) 320ms both",
              }}>
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.dark, letterSpacing:"-.025em", marginBottom:4 }}>Weekly Activity</div>
                  <div style={{ fontSize:13, color:C.muted }}>Notes created & edited in the last 7 days</div>
                </div>

                {loading ? (
                  <div style={{ height:220, display:"flex", alignItems:"flex-end", gap:12, padding:"0 8px" }}>
                    {[60,80,40,90,55,75,50].map((h,i)=>(
                      <div key={i} style={{ flex:1, height:`${h}%`, borderRadius:8,
                        background:"rgba(124,58,237,.08)", animation:`pulse 1.4s ${i*.1}s ease-in-out infinite` }}/>
                    ))}
                  </div>
                ) : data?.weekly_activity?.every(d=>d.created===0&&d.edited===0) ? (
                  <div style={{ height:220, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:14 }}>
                    No activity yet — start writing!
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data?.weekly_activity||[]} barCategoryGap="28%" barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,10,30,.05)" vertical={false}/>
                      <XAxis
                        dataKey="day" axisLine={false} tickLine={false}
                        tick={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fill:"rgba(12,10,30,.38)", fontWeight:600 }}
                      />
                      <YAxis
                        allowDecimals={false} axisLine={false} tickLine={false}
                        tick={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fill:"rgba(12,10,30,.3)" }}
                        width={24}
                      />
                      <Tooltip content={<ChartTooltip/>} cursor={{ fill:"rgba(124,58,237,.04)", radius:8 }}/>
                      <Bar dataKey="created" name="Created" fill="#7c3aed" radius={[6,6,0,0]}/>
                      <Bar dataKey="edited"  name="Edited"  fill="rgba(124,58,237,.28)" radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* Legend */}
                <div style={{ display:"flex", gap:18, marginTop:14 }}>
                  {[["#7c3aed","Created"],["rgba(124,58,237,.35)","Edited"]].map(([c,l])=>(
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:c }}/>
                      <span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Tags */}
              <div style={{
                flex:"0 0 calc(40% - 14px)", ...fc(), borderRadius:20, padding:"26px 28px",
                animation:"rise .5s cubic-bezier(.22,1,.36,1) 400ms both",
              }}>
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.dark, letterSpacing:"-.025em", marginBottom:4 }}>Top Tags</div>
                  <div style={{ fontSize:13, color:C.muted }}>Your most used categories</div>
                </div>

                {loading ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {[1,2,3,4,5].map(i=>(
                      <div key={i}>
                        <Skeleton h={14} w="40%" r={6} style={{ marginBottom:8 }}/>
                        <Skeleton h={8} w="100%" r={100}/>
                      </div>
                    ))}
                  </div>
                ) : !data?.top_tags?.length ? (
                  <div style={{ color:C.muted, fontSize:14, paddingTop:40, textAlign:"center" }}>No tags yet</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {data.top_tags.map((t,i)=>{
                      const c=tagColor(t.tag);
                      const pct=Math.round((t.count/maxTagCount)*100);
                      return(
                        <div key={t.tag} style={{ animation:`rise .4s cubic-bezier(.22,1,.36,1) ${400+i*60}ms both` }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                            <span style={{
                              padding:"3px 10px", borderRadius:100,
                              background:c.bg, color:c.text, border:`1px solid ${c.border}`,
                              fontSize:12, fontWeight:600,
                            }}>{t.tag}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{t.count}</span>
                          </div>
                          <div style={{ height:7, borderRadius:100, background:"rgba(12,10,30,.06)", overflow:"hidden" }}>
                            <div style={{
                              height:"100%", borderRadius:100,
                              background:`linear-gradient(90deg,${c.text},${c.text}88)`,
                              width:`${pct}%`,
                              transition:"width .6s cubic-bezier(.22,1,.36,1)",
                            }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ROW 3 — Recent Notes + AI Stats */}
            <div style={{ display:"flex", gap:14, marginBottom:24 }}>

              {/* Recent Notes */}
              <div style={{
                flex:"0 0 55%", ...fc(), borderRadius:20, padding:"26px 28px",
                animation:"rise .5s cubic-bezier(.22,1,.36,1) 480ms both",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:C.dark, letterSpacing:"-.025em", marginBottom:4 }}>Recent Notes</div>
                    <div style={{ fontSize:13, color:C.muted }}>Your latest writing</div>
                  </div>
                  <button onClick={()=>navigate("/app")} style={{
                    background:"none", border:"none", cursor:"pointer",
                    fontSize:13, fontWeight:700, color:C.violet,
                    display:"flex", alignItems:"center", gap:4,
                    padding:"6px 12px", borderRadius:100,
                    transition:"background .15s",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,.08)"}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}
                  >View all →</button>
                </div>

                {loading ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[1,2,3,4,5].map(i=>(
                      <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 0" }}>
                        <Skeleton w={8} h={8} r={100} style={{ flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <Skeleton h={14} w="60%" r={6} style={{ marginBottom:6 }}/>
                          <Skeleton h={11} w="35%" r={6}/>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !data?.recent_notes?.length ? (
                  <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
                    <div style={{ marginBottom:12, fontSize:14 }}>No notes yet.</div>
                    <button onClick={()=>navigate("/app")} style={{
                      padding:"10px 22px", borderRadius:100,
                      border:"none", background:C.dark, color:"#fff",
                      fontFamily:"'DM Sans',sans-serif",
                      fontSize:13, fontWeight:700, cursor:"pointer",
                    }}>Create your first one →</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column" }}>
                    {data.recent_notes.map((n,i)=>(
                      <RecentNoteRow key={n.id} note={n} delay={480+i*50} onClick={()=>navigate("/app")}/>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Stats */}
              <div style={{
                flex:"0 0 calc(45% - 14px)", ...fc(), borderRadius:20, padding:"26px 28px",
                display:"flex", flexDirection:"column",
                animation:"rise .5s cubic-bezier(.22,1,.36,1) 560ms both",
              }}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.dark, letterSpacing:"-.025em", marginBottom:4 }}>AI Assistant Stats</div>
                  <div style={{ fontSize:13, color:C.muted }}>Your AI-powered productivity</div>
                </div>

                {/* Big center stat */}
                <div style={{ textAlign:"center", padding:"28px 0 24px", flex:1 }}>
                  <div style={{
                    fontFamily:"'DM Sans',sans-serif", fontSize:72, fontWeight:800,
                    color:C.violet, lineHeight:1, letterSpacing:"-.05em", marginBottom:8,
                  }}>
                    {loading ? (
                      <Skeleton w={80} h={72} r={12} style={{ margin:"0 auto" }}/>
                    ) : (
                      <AIStat target={data?.ai_summaries_generated||0}/>
                    )}
                  </div>
                  <div style={{ fontSize:14, color:C.muted, fontWeight:500 }}>summaries generated</div>
                </div>

                {/* 3 mini stats */}
                <div style={{ display:"flex", gap:10, marginBottom:22 }}>
                  {[
                    { label:"Summaries",   value: data?.ai_summaries_generated||0,  color:"#7c3aed" },
                    { label:"Action items",value: data?.total_action_items||0,       color:"#2563eb" },
                    { label:"Titles",      value: data?.total_suggested_titles||0,   color:"#16a34a" },
                  ].map(s=>(
                    <div key={s.label} style={{
                      flex:1, padding:"14px 10px", textAlign:"center",
                      background:"rgba(124,58,237,.04)", border:"1px solid rgba(124,58,237,.1)",
                      borderRadius:14,
                    }}>
                      {loading ? (
                        <Skeleton h={24} w="50%" r={6} style={{ margin:"0 auto 6px" }}/>
                      ) : (
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:24, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
                      )}
                      <div style={{ fontSize:11, color:C.muted, fontWeight:500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Badge */}
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:6,
                    padding:"7px 16px", borderRadius:100,
                    background:"rgba(124,58,237,.08)", border:"1px solid rgba(124,58,237,.18)",
                    fontSize:12, fontWeight:700, color:C.violet,
                  }}>✦ AI Assistant</span>
                </div>
              </div>
            </div>

            {/* ROW 4 — Productivity Banner */}
            <div style={{
              borderRadius:24, overflow:"hidden",
              background:"linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)",
              padding:"40px 48px",
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:32,
              boxShadow:"0 12px 40px rgba(109,40,217,.35)",
              animation:"rise .5s cubic-bezier(.22,1,.36,1) 640ms both",
            }}>
              {/* Score */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.6)", letterSpacing:".1em", textTransform:"uppercase", marginBottom:12 }}>
                  Your Productivity Score
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:12 }}>
                  <span style={{
                    fontFamily:"'DM Sans',sans-serif", fontSize:80, fontWeight:800,
                    color:"#fff", lineHeight:1, letterSpacing:"-.05em",
                  }}>{loading ? "—" : scoreCount}</span>
                  <span style={{ fontSize:28, fontWeight:700, color:"rgba(255,255,255,.45)", letterSpacing:"-.02em" }}>/100</span>
                </div>
                <div style={{ fontSize:14, color:"rgba(255,255,255,.55)", fontWeight:400 }}>
                  {score >= 80 ? "Outstanding — you're in the top tier." :
                   score >= 50 ? "Keep writing to improve your score." :
                   "Start creating notes to build your score."}
                </div>
              </div>

              {/* Achievements */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.5)", letterSpacing:".08em", textTransform:"uppercase", marginBottom:4 }}>Achievements</div>
                {achievements.map(a=>(
                  <div key={a.label} style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"9px 18px", borderRadius:100,
                    background: a.earned ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.06)",
                    border: `1px solid ${a.earned ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.1)"}`,
                    opacity: a.earned ? 1 : 0.4,
                    transition:"all .2s",
                  }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,.8)", fontWeight:600 }}>✦</span>
                    <span style={{ fontSize:13, color:"#fff", fontWeight:700, whiteSpace:"nowrap" }}>{a.label}</span>
                    {a.earned && <span style={{ fontSize:11, color:"rgba(255,255,255,.6)", marginLeft:2 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

/* ── helper sub-components ──────────────────────────────────────────────────── */

function AIStat({ target }){
  const v = useCounter(target);
  return <>{v}</>;
}

function RecentNoteRow({ note, delay, onClick }){
  const [hov,setHov]=useState(false);
  const accent = note.tags?.[0] ? tagAccent(note.tags[0]) : "rgba(12,10,30,.15)";

  return(
    <div
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:12, cursor:"pointer",
        padding:"12px 10px", borderRadius:12, marginBottom:4,
        background: hov ? "rgba(124,58,237,.05)" : "transparent",
        border: `1px solid ${hov ? "rgba(124,58,237,.1)" : "transparent"}`,
        transition:"all .15s",
        animation:`rise .4s cubic-bezier(.22,1,.36,1) ${delay}ms both`,
      }}
    >
      <div style={{ width:8, height:8, borderRadius:"50%", background:accent, flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:13.5, fontWeight:700, color:C.dark,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          letterSpacing:"-.01em", marginBottom:4,
        }}>{note.title||"Untitled"}</div>
        <div style={{ display:"flex", gap:5 }}>
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
        </div>
      </div>
      <span style={{ fontSize:11.5, color:"rgba(12,10,30,.3)", flexShrink:0 }}>{rel(note.updated_at)}</span>
    </div>
  );
}
