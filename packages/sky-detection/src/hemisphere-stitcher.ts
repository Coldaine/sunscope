/**
 * @fileoverview Projection of classified scan frames onto the spherical sky mask.
 *
 * The stitcher maps a downsampled camera pixel grid onto the sky mask using a
 * simplified field-of-view projection. Device roll is ignored for MVP and the
 * branch is logged explicitly so the limitation is observable in tests.
 */

import { Logger, createLogger, measureElapsedMs } from '@sunscope/core';
import { createEmptySkyMask, getSkyMaskCell, getAzimuthBucketIndex, getElevationBucketIndex } from './sky-mask';
import { ObstructionType, PixelGrid, ScanFrame, SkyMask } from './types';

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'hemisphere-stitcher' });
}

function cloneMask(mask: SkyMask): SkyMask {
  return mask.map((row) => row.map((cell) => ({ ...cell })));
}

function summarizeDistribution(grid: PixelGrid): Record<string, number> {
  const distribution: Record<string, number> = {};
  grid.flat().forEach((classification) => {
    distribution[classification] = (distribution[classification] ?? 0) + 1;
  });
  return distribution;
}

function computePixelConfidence(
  pixelX: number,
  pixelY: number,
  width: number,
  height: number
): number {
  const normalizedX = (pixelX + 0.5) / width - 0.5;
  const normalizedY = (pixelY + 0.5) / height - 0.5;
  const distance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2) / Math.sqrt(0.5);
  return Math.max(0.1, 1 - distance);
}

export function getMaskCoverage(mask: SkyMask, logger?: Logger): number {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  const totalCells = mask.length * (mask[0]?.length ?? 0);
  const knownCells = mask.flat().filter((cell) => cell.classification !== ObstructionType.Unknown).length;
  const coverage = totalCells === 0 ? 0 : knownCells / totalCells;

  moduleLogger.debug('getMaskCoverage.exit', {
    totalCells,
    knownCells,
    coverage,
    elapsedMs: measureElapsedMs(startTime)
  });
  return coverage;
}

export function stitchFrame(mask: SkyMask, frame: ScanFrame, logger?: Logger): SkyMask {
  const moduleLogger = getLogger(logger);
  const startTime = process.hrtime.bigint();
  const height = frame.pixelClassifications.length;
  const width = frame.pixelClassifications[0]?.length ?? 0;
  const coverageBefore = getMaskCoverage(mask, moduleLogger.child('sky-mask'));
  moduleLogger.debug('stitchFrame.entry', {
    timestamp: frame.timestamp.toISOString(),
    deviceAzimuth: frame.deviceAzimuth,
    deviceElevation: frame.deviceElevation,
    deviceRoll: frame.deviceRoll,
    fieldOfViewH: frame.fieldOfViewH,
    fieldOfViewV: frame.fieldOfViewV,
    width,
    height,
    distribution: summarizeDistribution(frame.pixelClassifications)
  });

  if (frame.deviceRoll !== 0) {
    moduleLogger.warn('stitchFrame.rollIgnored', {
      deviceRoll: frame.deviceRoll,
      reason: 'mvpAssumesUprightPhone'
    });
  }

  if (height === 0 || width === 0) {
    moduleLogger.warn('stitchFrame.emptyGrid', { width, height });
    return mask;
  }

  const nextMask = cloneMask(mask);
  let updatedCells = 0;

  for (let pixelY = 0; pixelY < height; pixelY += 1) {
    for (let pixelX = 0; pixelX < width; pixelX += 1) {
      const classification = frame.pixelClassifications[pixelY]?.[pixelX];
      if (classification === undefined) {
        continue;
      }

      const azimuthOffset = (((pixelX + 0.5) / width) - 0.5) * frame.fieldOfViewH;
      const elevationOffset = (0.5 - ((pixelY + 0.5) / height)) * frame.fieldOfViewV;
      const worldAzimuth = frame.deviceAzimuth + azimuthOffset;
      const worldElevation = frame.deviceElevation + elevationOffset;
      const azimuthBucket = getAzimuthBucketIndex(worldAzimuth);
      const elevationBucket = getElevationBucketIndex(worldElevation);
      const confidence = computePixelConfidence(pixelX, pixelY, width, height);
      const previous = nextMask[azimuthBucket][elevationBucket];
      const isNewer = previous.lastUpdated === null || frame.timestamp.getTime() >= previous.lastUpdated.getTime();
      const shouldOverwrite = isNewer || confidence > previous.confidence;

      if (!shouldOverwrite) {
        moduleLogger.debug('stitchFrame.branch', {
          branch: 'skipOlderLowerConfidence',
          azimuthBucket,
          elevationBucket,
          previousTimestamp: previous.lastUpdated?.toISOString() ?? null,
          previousConfidence: previous.confidence,
          incomingConfidence: confidence
        });
        continue;
      }

      nextMask[azimuthBucket][elevationBucket] = {
        classification,
        confidence,
        lastUpdated: frame.timestamp
      };
      updatedCells += 1;
    }
  }

  const coverageAfter = getMaskCoverage(nextMask, moduleLogger.child('sky-mask'));
  moduleLogger.debug('stitchFrame.exit', {
    timestamp: frame.timestamp.toISOString(),
    coverageBefore,
    coverageAfter,
    updatedCells,
    elapsedMs: measureElapsedMs(startTime)
  });
  return nextMask;
}

export function createSyntheticSkyMask(logger?: Logger): SkyMask {
  return createEmptySkyMask(logger);
}
