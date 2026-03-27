import { TestLogger, createLogger } from '../src/logger';
import { degToRad, normalizeDegrees, radToDeg, suncalcToCompass } from '../src/solar-convert';

describe('solar-convert', () => {
  it('converts radians to degrees', () => {
    expect(radToDeg(0)).toBe(0);
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 10);
    expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90, 10);
    expect(radToDeg(2 * Math.PI)).toBeCloseTo(360, 10);
  });

  it('converts degrees to radians', () => {
    expect(degToRad(0)).toBe(0);
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('normalizes negative and overflow angles', () => {
    expect(normalizeDegrees(-1)).toBe(359);
    expect(normalizeDegrees(361)).toBe(1);
    expect(normalizeDegrees(-90)).toBe(270);
    expect(normalizeDegrees(720)).toBe(0);
  });

  it('converts suncalc azimuth to compass convention', () => {
    expect(suncalcToCompass(0)).toBeCloseTo(180, 10);
    expect(suncalcToCompass(Math.PI / 2)).toBeCloseTo(270, 10);
    expect(suncalcToCompass(-Math.PI / 2)).toBeCloseTo(90, 10);
    expect(suncalcToCompass(Math.PI)).toBeCloseTo(0, 10);
    expect(suncalcToCompass(-Math.PI)).toBeCloseTo(0, 10);
    expect(suncalcToCompass(2 * Math.PI)).toBeCloseTo(180, 10);
    expect(suncalcToCompass(-3 * Math.PI / 2)).toBeCloseTo(270, 10);
    expect(suncalcToCompass(3 * Math.PI / 2)).toBeCloseTo(90, 10);
  });

  it('logs conversion inputs and outputs', () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'solar-convert',
      sink
    });

    suncalcToCompass(-Math.PI / 2, logger);

    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        module: 'solar-convert',
        level: 'DEBUG',
        message: 'suncalcToCompass.entry'
      })
    );
    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        message: 'suncalcToCompass.exit',
        data: expect.objectContaining({ convertedDegrees: 90 })
      })
    );
  });
});
