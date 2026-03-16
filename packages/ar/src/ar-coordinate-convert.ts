/**
 * Converts solar azimuth and altitude to AR spatial coordinates.
 * Convention:
 * - Y is up
 * - -Z is north
 * - +X is east
 * - Angles are in degrees, azimuth is north-origin.
 * @param azimuthDeg Compass azimuth in degrees
 * @param altitudeDeg Solar elevation above horizon in degrees
 * @param radius Radius of the projected dome in meters
 * @returns { x, y, z } coordinates
 */
export function solarToWorld(azimuthDeg: number, altitudeDeg: number, radius: number = 50) {
  const azRad = azimuthDeg * (Math.PI / 180);
  const altRad = altitudeDeg * (Math.PI / 180);

  // Math matches gravityAndHeading
  const x = radius * Math.cos(altRad) * Math.sin(azRad);
  const y = radius * Math.sin(altRad);
  const z = -radius * Math.cos(altRad) * Math.cos(azRad);

  return { x, y, z };
}

/**
 * Converts AR spatial coordinates back to solar azimuth and altitude.
 * @param x X coordinate (east)
 * @param y Y coordinate (up)
 * @param z Z coordinate (-north)
 * @returns { azimuthDeg, altitudeDeg } in degrees
 */
export function worldToSolar(x: number, y: number, z: number) {
  const radius = Math.sqrt(x * x + y * y + z * z);
  
  if (radius === 0) {
    return { azimuthDeg: 0, altitudeDeg: 0 };
  }

  const altRad = Math.asin(y / radius);
  
  // atan2(y, x) -> atan2(x, -z) for azimuth from north
  let azRad = Math.atan2(x, -z);
  
  // Normalize azimuth to 0-360
  if (azRad < 0) {
    azRad += 2 * Math.PI;
  }

  const azimuthDeg = azRad * (180 / Math.PI);
  const altitudeDeg = altRad * (180 / Math.PI);

  return { azimuthDeg, altitudeDeg };
}