/**
 * @module shadow-calculator
 * @description Computes shadow length and direction for a vertical object given sun position.
 *
 * Dependencies: none (pure math)
 * Conventions:
 *   - azimuth in compass degrees (north-origin, 0-360)
 *   - altitude in degrees; convert to radians before trig
 *   - shadow direction = (azimuth + 180) % 360 (sun is behind you, shadow is in front)
 *   - altitude < 1°: length clamped to 100m (clamped: true)
 *   - altitude <= 0°: length = Infinity (sun below horizon)
 *
 * Known good values:
 *   height=1m, altitude=45° → length=1m
 *   height=2m, altitude=30° → length=3.464m
 *   height=10m, altitude=60° → length=5.774m
 */

import { degToRad } from './solar-convert';
import { Logger, DefaultLogger } from './logger';

export interface ShadowResult {
  lengthMeters: number;
  directionDeg: number;
  clamped: boolean;
}

const CLAMP_ALTITUDE_DEG = 1;
const MAX_SHADOW_LENGTH_M = 100;

/**
 * Compute shadow for an upright object of `heightMeters` with sun at `altitudeDeg`/`azimuthDeg`.
 */
export function computeShadow(
  heightMeters: number,
  azimuthDeg: number,
  altitudeDeg: number,
  log: Logger = new DefaultLogger('shadow-calculator')
): ShadowResult {
  const start = Date.now();

  const directionDeg = ((azimuthDeg + 180) % 360 + 360) % 360;

  if (altitudeDeg <= 0) {
    const result: ShadowResult = { lengthMeters: Infinity, directionDeg, clamped: false };
    log.debug('Shadow: sun below horizon', { altitudeDeg, directionDeg, elapsedMs: Date.now() - start });
    return result;
  }

  if (altitudeDeg < CLAMP_ALTITUDE_DEG) {
    const result: ShadowResult = { lengthMeters: MAX_SHADOW_LENGTH_M, directionDeg, clamped: true };
    log.debug('Shadow: altitude below clamp threshold, returning max length', {
      altitudeDeg, threshold: CLAMP_ALTITUDE_DEG, maxLength: MAX_SHADOW_LENGTH_M, elapsedMs: Date.now() - start
    });
    return result;
  }

  const altRad = degToRad(altitudeDeg);
  const lengthMeters = heightMeters / Math.tan(altRad);

  const result: ShadowResult = { lengthMeters, directionDeg, clamped: false };
  log.debug('Shadow computed', {
    heightMeters, azimuthDeg, altitudeDeg, altRad, lengthMeters, directionDeg, elapsedMs: Date.now() - start
  });

  return result;
}
