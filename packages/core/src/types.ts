/**
 * @module @sunscope/core/types
 * @description Core type definitions for SunScope
 * 
 * This module defines the shared types used across all packages.
 * All angles are in degrees, north-origin, clockwise.
 * 
 * Dependencies: None (pure types)
 * Conventions: See CONVENTIONS.md for coordinate systems
 */

/** Geographic location */
export interface Location {
  /** Latitude in degrees, -90 to 90 */
  latitude: number;
  /** Longitude in degrees, -180 to 180 */
  longitude: number;
  /** Optional altitude in meters above sea level */
  altitude?: number;
  /** Location name for display */
  name?: string;
}

/** A single sun position sample */
export interface SunSample {
  /** Timestamp in UTC */
  date: Date;
  /** Azimuth in degrees, 0 = north, clockwise */
  azimuth: number;
  /** Altitude in degrees, 0 = horizon, 90 = zenith, negative = below horizon */
  altitude: number;
  /** Sun phase at this time */
  phase: SunPhase;
  /** Whether this sample is blocked (computed from sky mask) */
  blocked?: boolean;
}

/** Sun phases throughout the day */
export enum SunPhase {
  Night = 'Night',
  AstronomicalDawn = 'AstronomicalDawn',
  NauticalDawn = 'NauticalDawn',
  BlueHourMorning = 'BlueHourMorning',
  GoldenHourMorning = 'GoldenHourMorning',
  Daylight = 'Daylight',
  GoldenHourEvening = 'GoldenHourEvening',
  BlueHourEvening = 'BlueHourEvening',
  NauticalDusk = 'NauticalDusk',
  AstronomicalDusk = 'AstronomicalDusk'
}

/** Key sun events for a day */
export interface SunTimes {
  /** Sunrise time (UTC) */
  sunrise: Date;
  /** Sunset time (UTC) */
  sunset: Date;
  /** Solar noon (highest altitude) */
  solarNoon: Date;
  /** Nadir (lowest altitude) */
  nadir: Date;
  /** Morning golden hour start */
  goldenHourMorningStart: Date;
  /** Morning golden hour end */
  goldenHourMorningEnd: Date;
  /** Evening golden hour start */
  goldenHourEveningStart: Date;
  /** Evening golden hour end */
  goldenHourEveningEnd: Date;
  /** Dawn (civil twilight start) */
  dawn: Date;
  /** Dusk (civil twilight end) */
  dusk: Date;
  /** Nautical dawn */
  nauticalDawn: Date;
  /** Nautical dusk */
  nauticalDusk: Date;
  /** Astronomical dawn */
  astronomicalDawn: Date;
  /** Astronomical dusk */
  astronomicalDusk: Date;
}

/** Device heading with accuracy */
export interface Heading {
  /** True heading in degrees, 0 = north, clockwise */
  trueHeading: number;
  /** Magnetic heading in degrees */
  magHeading: number;
  /** Heading accuracy in degrees, negative if unreliable */
  accuracy: number;
  /** Timestamp of reading */
  timestamp: Date;
}

/** Shadow calculation result */
export interface ShadowResult {
  /** Shadow length in meters */
  length: number;
  /** Shadow direction in degrees, 0 = north, clockwise */
  direction: number;
  /** Whether the result was clamped (sun very low) */
  clamped: boolean;
  /** Sun altitude used in calculation */
  altitude: number;
  /** Sun azimuth used in calculation */
  azimuth: number;
  /** Object height used in calculation */
  objectHeight: number;
}

/** LLM provider configuration (for elicitation harness, if needed) */
export interface LLMProviderConfig {
  provider: 'anthropic' | 'openai' | 'ollama' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

/** Profile configuration (for elicitation harness, if needed) */
export interface Profile {
  id: string;
  name: string;
  description?: string;
  llmConfig?: LLMProviderConfig;
  createdAt: number;
  updatedAt: number;
  version: number;
}
