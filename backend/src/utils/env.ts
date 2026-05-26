const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PORT',
  'NODE_ENV',
] as const;

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    throw new Error('Invalid DATABASE_URL: expected postgres:// or postgresql:// (Neon/PostgreSQL).');
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV as 'development' | 'staging' | 'production' | 'test',
  uploadPath: process.env.UPLOAD_PATH ?? './uploads',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? '',
};
