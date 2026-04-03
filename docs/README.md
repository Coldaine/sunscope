# SunScope Documentation

This directory is the canonical home for project documentation.

## Read Order

1. `docs/NORTH_STAR.md`
2. `docs/ARCHITECTURE.md`
3. `docs/ROADMAP.md`
4. `docs/CONVENTIONS.md`
5. `docs/LOGGING.md`
6. `docs/TESTING.md`
7. `docs/plans/MASTER_PLAN.md`
8. `docs/plans/MASTER_PLAN_DONE.md`
9. `docs/plans/MASTER_PLAN_REMAINING.md`

## Task Paths

- If you need to understand what the product is building: read `NORTH_STAR`, then `ARCHITECTURE`.
- If you need to understand what remains or what is blocked: read `ROADMAP`.
- If you need fixed implementation rules: read `CONVENTIONS`.
- If you need to know the logging contract: read `LOGGING`.
- If you need to know the testing and completion gates: read `TESTING`.
- If you need the full requirement spec: read `plans/MASTER_PLAN`.
- If you need the completed-versus-remaining split: read `plans/MASTER_PLAN_DONE` and `plans/MASTER_PLAN_REMAINING`.

## What Each Document Means

- `docs/NORTH_STAR.md`: constitutional intent, goals, invariants, and anti-drift rules
- `docs/ARCHITECTURE.md`: current package boundaries and integration shape
- `docs/ROADMAP.md`: live execution state, priorities, and open risks
- `docs/CONVENTIONS.md`: technical conventions the code must obey
- `docs/LOGGING.md`: logger contract, required levels, and assertion expectations
- `docs/TESTING.md`: test philosophy, definition of done, and verification blueprint
- `docs/plans/MASTER_PLAN.md`: detailed requirement and acceptance-criteria spec
- `docs/plans/MASTER_PLAN_DONE.md`: completed requirement surface and currently accepted implementation state
- `docs/plans/MASTER_PLAN_REMAINING.md`: unfinished requirement surface, grouped by phase

## Placement Rules

- Put canonical project docs in `docs/`.
- Put durable execution-quality rules in top-level docs, not only in plan documents.
- Put detailed execution specs in `docs/plans/`.
- Use `docs/plans/MASTER_PLAN_DONE.md` and `docs/plans/MASTER_PLAN_REMAINING.md` for status-oriented plan review rather than overloading the full spec.
- Do not create parallel status or summary docs that compete with the canonical stack.
- If a temporary note is useful, either fold it back into the canonical docs or keep it clearly subordinate to them.
