export default function Spinner({ size = 32, fullScreen = false }) {
  const spinner = (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: size,
        height: size,
        border: `${Math.max(2, size * 0.09)}px solid rgba(124,58,237,.18)`,
        borderTopColor: "#7c3aed",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }} />
    </>
  );

  if (!fullScreen) return spinner;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#eef2ff",
    }}>
      {spinner}
    </div>
  );
}
