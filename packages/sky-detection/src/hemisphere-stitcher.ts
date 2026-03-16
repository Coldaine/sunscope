/**
 * @module @sunscope/sky-detection/hemisphere-stitcher
 * @description Hemisphere stitcher for projecting camera frames onto sky mask (R-SKY-002)
 * 
 * This module provides functions for projecting pixel classifications from a camera
 * frame onto the spherical sky mask grid. It handles device orientation (azimuth,
 * elevation, roll) and field-of-view to calculate the world coordinates of each pixel.
 * 
 * Dependencies: types.ts, sky-mask.ts, logger.ts (from core)
 * Conventions: All angles in degrees, azimuth clockwise from north (0-360)
 * 
 * Acceptance Criteria:
 * - Given a ScanFrame with device orientation, project pixel classifications onto SkyMask
 * - Handle device azimuth, elevation, roll correctly
 * - Apply field-of-view to determine angular extent of each pixel
 * - Last-write-wins with confidence weighting
 * - Log all operations via structured logger
 */

import {
  SkyMask,
  ScanFrame,
  PixelGrid,
  ObstructionType
} from './types';

import {
  setSkyMaskCell,
  normalizeDegrees,
  clampElevation
} from './sky-mask';

import { ILogger } from '@sunscope/core';

/**
 * Parameters for projecting a pixel to spherical coordinates
 */
export interface PixelProjectionParams {
  /** Pixel X coordinate (0 = left) */
  pixelX: number;
  /** Pixel Y coordinate (0 = top) */
  pixelY: number;
  /** Width of pixel grid */
  gridWidth: number;
  /** Height of pixel grid */
  gridHeight: number;
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
}

/**
 * Spherical coordinates result
 */
export interface SphericalCoords {
  /** Azimuth in degrees (0 = north, clockwise) */
  azimuth: number;
  /** Elevation in degrees (0 = horizon, 90 = zenith) */
  elevation: number;
}

/**
 * Angular size of a pixel
 */
export interface PixelAngularSize {
  /** Azimuth size in degrees */
  azimuthSize: number;
  /** Elevation size in degrees */
  elevationSize: number;
}

/**
 * Parameters for creating a ScanFrame
 */
export interface CreateScanFrameParams {
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
  /** Pixel classifications */
  pixelClassifications: PixelGrid;
  /** Optional timestamp (defaults to now) */
  timestamp?: Date;
}

/**
 * Calculate the angular size of each pixel in the grid
 * @param params - Grid dimensions and FOV
 * @returns Angular size per pixel
 */
export function calculatePixelAngularSize(params: {
  gridWidth: number;
  gridHeight: number;
  fieldOfViewH: number;
  fieldOfViewV: number;
}): PixelAngularSize {
  return {
    azimuthSize: params.fieldOfViewH / params.gridWidth,
    elevationSize: params.fieldOfViewV / params.gridHeight
  };
}

/**
 * Project a pixel to spherical coordinates
 * 
 * Maps a pixel position in the camera frame to world azimuth/elevation based on:
 * - Device orientation (azimuth, elevation, roll)
 * - Field of view
 * - Pixel position within the grid
 * 
 * The projection assumes a simple perspective projection where:
 * - Center pixel maps to device orientation
 * - X axis maps to azimuth offset (left = negative, right = positive)
 * - Y axis maps to elevation offset (up = positive, down = negative)
 * - Roll rotates the coordinate system
 * 
 * @param params - Projection parameters
 * @returns Spherical coordinates (azimuth, elevation)
 */
export function pixelToSpherical(params: PixelProjectionParams): SphericalCoords {
  const {
    pixelX,
    pixelY,
    gridWidth,
    gridHeight,
    deviceAzimuth,
    deviceElevation,
    deviceRoll,
    fieldOfViewH,
    fieldOfViewV
  } = params;

  // Calculate normalized coordinates [-0.5, 0.5] from center
  // pixelX: 0 = left, gridWidth-1 = right
  // pixelY: 0 = top, gridHeight-1 = bottom
  const normX = (pixelX + 0.5) / gridWidth - 0.5;  // -0.5 to +0.5
  const normY = 0.5 - (pixelY + 0.5) / gridHeight; // +0.5 (top) to -0.5 (bottom)

  // Calculate raw offsets from center
  // X offset in azimuth (left = negative, right = positive)
  // Y offset in elevation (up = positive, down = negative)
  let offsetAz = normX * fieldOfViewH;
  let offsetEl = normY * fieldOfViewV;

  // Apply roll rotation
  // Roll rotates the camera around its optical axis
  // Positive roll = clockwise rotation when looking along view direction
  if (deviceRoll !== 0) {
    const rollRad = (deviceRoll * Math.PI) / 180;
    const cosRoll = Math.cos(rollRad);
    const sinRoll = Math.sin(rollRad);

    // Rotate offset vector
    const rotatedAz = offsetAz * cosRoll - offsetEl * sinRoll;
    const rotatedEl = offsetAz * sinRoll + offsetEl * cosRoll;

    offsetAz = rotatedAz;
    offsetEl = rotatedEl;
  }

  // Apply offsets to device orientation
  const azimuth = normalizeDegrees(deviceAzimuth + offsetAz);
  const elevation = clampElevation(deviceElevation + offsetEl);

  return { azimuth, elevation };
}

