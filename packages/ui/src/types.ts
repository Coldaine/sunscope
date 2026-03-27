/**
 * @fileoverview UI package prop contracts.
 *
 * The UI package consumes typed data from the core and AR packages and exposes
 * presentation components that remain framework-light in tests.
 */

import { HeadingState, ShadowResult, SunSample, SunTimes } from '@sunscope/core';

export interface PolarSunDiagramProps {
  samples: SunSample[];
  currentTime: Date;
}

export interface AltitudeChartProps {
  samples: SunSample[];
}

export interface SunMapProps {
  sunriseAzimuth: number;
  solarNoonAzimuth: number;
  sunsetAzimuth: number;
  locationLabel: string;
}

export interface ShadowSheetProps {
  shadowResult: ShadowResult;
  heightValue: string;
  unit: 'feet' | 'meters';
  onHeightChange: (value: string) => void;
  onUnitChange: (unit: 'feet' | 'meters') => void;
}

export interface TimeScrubberProps {
  currentTime: Date;
  sunTimes: Pick<SunTimes, 'sunrise' | 'solarNoon' | 'sunset'>;
  onChange: (date: Date) => void;
}

export interface EventCardsProps {
  sunTimes: SunTimes;
}

export interface DebugScreenProps {
  rawAzimuthRad: number;
  convertedAzimuthDeg: number;
  headingState: HeadingState;
  locationText: string;
  logs: Array<{ timestamp: string; message: string; module: string; level: string }>;
}
