import React from 'react';
import { sampleSunDay } from '@sunscope/core';
import { AltitudeChart } from '../src/altitude-chart';

describe('altitude-chart', () => {
  it('renders a day altitude chart without crashing', () => {
    const samples = sampleSunDay(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    expect(React.isValidElement(<AltitudeChart samples={samples} />)).toBe(true);
  });
});
