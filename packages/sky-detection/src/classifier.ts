import { ObstructionType } from './sky-mask';
import { Logger, DefaultLogger } from '@sunscope/core';

export type PixelGrid = ObstructionType[][];

export interface SkyClassifier {
  classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid>;
}

export class MockSkyClassifier implements SkyClassifier {
  private mockType: ObstructionType;
  private readonly log: Logger;

  constructor(mockType: ObstructionType = ObstructionType.Sky, log?: Logger) {
    this.mockType = mockType;
    this.log = log ?? new DefaultLogger('classifier');
  }

  async classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid> {
    const start = Date.now();
    const grid: PixelGrid = [];
    for (let y = 0; y < height; y++) {
      const row: ObstructionType[] = [];
      for (let x = 0; x < width; x++) {
        row.push(this.mockType);
      }
      grid.push(row);
    }
    this.log.debug('MockSkyClassifier.classifyFrame', {
      width, height, mockType: this.mockType, elapsedMs: Date.now() - start,
    });
    return grid;
  }
}

export class DeepLabV3Classifier implements SkyClassifier {
  private readonly log: Logger;

  constructor(log?: Logger) {
    this.log = log ?? new DefaultLogger('classifier');
  }

  async classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid> {
    this.log.error('DeepLabV3Classifier not implemented', { width, height });
    throw new Error('Not implemented: requires native CoreML bridge');
  }
}
