import { HeadingStore } from '../src/heading-store';

describe('heading-store', () => {
  it('interpolates across the shortest wraparound path', () => {
    const store = new HeadingStore();
    store.update({
      heading: 350,
      headingAccuracy: 5,
      timestamp: new Date('2026-03-16T00:00:00Z')
    });

    const result = store.update({
      heading: 10,
      headingAccuracy: 5,
      timestamp: new Date('2026-03-16T00:00:01Z')
    });

    expect(result.smoothedHeading).toBeGreaterThan(350);
    expect(result.smoothedHeading).toBeLessThan(360);
  });

  it('flags negative accuracy as unreliable', () => {
    const store = new HeadingStore();
    const result = store.update({
      heading: 90,
      headingAccuracy: -1,
      timestamp: new Date('2026-03-16T00:00:00Z')
    });

    expect(result.reliable).toBe(false);
  });

  it('smooths synthetic jitter to within two degrees after repeated samples', () => {
    const store = new HeadingStore();
    const values = [90, 95, 88, 92, 87, 94, 89, 91, 93, 90];
    let latest = null as ReturnType<HeadingStore['getState']> | null;

    values.forEach((heading, index) => {
      latest = store.update({
        heading,
        headingAccuracy: 3,
        timestamp: new Date(`2026-03-16T00:00:${String(index).padStart(2, '0')}Z`)
      });
    });

    expect(latest?.smoothedHeading).toBeGreaterThanOrEqual(88);
    expect(latest?.smoothedHeading).toBeLessThanOrEqual(92);
  });

  it.each([
    [350, 10],
    [10, 350],
    [179, 181],
    [181, 179],
    [269, 271],
    [271, 269]
  ])('handles wraparound case %d -> %d', (fromHeading, toHeading) => {
    const store = new HeadingStore();
    store.update({
      heading: fromHeading,
      headingAccuracy: 5,
      timestamp: new Date('2026-03-16T00:00:00Z')
    });
    const result = store.update({
      heading: toHeading,
      headingAccuracy: 5,
      timestamp: new Date('2026-03-16T00:00:01Z')
    });

    expect(result.smoothedHeading).not.toBeNull();
  });
});
