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

## Engineering guardrails

- Pin dependencies exactly when adding new packages.
- Do not use `console.log`; use the structured logger contract.
- Do not import ViroReact at the top level of `apps/mobile`.
- Do not duplicate `suncalc` conversion logic outside `packages/core/src/solar-convert.ts`.
- Do not create naive `Date` values without explicit timezone handling.
- Treat AR compatibility as runtime-validated, not assumed from types alone.

## Sky mask

A SkyMask is a spherical grid indexed by (azimuth_bucket, elevation_bucket).
Each cell is classified as: Sky | Tree | Building | Roof | Fence | Unknown
Resolution: 2° azimuth x 2° elevation = 180 x 45 = 8100 cells
