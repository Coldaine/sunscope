import { TestLogger, createLogger } from '@sunscope/core';
import { createEmptySkyMask, getSkyMaskCell } from '../src/sky-mask';
import { getMaskCoverage, stitchFrame } from '../src/hemisphere-stitcher';
import { ObstructionType, ScanFrame } from '../src/types';

function createUniformFrame(
  classification: ObstructionType,
  timestampIso: string
): ScanFrame {
  return {
    timestamp: new Date(timestampIso),
    deviceAzimuth: 180,
    deviceElevation: 45,
    deviceRoll: 5,
    fieldOfViewH: 20,
    fieldOfViewV: 20,
    pixelClassifications: Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => classification)
    )
  };
}

describe('hemisphere-stitcher', () => {
  it('projects a south-facing sky frame into the mask', () => {
    const mask = stitchFrame(createEmptySkyMask(), createUniformFrame(ObstructionType.Sky, '2026-03-16T00:00:00Z'));
    const centerCell = getSkyMaskCell(mask, 180, 45);

    expect(centerCell.classification).toBe(ObstructionType.Sky);
    expect(getMaskCoverage(mask)).toBeGreaterThan(0);
  });

  it('lets newer overlapping frames win', () => {
    const first = stitchFrame(createEmptySkyMask(), createUniformFrame(ObstructionType.Sky, '2026-03-16T00:00:00Z'));
    const second = stitchFrame(first, createUniformFrame(ObstructionType.Building, '2026-03-16T00:00:10Z'));

    expect(getSkyMaskCell(second, 180, 45).classification).toBe(ObstructionType.Building);
  });

  it('logs coverage changes and ignored roll', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'hemisphere-stitcher',
      sink
    });

    stitchFrame(createEmptySkyMask(), createUniformFrame(ObstructionType.Sky, '2026-03-16T00:00:00Z'), logger);

    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        level: 'WARN',
        message: 'stitchFrame.rollIgnored'
      })
    );
    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        message: 'stitchFrame.exit',
        data: expect.objectContaining({
          coverageBefore: 0,
          coverageAfter: expect.any(Number)
        })
      })
    );
  });
});
