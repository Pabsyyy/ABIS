import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET', isProduction ? undefined : 'dev-only-insecure-secret-change-me');
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/abis',
  useMemoryDb: process.env.USE_MEMORY_DB === 'true',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  cookieName: process.env.COOKIE_NAME ?? 'abis_token',
  seed: {
    secretaryUsername: process.env.SEED_SECRETARY_USERNAME ?? 'secretary',
    secretaryPassword: process.env.SEED_SECRETARY_PASSWORD ?? 'ChangeMe123!',
    secretaryFullName: process.env.SEED_SECRETARY_FULLNAME ?? 'Barangay Secretary',
  },
};
