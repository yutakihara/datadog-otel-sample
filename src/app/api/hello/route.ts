import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[API /hello] Request received');

  // 処理をシミュレート
  await new Promise(resolve => setTimeout(resolve, 50));

  const response = {
    message: 'Hello from Next.js API with OpenTelemetry!',
    timestamp: new Date().toISOString(),
  };

  console.log('[API /hello] Response sent');

  return NextResponse.json(response);
}
