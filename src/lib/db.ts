/**
 * Database Connection for QUAD Platform
 * Uses Prisma ORM with PostgreSQL
 *
 * Business logic moved to quad-services (Spring Boot)
 * This file only handles Prisma client for Next.js API routes
 */

import { PrismaClient } from '@/generated/prisma';

// Singleton pattern - reuse connection across hot reloads in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with logging in development
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Prevent multiple instances during hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export for use throughout the app
export default prisma;

/**
 * Legacy query helper for raw SQL (backward compatibility)
 * Usage: await query('SELECT * FROM table WHERE id = $1', [id])
 */
export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> {
  const result = await prisma.$queryRawUnsafe<T[]>(sql, ...(params || []));
  return { rows: result };
}

/**
 * Helper to disconnect from database (for graceful shutdown)
 */
export async function disconnect() {
  await prisma.$disconnect();
}

/**
 * Helper to check database connection
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
