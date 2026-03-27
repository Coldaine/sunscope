/**
 * @fileoverview Shadow projection calculations.
 *
 * This module converts solar altitude and azimuth into a practical shadow
 * length and direction for the UI's shadow calculator sheet. It depends on the
 * solar conversion helpers to keep trigonometric boundaries explicit.
 */

import { Logger, createLogger, measureElapsedMs } from './logger';
import { degToRad, normalizeDegrees } from './solar-convert';
import { ShadowResult } from './types';

const MIN_ALTITUDE_FOR_UNCLAMPED_RESULT = 1;
const CLAMPED_SHADOW_LENGTH_METERS = 100;

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'shadow-calculator' });
}

export function calculateShadow(
  heightMeters: number,
  altitudeDeg: number,
  azimuthDeg: number,
  logger?: Logger
): ShadowResult {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('calculateShadow.entry', {
    heightMeters,
    altitudeDeg,
    azimuthDeg
  });

  const direction = normalizeDegrees(azimuthDeg + 180, moduleLogger.child('solar-convert'));

  if (altitudeDeg <= 0) {
    moduleLogger.warn('calculateShadow.belowHorizon', {
      altitudeDeg,
      direction,
      elapsedMs: measureElapsedMs(startTime)
    });
    return {
      length: Number.POSITIVE_INFINITY,
      direction,
      clamped: false
    };
  }

  if (altitudeDeg < MIN_ALTITUDE_FOR_UNCLAMPED_RESULT) {
    moduleLogger.warn('calculateShadow.clamped', {
      altitudeDeg,
      clampMeters: CLAMPED_SHADOW_LENGTH_METERS
    });
    return {
      length: CLAMPED_SHADOW_LENGTH_METERS,
      direction,
      clamped: true
    };
  }

  const altitudeRad = degToRad(altitudeDeg, moduleLogger.child('solar-convert'));
  const length = heightMeters / Math.tan(altitudeRad);

  moduleLogger.debug('calculateShadow.exit', {
    heightMeters,
    altitudeDeg,
    altitudeRad,
    length,
    direction,
    elapsedMs: measureElapsedMs(startTime)
  });

  return {
    length,
    direction,
    clamped: false
  };
}
