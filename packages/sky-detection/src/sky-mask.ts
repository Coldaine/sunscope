/**
 * @module @sunscope/sky-detection/sky-mask
 * @description Sky mask data structure and operations
 * 
 * This module provides functions for creating and manipulating the spherical
 * sky mask grid. All operations are immutable (return new masks).
 * 
 * Dependencies: types.ts, logger.ts (from core)
 * Conventions: All angles in degrees, normalized to [0, 360) for azimuth
 */

import {
  SkyMask,
  SkyMaskCell,
  ObstructionType
} from './types';

import { ILogger } from '@sunscope/core';

/** Azimuth resolution in degrees */
export const AZIMUTH_RESOLUTION = 2;

/** Elevation resolution in degrees */
export const ELEVATION_RESOLUTION = 2;

/** Number of azimuth buckets (360° / 2°) */
export const AZIMUTH_BUCKETS = 180;

/** Number of elevation buckets (90° / 2°) */
export const ELEVATION_BUCKETS = 45;

/**
 * Normalize degrees to [0, 360) range
 * Handles negative values and values > 360
 * @param deg - Degrees to normalize
 * @returns Normalized degrees in [0, 360)
 */
export function normalizeDegrees(deg: number): number {
  // JS modulo is broken for negatives: (-90) % 360 === -90
  // Use: ((deg % 360) + 360) % 360
  return ((deg % 360) + 360) % 360;
}

/**
 * Clamp elevation to [0, 90] range
 * @param elevation - Elevation in degrees
 * @returns Clamped elevation in [0, 90]
 */
export function clampElevation(elevation: number): number {
  return Math.max(0, Math.min(90, elevation));
}

/**
 * Convert continuous azimuth to bucket index
 * @param azimuthDeg - Azimuth in degrees (0 = north, clockwise)
 * @returns Bucket index 0-179
 */
export function azimuthToBucket(azimuthDeg: number): number {
  const normalized = normalizeDegrees(azimuthDeg);
  const bucket = Math.floor(normalized / AZIMUTH_RESOLUTION);
  // Handle edge case where normalized is exactly 360 (becomes 0)
  return Math.min(bucket, AZIMUTH_BUCKETS - 1);
}

/**
 * Convert continuous elevation to bucket index
 * @param elevationDeg - Elevation in degrees (0 = horizon, 90 = zenith)
 * @returns Bucket index 0-44
 */
export function elevationToBucket(elevationDeg: number): number {
  const clamped = clampElevation(elevationDeg);
  const bucket = Math.floor(clamped / ELEVATION_RESOLUTION);
  return Math.min(bucket, ELEVATION_BUCKETS - 1);
}

/**
 * Convert bucket index back to center angle
 * @param bucket - Bucket index
 * @param resolution - Resolution in degrees
 * @returns Center angle in degrees
 * @throws Error if bucket is negative
 */
export function bucketToAngle(bucket: number, resolution: number): number {
  if (bucket < 0) {
    throw new Error(`Bucket index must be non-negative, got ${bucket}`);
  }
  return bucket * resolution + resolution / 2;
}

/**
 * Create a single empty sky mask cell
 * @returns Cell with Unknown classification and zero confidence
 */
export function createEmptyCell(): SkyMaskCell {
  return {
    classification: ObstructionType.Unknown,
    confidence: 0,
    lastUpdated: null
  };
}

/**
 * Create an empty sky mask with all cells set to Unknown
 * @param logger - Optional logger for debugging
 * @returns Empty sky mask
 */
export function createEmptySkyMask(logger?: ILogger): SkyMask {
  const startTime = Date.now();
  
  // Initialize 2D grid: [azimuth][elevation]
  const grid: SkyMaskCell[][] = [];
  
  for (let az = 0; az < AZIMUTH_BUCKETS; az++) {
    grid[az] = [];
    for (let el = 0; el < ELEVATION_BUCKETS; el++) {
      grid[az][el] = createEmptyCell();
    }
  }
  
  const mask: SkyMask = {
    grid,
    metadata: {
      createdAt: new Date(),
      lastUpdated: null,
      azimuthResolution: AZIMUTH_RESOLUTION,
      elevationResolution: ELEVATION_RESOLUTION
    }
  };
  
  logger?.debug('Created empty sky mask', {
    azimuthBuckets: AZIMUTH_BUCKETS,
    elevationBuckets: ELEVATION_BUCKETS,
    totalCells: AZIMUTH_BUCKETS * ELEVATION_BUCKETS,
    elapsedMs: Date.now() - startTime
  });
  
  return mask;
}

