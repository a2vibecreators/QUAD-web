/**
 * QUAD Shared Context
 * Collaborative state sharing between agents
 *
 * Part of QUAD™ (Quick Unified Agentic Development) Methodology
 * © 2025 Suman Addanke / A2 Vibe Creators LLC
 */

import {
  QUADAgent,
  PermissionLevel,
  AgentAction
} from "../types/agent";
import { permissionChecker } from "./permissions";

// =============================================================================
// TYPES
// =============================================================================

interface ContextEntry {
  key: string;
  value: unknown;
  type: string;                  // typeof value for validation
  createdBy: string;             // agentId
  createdAt: Date;
  updatedBy: string;             // agentId
  updatedAt: Date;
  ttl?: number;                  // Time-to-live in ms
  readCount: number;
  writeCount: number;
}

interface ContextPermission {
  key: string;                   // Exact key or glob pattern
  level: PermissionLevel;
}

interface SharedContextConfig {
  maxKeys: number;               // Max number of keys
  maxValueSize: number;          // Max size of a single value in bytes
  defaultTtl?: number;           // Default TTL in ms
  enablePersistence: boolean;    // Persist to disk
}

// =============================================================================
// SHARED CONTEXT
// =============================================================================

export class SharedContext {
  private context: Map<string, ContextEntry> = new Map();
  private agents: Map<string, QUADAgent> = new Map();
  private agentPermissions: Map<string, ContextPermission[]> = new Map();
  private config: SharedContextConfig;

  constructor(config?: Partial<SharedContextConfig>) {
    this.config = {
      maxKeys: 10000,
      maxValueSize: 1024 * 1024,  // 1MB
      enablePersistence: false,
      ...config
    };

    // Cleanup expired entries periodically
    setInterval(() => this.cleanupExpired(), 60000);
  }

  // ===========================================================================
  // AGENT REGISTRATION
  // ===========================================================================

  /**
   * Register an agent with context access
   */
  registerAgent(
    agent: QUADAgent,
    permissions?: ContextPermission[]
  ): void {
    this.agents.set(agent.agentId, agent);

    if (permissions) {
      this.agentPermissions.set(agent.agentId, permissions);
    }
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.agentPermissions.delete(agentId);
  }

  /**
   * Update permissions for an agent
   */
  setPermissions(agentId: string, permissions: ContextPermission[]): void {
    this.agentPermissions.set(agentId, permissions);
  }

  // ===========================================================================
  // READ OPERATIONS
  // ===========================================================================

  /**
   * Read a value from context
   */
  read(agentId: string, key: string): unknown {
    const agent = this.agents.get(agentId);

    // Check permission
    if (agent && !this.canRead(agentId, key)) {
      throw new Error(
        `Agent ${agentId} does not have read permission for key: ${key}`
      );
    }

    const entry = this.context.get(key);
    if (!entry) {
      return undefined;
    }

    // Check TTL
    if (entry.ttl) {
      const age = Date.now() - entry.updatedAt.getTime();
      if (age > entry.ttl) {
        this.context.delete(key);
        return undefined;
      }
    }

    // Update read count
    entry.readCount++;

    // Log read action
    if (agent) {
      permissionChecker.logAction(
        agent,
        AgentAction.READ,
        {
          requestId: crypto.randomUUID(),
          data: { key },
          invokedBy: agentId,
          invocationMethod: "AUTO" as any,
          timestamp: new Date()
        }
      );
    }

    return entry.value;
  }

  /**
   * Read multiple keys at once
   */
  readMany(agentId: string, keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      result[key] = this.read(agentId, key);
    }
    return result;
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    const entry = this.context.get(key);
    if (!entry) return false;

    // Check TTL
    if (entry.ttl) {
      const age = Date.now() - entry.updatedAt.getTime();
      if (age > entry.ttl) {
        this.context.delete(key);
        return false;
      }
    }

