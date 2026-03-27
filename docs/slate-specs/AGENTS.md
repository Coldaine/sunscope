# AGENTS.md

## Purpose of this workspace

Build a SwiftUI-first iPhone sun tracking MVP that feels real, not like a demo prop wearing a fake mustache.

The product should help a user answer four practical questions quickly:

1. Where is the sun right now?
2. Where will it be later today?
3. How does the answer change if I move to a different location?
4. How long and in what direction will a simple shadow fall?

This workspace is also a deliberate test of Slate as an autonomous multi-step builder. You are expected to research, plan, implement, test, verify, document, and leave the repo handoff-ready.

## How to work in this repo

1. Research current frameworks and libraries before committing to dependencies.
2. Write or refine a concrete plan before large edits.
3. Implement the MVP in small, verifiable steps.
4. Run tests continuously, not just at the end.
5. Maintain an execution log as you work.
6. Stop only when the acceptance criteria are met or when you hit a real blocker that you can prove.

Do not stop after producing a plan. Continue through implementation, testing, cleanup, and handoff.

## Primary references in this workspace

Read these first and keep them in view:

- `SLATE_EXECUTION_BRIEF.md`
- `TARGETS_ACCEPTANCE_TESTING.md`

If these files conflict, prefer the more specific instruction.

## Product constraints

### MVP scope

Must include:

- Live sun direction / status experience
- Day timeline with time scrubbing
- Manual and current-location workflows
- Event times such as sunrise / solar noon / sunset
- Simple shadow estimate from object height
- Offline-first calculations for the core solar logic
- Clear permission handling
- Diagnostics and logging appropriate for development and QA

Must not be treated as MVP:

- AR sky overlay
- Terrain-aware occlusion or building-aware shading
- Moon tracking
- Widgets or Live Activities
- Network-dependent core functionality

### Dependency policy

- Never pin or hardcode dependency versions in planning docs.
- Research current, maintained libraries before implementation.
- Prefer native Apple frameworks when they are sufficient.
- Introduce third-party dependencies only when they clearly reduce complexity or meaningfully improve quality.
- Document why each third-party dependency was chosen and what alternatives were rejected.
- If an earlier recommendation in these docs appears stale after research, update the rationale and proceed with the better option.

### Architecture policy

- Choose the simplest architecture that remains testable.
- Prefer native SwiftUI patterns and modern Apple observation/state tools unless there is a strong reason not to.
- Keep domain logic isolated from UI code.
- Keep platform services behind thin wrappers or adapters.
- Avoid building a framework cathedral for an MVP.

## Expected implementation shape

A sensible decomposition is something close to this, though exact naming can vary:

- `SolarEngine` or equivalent solar calculation wrapper
- `SunDaySampler` or equivalent day sampling / interpolation service
- `LocationStore` for current + manual + saved locations
- `HeadingStore` for compass updates, smoothing, and diagnostics
- `SunState` or equivalent app state model for date / time / mode
- View layer for Now, Day, Place, Shadow, and Diagnostics
- Logging / diagnostics support module

## Logging requirements

Use Apple's native structured logging stack.

### Runtime logging

- Use `Logger` / `OSLog` categories, not ad hoc `print` spam.
- Categories should be explicit, such as: `app`, `location`, `heading`, `solar`, `sampling`, `map`, `shadow`, `ui`, `performance`, `testing`.
- Use a launch/session correlation identifier where useful.
- Throttle or aggregate high-frequency events such as heading updates.
- Do not emit precise location data in normal production logs unless it is redacted or clearly debug-only.
- Errors and fallbacks should be logged with enough context to diagnose the failure.

### Logging levels

Use levels intentionally:

- `debug` for noisy development details and temporary instrumentation
- `info` or `notice` for major state transitions and user-meaningful events
- `error` for recoverable failures
- `fault` for invariant breaks or severe failures

### Performance instrumentation

Use signposts or equivalent native performance instrumentation around:

- Day resampling
- Time scrubbing updates
- Location acquisition / permission transitions
- Initial app launch and first usable screen

### In-app diagnostics

Provide a debug-only diagnostics surface or equivalent dev tool that can show:

- Current location authorization and accuracy state
- Current heading source / validity / smoothing state
- Selected location and timezone
- Current solar sample details
- Last significant warnings / errors
- Dependency / environment summary if useful

A lightweight in-memory ring buffer of recent significant log events is encouraged for debug builds.

## Testing policy

Testing is not ceremonial glitter. It is part of the deliverable.

Minimum expectation:

- Unit tests for domain logic
- UI / integration tests for critical user flows
- Manual verification checklist for anything simulator automation cannot fully validate
- A human-readable test report in the repo

You may add snapshot tests or other supporting test styles if your research indicates they fit well.

## Required repo outputs before handoff

By the end, the repo should contain or be updated with:

- A working app project
- A `README.md` with setup and run instructions
- A dependency rationale document
- A brief architecture note
- A test report
- An execution log
- Any necessary sample data / preview fixtures

Suggested paths if none exist yet:

- `docs/dependency-rationale.md`
- `docs/architecture.md`
- `docs/test-report.md`
- `docs/execution-log.md`

## Command discovery

You must discover the correct build, test, and lint commands for the actual project structure and document them in the README and execution log.

If the project does not yet exist, create a sane structure and then document the commands you established.

## Research expectations

When choosing frameworks, libraries, or patterns:

- Check current maintenance and compatibility
- Prefer stable, boring, well-supported options over novelty bait
- Record the tradeoffs briefly in the dependency rationale
- Avoid unsupported assumptions about package versions or APIs

## Completion rule

The task is complete only when:

- The MVP builds
- The acceptance criteria are substantially met
- Testing has been run and documented
- Logging and diagnostics are in place
- The repo is understandable by a new engineer

If blocked, document:

- the blocker
- evidence of the blocker
- attempted mitigations
- the smallest clear next step

