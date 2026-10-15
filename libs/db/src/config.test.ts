import { ConfigError, readDatabaseUrl } from './config.js';

describe('readDatabaseUrl', () => {
  it('returns a postgres:// or postgresql:// URL', () => {
    const url = 'postgres://fiscus:fiscus@localhost:5432/fiscus';
    expect(readDatabaseUrl({ DATABASE_URL: url })).toBe(url);
    expect(readDatabaseUrl({ DATABASE_URL: 'postgresql://localhost/fiscus' })).toBe(
      'postgresql://localhost/fiscus',
    );
  });

  it('requires DATABASE_URL', () => {
    expect(() => readDatabaseUrl({})).toThrow(ConfigError);
    expect(() => readDatabaseUrl({ DATABASE_URL: '  ' })).toThrow('DATABASE_URL is required.');
  });

  it('rejects another scheme without echoing the value (NFR-11)', () => {
    const secret = 'mysql://root:hunter2-s3cret@db.example/fiscus'; // secret-scan: allow
    expect(() => readDatabaseUrl({ DATABASE_URL: secret })).toThrow(
      /^DATABASE_URL must be a postgres/,
    );
    try {
      readDatabaseUrl({ DATABASE_URL: secret });
    } catch (error) {
      expect(String(error)).not.toContain('hunter2');
    }
  });

  it('rejects a value that is not a URL', () => {
    expect(() => readDatabaseUrl({ DATABASE_URL: 'not a url' })).toThrow(
      'DATABASE_URL is not a valid URL.',
    );
  });
});
