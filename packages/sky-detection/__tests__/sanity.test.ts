import * as skyDetection from '../src';

describe('sky-detection-sanity', () => {
  it('exports the sky-detection package surface', () => {
    expect(skyDetection.createEmptySkyMask).toBeInstanceOf(Function);
    expect(skyDetection.integrateSunHours).toBeInstanceOf(Function);
  });
});
