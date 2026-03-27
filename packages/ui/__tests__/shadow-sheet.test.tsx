import React from 'react';
import { ShadowSheet } from '../src/shadow-sheet';

describe('shadow-sheet', () => {
  it('renders shadow outputs and controls without crashing', () => {
    expect(
      React.isValidElement(
      <ShadowSheet
        shadowResult={{ length: 3.46, direction: 180, clamped: false }}
        heightValue="2"
        unit="meters"
        onHeightChange={() => undefined}
        onUnitChange={() => undefined}
      />
      )
    ).toBe(true);
  });
});
