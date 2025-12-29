import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

export function register() {
  const apiKey = process.env.DD_API_KEY;
  const site = process.env.DD_SITE || 'datadoghq.com';
  const serviceName = process.env.DD_SERVICE || 'datadog-otel-sample';
  const serviceVersion = process.env.DD_VERSION || '1.0.0';
  const environment = process.env.DD_ENV || 'production';

  // PostgreSQL自動計装
  const pgInstrumentation = new PgInstrumentation({
    enhancedDatabaseReporting: true, // SQLクエリをスパンに含める
  });

  if (!apiKey) {
    registerOTel({ 
      serviceName,
      instrumentations: [pgInstrumentation],
    });
    console.log('[OTEL] Registered without Datadog (DD_API_KEY not set)');
    console.log('[OTEL] PostgreSQL instrumentation enabled');
    return;
  }

  // Datadog OTLP Ingest Endpoint
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
      'service.name': serviceName,
      'service.version': serviceVersion,
      'deployment.environment': environment,
    },
    instrumentations: [pgInstrumentation],
  });

  console.log(`[OTEL] Registered with Datadog: ${endpoint}`);
  console.log(`[OTEL] Service: ${serviceName}, Version: ${serviceVersion}, Env: ${environment}`);
  console.log('[OTEL] PostgreSQL instrumentation enabled');
}
