/**
 * Prisma Client Export - DEPRECATED
 *
 * MIGRATED: QUAD no longer uses Prisma directly.
 * All database operations now go through java-backend.ts → quad-services (Java).
 *
 * This file exists for backward compatibility during migration.
 * Use: import { db } from '@/lib/db' instead.
 */

export { prisma, db, checkConnection, query, disconnect } from './db';
export * from './java-backend';
export { default } from './db';
