# Test Report

## Summary

| Metric | Value |
|--------|-------|
| Test Suites | 10 passed, 10 total |
| Tests | 50+ passed, 0 failed |
| NOAA Validation | 12/12 passed |
| Coverage | Core modules only |
| UI Tests | None (no UI exists) |

## Test Execution

**Command**: `npx jest --verbose`

**Date**: 2026-03-16

**Environment**: Node.js 20, Linux (WSL)

## Unit Test Results

### solar-convert.test.ts
| Test | Status |
|------|--------|
| Converts 0 radians to 0 degrees | ✅ Pass |
| Converts PI radians to 180 degrees | ✅ Pass |
| Converts -PI/2 to -90 degrees | ✅ Pass |
| Converts 2*PI to 360 degrees | ✅ Pass |
| Converts 0 (south) to 180 (compass) | ✅ Pass |
| Converts PI/2 (west) to 270 (compass) | ✅ Pass |
| Converts -PI/2 (east) to 90 (compass) | ✅ Pass |
| Converts PI (north) to 0 (compass) | ✅ Pass |
| Output always in [0, 360) | ✅ Pass |

### solar-engine.test.ts
| Test | Status |
|------|--------|
| Returns azimuth in [0, 360) range | ✅ Pass |
| Returns altitude in degrees | ✅ Pass |
| Solar noon azimuth near 180 (south) | ✅ Pass |
| Returns all required time fields | ✅ Pass |
| Sunrise before sunset | ✅ Pass |
| Solar noon between sunrise/sunset | ✅ Pass |

### sun-day-sampler.test.ts
| Test | Status |
|------|--------|
| Default interval produces samples | ⚠️ 289 not 288 |
| Samples sorted chronologically | ✅ Pass |
| Each sample has required fields | ✅ Pass |
| Custom interval works | ✅ Pass |
| Has daylight samples | ✅ Pass |

**Note**: Off-by-one in sample count (includes both endpoints).

### heading-store.test.ts
| Test | Status |
|------|--------|
| Stable input produces stable output | ✅ Pass |
| After 10 jittery samples, within ±2° | ✅ Pass |
| Handles basic wraparound | ✅ Pass |
| Handles east-west transition | ✅ Pass |
| Returns unreliable when accuracy negative | ✅ Pass |
| Returns reliable when accuracy non-negative | ✅ Pass |

### shadow-calculator.test.ts
| Test | Status |
|------|--------|
| altitude=45°, height=1m → length=1m | ✅ Pass |
| altitude=30°, height=2m → length≈3.46m | ✅ Pass |
| altitude=60°, height=10m → length≈5.77m | ✅ Pass |
| altitude=2°, height=1m → length≈28.6m | ✅ Pass |
| altitude=0.5°, height=1m → clamped | ✅ Pass |
| altitude<=0 returns Infinity | ✅ Pass |
| Direction opposite to sun | ✅ Pass |

### location-store.test.ts
| Test | Status |
|------|--------|
| Defaults to Hendersonville, TN | ✅ Pass |
| Updates current location | ✅ Pass |
| Throws on invalid latitude | ✅ Pass |
| Throws on invalid longitude | ✅ Pass |
| Adds and retrieves favorites | ✅ Pass |
| Removes favorites by id | ✅ Pass |
| Serialization works | ✅ Pass |

### phase-classifier.test.ts
| Test | Status |
|------|--------|
| 04:00 UTC → Night | ✅ Pass |
| altitude >= 0.833° → Daylight | ✅ Pass |
| altitude < -18° → Night | ✅ Pass |
| altitude in nautical twilight range | ✅ Pass |
| altitude in civil twilight range | ✅ Pass |

### sun-arc-geometry.test.ts
| Test | Status |
|------|--------|
| Produces 3D points with required fields | ✅ Pass |
| Excludes points where altitude <= -5° | ✅ Pass |
| Solar noon produces point with y > 0 | ✅ Pass |
| Uses custom radius | ✅ Pass |

### timezone.test.ts
| Test | Status |
|------|--------|
| Formats UTC date for display | ✅ Pass |
| Returns America/Chicago for Hendersonville | ✅ Pass |
| Handles various coordinates | ⚠️ Hardcoded fallback |

### noaa-validation.test.ts
| Test | Status |
|------|--------|
| 2026-03-15 sunrise within ±90s | ✅ Pass |
| 2026-03-15 sunset within ±90s | ✅ Pass |
| 2026-03-15 solar noon azimuth ±0.5° | ✅ Pass |
| 2026-03-20 sunrise within ±90s | ✅ Pass |
| 2026-03-20 sunset within ±90s | ✅ Pass |
| 2026-03-20 solar noon within ±90s | ✅ Pass |
| 2026-06-20 sunrise within ±90s | ✅ Pass |
| 2026-06-20 sunset within ±90s | ✅ Pass |
| 2026-06-20 solar noon within ±90s | ✅ Pass |
| 2026-12-21 sunrise within ±90s | ✅ Pass |
| 2026-12-21 sunset within ±90s | ✅ Pass |
| 2026-12-21 solar noon within ±90s | ✅ Pass |

## Manual Verification

| Check | Status | Notes |
|-------|--------|-------|
| Live heading on real device | ❌ Not done | No device access |
| Reduced-accuracy location | ❌ Not done | No UI to test |
| Outdoor visibility | ❌ Not done | No UI to test |
| iPhone size classes | ❌ Not done | No UI to test |
| External reference check | ✅ Done | NOAA validation |

## Known Limitations

1. **No UI tests** - UI does not exist
2. **Phase classifier has logic bugs** - BlueHour/GoldenHour detection inconsistent
3. **Day sampler off-by-one** - Returns 289 not 288 samples
4. **Timezone lookup hardcoded** - Only returns America/Chicago
5. **Logger privacy issue** - Precise coordinates logged in production

## Recommendations

1. **For current codebase**: Fix phase classifier, add UI tests if UI is built
2. **For Slate rewrite**: Port test cases to XCTest, maintain NOAA validation
3. **All tests must be rewritten** in Swift for Slate spec compliance
