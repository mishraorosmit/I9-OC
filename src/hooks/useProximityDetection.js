/**
 * useProximityDetection.js
 * ------------------------
 * Proximity and crossing detection hook powered by Turf.js utilities.
 *
 * Rules:
 *   - Only active spawns (active === true) are evaluated.
 *   - Compares distance against spawn.radius (in metres).
 *   - Distinguishes all 6 states:
 *       1. First location fix: records current status without triggering.
 *       2. Remaining outside: no trigger.
 *       3. Entering radius (OUTSIDE → INSIDE): triggers onPointCrossed(spawn).
 *       4. Remaining inside: no repeated triggers.
 *       5. Leaving radius (INSIDE → OUTSIDE): updates inside tracking.
 *       6. Re-entering later: detects edge, but prevents duplicate claim
 *          during the current session via `claimedSpawnIds`.
 *
 * Integration API:
 *   const { claimedSpawnIds, insideSpawnIds } = useProximityDetection({
 *     location,
 *     spawns,
 *     onPointCrossed,
 *   });
 */

import { useState, useEffect, useRef } from "react";
import { detectCrossedSpawns, isInsideSpawn } from "../utils/proximity";

export function useProximityDetection({
  location,
  spawns,
  onPointCrossed,
  claimedSpawnIds: externalClaimedIds,
}) {
  const prevLocationRef = useRef(null);
  const isFirstFixRef = useRef(true);

  // Set of spawn IDs the user is CURRENTLY physically inside
  const insideSetRef = useRef(new Set());
  const [insideSpawnIds, setInsideSpawnIds] = useState(new Set());

  // Set of spawn IDs that have been claimed during this session
  const [claimedSpawnIds, setClaimedSpawnIds] = useState(new Set());
  const claimedSetRef = useRef(new Set());

  // Stabilize onPointCrossed callback
  const onPointCrossedRef = useRef(onPointCrossed);
  useEffect(() => {
    onPointCrossedRef.current = onPointCrossed;
  });

  // Sync external claimed IDs if provided
  useEffect(() => {
    if (externalClaimedIds) {
      externalClaimedIds.forEach((id) => claimedSetRef.current.add(id));
      setClaimedSpawnIds(new Set(claimedSetRef.current));
    }
  }, [externalClaimedIds]);

  useEffect(() => {
    // Guard against missing / loading / invalid location
    if (
      !location ||
      location.latitude == null ||
      location.longitude == null ||
      location.loading
    ) {
      return;
    }

    const currentLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
    };

    const safeSpawns = Array.isArray(spawns) ? spawns : [];
    const activeSpawns = safeSpawns.filter((s) => s && s.active === true);

    // 1. First location fix: seed initial inside state, DO NOT auto-claim
    if (isFirstFixRef.current) {
      activeSpawns.forEach((spawn) => {
        if (isInsideSpawn(currentLocation, spawn)) {
          insideSetRef.current.add(spawn.id);
        }
      });
      setInsideSpawnIds(new Set(insideSetRef.current));
      prevLocationRef.current = currentLocation;
      isFirstFixRef.current = false;
      return;
    }

    // 2. Detect transitions from OUTSIDE → INSIDE
    const crossed = detectCrossedSpawns(
      prevLocationRef.current,
      currentLocation,
      activeSpawns
    );

    let hasNewClaim = false;

    crossed.forEach((spawn) => {
      // Always track that user is currently inside
      insideSetRef.current.add(spawn.id);

      // Duplicate-claim prevention: only fire claim if not claimed this session
      if (!claimedSetRef.current.has(spawn.id)) {
        claimedSetRef.current.add(spawn.id);
        hasNewClaim = true;
        onPointCrossedRef.current?.(spawn);
      }
    });

    if (hasNewClaim) {
      setClaimedSpawnIds(new Set(claimedSetRef.current));
    }

    // 3. Detect transitions from INSIDE → OUTSIDE (leaving radius)
    let insideChanged = false;
    activeSpawns.forEach((spawn) => {
      if (insideSetRef.current.has(spawn.id)) {
        const stillInside = isInsideSpawn(currentLocation, spawn);
        if (!stillInside) {
          // User has left the radius!
          insideSetRef.current.delete(spawn.id);
          insideChanged = true;
        }
      }
    });

    if (insideChanged || crossed.length > 0) {
      setInsideSpawnIds(new Set(insideSetRef.current));
    }

    prevLocationRef.current = currentLocation;
  }, [location, spawns]);

  return {
    claimedSpawnIds,
    insideSpawnIds,
  };
}

export default useProximityDetection;
