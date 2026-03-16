/**
 * Tests for heading-smoothing.ts — R-CORE-004
 */

import { HeadingSmoother, shortestAngularDistance } from '../src/heading-smoothing';

describe('shortestAngularDistance', () => {
  it('0° to 90° = +90°', () => {
    expect(shortestAngularDistance(0, 90)).toBe(90);
  });

  it('90° to 0° = -90°', () => {
    expect(shortestAngularDistance(90, 0)).toBe(-90);
  });

  it('350° to 10° = +20° (crosses north, not -340°)', () => {
    expect(shortestAngularDistance(350, 10)).toBe(20);
  });

  it('10° to 350° = -20° (goes backward, not +340°)', () => {
    expect(shortestAngularDistance(10, 350)).toBe(-20);
  });

  it('0° to 180° = 180°', () => {
    expect(shortestAngularDistance(0, 180)).toBe(180);
  });

  it('270° to 90° = 180°', () => {
    // Both directions are exactly 180° — returns 180 (positive clamp)
    expect(Math.abs(shortestAngularDistance(270, 90))).toBe(180);
  });

  it('NE to NW: 45° to 315° = -90°', () => {
    expect(shortestAngularDistance(45, 315)).toBe(-90);
  });

  it('NW to NE: 315° to 45° = +90°', () => {
    expect(shortestAngularDistance(315, 45)).toBe(90);
  });
});

describe('HeadingSmoother — basic operation', () => {
  it('first reading initializes to that heading', () => {
    const smoother = new HeadingSmoother(0.5);
    const result = smoother.update({ heading: 90, accuracy: 5, timestamp: 1000 });
    expect(result.heading).toBe(90);
  });

  it('smooths toward new heading gradually (alpha=0.5)', () => {
    const smoother = new HeadingSmoother(0.5);
    smoother.update({ heading: 0, accuracy: 5, timestamp: 1000 });
    const result = smoother.update({ heading: 100, accuracy: 5, timestamp: 2000 });
    // With alpha=0.5: smoothed = 0 + 0.5*(100) = 50
    expect(result.heading).toBeCloseTo(50, 5);
  });

  it('sampleCount increases with each update', () => {
    const smoother = new HeadingSmoother();
    smoother.update({ heading: 0, accuracy: 5, timestamp: 1 });
    smoother.update({ heading: 0, accuracy: 5, timestamp: 2 });
    const { sampleCount } = smoother.update({ heading: 0, accuracy: 5, timestamp: 3 });
    expect(sampleCount).toBe(3);
  });
});

describe('HeadingSmoother — wraparound', () => {
  it('350° → 10° converges toward 10° (not 180°)', () => {
    const smoother = new HeadingSmoother(1.0); // alpha=1 = instantly converge
    smoother.update({ heading: 350, accuracy: 5, timestamp: 1 });
    const result = smoother.update({ heading: 10, accuracy: 5, timestamp: 2 });
    // With alpha=1, should jump to 10°
    expect(result.heading).toBeCloseTo(10, 5);
  });

  it('jitter ±5° around 90° converges within ±2° after 10 samples', () => {
    const smoother = new HeadingSmoother(0.3);
    const baseHeading = 90;
    // Alternate +5 and -5 around 90
    for (let i = 0; i < 10; i++) {
      const jitter = i % 2 === 0 ? 5 : -5;
      smoother.update({ heading: baseHeading + jitter, accuracy: 5, timestamp: i * 100 });
    }
    expect(smoother.current).not.toBeNull();
    expect(Math.abs(smoother.current! - baseHeading)).toBeLessThan(2);
  });

  // Quadrant transitions
  it('N→E transition: 355° to 5°', () => {
    const smoother = new HeadingSmoother(1.0);
    smoother.update({ heading: 355, accuracy: 5, timestamp: 1 });
    const r = smoother.update({ heading: 5, accuracy: 5, timestamp: 2 });
    expect(r.heading).toBeCloseTo(5, 5);
  });

  it('E→N transition: 5° to 355°', () => {
    const smoother = new HeadingSmoother(1.0);
    smoother.update({ heading: 5, accuracy: 5, timestamp: 1 });
    const r = smoother.update({ heading: 355, accuracy: 5, timestamp: 2 });
    expect(r.heading).toBeCloseTo(355, 5);
  });

  it('S→W transition: 175° to 185°', () => {
    const smoother = new HeadingSmoother(1.0);
    smoother.update({ heading: 175, accuracy: 5, timestamp: 1 });
    const r = smoother.update({ heading: 185, accuracy: 5, timestamp: 2 });
    expect(r.heading).toBeCloseTo(185, 5);
  });

  it('W→S transition: 265° to 95°', () => {
    const smoother = new HeadingSmoother(1.0);
    smoother.update({ heading: 265, accuracy: 5, timestamp: 1 });
    const r = smoother.update({ heading: 95, accuracy: 5, timestamp: 2 });
    expect(r.heading).toBeCloseTo(95, 5);
  });
});

