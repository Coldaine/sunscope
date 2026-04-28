# SunScope Logging Standards

Structured logging is part of the product contract.

A module is not done if it passes tests but does not produce the required log output.

## Logger Contract

- Logging must be injectable.
- Production code may use a console-backed logger implementation, but modules should depend on the logger interface rather than global console calls.
- Tests should be able to substitute a capture logger such as `TestLogger`.
- `console.log` is not part of the allowed product contract.
- Transformation-heavy paths should log the full execution path: input summary, branch decision, output summary, and any degraded or exceptional conditions.

## Required Levels

- `DEBUG`: function entry, key inputs, branch decisions, intermediate transformations, and function exit summaries
- `INFO`: important state changes such as location change, date change, mode toggle, or successful workflow transitions
- `WARN`: degraded behavior such as poor heading accuracy, denied permissions, incomplete sky mask coverage, or clamped shadow results
- `ERROR`: unexpected failures such as invalid coordinates, classifier failures, NaN outputs, or external dependency failures

## Entry Shape

Each log entry should include:

- timestamp as ISO UTC
- module name
- level
- message
- structured data payload

## Assertions

Tests should assert meaningful log behavior, not just return values.

Expected assertion style:

```ts
expect(testLogger.entries).toContainEqual(
  expect.objectContaining({
    level: 'DEBUG',
    module: 'solar-engine',
  })
);
```

## Where Logging Matters Most

- angle conversion and solar position transformation
- sky-mask lookup, update, and projection behavior
- sun-hours integration summaries
- AR coordinate conversion and filtering
- phase classification and threshold decisions
- shadow calculation, especially clamps and invalid altitude behavior

## Done Criteria

- A module is not complete if the behavior is correct but the log surface is missing.
- Logging is part of the public execution contract for review, debugging, and validation.

## Read With

- `docs/CONVENTIONS.md`
- `docs/TESTING.md`
- `docs/plans/MASTER_PLAN.md`
