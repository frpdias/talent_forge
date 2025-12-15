import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let app: any = null;

async function bootstrap() {
  if (app) {
    return app;
  }

  app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true, credentials: true });

  await app.init();

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const nestApp = await bootstrap();
    const httpAdapter = nestApp.getHttpAdapter();
    const instance = httpAdapter.getInstance();
    
    return new Promise<void>((resolve) => {
      instance(req, res, () => {
        resolve();
      });
    });
  } catch (error: any) {
    console.error('Handler Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
