import * as core from '../src';

describe('core-sanity', () => {
  it('exports the core package surface', () => {
    expect(core.suncalcToCompass).toBeInstanceOf(Function);
    expect(core.sampleSunDay).toBeInstanceOf(Function);
  });
});
