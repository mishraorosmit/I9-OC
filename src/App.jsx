import { useState } from "react";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";

// This App.jsx is a quick local preview only — for seeing your two
// pages work inside a real tab bar before they're wired into the
// actual app's navigation (which your team lead will set up, likely
// with React Router). Once that's in place, this file goes back to
// rendering the real app instead of this preview.

export default function App() {
  const [activeTab, setActiveTab] = useState("leaderboard"); // "map" | "leaderboard" | "profile"

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "32px", background: "#eee", minHeight: "100vh" }}>
      <div
        style={{
          width: "375px",
          height: "812px",
          border: "2px solid #1A1310",
          borderRadius: "36px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        {/* Screen content — swaps based on the active tab */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {activeTab === "map" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8A7A6D", fontSize: "13px" }}>
              Map page — not built yet
            </div>
          )}
          {activeTab === "leaderboard" && <LeaderboardPage />}
          {activeTab === "profile" && <ProfilePage />}
        </div>

        {/* Tab bar */}
        <div style={{ height: "64px", flexShrink: 0, display: "flex", borderTop: "1px solid #EDE1D3", background: "#fff" }}>
          {[
            { key: "map", label: "Map" },
            { key: "leaderboard", label: "Leaderboard" },
            { key: "profile", label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.key}
              aria-current={activeTab === tab.key ? "page" : undefined}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                fontSize: "9px",
                fontWeight: 700,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: activeTab === tab.key ? "#E0672A" : "#8A7A6D",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  background: activeTab === tab.key ? "#E0672A" : "#EDE1D3",
                }}
              />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
