/**
 * QUAD Agent Communication Architecture (QACA)
 * Core TypeScript interfaces for agent-to-agent communication
 *
 * Part of QUAD™ (Quick Unified Agentic Development) Methodology
 * © 2025 Suman Addanke / A2 Vibe Creators LLC
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * The 4 QUAD Circles - functional teams
 */
export enum Circle {
  MANAGEMENT = "MANAGEMENT",       // Circle 1: BA, PM, Tech Lead
  DEVELOPMENT = "DEVELOPMENT",     // Circle 2: Full Stack, Backend, UI, Mobile
  QA = "QA",                       // Circle 3: QA Engineer, Automation, Perf, Security
  INFRASTRUCTURE = "INFRASTRUCTURE" // Circle 4: DevOps, SRE, Cloud, DBA
}

/**
 * Permission levels for resource access
 * Higher number = more access
 */
export enum PermissionLevel {
  NONE = 0,       // Cannot access
  READ = 1,       // Read-only access
  SUGGEST = 2,    // Can suggest changes, human must approve
  WRITE = 3,      // Can write (with audit trail)
  ADMIN = 4       // Full access (rare, use sparingly)
}

/**
 * Pipeline execution modes
 */
export enum ExecutionMode {
  SEQUENTIAL = "SEQUENTIAL",   // A → B → C (one at a time, output chains)
  PARALLEL = "PARALLEL",       // A, B, C (all at once, independent)
  HYBRID = "HYBRID"            // [A, B] → [C, D] → [E] (stages of parallel)
}

/**
 * Agent action types for audit logging
 */
export enum AgentAction {
  INVOKE = "INVOKE",     // Called another agent
  READ = "READ",         // Read a resource
  WRITE = "WRITE",       // Modified a resource
  EMIT = "EMIT",         // Emitted an event
  LISTEN = "LISTEN"      // Subscribed to an event
}

/**
 * Invocation entry points - how agents can be triggered
 */
export enum InvocationMethod {
  IDE = "IDE",           // VS Code, Cursor, etc.
  CLI = "CLI",           // Command line: quad agent invoke ...
  CHAT = "CHAT",         // Claude, Copilot chat interface
  AUTO = "AUTO",         // CI/CD, git hooks, automated triggers
  MCP = "MCP"            // Model Context Protocol (Claude Desktop)
}

// =============================================================================
// CORE INTERFACES
// =============================================================================

/**
 * Permission definition for a specific resource
 */
export interface Permission {
  resource: string;              // Glob pattern: "code/ui/**", "database/*"
  level: PermissionLevel;        // Access level
  conditions?: string[];         // Optional conditions: ["only_dev_env", "requires_review"]
}

/**
 * Input passed to an agent when invoked
 */
export interface AgentInput {
  // Required
  requestId: string;             // Unique ID for this invocation

  // Context
  pipelineId?: string;           // If part of a pipeline
  previousOutput?: AgentOutput;  // Output from previous agent in chain

  // Payload (agent-specific)
  data: Record<string, unknown>;

  // Metadata
  invokedBy: string;             // Who invoked this agent (agentId or "user")
  invocationMethod: InvocationMethod;
  timestamp: Date;
}

/**
 * Output returned by an agent after execution
 */
export interface AgentOutput {
  // Identity
  requestId: string;             // Matches input requestId
  agentId: string;               // Which agent produced this

  // Result
  success: boolean;
  data: Record<string, unknown>;
  error?: string;

  // Audit
  modifiedResources: string[];   // What resources were modified
  readResources: string[];       // What resources were read
  duration: number;              // Execution time in ms

  // Chain (for sequential pipelines)
  nextAgentHint?: string;        // Suggested next agent (optional)
}

/**
 * Event for async/parallel communication via Event Bus
 */
export interface AgentEvent {
  eventId: string;
  eventType: string;             // "story.expanded", "code.pushed", "test.passed"
  source: string;                // agentId that emitted
  payload: Record<string, unknown>;
  timestamp: Date;

  // Routing
  targetAgents?: string[];       // Specific agents (or all if undefined)
  targetCircles?: Circle[];      // Target entire circles
}

/**
 * Audit log entry for compliance and debugging
 */
export interface AuditLog {
  // Identity
  logId: string;
  timestamp: Date;

  // Context
  pipelineId?: string;
  requestId: string;
  agentId: string;

  // Action
  action: AgentAction;
  resource?: string;

  // Data (sanitized - no secrets)
  inputSummary?: string;
  outputSummary?: string;

  // Result
  success: boolean;
  duration: number;
  error?: string;

  // Approval (for SUGGEST level)
  requiresApproval?: boolean;
  approvedBy?: string;
  approvalTimestamp?: Date;
}

// =============================================================================
// AGENT INTERFACE (Universal Contract)
// =============================================================================

/**
 * Universal interface that ALL QUAD agents MUST implement
 * This is the pluggable contract for the QUAD Agent Runtime (QAR)
 */
export interface QUADAgent {
  // ==========================================================================
  // IDENTITY
  // ==========================================================================

  /** Unique agent identifier, e.g., "story-agent", "dev-agent-ui" */
  readonly agentId: string;

  /** Which QUAD circle this agent belongs to */
  readonly circle: Circle;

  /** Semantic version, e.g., "1.0.0" */
  readonly version: string;

  /** Human-readable description */
  readonly description: string;

  // ==========================================================================
  // CAPABILITIES
  // ==========================================================================

  /** What this agent can do, e.g., ["expand-story", "generate-acceptance"] */
  readonly capabilities: string[];

  /** Required input fields, e.g., ["story_id", "project_context"] */
  readonly requiredInputs: string[];

