import type { VercelRequest, VercelResponse } from '@vercel/node';

// Ultra simple test - no NestJS
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // First, test if basic handler works
  if (req.url?.includes('/test')) {
    return res.status(200).json({
      status: 'ok',
      message: 'Basic Vercel function works!',
      url: req.url,
      cwd: process.cwd(),
      nodeVersion: process.version,
    });
  }

  // Try to load NestJS
  try {
    console.log('Starting NestJS bootstrap...');
    console.log('CWD:', process.cwd());
    
    // Check if dist exists
    const fs = await import('fs');
    const path = await import('path');
    
    const distPath = path.join(process.cwd(), 'dist');
    const distExists = fs.existsSync(distPath);
    console.log('Dist exists:', distExists);
    
    if (!distExists) {
      return res.status(500).json({
        error: 'dist folder not found',
        cwd: process.cwd(),
        distPath,
      });
    }

    const appModulePath = path.join(distPath, 'app.module.js');
    const appModuleExists = fs.existsSync(appModulePath);
    console.log('AppModule exists:', appModuleExists);
    
    if (!appModuleExists) {
      const distFiles = fs.readdirSync(distPath);
      return res.status(500).json({
        error: 'app.module.js not found',
        distPath,
        distFiles,
      });
    }

    // Dynamic imports
    const { NestFactory } = await import('@nestjs/core');
    const { ExpressAdapter } = await import('@nestjs/platform-express');
    const express = (await import('express')).default;
    const { AppModule } = await import(appModulePath);
    
    console.log('All imports successful');

    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    
    const app = await NestFactory.create(AppModule, adapter, {
      logger: ['error', 'warn'],
    });

    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: true, credentials: true });

    await app.init();
    console.log('NestJS initialized successfully');

    return expressApp(req, res);
    
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to initialize',
      message: error.message,
      stack: error.stack,
      cwd: process.cwd(),
    });
  }
}
