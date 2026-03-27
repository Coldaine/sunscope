/**
 * @fileoverview Solar angle conversion helpers.
 *
 * This is the only module that converts suncalc's south-origin radians into
 * SunScope's north-origin degrees. All downstream modules depend on these
 * helpers instead of touching raw suncalc angles directly.
 */

import { Logger, createLogger, measureElapsedMs } from './logger';

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'solar-convert' });
}

export function radToDeg(rad: number, logger?: Logger): number {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('radToDeg.entry', { radians: rad });

  const degrees = rad * (180 / Math.PI);

  moduleLogger.debug('radToDeg.exit', {
    radians: rad,
    degrees,
    elapsedMs: measureElapsedMs(startTime)
  });
  return degrees;
}

export function degToRad(deg: number, logger?: Logger): number {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('degToRad.entry', { degrees: deg });

  const radians = deg * (Math.PI / 180);

  moduleLogger.debug('degToRad.exit', {
    degrees: deg,
    radians,
    elapsedMs: measureElapsedMs(startTime)
  });
  return radians;
}

export function normalizeDegrees(deg: number, logger?: Logger): number {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('normalizeDegrees.entry', { degrees: deg });

  const normalized = ((deg % 360) + 360) % 360;

  moduleLogger.debug('normalizeDegrees.exit', {
    degrees: deg,
    normalized,
    elapsedMs: measureElapsedMs(startTime)
  });
  return normalized;
}

export function suncalcToCompass(azimuthRad: number, logger?: Logger): number {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('suncalcToCompass.entry', { azimuthRad });

  const rawDegrees = radToDeg(azimuthRad, moduleLogger);
  const convertedDegrees = normalizeDegrees(rawDegrees + 180, moduleLogger);

  moduleLogger.debug('suncalcToCompass.exit', {
    azimuthRad,
    rawDegrees,
    convertedDegrees,
    elapsedMs: measureElapsedMs(startTime)
  });
  return convertedDegrees;
}
