import { TestLogger, createLogger } from '../src/logger';
import { calculateShadow } from '../src/shadow-calculator';

describe('shadow-calculator', () => {
  it('returns known values using radians for tan', () => {
    expect(calculateShadow(1, 45, 180).length).toBeCloseTo(1, 2);
    expect(calculateShadow(2, 30, 180).length).toBeCloseTo(3.46, 2);
    expect(calculateShadow(10, 60, 180).length).toBeCloseTo(5.77, 2);
  });

  it('returns the opposite compass direction', () => {
    expect(calculateShadow(1, 45, 90).direction).toBe(270);
    expect(calculateShadow(1, 45, 315).direction).toBe(135);
  });

  it('clamps very low positive altitudes', () => {
    expect(calculateShadow(1, 0.5, 180)).toEqual({
      length: 100,
      direction: 0,
      clamped: true
    });
  });

  it('returns infinity below the horizon', () => {
    expect(calculateShadow(1, 0, 180).length).toBe(Number.POSITIVE_INFINITY);
    expect(calculateShadow(1, -5, 180).length).toBe(Number.POSITIVE_INFINITY);
  });

  it('logs clamped calculations', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'shadow-calculator',
      sink
    });

    calculateShadow(1, 0.25, 100, logger);

    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        level: 'WARN',
        message: 'calculateShadow.clamped'
      })
    );
  });
});
