import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export function register() {
  const apiKey = process.env.DD_API_KEY;
  const site = process.env.DD_SITE || 'datadoghq.com';
  const serviceName = process.env.DD_SERVICE || 'datadog-otel-sample';
  const serviceVersion = process.env.DD_VERSION || '1.0.0';
  const environment = process.env.DD_ENV || 'production';

  // Prisma自動計装
  // https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/opentelemetry-tracing
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

  // OTLPトレースエクスポーター（Datadog用）
  const traceExporter = new OTLPTraceExporter({
    url: endpoint,
    headers: { 'DD-API-KEY': apiKey },
  });

  // @vercel/otel + PrismaInstrumentation
  registerOTel({
    serviceName,
    traceExporter,
    attributes: {
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      'deployment.environment': environment,
    },
    instrumentations: [prismaInstrumentation],
  });

  console.log(`[OTEL] Registered with Datadog: ${endpoint}`);
  console.log(`[OTEL] Service: ${serviceName}, Version: ${serviceVersion}, Env: ${environment}`);
  console.log('[OTEL] Prisma instrumentation enabled');
}
