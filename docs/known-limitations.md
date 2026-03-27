# Known Limitations

## Current Limitations

- `@reactvision/react-viro` still needs on-device validation on the target Expo 55 / React Native 0.83 stack.
- AR and sensor behavior still needs hardware verification on iPhone, especially for heading and world-alignment assumptions.
- The repo is testable and typechecks in the workspace, but it still depends on runtime verification for camera, motion, and permissions flows.

## Notes

- The earlier placeholder-app limitation list has been replaced with this shorter, current-state summary.
- The privacy leak in location logging has been addressed in the current codebase.
