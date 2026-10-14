import { ConfigError } from '@core/db';
import { loadConfig } from './config.js';

const DATABASE_URL = 'postgres://fiscus:fiscus@localhost:5432/fiscus';

describe('loadConfig', () => {
  it('binds to loopback on port 3000 by default (FR-01)', () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      host: '127.0.0.1',
      port: 3000,
      databaseUrl: DATABASE_URL,
    });
  });

  it('reads HOST and PORT', () => {
    expect(loadConfig({ DATABASE_URL, HOST: '0.0.0.0', PORT: '4000' })).toEqual({
      host: '0.0.0.0',
      port: 4000,
      databaseUrl: DATABASE_URL,
    });
  });

  it('reports every problem at once', () => {
    expect(() => loadConfig({ PORT: '70000' })).toThrow(ConfigError);
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(
      /PORT must be a whole number[\s\S]*DATABASE_URL is required/,
    );
  });

  it('never echoes a value (NFR-11)', () => {
    const env = { DATABASE_URL: 'mysql://root:hunter2@db/x', PORT: 'p4ss' }; // secret-scan: allow
    expect(() => loadConfig(env)).toThrow(ConfigError);
    try {
      loadConfig(env);
    } catch (error) {
      expect(String(error)).not.toMatch(/hunter2|p4ss/);
    }
  });
});
