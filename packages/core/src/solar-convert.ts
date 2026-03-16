import { Logger, logger as defaultLogger } from './logger';

/**
 * Converts radians to degrees.
 * @param rad Radians
 * @returns Degrees
 */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

/**
 * Converts degrees to radians.
 * @param deg Degrees
 * @returns Radians
 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Converts suncalc azimuth (south-origin, radians) to compass azimuth (north-origin, degrees).
 * Uses ((deg % 360) + 360) % 360 for negative safety.
 *
 * @param azimuthRad suncalc azimuth in radians (0 = south, PI/2 = west, -PI/2 = east)
 * @returns compass azimuth in degrees [0, 360) (0 = north, 90 = east)
 */
export function suncalcToCompass(azimuthRad: number, log?: Logger): number {
  const l = log ?? defaultLogger;
  const azimuthDeg = radToDeg(azimuthRad);
  
  // suncalc: 0=south. compass: 180=south. Shift by +180.
  const rawCompass = azimuthDeg + 180;
  
  // Wrap safely using JS modulo trick for negatives
  const compassDeg = ((rawCompass % 360) + 360) % 360;
  
  l.debug('Converted suncalc azimuth to compass', {
    inputRad: azimuthRad,
    intermediateDeg: azimuthDeg,
    outputDeg: compassDeg
  });
  
  return compassDeg;
}
