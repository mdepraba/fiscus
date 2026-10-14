import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

// FR-01: only `tailscale serve` reaches the app, so it binds to loopback.
// Stage 1's data layer moves these into configuration read from the
// environment.
const HOST = '127.0.0.1';
const PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });
  app.enableShutdownHooks();

  await app.listen({ host: HOST, port: PORT });
  Logger.log(`Fiscus listening on http://${HOST}:${PORT}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
