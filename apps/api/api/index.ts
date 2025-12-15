import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import path from 'path';

let cachedServer: any = null;

async function bootstrapServer() {
  if (cachedServer) {
    return cachedServer;
  }

  // Resolve path to compiled AppModule - works in Vercel
  const distPath = path.join(process.cwd(), 'dist', 'app.module.js');
  const { AppModule } = await import(distPath);

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn'],
  });

  app.setGlobalPrefix('api/v1');
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  
  cachedServer = expressApp;
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const server = await bootstrapServer();
    return server(req, res);
  } catch (error: any) {
    console.error('Handler error:', error);
    console.error('CWD:', process.cwd());
    console.error('Stack:', error.stack);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      cwd: process.cwd(),
    });
  }
}
