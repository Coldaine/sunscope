import { ObstructionType } from './sky-mask';

export type PixelGrid = ObstructionType[][];

export interface SkyClassifier {
  classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid>;
}

export class MockSkyClassifier implements SkyClassifier {
  private mockType: ObstructionType;

  constructor(mockType: ObstructionType = ObstructionType.Sky) {
    this.mockType = mockType;
  }

  async classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid> {
    const grid: PixelGrid = [];
    for (let y = 0; y < height; y++) {
      const row: ObstructionType[] = [];
      for (let x = 0; x < width; x++) {
        row.push(this.mockType);
      }
      grid.push(row);
    }
    return grid;
  }
}

export class DeepLabV3Classifier implements SkyClassifier {
  async classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid> {
    throw new Error('Not implemented: requires native CoreML bridge');
  }
}
