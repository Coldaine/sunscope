import { SunSample, SunHoursResult, Logger, DefaultLogger } from '@sunscope/core';
import { solarToWorld } from './ar-coordinate-convert';
import { ArcPoint3D } from './types';

/**
 * Computes AR world coordinates for a given array of sun samples.
 * @param samples Array of sun positions
 * @param radius Radius of the AR arc (meters)
 * @param sunHours Optional result to color points as blocked/unblocked
 * @param log Optional logger
 * @returns Array of AR 3D points
 */
export function computeArcPoints(
  samples: SunSample[],
  radius: number = 50,
  sunHours?: SunHoursResult,
  log?: Logger
): ArcPoint3D[] {
  const l = log ?? new DefaultLogger('sun-arc-geometry');
  const start = Date.now();
  let filteredCount = 0;
  let maxX = -Infinity, minX = Infinity;
  let maxY = -Infinity, minY = Infinity;
  let maxZ = -Infinity, minZ = Infinity;

  const points: ArcPoint3D[] = [];

  for (const sample of samples) {
    if (sample.altitude <= -5) {
      filteredCount++;
      continue;
    }

    const { x, y, z } = solarToWorld(sample.azimuth, sample.altitude, radius);
    
    // Determine blocked state if sunHours provided
    let blocked: boolean | undefined = undefined;
    if (sunHours) {
      const segment = sunHours.segments.find(
        (seg) => sample.date >= seg.startTime && sample.date <= seg.endTime
      );
      if (segment) {
        blocked = segment.blocked;
      }
    }

    points.push({
      x, y, z,
      azimuth: sample.azimuth,
      altitude: sample.altitude,
      phase: sample.phase,
      date: sample.date,
      blocked
    });

    maxX = Math.max(maxX, x); minX = Math.min(minX, x);
    maxY = Math.max(maxY, y); minY = Math.min(minY, y);
    maxZ = Math.max(maxZ, z); minZ = Math.min(minZ, z);
  }

  l.debug('computeArcPoints complete', {
    inputCount: samples.length,
    outputCount: points.length,
    filteredCount,
    bounds: { maxX, minX, maxY, minY, maxZ, minZ },
    elapsedMs: Date.now() - start,
  });

  return points;
}