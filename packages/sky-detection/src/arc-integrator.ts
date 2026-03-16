/**
 * @module arc-integrator
 * @description Given a sky mask and a day of sun samples, computes total unblocked sun hours.
 *
 * Dependencies: sky-mask (getSkyMaskCell), @sunscope/core types (SunSample, SunHoursResult, ArcSegment)
 * Conventions:
 *   - Only samples where altitude > 0° count (sun above horizon)
 *   - Sky = unblocked, everything else = blocked, Unknown = blocked (conservative)
 *   - maskIncomplete: true when ANY checked cell was Unknown
 *   - Segments collapse consecutive same-state samples into ArcSegment spans
 *
 * Output segments are used to color the AR arc: green (unblocked) / red (blocked) / gray (unknown)
 */

import { SkyMask, ObstructionType, getSkyMaskCell } from './sky-mask';
import { SunSample, SunHoursResult, ArcSegment } from '@sunscope/core';
import { Logger, DefaultLogger } from '@sunscope/core';

export interface IntegrateOptions {
  log?: Logger;
}

/**
 * Compute unblocked sun hours for a day given a sky mask and sun position samples.
 */
export function integrateSunHours(
  mask: SkyMask,
  samples: SunSample[],
  opts: IntegrateOptions = {}
): SunHoursResult {
  const log = opts.log ?? new DefaultLogger('arc-integrator');
  const start = Date.now();

  let totalBlockedMs = 0;
  let totalUnblockedMs = 0;
  let blockedCount = 0;
  let unblockedCount = 0;
  let unknownCount = 0;
  let maskIncomplete = false;

  const segments: ArcSegment[] = [];

  // Only look at above-horizon samples
  const aboveHorizon = samples.filter(s => s.altitude > 0);

  if (aboveHorizon.length === 0) {
    log.info('integrateSunHours: no above-horizon samples', { totalSamples: samples.length });
    return { totalHours: 0, segments: [], maskIncomplete: false };
  }

  let currentSegmentStart: Date | null = null;
  let currentBlocked: boolean | null = null;
  let currentObstruction: ObstructionType | null = null;

  const finalizeSegment = (endTime: Date) => {
    if (currentSegmentStart !== null && currentBlocked !== null) {
      const durationMs = endTime.getTime() - currentSegmentStart.getTime();
      if (currentBlocked) {
        totalBlockedMs += durationMs;
      } else {
        totalUnblockedMs += durationMs;
      }
      segments.push({
        startTime: currentSegmentStart,
        endTime,
        blocked: currentBlocked,
        obstruction: currentBlocked ? (currentObstruction?.toString() ?? null) : null,
      });
    }
  };

  for (let i = 0; i < aboveHorizon.length; i++) {
    const sample = aboveHorizon[i];
    const cell = getSkyMaskCell(mask, sample.azimuth, sample.altitude);
    const isUnknown = cell.classification === ObstructionType.Unknown;
    const isSky = cell.classification === ObstructionType.Sky;
    const blocked = !isSky; // Unknown = blocked (conservative)

    if (isUnknown) {
      unknownCount++;
      maskIncomplete = true;
    } else if (blocked) {
      blockedCount++;
    } else {
      unblockedCount++;
    }

    if (currentBlocked === null) {
      // First sample
      currentSegmentStart = sample.date;
      currentBlocked = blocked;
      currentObstruction = blocked ? cell.classification : null;
    } else if (blocked !== currentBlocked) {
      // State changed — finalize old segment and start new one
      finalizeSegment(sample.date);
      currentSegmentStart = sample.date;
      currentBlocked = blocked;
      currentObstruction = blocked ? cell.classification : null;
    } else if (blocked && cell.classification !== currentObstruction) {
      // Same blocked state but different obstruction type
      finalizeSegment(sample.date);
      currentSegmentStart = sample.date;
      currentObstruction = cell.classification;
    }
  }

  // Close final segment
  if (currentSegmentStart !== null && aboveHorizon.length > 0) {
    finalizeSegment(aboveHorizon[aboveHorizon.length - 1].date);
  }

  const totalHours = totalUnblockedMs / (1000 * 3600);

  log.info('integrateSunHours complete', {
    totalSamples: samples.length,
    aboveHorizonSamples: aboveHorizon.length,
    blockedCount,
    unblockedCount,
    unknownCount,
    totalHours,
    maskIncomplete,
    elapsedMs: Date.now() - start,
  });

  return { totalHours, segments, maskIncomplete };
}
