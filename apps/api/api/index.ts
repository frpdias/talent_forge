// Vercel serverless entrypoint
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let app: any = null;

async function bootstrap() {
  if (app) return app;

  try {
    // Dynamic import to avoid build issues
    const { AppModule } = await import('../dist/app.module.js');
    
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    
    app = await NestFactory.create(AppModule, adapter, {
      bodyParser: true,
      logger: ['error', 'warn', 'log'],
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // CORS
    app.enableCors({
      origin: true,
      credentials: true,
    });

    // Validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger
    const config = new DocumentBuilder()
      .setTitle('TalentForge API')
      .setDescription('API para recrutamento inteligente com testes comportamentais')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-org-id', in: 'header' }, 'x-org-id')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.init();
    
    console.log('✅ NestJS app initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Error initializing NestJS app:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const nestApp = await bootstrap();
    const expressApp = nestApp.getHttpAdapter().getInstance();
    
    // Handle request with Express
    return new Promise((resolve, reject) => {
      expressApp(req, res, (err: any) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  } catch (error: any) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
}
