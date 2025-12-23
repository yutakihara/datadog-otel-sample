# Datadog + OpenTelemetry Sample App

Next.js アプリケーションで Datadog RUM（フロントエンド）と OpenTelemetry（バックエンド）を使用したサンプルです。

## 機能

- 🔍 **Datadog RUM**: フロントエンドのリアルユーザーモニタリング
- 📊 **OpenTelemetry**: バックエンドの分散トレーシング
- 📝 **ログ出力**: APIエンドポイントでのログ出力
- 🔗 **APM連携**: フロントエンドとバックエンドのトレース接続

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

以下の環境変数を設定してください：

#### Datadog RUM（フロントエンド）

1. [Datadog RUM アプリケーション](https://app.datadoghq.com/rum/application/create)を作成
2. 取得した値を設定：

```env
NEXT_PUBLIC_DATADOG_APPLICATION_ID=your-application-id
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=your-client-token
NEXT_PUBLIC_DATADOG_SITE=datadoghq.com
NEXT_PUBLIC_DATADOG_SERVICE=datadog-otel-sample
NEXT_PUBLIC_DATADOG_ENV=production
```

#### OpenTelemetry（バックエンド）

1. [Datadog API Key](https://app.datadoghq.com/organization-settings/api-keys)を取得
2. 設定：

```env
OTEL_EXPORTER_OTLP_ENDPOINT=https://trace.agent.datadoghq.com
OTEL_EXPORTER_OTLP_HEADERS=DD-API-KEY=your-datadog-api-key
OTEL_SERVICE_NAME=datadog-otel-sample
```

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

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_DATADOG_APPLICATION_ID` | Datadog RUM Application ID |
| `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN` | Datadog RUM Client Token |
| `NEXT_PUBLIC_DATADOG_SITE` | Datadog サイト (例: datadoghq.com) |
| `NEXT_PUBLIC_DATADOG_SERVICE` | サービス名 |
| `NEXT_PUBLIC_DATADOG_ENV` | 環境名 (production) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Datadog OTLP エンドポイント |
| `OTEL_EXPORTER_OTLP_HEADERS` | Datadog API Key |

## 確認方法

### フロントエンド（RUM）

1. ブラウザの DevTools を開く
2. コンソールで `[Datadog RUM] Initialized successfully` を確認
3. [Datadog RUM Dashboard](https://app.datadoghq.com/rum) でセッションを確認

### バックエンド（OTEL）

1. API エンドポイントを呼び出し
2. レスポンスの `traceId` を確認
3. [Datadog APM](https://app.datadoghq.com/apm/traces) でトレースを確認

## 技術スタック

- [Next.js](https://nextjs.org/) - React フレームワーク
- [@datadog/browser-rum](https://docs.datadoghq.com/real_user_monitoring/) - Datadog RUM SDK
- [@vercel/otel](https://vercel.com/docs/tracing/instrumentation) - Vercel OpenTelemetry
- [OpenTelemetry](https://opentelemetry.io/) - 分散トレーシング

## 参考リンク

- [Datadog RUM for Next.js](https://docs.datadoghq.com/real_user_monitoring/guide/monitor-your-nextjs-app-with-rum/)
- [Vercel OpenTelemetry](https://vercel.com/docs/tracing/instrumentation)
- [Datadog OpenTelemetry](https://docs.datadoghq.com/opentelemetry/)
