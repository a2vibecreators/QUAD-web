/**
 * QUAD Agent Permission System
 * Enforces restrictions on agent-to-agent communication
 *
 * Part of QUAD™ (Quick Unified Agentic Development) Methodology
 * © 2025 Suman Addanke / A2 Vibe Creators LLC
 */

import {
  Permission,
  PermissionLevel,
  QUADAgent,
  AgentAction,
  AgentInput,
  AgentOutput,
  AgentPermissionConfig,
  AuditLog
} from "../types/agent";

// =============================================================================
// TYPES
// =============================================================================

interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredLevel?: PermissionLevel;
  actualLevel?: PermissionLevel;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// GLOB PATTERN MATCHING
// =============================================================================

/**
 * Simple glob pattern matcher
 * Supports: *, **, ?
 */
function matchGlob(pattern: string, path: string): boolean {
  // Escape regex special chars except * and ?
  let regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "<<DOUBLESTAR>>")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".")
    .replace(/<<DOUBLESTAR>>/g, ".*");

  return new RegExp(`^${regex}$`).test(path);
}

/**
 * Check if a resource path matches any of the permission patterns
 */
function matchesAnyPattern(patterns: string[], resource: string): boolean {
  return patterns.some((pattern) => matchGlob(pattern, resource));
}

// =============================================================================
// PERMISSION CHECKER
// =============================================================================

export class PermissionChecker {
  private configOverrides: Map<string, AgentPermissionConfig> = new Map();
  private auditLogs: AuditLog[] = [];

  /**
   * Load permission overrides from config
   */
  loadConfig(permissions: Record<string, AgentPermissionConfig>): void {
    this.configOverrides.clear();
    for (const [agentId, config] of Object.entries(permissions)) {
      this.configOverrides.set(agentId, config);
    }
  }

  /**
   * Get effective permissions for an agent (base + overrides)
   */
  private getEffectivePermissions(agent: QUADAgent): {
    canRead: Permission[];
    canWrite: Permission[];
    canInvoke: string[];
    cannotInvoke: string[];
    requiresApproval: boolean;
  } {
    const override = this.configOverrides.get(agent.agentId);

    if (!override) {
      return {
        canRead: agent.canRead,
        canWrite: agent.canWrite,
        canInvoke: agent.canInvoke,
        cannotInvoke: agent.cannotInvoke,
        requiresApproval: agent.requiresApproval
      };
    }

    // Merge base permissions with overrides
    const effectiveCanRead = [...agent.canRead];
    const effectiveCanWrite = [...agent.canWrite];

    // Add config read patterns
    if (override.canRead) {
      for (const pattern of override.canRead) {
        effectiveCanRead.push({
          resource: pattern,
          level: PermissionLevel.READ
        });
      }
    }

    // Add config write patterns
    if (override.canWrite) {
      for (const pattern of override.canWrite) {
        effectiveCanWrite.push({
          resource: pattern,
          level: PermissionLevel.WRITE
        });
      }
    }

    // Handle explicit denies (cannotWrite overrides canWrite)
    if (override.cannotWrite) {
      for (const pattern of override.cannotWrite) {
        // Remove from canWrite if exists
        const idx = effectiveCanWrite.findIndex(
          (p) => p.resource === pattern
        );
        if (idx !== -1) {
          effectiveCanWrite.splice(idx, 1);
        }
      }
    }

    return {
      canRead: effectiveCanRead,
      canWrite: effectiveCanWrite,
      canInvoke: override.canInvoke ?? agent.canInvoke,
      cannotInvoke: [
        ...agent.cannotInvoke,
        ...(override.cannotInvoke ?? [])
      ],
      requiresApproval: override.requiresApproval ?? agent.requiresApproval
    };
  }

  // ===========================================================================
  // PRE-INVOCATION CHECKS
  // ===========================================================================

