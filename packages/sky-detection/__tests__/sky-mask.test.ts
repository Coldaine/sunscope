import { TestLogger, createLogger } from '@sunscope/core';
import {
  createEmptySkyMask,
  getSkyMaskCell,
  setSkyMaskCell
} from '../src/sky-mask';
import { ObstructionType } from '../src/types';

describe('sky-mask', () => {
  it('creates an empty sky mask filled with Unknown cells', () => {
    const mask = createEmptySkyMask();

    expect(mask).toHaveLength(180);
    expect(mask[0]).toHaveLength(45);
    expect(mask[0]?.[0]).toEqual({
      classification: ObstructionType.Unknown,
      confidence: 0,
      lastUpdated: null
    });
  });

  it('wraps azimuths and clamps elevations for lookup', () => {
    const mask = setSkyMaskCell(
      createEmptySkyMask(),
      361,
      91,
      ObstructionType.Sky,
      1,
      new Date('2026-03-16T00:00:00Z')
    );

    expect(getSkyMaskCell(mask, 1, 90).classification).toBe(ObstructionType.Sky);
    expect(getSkyMaskCell(mask, -1, -5).classification).toBe(ObstructionType.Unknown);
  });

  it('updates cells immutably', () => {
    const original = createEmptySkyMask();
    const updated = setSkyMaskCell(
      original,
      180,
      45,
      ObstructionType.Tree,
      0.8,
      new Date('2026-03-16T00:00:00Z')
    );

    expect(original).not.toBe(updated);
    expect(getSkyMaskCell(original, 180, 45).classification).toBe(ObstructionType.Unknown);
    expect(getSkyMaskCell(updated, 180, 45).classification).toBe(ObstructionType.Tree);
  });

  it('logs bucket coordinates and classification changes', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'sky-mask',
      sink
    });

    setSkyMaskCell(
      createEmptySkyMask(logger),
      180,
      10,
      ObstructionType.Building,
      0.7,
      new Date('2026-03-16T00:00:00Z'),
      logger
    );

    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        message: 'setSkyMaskCell.entry',
        data: expect.objectContaining({
          classification: ObstructionType.Building
        })
      })
    );
  });
});
