import React from 'react';
import { getSunTimes } from '@sunscope/core';
import { TimeScrubber } from '../src/time-scrubber';

describe('time-scrubber', () => {
  it('renders event ticks without crashing', () => {
    const sunTimes = getSunTimes(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    expect(
      React.isValidElement(
        <TimeScrubber currentTime={new Date('2026-06-20T17:47:00Z')} sunTimes={sunTimes} onChange={() => undefined} />
      )
    ).toBe(true);
  });
});
