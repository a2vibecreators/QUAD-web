/**
 * QUAD Agent Runtime (QAR)
 * The unified gateway for all agent invocations
 *
 * Part of QUAD™ (Quick Unified Agentic Development) Methodology
 * © 2025 Suman Addanke / A2 Vibe Creators LLC
 */

import {
  QUADAgent,
  AgentInput,
  AgentOutput,
  Pipeline,
  PipelineResult,
  QUADConfig,
  InvocationMethod,
  InvocationConfig,
  AgentAction,
  ExecutionMode
} from "../types/agent";
import { permissionChecker, PermissionChecker } from "./permissions";
import { orchestrator, Orchestrator } from "./orchestrator";
import { eventBus, EventBus, EventTypes, createEvent } from "./event-bus";
import { sharedContext, SharedContext } from "./shared-context";

// =============================================================================
// TYPES
// =============================================================================

interface RuntimeConfig {
  projectName: string;
  defaultTimeout: number;
  invocation: InvocationConfig;
}

interface InvokeOptions {
  invokedBy?: string;
  invocationMethod?: InvocationMethod;
  timeout?: number;
  skipPermissionCheck?: boolean;  // For internal calls
}

// =============================================================================
// QUAD AGENT RUNTIME
// =============================================================================

/**
 * QUAD Agent Runtime (QAR)
 *
 * The SINGLE GATEWAY for all agent operations:
 * - Agent registration
 * - Direct invocation
 * - Pipeline execution
 * - Event emission
 * - Context access
 *
 * All entry points (IDE, CLI, Chat, Auto, MCP) go through QAR.
 */
export class QUADAgentRuntime {
  private config: RuntimeConfig;

  // Components
  readonly permissions: PermissionChecker;
  readonly orchestrator: Orchestrator;
  readonly eventBus: EventBus;
  readonly context: SharedContext;

