import { drizzle } from "drizzle-orm/postgres-js";
import { instrumentDrizzleClient } from "@kubiks/otel-drizzle";
import postgres from "postgres";
import * as schema from "./schema";

// DATABASE_URL が設定されているかチェック
export const isDrizzleConfigured = !!process.env.DATABASE_URL;

// Drizzle クライアントを初期化
function createDrizzleClient() {
  if (!isDrizzleConfigured) {
    console.log("[Drizzle] DATABASE_URL not set, skipping initialization");
    return null;
  }

  const connectionString = process.env.DATABASE_URL!;
  
  // postgres.js クライアントを作成
  // prepare: false は Supabase の PgBouncer 互換のため
  const client = postgres(connectionString, { 
    prepare: false,
    max: 5,
  });
  
  // Drizzle ORM インスタンスを作成
  const db = drizzle(client, { schema });
  
  // 🔥 @kubiks/otel-drizzle で自動計装を適用
  // これにより、すべてのDB操作が自動的にOpenTelemetryスパンになる
  instrumentDrizzleClient(db, {
    dbSystem: "postgresql",           // データベースシステム
    dbName: "postgres",               // データベース名
    captureQueryText: true,           // SQLクエリをスパンに含める
    maxQueryTextLength: 2000,         // クエリ文字列の最大長
  });
  
  console.log("[Drizzle] Client initialized with OpenTelemetry instrumentation");
  
  return db;
}

// シングルトンパターンでクライアントを管理
declare global {
  // eslint-disable-next-line no-var
  var drizzleDb: ReturnType<typeof createDrizzleClient> | undefined;
}

export const drizzleDb = isDrizzleConfigured
  ? (global.drizzleDb || createDrizzleClient())
  : null;

if (isDrizzleConfigured && process.env.NODE_ENV !== "production") {
  global.drizzleDb = drizzleDb;
}

// スキーマもエクスポート
export * from "./schema";

