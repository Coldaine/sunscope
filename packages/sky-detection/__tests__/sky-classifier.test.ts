/**
 * @module @sunscope/sky-detection/__tests__/sky-classifier
 * @description Tests for sky classifier interface (R-SKY-004)
 * 
 * Acceptance Criteria:
 * - SkyClassifier interface defines classifyFrame method
 * - MockSkyClassifier returns predetermined classifications for testing
 * - DeepLabV3Classifier stub exists for future native implementation
 * - PixelGrid output matches input dimensions
 * - Classifications are valid ObstructionType values
 */

import {
  SkyClassifier,
  MockSkyClassifier,
  DeepLabV3Classifier,
  createPixelGrid
} from '../src/sky-classifier';

import { ObstructionType } from '../src/types';
import { TestLogger } from '@sunscope/core';

describe('R-SKY-004: Sky Classifier Interface', () => {
  let logger: TestLogger;

  beforeEach(() => {
    logger = new TestLogger('sky-classifier-test');
  });

  afterEach(() => {
    logger.clear();
  });

  describe('createPixelGrid', () => {
    it('should create empty pixel grid with correct dimensions', () => {
      const grid = createPixelGrid(64, 48);
      
      expect(grid.width).toBe(64);
      expect(grid.height).toBe(48);
      expect(grid.data).toHaveLength(48); // rows
      expect(grid.data[0]).toHaveLength(64); // columns
    });

    it('should initialize all pixels to Unknown', () => {
      const grid = createPixelGrid(4, 4);
      
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          expect(grid.data[y][x]).toBe(ObstructionType.Unknown);
        }
      }
    });

    it('should throw for invalid dimensions', () => {
      expect(() => createPixelGrid(0, 64)).toThrow();
      expect(() => createPixelGrid(64, 0)).toThrow();
      expect(() => createPixelGrid(-1, 64)).toThrow();
    });
  });

  describe('MockSkyClassifier', () => {
    it('should return predetermined classification', async () => {
      const classifier = new MockSkyClassifier({
        defaultType: ObstructionType.Sky
      });

      const imageData = new Uint8Array(64 * 64 * 4); // RGBA
      const result = await classifier.classifyFrame(imageData, 64, 64, logger);

      expect(result.width).toBe(64);
      expect(result.height).toBe(64);
      
      // All pixels should be Sky
      expect(result.data[0][0]).toBe(ObstructionType.Sky);
      expect(result.data[32][32]).toBe(ObstructionType.Sky);
    });

    it('should support different default types', async () => {
      const classifier = new MockSkyClassifier({
        defaultType: ObstructionType.Building
      });

      const imageData = new Uint8Array(32 * 32 * 4);
      const result = await classifier.classifyFrame(imageData, 32, 32, logger);

      expect(result.data[0][0]).toBe(ObstructionType.Building);
    });

    it('should simulate processing delay', async () => {
      const classifier = new MockSkyClassifier({
        defaultType: ObstructionType.Sky,
        delayMs: 50
      });

      const start = Date.now();
      const imageData = new Uint8Array(64 * 64 * 4);
      await classifier.classifyFrame(imageData, 64, 64, logger);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it('should log classification', async () => {
      const classifier = new MockSkyClassifier({
        defaultType: ObstructionType.Tree
      });

      const imageData = new Uint8Array(64 * 64 * 4);
      await classifier.classifyFrame(imageData, 64, 64, logger);

      expect(logger.hasEntry(e => e.message.includes('Mock classification'))).toBe(true);
    });

    it('should support vertical split pattern', async () => {
      const classifier = new MockSkyClassifier({
        pattern: 'vertical-split',
        leftType: ObstructionType.Sky,
        rightType: ObstructionType.Building
      });

      const imageData = new Uint8Array(64 * 64 * 4);
      const result = await classifier.classifyFrame(imageData, 64, 64, logger);

      // Left half should be Sky
      expect(result.data[32][15]).toBe(ObstructionType.Sky);
      // Right half should be Building
      expect(result.data[32][48]).toBe(ObstructionType.Building);
    });

    it('should support horizontal split pattern', async () => {
      const classifier = new MockSkyClassifier({
        pattern: 'horizontal-split',
        topType: ObstructionType.Sky,
        bottomType: ObstructionType.Tree
      });

      const imageData = new Uint8Array(64 * 64 * 4);
      const result = await classifier.classifyFrame(imageData, 64, 64, logger);

      // Top half should be Sky
      expect(result.data[15][32]).toBe(ObstructionType.Sky);
      // Bottom half should be Tree
      expect(result.data[48][32]).toBe(ObstructionType.Tree);
    });

    it('should support noise pattern', async () => {
      const classifier = new MockSkyClassifier({
        pattern: 'noise',
        noiseTypes: [ObstructionType.Sky, ObstructionType.Tree]
      });

      const imageData = new Uint8Array(64 * 64 * 4);
      const result = await classifier.classifyFrame(imageData, 64, 64, logger);

      // Should have mix of types
      const types = new Set<ObstructionType>();
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          types.add(result.data[y][x]);
        }
      }
      
      expect(types.size).toBeGreaterThan(1);
    });
  });

  describe('DeepLabV3Classifier', () => {
    it('should be defined as stub', () => {
      expect(DeepLabV3Classifier).toBeDefined();
    });

    it('should throw not implemented error', async () => {
      const classifier = new DeepLabV3Classifier();
      const imageData = new Uint8Array(64 * 64 * 4);

      await expect(
        classifier.classifyFrame(imageData, 64, 64, logger)
      ).rejects.toThrow('not implemented');
    });

    it('should log initialization', () => {
      new DeepLabV3Classifier(logger);
      
      expect(logger.hasEntry(e => e.message.includes('DeepLabV3 classifier stub'))).toBe(true);
    });
  });

  describe('interface compliance', () => {
    it('MockSkyClassifier implements SkyClassifier', async () => {
      const classifier: SkyClassifier = new MockSkyClassifier({
        defaultType: ObstructionType.Sky
      });

      const imageData = new Uint8Array(32 * 32 * 4);
      const result = await classifier.classifyFrame(imageData, 32, 32, logger);

      expect(result).toBeDefined();
      expect(result.width).toBe(32);
      expect(result.height).toBe(32);
    });

    it('DeepLabV3Classifier is defined', () => {
      expect(DeepLabV3Classifier).toBeDefined();
    });

    it('should handle empty image data', async () => {
      const classifier = new MockSkyClassifier({
        defaultType: ObstructionType.Sky
      });

      const imageData = new Uint8Array(0);
      const result = await classifier.classifyFrame(imageData, 64, 64, logger);

      expect(result.width).toBe(64);
      expect(result.height).toBe(64);
    });

    it('should validate output dimensions match input', async () => {
      const classifier = new MockSkyClassifier({
        defaultType: ObstructionType.Sky
      });

      const imageData = new Uint8Array(100 * 50 * 4);
      const result = await classifier.classifyFrame(imageData, 100, 50, logger);

      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
      expect(result.data).toHaveLength(50);
      expect(result.data[0]).toHaveLength(100);
    });
  });

  describe('classification validation', () => {
    it('should only return valid ObstructionType values', async () => {
      const classifier = new MockSkyClassifier({
        pattern: 'noise',
        noiseTypes: [
          ObstructionType.Sky,
          ObstructionType.Tree,
          ObstructionType.Building,
          ObstructionType.Roof,
          ObstructionType.Fence,
          ObstructionType.Unknown
        ]
      });

      const imageData = new Uint8Array(64 * 64 * 4);
      const result = await classifier.classifyFrame(imageData, 64, 64, logger);

      const validTypes = Object.values(ObstructionType);
      
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          expect(validTypes).toContain(result.data[y][x]);
        }
      }
    });
  });
});
