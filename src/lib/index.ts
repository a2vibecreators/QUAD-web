/**
 * QUAD Framework - Library Exports
 *
 * This file provides a unified export point for all library modules.
 *
 * Business logic is now in quad-services (Spring Boot backend).
 * Use the java-backend client for AI, Memory, Assignment, and Integration calls.
 *
 * Imports:
 *   // Java backend client (AI, Memory, Assignment)
 *   import { callAI, getContext, assignTicket } from '@/lib/java-backend';
 *
 *   // Database (Prisma)
 *   import { prisma, query } from '@/lib/db';
 *
 *   // Auth
 *   import { verifyToken } from '@/lib/auth';
 *   import { authOptions } from '@/lib/authOptions';
 *
 *   // Email
 *   import { sendVerificationCode } from '@/lib/email';
 */

// Re-export Java backend client for AI/Memory/Assignment operations
export * from './java-backend';

// Re-export database utilities
export { prisma, query, disconnect, checkConnection } from './db';

// Re-export auth utilities
export { verifyToken, generateToken, hashPassword, verifyPassword } from './auth';

// Re-export email utilities
export { sendVerificationCode, generateVerificationCode } from './email';
