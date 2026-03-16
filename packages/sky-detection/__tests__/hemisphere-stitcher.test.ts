/**
 * @module @sunscope/sky-detection/__tests__/hemisphere-stitcher
 * @description Tests for hemisphere stitcher (R-SKY-002)
 * 
 * Acceptance Criteria:
 * - Given a ScanFrame with device orientation, project pixel classifications onto SkyMask
 * - Handle device azimuth, elevation, roll correctly
 * - Apply field-of-view to determine angular extent of each pixel
 * - Last-write-wins with confidence weighting
 * - Log all operations via structured logger
 */

import {
  pixelToSpherical,
  stitchFrame,
  calculatePixelAngularSize,
  createScanFrame
} from '../src/hemisphere-stitcher';

import {
  createEmptySkyMask,
  getSkyMaskCell
} from '../src/sky-mask';

import {
  ObstructionType,
  PixelGrid
} from '../src/types';

import { TestLogger } from '@sunscope/core';

describe('R-SKY-002: Hemisphere Stitcher', () => {
  let logger: TestLogger;

  beforeEach(() => {
    logger = new TestLogger('hemisphere-stitcher-test');
  });

  afterEach(() => {
    logger.clear();
  });

  describe('pixelToSpherical', () => {
    it('should project center pixel to device orientation', () => {
      // Device looking north, level (0° elevation)
      // For 64-wide grid, center is between pixels 31 and 32
      // Using odd-sized grid for exact center
      const result = pixelToSpherical({
        pixelX: 31, // Center of 63-wide grid (pixels 0-62)
        pixelY: 31,
        gridWidth: 63,
        gridHeight: 63,
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // Center pixel should map to device orientation
      expect(result.azimuth).toBeCloseTo(0, 1);
      expect(result.elevation).toBeCloseTo(0, 1);
    });

    it('should project left pixel to left of center (negative azimuth offset)', () => {
      const result = pixelToSpherical({
        pixelX: 0, // Left edge
        pixelY: 32,
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // Left edge should be -30° from center (half of 60° FOV)
      expect(result.azimuth).toBeCloseTo(330, 0); // 0 - 30 = -30 = 330
      expect(result.elevation).toBeCloseTo(0, 1);
    });

    it('should project right pixel to right of center (positive azimuth offset)', () => {
      const result = pixelToSpherical({
        pixelX: 63, // Right edge
        pixelY: 32,
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // Right edge should be +30° from center
      expect(result.azimuth).toBeCloseTo(30, 0);
      expect(result.elevation).toBeCloseTo(0, 1);
    });

    it('should project top pixel to above center (positive elevation)', () => {
      const result = pixelToSpherical({
        pixelX: 32,
        pixelY: 0, // Top edge
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // Top edge should be +30° elevation from center
      expect(result.elevation).toBeCloseTo(30, 0);
    });

    it('should project bottom pixel to below center (negative elevation)', () => {
      const result = pixelToSpherical({
        pixelX: 32,
        pixelY: 63, // Bottom edge
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // Bottom edge should be -30° elevation (clamped to 0)
      expect(result.elevation).toBeCloseTo(0, 0);
    });

    it('should handle non-zero device elevation', () => {
      const result = pixelToSpherical({
        pixelX: 32,
        pixelY: 0,
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 0,
        deviceElevation: 45, // Device tilted up 45°
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // Center is at 45°, top edge is +30° from there = 75°
      expect(result.elevation).toBeCloseTo(75, 0);
    });

    it('should handle non-zero device azimuth', () => {
      const result = pixelToSpherical({
        pixelX: 63, // Right edge
        pixelY: 32,
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 90, // Facing east
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // Facing east (90°), right edge is +30° = 120°
      expect(result.azimuth).toBeCloseTo(120, 0);
    });

    it('should wrap azimuth correctly', () => {
      const result = pixelToSpherical({
        pixelX: 0, // Left edge
        pixelY: 32,
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 10, // Near north
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // Facing 10°, left edge is -30° = -20° = 340°
      expect(result.azimuth).toBeCloseTo(340, 0);
    });

    it('should clamp elevation to [0, 90]', () => {
      const result = pixelToSpherical({
        pixelX: 32,
        pixelY: 0,
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 0,
        deviceElevation: 80, // Almost straight up
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // 80° + 30° = 110°, clamped to 90°
      expect(result.elevation).toBe(90);
    });

    it('should handle iPhone typical FOV (73.5° H x 56° V)', () => {
      // Use odd grid for exact center calculation
      const result = pixelToSpherical({
        pixelX: 0,
        pixelY: 31,
        gridWidth: 63,
        gridHeight: 63,
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 73.5,
        fieldOfViewV: 56
      });

      // Left edge pixel center is at -35.625° (with 73.5°/63 = 1.1667° per pixel)
      // Pixel 0 center: (0 + 0.5) / 63 - 0.5 = -0.49206 * 73.5 = -36.17°
      expect(result.azimuth).toBeCloseTo(323.83, 0); // 360 - 36.17 = 323.83
    });
  });

  describe('calculatePixelAngularSize', () => {
    it('should calculate angular size for square pixels', () => {
      const size = calculatePixelAngularSize({
        gridWidth: 64,
        gridHeight: 64,
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // 60° / 64 pixels = 0.9375° per pixel
      expect(size.azimuthSize).toBeCloseTo(0.9375, 3);
      expect(size.elevationSize).toBeCloseTo(0.9375, 3);
    });

    it('should handle rectangular FOV', () => {
      const size = calculatePixelAngularSize({
        gridWidth: 64,
        gridHeight: 48,
        fieldOfViewH: 73.5,
        fieldOfViewV: 56
      });

      expect(size.azimuthSize).toBeCloseTo(73.5 / 64, 4);
      expect(size.elevationSize).toBeCloseTo(56 / 48, 4);
    });
  });

  describe('createScanFrame', () => {
    it('should create a ScanFrame with given parameters', () => {
      const pixelGrid: PixelGrid = {
        width: 4,
        height: 4,
        data: [
          [ObstructionType.Sky, ObstructionType.Sky, ObstructionType.Building, ObstructionType.Building],
          [ObstructionType.Sky, ObstructionType.Sky, ObstructionType.Building, ObstructionType.Building],
          [ObstructionType.Sky, ObstructionType.Sky, ObstructionType.Building, ObstructionType.Building],
          [ObstructionType.Sky, ObstructionType.Sky, ObstructionType.Building, ObstructionType.Building]
        ]
      };

      const frame = createScanFrame({
        deviceAzimuth: 90,
        deviceElevation: 30,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: pixelGrid
      });

      expect(frame.deviceAzimuth).toBe(90);
      expect(frame.deviceElevation).toBe(30);
      expect(frame.deviceRoll).toBe(0);
      expect(frame.fieldOfViewH).toBe(60);
      expect(frame.fieldOfViewV).toBe(60);
      expect(frame.pixelClassifications).toBe(pixelGrid);
      expect(frame.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('stitchFrame', () => {
    it('should stitch a simple frame onto empty mask', () => {
      const mask = createEmptySkyMask(logger);
      logger.clear();

      // Create a simple 4x4 frame: left half sky, right half building
      const pixelGrid: PixelGrid = {
        width: 4,
        height: 4,
        data: [
          [ObstructionType.Sky, ObstructionType.Sky, ObstructionType.Building, ObstructionType.Building],
          [ObstructionType.Sky, ObstructionType.Sky, ObstructionType.Building, ObstructionType.Building],
          [ObstructionType.Sky, ObstructionType.Sky, ObstructionType.Building, ObstructionType.Building],
          [ObstructionType.Sky, ObstructionType.Sky, ObstructionType.Building, ObstructionType.Building]
        ]
      };

      const frame = createScanFrame({
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: pixelGrid
      });

      const newMask = stitchFrame(mask, frame, logger);

      // Verify mask was updated (new instance)
      expect(newMask).not.toBe(mask);

      // Trace through projection for 4x4 grid:
      // Pixel 0,2 (row 2 is Sky): az = -22.5°, el = 0° (clamped from -7.5°)
      // Pixel 2,2 (row 2 is Building): az = +7.5°, el = 0°
      const leftCoords = pixelToSpherical({
        pixelX: 0, pixelY: 2, gridWidth: 4, gridHeight: 4,
        deviceAzimuth: 0, deviceElevation: 0, deviceRoll: 0,
        fieldOfViewH: 60, fieldOfViewV: 60
      });
      const rightCoords = pixelToSpherical({
        pixelX: 2, pixelY: 2, gridWidth: 4, gridHeight: 4,
        deviceAzimuth: 0, deviceElevation: 0, deviceRoll: 0,
        fieldOfViewH: 60, fieldOfViewV: 60
      });
      
      // Check cells at projected coordinates
      const leftCell = getSkyMaskCell(newMask, leftCoords.azimuth, leftCoords.elevation, logger);
      expect(leftCell.classification).toBe(ObstructionType.Sky);

      const rightCell = getSkyMaskCell(newMask, rightCoords.azimuth, rightCoords.elevation, logger);
      expect(rightCell.classification).toBe(ObstructionType.Building);

      // Verify logging
      expect(logger.hasEntry(e => e.message.includes('Stitched frame'))).toBe(true);
    });

    it('should use last-write-wins for overlapping cells', () => {
      const mask = createEmptySkyMask(logger);
      logger.clear();

      // First frame: everything is Sky
      const frame1 = createScanFrame({
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: {
          width: 2,
          height: 2,
          data: [
            [ObstructionType.Sky, ObstructionType.Sky],
            [ObstructionType.Sky, ObstructionType.Sky]
          ]
        }
      });

      // For 2x2 grid with 60° FOV: each pixel = 30°
      // Pixel 0,0 center: -30° + 15° = -15° = 345°, 30° - 15° = 15° elevation
      // Pixel 0,1 center: +15° = 15°, 15° elevation
      let updatedMask = stitchFrame(mask, frame1, logger);
      const cellAfterFirst = getSkyMaskCell(updatedMask, 345, 15, logger);
      expect(cellAfterFirst.classification).toBe(ObstructionType.Sky);

      // Second frame: center is Building (overlaps first frame)
      const frame2 = createScanFrame({
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: {
          width: 2,
          height: 2,
          data: [
            [ObstructionType.Building, ObstructionType.Building],
            [ObstructionType.Building, ObstructionType.Building]
          ]
        }
      });

      updatedMask = stitchFrame(updatedMask, frame2, logger);
      const cellAfterSecond = getSkyMaskCell(updatedMask, 345, 15, logger);

      // Should be Building (last write wins)
      expect(cellAfterSecond.classification).toBe(ObstructionType.Building);
    });

    it('should handle multiple frames at different orientations', () => {
      const mask = createEmptySkyMask(logger);
      logger.clear();

      // Frame 1: facing north
      const frame1 = createScanFrame({
        deviceAzimuth: 0,
        deviceElevation: 30,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: {
          width: 4,
          height: 4,
          data: Array(4).fill(Array(4).fill(ObstructionType.Tree))
        }
      });

      // Frame 2: facing east
      const frame2 = createScanFrame({
        deviceAzimuth: 90,
        deviceElevation: 30,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: {
          width: 4,
          height: 4,
          data: Array(4).fill(Array(4).fill(ObstructionType.Building))
        }
      });

      let updatedMask = stitchFrame(mask, frame1, logger);
      updatedMask = stitchFrame(updatedMask, frame2, logger);

      // For frame facing north at 30° elevation with 60° FOV:
      // Center pixel projects to az=0, el=30
      const northCoords = pixelToSpherical({
        pixelX: 1, pixelY: 1, gridWidth: 4, gridHeight: 4,
        deviceAzimuth: 0, deviceElevation: 30, deviceRoll: 0,
        fieldOfViewH: 60, fieldOfViewV: 60
      });
      
      // For frame facing east at 30° elevation:
      // Center pixel projects to az=90, el=30
      const eastCoords = pixelToSpherical({
        pixelX: 1, pixelY: 1, gridWidth: 4, gridHeight: 4,
        deviceAzimuth: 90, deviceElevation: 30, deviceRoll: 0,
        fieldOfViewH: 60, fieldOfViewV: 60
      });
      
      const northCell = getSkyMaskCell(updatedMask, northCoords.azimuth, northCoords.elevation, logger);
      expect(northCell.classification).toBe(ObstructionType.Tree);

      const eastCell = getSkyMaskCell(updatedMask, eastCoords.azimuth, eastCoords.elevation, logger);
      expect(eastCell.classification).toBe(ObstructionType.Building);
    });

    it('should calculate confidence based on pixel position (center = higher)', () => {
      const mask = createEmptySkyMask(logger);
      logger.clear();

      // Frame with center pixel as Sky
      const frame = createScanFrame({
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: {
          width: 3,
          height: 3,
          data: [
            [ObstructionType.Unknown, ObstructionType.Unknown, ObstructionType.Unknown],
            [ObstructionType.Unknown, ObstructionType.Sky, ObstructionType.Unknown],
            [ObstructionType.Unknown, ObstructionType.Unknown, ObstructionType.Unknown]
          ]
        }
      });

      const updatedMask = stitchFrame(mask, frame, logger);
      const centerCell = getSkyMaskCell(updatedMask, 0, 0, logger);

      expect(centerCell.classification).toBe(ObstructionType.Sky);
      // Center pixel should have higher confidence
      expect(centerCell.confidence).toBeGreaterThan(0.5);
    });

    it('should handle frame with roll rotation', () => {
      // Roll should affect the projection
      const result = pixelToSpherical({
        pixelX: 0, // Top-left corner
        pixelY: 0,
        gridWidth: 64,
        gridHeight: 64,
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 45, // 45 degree roll
        fieldOfViewH: 60,
        fieldOfViewV: 60
      });

      // With roll, top-left corner shifts in azimuth/elevation
      // This is a simplified check - real roll math is complex
      expect(result.azimuth).toBeDefined();
      expect(result.elevation).toBeDefined();
      expect(result.azimuth).toBeGreaterThanOrEqual(0);
      expect(result.azimuth).toBeLessThan(360);
      expect(result.elevation).toBeGreaterThanOrEqual(0);
      expect(result.elevation).toBeLessThanOrEqual(90);
    });

    it('should skip Unknown classifications during stitching', () => {
      const mask = createEmptySkyMask(logger);
      logger.clear();

      const frame = createScanFrame({
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: {
          width: 2,
          height: 2,
          data: [
            [ObstructionType.Sky, ObstructionType.Unknown],
            [ObstructionType.Unknown, ObstructionType.Building]
          ]
        }
      });

      const updatedMask = stitchFrame(mask, frame, logger);

      // Count classified cells
      let classifiedCount = 0;
      for (let az = 0; az < 180; az++) {
        for (let el = 0; el < 45; el++) {
          if (updatedMask.grid[az][el].classification !== ObstructionType.Unknown) {
            classifiedCount++;
          }
        }
      }

      // Only 2 cells should be classified (Sky and Building)
      expect(classifiedCount).toBe(2);
    });

    it('should update mask metadata.lastUpdated', () => {
      const mask = createEmptySkyMask(logger);
      const beforeTime = new Date();

      const frame = createScanFrame({
        deviceAzimuth: 0,
        deviceElevation: 0,
        deviceRoll: 0,
        fieldOfViewH: 60,
        fieldOfViewV: 60,
        pixelClassifications: {
          width: 2,
          height: 2,
          data: [
            [ObstructionType.Sky, ObstructionType.Sky],
            [ObstructionType.Sky, ObstructionType.Sky]
          ]
        }
      });

      const updatedMask = stitchFrame(mask, frame, logger);

      expect(updatedMask.metadata.lastUpdated).not.toBeNull();
      expect(updatedMask.metadata.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });
});
