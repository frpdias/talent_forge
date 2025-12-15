// Simple health check endpoint for debugging
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    message: 'Vercel function is working',
    timestamp: new Date().toISOString(),
    env: {
      nodeVersion: process.version,
      platform: process.platform,
    }
  });
}
