# SunScope North Star

This document is the constitutional source for what SunScope is, what it must optimize for, and what must not drift.

It is not a status report. It does not track completion. It defines intent, invariants, and the durable shape of the project.

## Vision

SunScope is an iOS-first sun tracking and sunlight planning app. It should let a user answer practical questions about direct sun, shade, obstruction, and solar position with enough geometric trust that the result can inform real-world decisions.

The product is not just a solar calculator. It combines:
- trustworthy solar geometry
- obstruction-aware daylight estimation
- map and chart views for planning
- AR visualization for on-site validation

## Product Goals

- Make solar position trustworthy. The app should produce north-origin, degree-based outputs that match reality closely enough for planning and validation.
- Make obstruction matter. Users should be able to estimate direct-sun availability against a sky mask rather than treating the horizon as always clear.
- Support both desk planning and field validation. Maps, charts, and summaries should work before a site visit; AR should validate and visualize on device.
- Keep the hard logic reusable. Core solar math, obstruction integration, and AR geometry should live in packages with stable interfaces so the mobile app remains mostly orchestration and presentation.

## Non-Negotiables

- All app-facing angles use degrees clockwise from north.
- `suncalc` south-origin radians are converted exactly once in `packages/core/src/solar-convert.ts`.
- Internal timestamps are UTC. Local-time rendering belongs at the view layer.
- Structured logging is part of the product contract, not an implementation detail.
- A requirement is not done unless behavior and logging are both correct.
- The native sky classifier remains behind an interface until the CoreML bridge exists.
- AR code must not be imported at the top level of the mobile app. It must remain lazy-loadable behind compatibility boundaries.

## Architectural Decisions

- `packages/core` owns solar conversion, solar engine behavior, sampling, phase logic, shadow math, and location primitives.
- `packages/sky-detection` owns the obstruction model, hemisphere stitching, and sun-hours integration.
- `packages/ar` owns solar-to-world conversion and AR render geometry.
- `packages/ui` owns reusable visual components and planning surfaces.
- `apps/mobile` owns navigation, hooks, state wiring, device integration, and feature presentation.

## Documentation Hierarchy

The documentation stack should derive from this file:

- `docs/NORTH_STAR.md`: constitutional intent and invariants
- `docs/ARCHITECTURE.md`: how the system is shaped today
- `docs/ROADMAP.md`: live execution state, priorities, and open risks
- `docs/CONVENTIONS.md`: fixed technical rules that code must obey
- `docs/LOGGING.md`: required logger contract and assertion expectations
- `docs/TESTING.md`: quality gates and verification blueprint
- `docs/plans/MASTER_PLAN.md`: detailed requirement and acceptance-criteria spec

Any temporary summary, status memo, or planning note should support this stack rather than compete with it.

## What SunScope Must Avoid

- Competing sources of truth about what the project is for
- Silent convention drift around azimuth origin, angle units, or time handling
- UI-first implementation that bypasses the reusable package boundaries
- AR integration that breaks non-AR flows or assumes unsupported runtime environments
- Fake completion reporting that overstates what is scaffolded versus what is production-ready
