# SunScope Architecture

This document describes the current shape of the system and the package boundaries that support the North Star.

## Repository Shape

```text
sunscope/
  docs/
    README.md
    NORTH_STAR.md
    ARCHITECTURE.md
    ROADMAP.md
    CONVENTIONS.md
    LOGGING.md
    TESTING.md
    plans/
      MASTER_PLAN.md
      MASTER_PLAN_DONE.md
      MASTER_PLAN_REMAINING.md
  packages/
    core/
    sky-detection/
    ar/
    ui/
  apps/
    mobile/
```

## Package Responsibilities

### `packages/core`

Owns the canonical solar and domain primitives:
- angle conversion from `suncalc`
- solar position and sun-times wrappers
- day sampling
- phase classification
- heading smoothing
- shadow calculation
- location storage and validation
- structured logging

Current state:
- materially implemented
- remaining gaps are timezone hardening and NOAA validation coverage

### `packages/sky-detection`

Owns obstruction-aware daylight modeling:
- sky mask data structure
- hemisphere stitching
- obstruction classification interface
- sun-hours integration

Current state:
- core behavior implemented
- mock-classifier behavior is narrower than the full requirement set

### `packages/ar`

Owns geometric transformation for AR rendering:
- solar-to-world conversion
- arc point generation
- typed AR scene component

Current state:
- core geometry implemented
- public exports and downstream app wiring still need cleanup
- runtime compatibility remains a project risk until Expo and Viro behavior are verified together

### `packages/ui`

Owns reusable planning and visualization components:
- polar sun diagram
- altitude chart
- map rays
- shadow UI
- scrubber
- debug surfaces

Current state:
- scaffolded
- production components not implemented yet

### `apps/mobile`

Owns app composition and device integration:
- navigation
- hooks and app state
- location and heading wiring
- screen-level feature assembly
- lazy loading around AR runtime boundaries

Current state:
- placeholder shell only

## System Boundaries

- `core` should not know about React Native runtime concerns.
- `sky-detection` consumes core domain types but should stay testable without device dependencies.
- `ar` should stay mostly pure math plus typed scene composition.
- `ui` should consume typed data from packages, not re-implement core logic.
- `apps/mobile` should wire packages together instead of becoming the home for business logic.

## Current Integration Gaps

- `packages/ar/src/index.ts` still needs export cleanup.
- `packages/ui` does not yet expose the intended reusable planning components.
- `apps/mobile` does not yet host the Now / Day / Place flow or shared state model.
- AR compatibility is still a validation risk for the target Expo stack.

## Operational Notes

- The repo already has working monorepo infrastructure.
- The hardest logic lives below the app layer, which is the correct shape for long-term reuse.
- The main architectural problem now is not package design. It is incomplete integration above otherwise-useful lower layers.

## Quality Gates

- Logging expectations are part of the architecture because the core packages are transformation-heavy and need observable behavior.
- Testing expectations are part of the architecture because package boundaries are only useful if they can be validated independently.
- See `docs/LOGGING.md` and `docs/TESTING.md` for the execution-quality contract that sits on top of these package boundaries.

## Runtime Note Custody

- Durable project rules belong in `docs/`.
- Package-local runtime notes may live next to the package when they are specific to that package alone, for example `packages/ar/TODO.md`.
- If a package-local note becomes part of cross-project policy or affects planning across packages, it should be promoted into `docs/`.
