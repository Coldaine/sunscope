/**
 * @fileoverview Sky mask grid creation and cell access.
 *
 * The sky mask is an immutable 180x45 spherical grid using 2-degree buckets.
 * This module owns all bucket wrapping and clamping logic so the stitcher and
 * integrator can work strictly in continuous solar coordinates.
 */

import { Logger, createLogger, measureElapsedMs } from '@sunscope/core';
import {
  ObstructionType,
  SKY_MASK_AZIMUTH_BUCKETS,
  SKY_MASK_BUCKET_DEGREES,
  SKY_MASK_ELEVATION_BUCKETS,
  SkyMask,
  SkyMaskCell
} from './types';

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'sky-mask' });
}

export function normalizeAzimuthDegrees(azimuthDeg: number): number {
  return ((azimuthDeg % 360) + 360) % 360;
}

export function getAzimuthBucketIndex(azimuthDeg: number): number {
  return Math.floor(normalizeAzimuthDegrees(azimuthDeg) / SKY_MASK_BUCKET_DEGREES) % SKY_MASK_AZIMUTH_BUCKETS;
}

export function getElevationBucketIndex(elevationDeg: number): number {
  const clampedElevation = Math.min(89.999999, Math.max(0, elevationDeg));
  return Math.min(
    SKY_MASK_ELEVATION_BUCKETS - 1,
    Math.floor(clampedElevation / SKY_MASK_BUCKET_DEGREES)
  );
}

export function createEmptySkyMask(logger?: Logger): SkyMask {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  moduleLogger.debug('createEmptySkyMask.entry');

  const mask = Array.from({ length: SKY_MASK_AZIMUTH_BUCKETS }, () =>
    Array.from({ length: SKY_MASK_ELEVATION_BUCKETS }, (): SkyMaskCell => ({
      classification: ObstructionType.Unknown,
      confidence: 0,
      lastUpdated: null
    }))
  );

  moduleLogger.debug('createEmptySkyMask.exit', {
    azimuthBuckets: SKY_MASK_AZIMUTH_BUCKETS,
    elevationBuckets: SKY_MASK_ELEVATION_BUCKETS,
    elapsedMs: measureElapsedMs(startTime)
  });
  return mask;
}

export function getSkyMaskCell(
  mask: SkyMask,
  azimuthDeg: number,
  elevationDeg: number,
  logger?: Logger
): SkyMaskCell {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  const azimuthBucket = getAzimuthBucketIndex(azimuthDeg);
  const elevationBucket = getElevationBucketIndex(elevationDeg);
  const cell = mask[azimuthBucket]?.[elevationBucket];

  if (cell === undefined) {
    moduleLogger.error('getSkyMaskCell.outOfRange', {
      azimuthDeg,
      elevationDeg,
      azimuthBucket,
      elevationBucket
    });
    throw new Error('Sky mask lookup failed: bucket out of range');
  }

  moduleLogger.debug('getSkyMaskCell.exit', {
    azimuthDeg,
    elevationDeg,
    azimuthBucket,
    elevationBucket,
    classification: cell.classification,
    confidence: cell.confidence,
    elapsedMs: measureElapsedMs(startTime)
  });
  return cell;
}

export function setSkyMaskCell(
  mask: SkyMask,
  azimuthDeg: number,
  elevationDeg: number,
  classification: ObstructionType,
  confidence: number,
  timestamp: Date | null = null,
  logger?: Logger
): SkyMask {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  const azimuthBucket = getAzimuthBucketIndex(azimuthDeg);
  const elevationBucket = getElevationBucketIndex(elevationDeg);
  moduleLogger.debug('setSkyMaskCell.entry', {
    azimuthDeg,
    elevationDeg,
    azimuthBucket,
    elevationBucket,
    classification,
    confidence,
    timestamp: timestamp?.toISOString() ?? null
  });

  const nextMask = mask.map((azimuthRow, rowIndex) => {
    if (rowIndex !== azimuthBucket) {
      return azimuthRow;
    }

    return azimuthRow.map((cell, cellIndex) => {
      if (cellIndex !== elevationBucket) {
        return cell;
      }

      return {
        classification,
        confidence,
        lastUpdated: timestamp
      };
    });
  });

  moduleLogger.debug('setSkyMaskCell.exit', {
    azimuthBucket,
    elevationBucket,
    classification,
    confidence,
    elapsedMs: measureElapsedMs(startTime)
  });
  return nextMask;
}
