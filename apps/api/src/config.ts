import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load .env from project root if not already loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to current working directory

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('127.0.0.1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  MIGRATOR_DATABASE_URL: z.string().url().optional(),
  TEST_PROVISIONER_DATABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  SUPABASE_ANON_KEY: z.string().default('placeholder_anon_key'),
  // Asymmetric verification endpoint (Required in production)
  SUPABASE_JWKS_URL: z.string().url().optional(),
  // Symmetric secret allowed exclusively in non-production local development / test environments
  SUPABASE_JWT_SECRET: z.string().min(32).optional(),
});

const envSchema = baseEnvSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.SUPABASE_JWKS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_JWKS_URL'],
        message: 'SUPABASE_JWKS_URL is required in production for asymmetric JWKS token verification',
      });
    }
  } else {
    // In local development or test mode, either JWKS or a local JWT secret must be provided
    if (!data.SUPABASE_JWKS_URL && !data.SUPABASE_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_JWT_SECRET'],
        message: 'SUPABASE_JWT_SECRET (or SUPABASE_JWKS_URL) must be provided in development/test environment',
      });
    }
  }
});

export type Config = z.infer<typeof baseEnvSchema>;

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function resetConfigCache(): void {
  cachedConfig = null;
}
