import { NextResponse } from 'next/server';
import { trace, SpanStatusCode } from '@opentelemetry/api';

// トレーサーを取得
const tracer = trace.getTracer('hello-api');

export async function GET() {
  // カスタムスパンを作成
  return tracer.startActiveSpan('hello-api-handler', async (span) => {
    try {
      console.log('[API /hello] Request received');
      
      // メタデータを追加
      span.setAttribute('api.name', 'hello');
      span.setAttribute('api.method', 'GET');
      
      // 処理をシミュレート
      await tracer.startActiveSpan('process-data', async (childSpan) => {
        childSpan.setAttribute('operation', 'data-processing');
        
        // 少し待機（処理をシミュレート）
        await new Promise(resolve => setTimeout(resolve, 50));
        
        console.log('[API /hello] Data processed');
        childSpan.end();
      });

      const response = {
        message: 'Hello from Next.js API with OpenTelemetry!',
        timestamp: new Date().toISOString(),
        traceId: span.spanContext().traceId,
      };

      console.log('[API /hello] Response sent', { traceId: response.traceId });
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return NextResponse.json(response);
    } catch (error) {
      console.error('[API /hello] Error:', error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.end();
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}