    return true;
  }

  /**
   * Get all keys matching a pattern
   */
  keys(pattern?: string): string[] {
    const allKeys = Array.from(this.context.keys());

    if (!pattern) {
      return allKeys;
    }

    // Simple glob matching
    const regex = new RegExp(
      "^" +
        pattern
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, ".*")
          .replace(/\?/g, ".") +
        "$"
    );

    return allKeys.filter((key) => regex.test(key));
  }

  // ===========================================================================
  // WRITE OPERATIONS
  // ===========================================================================

  /**
   * Write a value to context
   */
  write(
    agentId: string,
    key: string,
    value: unknown,
    options?: { ttl?: number }
  ): void {
    const agent = this.agents.get(agentId);

    // Check permission
    if (agent && !this.canWrite(agentId, key)) {
      throw new Error(
        `Agent ${agentId} does not have write permission for key: ${key}`
      );
    }

    // Check max keys
    if (!this.context.has(key) && this.context.size >= this.config.maxKeys) {
      throw new Error(
        `Context is full (max ${this.config.maxKeys} keys)`
      );
    }

    // Check value size
    const valueSize = JSON.stringify(value).length;
    if (valueSize > this.config.maxValueSize) {
      throw new Error(
        `Value too large (${valueSize} bytes, max ${this.config.maxValueSize})`
      );
    }

    const now = new Date();
    const existing = this.context.get(key);

    const entry: ContextEntry = {
      key,
      value,
      type: typeof value,
      createdBy: existing?.createdBy ?? agentId,
      createdAt: existing?.createdAt ?? now,
      updatedBy: agentId,
      updatedAt: now,
      ttl: options?.ttl ?? this.config.defaultTtl,
      readCount: existing?.readCount ?? 0,
      writeCount: (existing?.writeCount ?? 0) + 1
    };

    this.context.set(key, entry);

    // Log write action
    if (agent) {
      permissionChecker.logAction(
        agent,
        AgentAction.WRITE,
        {
          requestId: crypto.randomUUID(),
          data: { key, valueType: entry.type },
          invokedBy: agentId,
          invocationMethod: "AUTO" as any,
          timestamp: now
        }
      );
    }
  }

  /**
   * Write multiple key-value pairs at once
   */
  writeMany(
    agentId: string,
    entries: Record<string, unknown>,
    options?: { ttl?: number }
  ): void {
    for (const [key, value] of Object.entries(entries)) {
      this.write(agentId, key, value, options);
    }
  }

  /**
   * Delete a key
   */
  delete(agentId: string, key: string): boolean {
    const agent = this.agents.get(agentId);

    // Check permission (need write to delete)
    if (agent && !this.canWrite(agentId, key)) {
      throw new Error(
        `Agent ${agentId} does not have delete permission for key: ${key}`
      );
    }

    return this.context.delete(key);
  }

  /**
   * Clear all context (admin only)
   */
  clear(agentId: string): void {
    // Only allow admin level to clear
    const permissions = this.agentPermissions.get(agentId);
    const hasAdmin = permissions?.some(
      (p) => p.level === PermissionLevel.ADMIN
    );

    if (!hasAdmin) {
      throw new Error(`Agent ${agentId} does not have admin permission`);
    }

    this.context.clear();
  }

  // ===========================================================================
  // ATOMIC OPERATIONS
  // ===========================================================================

  /**
   * Atomic increment (for counters)
   */
  increment(agentId: string, key: string, amount = 1): number {
    const current = this.read(agentId, key);
    const newValue = (typeof current === "number" ? current : 0) + amount;
    this.write(agentId, key, newValue);
    return newValue;
  }

  /**
   * Atomic append to array
   */
  append(agentId: string, key: string, value: unknown): unknown[] {
    const current = this.read(agentId, key);
    const newValue = Array.isArray(current) ? [...current, value] : [value];
    this.write(agentId, key, newValue);
    return newValue;
  }

  /**
   * Atomic merge with object
   */
  merge(
    agentId: string,
    key: string,
    value: Record<string, unknown>
  ): Record<string, unknown> {
    const current = this.read(agentId, key);
    const newValue =
      typeof current === "object" && current !== null
        ? { ...(current as Record<string, unknown>), ...value }
        : value;
    this.write(agentId, key, newValue);
    return newValue;
  }

  // ===========================================================================
  // PERMISSION CHECKS
  // ===========================================================================

  /**
   * Check if agent can read a key
   */
  private canRead(agentId: string, key: string): boolean {
    const permissions = this.agentPermissions.get(agentId);
    if (!permissions) {
      return true;  // No restrictions defined = allow all
    }

    return permissions.some((p) => {
      if (!this.matchKey(p.key, key)) return false;
      return p.level >= PermissionLevel.READ;
    });
  }

  /**
   * Check if agent can write a key
   */
  private canWrite(agentId: string, key: string): boolean {
    const permissions = this.agentPermissions.get(agentId);
    if (!permissions) {
      return true;  // No restrictions defined = allow all
    }

    return permissions.some((p) => {
      if (!this.matchKey(p.key, key)) return false;
      return p.level >= PermissionLevel.WRITE;
    });
  }

  /**
   * Check if permission pattern matches key
   */
  private matchKey(pattern: string, key: string): boolean {
    if (pattern === "*") return true;
    if (pattern === key) return true;

    // Simple glob matching
    const regex = new RegExp(
      "^" +
        pattern
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, ".*")
          .replace(/\?/g, ".") +
        "$"
    );

    return regex.test(key);
  }

  // ===========================================================================
  // MAINTENANCE
  // ===========================================================================

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();

    for (const [key, entry] of this.context.entries()) {
      if (entry.ttl) {
        const age = now - entry.updatedAt.getTime();
        if (age > entry.ttl) {
          this.context.delete(key);
        }
      }
    }
  }

  /**
   * Get context statistics
   */
  getStats(): {
    keyCount: number;
    totalReads: number;
    totalWrites: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    let totalReads = 0;
    let totalWrites = 0;
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    for (const entry of this.context.values()) {
      totalReads += entry.readCount;
      totalWrites += entry.writeCount;

      if (!oldestEntry || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (!newestEntry || entry.updatedAt > newestEntry) {
        newestEntry = entry.updatedAt;
      }
    }

    return {
      keyCount: this.context.size,
      totalReads,
      totalWrites,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Export context to JSON (for persistence)
   */
  export(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of this.context.entries()) {
      result[key] = entry.value;
    }
    return result;
  }

  /**
   * Import context from JSON (for persistence)
   */
  import(
    agentId: string,
    data: Record<string, unknown>,
    options?: { ttl?: number }
  ): void {
    this.writeMany(agentId, data, options);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const sharedContext = new SharedContext();

// =============================================================================
// NAMESPACED CONTEXT
// =============================================================================

/**
 * Create a namespaced view of shared context
 * Useful for isolating agent data
 */
export function createNamespacedContext(
  context: SharedContext,
  agentId: string,
  namespace: string
): {
  read: (key: string) => unknown;
  write: (key: string, value: unknown, ttl?: number) => void;
  delete: (key: string) => boolean;
  keys: () => string[];
} {
  const prefix = `${namespace}:`;

  return {
    read: (key: string) => context.read(agentId, prefix + key),
    write: (key: string, value: unknown, ttl?: number) =>
      context.write(agentId, prefix + key, value, { ttl }),
    delete: (key: string) => context.delete(agentId, prefix + key),
    keys: () =>
      context
        .keys(prefix + "*")
        .map((k) => k.substring(prefix.length))
  };
}
