import 'reflect-metadata';
import { ConfigError, loadConfig } from '@core/api';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  // NFR-10: systemd fills the environment from /srv/fiscus/.env, and Bun
  // loads the repo's .env in development. A bad value stops the process
  // here, before anything binds.
  const config = loadConfig(process.env);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.forRoot(config),
    new FastifyAdapter(),
    { bufferLogs: true },
  );
  app.enableShutdownHooks();

  // FR-01: only `tailscale serve` reaches the app, so it binds to loopback.
  await app.listen({ host: config.host, port: config.port });
  Logger.log(`Fiscus listening on http://${config.host}:${config.port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  // A ConfigError names keys, never values (NFR-11).
  console.error(error instanceof ConfigError ? error.message : error);
  process.exit(1);
});
