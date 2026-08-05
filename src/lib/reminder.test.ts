import { expect, test } from 'bun:test';
import { reminderStageFor } from './reminder';

test('reminderStageFor picks the most urgent un-notified stage', () => {
  expect(reminderStageFor(40, [])).toBe(null);
  expect(reminderStageFor(30, [])).toBe('30_days');
  expect(reminderStageFor(14, [])).toBe('14_days');
  expect(reminderStageFor(7, [])).toBe('7_days');
  expect(reminderStageFor(3, [])).toBe('3_days');
  expect(reminderStageFor(2, [])).toBe('3_days');
  expect(reminderStageFor(0, [])).toBe('3_days');
  expect(reminderStageFor(-1, [])).toBe(null);
});

test('reminderStageFor skips already-notified stages', () => {
  expect(reminderStageFor(10, ['30_days', '14_days'])).toBe(null); // 7_days not due yet at 10 days
  expect(reminderStageFor(6, ['30_days', '14_days'])).toBe('7_days');
  expect(reminderStageFor(5, ['3_days', '7_days', '14_days', '30_days'])).toBe(null);
  expect(reminderStageFor(20, ['30_days'])).toBe(null); // 14_days not due yet at 20 days
  expect(reminderStageFor(12, ['30_days'])).toBe('14_days');
});