/**
 * Get a cell from the sky mask by continuous angles
 * @param mask - The sky mask
 * @param azimuthDeg - Azimuth in degrees (wraps around)
 * @param elevationDeg - Elevation in degrees (clamps to [0, 90])
 * @param logger - Optional logger for debugging
 * @returns The sky mask cell at that position
 */
export function getSkyMaskCell(
  mask: SkyMask,
  azimuthDeg: number,
  elevationDeg: number,
  logger?: ILogger
): SkyMaskCell {
  const azBucket = azimuthToBucket(azimuthDeg);
  const elBucket = elevationToBucket(elevationDeg);
  
  logger?.debug('Getting sky mask cell', {
    inputAzimuth: azimuthDeg,
    inputElevation: elevationDeg,
    azimuthBucket: azBucket,
    elevationBucket: elBucket,
    classification: mask.grid[azBucket][elBucket].classification
  });
  
  return mask.grid[azBucket][elBucket];
}

/**
 * Set a cell in the sky mask by continuous angles (immutable)
 * @param mask - The sky mask
 * @param azimuthDeg - Azimuth in degrees (wraps around)
 * @param elevationDeg - Elevation in degrees (clamps to [0, 90])
 * @param classification - New classification
 * @param confidence - Confidence score 0-1
 * @param logger - Optional logger for debugging
 * @returns New sky mask with updated cell
 */
export function setSkyMaskCell(
  mask: SkyMask,
  azimuthDeg: number,
  elevationDeg: number,
  classification: ObstructionType,
  confidence: number,
  logger?: ILogger
): SkyMask {
  const startTime = Date.now();
  const azBucket = azimuthToBucket(azimuthDeg);
  const elBucket = elevationToBucket(elevationDeg);
  
  // Create deep copy of grid (immutable update)
  const newGrid: SkyMaskCell[][] = mask.grid.map((azRow, azIndex) => {
    if (azIndex !== azBucket) {
      return azRow;
    }
    // Only copy the row being modified
    return azRow.map((cell, elIndex) => {
      if (elIndex !== elBucket) {
        return cell;
      }
      // Update the specific cell
      return {
        classification,
        confidence: Math.max(0, Math.min(1, confidence)),
        lastUpdated: new Date()
      };
    });
  });
  
  const newMask: SkyMask = {
    grid: newGrid,
    metadata: {
      ...mask.metadata,
      lastUpdated: new Date()
    }
  };
  
  logger?.debug('Set sky mask cell', {
    inputAzimuth: azimuthDeg,
    inputElevation: elevationDeg,
    azimuthBucket: azBucket,
    elevationBucket: elBucket,
    classification,
    confidence,
    elapsedMs: Date.now() - startTime
  });
  
  return newMask;
}

/**
 * Get the fraction of the mask that has been classified (not Unknown)
 * @param mask - The sky mask
 * @param logger - Optional logger for debugging
 * @returns Coverage ratio 0.0 to 1.0
 */
export function getMaskCoverage(mask: SkyMask, logger?: ILogger): number {
  let classifiedCount = 0;
  let totalCount = 0;
  
  for (let az = 0; az < AZIMUTH_BUCKETS; az++) {
    for (let el = 0; el < ELEVATION_BUCKETS; el++) {
      totalCount++;
      if (mask.grid[az][el].classification !== ObstructionType.Unknown) {
        classifiedCount++;
      }
    }
  }
  
  const coverage = classifiedCount / totalCount;
  
  logger?.debug('Calculated mask coverage', {
    classifiedCount,
    totalCount,
    coverage,
    coveragePercent: (coverage * 100).toFixed(2)
  });
  
  return coverage;
}

/**
 * Get statistics about the mask contents
 * @param mask - The sky mask
 * @returns Count of each classification type
 */
export function getMaskStatistics(mask: SkyMask): Record<ObstructionType, number> {
  const stats: Record<ObstructionType, number> = {
    [ObstructionType.Sky]: 0,
    [ObstructionType.Tree]: 0,
    [ObstructionType.Building]: 0,
    [ObstructionType.Roof]: 0,
    [ObstructionType.Fence]: 0,
    [ObstructionType.Unknown]: 0
  };
  
  for (let az = 0; az < AZIMUTH_BUCKETS; az++) {
    for (let el = 0; el < ELEVATION_BUCKETS; el++) {
      const classification = mask.grid[az][el].classification;
      stats[classification]++;
    }
  }
  
  return stats;
}
