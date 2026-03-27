# SunScope Progress

## Last updated: 2026-03-16

## Completed
- Workspace scaffold: pnpm workspaces, turbo, shared TypeScript and Jest config
- R-CORE-001: Azimuth conversion layer
- R-CORE-002: Solar engine with NOAA-backed validation tolerance
- R-CORE-003: Day sample precomputation
- R-CORE-004: Heading smoothing
- R-CORE-005: Shadow calculator
- R-CORE-006: Location store
- R-CORE-007: Phase classifier
- R-CORE-008: Timezone handling
- R-CORE-009: NOAA validation suite
- R-CORE-010: Structured logger
- R-SKY-001: Sky mask data structure
- R-SKY-002: Hemisphere stitcher
- R-SKY-003: Arc integrator
- R-SKY-004: Sky classifier interface
- R-AR-001: Sun arc geometry
- R-AR-002: AR coordinate conversion utilities
- R-AR-003: ViroReact scene stub and Jest mocks
- R-APP-001: Expo project configuration and successful Expo web boot
- R-APP-002: Navigation, shared state, and hook-driven recomputation
- R-APP-003: Sensor wiring hooks and testing guidance
- Coverage: `@sunscope/core` 95.0% statements / 85.9% branches, `@sunscope/sky-detection` 93.9% statements / 69.8% branches

## In Progress
- R-UI-001 through R-UI-006: visual acceptance still needs human review against the Sunlitt-style design target
- Stitch design export pipeline: prompts exist, but generated HTML references have not been imported because Stitch MCP is unavailable here

## Blocked
- R-AR runtime integration: no official confirmation yet for `@reactvision/react-viro` on Expo SDK 55 / RN 0.83
- Stitch MCP unavailable in this session; prompts were generated in `design-reference/prompts/` instead of HTML exports

## Next
- Generate Stitch HTML once MCP access is available and reconcile UI visuals against it
- Verify `@reactvision/react-viro` against Expo SDK 55 / RN 0.83 from upstream before device AR work
- Run physical-device sensor checks on iPhone for heading accuracy and live location behavior

## Open Questions
- Does ViroReact `ViroPolyline` support per-vertex coloring?
- What device camera FOV should be assumed for stitched scan defaults?
