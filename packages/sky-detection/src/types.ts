/**
 * @fileoverview Sky detection contracts for SunScope.
 *
 * This package defines the spherical sky-mask data model and frame stitching
 * inputs consumed by the scan pipeline. It depends on `@sunscope/core` only for
 * shared logging and solar sample types in downstream integrations.
 */

export enum ObstructionType {
  Sky = 'Sky',
  Tree = 'Tree',
  Building = 'Building',
  Roof = 'Roof',
  Fence = 'Fence',
  Unknown = 'Unknown'
}

export interface SkyMaskCell {
  classification: ObstructionType;
  confidence: number;
  lastUpdated: Date | null;
}

export type SkyMask = SkyMaskCell[][];
export type HemisphereMap = SkyMask;
export type PixelGrid = ObstructionType[][];

export interface ScanFrame {
  timestamp: Date;
  deviceAzimuth: number;
  deviceElevation: number;
  deviceRoll: number;
  fieldOfViewH: number;
  fieldOfViewV: number;
  pixelClassifications: PixelGrid;
}

export interface ArcSegment {
  startTime: Date;
  endTime: Date;
  blocked: boolean;
  obstruction: ObstructionType | null;
}

export interface SunHoursResult {
  totalHours: number;
  segments: ArcSegment[];
  maskIncomplete: boolean;
}

export const SKY_MASK_AZIMUTH_BUCKETS = 180;
export const SKY_MASK_ELEVATION_BUCKETS = 45;
export const SKY_MASK_BUCKET_DEGREES = 2;
