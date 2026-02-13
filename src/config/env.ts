/**
 * Environment configuration
 * Provides type-safe access to environment variables
 */

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env = {
  // App
  APP_URL: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  APP_NAME: getEnvVar("NEXT_PUBLIC_APP_NAME", "Killhouse"),

  // Node environment
  NODE_ENV: process.env.NODE_ENV ?? "development",
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

// Server-only environment variables
// These should only be accessed on the server side
export const serverEnv = {
  // Database
  DATABASE_URL: () => getEnvVar("DATABASE_URL"),

  // Auth
  NEXTAUTH_SECRET: () => getEnvVar("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: () => getEnvVar("NEXTAUTH_URL", "http://localhost:3000"),

  // OAuth
  GOOGLE_CLIENT_ID: () => process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: () => process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: () => process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: () => process.env.GITHUB_CLIENT_SECRET,

  // Stripe
  STRIPE_SECRET_KEY: () => process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: () => process.env.STRIPE_WEBHOOK_SECRET,

  // AWS
  AWS_ACCESS_KEY_ID: () => process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: () => process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: () => process.env.AWS_REGION ?? "ap-northeast-2",
  AWS_S3_BUCKET: () => process.env.AWS_S3_BUCKET,

  // Analysis API
  ANALYSIS_API_URL: () => process.env.ANALYSIS_API_URL,
  ANALYSIS_API_KEY: () => process.env.ANALYSIS_API_KEY,
} as const;