  /**
   * Check if caller agent can invoke target agent
   */
  canInvokeAgent(
    caller: QUADAgent | "user",
    target: QUADAgent
  ): PermissionCheckResult {
    // Users can invoke any agent (subject to agent's requiresApproval)
    if (caller === "user") {
      if (target.requiresApproval) {
        return {
          allowed: true,
          reason: "Requires human approval before execution"
        };
      }
      return { allowed: true };
    }

    const effective = this.getEffectivePermissions(caller);

    // Check explicit deny first
    if (effective.cannotInvoke.includes(target.agentId)) {
      return {
        allowed: false,
        reason: `Agent ${caller.agentId} is explicitly denied from invoking ${target.agentId}`
      };
    }

    // Check allow list
    if (!effective.canInvoke.includes(target.agentId)) {
      return {
        allowed: false,
        reason: `Agent ${caller.agentId} is not authorized to invoke ${target.agentId}. Allowed targets: ${effective.canInvoke.join(", ") || "none"}`
      };
    }

    return { allowed: true };
  }

  /**
   * Check if agent can read a specific resource
   */
  canReadResource(
    agent: QUADAgent,
    resource: string
  ): PermissionCheckResult {
    const effective = this.getEffectivePermissions(agent);

    for (const perm of effective.canRead) {
      if (matchGlob(perm.resource, resource)) {
        if (perm.level >= PermissionLevel.READ) {
          return { allowed: true };
        }
      }
    }

    return {
      allowed: false,
      reason: `Agent ${agent.agentId} cannot read ${resource}`,
      requiredLevel: PermissionLevel.READ,
      actualLevel: PermissionLevel.NONE
    };
  }

  /**
   * Check if agent can write to a specific resource
   */
  canWriteResource(
    agent: QUADAgent,
    resource: string
  ): PermissionCheckResult {
    const effective = this.getEffectivePermissions(agent);

    // Check for explicit denies in config
    const override = this.configOverrides.get(agent.agentId);
    if (override?.cannotWrite) {
      if (matchesAnyPattern(override.cannotWrite, resource)) {
        return {
          allowed: false,
          reason: `Agent ${agent.agentId} is explicitly denied write access to ${resource}`,
          requiredLevel: PermissionLevel.WRITE,
          actualLevel: PermissionLevel.NONE
        };
      }
    }

    for (const perm of effective.canWrite) {
      if (matchGlob(perm.resource, resource)) {
        if (perm.level >= PermissionLevel.WRITE) {
          return { allowed: true };
        }
        if (perm.level === PermissionLevel.SUGGEST) {
          return {
            allowed: true,
            reason: "Requires human approval for write",
            requiredLevel: PermissionLevel.WRITE,
            actualLevel: PermissionLevel.SUGGEST
          };
        }
      }
    }

    return {
      allowed: false,
      reason: `Agent ${agent.agentId} cannot write to ${resource}`,
      requiredLevel: PermissionLevel.WRITE,
      actualLevel: PermissionLevel.NONE
    };
  }

  /**
   * Validate agent input has all required fields
   */
  validateInput(agent: QUADAgent, input: AgentInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const required of agent.requiredInputs) {
      if (!(required in input.data)) {
        errors.push(`Missing required input: ${required}`);
      }
    }

