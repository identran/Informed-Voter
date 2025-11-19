import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  API_URL: z.string().default('http://localhost:3001'),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  PROPUBLICA_API_KEY: z.string().optional(),
  GOOGLE_CIVIC_API_KEY: z.string().optional(),
  LEGISCAN_API_KEY: z.string().optional(),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().optional(),

  MAX_FILE_SIZE: z.string().default('5242880'),
  UPLOAD_DIR: z.string().default('./uploads'),

  LOG_LEVEL: z.string().default('info'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();
