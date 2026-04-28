# SunScope Testing Standards

Tests are the execution proof of the project, not a secondary cleanup step.

## Test Philosophy

- Every requirement needs acceptance coverage.
- Edge cases from requirement watch-outs need explicit tests.
- Behavior and logging are both part of correctness.
- Ambiguous dependency behavior should be resolved with a test rather than assumption.

## Definition Of Done

A requirement is complete when:

1. All acceptance criteria pass.
2. The relevant tests exist under `__tests__/`.
3. Logging behavior is present and asserted where appropriate.
4. Edge cases called out in the requirement are covered.
5. The result still respects `docs/CONVENTIONS.md`.

## Naming And Structure

- Test files should use the `__tests__/<module>.test.ts` pattern.
- Package tests should exercise the package boundary, not only trivial helper internals.
- Tests for conversion or geometry should include boundary values, wraparound behavior, and representative real-world cases.

## Verification Blueprint

When implementing or reviewing work, use this path:

1. Read `docs/NORTH_STAR.md` and `docs/CONVENTIONS.md`.
2. Read the relevant requirement in `docs/plans/MASTER_PLAN.md`.
3. Confirm or add tests for the requirement and its watch-outs.
4. Confirm logger behavior and assertions for transformation-heavy code.
5. Run the smallest relevant package-level test command first.
6. Use broader workspace commands only when needed for integration confidence.

## Validation Sequence

Use the narrowest sequence that proves the change, then expand only as needed:

1. unit or module test
2. package test run
3. package typecheck or build
4. workspace typecheck or build when integration risk exists
5. runtime or device validation when the feature depends on Expo, sensors, or AR behavior

## Required Coverage Themes

- solar conversion must prove north-origin correctness
- time handling must prove UTC correctness
- sky-detection must prove bucketing, projection, overwrite rules, and coverage/integration behavior
- AR math must prove coordinate orientation and round-trip correctness
- UI work should prove render safety and typed data consumption
- mobile integration should prove non-AR routes remain safe when AR is gated

## High-Risk Validations

- NOAA validation is part of the quality bar for solar accuracy claims.
- Expo and Viro compatibility must be treated as a runtime validation task, not assumed from types alone.
- Field-of-view assumptions in sky stitching remain simplifications until explicitly validated.

## Explicit Gates

- NOAA-related work should respect the planned tolerances from the master plan.
- Workspace-level completion claims should not be made without all relevant package tests passing.
- Coverage goals remain part of the final production gate for core mathematical packages.

## Mobile And AR Validation

- Non-AR routes should remain safe even when AR runtime support is unavailable.
- AR functionality requires device-aware validation beyond Jest and pure TypeScript checks.
- Expo Go, dev client, and physical-device expectations should be documented as they are verified.

## Working Commands

```bash
pnpm -r test
pnpm -r build
pnpm -r typecheck
```

## Read With

- `docs/LOGGING.md`
- `docs/ROADMAP.md`
- `docs/plans/MASTER_PLAN.md`
