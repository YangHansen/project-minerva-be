import { describe, expect, test } from 'bun:test';
import { isSlotAvailable } from './mentor';

describe('isSlotAvailable', () => {
  const availableDays = ['Monday', 'Wednesday', 'Friday'];
  const availableTimeSlots = ['10:00', '13:00', '15:00'];

  test('returns true when weekday and time slot match in UTC', () => {
    // 2026-08-05 is Wednesday in UTC, 10:00 UTC
    const date = new Date('2026-08-05T10:00:00Z');
    expect(isSlotAvailable(availableDays, availableTimeSlots, date)).toBe(true);
  });

  test('returns false when weekday matches but time slot does not', () => {
    // Wednesday, 11:00 UTC
    const date = new Date('2026-08-05T11:00:00Z');
    expect(isSlotAvailable(availableDays, availableTimeSlots, date)).toBe(false);
  });

  test('returns false when time slot matches but weekday does not', () => {
    // 2026-08-04 is Tuesday in UTC, 10:00 UTC
    const date = new Date('2026-08-04T10:00:00Z');
    expect(isSlotAvailable(availableDays, availableTimeSlots, date)).toBe(false);
  });

  test('returns false when availableDays or availableTimeSlots are empty', () => {
    const date = new Date('2026-08-05T10:00:00Z');
    expect(isSlotAvailable([], availableTimeSlots, date)).toBe(false);
    expect(isSlotAvailable(availableDays, [], date)).toBe(false);
  });

  test('returns false for invalid date object', () => {
    const invalidDate = new Date('invalid-date');
    expect(isSlotAvailable(availableDays, availableTimeSlots, invalidDate)).toBe(false);
  });

  test('UTC consistency check across different time zone strings', () => {
    // 2026-08-07 is Friday, 15:00:00Z
    const dateZ = new Date('2026-08-07T15:00:00Z');
    expect(isSlotAvailable(availableDays, availableTimeSlots, dateZ)).toBe(true);
  });
});
