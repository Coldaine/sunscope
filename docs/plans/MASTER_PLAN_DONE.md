# SunScope Master Plan Done

This document groups the requirement areas that are currently treated as completed or materially implemented.

It is a status-oriented companion to `docs/plans/MASTER_PLAN.md`, not a replacement for the full spec.

## Completed Requirement Groups

### Monorepo and foundations

- Monorepo scaffold and shared TypeScript workspace infrastructure are in place.
- Core logging infrastructure exists.

### Core

- `R-CORE-001` Azimuth and angle conversion layer
- `R-CORE-002` Solar engine wrapper
- `R-CORE-003` Day sample precomputation
- `R-CORE-004` Heading smoothing
- `R-CORE-005` Shadow calculator
- `R-CORE-006` Location store
- `R-CORE-007` Phase classifier
- `R-CORE-010` Structured logger

### Sky detection

- `R-SKY-001` Sky mask data structure
- `R-SKY-002` Hemisphere stitcher
- `R-SKY-003` Arc integrator

### AR

- `R-AR-001` Sun arc geometry
- `R-AR-002` AR coordinate conversion utilities
- `R-AR-003` Typed Viro scene component and mocks

## Important Caveat

Completed here means the project currently treats these requirement groups as implemented enough to be out of the primary backlog.

This file does not overrule:

- `docs/ROADMAP.md` for current risks and in-progress cleanup
- `docs/TESTING.md` for completion gates
- `docs/plans/MASTER_PLAN.md` for the full acceptance criteria

## Review With

- `docs/ROADMAP.md`
- `docs/LOGGING.md`
- `docs/TESTING.md`
- `docs/plans/MASTER_PLAN.md`
