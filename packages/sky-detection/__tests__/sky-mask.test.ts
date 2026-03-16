/**
 * @module @sunscope/sky-detection/__tests__/sky-mask
 * @description Tests for R-SKY-001: Sky mask data structure
 */

import {
  createEmptySkyMask,
  createEmptyCell,
  getSkyMaskCell,
  setSkyMaskCell,
  getMaskCoverage,
  getMaskStatistics,
  normalizeDegrees,
  clampElevation,
  azimuthToBucket,
  elevationToBucket,
  bucketToAngle,
  AZIMUTH_BUCKETS,
  ELEVATION_BUCKETS
} from '../src/sky-mask';

import { ObstructionType } from '../src/types';
import { TestLogger } from '@sunscope/core';

describe('R-SKY-001: Sky mask data structure', () => {
  let testLogger: TestLogger;

  beforeEach(() => {
    testLogger = new TestLogger('sky-mask-test');
  });

  afterEach(() => {
    testLogger.clear();
  });

  describe('normalizeDegrees', () => {
    it('should return 0 for input 0', () => {
      expect(normalizeDegrees(0)).toBe(0);
    });

    it('should return 90 for input 90', () => {
      expect(normalizeDegrees(90)).toBe(90);
    });

    it('should return 180 for input 180', () => {
      expect(normalizeDegrees(180)).toBe(180);
    });

    it('should return 270 for input 270', () => {
      expect(normalizeDegrees(270)).toBe(270);
    });

    it('should wrap 360 to 0', () => {
      expect(normalizeDegrees(360)).toBe(0);
    });

    it('should wrap 361 to 1', () => {
      expect(normalizeDegrees(361)).toBe(1);
    });

    it('should wrap -1 to 359', () => {
      expect(normalizeDegrees(-1)).toBe(359);
    });

    it('should wrap -90 to 270', () => {
      expect(normalizeDegrees(-90)).toBe(270);
    });

    it('should wrap -180 to 180', () => {
      expect(normalizeDegrees(-180)).toBe(180);
    });

    it('should wrap -360 to 0', () => {
      expect(normalizeDegrees(-360)).toBe(0);
    });

    it('should wrap -361 to 359', () => {
      expect(normalizeDegrees(-361)).toBe(359);
    });

    it('should handle 720 (2 full rotations)', () => {
      expect(normalizeDegrees(720)).toBe(0);
    });

    it('should handle -720 (2 full rotations negative)', () => {
      expect(normalizeDegrees(-720)).toBe(0);
    });
  });

  describe('clampElevation', () => {
    it('should return 0 for input 0', () => {
      expect(clampElevation(0)).toBe(0);
    });

    it('should return 45 for input 45', () => {
      expect(clampElevation(45)).toBe(45);
    });

    it('should return 90 for input 90', () => {
      expect(clampElevation(90)).toBe(90);
    });

    it('should clamp negative to 0', () => {
      expect(clampElevation(-1)).toBe(0);
    });

    it('should clamp -90 to 0', () => {
      expect(clampElevation(-90)).toBe(0);
    });

    it('should clamp >90 to 90', () => {
      expect(clampElevation(91)).toBe(90);
    });

    it('should clamp 180 to 90', () => {
      expect(clampElevation(180)).toBe(90);
    });
  });

  describe('azimuthToBucket', () => {
    it('should map 0° to bucket 0', () => {
      expect(azimuthToBucket(0)).toBe(0);
    });

    it('should map 1° to bucket 0', () => {
      expect(azimuthToBucket(1)).toBe(0);
    });

    it('should map 2° to bucket 1', () => {
      expect(azimuthToBucket(2)).toBe(1);
    });

    it('should map 90° (east) to bucket 45', () => {
      expect(azimuthToBucket(90)).toBe(45);
    });

    it('should map 180° (south) to bucket 90', () => {
      expect(azimuthToBucket(180)).toBe(90);
    });

    it('should map 270° (west) to bucket 135', () => {
      expect(azimuthToBucket(270)).toBe(135);
    });

    it('should map 359° to bucket 179', () => {
      expect(azimuthToBucket(359)).toBe(179);
    });

    it('should wrap 361° to bucket 0', () => {
      expect(azimuthToBucket(361)).toBe(0);
    });

    it('should wrap -1° to bucket 179', () => {
      expect(azimuthToBucket(-1)).toBe(179);
    });
  });

  describe('elevationToBucket', () => {
    it('should map 0° to bucket 0', () => {
      expect(elevationToBucket(0)).toBe(0);
    });

    it('should map 1° to bucket 0', () => {
      expect(elevationToBucket(1)).toBe(0);
    });

    it('should map 2° to bucket 1', () => {
      expect(elevationToBucket(2)).toBe(1);
    });

    it('should map 45° to bucket 22', () => {
      expect(elevationToBucket(45)).toBe(22);
    });

    it('should map 90° (zenith) to bucket 44', () => {
      expect(elevationToBucket(90)).toBe(44);
    });

    it('should clamp negative to bucket 0', () => {
      expect(elevationToBucket(-10)).toBe(0);
    });

    it('should clamp >90 to bucket 44', () => {
      expect(elevationToBucket(100)).toBe(44);
    });
  });

  describe('bucketToAngle', () => {
    it('should map bucket 0 to 1° (center of 0-2°)', () => {
      expect(bucketToAngle(0, 2)).toBe(1);
    });

    it('should map bucket 45 to 91° (center of 90-92°)', () => {
      expect(bucketToAngle(45, 2)).toBe(91);
    });

    it('should work with elevation resolution', () => {
      expect(bucketToAngle(22, 2)).toBe(45);
    });

    it('should throw for negative bucket index', () => {
      expect(() => bucketToAngle(-1, 2)).toThrow('Bucket index must be non-negative');
    });
  });

  describe('createEmptyCell', () => {
    it('should create cell with Unknown classification', () => {
      const cell = createEmptyCell();
      expect(cell.classification).toBe(ObstructionType.Unknown);
    });

    it('should create cell with zero confidence', () => {
      const cell = createEmptyCell();
      expect(cell.confidence).toBe(0);
    });

    it('should create cell with null lastUpdated', () => {
      const cell = createEmptyCell();
      expect(cell.lastUpdated).toBeNull();
    });
  });

  describe('createEmptySkyMask', () => {
    it('should create mask with correct dimensions', () => {
      const mask = createEmptySkyMask(testLogger);
      
      expect(mask.grid.length).toBe(AZIMUTH_BUCKETS);
      expect(mask.grid[0].length).toBe(ELEVATION_BUCKETS);
    });

    it('should have all cells as Unknown', () => {
      const mask = createEmptySkyMask();
      
      for (let az = 0; az < AZIMUTH_BUCKETS; az++) {
        for (let el = 0; el < ELEVATION_BUCKETS; el++) {
          expect(mask.grid[az][el].classification).toBe(ObstructionType.Unknown);
        }
      }
    });

    it('should have metadata with creation time', () => {
      const before = new Date();
      const mask = createEmptySkyMask();
      const after = new Date();
      
      expect(mask.metadata.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(mask.metadata.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have null lastUpdated initially', () => {
      const mask = createEmptySkyMask();
      expect(mask.metadata.lastUpdated).toBeNull();
    });

    it('should log creation', () => {
      createEmptySkyMask(testLogger);
      
      expect(testLogger.entries.length).toBeGreaterThan(0);
      expect(testLogger.findByMessage('Created empty sky mask')).toBeDefined();
    });

    it('should have correct resolution in metadata', () => {
      const mask = createEmptySkyMask();
      expect(mask.metadata.azimuthResolution).toBe(2);
      expect(mask.metadata.elevationResolution).toBe(2);
    });
  });

  describe('getSkyMaskCell', () => {
    it('should return correct cell for north horizon', () => {
      const mask = createEmptySkyMask();
      const cell = getSkyMaskCell(mask, 0, 0);
      
      expect(cell.classification).toBe(ObstructionType.Unknown);
    });

    it('should return correct cell for south zenith', () => {
      const mask = createEmptySkyMask();
      const cell = getSkyMaskCell(mask, 180, 90);
      
      expect(cell.classification).toBe(ObstructionType.Unknown);
    });

    it('should wrap azimuth correctly', () => {
      const mask = createEmptySkyMask();
      
      const cell1 = getSkyMaskCell(mask, 0, 45);
      const cell2 = getSkyMaskCell(mask, 360, 45);
      
      expect(cell1).toBe(mask.grid[0][22]);
      expect(cell2).toBe(mask.grid[0][22]);
    });

    it('should clamp elevation correctly', () => {
      const mask = createEmptySkyMask();
      
      const cell1 = getSkyMaskCell(mask, 90, 90);
      const cell2 = getSkyMaskCell(mask, 90, 100);
      
      expect(cell1).toBe(mask.grid[45][44]);
      expect(cell2).toBe(mask.grid[45][44]);
    });

    it('should log access', () => {
      const mask = createEmptySkyMask();
      getSkyMaskCell(mask, 45, 30, testLogger);
      
      expect(testLogger.findByMessage('Getting sky mask cell')).toBeDefined();
    });
  });

  describe('setSkyMaskCell', () => {
    it('should return new mask without mutating original', () => {
      const mask = createEmptySkyMask();
      const newMask = setSkyMaskCell(mask, 45, 30, ObstructionType.Sky, 0.9);
      
      // Original should be unchanged
      expect(mask.grid[22][15].classification).toBe(ObstructionType.Unknown);
      
      // New should have the value
      expect(newMask.grid[22][15].classification).toBe(ObstructionType.Sky);
    });

    it('should set correct classification', () => {
      const mask = createEmptySkyMask();
      const newMask = setSkyMaskCell(mask, 90, 45, ObstructionType.Building, 0.8);
      
      expect(newMask.grid[45][22].classification).toBe(ObstructionType.Building);
    });

    it('should clamp confidence to [0, 1]', () => {
      const mask = createEmptySkyMask();
      
      const maskLow = setSkyMaskCell(mask, 0, 0, ObstructionType.Sky, -0.5);
      const maskHigh = setSkyMaskCell(mask, 0, 0, ObstructionType.Sky, 1.5);
      
      expect(maskLow.grid[0][0].confidence).toBe(0);
      expect(maskHigh.grid[0][0].confidence).toBe(1);
    });

    it('should set lastUpdated timestamp', () => {
      const before = new Date();
      const mask = createEmptySkyMask();
      const newMask = setSkyMaskCell(mask, 0, 0, ObstructionType.Sky, 1);
      const after = new Date();
      
      expect(newMask.grid[0][0].lastUpdated).not.toBeNull();
      expect(newMask.grid[0][0].lastUpdated!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(newMask.grid[0][0].lastUpdated!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should update metadata.lastUpdated', () => {
      const mask = createEmptySkyMask();
      const newMask = setSkyMaskCell(mask, 0, 0, ObstructionType.Sky, 1);
      
      expect(newMask.metadata.lastUpdated).not.toBeNull();
    });

    it('should wrap azimuth', () => {
      const mask = createEmptySkyMask();
      const newMask = setSkyMaskCell(mask, 361, 0, ObstructionType.Tree, 1);
      
      expect(newMask.grid[0][0].classification).toBe(ObstructionType.Tree);
    });

    it('should clamp elevation', () => {
      const mask = createEmptySkyMask();
      const newMask = setSkyMaskCell(mask, 0, 100, ObstructionType.Tree, 1);
      
      expect(newMask.grid[0][44].classification).toBe(ObstructionType.Tree);
    });

    it('should log the update', () => {
      const mask = createEmptySkyMask();
      setSkyMaskCell(mask, 45, 30, ObstructionType.Sky, 0.9, testLogger);
      
      expect(testLogger.findByMessage('Set sky mask cell')).toBeDefined();
    });
  });

  describe('getMaskCoverage', () => {
    it('should return 0 for empty mask', () => {
      const mask = createEmptySkyMask();
      const coverage = getMaskCoverage(mask, testLogger);
      
      expect(coverage).toBe(0);
    });

    it('should return 1 for fully classified mask', () => {
      let mask = createEmptySkyMask();
      
      // Set all cells to Sky
      for (let az = 0; az < AZIMUTH_BUCKETS; az++) {
        for (let el = 0; el < ELEVATION_BUCKETS; el++) {
          mask = setSkyMaskCell(
            mask,
            az * 2 + 1,
            el * 2 + 1,
            ObstructionType.Sky,
            1
          );
        }
      }
      
      const coverage = getMaskCoverage(mask);
      expect(coverage).toBe(1);
    });

    it('should return 0.5 for half classified mask', () => {
      let mask = createEmptySkyMask();
      
      // Set half the cells
      for (let az = 0; az < AZIMUTH_BUCKETS / 2; az++) {
        for (let el = 0; el < ELEVATION_BUCKETS; el++) {
          mask = setSkyMaskCell(
            mask,
            az * 2 + 1,
            el * 2 + 1,
            ObstructionType.Sky,
            1
          );
        }
      }
      
      const coverage = getMaskCoverage(mask);
      expect(coverage).toBe(0.5);
    });

    it('should log coverage calculation', () => {
      const mask = createEmptySkyMask();
      getMaskCoverage(mask, testLogger);
      
      expect(testLogger.findByMessage('Calculated mask coverage')).toBeDefined();
    });
  });

  describe('getMaskStatistics', () => {
    it('should count all cells as Unknown for empty mask', () => {
      const mask = createEmptySkyMask();
      const stats = getMaskStatistics(mask);
      
      expect(stats[ObstructionType.Unknown]).toBe(AZIMUTH_BUCKETS * ELEVATION_BUCKETS);
      expect(stats[ObstructionType.Sky]).toBe(0);
    });

    it('should correctly count mixed classifications', () => {
      let mask = createEmptySkyMask();
      
      // Set some cells to different types
      mask = setSkyMaskCell(mask, 0, 0, ObstructionType.Sky, 1);
      mask = setSkyMaskCell(mask, 2, 0, ObstructionType.Tree, 1);
      mask = setSkyMaskCell(mask, 4, 0, ObstructionType.Building, 1);
      
      const stats = getMaskStatistics(mask);
      
      expect(stats[ObstructionType.Sky]).toBe(1);
      expect(stats[ObstructionType.Tree]).toBe(1);
      expect(stats[ObstructionType.Building]).toBe(1);
      expect(stats[ObstructionType.Unknown]).toBe(AZIMUTH_BUCKETS * ELEVATION_BUCKETS - 3);
    });
  });
});
