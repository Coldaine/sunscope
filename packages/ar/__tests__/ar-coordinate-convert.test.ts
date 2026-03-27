import { solarToWorld, worldToSolar } from '../src/ar-coordinate-convert';

describe('ar-coordinate-convert', () => {
  it('round-trips solar coordinates within 0.01 degrees', () => {
    const world = solarToWorld(123.45, 37.89, 50);
    const solar = worldToSolar(world.x, world.y, world.z);

    expect(solar.azimuthDeg).toBeCloseTo(123.45, 2);
    expect(solar.altitudeDeg).toBeCloseTo(37.89, 2);
  });

  it('handles boundary coordinates', () => {
    const horizon = solarToWorld(90, 0, 50);
    const zenith = solarToWorld(180, 90, 50);
    const north = solarToWorld(0, 0, 50);

    expect(horizon.y).toBeCloseTo(0, 5);
    expect(zenith.y).toBeCloseTo(50, 5);
    expect(north.z).toBeCloseTo(-50, 5);
    expect(north.x).toBeCloseTo(0, 5);
  });
});
