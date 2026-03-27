/**
 * @fileoverview Shared domain contracts for the SunScope core package.
 *
 * This package defines the canonical data types consumed by the solar engine,
 * sky-detection integration, AR geometry, UI rendering, and app state layers.
 * All angles are degrees clockwise from north and all timestamps are UTC.
 */

export type SunPhase =
  | 'Night'
  | 'AstronomicalTwilight'
  | 'NauticalTwilight'
  | 'CivilTwilight'
  | 'BlueHour'
  | 'GoldenHour'
  | 'Daylight';

export interface SunPosition {
  azimuth: number;
  altitude: number;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  dawn: Date;
  dusk: Date;
  nauticalDawn: Date;
  nauticalDusk: Date;
  nightEnd: Date;
  night: Date;
  goldenHour: Date;
  goldenHourEnd: Date;
  nadir: Date;
}

export interface SunSample {
  date: Date;
  azimuth: number;
  altitude: number;
  phase: SunPhase;
}

export interface ShadowResult {
  length: number;
  direction: number;
  clamped: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationSource = 'GPS' | 'manual' | 'favorite' | 'default';

export interface CurrentLocation extends Coordinates {
  source: LocationSource;
  timestamp: Date;
}

export interface ManualLocation extends Coordinates {
  name: string;
}

export interface SavedLocation extends Coordinates {
  id: string;
  name: string;
  createdAt: Date;
}

export interface LocationState {
  current: CurrentLocation;
  manual: ManualLocation | null;
  favorites: SavedLocation[];
}

export interface SerializedLocationState {
  current: Omit<CurrentLocation, 'timestamp'> & { timestamp: string };
  manual: ManualLocation | null;
  favorites: Array<Omit<SavedLocation, 'createdAt'> & { createdAt: string }>;
}

export interface HeadingInput {
  heading: number;
  headingAccuracy: number;
  timestamp: Date;
}

export interface HeadingState {
  rawHeading: number | null;
  smoothedHeading: number | null;
  headingAccuracy: number | null;
  reliable: boolean;
  sampleCount: number;
  timestamp: Date | null;
}
