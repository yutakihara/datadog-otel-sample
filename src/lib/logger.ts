import { trace } from '@opentelemetry/api';

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

const serviceName = process.env.DD_SERVICE || 'datadog-otel-sample';
const env = process.env.DD_ENV || 'production';

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      service: serviceName,
      env: env,
      ...getTraceContext(),
      ...context,
    }));
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      service: serviceName,
      env: env,
      ...getTraceContext(),
      ...context,
    }));
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      service: serviceName,
      env: env,
      ...getTraceContext(),
      ...context,
    }));
  },
};

