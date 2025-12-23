'use client';

import { useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';

export function DatadogRumProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 環境変数が設定されている場合のみ初期化
    const applicationId = process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID;
    const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;
    const site = process.env.NEXT_PUBLIC_DATADOG_SITE || 'datadoghq.com';
    const service = process.env.NEXT_PUBLIC_DATADOG_SERVICE || 'datadog-otel-sample';
    const env = process.env.NEXT_PUBLIC_DATADOG_ENV || 'development';

    if (applicationId && clientToken) {
      datadogRum.init({
        applicationId,
        clientToken,
        site,
        service,
        env,
        version: '1.0.0',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 100,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
        // APMとの連携（バックエンドトレースとの接続）
        allowedTracingUrls: [
          { match: /https?:\/\/.*/, propagatorTypes: ['tracecontext', 'datadog'] },
        ],
      });

      console.log('[Datadog RUM] Initialized successfully');
    } else {
      console.log('[Datadog RUM] Skipped initialization - missing environment variables');
      console.log('  Set NEXT_PUBLIC_DATADOG_APPLICATION_ID and NEXT_PUBLIC_DATADOG_CLIENT_TOKEN');
    }
  }, []);

  return <>{children}</>;
}

