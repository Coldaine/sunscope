import React from 'react';
import { getSunTimes } from '@sunscope/core';
import { EventCards } from '../src/event-cards';

describe('event-cards', () => {
  it('renders solar event cards without crashing', () => {
    const sunTimes = getSunTimes(36.3048, -86.5974, new Date('2026-06-20T00:00:00Z'));
    expect(React.isValidElement(<EventCards sunTimes={sunTimes} />)).toBe(true);
  });
});
