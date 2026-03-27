/**
 * @fileoverview AR geometry contracts for SunScope.
 *
 * This package converts core solar samples into Viro-compatible world-space
 * data. It depends on `@sunscope/core` for the solar sample contract and keeps
 * rendering-specific props isolated from device runtime requirements.
 */

import { SunPhase } from '@sunscope/core';

export interface ArcPoint3D {
  x: number;
  y: number;
  z: number;
  azimuth: number;
  altitude: number;
  phase: SunPhase;
  date: Date;
  blocked?: boolean;
}

export interface ArcSegment {
  startIndex: number;
  endIndex: number;
  blocked: boolean;
}

export interface ArcRenderData {
  points: ArcPoint3D[];
  segments: ArcSegment[];
}

export interface BlockedSegment {
  startTime: Date;
  endTime: Date;
  blocked: boolean;
}

export interface SunHoursResultLike {
  segments: BlockedSegment[];
}

export interface SunArcARSceneProps {
  arcPoints: ArcPoint3D[];
  currentSunIndex: number;
  showPhaseColors: boolean;
  showBlockedSegments: boolean;
}
