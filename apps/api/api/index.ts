import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any = null;

async function bootstrap() {
  if (app) {
    return app;
  }

  // Use require with path relative to the function location
  const path = require('path');
  const distPath = path.join(__dirname, '..', 'dist', 'app.module.js');
  
  console.log('Looking for module at:', distPath);
  console.log('__dirname:', __dirname);
  
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require(distPath);

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
      dirname: __dirname,
    });
  }
}
