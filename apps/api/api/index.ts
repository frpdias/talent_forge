import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: any = null;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  // Use require for CommonJS modules in dist/
  const { NestFactory } = require('@nestjs/core');
  const { ExpressAdapter } = require('@nestjs/platform-express');
  const express = require('express');
  const { AppModule } = require('../dist/app.module');

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn'],
  });

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true, credentials: true });

  await app.init();
  
  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await bootstrap();
    return app(req, res);
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
