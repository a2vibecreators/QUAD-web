/**
 * QUAD Event Bus
 * Async/parallel communication between agents via events
 *
 * Part of QUAD™ (Quick Unified Agentic Development) Methodology
 * © 2025 Suman Addanke / A2 Vibe Creators LLC
 */

import {
  AgentEvent,
  QUADAgent,
  Circle,
  AgentAction
} from "../types/agent";
import { permissionChecker } from "./permissions";

// =============================================================================
// TYPES
// =============================================================================

type EventHandler = (event: AgentEvent) => void | Promise<void>;

interface Subscription {
  agentId: string;
  eventType: string;       // Exact type or "*" for all
  handler: EventHandler;
  filter?: (event: AgentEvent) => boolean;  // Optional filter function
}

interface EventBusConfig {
  maxQueueSize: number;          // Max events in queue before oldest dropped
  eventRetentionMs: number;      // How long to keep events for replay
  enableReplay: boolean;         // Allow replaying past events
  logEvents: boolean;            // Log all events for debugging
}

// =============================================================================
// EVENT BUS
// =============================================================================

export class EventBus {
  private subscriptions: Map<string, Subscription[]> = new Map();  // eventType -> subscriptions
  private agents: Map<string, QUADAgent> = new Map();
  private eventHistory: AgentEvent[] = [];
  private config: EventBusConfig;

  constructor(config?: Partial<EventBusConfig>) {
    this.config = {
      maxQueueSize: 10000,
      eventRetentionMs: 3600000,  // 1 hour
      enableReplay: true,
      logEvents: false,
      ...config
    };

    // Cleanup old events periodically
    setInterval(() => this.cleanupOldEvents(), 60000);
  }

  // ===========================================================================
  // AGENT REGISTRATION
  // ===========================================================================

  /**
   * Register an agent with the event bus
   * Automatically subscribes to agent's declared subscribedEvents
   */
  registerAgent(agent: QUADAgent): void {
    this.agents.set(agent.agentId, agent);

    // Auto-subscribe to declared events
    if (agent.subscribedEvents && agent.onEvent) {
      for (const eventType of agent.subscribedEvents) {
        this.subscribe(agent.agentId, eventType, agent.onEvent.bind(agent));
      }
    }
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);

