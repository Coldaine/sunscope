/**
 * @module @sunscope/sky-detection/__tests__/arc-integrator
 * @description Tests for arc integrator (R-SKY-003)
 * 
 * Acceptance Criteria:
 * - Given a SkyMask and sun path samples, calculate total hours of direct sun
 * - Identify continuous blocked/unblocked segments
 * - Handle unknown mask regions conservatively
 * - Return ArcSegment array with timing and obstruction info
 * - Log all operations via structured logger
 */

import {
  integrateSunHours,
  isSunBlocked,
  findArcSegments,
  SunSample
} from '../src/arc-integrator';

import {
  createEmptySkyMask,
  setSkyMaskCell
} from '../src/sky-mask';

import { ObstructionType } from '../src/types';
import { TestLogger } from '@sunscope/core';

describe('R-SKY-003: Arc Integrator', () => {
  let logger: TestLogger;

  beforeEach(() => {
    logger = new TestLogger('arc-integrator-test');
  });

  afterEach(() => {
    logger.clear();
  });

  describe('isSunBlocked', () => {
    it('should return false for clear sky mask', () => {
      const mask = createEmptySkyMask(logger);
      logger.clear();

      // Create a sample sun position at north horizon
      const sample: SunSample = {
        timestamp: new Date('2026-03-16T12:00:00Z'),
        azimuth: 0,
        elevation: 30,
        isDaytime: true
      };

      // Default mask has all Unknown - should be conservative and block
      expect(isSunBlocked(mask, sample)).toBe(true);
    });

    it('should return false when sun hits Sky cell', () => {
      let mask = createEmptySkyMask(logger);
      logger.clear();

      // Set a Sky cell at north, 30° elevation
      mask = setSkyMaskCell(mask, 0, 30, ObstructionType.Sky, 1.0, logger);
      logger.clear();

      const sample: SunSample = {
        timestamp: new Date('2026-03-16T12:00:00Z'),
        azimuth: 0,
        elevation: 30,
        isDaytime: true
      };

      expect(isSunBlocked(mask, sample)).toBe(false);
    });

    it('should return true when sun hits Tree cell', () => {
      let mask = createEmptySkyMask(logger);

      // Set a Tree cell at south, 45° elevation
      mask = setSkyMaskCell(mask, 180, 45, ObstructionType.Tree, 1.0, logger);

      const sample: SunSample = {
        timestamp: new Date('2026-03-16T12:00:00Z'),
        azimuth: 180,
        elevation: 45,
        isDaytime: true
      };

      expect(isSunBlocked(mask, sample)).toBe(true);
    });

    it('should return true when sun hits Building cell', () => {
      let mask = createEmptySkyMask(logger);

      mask = setSkyMaskCell(mask, 90, 20, ObstructionType.Building, 1.0, logger);

      const sample: SunSample = {
        timestamp: new Date('2026-03-16T12:00:00Z'),
        azimuth: 90,
        elevation: 20,
        isDaytime: true
      };

      expect(isSunBlocked(mask, sample)).toBe(true);
    });

    it('should return true for nighttime (isDaytime = false)', () => {
      const mask = createEmptySkyMask(logger);

      const sample: SunSample = {
        timestamp: new Date('2026-03-16T02:00:00Z'),
        azimuth: 0,
        elevation: -10, // Below horizon
        isDaytime: false
      };

      expect(isSunBlocked(mask, sample)).toBe(true);
    });

    it('should handle negative elevation', () => {
      const mask = createEmptySkyMask(logger);

      const sample: SunSample = {
        timestamp: new Date('2026-03-16T06:00:00Z'),
        azimuth: 90,
        elevation: -5, // Just below horizon
        isDaytime: false
      };

      expect(isSunBlocked(mask, sample)).toBe(true);
    });
  });

  describe('findArcSegments', () => {
    it('should return empty array for no samples', () => {
      const segments = findArcSegments([], createEmptySkyMask(logger), logger);
      expect(segments).toHaveLength(0);
    });

    it('should return single segment for all blocked', () => {
      const mask = createEmptySkyMask(logger); // All Unknown = blocked
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true },
        { timestamp: new Date('2026-03-16T11:00:00Z'), azimuth: 150, elevation: 45, isDaytime: true },
        { timestamp: new Date('2026-03-16T12:00:00Z'), azimuth: 180, elevation: 50, isDaytime: true }
      ];

      const segments = findArcSegments(samples, mask, logger);
      
      expect(segments).toHaveLength(1);
      expect(segments[0].blocked).toBe(true);
      expect(segments[0].startTime).toEqual(samples[0].timestamp);
      expect(segments[0].endTime).toEqual(samples[2].timestamp);
    });

    it('should return single segment for all unblocked', () => {
      let mask = createEmptySkyMask(logger);
      
      // Set Sky cells for all sample positions
      mask = setSkyMaskCell(mask, 120, 30, ObstructionType.Sky, 1.0, logger);
      mask = setSkyMaskCell(mask, 150, 45, ObstructionType.Sky, 1.0, logger);
      mask = setSkyMaskCell(mask, 180, 50, ObstructionType.Sky, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true },
        { timestamp: new Date('2026-03-16T11:00:00Z'), azimuth: 150, elevation: 45, isDaytime: true },
        { timestamp: new Date('2026-03-16T12:00:00Z'), azimuth: 180, elevation: 50, isDaytime: true }
      ];

      const segments = findArcSegments(samples, mask, logger);
      
      expect(segments).toHaveLength(1);
      expect(segments[0].blocked).toBe(false);
      expect(segments[0].obstruction).toBeNull();
    });

    it('should split into blocked/unblocked segments', () => {
      let mask = createEmptySkyMask(logger);
      
      // First two samples blocked (Unknown), last one Sky
      mask = setSkyMaskCell(mask, 180, 50, ObstructionType.Sky, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true },
        { timestamp: new Date('2026-03-16T11:00:00Z'), azimuth: 150, elevation: 45, isDaytime: true },
        { timestamp: new Date('2026-03-16T12:00:00Z'), azimuth: 180, elevation: 50, isDaytime: true }
      ];

      const segments = findArcSegments(samples, mask, logger);
      
      expect(segments).toHaveLength(2);
      expect(segments[0].blocked).toBe(true);
      expect(segments[1].blocked).toBe(false);
    });

    it('should identify obstruction type for blocked segments', () => {
      let mask = createEmptySkyMask(logger);
      
      // Blocked by Tree
      mask = setSkyMaskCell(mask, 90, 30, ObstructionType.Tree, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 90, elevation: 30, isDaytime: true }
      ];

      const segments = findArcSegments(samples, mask, logger);
      
      expect(segments[0].blocked).toBe(true);
      expect(segments[0].obstruction).toBe(ObstructionType.Tree);
    });

    it('should use most common obstruction for segment', () => {
      let mask = createEmptySkyMask(logger);
      
      mask = setSkyMaskCell(mask, 90, 30, ObstructionType.Tree, 1.0, logger);
      mask = setSkyMaskCell(mask, 100, 35, ObstructionType.Tree, 1.0, logger);
      mask = setSkyMaskCell(mask, 110, 40, ObstructionType.Building, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 90, elevation: 30, isDaytime: true },
        { timestamp: new Date('2026-03-16T11:00:00Z'), azimuth: 100, elevation: 35, isDaytime: true },
        { timestamp: new Date('2026-03-16T12:00:00Z'), azimuth: 110, elevation: 40, isDaytime: true }
      ];

      const segments = findArcSegments(samples, mask, logger);
      
      expect(segments[0].blocked).toBe(true);
      expect(segments[0].obstruction).toBe(ObstructionType.Tree); // Most common
    });
  });

  describe('integrateSunHours', () => {
    it('should return zero for empty samples', () => {
      const mask = createEmptySkyMask(logger);
      
      const result = integrateSunHours(mask, [], logger);
      
      expect(result.totalHours).toBe(0);
      expect(result.segments).toHaveLength(0);
      expect(result.maskIncomplete).toBe(true);
      expect(result.stats.totalSamples).toBe(0);
    });

    it('should calculate zero hours for fully blocked mask', () => {
      const mask = createEmptySkyMask(logger); // All Unknown = blocked
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true },
        { timestamp: new Date('2026-03-16T11:00:00Z'), azimuth: 150, elevation: 45, isDaytime: true },
        { timestamp: new Date('2026-03-16T12:00:00Z'), azimuth: 180, elevation: 50, isDaytime: true }
      ];

      const result = integrateSunHours(mask, samples, logger);
      
      expect(result.totalHours).toBe(0);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].blocked).toBe(true);
      expect(result.stats.blockedCount).toBe(3);
      expect(result.stats.unblockedCount).toBe(0);
    });

    it('should calculate full hours for fully clear mask', () => {
      let mask = createEmptySkyMask(logger);
      
      // Set all cells to Sky
      mask = setSkyMaskCell(mask, 120, 30, ObstructionType.Sky, 1.0, logger);
      mask = setSkyMaskCell(mask, 150, 45, ObstructionType.Sky, 1.0, logger);
      mask = setSkyMaskCell(mask, 180, 50, ObstructionType.Sky, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true },
        { timestamp: new Date('2026-03-16T11:00:00Z'), azimuth: 150, elevation: 45, isDaytime: true },
        { timestamp: new Date('2026-03-16T12:00:00Z'), azimuth: 180, elevation: 50, isDaytime: true }
      ];

      const result = integrateSunHours(mask, samples, logger);
      
      // 2 hours between first and last sample
      expect(result.totalHours).toBeCloseTo(2, 1);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].blocked).toBe(false);
      expect(result.stats.unblockedCount).toBe(3);
    });

    it('should calculate partial hours for half-blocked mask', () => {
      let mask = createEmptySkyMask(logger);
      
      // First half blocked (Unknown), second half Sky
      mask = setSkyMaskCell(mask, 150, 45, ObstructionType.Sky, 1.0, logger);
      mask = setSkyMaskCell(mask, 180, 50, ObstructionType.Sky, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true },
        { timestamp: new Date('2026-03-16T11:00:00Z'), azimuth: 150, elevation: 45, isDaytime: true },
        { timestamp: new Date('2026-03-16T12:00:00Z'), azimuth: 180, elevation: 50, isDaytime: true }
      ];

      const result = integrateSunHours(mask, samples, logger);
      
      // 1 hour of unblocked sun
      expect(result.totalHours).toBeCloseTo(1, 1);
      expect(result.segments).toHaveLength(2);
      expect(result.stats.blockedCount).toBe(1);
      expect(result.stats.unblockedCount).toBe(2);
    });

    it('should mark maskIncomplete when samples hit unknown cells', () => {
      const mask = createEmptySkyMask(logger); // All Unknown
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true }
      ];

      const result = integrateSunHours(mask, samples, logger);
      
      expect(result.maskIncomplete).toBe(true);
      expect(result.stats.unknownCount).toBe(1);
    });

    it('should not mark maskIncomplete when fully classified', () => {
      let mask = createEmptySkyMask(logger);
      mask = setSkyMaskCell(mask, 120, 30, ObstructionType.Sky, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true }
      ];

      const result = integrateSunHours(mask, samples, logger);
      
      expect(result.maskIncomplete).toBe(false);
      expect(result.stats.unknownCount).toBe(0);
    });

    it('should log integration results', () => {
      let mask = createEmptySkyMask(logger);
      mask = setSkyMaskCell(mask, 120, 30, ObstructionType.Sky, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T10:00:00Z'), azimuth: 120, elevation: 30, isDaytime: true }
      ];

      integrateSunHours(mask, samples, logger);
      
      expect(logger.hasEntry(e => e.message.includes('Integrated sun hours'))).toBe(true);
    });

    it('should handle single sample', () => {
      let mask = createEmptySkyMask(logger);
      mask = setSkyMaskCell(mask, 180, 45, ObstructionType.Sky, 1.0, logger);
      logger.clear();

      const samples: SunSample[] = [
        { timestamp: new Date('2026-03-16T12:00:00Z'), azimuth: 180, elevation: 45, isDaytime: true }
      ];

      const result = integrateSunHours(mask, samples, logger);
      
      // Single sample = 0 hours (no duration)
      expect(result.totalHours).toBe(0);
      expect(result.segments).toHaveLength(1);
    });
  });
});
