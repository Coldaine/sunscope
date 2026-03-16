# SunScope Progress

## Last updated: 2026-03-16

## Completed

### Setup
- [x] Monorepo scaffold with pnpm workspaces
- [x] Turbo configuration
- [x] Base TypeScript configuration
- [x] CONVENTIONS.md
- [x] PROGRESS.md (this file)
- [x] STATUS.md
- [x] BUILD_SUMMARY.md
- [x] All package.json files with exact dependencies
- [x] All tsconfig.json files
- [x] All jest.config.js files
- [x] ViroReact mock for AR package

### Phase 0: packages/core (COMPLETE)
- [x] R-CORE-010: Structured logger (logger.ts)
- [x] Core type definitions (types.ts)
- [x] Test suite for logger (__tests__/logger.test.ts)

### Phase 1: packages/sky-detection
- [x] R-SKY-001: Sky mask data structure (COMPLETE)
  - [x] Type definitions (types.ts)
  - [x] Full implementation (sky-mask.ts)
  - [x] 67 comprehensive tests
- [x] R-SKY-002: Hemisphere stitcher (COMPLETE)
  - [x] pixelToSpherical projection with roll support
  - [x] calculatePixelAngularSize for FOV calculations
  - [x] createScanFrame helper
  - [x] stitchFrame with last-write-wins
  - [x] stitchFrames for batch processing
  - [x] 20 comprehensive tests
- [ ] R-SKY-003: Arc integrator
- [ ] R-SKY-004: Sky classifier interface

### Package Scaffolds (Ready)
- [x] AR package
- [x] UI package
- [x] Mobile app

## In Progress

None - Phase 1 partially complete.

## Next

1. Implement R-SKY-003: Arc integrator
   - `integrateSunHours()` - computes hours of direct sun
   - `ArcSegment` type for continuous blocked/unblocked periods
   - Test with clear mask, half-blocked mask, unknown mask
2. Implement R-SKY-004: Sky classifier interface
   - `SkyClassifier` interface
   - `MockSkyClassifier` for testing
   - `DeepLabV3Classifier` stub
3. Move to Phase 2: packages/ar (R-AR-001, R-AR-002, R-AR-003)

## Blocked

None

## Next

1. Complete R-SKY-001 with full test coverage
2. Continue through R-SKY-004
3. Move to Phase 2: packages/ar

## Open Questions

- Does ViroReact ViroPolyline support per-vertex coloring? (Need to verify before R-AR-001 implementation)
- What is the iPhone camera FOV in degrees? (Needed for R-SKY-002 projection math)

## Dependency Status

| Package | Status | Tests |
|---------|--------|-------|
| sky-detection | In Progress | 87 passing |
| ar | Scaffolded | 1 passing |
| core | Complete | 10 passing |
| ui | Scaffolded | 1 passing |
| mobile | Scaffolded | 1 passing |
| **Total** | - | **100 passing** |
