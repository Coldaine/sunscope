# Mobile Testing

## Verified on Linux

- `pnpm --filter @sunscope/mobile test` passes in Jest with React Native and Expo mocks.
- `env CI=1 pnpm exec expo start --web --port 8082` starts Metro and produces a successful web bundle.
- AR runtime code is not imported at the app top level, so non-AR screens can boot without `@reactvision/react-viro`.

## Expo Web

- Works for UI layout, tab navigation, charts, cards, scrubber, and the modal shadow sheet.
- Does not provide real heading or GPS sensor streams; the hooks log warnings and fall back gracefully.

## Expo Go

- Supports the non-AR application shell and any screens that do not depend on custom native modules.
- `expo-location` permissions can be exercised on a device, but heading quality depends on available hardware sensors and permissions.
- Viro-based AR work is intentionally excluded because Expo Go cannot host the required native runtime.

## Dev Client

- Required before any Viro scene testing.
- Required for validating native-module behavior beyond the standard Expo Go surface.

## Physical Device

- Required to validate `watchHeadingAsync` behavior, true-vs-magnetic heading fallback, and live GPS updates.
- Required to confirm shadow and sun-path behavior against the real sky.
- Required to verify any future Viro `gravityAndHeading` alignment and camera-field-of-view assumptions.