    // Check if input data has unexpected fields (warning only)
    const expectedFields = new Set([...agent.requiredInputs]);
    for (const field of Object.keys(input.data)) {
      if (!expectedFields.has(field)) {
        warnings.push(`Unexpected input field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ===========================================================================
  // POST-INVOCATION VALIDATION
  // ===========================================================================

  /**
   * Validate agent output - check it didn't exceed permissions
   */
  validateOutput(agent: QUADAgent, output: AgentOutput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check modification count limit
    if (output.modifiedResources.length > agent.maxModifications) {
      errors.push(
        `Agent ${agent.agentId} modified ${output.modifiedResources.length} resources, ` +
        `but maximum allowed is ${agent.maxModifications}`
      );
    }

    // Check each modified resource
    for (const resource of output.modifiedResources) {
      const check = this.canWriteResource(agent, resource);
      if (!check.allowed) {
        errors.push(check.reason || `Unauthorized write to ${resource}`);
      } else if (check.actualLevel === PermissionLevel.SUGGEST) {
        warnings.push(`Write to ${resource} requires human approval`);
      }
    }

    // Check each read resource
    for (const resource of output.readResources) {
      const check = this.canReadResource(agent, resource);
      if (!check.allowed) {
        errors.push(check.reason || `Unauthorized read of ${resource}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ===========================================================================
  // AUDIT LOGGING
  // ===========================================================================

  /**
   * Log an action for audit trail
   */
  logAction(
    agent: QUADAgent,
    action: AgentAction,
    input: AgentInput,
    output?: AgentOutput,
    error?: string
  ): AuditLog {
    const log: AuditLog = {
      logId: crypto.randomUUID(),
      timestamp: new Date(),
      pipelineId: input.pipelineId,
      requestId: input.requestId,
      agentId: agent.agentId,
      action,
      inputSummary: this.summarizeInput(input),
      outputSummary: output ? this.summarizeOutput(output) : undefined,
      success: !error && (output?.success ?? false),
      duration: output?.duration ?? 0,
      error,
      requiresApproval: agent.requiresApproval
    };

    this.auditLogs.push(log);

    // Keep only last 10000 logs in memory (configurable)
    if (this.auditLogs.length > 10000) {
      this.auditLogs.shift();
    }

    return log;
  }

  /**
   * Get audit logs for a specific request
   */
  getLogsForRequest(requestId: string): AuditLog[] {
    return this.auditLogs.filter((log) => log.requestId === requestId);
  }

  /**
   * Get audit logs for a specific agent
   */
  getLogsForAgent(agentId: string, limit = 100): AuditLog[] {
    return this.auditLogs
      .filter((log) => log.agentId === agentId)
      .slice(-limit);
  }

  /**
   * Get all logs (for export)
   */
  getAllLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Clear audit logs (for testing)
   */
  clearLogs(): void {
    this.auditLogs = [];
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Create a sanitized summary of input (no secrets)
   */
  private summarizeInput(input: AgentInput): string {
    const keys = Object.keys(input.data);
    return `Input fields: ${keys.join(", ")}`;
  }

  /**
   * Create a sanitized summary of output (no secrets)
   */
  private summarizeOutput(output: AgentOutput): string {
    const parts: string[] = [];

    if (output.success) {
      parts.push("SUCCESS");
    } else {
      parts.push("FAILED");
      if (output.error) {
        parts.push(`error: ${output.error.substring(0, 100)}`);
      }
    }

    if (output.modifiedResources.length > 0) {
      parts.push(`modified: ${output.modifiedResources.length} resources`);
    }

    return parts.join(", ");
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const permissionChecker = new PermissionChecker();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a PermissionError
 */
export function createPermissionError(
  agentId: string,
  action: AgentAction,
  resource: string | undefined,
  requiredLevel: PermissionLevel,
  actualLevel: PermissionLevel
): Error {
  const error = new Error(
    `Permission denied: Agent ${agentId} attempted ${action}` +
    (resource ? ` on ${resource}` : "") +
    `. Required level: ${PermissionLevel[requiredLevel]}, ` +
    `actual: ${PermissionLevel[actualLevel]}`
  );
  error.name = "PermissionError";
  return error;
}

/**
 * Create a SafetyError
 */
export function createSafetyError(
  agentId: string,
  limit: string,
  actual: number,
  maximum: number
): Error {
  const error = new Error(
    `Safety limit exceeded: Agent ${agentId} exceeded ${limit} limit. ` +
    `Actual: ${actual}, Maximum: ${maximum}`
  );
  error.name = "SafetyError";
  return error;
}
