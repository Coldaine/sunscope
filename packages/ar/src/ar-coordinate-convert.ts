/**
 * @fileoverview Conversion helpers between solar angles and Viro world space.
 *
 * The coordinate system matches the project conventions: Y up, -Z north, +X
 * east. These helpers are intentionally pure so they can be round-trip tested.
 */

import { Logger, createLogger, measureElapsedMs } from '@sunscope/core';
import { degToRad, normalizeDegrees, radToDeg } from '@sunscope/core';

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'ar-coordinate-convert' });
}

export function solarToWorld(
  azimuthDeg: number,
  altitudeDeg: number,
  radius: number,
  logger?: Logger
): { x: number; y: number; z: number } {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('solarToWorld.entry', {
    azimuthDeg,
    altitudeDeg,
    radius
  });

  const azimuthRad = degToRad(azimuthDeg, moduleLogger.child('solar-convert'));
  const altitudeRad = degToRad(altitudeDeg, moduleLogger.child('solar-convert'));
  const x = radius * Math.cos(altitudeRad) * Math.sin(azimuthRad);
  const y = radius * Math.sin(altitudeRad);
  const z = -radius * Math.cos(altitudeRad) * Math.cos(azimuthRad);

  moduleLogger.debug('solarToWorld.exit', {
    azimuthDeg,
    altitudeDeg,
    radius,
    x,
    y,
    z,
    elapsedMs: measureElapsedMs(startTime)
  });
  return { x, y, z };
}

export function worldToSolar(
  x: number,
  y: number,
  z: number,
  logger?: Logger
): { azimuthDeg: number; altitudeDeg: number } {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('worldToSolar.entry', { x, y, z });

  const radius = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  const altitudeDeg = radToDeg(Math.asin(y / radius), moduleLogger.child('solar-convert'));
  const azimuthDeg = normalizeDegrees(
    radToDeg(Math.atan2(x, -z), moduleLogger.child('solar-convert')),
    moduleLogger.child('solar-convert')
  );

  moduleLogger.debug('worldToSolar.exit', {
    x,
    y,
    z,
    azimuthDeg,
    altitudeDeg,
    elapsedMs: measureElapsedMs(startTime)
  });
  return { azimuthDeg, altitudeDeg };
}
