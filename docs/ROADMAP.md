# SunScope Roadmap

This is the live execution document for the project. It tracks what is complete, what is in flight, and what remains before the product matches the North Star.

## Current State

### Complete

- Monorepo scaffold and shared TypeScript workspace infrastructure
- Core logging infrastructure
- `R-CORE-001` through `R-CORE-007`
- `R-CORE-010`
- `R-SKY-001` through `R-SKY-003`
- `R-AR-001` through `R-AR-003`

### In Progress

- `R-SKY-004` mock behavior and richer synthetic classification patterns
- AR package public export cleanup
- mobile integration of `core`, `sky-detection`, and `ar`

### Not Started

- `R-CORE-008` timezone utility and enforcement pass
- `R-CORE-009` NOAA validation suite
- `R-UI-001` through `R-UI-006`
- full mobile navigation, screens, hooks, and data flow

## Blocked Or Deferred

- AR runtime confidence remains partially blocked on confirmed Expo and Viro compatibility.
- Any claim of production-ready solar accuracy remains deferred until NOAA validation is complete.

## Definition Of Done Summary

Use this roadmap as live status, but do not treat a requirement as complete unless:

- acceptance criteria pass
- test coverage exists for the relevant behavior and watch-outs
- logging behavior matches the project contract
- the result still obeys `docs/CONVENTIONS.md`

## Delivery Priorities

1. Clean up `packages/ar` exports so downstream integration is stable.
2. Finish the remaining `R-SKY-004` behavior expected by the spec.
3. Build the mobile app flow around Now, Day, and Place.
4. Implement the reusable UI planning surfaces.
5. Close timezone and NOAA validation gaps before claiming production readiness.

## Dependency Status

| Area | Status | Notes |
|---|---|---|
| `core` | Mostly complete | Missing timezone and NOAA hardening |
| `sky-detection` | Mostly complete | Mock classifier still narrower than spec |
| `ar` | Mostly complete | Geometry exists; exports and app integration lag |
| `ui` | Scaffolded | Visual components not built |
| `mobile` | Scaffolded | App shell exists; flow and hooks are missing |

## Open Risks

- ViroReact and current Expo SDK compatibility still need explicit confirmation before device-heavy AR work.
- Runtime phone field-of-view assumptions remain simplified.
- NOAA fixture acquisition and validation strategy are still open work rather than closed proof.

## Known Implementation Notes

- The AR layer still needs export cleanup before downstream integration is stable.
- The sky-classifier mock work is functionally present but still narrower than the target requirement set.
- The mobile app remains mostly orchestration work that has not yet been built.

## Working Commands

```bash
pnpm install
pnpm -r test
pnpm -r build
pnpm -r typecheck
```

## Read With

- `docs/NORTH_STAR.md` for project intent and invariants
- `docs/ARCHITECTURE.md` for package boundaries and current system shape
- `docs/CONVENTIONS.md` for fixed implementation rules
- `docs/LOGGING.md` for logger expectations
- `docs/TESTING.md` for verification and completion gates
- `docs/plans/MASTER_PLAN.md` for detailed requirement criteria
- `docs/plans/MASTER_PLAN_DONE.md` for completed requirement grouping
- `docs/plans/MASTER_PLAN_REMAINING.md` for unfinished requirement grouping
