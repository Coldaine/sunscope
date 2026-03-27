# Dependency Rationale

## Current Implementation (React Native / TypeScript)

| Dependency | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| suncalc | 1.9.0 | Solar position calculations | Stable, widely used, no native dependencies |
| date-fns | 4.1.0 | Date manipulation | Modern, tree-shakeable, timezone support |
| date-fns-tz | 3.2.0 | Timezone handling | Companion to date-fns |
| pino | 10.3.1 | Structured logging | Fast, structured, browser compatible |
| expo | ~55.0.6 | React Native framework | Quick setup, OTA updates |
| react-native | 0.83.2 | Mobile framework | Cross-platform (but not needed) |

**Note**: These dependencies were chosen for a React Native project. For the Slate SunTracker spec (SwiftUI), these would be replaced with:

## Proposed Implementation (SwiftUI)

| Framework | Type | Purpose | Rationale |
|-----------|------|---------|-----------|
| SunKit | Apple Native | Solar calculations | Apple's official framework, maintained, accurate |
| CoreLocation | Apple Native | GPS, heading, geocoding | Native integration, permission handling |
| MapKit | Apple Native | Map display, place selection | Native maps, search, annotations |
| Swift Charts | Apple Native | Day curve visualization | Native SwiftUI charts |
| OSLog | Apple Native | Structured logging | Native logging with privacy controls |

### Why SunKit over alternatives

| Alternative | Rejected Because |
|-------------|------------------|
| suncalc (ported) | JavaScript origin, not native |
| Custom implementation | Complex, error-prone, maintenance burden |
| AA+ (C++ astrononmy lib) | Overkill for MVP, complex integration |
| NOAA web API | Network dependency, violates offline-first requirement |

### Why native frameworks over third-party

- **CoreLocation vs. something else**: Apple controls permissions, accuracy, power management
- **MapKit vs. Google Maps**: Native integration, no API key required for basic use
- **Swift Charts vs. DGCharts**: Native SwiftUI, better animation/integration
- **OSLog vs. CocoaLumberjack**: Native, integrated with Console app, privacy features
