/**
 * @fileoverview Heading smoothing with wraparound-safe interpolation.
 *
 * This store keeps a smoothed compass heading in SunScope conventions. It
 * depends on the shared logger and angle normalization helpers and intentionally
 * remains framework-free so it can be used in tests and app hooks.
 */

import { Logger, createLogger, measureElapsedMs } from './logger';
import { normalizeDegrees } from './solar-convert';
import { HeadingInput, HeadingState } from './types';

const DEFAULT_SMOOTHING_FACTOR = 0.35;

function getLogger(logger?: Logger): Logger {
  return logger ?? createLogger({ moduleName: 'heading-store' });
}

function shortestAngularDistance(fromDeg: number, toDeg: number): number {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

export class HeadingStore {
  private state: HeadingState = {
    rawHeading: null,
    smoothedHeading: null,
    headingAccuracy: null,
    reliable: false,
    sampleCount: 0,
    timestamp: null
  };

  public constructor(
    private readonly logger: Logger = createLogger({ moduleName: 'heading-store' }),
    private readonly smoothingFactor = DEFAULT_SMOOTHING_FACTOR
  ) {}

  public getState(): HeadingState {
    return { ...this.state };
  }

  public update(input: HeadingInput): HeadingState {
    const startTime = process.hrtime.bigint();
    this.logger.debug('HeadingStore.update.entry', {
      heading: input.heading,
      headingAccuracy: input.headingAccuracy,
      timestamp: input.timestamp.toISOString(),
      previousSmoothedHeading: this.state.smoothedHeading
    });

    const reliable = input.headingAccuracy >= 0;
    const normalizedHeading = normalizeDegrees(input.heading, this.logger.child('solar-convert'));
    let nextSmoothed = this.state.smoothedHeading;

    if (nextSmoothed === null) {
      nextSmoothed = normalizedHeading;
      this.logger.debug('HeadingStore.update.branch', { branch: 'seed', reason: 'firstSample' });
    } else if (reliable) {
      const delta = shortestAngularDistance(nextSmoothed, normalizedHeading);
      nextSmoothed = normalizeDegrees(
        nextSmoothed + delta * this.smoothingFactor,
        this.logger.child('solar-convert')
      );
      this.logger.debug('HeadingStore.update.branch', {
        branch: 'smooth',
        reason: 'reliableSample',
        delta
      });
    } else {
      this.logger.warn('HeadingStore.update.unreliable', {
        headingAccuracy: input.headingAccuracy
      });
    }

    this.state = {
      rawHeading: normalizedHeading,
      smoothedHeading: nextSmoothed,
      headingAccuracy: input.headingAccuracy,
      reliable,
      sampleCount: this.state.sampleCount + 1,
      timestamp: input.timestamp
    };

    this.logger.debug('HeadingStore.update.exit', {
      state: {
        rawHeading: this.state.rawHeading,
        smoothedHeading: this.state.smoothedHeading,
        reliable: this.state.reliable,
        sampleCount: this.state.sampleCount
      },
      elapsedMs: measureElapsedMs(startTime)
    });

    return this.getState();
  }
}

export function createHeadingStore(logger?: Logger, smoothingFactor?: number): HeadingStore {
  return new HeadingStore(getLogger(logger), smoothingFactor);
}
