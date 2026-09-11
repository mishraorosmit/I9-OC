/**
 * LocationStatusMessage.jsx
 * -------------------------
 * Displays context-aware status banners or modals for geolocation
 * and spawn states, matching the I9 design language.
 *
 * States handled:
 *   1. "denied"       — Permission denied; shows GPS-required guidance
 *                       and an "Open Settings" CTA.
 *   2. "unavailable"  — GPS/device hardware error or timeout.
 *   3. "no-spawns"    — Geolocation is active but zero active spawn
 *                       points exist (shows countdown / waiting state).
 *
 * Props:
 *   permission   {'prompt' | 'granted' | 'denied' | 'unavailable'}
 *   error        {string | null}
 *   activeCount  {number} count of active spawn points
 *   onRetry      {Function} optional callback to re-request / retry
 */


export function LocationStatusMessage({
  permission,
  error,
  activeCount = 1,
  onRetry,
}) {
  // If permission is granted and there are active spawns, render nothing
  if (permission === "granted" && activeCount > 0 && !error) {
    return null;
  }

  // State 1: Permission Denied
  if (permission === "denied") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          right: "16px",
          zIndex: 50,
          background: "#FFFCF6",
          border: "1.5px solid #EDE1D3",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 6px 20px rgba(26,19,16,0.12)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#FBEEE1",
              border: "1px solid #EDE1D3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            🧭
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1A1310",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Location Access Required
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#8A7A6D",
                marginTop: "3px",
                lineHeight: "1.4",
              }}
            >
              I9 uses your live GPS position to detect when you walk into spawn
              zones. Please enable location permissions in browser settings.
            </p>
            <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.userAgent.includes("Chrome")) {
                    alert("Click the lock/settings icon in the address bar to allow location permissions.");
                  } else {
                    alert("Please enable location in your device settings.");
                  }
                }}
                style={{
                  background: "#E0672A",
                  color: "#fff",
                  border: "none",
                  borderRadius: "999px",
                  padding: "6px 14px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Open Settings
              </button>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  style={{
                    background: "#FBEEE1",
                    color: "#B5471B",
                    border: "1px solid #EDE1D3",
                    borderRadius: "999px",
                    padding: "6px 14px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: GPS Unavailable or Geolocation Error
  if (permission === "unavailable" || error) {
    return (
      <div
        role="alert"
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          right: "16px",
          zIndex: 50,
          background: "#FFFCF6",
          border: "1.5px solid #EDE1D3",
          borderRadius: "16px",
          padding: "14px 16px",
          boxShadow: "0 4px 16px rgba(26,19,16,0.08)",
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "20px" }}>📡</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#241B16",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            GPS Signal Unavailable
          </div>
          <div style={{ fontSize: "11px", color: "#8A7A6D", marginTop: "2px" }}>
            {error || "Searching for high-accuracy satellite fix..."}
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: "#FBEEE1",
              color: "#B5471B",
              border: "1px solid #EDE1D3",
              borderRadius: "999px",
              padding: "5px 12px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // State 3: No Active Spawns
  if (permission === "granted" && activeCount === 0) {
    return (
      <div
        role="status"
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          right: "16px",
          zIndex: 40,
          background: "rgba(255, 252, 246, 0.95)",
          backdropFilter: "blur(6px)",
          border: "1.5px solid #EDE1D3",
          borderRadius: "16px",
          padding: "14px 18px",
          boxShadow: "0 4px 16px rgba(26,19,16,0.08)",
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#FBEEE1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          ⏳
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#241B16",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            No active spawns right now
          </div>
          <div style={{ fontSize: "11px", color: "#8A7A6D" }}>
            Next point spawn rotation starting soon
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default LocationStatusMessage;
