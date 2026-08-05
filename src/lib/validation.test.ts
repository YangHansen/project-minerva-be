import { expect, test } from 'bun:test';
import { t } from 'elysia';
import { Value } from '@sinclair/typebox/value';
import { PASSWORD_PATTERN, passwordIssue, MAX_DOCUMENT_BYTES } from './validation';

const passwordSchema = t.String({ minLength: 8, pattern: PASSWORD_PATTERN });

test('password requires 8+ chars with lowercase, uppercase, and number', () => {
  for (const ok of ['P@ssw0rdX', 'Aa1234567', 'LowerUPPER1', 'abcdeFg1']) {
    expect(Value.Check(passwordSchema, ok)).toBe(true);
  }
  for (const bad of ['abcdefgh', 'ABCDEFGH', 'abcABC', 'abcdef7', 'abcdefgH', 'abcdefg1', '', 'Abcd123']) {
    expect(Value.Check(passwordSchema, bad)).toBe(false);
  }
});

test('passwordIssue returns a message for invalid passwords', () => {
  expect(passwordIssue('short')).toBe('Password must be at least 8 characters long');
  expect(passwordIssue('abcdefgh')).toBe('Password must include at least one uppercase letter, one lowercase letter, and one number');
  expect(passwordIssue('abcdefgH')).toBe('Password must include at least one uppercase letter, one lowercase letter, and one number');
  expect(passwordIssue('abcdefg1')).toBe('Password must include at least one uppercase letter, one lowercase letter, and one number');
  expect(passwordIssue('ABCDEFG1')).toBe('Password must include at least one uppercase letter, one lowercase letter, and one number');
  expect(passwordIssue('')).toBe('Password must be at least 8 characters long');
});

test('passwordIssue returns null for a valid password', () => {
  for (const ok of ['P@ssw0rdX', 'Aa1234567', 'StrongPass1', 'abcdeFg1']) {
    expect(passwordIssue(ok)).toBe(null);
  }
});

test('MAX_DOCUMENT_BYTES is 2 MiB', () => {
  expect(MAX_DOCUMENT_BYTES).toBe(2 * 1024 * 1024);
});
