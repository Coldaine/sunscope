/**
 * @module viro-scene
 * @description Typed React component for the AR sun path overlay.
 * Uses ViroReact (gravityAndHeading world alignment, Y-up, -Z north, +X east).
 *
 * showPhaseColors: colors each arc segment by solar phase (golden, civil, day, etc.)
 * showBlockedSegments: colors blocked segments red, unblocked green, unknown gray
 *
 * Watch Out:
 *   ViroReact requires a dev client build, NOT Expo Go.
 *   Lazy-load this component so non-AR screens work in Expo Go.
 *   See TODO.md for known compatibility gaps.
 */

// TODO: Accept an optional Logger via props (or React context) for structured logging
// of segment-building stats during render.

import React from 'react';
// @ts-ignore – ViroReact doesn't ship TS types for all components; see __mocks__ for Jest
import { ViroARScene, ViroPolyline } from '@reactvision/react-viro';
import { ArcPoint3D } from './types';

export interface SunArcARSceneProps {
  arcPoints: ArcPoint3D[];
  currentSunIndex: number;
  showPhaseColors: boolean;
  showBlockedSegments: boolean;
}

/** Map solar phase to a material name for ViroPolyline. */
function phaseMaterial(phase: string): string {
  switch (phase) {
    case 'golden_hour': return 'arc-golden';
    case 'blue_hour':   return 'arc-blue';
    case 'civil_twilight':
    case 'nautical_twilight':
    case 'astronomical_twilight': return 'arc-twilight';
    case 'night': return 'arc-night';
    default: return 'arc-day';
  }
}

/** Map blocked state to a material name. */
function blockedMaterial(blocked: boolean | undefined): string {
  if (blocked === undefined) return 'arc-unknown';
  return blocked ? 'arc-blocked' : 'arc-unblocked';
}

export const SunArcARScene: React.FC<SunArcARSceneProps> = ({
  arcPoints,
  currentSunIndex,
  showPhaseColors,
  showBlockedSegments,
}) => {
  if (arcPoints.length < 2) {
    return <ViroARScene />;
  }

  if (showBlockedSegments) {
    // Segment the arc by consecutive blocked state, render each as separate polyline
    const segments: Array<{ points: [number, number, number][]; material: string }> = [];
    let segStart = 0;
    let segMaterial = blockedMaterial(arcPoints[0].blocked);

    for (let i = 1; i <= arcPoints.length; i++) {
      const mat = i < arcPoints.length ? blockedMaterial(arcPoints[i].blocked) : null;
      if (mat !== segMaterial || i === arcPoints.length) {
        const pts = arcPoints.slice(segStart, i).map(p => [p.x, p.y, p.z] as [number, number, number]);
        if (pts.length >= 2) {
          segments.push({ points: pts, material: segMaterial });
        }
        segStart = i - 1; // overlap by 1 point for continuity
        segMaterial = mat ?? segMaterial;
      }
    }

    return (
      <ViroARScene>
        {segments.map((seg, idx) => (
          <ViroPolyline
            key={idx}
            position={[0, 0, 0]}
            points={seg.points}
            thickness={0.05}
            materials={[seg.material]}
          />
        ))}
      </ViroARScene>
    );
  }

  if (showPhaseColors) {
    // Segment by phase
    const segments: Array<{ points: [number, number, number][]; material: string }> = [];
    let segStart = 0;
    let segMaterial = phaseMaterial(arcPoints[0].phase);

    for (let i = 1; i <= arcPoints.length; i++) {
      const mat = i < arcPoints.length ? phaseMaterial(arcPoints[i].phase) : null;
      if (mat !== segMaterial || i === arcPoints.length) {
        const pts = arcPoints.slice(segStart, i).map(p => [p.x, p.y, p.z] as [number, number, number]);
        if (pts.length >= 2) {
          segments.push({ points: pts, material: segMaterial });
        }
        segStart = i - 1;
        segMaterial = mat ?? segMaterial;
      }
    }

    return (
      <ViroARScene>
        {segments.map((seg, idx) => (
          <ViroPolyline
            key={idx}
            position={[0, 0, 0]}
            points={seg.points}
            thickness={0.05}
            materials={[seg.material]}
          />
        ))}
      </ViroARScene>
    );
  }

  // Default: single polyline, no coloring
  const points = arcPoints.map(p => [p.x, p.y, p.z] as [number, number, number]);
  return (
    <ViroARScene>
      <ViroPolyline
        position={[0, 0, 0]}
        points={points}
        thickness={0.05}
        materials={['arc-day']}
      />
    </ViroARScene>
  );
};

