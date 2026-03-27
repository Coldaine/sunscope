/**
 * @fileoverview AR sun-path point generation.
 *
 * This module converts a day's solar samples into world-space points for AR
 * rendering. It depends on the core solar sample contract and the coordinate
 * conversion utilities in this package.
 */

import { Logger, SunSample, createLogger, measureElapsedMs } from '@sunscope/core';
import { solarToWorld } from './ar-coordinate-convert';
import { ArcPoint3D, SunHoursResultLike } from './types';

const DEFAULT_RADIUS = 50;
const MIN_RENDER_ALTITUDE = -5;

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'sun-arc-geometry' });
}

function isBlocked(date: Date, sunHoursResult?: SunHoursResultLike): boolean | undefined {
  if (sunHoursResult === undefined) {
    return undefined;
  }

  const matchingSegment = sunHoursResult.segments.find(
    (segment) =>
      date.getTime() >= segment.startTime.getTime() &&
      date.getTime() <= segment.endTime.getTime()
  );
  return matchingSegment?.blocked;
}

export function computeArcPoints(
  samples: SunSample[],
  radius = DEFAULT_RADIUS,
  sunHoursResult?: SunHoursResultLike,
  logger?: Logger
): ArcPoint3D[] {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('computeArcPoints.entry', {
    sampleCount: samples.length,
    radius,
    hasSunHoursResult: sunHoursResult !== undefined
  });

  const filteredSamples = samples.filter((sample) => sample.altitude > MIN_RENDER_ALTITUDE);
  const points = filteredSamples.map((sample) => {
    const world = solarToWorld(sample.azimuth, sample.altitude, radius, moduleLogger.child('ar-coordinate-convert'));
    return {
      ...world,
      azimuth: sample.azimuth,
      altitude: sample.altitude,
      phase: sample.phase,
      date: sample.date,
      blocked: isBlocked(sample.date, sunHoursResult)
    };
  });

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const zs = points.map((point) => point.z);
  moduleLogger.debug('computeArcPoints.exit', {
    inputSampleCount: samples.length,
    outputPointCount: points.length,
    filteredCount: samples.length - points.length,
    extremes: {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs)
    },
    elapsedMs: measureElapsedMs(startTime)
  });

  return points;
}
