/**
 * @module @sunscope/sky-detection/arc-integrator
 * @description Arc integrator for calculating sun hours (R-SKY-003)
 * 
 * This module integrates sun position samples against the sky mask to calculate
 * total hours of direct sun and identify blocked/unblocked segments.
 * 
 * Dependencies: types.ts, sky-mask.ts, logger.ts (from core)
 * Conventions: Unknown cells are treated as blocked (conservative)
 * 
 * Acceptance Criteria:
 * - Given a SkyMask and sun path samples, calculate total hours of direct sun
 * - Identify continuous blocked/unblocked segments
 * - Handle unknown mask regions conservatively
 * - Return ArcSegment array with timing and obstruction info
 * - Log all operations via structured logger
 */

import {
  SkyMask,
  SunHoursResult,
  ArcSegment,
  ObstructionType
} from './types';

import { getSkyMaskCell } from './sky-mask';
import { ILogger } from '@sunscope/core';

/**
 * Sun position sample from solar engine
 */
export interface SunSample {
  /** Timestamp of the sample */
  timestamp: Date;
  /** Sun azimuth in degrees (0 = north, clockwise) */
  azimuth: number;
  /** Sun elevation in degrees (0 = horizon, 90 = zenith) */
  elevation: number;
  /** Whether this is during daytime */
  isDaytime: boolean;
}

/**
 * Check if sun is blocked at a given sample position
 * 
 * Conservative approach:
 * - Nighttime (isDaytime = false) = blocked
 * - Unknown cell = blocked
 * - Any obstruction (Tree, Building, etc.) = blocked
 * - Sky = unblocked
 * 
 * @param mask - The sky mask
 * @param sample - Sun position sample
 * @returns true if sun is blocked
 */
export function isSunBlocked(mask: SkyMask, sample: SunSample): boolean {
  // Nighttime is always blocked
  if (!sample.isDaytime) {
    return true;
  }

  // Get the cell at sun's position
  const cell = getSkyMaskCell(mask, sample.azimuth, sample.elevation);

  // Unknown is treated as blocked (conservative)
  if (cell.classification === ObstructionType.Unknown) {
    return true;
  }

  // Only Sky is unblocked
  return cell.classification !== ObstructionType.Sky;
}

/**
 * Get the obstruction type for a sample
 * @param mask - The sky mask
 * @param sample - Sun position sample
 * @returns Obstruction type or null if unblocked
 */
function getObstructionType(
  mask: SkyMask,
  sample: SunSample
): ObstructionType | null {
  if (!sample.isDaytime) {
    return ObstructionType.Unknown;
  }

  const cell = getSkyMaskCell(mask, sample.azimuth, sample.elevation);
  
  if (cell.classification === ObstructionType.Sky) {
    return null;
  }
  
  return cell.classification;
}

/**
 * Find continuous arc segments (blocked or unblocked)
 * 
 * Groups consecutive samples with the same blocked/unblocked status
 * into segments. For blocked segments, identifies the most common
 * obstruction type.
 * 
 * @param samples - Array of sun position samples (chronological order)
 * @param mask - The sky mask
 * @param logger - Optional logger
 * @returns Array of arc segments
 */
