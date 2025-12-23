import { NextResponse } from 'next/server';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('users-api');

// ダミーユーザーデータ
const users = [
  { id: 1, name: '田中太郎', email: 'tanaka@example.com' },
  { id: 2, name: '佐藤花子', email: 'sato@example.com' },
  { id: 3, name: '鈴木一郎', email: 'suzuki@example.com' },
];

// データベースアクセスをシミュレート
async function fetchUsersFromDatabase() {
  return tracer.startActiveSpan('database-query', async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', 'SELECT');
    span.setAttribute('db.table', 'users');
    
    console.log('[DB] Fetching users from database...');
    
    // DBアクセスをシミュレート
    await new Promise(resolve => setTimeout(resolve, 100));
    
    span.setAttribute('db.rows_affected', users.length);
    console.log('[DB] Fetched', users.length, 'users');
    
    span.end();
    return users;
  });
}

// ユーザーデータを変換
async function transformUsers(data: typeof users) {
  return tracer.startActiveSpan('transform-data', async (span) => {
    span.setAttribute('transform.input_count', data.length);
    
    console.log('[Transform] Processing user data...');
    
    await new Promise(resolve => setTimeout(resolve, 30));
    
    const transformed = data.map(user => ({
      ...user,
      displayName: `${user.name} <${user.email}>`,
    }));
    
    span.setAttribute('transform.output_count', transformed.length);
    console.log('[Transform] Transformation complete');
    
    span.end();
    return transformed;
  });
}

export async function GET() {
  return tracer.startActiveSpan('users-api-handler', async (span) => {
    try {
      console.log('[API /users] Request received');
      
      span.setAttribute('api.name', 'users');
      span.setAttribute('api.method', 'GET');

      // データベースからユーザーを取得
      const rawUsers = await fetchUsersFromDatabase();
      
      // データを変換
      const transformedUsers = await transformUsers(rawUsers);

      const response = {
        users: transformedUsers,
        count: transformedUsers.length,
        timestamp: new Date().toISOString(),
        traceId: span.spanContext().traceId,
      };

      console.log('[API /users] Response sent', { 
        count: response.count, 
        traceId: response.traceId 
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return NextResponse.json(response);
    } catch (error) {
      console.error('[API /users] Error:', error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.end();
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: Request) {
  return tracer.startActiveSpan('users-api-create-handler', async (span) => {
    try {
      console.log('[API /users POST] Request received');
      
      span.setAttribute('api.name', 'users');
      span.setAttribute('api.method', 'POST');

      const body = await request.json();
      
      // バリデーションスパン
      await tracer.startActiveSpan('validate-input', async (validationSpan) => {
        validationSpan.setAttribute('validation.fields', ['name', 'email']);
        
        console.log('[Validation] Validating input...');
        await new Promise(resolve => setTimeout(resolve, 20));
        
        if (!body.name || !body.email) {
          validationSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'Missing required fields' });
          throw new Error('Name and email are required');
        }
        
        console.log('[Validation] Input is valid');
        validationSpan.end();
      });

      // 新しいユーザーを作成（シミュレート）
      const newUser = await tracer.startActiveSpan('database-insert', async (insertSpan) => {
        insertSpan.setAttribute('db.system', 'postgresql');
        insertSpan.setAttribute('db.operation', 'INSERT');
        insertSpan.setAttribute('db.table', 'users');
        
        console.log('[DB] Inserting new user...');
        await new Promise(resolve => setTimeout(resolve, 80));
        
        const user = {
          id: users.length + 1,
          name: body.name,
          email: body.email,
        };
        
        console.log('[DB] User created with id:', user.id);
        insertSpan.end();
        return user;
      });

      const response = {
        user: newUser,
        message: 'User created successfully',
        timestamp: new Date().toISOString(),
        traceId: span.spanContext().traceId,
      };

      console.log('[API /users POST] Response sent', { 
        userId: newUser.id,
        traceId: response.traceId 
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      console.error('[API /users POST] Error:', error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.end();
      
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 400 }
      );
    }
  });
}

