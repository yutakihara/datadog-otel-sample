import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';

export function register() {
  const apiKey = process.env.DD_API_KEY;
  const site = process.env.DD_SITE || 'datadoghq.com';
  const serviceName = process.env.DD_SERVICE || 'datadog-otel-sample';

  // Prisma自動計装
  const prismaInstrumentation = new PrismaInstrumentation();

  if (!apiKey) {
    registerOTel({ 
      serviceName,
      instrumentations: [prismaInstrumentation],
    });
    console.log('[OTEL] Registered without Datadog (DD_API_KEY not set)');
    console.log('[OTEL] Prisma instrumentation enabled');
    return;
  }

  // Datadog OTLP Ingest Endpoint
  // https://docs.datadoghq.com/opentelemetry/setup/otlp_ingest/traces/
  const endpoint = site === 'datadoghq.com'
    ? 'https://otlp.datadoghq.com/v1/traces'
    : `https://otlp.${site.replace('datadoghq.', '').replace('.com', '')}.datadoghq.com/v1/traces`;

  registerOTel({
    serviceName,
    traceExporter: new OTLPTraceExporter({
      url: endpoint,
      headers: { 'DD-API-KEY': apiKey },
    }),
    attributes: {
      'deployment.environment': process.env.DD_ENV || 'production',
      'service.version': process.env.DD_VERSION || '1.0.0',
    },
    instrumentations: [prismaInstrumentation],
  });

  console.log(`[OTEL] Registered with Datadog: ${endpoint}`);
  console.log('[OTEL] Prisma instrumentation enabled');
}
