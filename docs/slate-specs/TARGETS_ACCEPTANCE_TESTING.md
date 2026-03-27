# Targets, Acceptance Criteria, Testing, and Logging

## 1. Primary build targets

### Target A: Core solar engine integration

The app must integrate a solar calculation approach that can provide, at minimum:

- Solar azimuth
- Solar altitude / elevation
- Daily solar events needed for the UI
- Reasonable support for arbitrary dates and locations
- Offline-first operation for the core experience

#### Acceptance criteria

- A user can select a location and date and receive consistent solar values without network dependency for the core path.
- Daily events render in chronological order when applicable.
- Scrubbing time updates the displayed solar position correctly.
- The chosen solar engine is documented in `docs/dependency-rationale.md` with current research and tradeoffs.

### Target B: Now screen

#### Acceptance criteria

- The screen clearly communicates the current solar position.
- The current azimuth and altitude are visible without drilling into a subview.
- A user can tell whether the app is in live or scrubbed mode.
- If heading or location quality is poor, the UI communicates that state clearly.
- The screen does not feel visually broken or overloaded on typical iPhone sizes.

### Target C: Day screen

#### Acceptance criteria

- A user can choose a date.
- A user can scrub across the day and see the selected time reflected in the visualization and numeric values.
- Key solar events are visible and legible.
- The visualization remains understandable when the sun is low, below the horizon, or in edge-case seasonal conditions.
- Scrubbing is responsive and does not visibly hitch under normal use.

### Target D: Place screen

#### Acceptance criteria

- A user can use current location.
- A user can choose a manual location using a map-based interaction.
- The selected location is reflected in calculations throughout the app.
- The app handles denied or reduced-accuracy permission states without collapsing into nonsense.
- If saved locations are implemented, they behave predictably and are documented.

### Target E: Shadow screen / feature

#### Acceptance criteria

- A user can input or adjust object height.
- The app returns shadow length and direction for the selected date / time / location.
- The app explains or gracefully handles cases where the sun is below the horizon or the calculation would not be meaningful.
- The calculation path is covered by unit tests.

### Target F: Diagnostics and observability

#### Acceptance criteria

- There is a debug-accessible surface or equivalent mechanism to inspect app state.
- Logging uses structured categories rather than ad hoc console spam.
- Recent significant events, warnings, or failures can be inspected during QA.
- High-frequency signals are throttled or summarized.
- Sensitive data, especially precise location, is not carelessly emitted in normal logs.

### Target G: Documentation and handoff

#### Acceptance criteria

- The README explains how to build, run, and test the project.
- Dependency choices are documented.
- Architecture is documented briefly but clearly.
- A test report exists and states what passed, what was manually verified, and what remains imperfect.
- An execution log exists and is readable by another engineer.

## 2. Secondary quality targets

These are not as important as getting the core MVP working, but they matter.

### UX quality targets

- The app should feel coherent rather than like five unrelated screens stapled together.
- Typography, spacing, and hierarchy should make the main answer obvious.
- The user should not need to understand astronomy jargon to use the app.
- The design should feel calm and legible outdoors.

### Engineering quality targets

- Core calculations should not live directly inside views.
- Permission handling should be explicit, not magical.
- State changes should be inspectable and testable.
- Temporary hacks should be removed or called out before handoff.

## 3. Recommended library / framework approach

These are opinions, not hard mandates. Research them before finalizing.

### Strong native defaults

Prefer native Apple frameworks for:

- UI composition
- Mapping
- Charts / visualization
- Location and heading
- Logging and performance instrumentation

### Likely external dependency categories

Use a dedicated solar engine package if current research confirms one remains superior to hand-rolled math for MVP.

Use a maintained slider package only if:

- native controls do not produce a good scrubbing experience fast enough, or
- the package clearly improves fidelity without dragging in needless complexity.

### Implementation preference

Prefer the smallest dependency footprint that still produces a polished result.

If you reject a previously suggested library, explain why.

## 4. Logging design

### Runtime logging strategy

Use structured logging with categories such as:

