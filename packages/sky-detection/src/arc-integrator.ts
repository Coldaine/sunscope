/**
 * @fileoverview Direct-sun integration against a sky mask.
 *
 * This module converts a day's solar samples into blocked and unblocked arc
 * segments based on the sky mask. Unknown cells are treated as blocked while
 * still surfacing `maskIncomplete` for caller-side UI decisions.
 */

import { Logger, SunSample, createLogger, measureElapsedMs } from '@sunscope/core';
import { getSkyMaskCell } from './sky-mask';
import { ArcSegment, ObstructionType, SkyMask, SunHoursResult } from './types';

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'arc-integrator' });
}

function pushOrMergeSegment(segments: ArcSegment[], nextSegment: ArcSegment): void {
  const previous = segments[segments.length - 1];
  if (
    previous !== undefined &&
    previous.blocked === nextSegment.blocked &&
    previous.obstruction === nextSegment.obstruction &&
    previous.endTime.getTime() === nextSegment.startTime.getTime()
  ) {
    previous.endTime = nextSegment.endTime;
    return;
  }

  segments.push(nextSegment);
}

export function integrateSunHours(mask: SkyMask, samples: SunSample[], logger?: Logger): SunHoursResult {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('integrateSunHours.entry', {
    sampleCount: samples.length
  });

  let totalHours = 0;
  let blockedCount = 0;
  let unblockedCount = 0;
  let unknownCount = 0;
  let maskIncomplete = false;
  const segments: ArcSegment[] = [];

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    if (sample.altitude <= 0) {
      continue;
    }

    const nextSample = samples[index + 1];
    const fallbackIntervalMs =
      index > 0
        ? sample.date.getTime() - samples[index - 1].date.getTime()
        : 0;
    const segmentEndTime = nextSample?.date ?? new Date(sample.date.getTime() + fallbackIntervalMs);
    const durationHours = (segmentEndTime.getTime() - sample.date.getTime()) / 3_600_000;

    const cell = getSkyMaskCell(mask, sample.azimuth, sample.altitude, moduleLogger.child('sky-mask'));
    const blocked = cell.classification !== ObstructionType.Sky;
    const obstruction = blocked ? cell.classification : null;

    if (cell.classification === ObstructionType.Unknown) {
      maskIncomplete = true;
      unknownCount += 1;
    }

    if (blocked) {
      blockedCount += 1;
    } else {
      unblockedCount += 1;
      totalHours += durationHours;
    }

    pushOrMergeSegment(segments, {
      startTime: sample.date,
      endTime: segmentEndTime,
      blocked,
      obstruction
    });
  }

  moduleLogger.debug('integrateSunHours.exit', {
    totalHours,
    blockedCount,
    unblockedCount,
    unknownCount,
    maskIncomplete,
    segmentCount: segments.length,
    elapsedMs: measureElapsedMs(startTime)
  });

  return {
    totalHours,
    segments,
    maskIncomplete
  };
}
