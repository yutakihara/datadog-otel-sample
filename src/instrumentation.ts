import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function register() {
  const apiKey = process.env.DD_API_KEY;
  const site = process.env.DD_SITE || 'datadoghq.com';
  const serviceName = process.env.DD_SERVICE || 'datadog-otel-sample';

  if (!apiKey) {
    registerOTel({ serviceName });
    console.log('[OTEL] Registered without Datadog (DD_API_KEY not set)');
    return;
  }

  const endpoint = site === 'datadoghq.com'
    ? 'https://otlp.datadoghq.com:4318/v1/traces'
    : `https://otlp.${site.replace('datadoghq.', '').replace('.com', '')}.datadoghq.com:4318/v1/traces`;

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
  });

  console.log(`[OTEL] Registered with Datadog: ${endpoint}`);
}
