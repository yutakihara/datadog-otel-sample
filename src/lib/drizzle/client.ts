import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
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
  
  // pg Pool を作成
  // @opentelemetry/instrumentation-pg が自動的にこのPoolをインストルメントする
  const pool = new Pool({
    connectionString,
    max: 5,
    ssl: { rejectUnauthorized: false }, // Supabase接続用
  });
  
  // Drizzle ORM インスタンスを作成
  const db = drizzle(pool, { schema });
  
  console.log("[Drizzle] Client initialized with pg driver (auto-instrumented by @opentelemetry/instrumentation-pg)");
  
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
