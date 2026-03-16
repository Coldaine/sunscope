import { suncalcToCompass, radToDeg, degToRad } from '../src/solar-convert';

describe('solar-convert', () => {
  describe('radToDeg', () => {
    it('converts Math.PI to 180', () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
    });
  });

  describe('degToRad', () => {
    it('converts 180 to Math.PI', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
    });
  });

  describe('suncalcToCompass', () => {
    it('converts 0 (south) to 180', () => {
      expect(suncalcToCompass(0)).toBeCloseTo(180);
    });

    it('converts Math.PI/2 (west) to 270', () => {
      expect(suncalcToCompass(Math.PI / 2)).toBeCloseTo(270);
    });

    it('converts -Math.PI/2 (east) to 90', () => {
      expect(suncalcToCompass(-Math.PI / 2)).toBeCloseTo(90);
    });

    it('converts Math.PI (north) to 0', () => {
      // 0 or 360 are acceptable, modulo maps 360 to 0
      expect(suncalcToCompass(Math.PI)).toBeCloseTo(0);
    });
    
    it('converts negative north to 0', () => {
      expect(suncalcToCompass(-Math.PI)).toBeCloseTo(0);
    });
    
    it('handles slightly past north wraps correctly', () => {
      expect(suncalcToCompass(Math.PI * 1.5)).toBeCloseTo(90);
    });

    it('output is always in [0, 360)', () => {
      // Sweep a range of inputs and verify bounds
      for (let rad = -4 * Math.PI; rad <= 4 * Math.PI; rad += 0.5) {
        const result = suncalcToCompass(rad);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
      }
    });

    it('full rotation (2π) maps back to 180 (south)', () => {
      expect(suncalcToCompass(2 * Math.PI)).toBeCloseTo(180);
    });
  });

  describe('radToDeg — edge cases', () => {
    it('0 radians → 0 degrees', () => {
      expect(radToDeg(0)).toBe(0);
    });

    it('2π → 360', () => {
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });

    it('negative π → -180', () => {
      expect(radToDeg(-Math.PI)).toBeCloseTo(-180);
    });
  });

  describe('degToRad — edge cases', () => {
    it('0 degrees → 0 radians', () => {
      expect(degToRad(0)).toBe(0);
    });

    it('360 → 2π', () => {
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    it('-90 → -π/2', () => {
      expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('round-trip conversions', () => {
    it('radToDeg(degToRad(x)) ≈ x for various values', () => {
      for (const deg of [0, 45, 90, 135, 180, 270, 360, -45, -180]) {
        expect(radToDeg(degToRad(deg))).toBeCloseTo(deg);
      }
    });

    it('degToRad(radToDeg(x)) ≈ x for various values', () => {
      for (const rad of [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI]) {
        expect(degToRad(radToDeg(rad))).toBeCloseTo(rad);
      }
    });
  });
});
