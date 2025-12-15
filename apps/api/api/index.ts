import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { INestApplication } from '@nestjs/common';

let app: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (app) {
    return app;
  }

  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../dist/app.module');

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
    
    // Handle the request
    return new Promise((resolve) => {
      instance(req, res, () => {
        resolve(undefined);
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