  /** Output fields produced, e.g., ["expanded_story", "acceptance_criteria"] */
  readonly outputs: string[];

  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================

  /** Resources this agent CAN read */
  readonly canRead: Permission[];

  /** Resources this agent CAN write */
  readonly canWrite: Permission[];

  /** Other agents this agent CAN invoke */
  readonly canInvoke: string[];

  /** Other agents this agent CANNOT invoke (explicit deny) */
  readonly cannotInvoke: string[];

  /** Maximum number of resources this agent can modify in one invocation */
  readonly maxModifications: number;

  /** Whether this agent requires human approval before execution */
  readonly requiresApproval: boolean;

  // ==========================================================================
  // EXECUTION (Required)
  // ==========================================================================

  /**
   * Main execution method - invoke the agent
   * @param input - The input data and context
   * @returns Promise resolving to the agent's output
   */
  invoke(input: AgentInput): Promise<AgentOutput>;

  // ==========================================================================
  // EVENT HANDLING (Optional - for async/parallel)
  // ==========================================================================

  /**
   * Handle an event from the Event Bus
   * @param event - The event to handle
   */
  onEvent?(event: AgentEvent): void;

  /**
   * Event types this agent subscribes to
   */
  readonly subscribedEvents?: string[];

  // ==========================================================================
  // CONTEXT ACCESS (Optional - for shared context)
  // ==========================================================================

  /**
   * Read a value from shared context
   * @param key - The context key
   * @returns The value or undefined
   */
  readContext?(key: string): unknown;

  /**
   * Write a value to shared context
   * @param key - The context key
   * @param value - The value to write
   */
  writeContext?(key: string, value: unknown): void;

  // ==========================================================================
  // LIFECYCLE (Optional)
  // ==========================================================================

  /**
   * Called when agent is registered with runtime
   */
  onRegister?(): Promise<void>;

  /**
   * Called when agent is being shut down
   */
  onShutdown?(): Promise<void>;
}

// =============================================================================
// PIPELINE INTERFACES
// =============================================================================

/**
 * A step in a pipeline
 */
export interface PipelineStep {
  agentId: string;               // Which agent to invoke
  requiredOutput?: string;       // Required output field from this step
  optional?: boolean;            // If true, pipeline continues if this fails
  timeout?: number;              // Step timeout in ms
  retries?: number;              // Number of retries on failure
}

/**
 * A stage in a HYBRID pipeline (group of parallel agents)
 */
export interface PipelineStage {
  name: string;                  // Stage name for logging
  agents: string[];              // Agents in this stage
  parallel: boolean;             // Run in parallel?
  waitForAll?: boolean;          // Wait for all to complete? (default: true)
  continueOnError?: boolean;     // Continue if some agents fail?
}

/**
 * Pipeline definition
 */
export interface Pipeline {
  // Identity
  name: string;                  // e.g., "estimation-pipeline"
  description: string;
  version: string;

  // Execution
  mode: ExecutionMode;

  // For SEQUENTIAL mode
  steps?: PipelineStep[];

  // For HYBRID mode
  stages?: PipelineStage[];

  // For PARALLEL mode
  agents?: string[];

  // Settings
  timeout?: number;              // Overall pipeline timeout
  requiresApproval?: boolean;    // Human approval before start?
}

// =============================================================================
// CONFIGURATION INTERFACES
// =============================================================================

/**
 * Agent permission override in config
 */
export interface AgentPermissionConfig {
  canRead?: string[];            // Glob patterns
  canWrite?: string[];           // Glob patterns
  cannotWrite?: string[];        // Explicit denies
  canInvoke?: string[];          // Agent IDs
  cannotInvoke?: string[];       // Agent IDs
  requiresApproval?: boolean;
}

/**
 * Invocation methods configuration
 */
export interface InvocationConfig {
  ide: boolean;
  cli: boolean;
  chat: boolean;
  auto: boolean;
  mcp: boolean;
}

/**
 * Main QUAD configuration file structure (quad.config.yaml)
 */
export interface QUADConfig {
  version: string;               // Config version
  project: string;               // Project name

  // Default settings
  defaultMode: ExecutionMode;
  defaultTimeout: number;

  // Pipelines
  pipelines: Record<string, Pipeline>;

  // Permission overrides per agent
  permissions: Record<string, AgentPermissionConfig>;

  // Invocation methods enabled
  invocation: InvocationConfig;

  // Audit settings
  audit: {
    enabled: boolean;
    retentionDays: number;
    sensitiveFields: string[];   // Fields to redact in logs
  };
}

// =============================================================================
// RUNTIME INTERFACES
// =============================================================================

/**
 * Result of a pipeline execution
 */
export interface PipelineResult {
  pipelineId: string;
  pipelineName: string;
  success: boolean;

  // Results per step/stage
  stepResults: Array<{
    agentId: string;
    success: boolean;
    output?: AgentOutput;
    error?: string;
    duration: number;
  }>;

  // Aggregate
  totalDuration: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Error thrown when permission check fails
 */
export interface PermissionError extends Error {
  agentId: string;
  attemptedAction: AgentAction;
  resource?: string;
  requiredLevel: PermissionLevel;
  actualLevel: PermissionLevel;
}

/**
 * Error thrown when safety limits exceeded
 */
export interface SafetyError extends Error {
  agentId: string;
  limit: string;
  actual: number;
  maximum: number;
}

// =============================================================================
// TYPE ALIASES (for convenience)
// =============================================================================

/** All possible agent types in QUAD */
export type AgentId = string;

/** Resource path pattern (glob) */
export type ResourcePattern = string;

/** Event type pattern */
export type EventPattern = string;
