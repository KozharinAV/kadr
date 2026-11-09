import { readConfig } from './read-config';

const validEnv: NodeJS.ProcessEnv = {
  PORT: '3000',
  DATABASE_URL: 'postgres://kadr:kadr@localhost:5432/kadr',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'access',
  JWT_REFRESH_SECRET: 'refresh',
  JWT_ACCESS_TTL_SECONDS: '900',
  JWT_REFRESH_TTL_SECONDS: '604800',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_ACCESS_KEY: 'kadr',
  S3_SECRET_KEY: 'kadrsecret',
  S3_BUCKET: 'kadr',
  S3_REGION: 'ru-central1',
  S3_FORCE_PATH_STYLE: 'true',
  ADMIN_EMAIL: 'Admin@Kadr.Local',
  ADMIN_PASSWORD: 'Admin123!',
};

describe('readConfig', () => {
  it('normalizes the admin email and reads numbers', () => {
    const config = readConfig(validEnv);

    expect(config.port).toBe(3000);
    expect(config.admin.email).toBe('admin@kadr.local');
    expect(config.jwt.accessTtlSeconds).toBe(900);
    expect(config.s3.forcePathStyle).toBe(true);
    expect(config.s3.publicEndpoint).toBe('http://localhost:9000');
    expect(
      readConfig({ ...validEnv, S3_PUBLIC_ENDPOINT: 'http://localhost:19100' })
        .s3.publicEndpoint,
    ).toBe('http://localhost:19100');
  });

  it('rejects a missing required variable', () => {
    expect(() => readConfig({ ...validEnv, DATABASE_URL: undefined })).toThrow(
      'DATABASE_URL',
    );
  });
});
