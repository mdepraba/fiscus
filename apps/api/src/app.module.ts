import { type AppConfig, CoreModule } from '@core/api';
import { type DynamicModule, Module } from '@nestjs/common';

/**
 * One process for every module (PRD 1.1). Until the module registry (FR-07)
 * builds the list from manifests, modules are added here by hand.
 */
@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [CoreModule.forRoot(config)],
    };
  }
}
