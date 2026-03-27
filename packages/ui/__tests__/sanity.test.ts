import * as ui from '../src';

describe('ui-sanity', () => {
  it('exports the UI package surface', () => {
    expect(ui.PolarSunDiagram).toBeInstanceOf(Function);
    expect(ui.AltitudeChart).toBeInstanceOf(Function);
    expect(ui.SunMap).toBeInstanceOf(Function);
  });
});
