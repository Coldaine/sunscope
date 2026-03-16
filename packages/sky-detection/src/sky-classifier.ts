/**
 * @module @sunscope/sky-detection/sky-classifier
 * @description Sky classifier interface and implementations (R-SKY-004)
 * 
 * This module defines the SkyClassifier interface and provides implementations
 * for testing and future native ML integration.
 * 
 * Dependencies: types.ts, logger.ts (from core)
 * 
 * Acceptance Criteria:
 * - SkyClassifier interface defines classifyFrame method
 * - MockSkyClassifier returns predetermined classifications for testing
 * - DeepLabV3Classifier stub exists for future native implementation
 * - PixelGrid output matches input dimensions
 * - Classifications are valid ObstructionType values
 */

import { PixelGrid, ObstructionType, SkyClassifier as ISkyClassifier } from './types';
import { ILogger } from '@sunscope/core';

// Re-export interface from types
export type { ISkyClassifier as SkyClassifier };

/**
 * Create an empty pixel grid with given dimensions
 * @param width - Grid width in pixels
 * @param height - Grid height in pixels
 * @returns Empty pixel grid (all Unknown)
 */
export function createPixelGrid(width: number, height: number): PixelGrid {
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid dimensions: ${width}x${height}`);
  }

  const data: ObstructionType[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row: ObstructionType[] = [];
    for (let x = 0; x < width; x++) {
      row.push(ObstructionType.Unknown);
    }
    data.push(row);
  }

  return { width, height, data };
}

/**
 * Options for MockSkyClassifier
 */
export interface MockClassifierOptions {
  /** Default classification type for all pixels */
  defaultType?: ObstructionType;
  /** Pattern to generate: 'uniform' | 'vertical-split' | 'horizontal-split' | 'noise' */
  pattern?: 'uniform' | 'vertical-split' | 'horizontal-split' | 'noise';
  /** Type for left half (vertical-split) or top half (horizontal-split) */
  leftType?: ObstructionType;
  topType?: ObstructionType;
  /** Type for right half (vertical-split) or bottom half (horizontal-split) */
  rightType?: ObstructionType;
  bottomType?: ObstructionType;
  /** Types to use for noise pattern */
  noiseTypes?: ObstructionType[];
  /** Simulated processing delay in ms */
  delayMs?: number;
}

/**
 * Mock sky classifier for testing
 * 
 * Returns predetermined classifications based on configuration.
 * Useful for unit testing without native dependencies.
 */
export class MockSkyClassifier implements ISkyClassifier {
  private options: Required<MockClassifierOptions>;

  constructor(options: MockClassifierOptions = {}) {
    this.options = {
      defaultType: options.defaultType ?? ObstructionType.Sky,
      pattern: options.pattern ?? 'uniform',
      leftType: options.leftType ?? ObstructionType.Sky,
      topType: options.topType ?? ObstructionType.Sky,
      rightType: options.rightType ?? ObstructionType.Building,
      bottomType: options.bottomType ?? ObstructionType.Tree,
      noiseTypes: options.noiseTypes ?? [ObstructionType.Sky, ObstructionType.Tree],
      delayMs: options.delayMs ?? 0
    };
  }

  async classifyFrame(
    _imageData: Uint8Array,
    width: number,
    height: number,
    logger?: ILogger
  ): Promise<PixelGrid> {
    const startTime = Date.now();

    // Simulate processing delay
    if (this.options.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.delayMs));
    }

    const grid = createPixelGrid(width, height);

    // Fill based on pattern
    switch (this.options.pattern) {
      case 'uniform':
        this.fillUniform(grid);
        break;
      case 'vertical-split':
        this.fillVerticalSplit(grid);
        break;
      case 'horizontal-split':
        this.fillHorizontalSplit(grid);
        break;
      case 'noise':
        this.fillNoise(grid);
        break;
    }

    const elapsedMs = Date.now() - startTime;

    logger?.debug('Mock classification complete', {
      width,
      height,
      pattern: this.options.pattern,
      defaultType: this.options.defaultType,
      elapsedMs
    });

    return grid;
  }

  private fillUniform(grid: PixelGrid): void {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        grid.data[y][x] = this.options.defaultType;
      }
    }
  }

  private fillVerticalSplit(grid: PixelGrid): void {
    const midX = Math.floor(grid.width / 2);
    
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        grid.data[y][x] = x < midX ? this.options.leftType : this.options.rightType;
      }
    }
  }

  private fillHorizontalSplit(grid: PixelGrid): void {
    const midY = Math.floor(grid.height / 2);
    
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        grid.data[y][x] = y < midY ? this.options.topType! : this.options.bottomType!;
      }
    }
  }

  private fillNoise(grid: PixelGrid): void {
    const types = this.options.noiseTypes;
    
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        // Simple noise based on position
        const index = (x + y * grid.width) % types.length;
        grid.data[y][x] = types[index];
      }
    }
  }
}

/**
 * DeepLabV3 classifier stub
 * 
 * Placeholder for future native implementation using CoreML/TensorFlow.
 * This will be implemented when native module bridge is ready.
 */
export class DeepLabV3Classifier implements ISkyClassifier {


  constructor(logger?: ILogger) {
    logger?.info('DeepLabV3 classifier stub initialized', {
      status: 'not-implemented'
    });
  }

  async classifyFrame(
    imageData: Uint8Array,
    width: number,
    height: number,
    logger?: ILogger
  ): Promise<PixelGrid> {
    logger?.error('DeepLabV3 classification not implemented', {
      width,
      height,
      imageDataLength: imageData.length
    });

    throw new Error(
      'DeepLabV3 classifier not implemented. ' +
      'Use MockSkyClassifier for testing. ' +
      'Native implementation pending CoreML bridge.'
    );
  }

  /**
   * Check if native module is available
   * Stub always returns false
   */
  isAvailable(): boolean {
    return false;
  }

  /**
   * Load model - stub implementation
   */
  async loadModel(logger?: ILogger): Promise<void> {
    logger?.warn('Model loading not implemented in stub');
    throw new Error('Model loading not implemented');
  }
}
