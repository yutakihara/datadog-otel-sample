import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 既存データを削除
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.author.deleteMany();

  // Authors作成
  const author1 = await prisma.author.create({
    data: {
      name: '山田太郎',
      email: 'yamada@example.com',
    },
  });

  const author2 = await prisma.author.create({
    data: {
      name: '鈴木花子',
      email: 'suzuki@example.com',
    },
  });

  const author3 = await prisma.author.create({
    data: {
      name: '田中一郎',
      email: 'tanaka@example.com',
    },
  });

  console.log('Created authors:', { author1, author2, author3 });

  // Posts作成
  const post1 = await prisma.post.create({
    data: {
      title: '初めての投稿',
      content: 'これは私の初めての投稿です。',
      published: true,
      authorId: author1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Next.jsについて',
      content: 'Next.jsは素晴らしいフレームワークです。',
      published: true,
      authorId: author1.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'OpenTelemetry入門',
      content: 'OTELで分散トレーシングを実現します。',
      published: true,
      authorId: author2.id,
    },
  });

  const post4 = await prisma.post.create({
    data: {
      title: 'Datadog活用術',
      content: 'Datadogでモニタリングを強化しましょう。',
      published: false,
      authorId: author2.id,
    },
  });

  const post5 = await prisma.post.create({
    data: {
      title: 'N+1問題とは',
      content: 'N+1問題とその解決方法について説明します。',
      published: true,
      authorId: author3.id,
    },
  });

  console.log('Created posts:', { post1, post2, post3, post4, post5 });

  // Comments作成
  await prisma.comment.createMany({
    data: [
      { content: '素晴らしい記事です！', postId: post1.id },
      { content: '参考になりました', postId: post1.id },
      { content: 'もっと詳しく知りたい', postId: post2.id },
      { content: 'わかりやすい', postId: post3.id },
      { content: '実践的ですね', postId: post5.id },
    ],
  });

  console.log('Created comments');

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

