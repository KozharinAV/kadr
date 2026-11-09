export interface S3Config {
  endpoint: string;
  publicEndpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  forcePathStyle: boolean;
}

export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
  };
  s3: S3Config;
  admin: {
    email: string;
    password: string;
  };
}

export const APP_CONFIG = Symbol('APP_CONFIG');

const REQUIRED_KEYS = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_TTL_SECONDS',
  'JWT_REFRESH_TTL_SECONDS',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_BUCKET',
  'S3_REGION',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
] as const;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function requiredInt(env: NodeJS.ProcessEnv, name: string): number {
  const raw = required(env, name);
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }
  return value;
}

export function readConfig(env: NodeJS.ProcessEnv): AppConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('Environment variable PORT must be a positive integer');
  }

  return {
    port,
    databaseUrl: required(env, 'DATABASE_URL'),
    redisUrl: required(env, 'REDIS_URL'),
    jwt: {
      accessSecret: required(env, 'JWT_ACCESS_SECRET'),
      refreshSecret: required(env, 'JWT_REFRESH_SECRET'),
      accessTtlSeconds: requiredInt(env, 'JWT_ACCESS_TTL_SECONDS'),
      refreshTtlSeconds: requiredInt(env, 'JWT_REFRESH_TTL_SECONDS'),
    },
    s3: {
      endpoint: required(env, 'S3_ENDPOINT'),
      publicEndpoint:
        env.S3_PUBLIC_ENDPOINT?.trim() || required(env, 'S3_ENDPOINT'),
      accessKey: required(env, 'S3_ACCESS_KEY'),
      secretKey: required(env, 'S3_SECRET_KEY'),
      bucket: required(env, 'S3_BUCKET'),
      region: required(env, 'S3_REGION'),
      forcePathStyle: (env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    },
    admin: {
      email: required(env, 'ADMIN_EMAIL').trim().toLowerCase(),
      password: required(env, 'ADMIN_PASSWORD'),
    },
  };
}

export function configFromService(
  read: (key: string) => string | undefined,
): AppConfig {
  const env: NodeJS.ProcessEnv = {};
  for (const key of REQUIRED_KEYS) {
    env[key] = read(key);
  }
  env.PORT = read('PORT');
  env.S3_FORCE_PATH_STYLE = read('S3_FORCE_PATH_STYLE');
  env.S3_PUBLIC_ENDPOINT = read('S3_PUBLIC_ENDPOINT');
  return readConfig(env);
}
