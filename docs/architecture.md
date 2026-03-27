# Architecture

## Current Monorepo

SunScope is organized as a pnpm workspace with one Expo app and four shared packages.

```text
apps/mobile        # Expo app shell, navigation, state, and screens
packages/core      # Solar math, location/timezone helpers, logging
packages/sky-detection
                   # Sky mask integration and synthetic classifier tooling
packages/ar        # Sun arc geometry and Viro scene wrapper
packages/ui        # Shared visual components and screens
```

## Data Flow

```text
apps/mobile
  -> packages/ui
  -> packages/ar
  -> packages/core
  -> shared test fixtures and utilities
```

The mobile app owns runtime state and screen composition. `packages/core` provides the deterministic solar calculations and stores. `packages/ui` and `packages/ar` remain presentation-focused and depend on the shared core contracts.

## Notes

- The root Expo template files were removed in favor of the workspace app under `apps/mobile`.
- Typecheck and test commands run across the workspace through Turbo.
