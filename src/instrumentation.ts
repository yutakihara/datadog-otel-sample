import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({
    serviceName: 'datadog-otel-sample',
    // Datadogへトレースを送信するためのOTLP設定
    // 環境変数 OTEL_EXPORTER_OTLP_ENDPOINT と OTEL_EXPORTER_OTLP_HEADERS で設定
  });
  
  console.log('[Instrumentation] OpenTelemetry registered with service: datadog-otel-sample');
}