export function findArcSegments(
  samples: SunSample[],
  mask: SkyMask,
  logger?: ILogger
): ArcSegment[] {
  if (samples.length === 0) {
    return [];
  }

  const segments: ArcSegment[] = [];
  
  // State for current segment
  let currentBlocked = isSunBlocked(mask, samples[0]);
  let segmentStart = samples[0].timestamp;
  let segmentObstructions: ObstructionType[] = [];
  
  // Track obstructions for current segment
  const obstruction = getObstructionType(mask, samples[0]);
  if (obstruction) {
    segmentObstructions.push(obstruction);
  }

  // Process remaining samples
  for (let i = 1; i < samples.length; i++) {
    const sample = samples[i];
    const blocked = isSunBlocked(mask, sample);
    
    if (blocked === currentBlocked) {
      // Same state - continue current segment
      const obs = getObstructionType(mask, sample);
      if (obs) {
        segmentObstructions.push(obs);
      }
    } else {
      // State changed - close current segment and start new one
      segments.push(createSegment(
        segmentStart,
        samples[i - 1].timestamp,
        currentBlocked,
        segmentObstructions
      ));
      
      // Start new segment
      currentBlocked = blocked;
      segmentStart = sample.timestamp;
      segmentObstructions = [];
      const obs = getObstructionType(mask, sample);
      if (obs) {
        segmentObstructions.push(obs);
      }
    }
  }
  
  // Close final segment
  segments.push(createSegment(
    segmentStart,
    samples[samples.length - 1].timestamp,
    currentBlocked,
    segmentObstructions
  ));

  logger?.debug('Found arc segments', {
    sampleCount: samples.length,
    segmentCount: segments.length,
    blockedSegments: segments.filter(s => s.blocked).length,
    unblockedSegments: segments.filter(s => !s.blocked).length
  });

  return segments;
}

/**
 * Create an arc segment from accumulated data
 */
function createSegment(
  startTime: Date,
  endTime: Date,
  blocked: boolean,
  obstructions: ObstructionType[]
): ArcSegment {
  // Find most common obstruction
  let obstruction: ObstructionType | null = null;
  
  if (blocked && obstructions.length > 0) {
    const counts = new Map<ObstructionType, number>();
    for (const obs of obstructions) {
      counts.set(obs, (counts.get(obs) || 0) + 1);
    }
    
    let maxCount = 0;
    for (const [obs, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        obstruction = obs;
      }
    }
  }

  return {
    startTime,
    endTime,
    blocked,
    obstruction
  };
}

/**
 * Calculate duration between two timestamps in hours
 */
function hoursBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return ms / (1000 * 60 * 60);
}

/**
 * Integrate sun hours against the sky mask
 * 
 * Calculates total hours of direct sun by checking each sun sample
 * against the sky mask and summing durations for unblocked periods.
 * 
 * @param mask - The sky mask
 * @param samples - Chronological array of sun position samples
 * @param logger - Optional logger
 * @returns SunHoursResult with total hours and segments
 */
export function integrateSunHours(
  mask: SkyMask,
  samples: SunSample[],
  logger?: ILogger
): SunHoursResult {
  const startTime = Date.now();

  // Handle empty samples
  if (samples.length === 0) {
    logger?.warn('No sun samples provided for integration');
    return {
      totalHours: 0,
      segments: [],
      maskIncomplete: true,
      stats: {
        totalSamples: 0,
        blockedCount: 0,
        unblockedCount: 0,
        unknownCount: 0
      }
    };
  }

  // Find arc segments
  const segments = findArcSegments(samples, mask, logger);

  // Calculate total unblocked hours
  let totalHours = 0;
  for (const segment of segments) {
    if (!segment.blocked) {
      totalHours += hoursBetween(segment.startTime, segment.endTime);
    }
  }

  // Count statistics
  let blockedCount = 0;
  let unblockedCount = 0;
  let unknownCount = 0;

  for (const sample of samples) {
    const cell = getSkyMaskCell(mask, sample.azimuth, sample.elevation);
    
    if (cell.classification === ObstructionType.Unknown) {
      unknownCount++;
      blockedCount++; // Unknown counts as blocked
    } else if (cell.classification === ObstructionType.Sky) {
      unblockedCount++;
    } else {
      blockedCount++;
    }
  }

  const maskIncomplete = unknownCount > 0;
  const elapsedMs = Date.now() - startTime;

  logger?.info('Integrated sun hours', {
    totalHours: totalHours.toFixed(2),
    segmentCount: segments.length,
    maskIncomplete,
    totalSamples: samples.length,
    blockedCount,
    unblockedCount,
    unknownCount,
    elapsedMs
  });

  return {
    totalHours,
    segments,
    maskIncomplete,
    stats: {
      totalSamples: samples.length,
      blockedCount,
      unblockedCount,
      unknownCount
    }
  };
}
