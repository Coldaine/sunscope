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
  });
});
