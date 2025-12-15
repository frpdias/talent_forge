import { Handler, Context, Callback } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import { AppModule } from './app.module';

let cachedHandler: Handler | null = null;

async function bootstrap(): Promise<Handler> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, {
    bodyParser: true,
  });
  await app.init();
  return serverlessExpress({
    app: adapter.getInstance(),
  });
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }
  return (cachedHandler as Handler)(event, context, callback);
};
