# Slate Master Spec: Build the Sun Tracker MVP

Use this file as the top-level instruction for the session.

## What to do

Build the sun tracker MVP in this repo to a real, tested, handoff-ready state.

Read these files first:

1. `AGENTS.md`
2. `SLATE_EXECUTION_BRIEF.md`
3. `TARGETS_ACCEPTANCE_TESTING.md`

Then execute the work all the way through research, planning, implementation, testing, cleanup, and documentation.

## Working rules

- Research current dependencies and APIs before locking choices.
- Do not hardcode dependency versions in the planning docs.
- Prefer native Apple frameworks where sufficient.
- Use third-party packages only when they clearly improve the MVP.
- Maintain `docs/execution-log.md` during the run.
- Create or update the required repo docs described in the other files.
- Keep moving until the acceptance criteria are met or a real blocker is proven.

## Required result

By the end of the session, the repo should contain:

- a working SwiftUI-first iPhone sun tracking MVP
- tests
- logging and diagnostics
- a README
- dependency rationale
- architecture notes
- test report
- execution log

## Finish condition

The task is done only when the app is usable, tested, documented, and understandable by another engineer.

