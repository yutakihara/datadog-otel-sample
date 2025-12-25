import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// データベース CRUD 操作テスト用エンドポイント

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';

  logger.info('DB API called', { action, dbConfigured: isDatabaseConfigured });

  if (!isDatabaseConfigured || !prisma) {
    return NextResponse.json({
      error: 'Database not configured',
      message: 'DATABASE_URL環境変数を設定してください',
    }, { status: 500 });
  }

  try {
    switch (action) {
      case 'list':
        return await listAll();
      case 'create':
        return await createTestData();
      case 'delete':
        return await deleteTestData();
      case 'query':
        return await runQueries();
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('DB API error', { error: String(error) });
    return NextResponse.json({
      error: 'Database error',
      details: String(error),
    }, { status: 500 });
  }
}

// 全データ一覧
async function listAll() {
  logger.info('Listing all data');

  const authors = await prisma!.author.findMany({
    include: {
      posts: {
        include: {
          comments: true,
        },
      },
    },
  });

  return NextResponse.json({
    action: 'list',
    data: {
      authors,
      stats: {
        authorCount: authors.length,
        postCount: authors.reduce((sum, a) => sum + a.posts.length, 0),
        commentCount: authors.reduce((sum, a) => 
          sum + a.posts.reduce((s, p) => s + p.comments.length, 0), 0),
      },
    },
    timestamp: new Date().toISOString(),
  });
}

// テストデータ作成
async function createTestData() {
  logger.info('Creating test data');

  // Author作成
  const author = await prisma!.author.create({
    data: {
      name: `テストユーザー_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
    },
  });
  logger.info('Created author', { authorId: author.id });

  // Post作成
  const post = await prisma!.post.create({
    data: {
      title: `テスト投稿_${Date.now()}`,
      content: 'これはテスト用の投稿です。',
      published: true,
      authorId: author.id,
    },
  });
  logger.info('Created post', { postId: post.id });

  // Comment作成
  const comment = await prisma!.comment.create({
    data: {
      content: `テストコメント_${Date.now()}`,
      postId: post.id,
    },
  });
  logger.info('Created comment', { commentId: comment.id });

  // 作成したデータを取得
  const result = await prisma!.author.findUnique({
    where: { id: author.id },
    include: {
      posts: {
        include: {
          comments: true,
        },
      },
    },
  });

  return NextResponse.json({
    action: 'create',
    message: 'Test data created successfully',
    data: result,
    operations: ['author.create', 'post.create', 'comment.create', 'author.findUnique'],
    timestamp: new Date().toISOString(),
  });
}

// テストデータ削除
async function deleteTestData() {
  logger.info('Deleting test data');

  const testAuthors = await prisma!.author.findMany({
    where: {
      email: {
        startsWith: 'test_',
      },
    },
    include: {
      posts: {
        include: {
          comments: true,
        },
      },
    },
  });

  let deletedComments = 0;
  let deletedPosts = 0;

  for (const author of testAuthors) {
    for (const post of author.posts) {
      const deleted = await prisma!.comment.deleteMany({
        where: { postId: post.id },
      });
      deletedComments += deleted.count;
    }
    const deletedP = await prisma!.post.deleteMany({
      where: { authorId: author.id },
    });
    deletedPosts += deletedP.count;
  }

  const deletedAuthors = await prisma!.author.deleteMany({
    where: {
      email: {
        startsWith: 'test_',
      },
    },
  });

  logger.info('Deleted test data', {
    authors: deletedAuthors.count,
    posts: deletedPosts,
    comments: deletedComments,
  });

  return NextResponse.json({
    action: 'delete',
    message: 'Test data deleted successfully',
    deleted: {
      authors: deletedAuthors.count,
      posts: deletedPosts,
      comments: deletedComments,
    },
    operations: ['author.findMany', 'comment.deleteMany', 'post.deleteMany', 'author.deleteMany'],
    timestamp: new Date().toISOString(),
  });
}

// 複数クエリ実行
async function runQueries() {
  logger.info('Running multiple queries');

  const authorCount = await prisma!.author.count();
  const postCount = await prisma!.post.count();
  const commentCount = await prisma!.comment.count();

  const publishedPosts = await prisma!.post.count({
    where: { published: true },
  });

  const recentAuthors = await prisma!.author.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const authorsWithPostCount = await prisma!.author.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  const result = await prisma!.$queryRaw`SELECT COUNT(*) as total FROM "Author"`;

  return NextResponse.json({
    action: 'query',
    message: 'Multiple queries executed',
    results: {
      counts: { authorCount, postCount, commentCount, publishedPosts },
      recentAuthors,
      authorsWithPostCount: authorsWithPostCount.map(a => ({
        id: a.id,
        name: a.name,
        postCount: a._count.posts,
      })),
      rawQuery: result,
    },
    operations: [
      'author.count',
      'post.count',
      'comment.count',
      'post.count (with where)',
      'author.findMany (with orderBy)',
      'author.findMany (with _count)',
      '$queryRaw',
    ],
    timestamp: new Date().toISOString(),
  });
}

// POST: 新しいAuthorとPostを作成
export async function POST(request: Request) {
  logger.info('DB API POST called');

  if (!isDatabaseConfigured || !prisma) {
    return NextResponse.json({
      error: 'Database not configured',
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { authorName, authorEmail, postTitle, postContent } = body;

    if (!authorName || !authorEmail) {
      return NextResponse.json({
        error: 'authorName and authorEmail are required',
      }, { status: 400 });
    }

    const result = await prisma!.$transaction(async (tx) => {
      const author = await tx.author.create({
        data: {
          name: authorName,
          email: authorEmail,
        },
      });

      let post = null;
      if (postTitle) {
        post = await tx.post.create({
          data: {
            title: postTitle,
            content: postContent || '',
            published: true,
            authorId: author.id,
          },
        });
      }

      return { author, post };
    });

    logger.info('Created via transaction', {
      authorId: result.author.id,
      postId: result.post?.id,
    });

    return NextResponse.json({
      message: 'Created successfully',
      data: result,
      operations: ['$transaction', 'author.create', 'post.create'],
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error) {
    logger.error('DB API POST error', { error: String(error) });
    return NextResponse.json({
      error: 'Failed to create',
      details: String(error),
    }, { status: 500 });
  }
}
