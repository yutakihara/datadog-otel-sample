import { registerOTel } from '@vercel/otel';

export async function register() {
  // Edge runtime では実行しない（Node.js 専用パッケージを使用するため）
  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }

  // OpenTelemetry パッケージを動的インポート（Node.js runtime 専用）
  const { PgInstrumentation } = await import('@opentelemetry/instrumentation-pg');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');

  const apiKey = process.env.DD_API_KEY;
  const site = process.env.DD_SITE || 'datadoghq.com';
  const serviceName = process.env.DD_SERVICE || 'datadog-otel-sample';
  const serviceVersion = process.env.DD_VERSION || '1.0.0';
  const environment = process.env.DD_ENV || 'production';

  // PostgreSQL自動計装
  const pgInstrumentation = new PgInstrumentation({
    enhancedDatabaseReporting: true,
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

  // テスト: serviceName と attributes['service.name'] を異なる値に設定
  // serviceName: registerOTelの第一引数 → 'datadog-otel-sample'
  // attributes['service.name']: リソース属性 → 'datadog-otel-sample-attr'
  registerOTel({
    serviceName,  // 'datadog-otel-sample'
    traceExporter: new OTLPTraceExporter({
      url: endpoint,
      headers: { 'DD-API-KEY': apiKey },
    }),
    attributes: {
      'service.name': `${serviceName}-attr`,  // 異なる値: 'datadog-otel-sample-attr'
      'service.version': serviceVersion,
      'deployment.environment': environment,
    },
    instrumentations: [pgInstrumentation],
  });

  console.log(`[OTEL] Registered with Datadog: ${endpoint}`);
  console.log(`[OTEL] Service: ${serviceName}, Version: ${serviceVersion}, Env: ${environment}`);
  console.log('[OTEL] PostgreSQL instrumentation enabled');
}
