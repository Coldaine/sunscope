# SunScope Master Plan

## Meta

- **App**: SunScope, a sun tracking app for iOS
- **Stack**: React Native + Expo + TypeScript, monorepo with pnpm workspaces
- **AR layer**: ViroReact (@reactvision/react-viro) for phase 2
- **Solar engine**: suncalc (npm, mourner's original)
- **Owner**: Patrick MacLyman (pmaclyman@moosegoose.xyz)
- **Dev environment**: Linux (the Zo) for all code; iPhone for sensor testing; EAS Build for iOS binaries
- **Test philosophy**: Every requirement has acceptance criteria. The agent churns until all criteria pass. No requirement is "done" until its tests are green AND its logs demonstrate correct execution flow.

## Document role

This file is the detailed requirement and acceptance-criteria spec.

Project intent and invariants live in `docs/NORTH_STAR.md`.
Live execution state lives in `docs/ROADMAP.md`.
Completed-versus-remaining grouping lives in `docs/plans/MASTER_PLAN_DONE.md` and `docs/plans/MASTER_PLAN_REMAINING.md`.

Checklist items in this document are preserved as specification text and are not the live status tracker.

---

## Global Agent Instructions

### Before you write any code

1. Read this entire document.
2. Set up the monorepo scaffold first. pnpm workspaces, turborepo, tsconfig, jest config. One passing sanity test per package before any feature code.
3. Pin every dependency with `--save-exact`. No caret ranges, no tilde ranges.
4. Every module gets an injectable structured logger. Every function that transforms data logs: input summary, output summary, elapsed time. Every branch logs which path was taken and why. No `console.log` anywhere.
5. Search the web for current documentation when you encounter ambiguity. Do not guess from training data.
6. When a dependency's behavior is unclear, write a small test that exercises the ambiguous behavior and log the result. Commit that test.

### Build order rationale

We build hard-to-easy, not easy-to-hard. The hardest modules define the data contracts and type interfaces. Easy modules conform to those contracts. This prevents refactoring when hard modules are integrated later.

### Definition of Done for each requirement

A requirement is complete when:
1. All acceptance criteria have passing tests
2. The test file is named `__tests__/<module>.test.ts`
3. The module has structured logging at DEBUG level for all data transformations
4. The module has a JSDoc header explaining what it does, what it depends on, and what conventions it uses
5. Edge cases from the "Watch Out" section are covered by tests

---

## Monorepo Structure

```
sunscope/
  package.json              # workspaces config
  pnpm-workspace.yaml       # pnpm workspace definition
  turbo.json                # turborepo pipeline config
  tsconfig.base.json        # shared TypeScript config
  docs/CONVENTIONS.md       # coordinate systems, units, reference frames
  docs/ROADMAP.md           # live execution state and priorities

  packages/
    sky-detection/           # BUILT FIRST: hardest module
      package.json
      tsconfig.json
      src/
        types.ts             # SkyMask, ObstructionType, HemisphereMap, ScanFrame
        stitcher.ts
        arc-integrator.ts
        classifier.ts        # interface for DeepLabV3 bridge (impl is native)
      __tests__/

    ar/                      # BUILT SECOND: defines 3D contracts
      package.json
      tsconfig.json
      src/
        types.ts             # ArcPoint3D, ArcSegment, ArcRenderData
        sun-arc-geometry.ts  # converts solar samples to 3D point arrays
        ar-coordinate-convert.ts  # solar position -> ARKit/ViroReact coords
        viro-scene.tsx       # ViroReact AR scene component (stubbed for Zo)
      __tests__/

    core/                    # BUILT THIRD: conforms to contracts from above
      package.json
      tsconfig.json
      src/
        core-types.ts        # SunTimes and core domain value objects
        types.ts             # SunSample, SunPhase, SunTimes, ShadowResult, etc.
        solar-convert.ts     # suncalc south-origin radians -> north-origin degrees
        solar-engine.ts      # wraps suncalc with conversion layer
        sun-day-sampler.ts   # precompute array of samples for a day
        phase-classifier.ts  # classify phase from altitude + time context
        heading-store.ts     # smoothing with wraparound
        shadow-calculator.ts # height/tan(alt), clamping, direction
        location-store.ts    # current/manual/favorites, serializable
        logger.ts            # structured logger with injectable TestLogger
      __tests__/
        fixtures/
          noaa-hendersonville.json  # golden validation data

    ui/                      # BUILT FOURTH: consumes core data
      package.json
      tsconfig.json
      src/
        types.ts
        polar-sun-diagram.tsx    # semicircular sky dome projection
        altitude-chart.tsx       # day curve with phase bands
        sun-map.tsx              # map with directional rays/wedges
        shadow-sheet.tsx         # modal shadow calculator UI
        time-scrubber.tsx        # full-width scrubber with event ticks
        event-cards.tsx          # horizontal scroll of solar events
        debug-screen.tsx         # raw heading, position, log viewer
      __tests__/

  apps/
    mobile/                  # BUILT LAST: wires everything
      app.json
      App.tsx
      src/
        screens/
          NowScreen.tsx
          DayScreen.tsx
          PlaceScreen.tsx
        navigation/
        state/               # Zustand or Context: location, date, mode
        hooks/
          useHeading.ts      # expo-location -> HeadingStore
          useLocation.ts     # expo-location -> LocationStore
          useSunData.ts      # recompute samples on location/date change
```

### Workspace config

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// package.json (root)
{
  "private": true,
  "scripts": {
    "test": "turbo test",
    "test:core": "cd packages/core && pnpm test",
    "test:ar": "cd packages/ar && pnpm test",
    "test:sky": "cd packages/sky-detection && pnpm test",
    "dev": "cd apps/mobile && pnpm start",
    "dev:web": "cd apps/mobile && pnpm start --web"
  }
}
```

Each package depends on siblings via `"workspace:*"`:
```json
// packages/ar/package.json dependencies
{ "@sunscope/core": "workspace:*" }

// packages/ui/package.json dependencies
{ "@sunscope/core": "workspace:*", "@sunscope/ar": "workspace:*" }

// apps/mobile/package.json dependencies
{ "@sunscope/core": "workspace:*", "@sunscope/ui": "workspace:*", "@sunscope/ar": "workspace:*", "@sunscope/sky-detection": "workspace:*" }
```

---

## CONVENTIONS.md (canonical coordinate + angle + time rules)

```markdown
# SunScope Conventions

## Coordinate systems

All angles in this app are in DEGREES, measured CLOCKWISE FROM NORTH (compass convention).
- 0° = North, 90° = East, 180° = South, 270° = West
- This applies everywhere: solar azimuth, heading, shadow direction, map rays, AR coordinates

suncalc.js returns azimuth measured FROM SOUTH, in RADIANS. This is converted exactly once,
in packages/core/src/solar-convert.ts, and nowhere else.

Conversion: compassDeg = ((suncalcRad * 180 / Math.PI) + 180) % 360
            BUT use ((deg % 360) + 360) % 360 for negative safety in JS

## AR coordinate system (ViroReact with gravityAndHeading alignment)

- Y is up
- -Z is north
- +X is east

To place an object at compass azimuth A (degrees, north-origin) and altitude E (degrees):
  x = radius * cos(E_rad) * sin(A_rad)
  y = radius * sin(E_rad)
  z = -radius * cos(E_rad) * cos(A_rad)

## Timestamps

All internal timestamps are UTC. Display conversion to local time happens at the view layer only.
NEVER create a Date without an explicit timezone:
  WRONG:  new Date('2026-06-20T12:00:00')    // parsed as local time
  RIGHT:  new Date('2026-06-20T12:00:00Z')   // explicit UTC

## Sky mask

A SkyMask is a spherical grid indexed by (azimuth_bucket, elevation_bucket).
Each cell is classified as: Sky | Tree | Building | Roof | Unknown
Resolution: 2° azimuth x 2° elevation = 180 x 45 = 8100 cells
```

---

## Phase 1: packages/sky-detection (THE HARDEST THING)

Build this first because it defines the most complex data contracts.

### R-SKY-001: Sky mask data structure

**What**: Define the types and data structure for a spherical sky/obstruction map.

**Acceptance Criteria**:
- [ ] `SkyMask` type: a 2D grid indexed by azimuth bucket (0-179, each = 2°) and elevation bucket (0-44, each = 2° from 0° to 90°)
- [ ] Each cell contains: `{ classification: ObstructionType, confidence: number, lastUpdated: Date | null }`
- [ ] `ObstructionType` enum: `Sky | Tree | Building | Roof | Fence | Unknown`
- [ ] `createEmptySkyMask(): SkyMask` returns a mask with all cells set to `Unknown`, confidence 0
- [ ] `getSkyMaskCell(mask, azimuthDeg, elevationDeg): SkyMaskCell` returns the correct cell for any continuous angle (handles bucketing)
- [ ] `setSkyMaskCell(mask, azimuthDeg, elevationDeg, classification, confidence): SkyMask` returns updated mask (immutable)
- [ ] Azimuth wraps: 361° -> bucket 0, -1° -> bucket 179
- [ ] Elevation clamps: negative -> bucket 0, >90° -> bucket 44
- [ ] All operations logged: cell coordinates, bucket indices, classification

### R-SKY-002: Hemisphere stitcher

**What**: As the user pans their camera, combine classified frames into the sky mask, registered by device orientation.

**Acceptance Criteria**:
- [ ] `ScanFrame` type: `{ timestamp: Date, deviceAzimuth: number, deviceElevation: number, deviceRoll: number, fieldOfViewH: number, fieldOfViewV: number, pixelClassifications: PixelGrid }`
- [ ] `PixelGrid`: 2D array (e.g., 64x64 downsampled from camera resolution) where each cell is an `ObstructionType`
- [ ] `stitchFrame(mask: SkyMask, frame: ScanFrame): SkyMask` projects the frame's pixel grid onto the spherical mask using the device orientation, updates cells
- [ ] Projection math: each pixel at (px, py) maps to a world (azimuth, elevation) based on device orientation + field of view offsets
- [ ] Newer frames overwrite older data in overlapping cells (last-write-wins with confidence weighting)
- [ ] `getMaskCoverage(mask: SkyMask): number` returns fraction of cells that are not Unknown (0.0 to 1.0)
- [ ] Test with synthetic data: a frame pointing due south at 45° elevation with all-Sky pixels should mark the corresponding mask cells as Sky
- [ ] Test with overlapping frames: two frames at the same orientation but different classifications, the newer one wins
- [ ] Logged: frame orientation, coverage before/after, cells updated count

**Watch Out**:
- The pixel-to-world projection is the core algorithm. Each pixel (px, py) in the camera frame maps to a direction offset from the device's pointing direction based on the horizontal and vertical field of view. The math is: `pixelAzimuth = deviceAzimuth + (px / width - 0.5) * fovH` and `pixelElevation = deviceElevation + (0.5 - py / height) * fovV`. This is a simplification (ignores lens distortion) but sufficient for MVP.
- Device roll matters if the phone is tilted. For MVP, assume the phone is held roughly upright and ignore roll. Document this limitation.

### R-SKY-003: Arc integrator (hours of direct sun)

**What**: Given a sky mask and a day of sun samples, compute how many hours the sun is unblocked.

**Acceptance Criteria**:
- [ ] `integrateSunHours(mask: SkyMask, samples: SunSample[]): SunHoursResult`
- [ ] `SunHoursResult`: `{ totalHours: number, segments: ArcSegment[] }`
- [ ] `ArcSegment`: `{ startTime: Date, endTime: Date, blocked: boolean, obstruction: ObstructionType | null }`
- [ ] For each sample where altitude > 0° (sun above horizon), check the mask cell at that (azimuth, elevation). If classification is `Sky`, it's unblocked. If anything else, it's blocked.
- [ ] `totalHours` = sum of unblocked segment durations
- [ ] Test with fully clear mask (all Sky): totalHours should equal daylight duration from suncalc
- [ ] Test with half-blocked mask (everything east of south is Building): totalHours should be roughly half the daylight duration
- [ ] Test with all-Unknown mask: result should flag `maskIncomplete: true` and still compute against Unknown-as-blocked
- [ ] Segments are used to color the AR arc green (unblocked) / red (blocked) / gray (unknown)
- [ ] Logged: total samples checked, blocked count, unblocked count, unknown count, total hours

### R-SKY-004: Sky classifier interface

**What**: Define the interface that the native CoreML bridge will implement. Provide a mock implementation for testing.

**Acceptance Criteria**:
- [ ] `SkyClassifier` interface: `{ classifyFrame(imageData: Uint8Array, width: number, height: number): Promise<PixelGrid> }`
- [ ] `MockSkyClassifier` implementation that returns configurable synthetic data (all-sky, all-building, half-and-half, random)
- [ ] `DeepLabV3Classifier` stub that throws "Not implemented: requires native CoreML bridge" with a clear error message
- [ ] The mock is sufficient for all testing of the stitcher and integrator
- [ ] Logged: classifier type used, frame dimensions, classification distribution (% sky, % building, etc.)

**Watch Out**:
- DeepLabV3 (Cityscapes variant) classifies 19 classes including "sky". The native bridge will need to map these to our ObstructionType enum. Document the mapping: sky->Sky, tree->Tree, building->Building, wall->Fence, everything else->Unknown.
- The native bridge implementation is deferred. It requires CoreML, a custom Expo module (Turbo Module), and cannot be built on Linux. But the interface and all algorithms that consume its output are fully testable now.

---

## Phase 2: packages/ar (SECOND HARDEST)

### R-AR-001: Sun arc geometry

**What**: Convert a day of sun samples into an array of 3D points for AR rendering.

**Acceptance Criteria**:
- [ ] `computeArcPoints(samples: SunSample[], radius?: number): ArcPoint3D[]`
- [ ] Each `ArcPoint3D`: `{ x, y, z, azimuth, altitude, phase, date, blocked?: boolean }`
- [ ] Coordinate system: Y up, -Z north, +X east (matches ViroReact gravityAndHeading)
- [ ] Only includes points where altitude > -5° (don't render underground)
- [ ] Default radius: 50 (meters in AR space)
- [ ] Test: solar noon in Hendersonville on June 20: y > 0, z < 0 (south), x near 0 (near due south)
- [ ] Test: sunrise: x > 0 (east)
- [ ] Test: sunset: x < 0 (west)
- [ ] Can accept optional `SunHoursResult` to set `blocked` flag per point (for green/red coloring)
- [ ] Logged: input sample count, output point count, filtered count, coordinate extremes

**Watch Out**:
- This is where the suncalc south-origin azimuth bug will manifest. The conversion from R-CORE-001 MUST be applied before these coordinates are computed. Write a test that specifically verifies the sunrise point has positive x (east), which will fail if the azimuth is 180° off.
- cos and sin take radians. Inputs are in degrees (app convention). Convert at the boundary.

### R-AR-002: AR coordinate conversion utilities

**What**: Utility functions for converting between solar coordinates and ViroReact world coordinates.

**Acceptance Criteria**:
- [ ] `solarToWorld(azimuthDeg, altitudeDeg, radius): {x, y, z}`
- [ ] `worldToSolar(x, y, z): {azimuthDeg, altitudeDeg}`
- [ ] Round-trip test: solarToWorld then worldToSolar returns original angles within ±0.01°
- [ ] Boundary tests: altitude 0° (horizon) -> y ≈ 0; altitude 90° (zenith) -> y ≈ radius; azimuth 0° (north) -> z ≈ -radius, x ≈ 0

### R-AR-003: ViroReact scene component (typed stub)

**What**: A typed React component definition for the AR sun path overlay. Implementation requires a device; types and props are defined now.

**Acceptance Criteria**:
- [ ] `SunArcARScene` component accepts props: `{ arcPoints: ArcPoint3D[], currentSunIndex: number, showPhaseColors: boolean, showBlockedSegments: boolean }`
- [ ] Component file imports from `@reactvision/react-viro` with type annotations
- [ ] A `__mocks__/@reactvision/react-viro.ts` file provides Jest-compatible mocks for all ViroReact components used
- [ ] The component renders without crashing in a Jest environment using the mocks
- [ ] A `TODO.md` in this package documents: ViroReact Expo SDK compatibility must be verified before device testing; ViroPolyline width/color capabilities need investigation; gravityAndHeading world alignment needs confirmation

**Watch Out**:
- ViroReact requires a dev client build, not Expo Go. The app architecture must lazy-load this component so non-AR screens work in Expo Go.
- As of our last check, ViroReact 2.43.4 supports Expo 53 / RN 0.79.5. Current Expo SDK is 55 / RN 0.83. This compatibility gap MUST be verified before any device testing. Check the ViroReact GitHub releases and their Discord.

---

## Phase 3: packages/core (EASY, CONFORMS TO CONTRACTS ABOVE)

### R-CORE-001: Azimuth/altitude conversion layer

**What**: `solar-convert.ts` wraps suncalc output to app conventions. This is the ONLY file that touches suncalc's raw output.

**Acceptance Criteria**:
- [ ] `suncalcToCompass(azimuthRad: number): number` converts south-origin radians to north-origin degrees
  - 0 (south in suncalc) -> 180
  - Math.PI/2 (west in suncalc) -> 270
  - -Math.PI/2 (east in suncalc) -> 90
  - Math.PI (north in suncalc) -> 0 or 360
  - Output always in [0, 360)
- [ ] `radToDeg(rad)` and `degToRad(deg)` are named functions, not inline
- [ ] Uses `((deg % 360) + 360) % 360` for negative safety (JS modulo is broken for negatives)
- [ ] At least 8 test cases including negative inputs and boundaries
- [ ] All conversions logged

### R-CORE-002: Solar engine

**What**: `solar-engine.ts` wraps suncalc with the conversion layer.

**Acceptance Criteria**:
- [ ] `getSunPosition(lat, lon, date): { azimuth: number, altitude: number }` returns degrees, north-origin
- [ ] `getSunTimes(lat, lon, date): SunTimes` returns all event times as UTC Dates
- [ ] Validated against NOAA for Hendersonville (36.3048, -86.5974) on equinoxes, solstices, and today
- [ ] NOAA golden data fetched from the web, not fabricated
- [ ] Tolerances: ±90 seconds for events, ±0.5° for positions
- [ ] Every suncalc call logged: input, raw output, converted output

### R-CORE-003: Day sample precomputation

**What**: `sun-day-sampler.ts` generates samples across a full day.

**Acceptance Criteria**:
- [ ] 288 samples per day at default 5-min interval
- [ ] Each sample: `{ date, azimuth, altitude, phase }` using types from `@sunscope/core`
- [ ] Phase classification correct (including blue hour, which suncalc does NOT provide; compute from altitude -6° to -4° near sunrise/sunset)
- [ ] Computation < 200ms, measured and logged
- [ ] Output conforms to `SunSample` type expected by `@sunscope/ar` and `@sunscope/sky-detection`

### R-CORE-004: Heading smoothing

**Acceptance Criteria**:
- [ ] Shortest-angular-distance interpolation (350° -> 10° goes forward 20°, not backward 340°)
- [ ] headingAccuracy negative -> flagged unreliable
- [ ] Synthetic jitter test: ±5° noise around 90°, after 10 samples within ±2°
- [ ] 6+ wraparound test cases covering all quadrant transitions

### R-CORE-005: Shadow calculator

**Acceptance Criteria**:
- [ ] `height / tan(altitudeInRadians)` with degree-to-radian conversion (NOT tan of degrees)
- [ ] Direction = `(azimuth + 180) % 360`
- [ ] Clamp at altitude < 1° (max 100m, `clamped: true`)
- [ ] altitude <= 0 returns Infinity length
- [ ] Known value tests: 45°/1m -> 1m, 30°/2m -> 3.46m, 60°/10m -> 5.77m

### R-CORE-006: Location store

**Acceptance Criteria**:
- [ ] Pure TypeScript, no React Native imports, serializable to JSON
- [ ] Default location: Hendersonville (36.3048, -86.5974)
- [ ] Validates lat [-90,90], lon [-180,180]

### R-CORE-007: Phase classifier

**Acceptance Criteria**:
- [ ] Blue hour: altitude -6° to -4° AND within 45 min of sunrise/sunset (NOT in suncalc)
- [ ] Golden hour: uses suncalc's goldenHour/goldenHourEnd times
- [ ] Logs: altitude, phase determined, which threshold triggered

### R-CORE-008: Timezone handling

**Acceptance Criteria**:
- [ ] All test assertions compare UTC values only
- [ ] Hendersonville returns "America/Chicago"
- [ ] `new Date('...')` NEVER used without Z suffix in any test or source file (grep for this)

### R-CORE-009: NOAA validation suite

**Acceptance Criteria**:
- [ ] Golden data for 5 dates, fetched from web, not fabricated
- [ ] ±90 seconds for events, ±0.5° for positions
- [ ] Summary log: "X/Y NOAA validations passed"

### R-CORE-010: Structured logger

**Acceptance Criteria**:
- [ ] Levels: DEBUG, INFO, WARN, ERROR
- [ ] Injectable: modules receive logger instance, tests use TestLogger that captures entries in array
- [ ] Each entry: timestamp ISO UTC, module name, level, message, data payload as JSON
- [ ] Assertion pattern: `expect(testLogger.entries).toContainEqual(expect.objectContaining({...}))`

---

## Phase 4: packages/ui (CONSUMES CORE, PREVIEWS ON EXPO WEB)

### R-UI-001: Polar sun path diagram

**What**: Semicircular sky dome flattened to 2D, matching the Sunlitt/Sun Seeker visual pattern. NOT a simple compass with a dot.

**Acceptance Criteria**:
- [ ] Renders a semicircular diagram using react-native-svg
- [ ] The full day arc is drawn as a continuous curve showing altitude as radial distance from center
- [ ] Arc segments are colored by phase (gold for golden hour, blue for twilight, yellow for daylight, dark for night)
- [ ] Current sun position is highlighted with a larger marker on the arc
- [ ] Hour tick marks along the arc at 1-hour intervals
- [ ] Cardinal direction labels (N, E, S, W) around the rim
- [ ] Accepts `SunSample[]` and `currentTime` as props
- [ ] Renders without crashing in Jest with mock data
- [ ] Previews correctly in Expo web (`npx expo start --web`)

**Watch Out**:
- This is the most visually complex UI component. Reference Sunlitt's screenshots: the arc is drawn on a dark background with the center representing the zenith and the outer edge representing the horizon. Altitude maps to radial distance (higher altitude = closer to center). Azimuth maps to angle around the semicircle.

### R-UI-002: Day altitude chart

**Acceptance Criteria**:
- [ ] Line chart: altitude (y-axis, -20° to 90°) vs time (x-axis, midnight to midnight)
- [ ] Prominent 0° horizon line
- [ ] Background bands colored by phase
- [ ] Accepts `SunSample[]` as props
- [ ] Renders in Expo web

### R-UI-003: Map with directional rays

**Acceptance Criteria**:
- [ ] Draggable pin on map
- [ ] Three rays from pin: sunrise, solar noon, sunset azimuths for selected date
- [ ] Optional: seasonal wedge sectors showing solstice-to-solstice azimuth range
- [ ] Renders in Expo web (MapView has web support)

### R-UI-004: Shadow calculator sheet

**Acceptance Criteria**:
- [ ] Height input with unit toggle (feet/meters)
- [ ] Shadow length, direction, and "best time for shortest shadow" outputs
- [ ] Clamp message when shadow exceeds view
- [ ] Accepts `ShadowResult` from core

### R-UI-005: Time scrubber

**Acceptance Criteria**:
- [ ] Full-width slider with tick marks at sunrise, solar noon, sunset
- [ ] Displays current scrubbed time
- [ ] Calls onChange callback with selected Date

### R-UI-006: Debug screen

**Acceptance Criteria**:
- [ ] Shows raw heading, smoothed heading, lat/lon, accuracy
- [ ] Shows raw suncalc azimuth (south-origin radians) and converted azimuth (north-origin degrees)
- [ ] Shows last 20 log entries from TestLogger/live logger
- [ ] Accessible via hidden gesture (e.g., triple-tap on version number)

---

## Phase 5: apps/mobile (WIRES EVERYTHING)

### R-APP-001: Expo project configuration

- [ ] app.json: name "SunScope", slug "sunscope", bundleId "xyz.moosegoose.sunscope"
- [ ] NSLocationWhenInUseUsageDescription configured
- [ ] ViroReact NOT imported at top level; lazy-loaded behind a feature flag or dynamic import
- [ ] `npx expo start --web` launches successfully and shows tab navigation

### R-APP-002: Navigation and state

- [ ] Bottom tab navigation: Now, Day, Place
- [ ] Shadow sheet presented modally from Day or Now screen
- [ ] Zustand or Context store holds: currentLocation, selectedDate, liveVsScrubbed mode
- [ ] Date change or location change triggers recomputation of day samples via useSunData hook
- [ ] All screens receive computed data via hooks, not direct imports of core functions

### R-APP-003: Sensor wiring (device only)

- [ ] expo-location watchHeadingAsync -> HeadingStore
- [ ] expo-location getCurrentPositionAsync -> LocationStore
- [ ] When heading or location unavailable, graceful degradation with logged warnings
- [ ] TESTING.md documents what works in Expo Go vs what needs a dev client vs what needs the physical device

---

## UI Generation with Google Stitch MCP

### Prerequisites (human does this before agent runs)

1. Get a Stitch API key from stitch.withgoogle.com (Settings > API Keys > Create Key)
2. Configure the MCP server in your agent's client:
```json
{
  "mcpServers": {
    "stitch": {
      "type": "http",
      "url": "https://stitch.googleapis.com/mcp",
      "headers": { "X-Goog-Api-Key": "YOUR-API-KEY" }
    }
  }
}
```
3. Verify: call `list_projects` and confirm it returns without error

If Stitch MCP is unavailable, the agent should: generate the prompt text for each screen, save to `design-reference/prompts/`, and note in `docs/ROADMAP.md` that manual generation at stitch.withgoogle.com is needed.

### Stitch workflow

1. Call `create_project` with name "SunScope"
2. Call `generate_screen_from_text` for Day Screen (the hero screen) with detailed description including: altitude chart with horizon line and phase bands, time scrubber, event cards, color palette (deep navy #0A1628, warm gold #F4A623, cool blue #4A90D9)
3. Call `extract_design_context` on the Day Screen to get Design DNA (colors, typography, spacing, component patterns)
4. Call `generate_screen_from_text` for Now Screen, Place Screen, Shadow Sheet, each including the extracted design context for visual consistency
5. Call `fetch_screen_code` for each screen, save to `design-reference/<screen-name>.html`
6. Convert each HTML to React Native components in `packages/ui`, using the HTML as visual reference, NOT as literal code

The Stitch-generated HTML is a visual reference, not source code. The React Native components must use proper RN primitives (View, Text, ScrollView), react-native-svg for the compass, and accept typed props from `@sunscope/core`.

---

## Critical Gotchas (paste these into your working memory)

| # | Gotcha | Consequence of ignoring |
|---|--------|------------------------|
| 1 | suncalc azimuth is FROM SOUTH, in RADIANS | Sun renders 180° opposite of reality |
| 2 | JS modulo is broken for negatives: (-90) % 360 === -90 | Angles go negative, break all lookups |
| 3 | new Date('2026-06-20T12:00:00') without Z = local time | All times off by 5-6 hours on UTC machines |
| 4 | Math.tan takes radians, altitude is in degrees | Shadow calculator produces garbage |
| 5 | ViroReact requires dev client, not Expo Go | App crashes on import if not lazy-loaded |
| 6 | ViroReact Expo SDK 55 compatibility unverified | Build may fail; check before device testing |
| 7 | suncalc has no blue hour | Missing phase classification if not custom-built |
| 8 | expo-location trueHeading requires location permission | Falls back to magHeading (off by ~5° in TN) |
| 9 | EAS Build free tier has monthly limits | Don't waste builds; test locally first |
| 10 | Shadow length at < 1° altitude = 100m+ | UI shows absurd numbers without clamping |

---

## Logging Requirements (non-negotiable)

Every module, no exceptions:
- DEBUG: function entry with key params, intermediate decisions, function exit with key results
- INFO: state changes (location changed, date changed, mode toggled)
- WARN: degraded conditions (heading accuracy poor, location denied, shadow clamped, mask incomplete)
- ERROR: unexpected failures (suncalc returns NaN, invalid coordinates, classifier throws)

The logger is injectable. Tests capture entries via TestLogger. Assert that specific log messages were produced. A module that passes tests but produces no log output is NOT done.

---

## ROADMAP.md working template

After completing each requirement, update:

```markdown
# SunScope Progress

## Last updated: [date]

## Completed
- R-SKY-001: Sky mask data structure (X tests passing)
- ...

## In Progress
- R-SKY-002: Hemisphere stitcher (3/5 criteria passing, blocked on projection math edge case)

## Blocked
- R-AR-003: ViroReact scene stub (need to verify Expo SDK 55 compatibility)

## Next
- R-CORE-001: Azimuth conversion layer

## Open Questions
- Does ViroReact ViroPolyline support per-vertex coloring?
- What is the iPhone camera FOV in degrees? (needed for hemisphere stitcher)
```

---

## Success Criteria

### Phase 1 (sky-detection): all R-SKY tests green
### Phase 2 (ar): all R-AR tests green
### Phase 3 (core): all R-CORE tests green, NOAA validation passes
### Phase 4 (ui): all screens render in Jest, preview in Expo web
### Phase 5 (mobile): `npx expo start --web` shows working app with tab navigation, chart renders, date scrubbing works

### Final gate
```
pnpm test (from root)
All packages: tests passing, 0 failures
Coverage > 80% on packages/core and packages/sky-detection
`docs/ROADMAP.md` is current
design-reference/ contains Stitch HTML for all screens
```

---

## What You Must NOT Do

- Do not skip tests to move faster. The tests ARE the product.
- Do not use `any` types. If you can't type it, you don't understand it.
- Do not use `console.log`. Use the structured logger.
- Do not fabricate NOAA reference data. Fetch it from the web.
- Do not import ViroReact at the top level of apps/mobile. Lazy-load it.
- Do not install ViroReact into packages/ar's runtime dependencies until Expo SDK compatibility is verified. Use it as a devDependency for types and mocks only.
- Do not hardcode Hendersonville coordinates anywhere except LocationStore default and test fixtures.
- Do not put suncalc conversion logic anywhere except packages/core/src/solar-convert.ts.
- Do not create Date objects without explicit timezone (Z suffix or date-fns-tz).