/**
 * Calculate confidence based on pixel position
 * Center pixels are more reliable (less lens distortion)
 * @param pixelX - Pixel X coordinate
 * @param pixelY - Pixel Y coordinate  
 * @param gridWidth - Grid width
 * @param gridHeight - Grid height
 * @returns Confidence 0-1
 */
function calculatePixelConfidence(
  pixelX: number,
  pixelY: number,
  gridWidth: number,
  gridHeight: number
): number {
  // Calculate distance from center (normalized 0-1)
  const centerX = (gridWidth - 1) / 2;
  const centerY = (gridHeight - 1) / 2;
  
  const dx = (pixelX - centerX) / (gridWidth / 2);
  const dy = (pixelY - centerY) / (gridHeight / 2);
  
  // Euclidean distance from center (0 at center, ~1.4 at corners)
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Confidence decreases linearly from center (1.0) to edge (0.5)
  return Math.max(0.5, 1.0 - distance * 0.5);
}

/**
 * Create a ScanFrame from parameters
 * @param params - Frame parameters
 * @returns ScanFrame ready for stitching
 */
export function createScanFrame(params: CreateScanFrameParams): ScanFrame {
  return {
    timestamp: params.timestamp || new Date(),
    deviceAzimuth: normalizeDegrees(params.deviceAzimuth),
    deviceElevation: clampElevation(params.deviceElevation),
    deviceRoll: params.deviceRoll,
    fieldOfViewH: params.fieldOfViewH,
    fieldOfViewV: params.fieldOfViewV,
    pixelClassifications: params.pixelClassifications
  };
}

/**
 * Stitch a scan frame onto the sky mask
 * 
 * Projects each pixel from the camera frame onto the spherical sky mask grid.
 * Uses last-write-wins with confidence weighting for overlapping regions.
 * 
 * @param mask - Current sky mask
 * @param frame - Scan frame to stitch
 * @param logger - Optional logger
 * @returns New sky mask with stitched data
 */
export function stitchFrame(
  mask: SkyMask,
  frame: ScanFrame,
  logger?: ILogger
): SkyMask {
  const startTime = Date.now();
  let pixelsProcessed = 0;
  let pixelsSkipped = 0;
  let cellsUpdated = 0;

  let currentMask = mask;

  const { width, height, data } = frame.pixelClassifications;

  // Validate pixel grid dimensions
  if (data.length !== height) {
    throw new Error(
      `Pixel grid row count (${data.length}) doesn't match height (${height})`
    );
  }
  for (let y = 0; y < height; y++) {
    if (data[y].length !== width) {
      throw new Error(
        `Pixel grid column count (${data[y].length}) at row ${y} doesn't match width (${width})`
      );
    }
  }

  // Process each pixel in the grid
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const classification = data[y][x];
      
      // Skip Unknown classifications
      if (classification === ObstructionType.Unknown) {
        pixelsSkipped++;
        continue;
      }

      // Project pixel to spherical coordinates
      const coords = pixelToSpherical({
        pixelX: x,
        pixelY: y,
        gridWidth: width,
        gridHeight: height,
        deviceAzimuth: frame.deviceAzimuth,
        deviceElevation: frame.deviceElevation,
        deviceRoll: frame.deviceRoll,
        fieldOfViewH: frame.fieldOfViewH,
        fieldOfViewV: frame.fieldOfViewV
      });

      // Calculate confidence based on pixel position
      const confidence = calculatePixelConfidence(x, y, width, height);

      // Update the sky mask cell
      currentMask = setSkyMaskCell(
        currentMask,
        coords.azimuth,
        coords.elevation,
        classification,
        confidence,
        logger
      );

      pixelsProcessed++;
      cellsUpdated++;
    }
  }

  const elapsedMs = Date.now() - startTime;

  logger?.info('Stitched frame', {
    frameTimestamp: frame.timestamp.toISOString(),
    deviceAzimuth: frame.deviceAzimuth,
    deviceElevation: frame.deviceElevation,
    deviceRoll: frame.deviceRoll,
    gridWidth: width,
    gridHeight: height,
    pixelsProcessed,
    pixelsSkipped,
    cellsUpdated,
    elapsedMs
  });

  return currentMask;
}

/**
 * Stitch multiple frames onto the sky mask
 * 
 * Processes frames in order, applying last-write-wins for overlaps.
 * Useful for combining multiple scan passes around the horizon.
 * 
 * @param mask - Initial sky mask
 * @param frames - Array of scan frames to stitch
 * @param logger - Optional logger
 * @returns New sky mask with all frames stitched
 */
export function stitchFrames(
  mask: SkyMask,
  frames: ScanFrame[],
  logger?: ILogger
): SkyMask {
  const startTime = Date.now();

  let currentMask = mask;
  let totalFrames = frames.length;
  let processedFrames = 0;

  for (const frame of frames) {
    currentMask = stitchFrame(currentMask, frame, logger);
    processedFrames++;
  }

  const elapsedMs = Date.now() - startTime;

  logger?.info('Stitched all frames', {
    totalFrames,
    processedFrames,
    elapsedMs
  });

  return currentMask;
}
