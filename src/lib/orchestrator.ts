/**
 * QUAD Pipeline Orchestrator
 * Executes pipelines in SEQUENTIAL, PARALLEL, or HYBRID modes
 *
 * Part of QUAD™ (Quick Unified Agentic Development) Methodology
 * © 2025 Suman Addanke / A2 Vibe Creators LLC
 */

import {
  Pipeline,
  PipelineStep,
  PipelineStage,
  PipelineResult,
  QUADAgent,
  AgentInput,
  AgentOutput,
  ExecutionMode,
  InvocationMethod,
  AgentAction
} from "../types/agent";
import { permissionChecker } from "./permissions";

// =============================================================================
// TYPES
// =============================================================================

interface StepResult {
  agentId: string;
  success: boolean;
  output?: AgentOutput;
  error?: string;
  duration: number;
}

interface OrchestratorConfig {
  defaultTimeout: number;        // Default timeout per step (ms)
  maxParallelAgents: number;     // Max agents running in parallel
  retryDelayMs: number;          // Delay between retries
}

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export class Orchestrator {
  private agents: Map<string, QUADAgent> = new Map();
  private pipelines: Map<string, Pipeline> = new Map();
  private config: OrchestratorConfig;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      defaultTimeout: 60000,     // 1 minute
      maxParallelAgents: 10,
      retryDelayMs: 1000,
      ...config
    };
  }

  // ===========================================================================
  // REGISTRATION
  // ===========================================================================

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: QUADAgent): void {
    if (this.agents.has(agent.agentId)) {
      console.warn(`Agent ${agent.agentId} already registered, overwriting`);
    }
    this.agents.set(agent.agentId, agent);

    // Call lifecycle hook if exists
    if (agent.onRegister) {
      agent.onRegister().catch((err) => {
        console.error(`Agent ${agent.agentId} onRegister failed:`, err);
      });
    }
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      // Call lifecycle hook if exists
      if (agent.onShutdown) {
        agent.onShutdown().catch((err) => {
          console.error(`Agent ${agentId} onShutdown failed:`, err);
        });
      }
      this.agents.delete(agentId);
    }
  }

  /**
   * Register a pipeline definition
   */
  registerPipeline(pipeline: Pipeline): void {
    this.pipelines.set(pipeline.name, pipeline);
  }

  /**
   * Get a registered agent
   */
  getAgent(agentId: string): QUADAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get a registered pipeline
   */
  getPipeline(name: string): Pipeline | undefined {
    return this.pipelines.get(name);
  }

  // ===========================================================================
  // PIPELINE EXECUTION
  // ===========================================================================

  /**
   * Execute a pipeline by name
   */
  async executePipeline(
    pipelineName: string,
    initialInput: Record<string, unknown>,
    options?: {
      invokedBy?: string;
      invocationMethod?: InvocationMethod;
    }
  ): Promise<PipelineResult> {
    const pipeline = this.pipelines.get(pipelineName);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineName}`);
    }

    const pipelineId = crypto.randomUUID();
    const startTime = new Date();
    const stepResults: StepResult[] = [];

    try {
      switch (pipeline.mode) {
        case ExecutionMode.SEQUENTIAL:
          await this.executeSequential(
            pipeline,
            pipelineId,
            initialInput,
            stepResults,
            options
          );
          break;

        case ExecutionMode.PARALLEL:
          await this.executeParallel(
            pipeline,
            pipelineId,
            initialInput,
            stepResults,
            options
          );
          break;

        case ExecutionMode.HYBRID:
          await this.executeHybrid(
            pipeline,
            pipelineId,
            initialInput,
            stepResults,
            options
          );
          break;

        default:
          throw new Error(`Unknown execution mode: ${pipeline.mode}`);
      }

      return {
        pipelineId,
        pipelineName,
        success: stepResults.every((r) => r.success || !r.error),
        stepResults,
        totalDuration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date()
      };
    } catch (error) {
      return {
        pipelineId,
        pipelineName,
        success: false,
        stepResults,
        totalDuration: Date.now() - startTime.getTime(),
        startTime,
        endTime: new Date()
      };
    }
  }

  // ===========================================================================
  // SEQUENTIAL EXECUTION
  // ===========================================================================

  /**
   * Execute steps one after another, chaining outputs
   */
  private async executeSequential(
    pipeline: Pipeline,
    pipelineId: string,
    initialInput: Record<string, unknown>,
    stepResults: StepResult[],
    options?: {
      invokedBy?: string;
      invocationMethod?: InvocationMethod;
    }
  ): Promise<void> {
    const steps = pipeline.steps || [];
    let previousOutput: AgentOutput | undefined;
    let currentData = { ...initialInput };

    for (const step of steps) {
      const result = await this.executeStep(
        step,
        pipelineId,
        currentData,
        previousOutput,
        options
      );

      stepResults.push(result);

      if (!result.success) {
        if (step.optional) {
          console.warn(
            `Optional step ${step.agentId} failed, continuing...`
          );
          continue;
        }
        throw new Error(`Step ${step.agentId} failed: ${result.error}`);
      }

      // Chain output to next step
      previousOutput = result.output;
      if (result.output?.data) {
        currentData = { ...currentData, ...result.output.data };
      }
    }
  }

  // ===========================================================================
  // PARALLEL EXECUTION
  // ===========================================================================

  /**
   * Execute all agents simultaneously
   */
  private async executeParallel(
    pipeline: Pipeline,
    pipelineId: string,
    initialInput: Record<string, unknown>,
    stepResults: StepResult[],
    options?: {
      invokedBy?: string;
      invocationMethod?: InvocationMethod;
    }
  ): Promise<void> {
    const agentIds = pipeline.agents || [];

    // Limit parallelism
    const chunks = this.chunkArray(agentIds, this.config.maxParallelAgents);

    for (const chunk of chunks) {
      const promises = chunk.map((agentId) =>
        this.executeStep(
          { agentId },
          pipelineId,
          initialInput,
          undefined,
          options
        )
      );

      const results = await Promise.allSettled(promises);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "fulfilled") {
          stepResults.push(result.value);
        } else {
          stepResults.push({
            agentId: chunk[i],
            success: false,
            error: result.reason?.message || "Unknown error",
            duration: 0
          });
        }
      }
    }
  }

  // ===========================================================================
  // HYBRID EXECUTION
  // ===========================================================================

  /**
   * Execute stages sequentially, agents within stages in parallel
   */
  private async executeHybrid(
    pipeline: Pipeline,
    pipelineId: string,
    initialInput: Record<string, unknown>,
    stepResults: StepResult[],
    options?: {
      invokedBy?: string;
      invocationMethod?: InvocationMethod;
    }
  ): Promise<void> {
    const stages = pipeline.stages || [];
    let currentData = { ...initialInput };
    let stageOutputs: AgentOutput[] = [];

    for (const stage of stages) {
      const stageResults = await this.executeStage(
        stage,
        pipelineId,
        currentData,
        stageOutputs,
        options
      );

      stepResults.push(...stageResults);

      // Collect successful outputs for next stage
      stageOutputs = stageResults
        .filter((r) => r.success && r.output)
        .map((r) => r.output as AgentOutput);

      // Merge all outputs into currentData for next stage
      for (const result of stageResults) {
        if (result.success && result.output?.data) {
          currentData = { ...currentData, ...result.output.data };
        }
      }

      // Check if stage succeeded
      const allSucceeded = stageResults.every((r) => r.success);
      const anySucceeded = stageResults.some((r) => r.success);

      if (!anySucceeded && !stage.continueOnError) {
        throw new Error(`Stage ${stage.name} failed completely`);
      }

      if (!allSucceeded && stage.waitForAll && !stage.continueOnError) {
        throw new Error(`Stage ${stage.name} had failures`);
      }
    }
  }

  /**
   * Execute a single stage (group of agents)
   */
  private async executeStage(
    stage: PipelineStage,
    pipelineId: string,
    input: Record<string, unknown>,
    previousOutputs: AgentOutput[],
    options?: {
      invokedBy?: string;
      invocationMethod?: InvocationMethod;
    }
  ): Promise<StepResult[]> {
    const results: StepResult[] = [];

    if (stage.parallel) {
      // Parallel execution within stage
      const promises = stage.agents.map((agentId) =>
        this.executeStep(
          { agentId },
          pipelineId,
          input,
          previousOutputs[0], // Pass first previous output for context
          options
        )
      );

      const settled = await Promise.allSettled(promises);

      for (let i = 0; i < settled.length; i++) {
        const result = settled[i];
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          results.push({
            agentId: stage.agents[i],
            success: false,
            error: result.reason?.message || "Unknown error",
            duration: 0
          });
        }
      }
    } else {
      // Sequential execution within stage
      let previousOutput = previousOutputs[0];

      for (const agentId of stage.agents) {
        const result = await this.executeStep(
          { agentId },
          pipelineId,
          input,
          previousOutput,
          options
        );

        results.push(result);

        if (result.success && result.output) {
          previousOutput = result.output;
        }
      }
    }

    return results;
  }

  // ===========================================================================
  // STEP EXECUTION
  // ===========================================================================

  /**
   * Execute a single pipeline step (invoke one agent)
   */
  private async executeStep(
    step: PipelineStep,
    pipelineId: string,
    data: Record<string, unknown>,
    previousOutput: AgentOutput | undefined,
    options?: {
      invokedBy?: string;
      invocationMethod?: InvocationMethod;
    }
  ): Promise<StepResult> {
    const startTime = Date.now();
    const agent = this.agents.get(step.agentId);

    if (!agent) {
      return {
        agentId: step.agentId,
        success: false,
        error: `Agent not found: ${step.agentId}`,
        duration: Date.now() - startTime
      };
    }

    // Build input
    const input: AgentInput = {
      requestId: crypto.randomUUID(),
      pipelineId,
      previousOutput,
      data,
      invokedBy: options?.invokedBy || "orchestrator",
      invocationMethod: options?.invocationMethod || InvocationMethod.AUTO,
      timestamp: new Date()
    };

    // Validate input
    const validation = permissionChecker.validateInput(agent, input);
    if (!validation.valid) {
      return {
        agentId: step.agentId,
        success: false,
        error: `Input validation failed: ${validation.errors.join(", ")}`,
        duration: Date.now() - startTime
      };
    }

    // Execute with timeout and retries
    const timeout = step.timeout || this.config.defaultTimeout;
    const retries = step.retries || 0;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const output = await this.invokeWithTimeout(agent, input, timeout);

        // Validate output
        const outputValidation = permissionChecker.validateOutput(
          agent,
          output
        );
        if (!outputValidation.valid) {
          return {
            agentId: step.agentId,
            success: false,
            error: `Output validation failed: ${outputValidation.errors.join(", ")}`,
            duration: Date.now() - startTime
          };
        }

        // Log action
        permissionChecker.logAction(
          agent,
          AgentAction.INVOKE,
          input,
          output
        );

        // Check required output field
        if (
          step.requiredOutput &&
          !(step.requiredOutput in (output.data || {}))
        ) {
          return {
            agentId: step.agentId,
            success: false,
            error: `Missing required output: ${step.requiredOutput}`,
            output,
            duration: Date.now() - startTime
          };
        }

        return {
          agentId: step.agentId,
          success: output.success,
          output,
          error: output.error,
          duration: Date.now() - startTime
        };
      } catch (error) {
        if (attempt < retries) {
          console.warn(
            `Step ${step.agentId} attempt ${attempt + 1} failed, retrying...`
          );
          await this.delay(this.config.retryDelayMs);
          continue;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Log failed action
        permissionChecker.logAction(
          agent,
          AgentAction.INVOKE,
          input,
          undefined,
          errorMessage
        );

        return {
          agentId: step.agentId,
          success: false,
          error: errorMessage,
          duration: Date.now() - startTime
        };
      }
    }

    // Should never reach here
    return {
      agentId: step.agentId,
      success: false,
      error: "Unexpected error",
      duration: Date.now() - startTime
    };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

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

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const orchestrator = new Orchestrator();
