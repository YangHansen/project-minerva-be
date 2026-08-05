import { expect, test } from 'bun:test';
import { t } from 'elysia';
import { Value } from '@sinclair/typebox/value';
import { PASSWORD_PATTERN, MAX_DOCUMENT_BYTES } from './validation';

const passwordSchema = t.String({ minLength: 8, pattern: PASSWORD_PATTERN });

test('password requires 8+ chars with lowercase and uppercase', () => {
  for (const ok of ['abcdefgH', 'P@ssw0rdX', 'Aa1234567', 'LowerUPPER1']) {
    expect(Value.Check(passwordSchema, ok)).toBe(true);
  }
  for (const bad of ['abcdefgh', 'ABCDEFGH', 'abcABC', 'abcdef7', '', 'Abcd123']) {
    expect(Value.Check(passwordSchema, bad)).toBe(false);
  }
});

test('MAX_DOCUMENT_BYTES is 2 MiB', () => {
  expect(MAX_DOCUMENT_BYTES).toBe(2 * 1024 * 1024);
});
