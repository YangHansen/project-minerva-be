/**
 * Pure mentor booking availability logic — no DB or network I/O.
 *
 * checks if a requested date matches the mentor's UTC weekday and time slot.
 */

export function isSlotAvailable(
  availableDays: string[],
  availableTimeSlots: string[],
  date: Date
): boolean {
  if (!Array.isArray(availableDays) || !Array.isArray(availableTimeSlots)) {
    return false;
  }
  if (availableDays.length === 0 || availableTimeSlots.length === 0) {
    return false;
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const time = date.toISOString().slice(11, 16);

  return availableDays.includes(weekday) && availableTimeSlots.includes(time);
}
