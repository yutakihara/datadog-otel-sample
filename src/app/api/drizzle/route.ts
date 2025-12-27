import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { drizzleDb, isDrizzleConfigured, authors, posts, comments } from "@/lib/drizzle/client";
import { logger } from "@/lib/logger";

// Drizzle ORM + @kubiks/otel-drizzle による自動計装テスト用エンドポイント
// すべてのDB操作が自動的にOpenTelemetryスパンとして記録される

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "list";

  logger.info("Drizzle API called", { action, dbConfigured: isDrizzleConfigured });

  if (!isDrizzleConfigured || !drizzleDb) {
    return NextResponse.json({
      error: "Database not configured",
      message: "DATABASE_URL環境変数を設定してください",
    }, { status: 500 });
  }

  try {
    switch (action) {
      case "list":
        return await listAll();
      case "n-plus-one":
        return await nPlusOnePattern();
      case "optimized":
        return await optimizedPattern();
      case "create":
        return await createTestData();
      case "delete":
        return await deleteTestData();
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Drizzle API error", { error: String(error) });
    return NextResponse.json({
      error: "Database error",
      details: String(error),
    }, { status: 500 });
  }
}

// 全データ一覧（リレーションを含む）
async function listAll() {
  logger.info("Drizzle: Listing all data with relations");

  // Drizzle の query API を使用（リレーション込み）
  const allAuthors = await drizzleDb!.query.authors.findMany({
    with: {
      posts: {
        with: {
          comments: true,
        },
      },
    },
  });

  return NextResponse.json({
    action: "list",
    orm: "drizzle",
    instrumentation: "@kubiks/otel-drizzle",
    data: {
      authors: allAuthors,
      stats: {
        authorCount: allAuthors.length,
        postCount: allAuthors.reduce((sum, a) => sum + a.posts.length, 0),
        commentCount: allAuthors.reduce((sum, a) => 
          sum + a.posts.reduce((s, p) => s + p.comments.length, 0), 0),
      },
    },
    note: "すべてのDB操作が自動的にスパンとして記録されています",
    timestamp: new Date().toISOString(),
  });
}

// N+1問題パターン（意図的に非効率なクエリ）
async function nPlusOnePattern() {
  logger.info("Drizzle: Executing N+1 pattern (inefficient)");

  // 1回目のクエリ: 全Authors取得
  const allAuthors = await drizzleDb!.select().from(authors);
  logger.info("Fetched authors", { count: allAuthors.length });

  // N回のクエリ: 各Authorの投稿を個別に取得（N+1問題）
  const authorsWithPosts = await Promise.all(
    allAuthors.map(async (author) => {
      // 各著者ごとに個別クエリ
      const authorPosts = await drizzleDb!
        .select()
        .from(posts)
        .where(eq(posts.authorId, author.id));

      // さらにN回: 各Postのコメントを個別に取得
      const postsWithComments = await Promise.all(
        authorPosts.map(async (post) => {
          const postComments = await drizzleDb!
            .select()
            .from(comments)
            .where(eq(comments.postId, post.id));
          return { ...post, comments: postComments, commentCount: postComments.length };
        })
      );

      return {
        ...author,
        posts: postsWithComments,
        postCount: authorPosts.length,
      };
    })
  );

  const totalQueries = 1 + allAuthors.length + 
    authorsWithPosts.reduce((sum, a) => sum + a.postCount, 0);

  logger.info("N+1 pattern completed", { 
    authorCount: allAuthors.length,
    totalQueries,
  });

  return NextResponse.json({
    action: "n-plus-one",
    orm: "drizzle",
    instrumentation: "@kubiks/otel-drizzle",
    message: "N+1問題パターン - 各関連データを個別クエリで取得",
    data: authorsWithPosts,
    queryPattern: `1 (authors) + ${allAuthors.length} (posts) + N (comments) = ${totalQueries}クエリ`,
    note: "Datadogで各SQLクエリが個別のスパンとして表示されます",
    timestamp: new Date().toISOString(),
  });
}

