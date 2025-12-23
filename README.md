# Datadog + OpenTelemetry Sample App

Next.js アプリケーションで Datadog RUM（フロントエンド）と OpenTelemetry（バックエンド）を使用したサンプルです。

## 機能

- 🔍 **Datadog RUM**: フロントエンドのリアルユーザーモニタリング
- 📊 **OpenTelemetry**: バックエンドの分散トレーシング（Datadog OTLP Exporter使用）
- 📝 **ログ出力**: APIエンドポイントでのログ出力
- 🔗 **APM連携**: フロントエンドとバックエンドのトレース接続

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        Datadog                               │
│  ┌─────────────┐                    ┌─────────────────────┐ │
│  │  RUM        │                    │  APM (Traces)       │ │
│  │  Dashboard  │                    │  Dashboard          │ │
│  └──────▲──────┘                    └──────────▲──────────┘ │
└─────────┼───────────────────────────────────────┼───────────┘
          │                                       │
          │ RUM SDK                               │ OTLP HTTP
          │                                       │
┌─────────┴───────────────────────────────────────┴───────────┐
│                     Vercel (Next.js)                         │
│  ┌─────────────────────┐      ┌─────────────────────────┐   │
│  │  Frontend           │      │  Backend (API Routes)   │   │
│  │  - DatadogRumProvider│      │  - @vercel/otel         │   │
│  │  - @datadog/browser-rum│    │  - OTLPTraceExporter    │   │
│  └─────────────────────┘      └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

以下の環境変数を設定してください：

#### Datadog RUM（フロントエンド）

[Datadog RUM アプリケーション](https://app.datadoghq.com/rum/application/create)を作成し、以下を設定：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_DATADOG_APPLICATION_ID` | RUM Application ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN` | RUM Client Token | `pubxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `NEXT_PUBLIC_DATADOG_SITE` | Datadog サイト | `datadoghq.com` |
| `NEXT_PUBLIC_DATADOG_SERVICE` | サービス名 | `datadog-otel-sample` |
| `NEXT_PUBLIC_DATADOG_ENV` | 環境名 | `production` |

#### OpenTelemetry（バックエンド）- Datadog OTLP Exporter

[Datadog API Key](https://app.datadoghq.com/organization-settings/api-keys)を取得し、以下を設定：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DD_API_KEY` | Datadog API Key | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `DD_SITE` | Datadog サイト | `datadoghq.com` |
| `DD_SERVICE` | サービス名 | `datadog-otel-sample` |
| `DD_ENV` | 環境名 | `production` |
| `DD_VERSION` | バージョン | `1.0.0` |

**Datadog サイト一覧:**

| サイト | DD_SITE | OTLP エンドポイント |
|--------|---------|-------------------|
| US1 | `datadoghq.com` | `https://otlp.datadoghq.com:4318/v1/traces` |
| US3 | `us3.datadoghq.com` | `https://otlp.us3.datadoghq.com:4318/v1/traces` |
| US5 | `us5.datadoghq.com` | `https://otlp.us5.datadoghq.com:4318/v1/traces` |
| EU | `datadoghq.eu` | `https://otlp.datadoghq.eu:4318/v1/traces` |
| AP1 | `ap1.datadoghq.com` | `https://otlp.ap1.datadoghq.com:4318/v1/traces` |

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## API エンドポイント

### GET /api/hello

シンプルなHello APIエンドポイント。基本的なトレースを生成します。

### GET /api/users

ユーザー一覧を取得。データベース操作とデータ変換のトレースを生成します。

### POST /api/users

新しいユーザーを作成。バリデーションとDB挿入のトレースを生成します。

## Vercel へのデプロイ

### 1. GitHub にプッシュ

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercel でインポート

1. [Vercel Dashboard](https://vercel.com/new) にアクセス
2. GitHub リポジトリをインポート
3. 環境変数を設定
4. デプロイ

### Vercel 環境変数

Vercel のプロジェクト設定で以下の環境変数を設定してください：

#### フロントエンド（RUM）

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_DATADOG_APPLICATION_ID` | Datadog RUM Application ID |
| `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN` | Datadog RUM Client Token |
| `NEXT_PUBLIC_DATADOG_SITE` | Datadog サイト (例: datadoghq.com) |
| `NEXT_PUBLIC_DATADOG_SERVICE` | サービス名 |
| `NEXT_PUBLIC_DATADOG_ENV` | 環境名 (production) |

#### バックエンド（OTEL → Datadog）

| 変数名 | 説明 |
|--------|------|
| `DD_API_KEY` | Datadog API Key |
| `DD_SITE` | Datadog サイト (例: datadoghq.com) |
| `DD_SERVICE` | サービス名 |
| `DD_ENV` | 環境名 |
| `DD_VERSION` | バージョン |

## 確認方法

### フロントエンド（RUM）

1. ブラウザの DevTools を開く
2. コンソールで `[Datadog RUM] Initialized successfully` を確認
3. [Datadog RUM Dashboard](https://app.datadoghq.com/rum) でセッションを確認

### バックエンド（OTEL）

1. API エンドポイントを呼び出し
2. レスポンスの `traceId` を確認
3. [Datadog APM](https://app.datadoghq.com/apm/traces) でトレースを確認
4. サーバーログで `[Instrumentation] OpenTelemetry registered with Datadog Exporter` を確認

## 技術スタック

- [Next.js](https://nextjs.org/) - React フレームワーク
- [@datadog/browser-rum](https://docs.datadoghq.com/real_user_monitoring/) - Datadog RUM SDK
- [@vercel/otel](https://vercel.com/docs/tracing/instrumentation) - Vercel OpenTelemetry
- [@opentelemetry/exporter-trace-otlp-http](https://www.npmjs.com/package/@opentelemetry/exporter-trace-otlp-http) - OTLP HTTP Exporter
- [OpenTelemetry](https://opentelemetry.io/) - 分散トレーシング

## 参考リンク

- [Datadog RUM for Next.js](https://docs.datadoghq.com/real_user_monitoring/guide/monitor-your-nextjs-app-with-rum/)
- [Vercel OpenTelemetry](https://vercel.com/docs/tracing/instrumentation)
- [Datadog OTLP Ingest](https://docs.datadoghq.com/opentelemetry/interoperability/otlp_ingest_in_the_agent/)
- [Datadog OpenTelemetry](https://docs.datadoghq.com/opentelemetry/)
