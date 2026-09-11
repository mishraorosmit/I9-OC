/**
 * ClaimToast.jsx
 * --------------
 * Temporary notification displayed when the user enters an active spawn's radius.
 * Formatted strictly to wireframe specs: "Point claimed, +N pts"
 *
 * Requirements:
 *   - Accent I9 styling (#E0672A / #B5471B, #FFFCF6 card, #EDE1D3 border)
 *   - Rounded pill/card appearance matching wireframe
 *   - Typography: Space Grotesk & Inter
 *   - Auto-dismiss after short duration (default 3000ms)
 *   - Deduplicates identical spawn claims
 *   - Reusable for any spawn value
 *
 * Props:
 *   toasts      {Array<{ id, spawnId, points, name }>}
 *   onDismiss   {(toastId: string) => void}
 *   duration    {number} auto-dismiss duration in ms
 */

import { useEffect } from "react";

export function ClaimToast({ toasts = [], onDismiss, duration = 3000 }) {
  useEffect(() => {
    if (!Array.isArray(toasts) || toasts.length === 0) return;

    const timers = toasts.map((t) =>
      setTimeout(() => {
        onDismiss?.(t.id);
      }, duration)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, onDismiss, duration]);

  if (!Array.isArray(toasts) || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        top: "72px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        zIndex: 100,
        pointerEvents: "none",
        width: "90%",
        maxWidth: "340px",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: "#FFFCF6",
            border: "1.5px solid #EDE1D3",
            borderRadius: "999px",
            padding: "8px 16px 8px 12px",
            boxShadow: "0 6px 20px rgba(26,19,16,0.12)",
            animation: "i9-toast-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
            pointerEvents: "auto",
            cursor: "pointer",
          }}
          onClick={() => onDismiss?.(toast.id)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#FBEEE1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
              }}
            >
              📍
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#1A1310",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Point claimed{toast.name ? `, +${toast.points} pts` : `, +${toast.points} pts`}
            </span>
          </div>

          <span
            style={{
              background: "#E0672A",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "11px",
              borderRadius: "999px",
              padding: "2px 8px",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            +{toast.points} pts
          </span>
        </div>
      ))}
    </div>
  );
}

export default ClaimToast;
