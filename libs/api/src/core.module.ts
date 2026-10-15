import { type DynamicModule, Module } from '@nestjs/common';
import { AppConfig } from './config.js';
import { DatabaseModule } from './database.module.js';
import { HealthController } from './health.controller.js';

/**
 * The platform every module builds on (PRD 5.4). So far it holds the
 * configuration, the database and /health; auth, tokens, the registry, jobs,
 * files, events and audit arrive in Stage 2.
 */
@Module({
  controllers: [HealthController],
})
export class CoreModule {
  /** `config` comes from `loadConfig`, which main.ts runs before Nest starts. */
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: CoreModule,
      global: true,
      imports: [DatabaseModule],
      providers: [{ provide: AppConfig, useValue: config }],
      exports: [AppConfig],
    };
  }
}
