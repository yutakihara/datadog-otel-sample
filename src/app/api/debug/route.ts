import { NextResponse } from 'next/server';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  
  return NextResponse.json({
    environment: {
      DATABASE_URL: databaseUrl ? `${databaseUrl.substring(0, 30)}...` : '❌ NOT SET',
      DATABASE_URL_SET: !!databaseUrl,
      DD_API_KEY: process.env.DD_API_KEY ? '✅ SET' : '❌ NOT SET',
      DD_SITE: process.env.DD_SITE || 'datadoghq.com (default)',
      DD_SERVICE: process.env.DD_SERVICE || 'datadog-otel-sample (default)',
      DD_ENV: process.env.DD_ENV || 'production (default)',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'false',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    },
    timestamp: new Date().toISOString(),
  });
}

