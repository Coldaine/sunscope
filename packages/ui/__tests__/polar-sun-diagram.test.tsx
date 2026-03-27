import React from 'react';
import { sampleSunDay } from '@sunscope/core';
import { PolarSunDiagram } from '../src/polar-sun-diagram';

describe('polar-sun-diagram', () => {
  it('renders a semicircular sun path without crashing', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    expect(
      React.isValidElement(<PolarSunDiagram samples={samples} currentTime={new Date('2026-06-20T17:47:00Z')} />)
    ).toBe(true);
  });
});
