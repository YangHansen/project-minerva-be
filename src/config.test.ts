import { expect, test } from 'bun:test';
import { getConfig } from './config';

test('throws when any required env var is missing', () => {
  expect(() => getConfig({})).toThrow(/MONGODB_URI/);
  expect(() => getConfig({ MONGODB_URI: 'x' })).toThrow(/SUPABASE_URL/);
});

test('returns all config values when present', () => {
  const config = getConfig({
    MONGODB_URI: 'mongodb://x',
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'key',
    RESEND_API_KEY: 'resend',
    JWT_SECRET: 'secret'
  });
  expect(config).toEqual({
    mongodbUri: 'mongodb://x',
    supabaseUrl: 'https://x.supabase.co',
    supabaseServiceRoleKey: 'key',
    resendApiKey: 'resend',
    jwtSecret: 'secret'
  });
});
