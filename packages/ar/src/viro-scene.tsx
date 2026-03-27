/**
 * @fileoverview Typed ViroReact scene stub for SunScope AR overlays.
 *
 * This component defines the props and render shape for the future AR overlay
 * without requiring device-side execution in the Linux development environment.
 * The real runtime integration remains gated on verified Viro compatibility.
 */

import React from 'react';
import { ViroARScene, ViroAmbientLight, ViroPolyline, ViroSphere } from '@reactvision/react-viro';
import { SunArcARSceneProps } from './types';

function getCurrentPointIndex(pointsLength: number, requestedIndex: number): number {
  return Math.min(Math.max(requestedIndex, 0), Math.max(pointsLength - 1, 0));
}

export function SunArcARScene(props: SunArcARSceneProps): React.JSX.Element {
  const currentPoint = props.arcPoints[getCurrentPointIndex(props.arcPoints.length, props.currentSunIndex)];
  const polylinePoints = props.arcPoints.map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z
  }));

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" />
      <ViroPolyline
        points={polylinePoints}
        thickness={0.25}
        materials={[
          props.showBlockedSegments ? 'blockedAwareArc' : 'phaseArc'
        ]}
      />
      {currentPoint !== undefined ? (
        <ViroSphere
          position={[currentPoint.x, currentPoint.y, currentPoint.z]}
          radius={0.75}
          materials={[props.showPhaseColors ? 'currentPhaseSun' : 'currentSun']}
        />
      ) : null}
    </ViroARScene>
  );
}
