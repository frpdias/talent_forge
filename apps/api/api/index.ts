// Vercel serverless entrypoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any = null;

async function bootstrap() {
  if (app) return app;

  try {
    console.log('🚀 Starting bootstrap...');
    console.log('📁 CWD:', process.cwd());
    console.log('📦 Node version:', process.version);
    
    // Import dependencies
    const { NestFactory } = await import('@nestjs/core');
    const { ValidationPipe } = await import('@nestjs/common');
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const { ExpressAdapter } = await import('@nestjs/platform-express');
    const express = (await import('express')).default;
    
    console.log('✅ Dependencies loaded');
    
    // Dynamic import to avoid build issues
    const { AppModule } = await import('../dist/app.module.js');
    console.log('✅ AppModule loaded');
    
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    console.log('✅ Express adapter created');
    
    app = await NestFactory.create(AppModule, adapter, {
      bodyParser: true,
      logger: ['error', 'warn', 'log'],
    });
    console.log('✅ NestJS app created');

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
  console.log(`📨 ${req.method} ${req.url}`);
  
  try {
    const nestApp = await bootstrap();
    console.log('✅ Bootstrap complete, handling request');
    
    const expressApp = nestApp.getHttpAdapter().getInstance();
    
    // Handle request with Express
    return new Promise((resolve, reject) => {
      expressApp(req, res, (err: any) => {
        if (err) {
          console.error('❌ Express error:', err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error: any) {
    console.error('❌ Handler error:', error);
    console.error('Stack:', error?.stack);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      cwd: process.cwd(),
    });
  }
}
