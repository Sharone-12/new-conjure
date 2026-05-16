import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";

const TAG_PALETTE = [
  { bg: "#f3f0ff", text: "#7c3aed", border: "#ddd0ff" },
  { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  { bg: "#fdf2f8", text: "#db2777", border: "#fbcfe8" },
];

function tagColor(tag) {
  const n = [...(tag || "")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return TAG_PALETTE[n % TAG_PALETTE.length];
}

function fmt(dt) {
  if (!dt) return "";
  return new Date(dt.endsWith("Z") ? dt : dt + "Z").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function SharedNote() {
  const { shareId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    client.get(`/notes/shared/${shareId}`)
      .then(res => setNote(res.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [shareId]);

  const S = {
    page: {
      minHeight: "100vh", background: "#f8f9ff",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    nav: {
      padding: "14px 32px",
      background: "rgba(255,255,255,.8)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid #f0edf6",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    logo: {
      fontWeight: 800, fontSize: 17, color: "#0f0f1a",
      textDecoration: "none", letterSpacing: "-.025em",
    },
    cta: {
      padding: "9px 20px", borderRadius: 100,
      background: "#7c3aed", border: "none", color: "#fff",
      fontSize: 13.5, fontWeight: 600, cursor: "pointer",
      textDecoration: "none", display: "inline-block",
      boxShadow: "0 4px 14px rgba(124,58,237,.3)",
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <div style={S.page}>
        {/* Nav */}
        <nav style={S.nav}>
          <a href="/" style={S.logo}><span style={{ color: "#7c3aed" }}>✦</span> Conjure</a>
          <Link to="/signup" style={S.cta}>Create your own notes →</Link>
        </nav>

        {/* Content */}
        <div style={{ maxWidth: 740, margin: "0 auto", padding: "52px 24px 80px" }}>
          {loading && (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              {[80, 60, 90, 50].map((w, i) => (
                <div key={i} style={{
                  height: 14, borderRadius: 8, background: "#e9e4f8",
                  marginBottom: 14, width: `${w}%`,
                  animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          )}

          {notFound && !loading && (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f0f1a", marginBottom: 10 }}>Note not found</h2>
              <p style={{ fontSize: 15, color: "#94a3b8", marginBottom: 28 }}>
                This note is private or no longer exists.
              </p>
              <Link to="/" style={{ ...S.cta, textDecoration: "none" }}>Go to Conjure →</Link>
            </div>
          )}

          {note && !loading && (
            <article>
              {/* Badge */}
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 100,
                  background: "#f3f0ff", border: "1px solid #ddd0ff",
                  fontSize: 12, fontWeight: 600, color: "#7c3aed",
                }}>
                  <span>✦</span> Shared via Conjure
                </span>
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 38, fontWeight: 800, color: "#0f0f1a",
                letterSpacing: "-.04em", lineHeight: 1.15, marginBottom: 16,
              }}>
                {note.title || "Untitled"}
              </h1>

              {/* Meta */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {(note.tags || []).map(tag => {
                  const c = tagColor(tag);
                  return (
                    <span key={tag} style={{
                      padding: "4px 12px", borderRadius: 100,
                      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                      fontSize: 12, fontWeight: 600,
                    }}>{tag}</span>
                  );
                })}
                <span style={{ fontSize: 12.5, color: "#94a3b8" }}>
                  Updated {fmt(note.updated_at)}
                </span>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "#f0edf6", marginBottom: 32 }} />

              {/* Content */}
              <div style={{
                fontSize: 16, color: "#1e1b3a", lineHeight: 1.85,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {note.content || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>This note has no content.</span>}
              </div>
            </article>
          )}
        </div>

        {/* Footer CTA */}
        {note && !loading && (
          <div style={{
            borderTop: "1px solid #f0edf6", padding: "32px 24px",
            textAlign: "center", background: "#fff",
          }}>
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 14 }}>
              Want to write and organise your own notes with AI?
            </p>
            <Link to="/signup" style={{ ...S.cta, textDecoration: "none" }}>
              Try Conjure for free →
            </Link>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }`}</style>
    </>
  );
}
