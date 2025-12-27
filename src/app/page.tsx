'use client';

import { useState } from 'react';

interface ApiResponse {
  message?: string;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    displayName: string;
  }>;
  count?: number;
  timestamp?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  results?: Record<string, unknown>;
  data?: unknown;
  error?: string;
  note?: string;
  mode?: string;
  source?: string;
  queryPattern?: string;
  action?: string;
  operations?: string[];
  orm?: string;
  instrumentation?: string;
}

export default function Home() {
  const [responses, setResponses] = useState<Array<{ endpoint: string; data: ApiResponse; status: number }>>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  const callApi = async (endpoint: string, options?: RequestInit) => {
    setLoading(endpoint);
    try {
      const res = await fetch(endpoint, options);
      const data = await res.json();
      setResponses(prev => [
        { endpoint, data, status: res.status },
        ...prev.slice(0, 9),
      ]);
    } catch (error) {
      console.error('API call failed:', error);
      setResponses(prev => [
        { 
          endpoint, 
          data: { error: String(error), timestamp: new Date().toISOString() },
          status: 500 
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setLoading(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail) return;
    await callApi('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newUserName, email: newUserEmail }),
    });
    setNewUserName('');
    setNewUserEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* ヘッダー */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Datadog + OpenTelemetry Demo
          </h1>
          <p className="text-slate-400 text-lg">
            Next.js App with Datadog RUM & Vercel OTEL Auto-Instrumentation
          </p>
          <div className="mt-4 flex justify-center gap-3 text-sm flex-wrap">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full">
              🔍 RUM
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
              📊 Auto Tracing
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full">
              🌐 HTTP
            </span>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full">
              🗄️ Prisma/PostgreSQL
            </span>
            <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full">
              🔷 Drizzle ORM
            </span>
          </div>
        </header>

        {/* API呼び出しセクション */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">API Endpoints</h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Hello API */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-2 text-cyan-400">GET /api/hello</h3>
              <p className="text-slate-400 text-sm mb-4">
                シンプルなHello APIエンドポイント。
              </p>
              <button
                onClick={() => callApi('/api/hello')}
                disabled={loading === '/api/hello'}
                className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                {loading === '/api/hello' ? '呼び出し中...' : 'APIを呼び出す'}
              </button>
            </div>

            {/* External API */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-2 text-green-400">GET /api/external</h3>
              <p className="text-slate-400 text-sm mb-4">
                外部API呼び出し（fetch自動計装）
              </p>
              <button
                onClick={() => callApi('/api/external')}
                disabled={loading === '/api/external'}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                {loading === '/api/external' ? '呼び出し中...' : '外部APIを呼び出す'}
              </button>
            </div>

            {/* DB CRUD Operations */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 md:col-span-2 border-yellow-500/50">
              <h3 className="text-xl font-semibold mb-2 text-yellow-400">🗄️ Database CRUD (Prisma + Supabase)</h3>
              <p className="text-slate-400 text-sm mb-4">
                <span className="text-yellow-300">Prisma自動計装</span>により各SQLクエリがスパンとして記録されます。<br/>
                Create, Read, Update, Delete操作でDatadogにスパンが送信されます。
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => callApi('/api/db?action=list')}
                  disabled={loading === '/api/db?action=list'}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/db?action=list' ? '...' : '📋 一覧取得'}
                </button>
                <button
                  onClick={() => callApi('/api/db?action=create')}
                  disabled={loading === '/api/db?action=create'}
                  className="py-2 px-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/db?action=create' ? '...' : '➕ データ作成'}
                </button>
                <button
                  onClick={() => callApi('/api/db?action=query')}
                  disabled={loading === '/api/db?action=query'}
                  className="py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/db?action=query' ? '...' : '🔍 複数クエリ'}
                </button>
                <button
                  onClick={() => callApi('/api/db?action=delete')}
                  disabled={loading === '/api/db?action=delete'}
                  className="py-2 px-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/db?action=delete' ? '...' : '🗑️ テスト削除'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                operations: findMany, create, count, deleteMany, $transaction, $queryRaw
              </p>
            </div>

            {/* N+1 Problem Test (Prisma) */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 md:col-span-2 border-orange-500/50">
              <h3 className="text-xl font-semibold mb-2 text-orange-400">⚠️ N+1問題テスト (Prisma)</h3>
              <p className="text-slate-400 text-sm mb-4">
                N+1パターンと最適化パターンを比較してDatadogでスパン数の違いを確認できます。
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => callApi('/api/n-plus-one?mode=n-plus-one')}
                  disabled={loading === '/api/n-plus-one?mode=n-plus-one'}
                  className="py-2 px-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  {loading === '/api/n-plus-one?mode=n-plus-one' ? '実行中...' : '❌ N+1パターン'}
                </button>
                <button
                  onClick={() => callApi('/api/n-plus-one?mode=optimized')}
                  disabled={loading === '/api/n-plus-one?mode=optimized'}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  {loading === '/api/n-plus-one?mode=optimized' ? '実行中...' : '✅ 最適化パターン'}
                </button>
              </div>
            </div>

            {/* Drizzle ORM + @kubiks/otel-drizzle */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 md:col-span-2 border-teal-500/50">
              <h3 className="text-xl font-semibold mb-2 text-teal-400">🔷 Drizzle ORM + @kubiks/otel-drizzle</h3>
              <p className="text-slate-400 text-sm mb-4">
                <span className="text-teal-300">@kubiks/otel-drizzle</span>による自動計装。<br/>
                すべてのDB操作が自動的にOpenTelemetryスパンとして記録されます。
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={() => callApi('/api/drizzle?action=list')}
                  disabled={loading === '/api/drizzle?action=list'}
                  className="py-2 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/drizzle?action=list' ? '...' : '📋 一覧取得'}
                </button>
                <button
                  onClick={() => callApi('/api/drizzle?action=create')}
                  disabled={loading === '/api/drizzle?action=create'}
                  className="py-2 px-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/drizzle?action=create' ? '...' : '➕ データ作成'}
                </button>
                <button
                  onClick={() => callApi('/api/drizzle?action=n-plus-one')}
                  disabled={loading === '/api/drizzle?action=n-plus-one'}
                  className="py-2 px-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/drizzle?action=n-plus-one' ? '...' : '❌ N+1パターン'}
                </button>
                <button
                  onClick={() => callApi('/api/drizzle?action=optimized')}
                  disabled={loading === '/api/drizzle?action=optimized'}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/drizzle?action=optimized' ? '...' : '✅ 最適化パターン'}
                </button>
                <button
                  onClick={() => callApi('/api/drizzle?action=delete')}
                  disabled={loading === '/api/drizzle?action=delete'}
                  className="py-2 px-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors text-sm"
                >
                  {loading === '/api/drizzle?action=delete' ? '...' : '🗑️ テスト削除'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                お客様環境（Drizzle + Supabase）と同等の構成でテスト可能
              </p>
            </div>

            {/* Users API - POST */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 md:col-span-2">
              <h3 className="text-xl font-semibold mb-2 text-pink-400">POST /api/users</h3>
              <p className="text-slate-400 text-sm mb-4">
                新しいユーザーを作成（メモリ内のみ）
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="名前"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-pink-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-pink-500 focus:outline-none"
                />
                <button
                  onClick={handleCreateUser}
                  disabled={loading === '/api/users' || !newUserName || !newUserEmail}
                  className="py-2 px-6 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* レスポンス表示セクション */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">API Responses</h2>
          
          {responses.length === 0 ? (
            <p className="text-center text-slate-500">
              APIを呼び出すとレスポンスがここに表示されます
            </p>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {responses.map((response, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-cyan-400">
                      {response.endpoint}
                    </span>
                    <div className="flex items-center gap-2">
                      {response.data.orm && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          response.data.orm === 'drizzle'
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {response.data.orm}
                        </span>
                      )}
                      {response.data.action && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-500/20 text-slate-400">
                          {response.data.action}
                        </span>
                      )}
                      {response.data.mode && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          response.data.mode === 'n-plus-one'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {response.data.mode}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        response.status >= 200 && response.status < 300
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {response.status}
                      </span>
                    </div>
                  </div>
                  {response.data.operations && (
                    <div className="mb-2 text-xs text-yellow-400 font-mono">
                      Operations: {response.data.operations.join(', ')}
                    </div>
                  )}
                  {response.data.queryPattern && (
                    <div className="mb-2 text-xs text-orange-400 font-mono">
                      Query Pattern: {response.data.queryPattern}
                    </div>
                  )}
                  <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
                    <pre className="text-sm text-slate-300 font-mono">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* フッター */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>
            @vercel/otel + @kubiks/otel-drizzle による自動計装
          </p>
          <p className="mt-2">
            DatadogでDrizzle ORMのスパンを確認できます
          </p>
        </footer>
      </div>
    </div>
  );
}
