import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Hello API called');

  // 処理をシミュレート
  await new Promise(resolve => setTimeout(resolve, 50));

  const response = {
    message: 'Hello from Next.js API with OpenTelemetry!',
    timestamp: new Date().toISOString(),
  };

  console.log('Hello API completed');

  return NextResponse.json(response);
}
