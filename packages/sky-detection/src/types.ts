/**
 * @module @sunscope/sky-detection/types
 * @description Type definitions for sky detection and obstruction mapping
 * 
 * This module defines the core data structures for representing a spherical
 * sky mask that maps the hemisphere around the user to classifications
 * of what blocks the sky at each direction.
 * 
 * Dependencies: None (pure types)
 * Conventions: All angles in degrees, azimuth clockwise from north (0-360)
 */

/**
 * Classification types for sky mask cells
 */
export enum ObstructionType {
  Sky = 'Sky',
  Tree = 'Tree',
  Building = 'Building',
  Roof = 'Roof',
  Fence = 'Fence',
  Unknown = 'Unknown'
}

/**
 * A single cell in the sky mask grid
 */
export interface SkyMaskCell {
  /** Classification of this cell */
  classification: ObstructionType;
  /** Confidence score 0-1 */
  confidence: number;
  /** When this cell was last updated, null if never */
  lastUpdated: Date | null;
}

/**
 * Spherical grid representing the sky hemisphere
 * Resolution: 2° azimuth x 2° elevation = 180 x 45 = 8100 cells
 * 
 * Azimuth buckets: 0-179 (each = 2°, 0° = north, 90° = south, 180° = north)
 * Elevation buckets: 0-44 (each = 2°, 0° = horizon, 90° = zenith)
 */
export interface SkyMask {
  /** 2D grid: [azimuthBucket][elevationBucket] */
  grid: SkyMaskCell[][];
  /** Metadata about the mask */
  metadata: {
    /** When this mask was created */
    createdAt: Date;
    /** Last time any cell was updated */
    lastUpdated: Date | null;
    /** Azimuth resolution in degrees */
    azimuthResolution: number;
    /** Elevation resolution in degrees */
    elevationResolution: number;
  };
}

/**
 * A frame captured during sky scanning
 */
export interface ScanFrame {
  /** When this frame was captured */
  timestamp: Date;
  /** Device compass heading in degrees (0 = north) */
  deviceAzimuth: number;
  /** Device pitch in degrees (0 = horizon, 90 = up) */
  deviceElevation: number;
  /** Device roll in degrees (0 = upright) */
  deviceRoll: number;
  /** Horizontal field of view in degrees */
  fieldOfViewH: number;
  /** Vertical field of view in degrees */
  fieldOfViewV: number;
  /** Downsampled pixel classifications (e.g., 64x64) */
  pixelClassifications: PixelGrid;
}

/**
 * 2D grid of classified pixels from a camera frame
 */
export interface PixelGrid {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** 2D array where [y][x] gives the classification at that pixel */
  data: ObstructionType[][];
}

/**
 * Result of integrating sun hours against a sky mask
 */
export interface SunHoursResult {
  /** Total hours of unblocked sun */
  totalHours: number;
  /** Continuous segments of sun availability */
  segments: ArcSegment[];
  /** Whether the mask had incomplete coverage */
  maskIncomplete: boolean;
  /** Statistics for debugging */
  stats: {
    totalSamples: number;
    blockedCount: number;
    unblockedCount: number;
    unknownCount: number;
  };
}

/**
 * A continuous segment of time with consistent sun availability
 */
export interface ArcSegment {
  /** Segment start time */
  startTime: Date;
  /** Segment end time */
  endTime: Date;
  /** Whether sun is blocked during this segment */
  blocked: boolean;
  /** Type of obstruction if blocked, null if unblocked */
  obstruction: ObstructionType | null;
}

/**
 * Interface for sky classification implementations
 */
export interface SkyClassifier {
  /**
   * Classify a camera frame into a pixel grid
   * @param imageData - Raw image data (e.g., Uint8Array from camera)
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @param logger - Optional logger for debugging
   * @returns Promise resolving to pixel classifications
   */
  classifyFrame(imageData: Uint8Array, width: number, height: number, logger?: import('@sunscope/core').ILogger): Promise<PixelGrid>;
}

/**
 * Hemisphere map for visualization and debugging
 */
export interface HemisphereMap {
  /** Projected 2D representation for display */
  projection: 'azimuthal' | 'equirectangular';
  /** Canvas/image data for rendering */
  imageData: Uint8Array;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}
