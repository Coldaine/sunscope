/**
 * @module @sunscope/ui/__tests__/ui
 * @description Tests for UI package module structure
 */

describe('UI Package — module structure', () => {
  it('barrel export module is importable without errors', () => {
    const ui = require('../src/index');
    expect(ui).toBeDefined();
    expect(typeof ui).toBe('object');
  });

  it('barrel export is currently empty (all exports commented out)', () => {
    // index.ts has only commented-out exports — the module should have no keys
    const ui = require('../src/index');
    const keys = Object.keys(ui);
    expect(keys.length).toBe(0);
  });
});

describe('UI Package — planned export names', () => {
  // These tests document the intended API surface.
  // As components are implemented and uncommented, these should be updated to check existence.
  const plannedExports = [
    'polar-sun-diagram',
    'altitude-chart',
    'sun-map',
    'shadow-sheet',
    'time-scrubber',
    'event-cards',
    'debug-screen',
  ];

  it('planned exports are documented', () => {
    // Sanity: this list matches the commented-out lines in index.ts
    expect(plannedExports.length).toBe(7);
  });
});
