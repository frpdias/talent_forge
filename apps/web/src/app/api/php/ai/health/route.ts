import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    status: 'operational',
    version: '2.0.0',
    provider: hasOpenAI ? 'openai' : 'unavailable',
    features: [
      'chat',
      'report',
      'predict-turnover',
      'forecast-performance',
      'smart-recommendations',
    ],
    timestamp: new Date().toISOString(),
  });
}