  constructor(config?: Partial<RuntimeConfig>) {
    this.config = {
      projectName: "quad-project",
      defaultTimeout: 60000,
      invocation: {
        ide: true,
        cli: true,
        chat: true,
        auto: true,
        mcp: true
      },
      ...config
    };

    // Use singleton instances (can be replaced for testing)
    this.permissions = permissionChecker;
    this.orchestrator = orchestrator;
    this.eventBus = eventBus;
    this.context = sharedContext;
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Load configuration from QUAD config object
   */
  loadConfig(config: QUADConfig): void {
    this.config.projectName = config.project;
    this.config.defaultTimeout = config.defaultTimeout;
    this.config.invocation = config.invocation;

    // Load permission overrides
    this.permissions.loadConfig(config.permissions);

    // Register pipelines
    for (const [name, pipeline] of Object.entries(config.pipelines)) {
      this.registerPipeline({
        ...pipeline,
        name
      });
    }
  }

  // ===========================================================================
  // AGENT REGISTRATION
  // ===========================================================================

  /**
   * Register an agent with the runtime
   * Registers with all components (orchestrator, event bus, context)
   */
  registerAgent(agent: QUADAgent): void {
    // Register with orchestrator
    this.orchestrator.registerAgent(agent);

    // Register with event bus
    this.eventBus.registerAgent(agent);

    // Register with shared context
    this.context.registerAgent(agent);

    // Emit registration event
    this.eventBus.emit(
      createEvent("runtime", EventTypes.AGENT_REGISTERED, {
        agentId: agent.agentId,
        circle: agent.circle,
        capabilities: agent.capabilities
      })
    );

    console.log(`[QAR] Registered agent: ${agent.agentId}`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.orchestrator.unregisterAgent(agentId);
    this.eventBus.unregisterAgent(agentId);
    this.context.unregisterAgent(agentId);

    // Emit unregistration event
    this.eventBus.emit(
      createEvent("runtime", EventTypes.AGENT_UNREGISTERED, {
        agentId
      })
    );

    console.log(`[QAR] Unregistered agent: ${agentId}`);
  }

  /**
   * Get a registered agent
   */
  getAgent(agentId: string): QUADAgent | undefined {
    return this.orchestrator.getAgent(agentId);
  }

  /**
   * List all registered agents
   */
  listAgents(): string[] {
    // Access internal map through orchestrator
    const agents: string[] = [];
    // Note: Would need to expose this method on Orchestrator
    return agents;
  }

  // ===========================================================================
  // PIPELINE REGISTRATION
  // ===========================================================================

  /**
   * Register a pipeline definition
   */
  registerPipeline(pipeline: Pipeline): void {
    this.orchestrator.registerPipeline(pipeline);
    console.log(`[QAR] Registered pipeline: ${pipeline.name}`);
  }

  /**
   * Get a registered pipeline
   */
  getPipeline(name: string): Pipeline | undefined {
    return this.orchestrator.getPipeline(name);
  }

  // ===========================================================================
  // DIRECT INVOCATION
  // ===========================================================================

  /**
   * Invoke an agent directly (single agent, not pipeline)
   */
  async invoke(
    agentId: string,
    data: Record<string, unknown>,
    options?: InvokeOptions
  ): Promise<AgentOutput> {
    // Check if invocation method is enabled
    const method = options?.invocationMethod || InvocationMethod.CLI;
    if (!this.isInvocationMethodEnabled(method)) {
      throw new Error(`Invocation method ${method} is disabled`);
    }

    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Check permissions
    if (!options?.skipPermissionCheck) {
      const invoker = options?.invokedBy || "user";
      const canInvoke = this.permissions.canInvokeAgent(
        invoker === "user" ? "user" : this.getAgent(invoker)!,
        agent
      );

      if (!canInvoke.allowed) {
        throw new Error(canInvoke.reason || "Permission denied");
      }
    }

    // Build input
    const input: AgentInput = {
      requestId: crypto.randomUUID(),
      data,
      invokedBy: options?.invokedBy || "user",
      invocationMethod: method,
      timestamp: new Date()
    };

    // Validate input
    const validation = this.permissions.validateInput(agent, input);
    if (!validation.valid) {
      throw new Error(
        `Input validation failed: ${validation.errors.join(", ")}`
      );
    }

    // Execute with timeout
    const timeout = options?.timeout || this.config.defaultTimeout;
    const output = await this.invokeWithTimeout(agent, input, timeout);

    // Validate output
    const outputValidation = this.permissions.validateOutput(agent, output);
    if (!outputValidation.valid) {
      throw new Error(
        `Output validation failed: ${outputValidation.errors.join(", ")}`
      );
    }

    // Log action
    this.permissions.logAction(agent, AgentAction.INVOKE, input, output);

    return output;
  }

  /**
   * Invoke multiple agents in parallel
   */
  async invokeParallel(
    agentIds: string[],
    data: Record<string, unknown>,
    options?: InvokeOptions
  ): Promise<Map<string, AgentOutput>> {
    const results = new Map<string, AgentOutput>();

    const promises = agentIds.map(async (agentId) => {
      try {
        const output = await this.invoke(agentId, data, options);
        results.set(agentId, output);
      } catch (error) {
        results.set(agentId, {
          requestId: crypto.randomUUID(),
          agentId,
          success: false,
          data: {},
          error: error instanceof Error ? error.message : "Unknown error",
          modifiedResources: [],
          readResources: [],
          duration: 0
        });
      }
    });

    await Promise.all(promises);
    return results;
  }

  // ===========================================================================
  // PIPELINE EXECUTION
  // ===========================================================================

  /**
   * Execute a pipeline by name
   */
  async executePipeline(
    pipelineName: string,
    data: Record<string, unknown>,
    options?: InvokeOptions
  ): Promise<PipelineResult> {
    // Check if invocation method is enabled
    const method = options?.invocationMethod || InvocationMethod.CLI;
    if (!this.isInvocationMethodEnabled(method)) {
      throw new Error(`Invocation method ${method} is disabled`);
    }

    // Emit pipeline start event
    await this.eventBus.emit(
      createEvent("runtime", EventTypes.PIPELINE_STARTED, {
        pipelineName,
        data
      })
    );

    try {
      const result = await this.orchestrator.executePipeline(
        pipelineName,
        data,
        {
          invokedBy: options?.invokedBy || "user",
          invocationMethod: method
        }
      );

      // Emit pipeline complete event
      await this.eventBus.emit(
        createEvent(
          "runtime",
          result.success
            ? EventTypes.PIPELINE_COMPLETED
            : EventTypes.PIPELINE_FAILED,
          {
            pipelineName,
            pipelineId: result.pipelineId,
            success: result.success,
            duration: result.totalDuration
          }
        )
      );

      return result;
    } catch (error) {
      // Emit pipeline failed event
      await this.eventBus.emit(
        createEvent("runtime", EventTypes.PIPELINE_FAILED, {
          pipelineName,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      );

      throw error;
    }
  }

  // ===========================================================================
  // EVENT BUS SHORTCUTS
  // ===========================================================================

  /**
   * Emit an event through the event bus
   */
  async emit(
    source: string,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.eventBus.emit(createEvent(source, eventType, payload));
  }

  /**
   * Subscribe to events
   */
  subscribe(
    agentId: string,
    eventType: string,
    handler: (event: any) => void
  ): () => void {
    return this.eventBus.subscribe(agentId, eventType, handler);
  }

  // ===========================================================================
  // CONTEXT SHORTCUTS
  // ===========================================================================

  /**
   * Read from shared context
   */
  readContext(agentId: string, key: string): unknown {
    return this.context.read(agentId, key);
  }

  /**
   * Write to shared context
   */
  writeContext(
    agentId: string,
    key: string,
    value: unknown,
    ttl?: number
  ): void {
    this.context.write(agentId, key, value, { ttl });
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Check if an invocation method is enabled
   */
  private isInvocationMethodEnabled(method: InvocationMethod): boolean {
    switch (method) {
      case InvocationMethod.IDE:
        return this.config.invocation.ide;
      case InvocationMethod.CLI:
        return this.config.invocation.cli;
      case InvocationMethod.CHAT:
        return this.config.invocation.chat;
      case InvocationMethod.AUTO:
        return this.config.invocation.auto;
      case InvocationMethod.MCP:
        return this.config.invocation.mcp;
      default:
        return true;
    }
  }

  /**
   * Invoke agent with timeout
   */
  private async invokeWithTimeout(
    agent: QUADAgent,
    input: AgentInput,
    timeoutMs: number
  ): Promise<AgentOutput> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Agent ${agent.agentId} timed out`)),
        timeoutMs
      );
    });

    return Promise.race([agent.invoke(input), timeoutPromise]);
  }

  // ===========================================================================
  // AUDIT & DEBUGGING
  // ===========================================================================

  /**
   * Get audit logs for a request
   */
  getAuditLogs(requestId: string): any[] {
    return this.permissions.getLogsForRequest(requestId);
  }

  /**
   * Get audit logs for an agent
   */
  getAgentLogs(agentId: string, limit?: number): any[] {
    return this.permissions.getLogsForAgent(agentId, limit);
  }

  /**
   * Get context statistics
   */
  getContextStats(): any {
    return this.context.getStats();
  }

  /**
   * Get event history
   */
  getEventHistory(limit?: number): any[] {
    return this.eventBus.getHistory(limit);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const runtime = new QUADAgentRuntime();

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new QUAD Agent Runtime instance
 * Use this for testing or when you need multiple isolated runtimes
 */
export function createRuntime(
  config?: Partial<RuntimeConfig>
): QUADAgentRuntime {
  return new QUADAgentRuntime(config);
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export {
  permissionChecker,
  orchestrator,
  eventBus,
  sharedContext,
  createEvent,
  EventTypes
};

export * from "../types/agent";
