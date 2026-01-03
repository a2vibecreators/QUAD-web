/**
 * Authentication Utilities for QUAD Platform
 * Uses Prisma ORM for database operations
 * Handles JWT tokens, password hashing, and session management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db';
import type { QUAD_users } from '@/generated/prisma';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'quad-platform-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * User type (from Prisma)
 * Note: org_id maps to company_id column in DB via @map directive
 */
export type QuadUser = Pick<QUAD_users, 'id' | 'org_id' | 'email' | 'role' | 'full_name' | 'is_active'>;

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;
}

// =============================================================================
// PASSWORD UTILITIES
// =============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// =============================================================================
// JWT UTILITIES
// =============================================================================

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: QuadUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    companyId: user.org_id,  // org_id maps to company_id column
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// =============================================================================
// SESSION MANAGEMENT (using Prisma)
// =============================================================================

/**
 * Store session in database
 */
export async function createSession(
  userId: string,
  token: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  await prisma.qUAD_user_sessions.create({
    data: {
      user_id: userId,
      session_token: token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  });
}

/**
 * Delete session from database (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  await prisma.qUAD_user_sessions.deleteMany({
    where: { session_token: token },
  });
}

/**
 * Validate session exists and is not expired
 */
export async function validateSession(token: string): Promise<boolean> {
  const session = await prisma.qUAD_user_sessions.findFirst({
    where: {
      session_token: token,
      expires_at: { gt: new Date() },
    },
  });

  return session !== null;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.qUAD_user_sessions.deleteMany({
    where: {
      expires_at: { lt: new Date() },
    },
  });

  return result.count;
}

// =============================================================================
// USER QUERIES (using Prisma)
// =============================================================================

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<QuadUser | null> {
  const user = await prisma.qUAD_users.findUnique({
    where: { email },
    select: {
      id: true,
      org_id: true,
      email: true,
      role: true,
      full_name: true,
      is_active: true,
    },
  });

  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<QuadUser | null> {
  const user = await prisma.qUAD_users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      org_id: true,
      email: true,
      role: true,
      full_name: true,
      is_active: true,
    },
  });

  return user;
}

/**
 * Get user with password hash for login verification
 */
export async function getUserWithPassword(email: string) {
  return await prisma.qUAD_users.findUnique({
    where: { email },
    select: {
      id: true,
      org_id: true,
      email: true,
      password_hash: true,
      role: true,
      full_name: true,
      is_active: true,
    },
  });
}

/**
 * Create a new user
 */
export async function createUser(data: {
  companyId: string;  // Keep param name for backwards compatibility
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}): Promise<QuadUser> {
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.qUAD_users.create({
    data: {
      org_id: data.companyId,  // org_id maps to company_id column
      email: data.email,
      password_hash: passwordHash,
      full_name: data.fullName,
      role: data.role || 'DEVELOPER',
    },
    select: {
      id: true,
      org_id: true,
      email: true,
      role: true,
      full_name: true,
      is_active: true,
    },
  });

  return user;
}

// =============================================================================
// ADOPTION MATRIX (using Prisma)
// =============================================================================

/**
 * Get user's adoption matrix position
 */
export async function getUserAdoptionMatrix(userId: string) {
  return await prisma.qUAD_adoption_matrix.findUnique({
    where: { user_id: userId },
  });
}

/**
 * Update user's adoption matrix position
 */
export async function updateUserAdoptionMatrix(
  userId: string,
  skillLevel: number,
  trustLevel: number
) {
  const existing = await prisma.qUAD_adoption_matrix.findUnique({
    where: { user_id: userId },
  });

  if (existing) {
    return await prisma.qUAD_adoption_matrix.update({
      where: { user_id: userId },
      data: {
        previous_skill_level: existing.skill_level,
        previous_trust_level: existing.trust_level,
        skill_level: skillLevel,
        trust_level: trustLevel,
        level_changed_at: new Date(),
      },
    });
  } else {
    return await prisma.qUAD_adoption_matrix.create({
      data: {
        user_id: userId,
        skill_level: skillLevel,
        trust_level: trustLevel,
      },
    });
  }
}

/**
 * Calculate safety buffer percentage based on matrix position
 */
export function calculateSafetyBuffer(skillLevel: number, trustLevel: number): number {
  const bufferMatrix: { [key: string]: number } = {
    '1-1': 80, // AI Skeptic
    '1-2': 60, // Curious Novice
    '1-3': 50, // Trusting Novice
    '2-1': 60, // Skeptical User
    '2-2': 40, // Growing User
    '2-3': 30, // Eager Adopter
    '3-1': 40, // Cautious Expert
    '3-2': 20, // Balanced Expert
    '3-3': 10, // AI Champion
  };

  return bufferMatrix[`${skillLevel}-${trustLevel}`] || 50;
}

/**
 * Get zone name based on matrix position
 */
export function getZoneName(skillLevel: number, trustLevel: number): string {
  const zoneNames: { [key: string]: string } = {
    '1-1': 'AI Skeptic',
    '1-2': 'Curious Novice',
    '1-3': 'Trusting Novice',
    '2-1': 'Skeptical User',
    '2-2': 'Growing User',
    '2-3': 'Eager Adopter',
    '3-1': 'Cautious Expert',
    '3-2': 'Balanced Expert',
    '3-3': 'AI Champion',
  };

  return zoneNames[`${skillLevel}-${trustLevel}`] || 'Unknown';
}
