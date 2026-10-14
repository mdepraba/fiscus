// The platform every module plugs into (PRD 5.4). So far: the configuration,
// the database and /health. Auth, tokens and pairing, the registry, jobs,
// files, events and audit are built from Stage 2.
export { ConfigError } from '@core/db';
export { AppConfig, loadConfig } from './config.js';
export { CoreModule } from './core.module.js';
export { DATABASE } from './database.module.js';
