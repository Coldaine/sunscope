# Slate Execution Brief: Sun Tracker MVP

## Mission

Build a polished, SwiftUI-first iPhone MVP for sun tracking.

This is both a product build and a capability test for Slate. The expectation is not just that you produce code, but that you carry the work all the way through research, planning, implementation, verification, cleanup, and handoff.

## Working style

Operate autonomously, but stay grounded:

- Research first when dependencies or framework choices are uncertain.
- Prefer simple, testable solutions.
- Keep the core functionality offline-first.
- Do not over-engineer the MVP.
- Do not stop at a plan. Execute to a real, tested result.

## Product outcome

At the end of this task, a user should be able to install and run the app and use it to:

- See the current solar position for their location
- Scrub through the day to see how solar position changes
- Inspect key daily solar events
- Change locations manually on a map or via current location
- Estimate a simple shadow length and direction for an object height
- Access enough diagnostics to understand what the app is doing during development and QA

## User experience targets

### Screen 1: Now

Core purpose: tell the user where the sun is now.

Desired UX:

- A clear primary visual, likely a compass / sky dial or equivalent directional visualization
- Current azimuth and altitude displayed clearly
- Current phase label such as daylight, golden hour, blue hour, twilight, or night
- Current location summary
- A visible state for live mode vs scrubbed mode if the app supports both from this screen
- Heading quality or calibration state when relevant

### Screen 2: Day

Core purpose: show the shape of the day.

Desired UX:

- Date selector
- Day curve or timeline visualization for solar altitude or equivalent
- Clear event markers for dawn / sunrise / solar noon / sunset / dusk as supported
- Time scrubber with responsive feedback
- Display of the selected time and corresponding sun position
- Good behavior across edge cases such as low sun angles or days with unusual twilight behavior

### Screen 3: Place

Core purpose: make location selection understandable.

Desired UX:

- Map-based location selection
- Current location shortcut
- Manual pin placement or map tap flow
- Ability to save or quickly reuse locations if this can be added without bloating scope
- A simple directional preview such as sunrise / noon / sunset bearings if practical

### Screen 4: Shadow

Core purpose: provide a simple, useful derived calculation.

Desired UX:

- Input for object height
- Output for shadow length and direction at the selected time
- A compact explanatory visual if practical
- Clear messaging when the sun is below the horizon or the result is undefined / impractical

### Screen 5: Diagnostics

Core purpose: make the system inspectable during development and QA.

Desired UX:

- Current authorization states
- Current location summary and precision status
- Heading validity and smoothing details
- Selected date / time / location
- Current computed solar values
- Recent warnings or errors
- Build / environment metadata if useful

Diagnostics may be debug-only if that is the cleanest implementation.

## Non-goals

Do not spend MVP time on these unless all core requirements are complete and there is clearly spare capacity:

- AR overlays
- Terrain-aware or building-aware shadow simulation
- Multi-day planning workflows beyond a clean date selector
- Widgets, Live Activities, or watch companions
- Social, sync, cloud, or account systems
- General astronomy scope creep

## Dependency guidance

You must do fresh research before locking in dependencies. These are starting opinions, not commandments carved into a cosmic potato.

### Likely good defaults

- A dedicated solar calculation package such as SunKit, if current research confirms it remains the strongest practical fit
- Native SwiftUI + MapKit + Charts + CoreLocation + OSLog / Logger where possible
- A maintained SwiftUI slider package only if a native implementation is clearly slower or worse to build than a package-based scrubber

### Guidance for dependency choices

- Prefer one good solar engine rather than rolling your own astronomy math for MVP
- Prefer native mapping, logging, and charts first
- Prefer no more third-party dependencies than necessary
- If you choose a package, explain why it beats a native approach or an alternative package
- Do not write versions into these planning docs; determine current compatible versions during research and implementation

## Required execution phases

### Phase 1: Research and plan

- Inspect the current repo state
- Research current dependencies and APIs
- Decide the architecture and dependency approach
- Write or refine the implementation plan
- Capture the reasoning in `docs/dependency-rationale.md` and `docs/architecture.md`

### Phase 2: Core implementation

Build the app so that the four core surfaces work:

- Now
- Day
- Place
- Shadow

Also implement diagnostics support early enough that it helps the rest of the build.

### Phase 3: Testing and verification

- Add unit tests for domain logic and calculations
- Add UI / integration tests for key flows
- Run the test suite
- Perform manual checks for hardware-sensitive flows such as heading / permissions where needed
- Capture the results in `docs/test-report.md`

### Phase 4: Polish and handoff

- Remove obvious dead code and temporary hacks
- Ensure logging is intentional and not noisy chaos
- Ensure the README is sufficient for another engineer
- Update `docs/execution-log.md` with a meaningful narrative of what was done
- Leave the repo in a clean, explainable state

## Execution log requirement

Maintain a human-readable execution log throughout the session, not just at the end.

Suggested sections:

- Session objective
- Research findings
- Key decisions
- Major implementation steps
- Tests run
- Failures encountered
- Fixes applied
- Remaining caveats

This is partly for the human reviewer and partly to make the Slate run inspectable.

## Deliverables

By handoff, the repo should contain:

- App source code
- Test suite
- README
- `docs/dependency-rationale.md`
- `docs/architecture.md`
- `docs/test-report.md`
- `docs/execution-log.md`

Optional but welcome:

- Preview data / fixtures
- Small design notes or screenshots
- A short known-limitations section

## Decision rules when uncertainty appears

If you hit uncertainty:

1. Prefer the smaller, more testable path.
2. Prefer native frameworks where they are good enough.
3. Prefer current research over stale assumptions.
4. Prefer completing the whole MVP over polishing one shiny corner forever.
5. Document tradeoffs briefly and move.

## Finish line

The task is complete when the MVP is genuinely usable, tested, documented, and understandable.

That means all of the following are true:

- The app builds and runs
- The core flows work
- Logging and diagnostics are present
- Tests exist and have been run
- Acceptance criteria are substantially satisfied
- The repo contains enough documentation for handoff

