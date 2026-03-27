import React from 'react';
import { DebugScreen } from '../src/debug-screen';

describe('debug-screen', () => {
  it('renders raw heading, converted azimuth, and logs without crashing', () => {
    expect(
      React.isValidElement(
      <DebugScreen
        rawAzimuthRad={1.2}
        convertedAzimuthDeg={180.5}
        headingState={{
          rawHeading: 182,
          smoothedHeading: 180,
          headingAccuracy: 3,
          reliable: true,
          sampleCount: 4,
          timestamp: new Date('2026-03-16T00:00:00Z')
        }}
        locationText="36.3048,-86.5974"
        logs={[
          { timestamp: '2026-03-16T00:00:00.000Z', module: 'app', level: 'INFO', message: 'ready' }
        ]}
      />
      )
    ).toBe(true);
  });
});
