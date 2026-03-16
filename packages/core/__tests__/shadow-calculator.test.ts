/**
 * Tests for shadow-calculator.ts — R-CORE-005
 */

import { computeShadow } from '../src/shadow-calculator';

describe('computeShadow — known values', () => {
  it('height=1m, altitude=45° → length≈1m', () => {
    const result = computeShadow(1, 180, 45);
    expect(result.lengthMeters).toBeCloseTo(1.0, 2);
    expect(result.clamped).toBe(false);
  });

  it('height=2m, altitude=30° → length≈3.464m', () => {
    const result = computeShadow(2, 180, 30);
    expect(result.lengthMeters).toBeCloseTo(3.464, 2);
    expect(result.clamped).toBe(false);
  });

  it('height=10m, altitude=60° → length≈5.774m', () => {
    const result = computeShadow(10, 180, 60);
    expect(result.lengthMeters).toBeCloseTo(5.774, 2);
    expect(result.clamped).toBe(false);
  });
});

describe('computeShadow — direction', () => {
  it('shadow direction = (azimuth + 180) % 360', () => {
    expect(computeShadow(1, 90, 45).directionDeg).toBe(270);
    expect(computeShadow(1, 270, 45).directionDeg).toBe(90);
    expect(computeShadow(1, 0, 45).directionDeg).toBe(180);
    expect(computeShadow(1, 180, 45).directionDeg).toBe(0);
  });

  it('direction wraps correctly for azimuth 350°', () => {
    expect(computeShadow(1, 350, 45).directionDeg).toBeCloseTo(170, 5);
  });
});

describe('computeShadow — edge cases', () => {
  it('altitude=0 → length=Infinity', () => {
    const result = computeShadow(1, 180, 0);
    expect(result.lengthMeters).toBe(Infinity);
    expect(result.clamped).toBe(false);
  });

  it('altitude=-5 → length=Infinity (below horizon)', () => {
    const result = computeShadow(1, 180, -5);
    expect(result.lengthMeters).toBe(Infinity);
  });

  it('altitude=0.5° (< 1°) → clamped to 100m', () => {
    const result = computeShadow(1, 180, 0.5);
    expect(result.lengthMeters).toBe(100);
    expect(result.clamped).toBe(true);
  });

  it('altitude=1° (exactly at threshold) → NOT clamped', () => {
    const result = computeShadow(1, 180, 1);
    expect(result.clamped).toBe(false);
    expect(result.lengthMeters).toBeLessThan(100);
  });
});

describe('computeShadow — trig uses radians not degrees', () => {
  // tan(45°) = 1. If we accidentally used tan(45 radians) the result would be wildly wrong.
  it('height=5m at 45° gives exactly 5m (tan in radians)', () => {
    const result = computeShadow(5, 180, 45);
    expect(result.lengthMeters).toBeCloseTo(5.0, 5);
  });
});

describe('computeShadow — proportionality', () => {
  it('doubling height doubles shadow length at same angle', () => {
    const r1 = computeShadow(2, 180, 30);
    const r2 = computeShadow(4, 180, 30);
    expect(r2.lengthMeters).toBeCloseTo(r1.lengthMeters * 2, 5);
  });

  it('height=0 → shadow length=0', () => {
    const result = computeShadow(0, 180, 45);
    expect(result.lengthMeters).toBeCloseTo(0, 5);
    expect(result.clamped).toBe(false);
  });
});

describe('computeShadow — extreme altitudes', () => {
  it('altitude=89° → very short shadow', () => {
    const result = computeShadow(10, 180, 89);
    // tan(89°) ≈ 57.29, so length ≈ 10/57.29 ≈ 0.175m
    expect(result.lengthMeters).toBeLessThan(0.2);
    expect(result.clamped).toBe(false);
  });

  it('altitude just above 0° (0.1°) → clamped to 100m', () => {
    const result = computeShadow(1, 180, 0.1);
    expect(result.lengthMeters).toBe(100);
    expect(result.clamped).toBe(true);
  });

  it('deeply negative altitude (-45°) → Infinity', () => {
    const result = computeShadow(1, 180, -45);
    expect(result.lengthMeters).toBe(Infinity);
  });
});

describe('computeShadow — logging', () => {
  it('accepts a custom logger without errors', () => {
    const { TestLogger } = require('../src/logger');
    const log = new TestLogger('shadow-test');
    computeShadow(1, 180, 45, log);
    expect(log.entries.length).toBeGreaterThan(0);
  });
});
