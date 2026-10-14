import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';

/**
 * One process for every module (PRD 1.1). Until the module registry (FR-07)
 * builds the list from manifests, modules are added here by hand.
 */
@Module({
  controllers: [HealthController],
})
export class AppModule {}