    // Remove all subscriptions for this agent
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((s) => s.agentId !== agentId);
      if (filtered.length === 0) {
        this.subscriptions.delete(eventType);
      } else {
        this.subscriptions.set(eventType, filtered);
      }
    }
  }

  // ===========================================================================
  // SUBSCRIPTION
  // ===========================================================================

  /**
   * Subscribe to an event type
   */
  subscribe(
    agentId: string,
    eventType: string,
    handler: EventHandler,
    filter?: (event: AgentEvent) => boolean
  ): () => void {
    const subscription: Subscription = {
      agentId,
      eventType,
      handler,
      filter
    };

    const subs = this.subscriptions.get(eventType) || [];
    subs.push(subscription);
    this.subscriptions.set(eventType, subs);

    // Return unsubscribe function
    return () => {
      const current = this.subscriptions.get(eventType) || [];
      const idx = current.indexOf(subscription);
      if (idx !== -1) {
        current.splice(idx, 1);
      }
    };
  }

  /**
   * Subscribe to all events (wildcard)
   */
  subscribeAll(
    agentId: string,
    handler: EventHandler,
    filter?: (event: AgentEvent) => boolean
  ): () => void {
    return this.subscribe(agentId, "*", handler, filter);
  }

  /**
   * Subscribe to events from a specific circle
   */
  subscribeToCircle(
    agentId: string,
    circle: Circle,
    handler: EventHandler
  ): () => void {
    return this.subscribe(agentId, "*", handler, (event) => {
      const sourceAgent = this.agents.get(event.source);
      return sourceAgent?.circle === circle;
    });
  }

  // ===========================================================================
  // EMIT
  // ===========================================================================

  /**
   * Emit an event to all subscribers
   */
  async emit(event: AgentEvent): Promise<void> {
    // Validate source agent exists
    const sourceAgent = this.agents.get(event.source);
    if (!sourceAgent) {
      console.warn(`Event from unknown agent: ${event.source}`);
    }

    // Log event if configured
    if (this.config.logEvents) {
      console.log(`[EventBus] ${event.eventType} from ${event.source}`);
    }

    // Store in history for replay
    if (this.config.enableReplay) {
      this.eventHistory.push(event);
      this.trimHistory();
    }

    // Get all matching subscriptions
    const matchingSubscriptions = this.getMatchingSubscriptions(event);

    // Deliver to all subscribers
    const deliveryPromises = matchingSubscriptions.map(async (sub) => {
      // Check if subscriber is still registered
      const subscriberAgent = this.agents.get(sub.agentId);

      // Check permissions (if both agents are registered)
      if (sourceAgent && subscriberAgent) {
        // Source must be allowed to emit to subscriber
        // For now, we allow all emit (can be restricted later)
      }

      // Apply custom filter if exists
      if (sub.filter && !sub.filter(event)) {
        return;
      }

      // Check target restrictions
      if (event.targetAgents && !event.targetAgents.includes(sub.agentId)) {
        return;
      }

      if (event.targetCircles && subscriberAgent) {
        if (!event.targetCircles.includes(subscriberAgent.circle)) {
          return;
        }
      }

      // Deliver event
      try {
        await sub.handler(event);

        // Log successful delivery
        if (sourceAgent) {
          permissionChecker.logAction(
            sourceAgent,
            AgentAction.EMIT,
            {
              requestId: event.eventId,
              data: { eventType: event.eventType },
              invokedBy: event.source,
              invocationMethod: "AUTO" as any,
              timestamp: event.timestamp
            }
          );
        }
      } catch (error) {
        console.error(
          `[EventBus] Handler error for ${sub.agentId}:`,
          error
        );
      }
    });

    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Emit an event and wait for all handlers to complete
   */
  async emitSync(event: AgentEvent): Promise<void> {
    return this.emit(event);
  }

  /**
   * Emit multiple events in parallel
   */
  async emitBatch(events: AgentEvent[]): Promise<void> {
    await Promise.all(events.map((e) => this.emit(e)));
  }

  // ===========================================================================
  // REPLAY
  // ===========================================================================

  /**
   * Replay events from history to a specific agent
   * Useful for agents that come online late
   */
  async replayTo(
    agentId: string,
    options?: {
      eventTypes?: string[];     // Filter by event types
      since?: Date;              // Only events after this time
      limit?: number;            // Max events to replay
    }
  ): Promise<number> {
    if (!this.config.enableReplay) {
      console.warn("[EventBus] Replay is disabled");
      return 0;
    }

    const agent = this.agents.get(agentId);
    if (!agent || !agent.onEvent) {
      return 0;
    }

    let events = [...this.eventHistory];

    // Apply filters
    if (options?.eventTypes) {
      events = events.filter((e) =>
        options.eventTypes!.includes(e.eventType)
      );
    }

    if (options?.since) {
      events = events.filter((e) => e.timestamp >= options.since!);
    }

    if (options?.limit) {
      events = events.slice(-options.limit);
    }

    // Replay events
    for (const event of events) {
      try {
        await agent.onEvent(event);
      } catch (error) {
        console.error(`[EventBus] Replay error for ${agentId}:`, error);
      }
    }

    return events.length;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Get subscriptions matching an event
   */
  private getMatchingSubscriptions(event: AgentEvent): Subscription[] {
    const result: Subscription[] = [];

    // Exact match
    const exactSubs = this.subscriptions.get(event.eventType) || [];
    result.push(...exactSubs);

    // Wildcard match
    const wildcardSubs = this.subscriptions.get("*") || [];
    result.push(...wildcardSubs);

    // Hierarchical match (e.g., "story.*" matches "story.expanded")
    for (const [pattern, subs] of this.subscriptions.entries()) {
      if (pattern.endsWith(".*")) {
        const prefix = pattern.slice(0, -2);
        if (event.eventType.startsWith(prefix + ".")) {
          result.push(...subs);
        }
      }
    }

    return result;
  }

  /**
   * Trim event history to max size
   */
  private trimHistory(): void {
    if (this.eventHistory.length > this.config.maxQueueSize) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxQueueSize);
    }
  }

  /**
   * Cleanup old events from history
   */
  private cleanupOldEvents(): void {
    const cutoff = Date.now() - this.config.eventRetentionMs;
    this.eventHistory = this.eventHistory.filter(
      (e) => e.timestamp.getTime() > cutoff
    );
  }

  /**
   * Get event history (for debugging)
   */
  getHistory(limit = 100): AgentEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear all subscriptions and history
   */
  clear(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
  }

  /**
   * Get subscription count for debugging
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const subs of this.subscriptions.values()) {
      count += subs.length;
    }
    return count;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create an AgentEvent
 */
export function createEvent(
  source: string,
  eventType: string,
  payload: Record<string, unknown>,
  options?: {
    targetAgents?: string[];
    targetCircles?: Circle[];
  }
): AgentEvent {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    source,
    payload,
    timestamp: new Date(),
    targetAgents: options?.targetAgents,
    targetCircles: options?.targetCircles
  };
}

// =============================================================================
// COMMON EVENT TYPES
// =============================================================================

export const EventTypes = {
  // Circle 1: Management
  STORY_CREATED: "story.created",
  STORY_EXPANDED: "story.expanded",
  STORY_ESTIMATED: "story.estimated",
  STORY_ASSIGNED: "story.assigned",

  // Circle 2: Development
  CODE_PUSHED: "code.pushed",
  CODE_REVIEWED: "code.reviewed",
  PR_CREATED: "pr.created",
  PR_MERGED: "pr.merged",

  // Circle 3: QA
  TEST_STARTED: "test.started",
  TEST_PASSED: "test.passed",
  TEST_FAILED: "test.failed",
  BUG_FOUND: "bug.found",

  // Circle 4: Infrastructure
  BUILD_STARTED: "build.started",
  BUILD_COMPLETED: "build.completed",
  DEPLOY_STARTED: "deploy.started",
  DEPLOY_COMPLETED: "deploy.completed",
  ALERT_TRIGGERED: "alert.triggered",

  // Pipeline
  PIPELINE_STARTED: "pipeline.started",
  PIPELINE_COMPLETED: "pipeline.completed",
  PIPELINE_FAILED: "pipeline.failed",

  // Agent lifecycle
  AGENT_REGISTERED: "agent.registered",
  AGENT_UNREGISTERED: "agent.unregistered"
} as const;

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const eventBus = new EventBus();