- `app`
- `location`
- `heading`
- `solar`
- `sampling`
- `map`
- `shadow`
- `ui`
- `performance`
- `testing`

### What should be logged

Log these classes of events:

- App launch and major lifecycle transitions
- Permission requests and authorization changes
- Location acquisition success / fallback / failure
- Heading validity changes, calibration issues, and fallback modes
- Recalculation triggers such as date change, location change, or scrub change
- Significant solar-engine failures or impossible states
- Manual test checkpoints and automation milestones when useful during development

### What should not be logged carelessly

- Continuous raw heading updates at full frequency
- Precise location values in normal production logs unless redacted or intentionally debug-only
- Verbose UI noise with no diagnostic value

### Recommended level behavior

- `debug`: noisy, temporary, computation and instrumentation detail
- `info` / `notice`: meaningful app state changes and user-impacting transitions
- `error`: recoverable failures, fallback paths, degraded functionality
- `fault`: serious invariant breaks

### Debug diagnostics buffer

Implement a lightweight debug-only recent-events buffer if practical.

Good characteristics:

- fixed-size in-memory ring buffer
- timestamp
- category
- level
- compact message
- optional structured metadata for development use

### Performance instrumentation

Use native performance instrumentation or signposts around:

- initial screen readiness
- daily sample generation
- scrubbing update path
- map interaction if it becomes heavy

## 5. Testing requirements

## 5.1 Unit tests

Cover the domain logic with deterministic tests.

### Minimum unit test areas

- Solar engine wrapper behavior for representative dates and locations
- Event ordering and event presence when applicable
- Phase classification logic
- Day sampling behavior
- Shadow math
- Heading smoothing / shortest-angle interpolation logic
- State reducers / view models / stores if such layers exist

### Unit test guidance

- Favor deterministic fixtures over live services.
- Use representative locations and dates, including at least one edge-case seasonal scenario.
- Keep solar-engine wrapper tests tolerant enough to handle minor floating-point or library-specific differences without becoming flaky.

## 5.2 UI and integration tests

Automate the highest-value user flows.

### Minimum UI / integration flows

- First launch into the primary experience
- Denied location permission path
- Manual location selection path
- Day scrubbing updates selected time and visible values
- Shadow feature accepts input and shows output
- Navigation across all major screens
- Diagnostics surface can be reached in debug mode if implemented as a UI surface

### Optional but valuable

- Snapshot or screenshot-based coverage for key states
- Launch with preview / fixture data for repeatable UI assertions

## 5.3 Manual verification

Manual checks are required for hardware-sensitive behaviors.

### Manual checklist

- Observe live heading behavior on a real device if available
- Confirm reduced-accuracy location handling is intelligible
- Confirm the app remains understandable outdoors or at high brightness
- Confirm no obvious visual breakage across at least two iPhone size classes
- Confirm a few known date / location scenarios against a trusted external reference if practical

## 5.4 Test reporting

Create `docs/test-report.md`.

It should include:

- Test types run
- Commands used
- Results summary
- Manual checks completed
- Known limitations
- Any flaky or unimplemented areas

## 6. Completion checklist

The project is ready for handoff only when all of the following are true:

- [ ] Core MVP features are implemented
- [ ] Dependency choices were researched and documented
- [ ] Logging is structured and intentional
- [ ] Diagnostics exist in a usable form
- [ ] Unit tests exist and pass, or failures are explicitly documented
- [ ] UI / integration tests exist for critical paths, or documented reasons explain gaps
- [ ] Manual verification was performed for the remaining hardware-sensitive areas
- [ ] README is sufficient for another engineer
- [ ] Architecture and dependency rationale docs exist
- [ ] Execution log exists and is readable
- [ ] Repo is left in a clean state

## 7. Suggested additional artifacts Slate should create during execution

These are recommended outputs for a strong handoff:

- `docs/dependency-rationale.md`
- `docs/architecture.md`
- `docs/test-report.md`
- `docs/execution-log.md`
- `docs/known-limitations.md` if needed

