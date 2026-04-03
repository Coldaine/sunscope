/**
 * @module stitcher
 * @description Hemisphere stitcher: projects classified camera frames onto the spherical sky mask.
 *
 * Dependencies: sky-mask (SkyMask, setSkyMaskCell, getMaskCoverage, getSkyMaskCell)
 * Conventions:
 *   - Azimuth is compass degrees (north-origin, 0–360)
 *   - Elevation is degrees above horizon (0–90)
 *   - Pixel-to-world projection ignores lens distortion and device roll (MVP limitation)
 *   - MVP roll assumption: phone is held roughly upright; roll is stored but not applied
 *
 * Projection formula for pixel (px, py) in a grid of (width × height):
 *   pixelAzimuth   = deviceAzimuth   + (px / (width  - 1) - 0.5) * fovH
 *   pixelElevation = deviceElevation + (0.5 - py / (height - 1)) * fovV
 *
 * Frame Selection Logic:
 *   - newer-frame-wins: If incoming frame is newer than the cell's lastUpdated, it wins
 *   - confidence-weighted: If same timestamp, higher confidence wins
 *   - classification-equality: Same timestamp + confidence = incoming wins (idempotent)
 *
 * Watch Out:
 *   Device roll correction is a known gap. Document it and defer.
 */

import { SkyMask, SkyMaskCell, ObstructionType, setSkyMaskCell, getSkyMaskCell } from './sky-mask';
import { PixelGrid } from './classifier';
import { Logger, DefaultLogger } from '@sunscope/core';

export interface ScanFrame {
  timestamp: Date;
  deviceAzimuth: number;    // Compass degrees
  deviceElevation: number;  // Degrees above horizon
  deviceRoll: number;       // Degrees; stored but not applied in MVP
  fieldOfViewH: number;     // Horizontal FoV in degrees
  fieldOfViewV: number;     // Vertical FoV in degrees
  pixelClassifications: PixelGrid; // height × width 2D array
  pixelConfidences?: number[][];   // Optional per-pixel confidence (height × width), 0.0-1.0
}

/**
 * Projects a classified camera frame onto the sky mask.
 * Returns a new immutable SkyMask with updated cells.
 *
 * @param mask Current sky mask
 * @param frame The incoming classified camera frame
 * @param log Optional logger
 */
export function stitchFrame(
  mask: SkyMask,
  frame: ScanFrame,
  log: Logger = new DefaultLogger('stitcher')
): SkyMask {
  const start = Date.now();
  const height = frame.pixelClassifications.length;
  const width = height > 0 ? frame.pixelClassifications[0].length : 0;

  if (height === 0 || width === 0) {
    log.warn('stitchFrame: empty pixel grid, skipping', { height, width });
    return mask;
  }

  const coverageBefore = getMaskCoverage(mask);
  log.debug('stitchFrame start', {
    deviceAzimuth: frame.deviceAzimuth,
    deviceElevation: frame.deviceElevation,
    deviceRoll: frame.deviceRoll,
    fovH: frame.fieldOfViewH,
    fovV: frame.fieldOfViewV,
    gridSize: `${width}x${height}`,
    coverageBefore,
    note: 'deviceRoll not applied (MVP limitation)',
  });

  let current = mask;
  let cellsUpdated = 0;
  let cellsSkippedNewer = 0;
  let cellsSkippedHigherConfidence = 0;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const classification = frame.pixelClassifications[py][px];

      // Get per-pixel confidence (default to 1.0 if not provided)
      const pixelConfidence = frame.pixelConfidences?.[py]?.[px] ?? 1.0;

      // Project pixel to world azimuth/elevation
      const pixelAzimuth = frame.deviceAzimuth + (px / (width - 1) - 0.5) * frame.fieldOfViewH;
      const pixelElevation = frame.deviceElevation + (0.5 - py / (height - 1)) * frame.fieldOfViewV;

      // Skip cells below the horizon
      if (pixelElevation < 0) continue;

      // Get current cell to check timestamp/confidence
      const existingCell = getSkyMaskCell(current, pixelAzimuth, pixelElevation);
      const frameTime = frame.timestamp.getTime();
      const existingTime = existingCell.lastUpdated?.getTime() ?? 0;

      // Frame selection logic:
      // 1. Newer frame wins (timestamp comparison)
      // 2. Same timestamp: higher confidence wins
      // 3. Same timestamp + confidence: incoming wins (idempotent)
      const shouldWrite = 
        existingCell.classification === ObstructionType.Unknown || // Empty cell always writable
        frameTime > existingTime ||                               // Newer frame wins
        (frameTime === existingTime && pixelConfidence >= existingCell.confidence); // Same time: higher/equal confidence wins

      if (!shouldWrite) {
        if (frameTime <= existingTime) {
          cellsSkippedNewer++;
        } else {
          cellsSkippedHigherConfidence++;
        }
        continue;
      }

      current = setSkyMaskCell(current, pixelAzimuth, pixelElevation, classification, pixelConfidence);
      cellsUpdated++;
    }
  }

  const coverageAfter = getMaskCoverage(current);
  log.debug('stitchFrame complete', {
    cellsUpdated,
    cellsSkippedNewer,
    cellsSkippedHigherConfidence,
    coverageBefore,
    coverageAfter,
    elapsedMs: Date.now() - start,
  });

  return current;
}

/**
 * Returns the fraction of mask cells that are NOT Unknown.
 * 0.0 = fully unknown, 1.0 = fully classified.
 */
export function getMaskCoverage(mask: SkyMask): number {
  const totalCells = 180 * 45; // azBuckets × elBuckets
  let classified = 0;

  for (let az = 0; az < 180; az++) {
    for (let el = 0; el < 45; el++) {
      if (mask[az][el].classification !== ObstructionType.Unknown) {
        classified++;
      }
    }
  }

  return classified / totalCells;
}
