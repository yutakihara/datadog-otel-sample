import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// N+1問題を確認するためのエンドポイント

// モックデータ（DB未設定時）
const mockAuthors = [
  { id: 1, name: '山田太郎', email: 'yamada@example.com' },
  { id: 2, name: '鈴木花子', email: 'suzuki@example.com' },
  { id: 3, name: '田中一郎', email: 'tanaka@example.com' },
];

const mockPosts = [
  { id: 1, title: '初めての投稿', authorId: 1, published: true },
  { id: 2, title: 'Next.jsについて', authorId: 1, published: true },
  { id: 3, title: 'OpenTelemetry入門', authorId: 2, published: true },
  { id: 4, title: 'Datadog活用術', authorId: 2, published: false },
  { id: 5, title: 'N+1問題とは', authorId: 3, published: true },
];

const mockComments = [
  { id: 1, content: '素晴らしい記事です！', postId: 1 },
  { id: 2, content: '参考になりました', postId: 1 },
  { id: 3, content: 'もっと詳しく知りたい', postId: 2 },
  { id: 4, content: 'わかりやすい', postId: 3 },
  { id: 5, content: '実践的ですね', postId: 5 },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'n-plus-one';

  logger.info('N+1 API called', { mode, dbConfigured: isDatabaseConfigured });

  try {
    if (isDatabaseConfigured && prisma) {
      if (mode === 'n-plus-one') {
        return await handleNPlusOneWithDB();
      } else {
        return await handleOptimizedWithDB();
      }
    } else {
      if (mode === 'n-plus-one') {
        return await handleNPlusOneMock();
      } else {
        return await handleOptimizedMock();
      }
    }
  } catch (error) {
    logger.error('N+1 API error', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}

// N+1パターン - DB
async function handleNPlusOneWithDB() {
  logger.info('Executing N+1 pattern with DB');

  const authors = await prisma!.author.findMany();
  logger.info('Fetched authors', { count: authors.length });

  const authorsWithPosts = await Promise.all(
    authors.map(async (author) => {
      const posts = await prisma!.post.findMany({
        where: { authorId: author.id },
      });

      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          const comments = await prisma!.comment.findMany({
            where: { postId: post.id },
          });
          return { ...post, comments, commentCount: comments.length };
        })
      );

      return {
        ...author,
        posts: postsWithComments,
        postCount: posts.length,
      };
    })
  );

  logger.info('N+1 pattern completed', {
    authorCount: authors.length,
    totalQueries: 1 + authors.length + authorsWithPosts.reduce((sum, a) => sum + a.postCount, 0),
  });

  return NextResponse.json({
    mode: 'n-plus-one',
    message: 'N+1問題パターン - 各関連データを個別クエリで取得',
    data: authorsWithPosts,
    queryPattern: `1 (authors) + ${authors.length} (posts) + N (comments) = 多数のクエリ`,
    note: 'Datadogで各SQLクエリがスパンとして表示されます',
    timestamp: new Date().toISOString(),
  });
}

// 最適化パターン - DB
async function handleOptimizedWithDB() {
  logger.info('Executing optimized pattern with DB');

  const authors = await prisma!.author.findMany({
    include: {
      posts: {
        include: {
          comments: true,
        },
      },
    },
  });

  const result = authors.map((author) => ({
    ...author,
    postCount: author.posts.length,
    posts: author.posts.map((post) => ({
      ...post,
      commentCount: post.comments.length,
    })),
  }));

  logger.info('Optimized pattern completed', {
    authorCount: authors.length,
    totalQueries: 1,
  });

  return NextResponse.json({
    mode: 'optimized',
    message: '最適化パターン - Eager Loadingで一括取得',
    data: result,
    queryPattern: '1クエリ（JOINで取得）',
    note: 'Datadogでは少数のスパンのみ表示されます',
    timestamp: new Date().toISOString(),
  });
}

// N+1パターン - Mock
async function handleNPlusOneMock() {
  logger.info('Executing N+1 pattern with mock data');

  await new Promise((r) => setTimeout(r, 30));
  const authors = [...mockAuthors];

  const authorsWithPosts = await Promise.all(
    authors.map(async (author) => {
      await new Promise((r) => setTimeout(r, 20));
      const posts = mockPosts.filter((p) => p.authorId === author.id);

      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          await new Promise((r) => setTimeout(r, 15));
          const comments = mockComments.filter((c) => c.postId === post.id);
          return { ...post, comments, commentCount: comments.length };
        })
      );

      return {
        ...author,
        posts: postsWithComments,
        postCount: posts.length,
      };
    })
  );

  logger.info('N+1 pattern (mock) completed', {
    authorCount: authors.length,
    simulatedQueries: 1 + authors.length + authorsWithPosts.reduce((sum, a) => sum + a.postCount, 0),
  });

  return NextResponse.json({
    mode: 'n-plus-one',
    source: 'mock',
    message: 'N+1問題パターン（モック） - DATABASE_URL未設定',
    data: authorsWithPosts,
    queryPattern: `1 (authors) + ${authors.length} (posts) + N (comments) = 多数のクエリ`,
    note: '実際のDBで確認する場合はDATABASE_URLを設定してください',
    timestamp: new Date().toISOString(),
  });
}

// 最適化パターン - Mock
async function handleOptimizedMock() {
  logger.info('Executing optimized pattern with mock data');

  await new Promise((r) => setTimeout(r, 50));

  const result = mockAuthors.map((author) => {
    const posts = mockPosts.filter((p) => p.authorId === author.id);
    return {
      ...author,
      postCount: posts.length,
      posts: posts.map((post) => {
        const comments = mockComments.filter((c) => c.postId === post.id);
        return { ...post, comments, commentCount: comments.length };
      }),
    };
  });

  logger.info('Optimized pattern (mock) completed', {
    authorCount: result.length,
    simulatedQueries: 1,
  });

  return NextResponse.json({
    mode: 'optimized',
    source: 'mock',
    message: '最適化パターン（モック） - DATABASE_URL未設定',
    data: result,
    queryPattern: '1クエリ（JOINで取得）',
    note: '実際のDBで確認する場合はDATABASE_URLを設定してください',
    timestamp: new Date().toISOString(),
  });
}
