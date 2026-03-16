/**
 * Tests for sky-mask.ts — R-SKY-001
 */

import {
  ObstructionType,
  createEmptySkyMask,
  getSkyMaskCell,
  setSkyMaskCell,
  SkyMask,
} from '../src/sky-mask';

describe('createEmptySkyMask', () => {
  it('creates a 180×45 grid', () => {
    const mask = createEmptySkyMask();
    expect(mask.length).toBe(180);
    expect(mask[0].length).toBe(45);
  });

  it('all cells are Unknown with confidence 0 and no timestamp', () => {
    const mask = createEmptySkyMask();
    for (let az = 0; az < 180; az++) {
      for (let el = 0; el < 45; el++) {
        expect(mask[az][el].classification).toBe(ObstructionType.Unknown);
        expect(mask[az][el].confidence).toBe(0);
        expect(mask[az][el].lastUpdated).toBeNull();
      }
    }
  });
});

describe('getSkyMaskCell — bucketing', () => {
  let mask: SkyMask;
  beforeEach(() => { mask = createEmptySkyMask(); });

  it('0° azimuth / 0° elevation → bucket [0][0]', () => {
    const cell = getSkyMaskCell(mask, 0, 0);
    expect(cell).toBe(mask[0][0]);
  });

  it('1° azimuth → bucket 0 (2° buckets)', () => {
    const cell = getSkyMaskCell(mask, 1, 0);
    expect(cell).toBe(mask[0][0]);
  });

  it('2° azimuth → bucket 1', () => {
    const cell = getSkyMaskCell(mask, 2, 0);
    expect(cell).toBe(mask[1][0]);
  });

  it('180° azimuth → bucket 90', () => {
    const cell = getSkyMaskCell(mask, 180, 0);
    expect(cell).toBe(mask[90][0]);
  });

  it('358° azimuth → bucket 179', () => {
    const cell = getSkyMaskCell(mask, 358, 0);
    expect(cell).toBe(mask[179][0]);
  });

  it('AZ WRAP: 360° → bucket 0', () => {
    const cell = getSkyMaskCell(mask, 360, 0);
    expect(cell).toBe(mask[0][0]);
  });

  it('AZ WRAP: 361° → bucket 0', () => {
    const cell = getSkyMaskCell(mask, 361, 0);
    expect(cell).toBe(mask[0][0]);
  });

  it('AZ WRAP: -1° → bucket 179', () => {
    const cell = getSkyMaskCell(mask, -1, 0);
    expect(cell).toBe(mask[179][0]);
  });

  it('AZ WRAP: -2° → bucket 179', () => {
    const cell = getSkyMaskCell(mask, -2, 0);
    expect(cell).toBe(mask[179][0]);
  });

  it('EL CLAMP: -10° → bucket 0', () => {
    const cell = getSkyMaskCell(mask, 0, -10);
    expect(cell).toBe(mask[0][0]);
  });

  it('EL CLAMP: 90° → bucket 44', () => {
    const cell = getSkyMaskCell(mask, 0, 90);
    expect(cell).toBe(mask[0][44]);
  });

  it('EL CLAMP: 95° → bucket 44', () => {
    const cell = getSkyMaskCell(mask, 0, 95);
    expect(cell).toBe(mask[0][44]);
  });

  it('88° elevation → bucket 44', () => {
    const cell = getSkyMaskCell(mask, 0, 88);
    expect(cell).toBe(mask[0][44]);
  });

  it('45° elevation → bucket 22', () => {
    const cell = getSkyMaskCell(mask, 0, 45);
    expect(cell).toBe(mask[0][22]);
  });
});

describe('setSkyMaskCell — immutability + values', () => {
  it('returns a new mask instance (immutable)', () => {
    const mask = createEmptySkyMask();
    const newMask = setSkyMaskCell(mask, 0, 0, ObstructionType.Sky, 0.9);
    expect(newMask).not.toBe(mask);
  });

  it('original mask is not mutated', () => {
    const mask = createEmptySkyMask();
    setSkyMaskCell(mask, 0, 0, ObstructionType.Building, 1.0);
    expect(mask[0][0].classification).toBe(ObstructionType.Unknown);
  });

  it('updates the correct cell', () => {
    const mask = createEmptySkyMask();
    const newMask = setSkyMaskCell(mask, 90, 45, ObstructionType.Tree, 0.7);
    const bucket = getSkyMaskCell(newMask, 90, 45);
    expect(bucket.classification).toBe(ObstructionType.Tree);
    expect(bucket.confidence).toBe(0.7);
    expect(bucket.lastUpdated).toBeInstanceOf(Date);
  });

  it('all other cells remain unchanged after update', () => {
    const mask = createEmptySkyMask();
    const newMask = setSkyMaskCell(mask, 0, 0, ObstructionType.Sky, 1.0);
    let unchanged = 0;
    for (let az = 0; az < 180; az++) {
      for (let el = 0; el < 45; el++) {
        if (az === 0 && el === 0) continue;
        if (newMask[az][el].classification === ObstructionType.Unknown) unchanged++;
      }
    }
    expect(unchanged).toBe(180 * 45 - 1);
  });
});
