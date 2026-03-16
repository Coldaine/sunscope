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
});
