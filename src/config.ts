export interface AppConfig {
  mongodbUri: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  resendApiKey: string;
  jwtSecret: string;
  openaiApiKey: string;
  frontendUrl: string;
}

const REQUIRED: Record<string, keyof AppConfig> = {
  MONGODB_URI: 'mongodbUri',
  SUPABASE_URL: 'supabaseUrl',
  SUPABASE_SERVICE_ROLE_KEY: 'supabaseServiceRoleKey',
  RESEND_API_KEY: 'resendApiKey',
  JWT_SECRET: 'jwtSecret'
};

export function getConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const missing = Object.keys(REQUIRED).filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
  const config = {} as AppConfig;
  for (const [envKey, configKey] of Object.entries(REQUIRED)) {
    config[configKey] = env[envKey]!;
  }
  // Optional — AI recommendation endpoint unavailable when absent
  config.openaiApiKey = env['OPENAI_API_KEY'] ?? '';
  // Optional — base URL for password-reset links in emails
  config.frontendUrl = (env['FRONTEND_URL'] ?? 'http://localhost:5173').replace(/\/$/, '');
  return config;
}
