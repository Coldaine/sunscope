import React from 'react';
import { SunArcARScene } from '../src/viro-scene';

describe('viro-scene', () => {
  it('renders in Jest using Viro mocks', () => {
    const element = (
      <SunArcARScene
        arcPoints={[
          {
            x: 0,
            y: 10,
            z: 20,
            azimuth: 180,
            altitude: 30,
            phase: 'Daylight',
            date: new Date('2026-06-20T17:49:00Z')
          }
        ]}
        currentSunIndex={0}
        showPhaseColors={true}
        showBlockedSegments={true}
      />
    );

    expect(React.isValidElement(element)).toBe(true);
  });
});
