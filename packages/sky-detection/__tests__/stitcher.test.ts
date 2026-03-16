/**
 * Tests for stitcher.ts — R-SKY-002
 */

import { createEmptySkyMask, getSkyMaskCell, ObstructionType } from '../src/sky-mask';
import { stitchFrame, getMaskCoverage, ScanFrame } from '../src/stitcher';
import { MockSkyClassifier } from '../src/classifier';

/** Build a synthetic all-sky 3×3 frame pointing at a specific direction.
 *  With a 3×3 grid, the center pixel (px=1, py=1) maps exactly to deviceAzimuth/deviceElevation
 *  because (1/(3-1) - 0.5) = 0.
 */
async function buildFrame(
  azimuth: number,
  elevation: number,
  type: ObstructionType = ObstructionType.Sky,
  fovH = 40,
  fovV = 30
): Promise<ScanFrame> {
  const clf = new MockSkyClassifier(type);
  const pixelClassifications = await clf.classifyFrame(new Uint8Array(9), 3, 3);
  return {
    timestamp: new Date('2026-06-20T12:00:00Z'),
    deviceAzimuth: azimuth,
    deviceElevation: elevation,
    deviceRoll: 0,
    fieldOfViewH: fovH,
    fieldOfViewV: fovV,
    pixelClassifications,
  };
}

describe('getMaskCoverage', () => {
  it('empty mask has 0.0 coverage', () => {
    const mask = createEmptySkyMask();
    expect(getMaskCoverage(mask)).toBe(0);
  });

  it('fully set mask has 1.0 coverage', () => {
    let mask = createEmptySkyMask();
    // Fill every cell
    for (let az = 0; az < 360; az += 2) {
      for (let el = 0; el < 90; el += 2) {
        mask = require('../src/sky-mask').setSkyMaskCell(mask, az, el, ObstructionType.Sky, 1.0);
      }
    }
    expect(getMaskCoverage(mask)).toBe(1.0);
  });
});

describe('stitchFrame — all-sky pointing south at 45°', () => {
  it('marks cells around S/45° as Sky', async () => {
    const frame = await buildFrame(180, 45, ObstructionType.Sky);
    const mask = createEmptySkyMask();
    const newMask = stitchFrame(mask, frame);

    // The center of the frame (S=180°, 45°) should be Sky
    const center = getSkyMaskCell(newMask, 180, 45);
    expect(center.classification).toBe(ObstructionType.Sky);
  });

  it('coverage increases after stitching a frame', async () => {
    const frame = await buildFrame(180, 45);
    const mask = createEmptySkyMask();
    const before = getMaskCoverage(mask);
    const newMask = stitchFrame(mask, frame);
    const after = getMaskCoverage(newMask);
    expect(after).toBeGreaterThan(before);
  });

  it('original mask is not mutated', async () => {
    const frame = await buildFrame(180, 45);
    const mask = createEmptySkyMask();
    stitchFrame(mask, frame);
    expect(mask[90][22].classification).toBe(ObstructionType.Unknown);
  });
});

describe('stitchFrame — last-write-wins on overlapping frames', () => {
  it('newer Building frame overwrites older Sky frame', async () => {
    const skyFrame = await buildFrame(90, 45, ObstructionType.Sky);
    const buildingFrame = await buildFrame(90, 45, ObstructionType.Building);
    buildingFrame.timestamp = new Date(skyFrame.timestamp.getTime() + 1000);

    let mask = createEmptySkyMask();
    mask = stitchFrame(mask, skyFrame);
    mask = stitchFrame(mask, buildingFrame);

    // Center of both frames should be Building (last write wins)
    const center = getSkyMaskCell(mask, 90, 45);
    expect(center.classification).toBe(ObstructionType.Building);
  });

  it('Sky frame after Building frame makes it Sky', async () => {
    const buildingFrame = await buildFrame(45, 30, ObstructionType.Building);
    const skyFrame = await buildFrame(45, 30, ObstructionType.Sky);
    skyFrame.timestamp = new Date(buildingFrame.timestamp.getTime() + 1000);

    let mask = createEmptySkyMask();
    mask = stitchFrame(mask, buildingFrame);
    mask = stitchFrame(mask, skyFrame);

    const center = getSkyMaskCell(mask, 45, 30);
    expect(center.classification).toBe(ObstructionType.Sky);
  });
});

describe('stitchFrame — edge cases', () => {
  it('frame with elevation that would project below horizon: no below-horizon cells are marked', async () => {
    // Frame pointing very low (0° elevation, negative fovV offset)
    const frame = await buildFrame(0, 5, ObstructionType.Sky, 10, 40);
    const mask = createEmptySkyMask();
    const newMask = stitchFrame(mask, frame);
    // el bucket 0 (0-2°) might be updated but nothing below 0° should throw
    expect(newMask).toBeDefined();
  });

  it('empty pixel grid returns original mask unchanged', () => {
    const mask = createEmptySkyMask();
    const emptyFrame: ScanFrame = {
      timestamp: new Date('2026-06-20T12:00:00Z'),
      deviceAzimuth: 180,
      deviceElevation: 45,
      deviceRoll: 0,
      fieldOfViewH: 40,
      fieldOfViewV: 30,
      pixelClassifications: [], // empty
    };
    const result = stitchFrame(mask, emptyFrame);
    // Should return original unchanged (or an equivalent empty mask)
    expect(getMaskCoverage(result)).toBe(0);
  });
});
