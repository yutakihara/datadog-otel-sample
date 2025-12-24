import { trace } from '@opentelemetry/api';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

function getTraceContext() {
  const span = trace.getActiveSpan();
  if (!span) return {};
  
  const spanContext = span.spanContext();
  return {
    dd: {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    },
  };
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const traceContext = getTraceContext();
  
  const logEntry = {
    timestamp,
    level,
    message,
    service: process.env.DD_SERVICE || 'datadog-otel-sample',
    env: process.env.DD_ENV || 'production',
    ...traceContext,
    ...context,
  };

  // JSON形式で出力（Vercel Log Drains で Datadog に送信される）
  console.log(JSON.stringify(logEntry));
}

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
  debug: (message: string, context?: LogContext) => log('debug', message, context),
};

