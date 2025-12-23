import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function register() {
  // Datadog OTLP Ingest API の設定
  // https://docs.datadoghq.com/opentelemetry/interoperability/otlp_ingest_in_the_agent/
  const datadogApiKey = process.env.DD_API_KEY;
  const datadogSite = process.env.DD_SITE || 'datadoghq.com';
  
  // Datadog OTLP エンドポイント
  // US1: https://otlp.datadoghq.com
  // EU: https://otlp.datadoghq.eu
  // US3: https://otlp.us3.datadoghq.com
  // US5: https://otlp.us5.datadoghq.com
  // AP1: https://otlp.ap1.datadoghq.com
  const otlpEndpoint = `https://otlp.${datadogSite === 'datadoghq.com' ? '' : datadogSite.replace('datadoghq.', '') + '.'}datadoghq.com`;
  const tracesEndpoint = `${datadogSite === 'datadoghq.com' ? 'https://otlp.datadoghq.com' : `https://otlp.${datadogSite.replace('datadoghq.', '').replace('.com', '')}.datadoghq.com`}:4318/v1/traces`;

  console.log('[Instrumentation] Initializing OpenTelemetry...');
  console.log(`[Instrumentation] DD_SITE: ${datadogSite}`);
  console.log(`[Instrumentation] DD_API_KEY configured: ${datadogApiKey ? 'Yes' : 'No'}`);

  if (datadogApiKey) {
    // Datadog OTLP HTTP Exporter を設定
    const traceExporter = new OTLPTraceExporter({
      url: tracesEndpoint,
      headers: {
        'DD-API-KEY': datadogApiKey,
      },
    });

    registerOTel({
      serviceName: process.env.DD_SERVICE || 'datadog-otel-sample',
      traceExporter,
      attributes: {
        'deployment.environment': process.env.DD_ENV || 'production',
        'service.version': process.env.DD_VERSION || '1.0.0',
      },
    });

    console.log(`[Instrumentation] OpenTelemetry registered with Datadog Exporter`);
    console.log(`[Instrumentation] Traces endpoint: ${tracesEndpoint}`);
  } else {
    // API Keyがない場合はデフォルト設定（ログ出力のみ）
    registerOTel({
      serviceName: 'datadog-otel-sample',
    });

    console.log('[Instrumentation] OpenTelemetry registered without Datadog Exporter');
    console.log('[Instrumentation] Set DD_API_KEY environment variable to enable Datadog export');
  }
}
