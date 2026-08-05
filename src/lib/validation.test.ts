import { expect, test } from 'bun:test';
import { t } from 'elysia';
import { Value } from '@sinclair/typebox/value';
import { PASSWORD_PATTERN, passwordIssue, MAX_DOCUMENT_BYTES, friendlyValidationMessage } from './validation';

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

test('friendlyValidationMessage explains common validation failures', () => {
  expect(friendlyValidationMessage({ path: '/email', message: "Expected string to match 'email' format" }))
    .toBe('Email must be a valid email address.');
  expect(friendlyValidationMessage({ path: '/amount', message: 'Expected number to be greater or equal to 1' }))
    .toBe('Amount must be at least 1.');
  expect(friendlyValidationMessage({ path: '/password', message: 'Expected string' }))
    .toBe('Password must be text.');
  expect(friendlyValidationMessage({ path: '/targetEducationLevel', message: 'Expected union value' }))
    .toBe('Target education level is not one of the allowed values.');
  expect(friendlyValidationMessage({ path: '/tags/0', message: 'Expected string' }))
    .toBe('Tags must be text.');
});

test('friendlyValidationMessage uses a safe fallback', () => {
  expect(friendlyValidationMessage({ path: '', message: 'Unknown validator output' }))
    .toBe('Request is invalid.');
});
