import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  logger.info('Hello API called');

  // 処理をシミュレート
  await new Promise(resolve => setTimeout(resolve, 50));

  const response = {
    message: 'Hello from Next.js API with OpenTelemetry!',
    timestamp: new Date().toISOString(),
  };

  logger.info('Hello API completed', { duration_ms: 50 });

  return NextResponse.json(response);
}
