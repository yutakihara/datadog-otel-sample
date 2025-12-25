import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 外部APIを呼び出して自動計装を確認
// fetch は OpenTelemetry により自動計装される

export async function GET() {
  logger.info('External API test started');

  const results: Record<string, unknown> = {};

  try {
    // 1. JSONPlaceholder API - ユーザー取得
    logger.info('Fetching users from JSONPlaceholder');
    const usersRes = await fetch('https://jsonplaceholder.typicode.com/users?_limit=3');
    const users = await usersRes.json();
    results.users = { count: users.length, status: usersRes.status };

    // 2. JSONPlaceholder API - 投稿取得
    logger.info('Fetching posts from JSONPlaceholder');
    const postsRes = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    const posts = await postsRes.json();
    results.posts = { count: posts.length, status: postsRes.status };

    // 3. JSONPlaceholder API - コメント取得
    logger.info('Fetching comments from JSONPlaceholder');
    const commentsRes = await fetch('https://jsonplaceholder.typicode.com/comments?_limit=3');
    const comments = await commentsRes.json();
    results.comments = { count: comments.length, status: commentsRes.status };

    // 4. 並列リクエスト
    logger.info('Fetching multiple resources in parallel');
    const [todosRes, albumsRes] = await Promise.all([
      fetch('https://jsonplaceholder.typicode.com/todos?_limit=3'),
      fetch('https://jsonplaceholder.typicode.com/albums?_limit=3'),
    ]);
    const [todos, albums] = await Promise.all([todosRes.json(), albumsRes.json()]);
    results.parallel = {
      todos: { count: todos.length, status: todosRes.status },
      albums: { count: albums.length, status: albumsRes.status },
    };

    // 5. HTTPBin API - エコーテスト
    logger.info('Testing HTTPBin echo');
    const echoRes = await fetch('https://httpbin.org/get');
    const echo = await echoRes.json();
    results.httpbin = { origin: echo.origin, status: echoRes.status };

    logger.info('External API test completed', { 
      totalRequests: 6,
      success: true 
    });

    return NextResponse.json({
      message: 'External API calls completed',
      results,
      timestamp: new Date().toISOString(),
      note: 'Check Datadog APM for fetch spans',
    });

  } catch (error) {
    logger.error('External API test failed', { error: String(error) });
    return NextResponse.json(
      { error: 'External API call failed', details: String(error) },
      { status: 500 }
    );
  }
}
