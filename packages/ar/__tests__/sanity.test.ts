import * as ar from '../src';

describe('ar-sanity', () => {
  it('exports the ar package surface', () => {
    expect(ar.computeArcPoints).toBeInstanceOf(Function);
    expect(ar.solarToWorld).toBeInstanceOf(Function);
  });
});
