/**
 * Tests for classifier.ts — R-SKY-004
 */

import { ObstructionType } from '../src/sky-mask';
import { MockSkyClassifier, DeepLabV3Classifier, PixelGrid } from '../src/classifier';

describe('MockSkyClassifier', () => {
  it('returns all-Sky by default', async () => {
    const clf = new MockSkyClassifier();
    const grid = await clf.classifyFrame(new Uint8Array(4), 2, 2);
    expect(grid.length).toBe(2);
    expect(grid[0].length).toBe(2);
    expect(grid[0][0]).toBe(ObstructionType.Sky);
    expect(grid[1][1]).toBe(ObstructionType.Sky);
  });

  it('returns all-Building when configured', async () => {
    const clf = new MockSkyClassifier(ObstructionType.Building);
    const grid = await clf.classifyFrame(new Uint8Array(4), 2, 2);
    for (const row of grid) {
      for (const cell of row) {
        expect(cell).toBe(ObstructionType.Building);
      }
    }
  });

  it('returns all-Tree when configured', async () => {
    const clf = new MockSkyClassifier(ObstructionType.Tree);
    const grid = await clf.classifyFrame(new Uint8Array(4), 3, 3);
    expect(grid[2][2]).toBe(ObstructionType.Tree);
  });

  it('returned grid dimensions match width/height params', async () => {
    const clf = new MockSkyClassifier();
    const grid = await clf.classifyFrame(new Uint8Array(100), 10, 5);
    expect(grid.length).toBe(5);    // height rows
    expect(grid[0].length).toBe(10); // width cols
  });

  it('all cells are valid ObstructionType values', async () => {
    const clf = new MockSkyClassifier(ObstructionType.Roof);
    const grid = await clf.classifyFrame(new Uint8Array(16), 4, 4);
    const validValues = Object.values(ObstructionType);
    for (const row of grid) {
      for (const cell of row) {
        expect(validValues).toContain(cell);
      }
    }
  });
});

describe('DeepLabV3Classifier', () => {
  it('throws "Not implemented: requires native CoreML bridge"', async () => {
    const clf = new DeepLabV3Classifier();
    await expect(clf.classifyFrame(new Uint8Array(4), 2, 2)).rejects.toThrow(
      'Not implemented: requires native CoreML bridge'
    );
  });
});

describe('MockSkyClassifier — edge cases', () => {
  it('1x1 frame produces 1x1 grid', async () => {
    const clf = new MockSkyClassifier();
    const grid = await clf.classifyFrame(new Uint8Array(1), 1, 1);
    expect(grid.length).toBe(1);
    expect(grid[0].length).toBe(1);
    expect(grid[0][0]).toBe(ObstructionType.Sky);
  });

  it('every ObstructionType can be used as mock type', async () => {
    for (const type of Object.values(ObstructionType)) {
      const clf = new MockSkyClassifier(type as ObstructionType);
      const grid = await clf.classifyFrame(new Uint8Array(1), 1, 1);
      expect(grid[0][0]).toBe(type);
    }
  });

  it('large frame dimensions produce correct grid', async () => {
    const clf = new MockSkyClassifier(ObstructionType.Fence);
    const grid = await clf.classifyFrame(new Uint8Array(100 * 50), 100, 50);
    expect(grid.length).toBe(50);
    expect(grid[0].length).toBe(100);
    expect(grid[49][99]).toBe(ObstructionType.Fence);
  });
});
