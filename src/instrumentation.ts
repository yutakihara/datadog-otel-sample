import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

export function register() {
  const apiKey = process.env.DD_API_KEY;
  const site = process.env.DD_SITE || 'datadoghq.com';
  const serviceName = process.env.DD_SERVICE || 'datadog-otel-sample';
  const serviceVersion = process.env.DD_VERSION || '1.0.0';
  const environment = process.env.DD_ENV || 'production';

  // PostgreSQL自動計装（Datadog用の属性を追加）
  const pgInstrumentation = new PgInstrumentation({
    enhancedDatabaseReporting: true, // SQLクエリをスパンに含める
    
    // リクエストフック: クエリ実行前にDatadog用属性を追加
    requestHook: (span, queryInfo) => {
      // Datadogが期待する必須属性
      span.setAttribute('span.type', 'sql');
      span.setAttribute('db.system', 'postgresql');
      span.setAttribute('db.type', 'postgresql');
      
      // クエリテキストを追加
      if (queryInfo.query?.text) {
        span.setAttribute('db.statement', queryInfo.query.text);
        
        // クエリの種類を抽出（SELECT, INSERT, UPDATE, DELETE等）
        const operation = queryInfo.query.text.trim().split(/\s+/)[0]?.toUpperCase();
        if (operation) {
          span.setAttribute('db.operation', operation);
        }
      }
      
      // データベース名（接続情報から取得）
      if (queryInfo.connection?.database) {
        span.setAttribute('db.name', queryInfo.connection.database);
      }
      if (queryInfo.connection?.host) {
        span.setAttribute('db.host', queryInfo.connection.host);
      }
      if (queryInfo.connection?.port) {
        span.setAttribute('db.port', queryInfo.connection.port);
      }
      if (queryInfo.connection?.user) {
        span.setAttribute('db.user', queryInfo.connection.user);
      }
    },
    
    // レスポンスフック: クエリ実行後に追加情報を設定
    responseHook: (span, responseInfo) => {
      // 結果の行数を追加（利用可能な場合）
      if (responseInfo.data?.rowCount != null) {
        span.setAttribute('db.row_count', responseInfo.data.rowCount);
      }
    },
  });

  if (!apiKey) {
    registerOTel({ 
      serviceName,
      instrumentations: [pgInstrumentation],
    });
    console.log('[OTEL] Registered without Datadog (DD_API_KEY not set)');
    console.log('[OTEL] PostgreSQL instrumentation enabled with Datadog attributes');
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
  console.log('[OTEL] PostgreSQL instrumentation enabled with Datadog attributes');
}