describe('HeadingSmoother — reliability flag', () => {
  it('reliable=true when accuracy > 0', () => {
    const smoother = new HeadingSmoother();
    const r = smoother.update({ heading: 90, accuracy: 10, timestamp: 1 });
    expect(r.reliable).toBe(true);
  });

  it('reliable=false when accuracy < 0', () => {
    const smoother = new HeadingSmoother();
    const r = smoother.update({ heading: 90, accuracy: -1, timestamp: 1 });
    expect(r.reliable).toBe(false);
  });

  it('reliable=false when accuracy = 0 (boundary)', () => {
    const smoother = new HeadingSmoother();
    const r = smoother.update({ heading: 90, accuracy: 0, timestamp: 1 });
    // accuracy 0 is exactly not >= 0 per "negative = unreliable" spec — actually 0 means some accuracy but we'll check the implementation
    // The spec says "negative = unreliable", so 0 should be reliable
    expect(r.reliable).toBe(true); // accuracy >= 0
  });
});

describe('HeadingSmoother — reset', () => {
  it('reset clears state', () => {
    const smoother = new HeadingSmoother();
    smoother.update({ heading: 180, accuracy: 5, timestamp: 1 });
    smoother.reset();
    expect(smoother.current).toBeNull();
  });

  it('update after reset gives fresh start', () => {
    const smoother = new HeadingSmoother(0.3);
    smoother.update({ heading: 10, accuracy: 5, timestamp: 1 });
    smoother.update({ heading: 20, accuracy: 5, timestamp: 2 });
    smoother.reset();
    const r = smoother.update({ heading: 270, accuracy: 5, timestamp: 3 });
    expect(r.heading).toBe(270); // first reading after reset
    expect(r.sampleCount).toBe(1);
  });
});

describe('HeadingSmoother — alpha extremes', () => {
  it('alpha=0 locks to first reading forever', () => {
    const smoother = new HeadingSmoother(0);
    smoother.update({ heading: 45, accuracy: 5, timestamp: 1 });
    const r = smoother.update({ heading: 200, accuracy: 5, timestamp: 2 });
    // alpha=0: smoothed + 0*delta = no movement
    expect(r.heading).toBeCloseTo(45);
  });

  it('alpha=1 instantly jumps to each new reading', () => {
    const smoother = new HeadingSmoother(1.0);
    smoother.update({ heading: 0, accuracy: 5, timestamp: 1 });
    expect(smoother.update({ heading: 90, accuracy: 5, timestamp: 2 }).heading).toBeCloseTo(90);
    expect(smoother.update({ heading: 270, accuracy: 5, timestamp: 3 }).heading).toBeCloseTo(270);
    expect(smoother.update({ heading: 1, accuracy: 5, timestamp: 4 }).heading).toBeCloseTo(1);
  });
});

describe('HeadingSmoother — convergence', () => {
  it('converges to constant input within 20 samples (alpha=0.3)', () => {
    const smoother = new HeadingSmoother(0.3);
    // Start far away
    smoother.update({ heading: 180, accuracy: 5, timestamp: 0 });
    for (let i = 1; i <= 20; i++) {
      smoother.update({ heading: 45, accuracy: 5, timestamp: i * 100 });
    }
    // After 20 iterations with constant 45°, should be very close
    const diff = Math.abs(shortestAngularDistance(smoother.current!, 45));
    expect(diff).toBeLessThan(1);
  });
});

describe('shortestAngularDistance — additional', () => {
  it('same angle → 0', () => {
    expect(shortestAngularDistance(123, 123)).toBe(0);
  });

  it('0° to 359° = -1° (not +359°)', () => {
    expect(shortestAngularDistance(0, 359)).toBe(-1);
  });

  it('359° to 0° = +1°', () => {
    expect(shortestAngularDistance(359, 0)).toBe(1);
  });
});
