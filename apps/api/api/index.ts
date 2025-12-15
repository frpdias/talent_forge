// Vercel serverless entrypoint - Simplified version
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple test first - if this works, NestJS is the problem
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('✅ Handler called:', req.method, req.url);
  
  // Test 1: Just return JSON
  if (req.url === '/test') {
    return res.json({ status: 'ok', message: 'Simple handler works!' });
  }
  
  // Test 2: Try to load NestJS
  try {
    console.log('📦 Loading NestJS...');
    const { NestFactory } = require('@nestjs/core');
    const { ExpressAdapter } = require('@nestjs/platform-express');
    const express = require('express');
    
    console.log('📦 Loading AppModule from:', process.cwd());
    const { AppModule } = require('./dist/app.module');
    
    console.log('✅ All modules loaded, creating app...');
    
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter, {
      logger: ['error', 'warn'],
    });
    
    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: true });
    
    await app.init();
    console.log('✅ NestJS initialized');
    
    return new Promise((resolve) => {
      adapter.getInstance()(req, res, () => resolve(undefined));
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to initialize',
      message: error.message,
      stack: error.stack,
      cwd: process.cwd(),
    });
  }
}
