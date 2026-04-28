# SunScope Master Plan Remaining

This document groups the requirement areas that still remain open, in progress, blocked, or not yet started.

It is a status-oriented companion to `docs/plans/MASTER_PLAN.md`, not a replacement for the full spec.

## In Progress

### Sky detection

- `R-SKY-004` Sky classifier interface hardening
  - richer mock patterns still need to match the full spec intent
  - logging and distribution behavior still need to fully align with the requirement surface

### AR and integration cleanup

- AR public export cleanup remains open before downstream usage is stable.
- Mobile integration of `core`, `sky-detection`, and `ar` remains open.

## Remaining Core Work

- `R-CORE-008` Timezone handling
- `R-CORE-009` NOAA validation suite

## Remaining UI Work

- `R-UI-001` Polar sun path diagram
- `R-UI-002` Day altitude chart
- `R-UI-003` Map with directional rays
- `R-UI-004` Shadow calculator sheet
- `R-UI-005` Time scrubber
- `R-UI-006` Debug screen

## Remaining App Work

- `R-APP-001` Expo project configuration hardening
- `R-APP-002` Navigation and app state
- `R-APP-003` Sensor wiring and device-specific validation

## Deferred Or Blocked Risks

- AR runtime confidence depends on current Expo and Viro compatibility validation.
- Production-level solar accuracy claims remain blocked on NOAA validation completion.
- Some sky-stitching assumptions remain simplified until field-of-view behavior is validated more directly.

## Review With

- `docs/ROADMAP.md`
- `docs/TESTING.md`
- `docs/plans/MASTER_PLAN.md`
