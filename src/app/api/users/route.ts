import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// ダミーユーザーデータ
const users = [
  { id: 1, name: '田中太郎', email: 'tanaka@example.com' },
  { id: 2, name: '佐藤花子', email: 'sato@example.com' },
  { id: 3, name: '鈴木一郎', email: 'suzuki@example.com' },
];

export async function GET() {
  logger.info('Users API GET called');

  // DBアクセスをシミュレート
  await new Promise(resolve => setTimeout(resolve, 100));

  const transformedUsers = users.map(user => ({
    ...user,
    displayName: `${user.name} <${user.email}>`,
  }));

  logger.info('Users fetched', { count: transformedUsers.length });

  return NextResponse.json({
    users: transformedUsers,
    count: transformedUsers.length,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  logger.info('Users API POST called');

  const body = await request.json();

  if (!body.name || !body.email) {
    logger.warn('Validation failed', { body });
    return NextResponse.json(
      { error: 'Name and email are required' },
      { status: 400 }
    );
  }

  // DBアクセスをシミュレート
  await new Promise(resolve => setTimeout(resolve, 80));

  const newUser = {
    id: users.length + 1,
    name: body.name,
    email: body.email,
  };

  logger.info('User created', { userId: newUser.id, email: newUser.email });

  return NextResponse.json(
    { user: newUser, message: 'User created successfully', timestamp: new Date().toISOString() },
    { status: 201 }
  );
}
