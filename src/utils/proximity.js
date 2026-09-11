/**
 * proximity.js
 * ------------
 * Pure geospatial utility functions powered by Turf.js.
 * These are kept UI-free and framework-free so they can be tested
 * or reused outside of React.
 *
 * Spawn shape:
 *   { id, name, latitude, longitude, radius (metres), points, active }
 *
 * UserLocation shape:
 *   { latitude, longitude }
 */

import * as turf from "@turf/turf";

/**
 * isInsideSpawn
 * Returns true when the user is within the spawn's radius.
 *
 * @param {{ latitude: number, longitude: number }} userLocation
 * @param {{ latitude: number, longitude: number, radius: number }} spawn
 * @returns {boolean}
 */
export function isInsideSpawn(userLocation, spawn) {
  if (
    userLocation == null ||
    spawn == null ||
    userLocation.latitude == null ||
    userLocation.longitude == null ||
    spawn.latitude == null ||
    spawn.longitude == null ||
    spawn.radius == null
  ) {
    return false;
  }

  try {
    const userPoint = turf.point([userLocation.longitude, userLocation.latitude]);
    const spawnPoint = turf.point([spawn.longitude, spawn.latitude]);
    const distanceMetres = turf.distance(userPoint, spawnPoint, { units: "meters" });
    return distanceMetres <= spawn.radius;
  } catch {
    return false;
  }
}

/**
 * distanceToSpawn
 * Returns the distance in metres from the user to the spawn centre.
 * Returns Infinity for invalid inputs.
 *
 * @param {{ latitude: number, longitude: number }} userLocation
 * @param {{ latitude: number, longitude: number }} spawn
 * @returns {number}
 */
export function distanceToSpawn(userLocation, spawn) {
  if (
    userLocation == null ||
    spawn == null ||
    userLocation.latitude == null ||
    userLocation.longitude == null ||
    spawn.latitude == null ||
    spawn.longitude == null
  ) {
    return Infinity;
  }

  try {
    const userPoint = turf.point([userLocation.longitude, userLocation.latitude]);
    const spawnPoint = turf.point([spawn.longitude, spawn.latitude]);
    return turf.distance(userPoint, spawnPoint, { units: "meters" });
  } catch {
    return Infinity;
  }
}

/**
 * detectCrossedSpawns
 * Determines which spawns the user has newly crossed INTO on this
 * location update (OUTSIDE → INSIDE transition only).
 *
 * - Only evaluates spawns where active === true.
 * - A spawn is "crossed" when it was outside the previous location
 *   but is inside the current location.
 * - Returns an array of crossed spawn objects (may be empty).
 *
 * @param {{ latitude: number, longitude: number } | null} previousLocation
 * @param {{ latitude: number, longitude: number }} currentLocation
 * @param {Array<{ id, latitude, longitude, radius, active }>} spawns
 * @returns {Array} — spawns that were newly entered on this update
 */
export function detectCrossedSpawns(previousLocation, currentLocation, spawns) {
  if (!currentLocation || !Array.isArray(spawns)) return [];

  const activeSpawns = spawns.filter(
    (s) => s && s.active === true && s.latitude != null && s.longitude != null && s.radius != null
  );

  return activeSpawns.filter((spawn) => {
    const insideNow = isInsideSpawn(currentLocation, spawn);
    if (!insideNow) return false; // not inside now, no crossing

    // First-ever location fix: treat as already inside, do NOT trigger
    // (prevents auto-claim on app open if user is already standing
    //  inside a radius; the hook handles first-fix suppression)
    if (previousLocation == null) return false;

    const insideBefore = isInsideSpawn(previousLocation, spawn);
    // Only trigger on the OUTSIDE → INSIDE edge
    return !insideBefore;
  });
}

/**
 * getActiveSpawns
 * Filters the full spawn list to only those with active === true.
 *
 * @param {Array} spawns
 * @returns {Array}
 */
export function getActiveSpawns(spawns) {
  if (!Array.isArray(spawns)) return [];
  return spawns.filter((s) => s && s.active === true);
}
