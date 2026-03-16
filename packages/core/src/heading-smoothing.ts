/**
 * @module heading-smoothing
 * @description Low-pass filter for compass heading values with shortest-angular-distance interpolation.
 *
 * Dependencies: none (pure math)
 * Conventions:
 *   - All angles in compass degrees [0, 360)
 *   - Wrapping: 350° → 10° interpolation travels +20°, NOT −340°
 *   - Unreliable: headingAccuracy < 0 → flagged as unreliable
 *
 * Algorithm: exponential moving average in circular space using shortest angular distance.
 */

import { Logger, DefaultLogger } from './logger';

export interface HeadingReading {
  heading: number;       // Compass degrees [0, 360)
  accuracy: number;      // Positive = reliable. Negative = unreliable (per iOS CLLocationManager)
  timestamp: number;     // Unix ms
}

export interface SmoothedHeading {
  heading: number;       // Smoothed compass degrees [0, 360)
  reliable: boolean;     // false when most recent accuracy < 0
  sampleCount: number;
}

/** Wraps a degree value to [0, 360) safely. */
function wrapDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Shortest angular distance from `a` to `b` in degrees.
 * Returns a value in (-180, 180].
 */
export function shortestAngularDistance(a: number, b: number): number {
  const diff = wrapDeg(b - a);
  return diff > 180 ? diff - 360 : diff;
}

/**
 * Exponential moving average smoother for compass headings.
 * alpha: smoothing factor [0, 1]. Higher = faster response, less smoothing.
 */
export class HeadingSmoother {
  private smoothed: number | null = null;
  private sampleCount = 0;
  private lastReliable = true;

  constructor(
    private readonly alpha: number = 0.3,
    private readonly log: Logger = new DefaultLogger('heading-smoothing')
  ) {}

  /**
   * Feed a new reading. Returns the current smoothed heading.
   */
  update(reading: HeadingReading): SmoothedHeading {
    const reliable = reading.accuracy >= 0;

    if (this.smoothed === null) {
      this.smoothed = wrapDeg(reading.heading);
      this.sampleCount = 1;
    } else {
      const delta = shortestAngularDistance(this.smoothed, reading.heading);
      const prev = this.smoothed;
      this.smoothed = wrapDeg(this.smoothed + this.alpha * delta);
      this.sampleCount++;
      this.log.debug('Heading smoothing step', {
        prev, new: reading.heading, delta, smoothed: this.smoothed, reliable
      });
    }

    this.lastReliable = reliable;

    if (!reliable) {
      this.log.warn('Heading accuracy flagged unreliable', { accuracy: reading.accuracy });
    }

    return { heading: this.smoothed, reliable, sampleCount: this.sampleCount };
  }

  /** Reset the smoother state. */
  reset(): void {
    this.smoothed = null;
    this.sampleCount = 0;
    this.lastReliable = true;
  }

  get current(): number | null {
    return this.smoothed;
  }
}
