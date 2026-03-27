# Timezone Testing Guidelines

## Internal Date Handling

All internal dates in SunScope are stored and manipulated in **UTC**. This is a core design principle.

## Display Conversion

Conversion from UTC to local time happens **only in the view layer**, never in the core business logic modules.

## Testing Timezone-Agnostic Code

All test assertions compare **UTC values**, never local time. This ensures tests produce identical results regardless of the machine's timezone.

### Example

```typescript
// WRONG: Comparing local time strings
expect(date.toString()).toBe('Mon Jun 20 2026 12:00:00 GMT-0500');

// CORRECT: Comparing UTC ISO strings
expect(date.toISOString()).toBe('2026-06-20T17:00:00.000Z');

// CORRECT: Comparing timestamps
expect(date.getTime()).toBe(expectedTimestamp);
```

## Date Creation Best Practices

Always use the 'Z' suffix for UTC:

```typescript
// WRONG: Parsed as local time in JavaScript
const date = new Date('2026-06-20T12:00:00');

// CORRECT: Parsed as UTC
const date = new Date('2026-06-20T12:00:00Z');

// CORRECT: Using Date.UTC()
const date = new Date(Date.UTC(2026, 5, 20, 12, 0, 0));
```

## Running Tests

Tests will produce the same results on any machine timezone because:

1. All dates are created with explicit UTC suffix
2. All assertions compare UTC values
3. Golden test data is stored in UTC

```bash
# These all produce identical results:
npx jest
TZ=America/New_York npx jest  
TZ=Europe/London npx jest
TZ=Asia/Tokyo npx jest
```
