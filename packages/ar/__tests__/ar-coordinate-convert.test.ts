import { solarToWorld, worldToSolar } from '../src/ar-coordinate-convert';

describe('AR Coordinate Convert', () => {
  describe('solarToWorld', () => {
    it('converts horizon (0 altitude)', () => {
      const radius = 50;
      let pos = solarToWorld(0, 0, radius); // north
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(-radius);

      pos = solarToWorld(90, 0, radius); // east
      expect(pos.x).toBeCloseTo(radius);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);

      pos = solarToWorld(180, 0, radius); // south
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(radius);

      pos = solarToWorld(270, 0, radius); // west
      expect(pos.x).toBeCloseTo(-radius);
      expect(pos.y).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);
    });

    it('converts zenith (90 altitude)', () => {
      const radius = 50;
      const pos = solarToWorld(0, 90, radius);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(radius);
      expect(pos.z).toBeCloseTo(0);
    });
  });

  describe('worldToSolar (round-trip)', () => {
    const testCases = [
      { azimuth: 0, altitude: 0 },
      { azimuth: 90, altitude: 0 },
      { azimuth: 180, altitude: 0 },
      { azimuth: 270, altitude: 0 },
      { azimuth: 0, altitude: 90 },
      { azimuth: 135, altitude: 45 },
      { azimuth: 225, altitude: 30 },
      { azimuth: 359, altitude: 89 },
    ];

    testCases.forEach(({ azimuth, altitude }) => {
      it(`round trips azimuth ${azimuth}, altitude ${altitude}`, () => {
        const radius = 50;
        const { x, y, z } = solarToWorld(azimuth, altitude, radius);
        const result = worldToSolar(x, y, z);
        
        // At zenith, azimuth is technically undefined, but our math might yield 0 or 180
        if (altitude === 90) {
          expect(result.altitudeDeg).toBeCloseTo(altitude, 2);
        } else {
          expect(result.azimuthDeg).toBeCloseTo(azimuth, 2);
          expect(result.altitudeDeg).toBeCloseTo(altitude, 2);
        }
      });
    });
  });

  describe('solarToWorld — negative altitude (below horizon)', () => {
    it('negative altitude produces y < 0', () => {
      const pos = solarToWorld(180, -30, 50);
      expect(pos.y).toBeLessThan(0);
    });

    it('altitude=-90 (nadir) puts point directly below', () => {
      const pos = solarToWorld(0, -90, 50);
      expect(pos.y).toBeCloseTo(-50);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.z).toBeCloseTo(0);
    });
  });

  describe('solarToWorld — default radius', () => {
    it('default radius is 50 when not specified', () => {
      const pos = solarToWorld(90, 0); // east at horizon
      expect(pos.x).toBeCloseTo(50);
    });
  });

  describe('solarToWorld — known value at 45°/45°', () => {
    it('azimuth=45° altitude=45° radius=1 → known coordinates', () => {
      const pos = solarToWorld(45, 45, 1);
      // cos(45°) ≈ 0.7071, sin(45°) ≈ 0.7071
      // x = cos(45°)*sin(45°) = 0.5
      // y = sin(45°) ≈ 0.7071
      // z = -cos(45°)*cos(45°) = -0.5
      expect(pos.x).toBeCloseTo(0.5);
      expect(pos.y).toBeCloseTo(Math.SQRT1_2);
      expect(pos.z).toBeCloseTo(-0.5);
    });
  });

  describe('worldToSolar — degenerate origin', () => {
    it('(0,0,0) returns {0, 0} as fallback', () => {
      const result = worldToSolar(0, 0, 0);
      expect(result.azimuthDeg).toBe(0);
      expect(result.altitudeDeg).toBe(0);
    });
  });

  describe('solarToWorld — radius scaling', () => {
    it('doubling radius doubles all coordinates', () => {
      const p1 = solarToWorld(135, 30, 10);
      const p2 = solarToWorld(135, 30, 20);
      expect(p2.x).toBeCloseTo(p1.x * 2);
      expect(p2.y).toBeCloseTo(p1.y * 2);
      expect(p2.z).toBeCloseTo(p1.z * 2);
    });
  });
});
