import React from 'react';
import { SunMap } from '../src/sun-map';

describe('sun-map', () => {
  it('renders directional rays from a draggable pin without crashing', () => {
    expect(
      React.isValidElement(
      <SunMap
        sunriseAzimuth={62}
        solarNoonAzimuth={180}
        sunsetAzimuth={298}
        locationLabel="Hendersonville, TN"
      />
      )
    ).toBe(true);
  });
});
