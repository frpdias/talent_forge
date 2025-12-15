import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedHandler: any = null;

async function bootstrap() {
  if (cachedHandler) {
    return cachedHandler;
  }

  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../dist/app.module');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true, credentials: true });

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  cachedHandler = expressApp;
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await bootstrap();
    return app(req, res);
  } catch (error: any) {
    console.error('Handler Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
