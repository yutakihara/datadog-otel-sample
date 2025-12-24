import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const isDatabaseConfigured = !!process.env.DATABASE_URL;

export const prisma = isDatabaseConfigured
  ? global.prisma || new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
  : null;

if (isDatabaseConfigured && process.env.NODE_ENV !== 'production') {
  global.prisma = prisma!;
}

