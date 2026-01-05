/**
 * Prisma Client Export - LEGACY
 *
 * ⚠️ DEPRECATED: QUAD has migrated from Prisma to SQL + JPA (Java).
 *
 * NEW ARCHITECTURE:
 * - Database: PostgreSQL with raw SQL (quad-database/sql/)
 * - Backend: Java Spring Boot + JPA (quad-services/)
 * - Frontend: Next.js → HTTP calls → Java backend (java-backend.ts)
 *
 * THIS FILE:
 * - Exists for backward compatibility during migration
 * - Re-exports from db.ts (which proxies to java-backend.ts)
 * - Will throw helpful errors if Prisma methods are called
 *
 * MIGRATION STATUS:
 * - authOptions.ts: ✅ Migrated (uses java-backend.ts)
 * - auth.ts: ⚠️ Legacy (97 API routes still use it)
 * - API routes: ⏳ Gradual migration in progress
 *
 * USE INSTEAD:
 * - import { getUserByEmail } from '@/lib/java-backend'
 * - See java-backend.ts for available functions
 */

export { prisma, db, checkConnection, query, disconnect } from './db';
export * from './java-backend';
export { default } from './db';
