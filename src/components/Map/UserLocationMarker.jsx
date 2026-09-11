/**
 * UserLocationMarker.jsx
 * ----------------------
 * SVG marker group rendered inside the existing D3/SVG map.
 * Displays the user's current GPS position as a pulsing dot with
 * an accuracy ring, matching the I9 wireframe visual language.
 *
 * Required CSS classes (defined in index.css / App.css):
 *   .user-dot-wrap  — outer group for positioning
 *   .user-ring      — accuracy ring (scales with GPS accuracy)
 *   .user-dot       — solid position dot with pulse animation
 *
 * Props:
 *   latitude   {number}   GPS latitude
 *   longitude  {number}   GPS longitude
 *   accuracy   {number}   GPS accuracy radius in metres
 *   project    {Function} D3 projection: [lng, lat] → [x, y]
 *                          If null/undefined the marker is hidden.
 *
 * The `project` prop maps directly to the D3 geoProjection already
 * used in the SVG map, so no coordinate system changes are needed.
 */


// Pixel-scale factor: converts metres accuracy to SVG pixels.
// This is an approximate scale relative to the campus map SVG
// viewport — adjust to match the actual D3 projection scale.
const ACCURACY_SCALE = 0.8; // px per metre (tune with real projection)

export function UserLocationMarker({ latitude, longitude, accuracy, project }) {
  // Nothing to render until we have both a valid location and projection
  if (
    latitude == null ||
    longitude == null ||
    typeof project !== "function"
  ) {
    return null;
  }

  let x, y;
  try {
    const projected = project([longitude, latitude]);
    if (!projected || projected[0] == null || projected[1] == null) return null;
    [x, y] = projected;
  } catch {
    return null;
  }

  // Accuracy ring radius in SVG pixels (capped so it doesn't flood the map)
  const ringRadius = accuracy != null
    ? Math.min(accuracy * ACCURACY_SCALE, 120)
    : 0;

  return (
    <g className="user-dot-wrap" transform={`translate(${x}, ${y})`}>
      {/* Accuracy ring — soft tinted fill, scales with GPS accuracy */}
      {ringRadius > 0 && (
        <circle
          className="user-ring"
          r={ringRadius}
          fill="rgba(181, 71, 27, 0.10)"
          stroke="rgba(181, 71, 27, 0.25)"
          strokeWidth={1}
        />
      )}

      {/* Outer glow ring */}
      <circle
        r={14}
        fill="rgba(224, 103, 42, 0.18)"
      />

      {/* White border for contrast against map */}
      <circle
        r={9}
        fill="white"
        stroke="white"
        strokeWidth={2}
      />

      {/* Primary user dot */}
      <circle
        className="user-dot"
        r={7}
        fill="#E0672A"
        stroke="#B5471B"
        strokeWidth={1.5}
      />
    </g>
  );
}

export default UserLocationMarker;