// 最適化パターン（Eager Loading）
async function optimizedPattern() {
  logger.info("Drizzle: Executing optimized pattern (efficient)");

  // 1回のクエリで全データを取得（Eager Loading）
  const allAuthors = await drizzleDb!.query.authors.findMany({
    with: {
      posts: {
        with: {
          comments: true,
        },
      },
    },
  });

  const result = allAuthors.map((author) => ({
    ...author,
    postCount: author.posts.length,
    posts: author.posts.map((post) => ({
      ...post,
      commentCount: post.comments.length,
    })),
  }));

  logger.info("Optimized pattern completed", {
    authorCount: allAuthors.length,
    totalQueries: "1-3 (JOIN or batch)",
  });

  return NextResponse.json({
    action: "optimized",
    orm: "drizzle",
    instrumentation: "@kubiks/otel-drizzle",
    message: "最適化パターン - Eager Loadingで一括取得",
    data: result,
    queryPattern: "1-3クエリ（JOINまたはバッチ取得）",
    note: "Datadogでは少数のスパンのみ表示されます",
    timestamp: new Date().toISOString(),
  });
}

// テストデータ作成
async function createTestData() {
  logger.info("Drizzle: Creating test data");

  // Author作成
  const [newAuthor] = await drizzleDb!
    .insert(authors)
    .values({
      name: `Drizzleテストユーザー_${Date.now()}`,
      email: `drizzle_test_${Date.now()}@example.com`,
    })
    .returning();
  logger.info("Created author", { authorId: newAuthor.id });

  // Post作成
  const [newPost] = await drizzleDb!
    .insert(posts)
    .values({
      title: `Drizzleテスト投稿_${Date.now()}`,
      content: "これは@kubiks/otel-drizzle自動計装テスト用の投稿です。",
      published: true,
      authorId: newAuthor.id,
    })
    .returning();
  logger.info("Created post", { postId: newPost.id });

  // Comment作成
  const [newComment] = await drizzleDb!
    .insert(comments)
    .values({
      content: `Drizzleテストコメント_${Date.now()}`,
      postId: newPost.id,
    })
    .returning();
  logger.info("Created comment", { commentId: newComment.id });

  // 作成したデータを取得
  const result = await drizzleDb!.query.authors.findFirst({
    where: eq(authors.id, newAuthor.id),
    with: {
      posts: {
        with: {
          comments: true,
        },
      },
    },
  });

  return NextResponse.json({
    action: "create",
    orm: "drizzle",
    instrumentation: "@kubiks/otel-drizzle",
    message: "Test data created successfully",
    data: result,
    operations: ["insert authors", "insert posts", "insert comments", "select with relations"],
    note: "各INSERT/SELECT操作が自動的にスパンとして記録されています",
    timestamp: new Date().toISOString(),
  });
}

// テストデータ削除
async function deleteTestData() {
  logger.info("Drizzle: Deleting test data");

  // drizzle_test_で始まるメールのAuthorを検索
  const testAuthors = await drizzleDb!.query.authors.findMany({
    where: (authors, { like }) => like(authors.email, "drizzle_test_%"),
    with: {
      posts: {
        with: {
          comments: true,
        },
      },
    },
  });

  let deletedComments = 0;
  let deletedPosts = 0;

  // 関連データを削除
  for (const author of testAuthors) {
    for (const post of author.posts) {
      // コメント削除
      const deleted = await drizzleDb!
        .delete(comments)
        .where(eq(comments.postId, post.id));
      deletedComments += post.comments.length;
    }
    // 投稿削除
    await drizzleDb!
      .delete(posts)
      .where(eq(posts.authorId, author.id));
    deletedPosts += author.posts.length;
  }

  // Author削除
  const deletedAuthors = await drizzleDb!
    .delete(authors)
    .where(eq(authors.email, testAuthors[0]?.email || ""));
  
  // 全テストAuthorを削除
  for (const author of testAuthors) {
    await drizzleDb!.delete(authors).where(eq(authors.id, author.id));
  }

  logger.info("Deleted test data", {
    authors: testAuthors.length,
    posts: deletedPosts,
    comments: deletedComments,
  });

  return NextResponse.json({
    action: "delete",
    orm: "drizzle",
    instrumentation: "@kubiks/otel-drizzle",
    message: "Test data deleted successfully",
    deleted: {
      authors: testAuthors.length,
      posts: deletedPosts,
      comments: deletedComments,
    },
    operations: ["select authors", "delete comments", "delete posts", "delete authors"],
    note: "各DELETE操作が自動的にスパンとして記録されています",
    timestamp: new Date().toISOString(),
  });
}

