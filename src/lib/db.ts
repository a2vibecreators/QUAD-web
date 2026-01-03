/**
 * Database Connection for QUAD Platform
 *
 * MIGRATED: Now uses Java Backend API instead of direct Prisma connection.
 * All database operations go through quad-services (Spring Boot).
 *
 * Pattern: quad-web → java-backend.ts → HTTP → quad-services → PostgreSQL
 */

import * as javaBackend from './java-backend';

// Re-export all java-backend functions for backward compatibility
export * from './java-backend';

// Export the entire module as 'db' for convenience
export const db = javaBackend;

/**
 * Check if Java backend is reachable
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const health = await javaBackend.healthCheck();
    return health.status === 'UP';
  } catch (error) {
    console.error('Java backend connection failed:', error);
    return false;
  }
}

/**
 * Legacy query helper - DEPRECATED
 * @deprecated Use java-backend functions instead. Direct SQL queries are no longer supported.
 */
export async function query<T = unknown>(_sql: string, _params?: unknown[]): Promise<{ rows: T[] }> {
  console.warn('DEPRECATED: Direct SQL queries are no longer supported. Use java-backend.ts functions.');
  throw new Error('Direct SQL queries are no longer supported. Use java-backend.ts functions instead.');
}

/**
 * Disconnect - DEPRECATED (no-op, connection is HTTP-based)
 * @deprecated HTTP connections are stateless, no disconnect needed.
 */
export async function disconnect(): Promise<void> {
  // No-op - HTTP connections are stateless
}

/**
 * PRISMA COMPATIBILITY SHIM
 *
 * This provides a Proxy that intercepts all Prisma-style calls and throws
 * helpful errors guiding developers to use the new java-backend functions.
 *
 * Example old code: prisma.qUAD_users.findMany({...})
 * Example new code: import { getUsers } from '@/lib/java-backend'
 */
function createPrismaError(model: string, method: string): never {
  const javaBackendFunctions: Record<string, string> = {
    'qUAD_organizations': 'getOrganizations, createOrganization, updateOrganization, deleteOrganization',
    'qUAD_users': 'getUsers, getUserById, getUserByEmail, createUser, updateUser, deleteUser',
    'qUAD_domains': 'getDomains, getDomainById, createDomain, updateDomain, deleteDomain',
    'qUAD_tickets': 'getTickets, getTicketById, createTicket, updateTicket, deleteTicket',
    'qUAD_cycles': 'getCycles, getCycleById, createCycle, updateCycle, deleteCycle',
    'qUAD_roles': 'getRoles, getRoleById, createRole, updateRole, deleteRole',
    'qUAD_circles': 'getCircles, getCircleById, createCircle, updateCircle, deleteCircle',
  };

  const suggestion = javaBackendFunctions[model] || 'Check java-backend.ts for available functions';

  throw new Error(
    `PRISMA REMOVED: prisma.${model}.${method}() is no longer available.\n` +
    `QUAD has migrated to Java backend. Use java-backend.ts instead.\n` +
    `Suggested functions: ${suggestion}\n` +
    `Import: import { functionName } from '@/lib/java-backend'`
  );
}

// Create a handler for model proxies (e.g., prisma.qUAD_users)
const modelProxyHandler: ProxyHandler<object> = {
  get(_target: object, method: string) {
    // Return a function that throws when called
    return (..._args: unknown[]) => {
      const model = (_target as { _modelName?: string })._modelName || 'unknown';
      createPrismaError(model, method);
    };
  }
};

// Create the main prisma proxy
const prismaProxyHandler: ProxyHandler<object> = {
  get(_target: object, prop: string) {
    // Handle special Prisma methods
    if (prop === '$queryRaw' || prop === '$queryRawUnsafe' || prop === '$executeRaw') {
      return () => {
        throw new Error(
          `PRISMA REMOVED: prisma.${prop}() is no longer available.\n` +
          `Direct SQL queries are not supported. Use java-backend.ts functions instead.`
        );
      };
    }

    if (prop === '$disconnect' || prop === '$connect') {
      return async () => {
        console.warn(`PRISMA REMOVED: prisma.${prop}() is no-op. HTTP connections are stateless.`);
      };
    }

    if (prop === '$transaction') {
      return () => {
        throw new Error(
          'PRISMA REMOVED: prisma.$transaction() is no longer available.\n' +
          'Transactions should be handled by the Java backend.'
        );
      };
    }

    // For model access (e.g., prisma.qUAD_users), return a proxy
    if (typeof prop === 'string' && prop.startsWith('qUAD_')) {
      const modelProxy = { _modelName: prop };
      return new Proxy(modelProxy, modelProxyHandler);
    }

    // Default: throw error for unknown properties
    return () => {
      throw new Error(`PRISMA REMOVED: prisma.${prop} is no longer available.`);
    };
  }
};

// Export the prisma shim for backward compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = new Proxy({}, prismaProxyHandler);

export default db;
