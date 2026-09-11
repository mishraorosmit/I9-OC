/**
 * MapPage.jsx
 * -----------
 * Core Map Screen for I9.
 *
 * Integrates:
 *   - useLiveLocation: Real-time browser GPS tracking
 *   - useProximityDetection: Turf.js proximity & OUTSIDE → INSIDE crossing detection
 *   - claimSpawn: Modular Supabase-ready auto-claim flow
 *   - UserLocationMarker: Live GPS marker with pulse animation & accuracy ring
 *   - ClaimToast: "Point claimed, +N pts" auto-dismissing toast notifications
 *   - LocationStatusMessage: Permission denied / GPS unavailable / No active spawns
 *
 * Provides developer/testing tools to simulate walking between spawn zones,
 * testing boundary crossings, testing permission states, and verifying edge cases.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { useLiveLocation } from "../hooks/useLiveLocation";
import { useProximityDetection } from "../hooks/useProximityDetection";
import { claimSpawn } from "../lib/claimSpawn";
import { UserLocationMarker } from "../components/Map/UserLocationMarker";
import { ClaimToast } from "../components/Map/ClaimToast";
import { LocationStatusMessage } from "../components/Map/LocationStatusMessage";

// Campus reference coordinates
const CAMPUS_CENTER_LNG = 85.8193;
const CAMPUS_CENTER_LAT = 20.3533;

// Default Admin-defined Campus Spawn Points
const INITIAL_SPAWNS = [
  {
    id: "spawn-1",
    name: "Library archway",
    latitude: 20.3538,
    longitude: 85.8188,
    radius: 30, // 30 metres
    points: 10,
    active: true,
  },
  {
    id: "spawn-2",
    name: "Students Activity Centre",
    latitude: 20.3528,
    longitude: 85.8196,
    radius: 35, // 35 metres
    points: 15,
    active: true,
  },
  {
    id: "spawn-3",
    name: "Old oak tree",
    latitude: 20.3545,
    longitude: 85.8202,
    radius: 25, // 25 metres
    points: 10,
    active: true,
  },
  {
    id: "spawn-4",
    name: "Clocktower",
    latitude: 20.3519,
    longitude: 85.8182,
    radius: 20, // 20 metres
    points: 20,
    active: false, // Inactive spawn test
  },
];

export default function MapPage() {
  const liveLocation = useLiveLocation();

  // Spawns list state
  const [spawns, setSpawns] = useState(INITIAL_SPAWNS);

  // Simulation mode (allows testing movement on desktop / without physical walking)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLocation, setSimLocation] = useState({
    latitude: 20.3520, // starts well outside spawn 1 & 2
    longitude: 85.8175,
    accuracy: 8,
    loading: false,
    permission: "granted",
    error: null,
  });

  // Simulated permission overrides for manual testing
  const [overridePermission, setOverridePermission] = useState(null);

  // Determine effective location passed to proximity & marker
  const effectiveLocation = useMemo(() => {
    if (overridePermission) {
      return {
        ...liveLocation,
        permission: overridePermission,
        error: overridePermission === "unavailable" ? "Location hardware error" : null,
      };
    }
    if (isSimulating) {
      return simLocation;
    }
    return liveLocation;
  }, [liveLocation, isSimulating, simLocation, overridePermission]);

  // Active toasts stack
  const [toasts, setToasts] = useState([]);

  // Session claims tracking
  const [claimedSpawnIds, setClaimedSpawnIds] = useState(new Set());

  // D3 Mercator Projection calibrated to campus SVG viewBox
  const projection = useMemo(() => {
    return d3
      .geoMercator()
      .center([CAMPUS_CENTER_LNG, CAMPUS_CENTER_LAT])
      .scale(18000000)
      .translate([2200, 1450]);
  }, []);

  // Conversion: 1 metre ≈ SVG pixel units in this projection
  const METRE_TO_SVG_PIXELS = 1.35;

  // Handle spawn crossing: executed only on OUTSIDE → INSIDE transition
  const handlePointCrossed = useCallback(
    async (spawn) => {
      // 1. Check if already claimed during this session
      if (claimedSpawnIds.has(spawn.id)) return;

      // 2. Execute claim through modular service
      const result = await claimSpawn(spawn);

      if (result.success) {
        // 3. Mark as claimed
        setClaimedSpawnIds((prev) => new Set([...prev, spawn.id]));

        // 4. Trigger Toast: "Point claimed, +N pts"
        const toastId = `toast-${spawn.id}-${Date.now()}`;
        setToasts((prev) => {
          // Avoid duplicate notifications for same spawn
          if (prev.some((t) => t.spawnId === spawn.id)) return prev;
          return [
            ...prev,
            {
              id: toastId,
              spawnId: spawn.id,
              name: spawn.name,
              points: spawn.points,
            },
          ];
        });
      }
    },
    [claimedSpawnIds]
  );

  // Proximity Detection hook
  const { insideSpawnIds } = useProximityDetection({
    location: effectiveLocation,
    spawns,
    onPointCrossed: handlePointCrossed,
    claimedSpawnIds,
  });

  // Toast dismiss handler
  const handleDismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  // SVG ref for D3 Zoom
  const svgRef = useRef(null);
  const gRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3
      .zoom()
      .scaleExtent([0.4, 4.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initial center on campus
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(-250, -400).scale(0.55)
    );
  }, []);

  // Helper: Walk directly into a spawn radius (for testing)
  const walkToSpawn = (spawn) => {
    setIsSimulating(true);
    // Position user ~2 metres inside the spawn center
    setSimLocation({
      latitude: spawn.latitude + 0.00001,
      longitude: spawn.longitude + 0.00001,
      accuracy: 6,
      loading: false,
      permission: "granted",
      error: null,
    });
  };

  // Helper: Step outside all spawns
  const stepOutside = () => {
    setIsSimulating(true);
    setSimLocation({
      latitude: 20.3510,
      longitude: 85.8160,
      accuracy: 10,
      loading: false,
      permission: "granted",
      error: null,
    });
  };

  const activeSpawns = spawns.filter((s) => s.active);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#FBF6EE] overflow-hidden select-none">
      {/* 1. Header Bar */}
      <div className="z-20 flex items-center justify-between px-4 py-3 bg-[#FFFCF6] border-b border-[#EDE1D3] shadow-xs">
        <div>
          <h1
            className="text-[17px] font-bold text-[#1A1310] leading-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Live Campus Map
          </h1>
          <p className="text-[11px] text-[#8A7A6D] mt-1 font-medium">
            Walk into spawn circles to auto-claim points
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FBEEE1] border border-[#EDE1D3]">
          <span
            className={`w-2 h-2 rounded-full ${
              effectiveLocation.permission === "granted"
                ? "bg-[#E0672A] animate-ping"
                : "bg-gray-400"
            }`}
          />
          <span className="text-[10px] font-bold text-[#B5471B] uppercase tracking-wider">
            {isSimulating ? "SIMULATOR" : effectiveLocation.permission === "granted" ? "GPS LIVE" : "NO FIX"}
          </span>
        </div>
      </div>

      {/* 2. Context Status Alerts (Permission denied / error / no spawns) */}
      <LocationStatusMessage
        permission={effectiveLocation.permission}
        error={effectiveLocation.error}
        activeCount={activeSpawns.length}
        onRetry={() => {
          setOverridePermission(null);
          window.location.reload();
        }}
      />

      {/* 3. Temporary Claim Toasts: "Point claimed, +N pts" */}
      <ClaimToast toasts={toasts} onDismiss={handleDismissToast} duration={3200} />

      {/* 4. Interactive SVG Map Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#F2EDE4]">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          viewBox="1415 -39 1582.523 2968.98"
          preserveAspectRatio="xMidYMid slice"
        >
          <g ref={gRef}>
            {/* Base Campus SVG map */}
            <image
              href="/campus-map-CLEAN.svg"
              x="1415"
              y="-39"
              width="1582.523"
              height="2968.98"
            />

            {/* Spawn Zones & Markers */}
            {spawns.map((spawn) => {
              if (!spawn.active) return null;
              const coords = projection([spawn.longitude, spawn.latitude]);
              if (!coords) return null;
              const [sx, sy] = coords;
              const radiusPx = spawn.radius * METRE_TO_SVG_PIXELS;
              const isInside = insideSpawnIds.has(spawn.id);
              const isClaimed = claimedSpawnIds.has(spawn.id);

              return (
                <g key={spawn.id} className="transition-all duration-300">
                  {/* Spawn Radius Boundary Circle */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={radiusPx}
                    fill={
                      isClaimed
                        ? "rgba(138, 122, 109, 0.12)"
                        : isInside
                        ? "rgba(224, 103, 42, 0.28)"
                        : "rgba(224, 103, 42, 0.12)"
                    }
                    stroke={isClaimed ? "#8A7A6D" : "#E0672A"}
                    strokeWidth={isInside ? 3 : 2}
                    strokeDasharray={isClaimed ? "4 4" : "6 4"}
                  />

                  {/* Spawn Center Pin */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={18}
                    fill={isClaimed ? "#8A7A6D" : "#B5471B"}
                    stroke="#FFFCF6"
                    strokeWidth={2.5}
                    className="filter drop-shadow-md"
                  />

                  {/* Points Badge */}
                  <text
                    x={sx}
                    y={sy + 4}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="'Space Grotesk', sans-serif"
                  >
                    {isClaimed ? "✓" : `+${spawn.points}`}
                  </text>

                  {/* Spawn Label */}
                  <text
                    x={sx}
                    y={sy - 24}
                    textAnchor="middle"
                    fill="#241B16"
                    fontSize="13"
                    fontWeight="700"
                    fontFamily="'Space Grotesk', sans-serif"
                    className="filter drop-shadow-xs"
                  >
                    {spawn.name}
                  </text>
                </g>
              );
            })}

            {/* LIVE USER LOCATION MARKER */}
            <UserLocationMarker
              latitude={effectiveLocation.latitude}
              longitude={effectiveLocation.longitude}
              accuracy={effectiveLocation.accuracy}
              project={projection}
            />
          </g>
        </svg>

        {/* Floating Quick Navigation & Stats Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2">
          {/* Quick Walk Test Drawer */}
          <div className="bg-[#FFFCF6]/95 backdrop-blur-sm border border-[#EDE1D3] rounded-2xl p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-[#1A1310] flex items-center gap-1">
                <span>🚶 GPS Movement Tester</span>
              </span>
              <span className="text-[10px] text-[#8A7A6D]">
                Acc: {effectiveLocation.accuracy ? `±${Math.round(effectiveLocation.accuracy)}m` : "N/A"}
              </span>
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => walkToSpawn(spawns[0])}
                className="py-1.5 px-2 bg-[#FBEEE1] hover:bg-[#F3E0CF] text-[#B5471B] font-bold rounded-lg truncate border border-[#EDE1D3] text-left"
              >
                📍 Walk to Library (+10)
              </button>
              <button
                type="button"
                onClick={() => walkToSpawn(spawns[1])}
                className="py-1.5 px-2 bg-[#FBEEE1] hover:bg-[#F3E0CF] text-[#B5471B] font-bold rounded-lg truncate border border-[#EDE1D3] text-left"
              >
                📍 Walk to SAC (+15)
              </button>
              <button
                type="button"
                onClick={stepOutside}
                className="py-1.5 px-2 bg-[#FFFCF6] hover:bg-gray-100 text-[#8A7A6D] font-semibold rounded-lg border border-[#EDE1D3] text-left"
              >
                👣 Step Outside Radius
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSimulating(false);
                  setOverridePermission(null);
                }}
                className={`py-1.5 px-2 font-semibold rounded-lg border text-left ${
                  !isSimulating && !overridePermission
                    ? "bg-[#E0672A] text-white border-transparent"
                    : "bg-[#FFFCF6] text-[#241B16] border-[#EDE1D3]"
                }`}
              >
                🛰️ Real Device GPS
              </button>
            </div>

            {/* State Testing Bar (Permission denied / Unavailable / No spawns) */}
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#F3E9DA]">
              <span className="text-[9px] font-bold text-[#8A7A6D] uppercase">Simulate State:</span>
              <button
                type="button"
                onClick={() => setOverridePermission("denied")}
                className="text-[9.5px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-red-50 text-red-700 font-semibold"
              >
                Denied
              </button>
              <button
                type="button"
                onClick={() => setOverridePermission("unavailable")}
                className="text-[9.5px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-amber-50 text-amber-800 font-semibold"
              >
                No GPS
              </button>
              <button
                type="button"
                onClick={() => setSpawns([])}
                className="text-[9.5px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-orange-50 text-[#B5471B] font-semibold"
              >
                0 Spawns
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpawns(INITIAL_SPAWNS);
                  setOverridePermission(null);
                  setClaimedSpawnIds(new Set());
                }}
                className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#FBEEE1] text-[#B5471B] font-bold ml-auto"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
