/**
 * useLiveLocation.js
 * ------------------
 * Continuously tracks user GPS coordinates using navigator.geolocation.watchPosition().
 *
 * State exposed:
 *   {
 *     latitude: number | null,
 *     longitude: number | null,
 *     accuracy: number | null,
 *     loading: boolean,
 *     permission: 'prompt' | 'granted' | 'denied' | 'unavailable',
 *     error: string | null
 *   }
 *
 * Handles:
 *   - Continuous movement tracking
 *   - Accurate browser geolocation options
 *   - Permission denied & permission revoked
 *   - Unavailable GPS & timeout errors
 *   - Memory leak prevention via clearWatch() on unmount/cleanup
 */

import { useState, useEffect, useRef } from "react";

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

export function useLiveLocation() {
  const [state, setState] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: true,
    permission: "prompt",
    error: null,
  });

  const watchIdRef = useRef(null);

  useEffect(() => {
    // Check browser support
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        permission: "unavailable",
        error: "Geolocation is not supported on this device/browser.",
      }));
      return;
    }

    // Monitor permission state changes if supported
    let permissionStatus = null;
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          permissionStatus = status;
          if (status.state === "denied") {
            setState((prev) => ({
              ...prev,
              loading: false,
              permission: "denied",
              error: "Location permission has been denied.",
            }));
          }
          status.onchange = () => {
            if (status.state === "denied") {
              setState((prev) => ({
                ...prev,
                permission: "denied",
                error: "Location permission revoked.",
              }));
            } else if (status.state === "granted") {
              setState((prev) => ({ ...prev, permission: "granted" }));
            }
          };
        })
        .catch(() => {
          // Permissions API query not supported for geolocation in some browsers
        });
    }

    function onSuccess(pos) {
      if (!pos || !pos.coords) return;
      setState({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        loading: false,
        permission: "granted",
        error: null,
      });
    }

    function onError(err) {
      // 1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT
      let permission = "prompt";
      let errorMsg = "Unable to retrieve location.";

      if (err.code === 1) {
        permission = "denied";
        errorMsg = "Location permission was denied.";
      } else if (err.code === 2) {
        permission = "unavailable";
        errorMsg = "GPS signal is currently unavailable.";
      } else if (err.code === 3) {
        errorMsg = "Location request timed out.";
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        permission,
        error: errorMsg,
      }));
    }

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        GEO_OPTIONS
      );
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        permission: "unavailable",
        error: e.message || "Failed to start location tracking.",
      }));
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  return state;
}

export default useLiveLocation;
