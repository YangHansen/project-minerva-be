import { expect, test } from 'bun:test';
import { getConfig } from './config';

test('throws when any required env var is missing', () => {
  expect(() => getConfig({})).toThrow(/MONGODB_URI/);
  expect(() => getConfig({ MONGODB_URI: 'x' })).toThrow(/SUPABASE_URL/);
});

test('returns all config values when present', () => {
  const base = {
    MONGODB_URI: 'mongodb://x',
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'key',
    RESEND_API_KEY: 'resend',
    JWT_SECRET: 'secret'
  };
  const config = getConfig(base);
  expect(config).toEqual({
    mongodbUri: 'mongodb://x',
    supabaseUrl: 'https://x.supabase.co',
    supabaseServiceRoleKey: 'key',
    resendApiKey: 'resend',
    jwtSecret: 'secret',
    openaiApiKey: ''
  });
});

test('openaiApiKey is populated when OPENAI_API_KEY is set', () => {
  const config = getConfig({
    MONGODB_URI: 'mongodb://x',
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'key',
    RESEND_API_KEY: 'resend',
    JWT_SECRET: 'secret',
    OPENAI_API_KEY: 'sk-test'
  });
  expect(config.openaiApiKey).toBe('sk-test');
});

