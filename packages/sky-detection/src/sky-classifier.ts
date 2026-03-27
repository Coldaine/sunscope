/**
 * @fileoverview Sky classifier interface and test doubles.
 *
 * The real CoreML-backed classifier is deferred to a native bridge, but the
 * consumer-facing contract is defined now so the stitcher and integrator remain
 * fully testable in the Linux development environment.
 */

import { Logger, createLogger, measureElapsedMs } from '@sunscope/core';
import { ObstructionType, PixelGrid } from './types';

export interface SkyClassifier {
  classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid>;
}

export type MockSkyClassifierMode = 'all-sky' | 'all-building' | 'half-and-half' | 'random';

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'sky-classifier' });
}

function summarizeDistribution(grid: PixelGrid): Record<string, number> {
  const total = grid.flat().length;
  const counts = grid.flat().reduce<Record<string, number>>((distribution, classification) => {
    distribution[classification] = (distribution[classification] ?? 0) + 1;
    return distribution;
  }, {});

  return Object.fromEntries(
    Object.entries(counts).map(([key, value]) => [key, Number((value / total).toFixed(4))])
  );
}

function createGrid(
  width: number,
  height: number,
  mapper: (x: number, y: number) => ObstructionType
): PixelGrid {
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => mapper(x, y))
  );
}

export class MockSkyClassifier implements SkyClassifier {
  public constructor(
    private readonly mode: MockSkyClassifierMode,
    private readonly logger: Logger = createLogger({ moduleName: 'sky-classifier' })
  ) {}

  public async classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid> {
    const startTime = process.hrtime.bigint();
    this.logger.debug('MockSkyClassifier.classifyFrame.entry', {
      mode: this.mode,
      width,
      height,
      imageBytes: imageData.byteLength
    });

    const grid = createGrid(width, height, (x) => {
      switch (this.mode) {
        case 'all-sky':
          return ObstructionType.Sky;
        case 'all-building':
          return ObstructionType.Building;
        case 'half-and-half':
          return x < width / 2 ? ObstructionType.Sky : ObstructionType.Building;
        case 'random':
          return (x + width + height) % 2 === 0 ? ObstructionType.Sky : ObstructionType.Tree;
        default:
          return ObstructionType.Unknown;
      }
    });

    this.logger.debug('MockSkyClassifier.classifyFrame.exit', {
      mode: this.mode,
      width,
      height,
      distribution: summarizeDistribution(grid),
      elapsedMs: measureElapsedMs(startTime)
    });
    return grid;
  }
}

export class DeepLabV3Classifier implements SkyClassifier {
  public async classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid> {
    void imageData;
    void width;
    void height;
    throw new Error(
      'Not implemented: requires native CoreML bridge. Expected mapping: sky->Sky, tree->Tree, building->Building, wall->Fence, everything else->Unknown.'
    );
  }
}
