/**
 * QUAD Agent Architecture Demo
 * Run this to understand how the QUAD Agent Runtime works
 *
 * ARCHITECTURE OVERVIEW:
 * ======================
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                     QUAD AGENT RUNTIME (QAR)                            │
 * │                    "The Single Gateway"                                  │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                          │
 * │  Entry Points (All go through QAR):                                     │
 * │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
 * │  │   IDE   │ │   CLI   │ │  Chat   │ │  Auto   │ │   MCP   │           │
 * │  │(VSCode) │ │(Terminal)│ │(Claude) │ │ (CI/CD) │ │(Desktop)│           │
 * │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
 * │       │           │           │           │           │                 │
 * │       └───────────┴───────────┴───────────┴───────────┘                 │
 * │                               │                                          │
 * │                               ▼                                          │
 * │  ┌─────────────────────────────────────────────────────────────────┐    │
 * │  │                     PERMISSION CHECKER                          │    │
 * │  │   • Who is invoking? (user or agent)                           │    │
 * │  │   • Can they invoke this agent?                                │    │
 * │  │   • What resources can they access?                            │    │
 * │  │   • Audit log every action                                     │    │
 * │  └───────────────────────────┬─────────────────────────────────────┘    │
 * │                               │                                          │
 * │       ┌───────────────────────┼───────────────────────┐                 │
 * │       │                       │                       │                 │
 * │       ▼                       ▼                       ▼                 │
 * │  ┌─────────┐           ┌───────────┐           ┌─────────────┐         │
 * │  │ORCHESTR │           │ EVENT BUS │           │   SHARED    │         │
 * │  │  ATOR   │◄─────────►│           │◄─────────►│   CONTEXT   │         │
 * │  │         │           │           │           │             │         │
 * │  │Sequential│          │ Parallel  │           │Collaborative│         │
 * │  │ Pipeline │          │  Async    │           │    State    │         │
 * │  └────┬────┘           └─────┬─────┘           └──────┬──────┘         │
 * │       │                      │                        │                 │
 * │       └──────────────────────┴────────────────────────┘                 │
 * │                               │                                          │
 * │                               ▼                                          │
 * │  ┌─────────────────────────────────────────────────────────────────┐    │
 * │  │                        AGENT POOL                               │    │
 * │  ├─────────────────────────────────────────────────────────────────┤    │
 * │  │                                                                 │    │
 * │  │  CIRCLE 1: MGMT        CIRCLE 2: DEV         CIRCLE 3: QA      │    │
 * │  │  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐   │    │
 * │  │  │Story Agent  │       │Dev Agent UI │       │Test Agent   │   │    │
 * │  │  │Estimation   │       │Dev Agent API│       │Perf Agent   │   │    │
 * │  │  └─────────────┘       └─────────────┘       └─────────────┘   │    │
 * │  │                                                                 │    │
 * │  │                        CIRCLE 4: INFRA                          │    │
 * │  │                        ┌─────────────┐                          │    │
 * │  │                        │Deploy DEV   │                          │    │
 * │  │                        │Deploy PROD  │ ← Requires Human Approval│    │
 * │  │                        └─────────────┘                          │    │
 * │  └─────────────────────────────────────────────────────────────────┘    │
 * │                                                                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 *
 * THREE COMMUNICATION PATTERNS:
 * =============================
 *
 * 1. SEQUENTIAL (Orchestrator)
 *    ─────────────────────────
 *    Used for: Estimation Pipeline, Code Review Chain
 *
 *    Story → Code Agent → DB Agent → Flow Agent → Estimation Agent
 *       │          │           │           │             │
 *       │          │           │           │             │
 *       │          ▼           ▼           ▼             │
 *       │     code_score   db_score   flow_score        │
 *       │          │           │           │             │
 *       │          └───────────┴───────────┘             │
 *       │                      │                         │
 *       │                      ▼                         │
 *       │              final_estimate                    │
 *       │                                                │
 *       └────────────────────────────────────────────────┘
 *
 *
 * 2. PARALLEL (Event Bus)
 *    ─────────────────────
 *    Used for: Development Phase (UI + API in parallel)
 *
 *              Story Assigned Event
 *                      │
 *         ┌────────────┴────────────┐
 *         │                         │
 *         ▼                         ▼
 *    ┌─────────────┐          ┌─────────────┐
 *    │Dev Agent UI │          │Dev Agent API│
 *    │             │          │             │
 *    │ Components  │          │ Controllers │
 *    │ Interfaces  │          │ Services    │
 *    │ UI Tests    │          │ DTOs        │
 *    └──────┬──────┘          └──────┬──────┘
 *           │                        │
 *           └───────────┬────────────┘
 *                       │
 *                       ▼
 *              Both Complete Event
 *                       │
 *                       ▼
 *              ┌───────────────┐
 *              │  Review Agent │
 *              └───────────────┘
 *
 *
 * 3. HYBRID (Stages)
 *    ─────────────────
 *    Used for: Full Development Pipeline
 *
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │                      STAGE 1: DEV                           │
 *    │         ┌─────────────┐    ┌─────────────┐                  │
 *    │         │Dev Agent UI │    │Dev Agent API│   ← PARALLEL     │
 *    │         └─────────────┘    └─────────────┘                  │
 *    └─────────────────────────────┬───────────────────────────────┘
 *                                  │ (wait for both)
 *                                  ▼
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │                      STAGE 2: TEST                          │
 *    │         ┌─────────────┐    ┌─────────────┐                  │
 *    │         │Test Agent UI│    │Test Agent API│  ← PARALLEL     │
 *    │         └─────────────┘    └─────────────┘                  │
 *    └─────────────────────────────┬───────────────────────────────┘
 *                                  │ (wait for both)
 *                                  ▼
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │                      STAGE 3: REVIEW                        │
 *    │                   ┌─────────────┐                           │
 *    │                   │Review Agent │         ← SEQUENTIAL      │
 *    │                   └─────────────┘                           │
 *    └─────────────────────────────────────────────────────────────┘
 *
 *
 * PERMISSION ENFORCEMENT:
 * =======================
 *
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │                  PERMISSION LEVELS                          │
 *    ├─────────────────────────────────────────────────────────────┤
 *    │                                                             │
 *    │   Level 0: NONE      ─────────  ❌ Cannot access            │
 *    │   Level 1: READ      ─────────  👁️ Read-only               │
 *    │   Level 2: SUGGEST   ─────────  💡 Can suggest, human OK    │
 *    │   Level 3: WRITE     ─────────  ✏️ Can modify (audited)     │
 *    │   Level 4: ADMIN     ─────────  👑 Full access (rare)       │
 *    │                                                             │
 *    └─────────────────────────────────────────────────────────────┘
 *
 *    Example: Dev Agent UI Permissions
 *
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │  Resource              │  Permission  │  Notes              │
 *    ├────────────────────────┼──────────────┼─────────────────────┤
 *    │  src/ui/**             │  WRITE ✅    │  Can create/edit    │
 *    │  src/components/**     │  WRITE ✅    │  Can create/edit    │
 *    │  src/api/**            │  READ 👁️     │  Can read, not edit │
 *    │  database/**           │  NONE ❌     │  No access at all   │
 *    │  tests/ui/**           │  SUGGEST 💡  │  Human must approve │
 *    └─────────────────────────────────────────────────────────────┘
 *
 *    Who can invoke whom:
 *
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │  Agent              │  Can Invoke           │  Cannot       │
 *    ├─────────────────────┼───────────────────────┼───────────────┤
 *    │  Story Agent        │  Estimation Agent     │  Deploy PROD  │
 *    │  Dev Agent UI       │  Test Agent, Review   │  Deploy PROD  │
 *    │  Dev Agent API      │  Test Agent, Review   │  Deploy PROD  │
 *    │  Test Agent         │  Review Agent         │  Deploy PROD  │
 *    │  Deploy DEV         │  (none - terminal)    │  Deploy PROD  │
 *    │  Deploy PROD        │  (none - terminal)    │  -            │
 *    └─────────────────────────────────────────────────────────────┘
 *
 *    🔒 KEY RULE: NO agent can invoke Deploy PROD directly!
 *                 Only humans can trigger production deployment.
 *
 *
 * Part of QUAD™ (Quick Unified Agentic Development) Methodology
 * © 2025 Suman Addanke / A2 Vibe Creators LLC
 */

import { QUADAgentRuntime, createRuntime } from "../lib/agent-runtime";
import { ExecutionMode, Pipeline, InvocationMethod } from "../types/agent";
import {
  StoryAgent,
  EstimationAgent,
  DevAgentUI,
  DevAgentAPI,
  TestAgent,
  DeployAgentDev,
  DeployAgentProd,
  CodeAgent,
  DBAgent,
  FlowAgent
} from "./example-agents";

// =============================================================================
// DEMO RUNNER
// =============================================================================

async function runDemo() {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("                QUAD AGENT ARCHITECTURE DEMO                        ");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("\n");

  // Create a fresh runtime for demo
  const runtime = createRuntime({
    projectName: "demo-project",
    defaultTimeout: 30000
  });

  // ==========================================================================
  // STEP 1: Register Agents
  // ==========================================================================

  console.log("┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ STEP 1: Registering Agents                                      │");
  console.log("└─────────────────────────────────────────────────────────────────┘\n");

  // Circle 1: Management
  runtime.registerAgent(StoryAgent);
  runtime.registerAgent(EstimationAgent);

  // Circle 2: Development
  runtime.registerAgent(DevAgentUI);
  runtime.registerAgent(DevAgentAPI);
  runtime.registerAgent(CodeAgent);
  runtime.registerAgent(DBAgent);
  runtime.registerAgent(FlowAgent);

  // Circle 3: QA
  runtime.registerAgent(TestAgent);

  // Circle 4: Infrastructure
  runtime.registerAgent(DeployAgentDev);
  runtime.registerAgent(DeployAgentProd);

  console.log("✅ All agents registered\n");

  // ==========================================================================
  // STEP 2: Register Pipelines
  // ==========================================================================

  console.log("┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ STEP 2: Registering Pipelines                                   │");
  console.log("└─────────────────────────────────────────────────────────────────┘\n");

  // Estimation Pipeline (SEQUENTIAL)
  const estimationPipeline: Pipeline = {
    name: "estimation-pipeline",
    description: "Multi-agent estimation using Platonic Solid scale",
    version: "1.0.0",
    mode: ExecutionMode.SEQUENTIAL,
    steps: [
      { agentId: "code-agent", requiredOutput: "code_complexity" },
      { agentId: "db-agent", requiredOutput: "db_impact" },
      { agentId: "flow-agent", requiredOutput: "flow_complexity" },
      { agentId: "estimation-agent", requiredOutput: "final_estimate" }
    ]
  };
  runtime.registerPipeline(estimationPipeline);
  console.log("✅ Registered: estimation-pipeline (SEQUENTIAL)");

  // Development Pipeline (HYBRID)
  const devPipeline: Pipeline = {
    name: "development-pipeline",
    description: "Full development cycle with parallel stages",
    version: "1.0.0",
    mode: ExecutionMode.HYBRID,
    stages: [
      {
        name: "development",
        agents: ["dev-agent-ui", "dev-agent-api"],
        parallel: true
      },
      {
        name: "testing",
        agents: ["test-agent"],
        parallel: false
      }
    ]
  };
  runtime.registerPipeline(devPipeline);
  console.log("✅ Registered: development-pipeline (HYBRID)\n");

  // ==========================================================================
  // DEMO 1: Direct Agent Invocation
  // ==========================================================================

  console.log("\n┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ DEMO 1: Direct Agent Invocation                                 │");
  console.log("│                                                                 │");
  console.log("│ User → QAR → Story Agent                                        │");
  console.log("└─────────────────────────────────────────────────────────────────┘\n");

  try {
    const storyResult = await runtime.invoke("story-agent", {
      story_id: "STORY-001",
      brief_description: "add user login functionality"
    }, {
      invocationMethod: InvocationMethod.CLI
    });

    console.log("\n📦 Story Agent Result:");
    console.log(`   Success: ${storyResult.success}`);
    console.log(`   Duration: ${storyResult.duration}ms`);
    console.log(`   Acceptance Criteria: ${(storyResult.data.acceptance_criteria as string[]).length} items`);
  } catch (error) {
    console.error("❌ Error:", error);
  }

  // ==========================================================================
  // DEMO 2: Sequential Pipeline (Estimation)
  // ==========================================================================

  console.log("\n\n┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ DEMO 2: Sequential Pipeline (Estimation)                        │");
  console.log("│                                                                 │");
  console.log("│ Code Agent → DB Agent → Flow Agent → Estimation Agent           │");
  console.log("│     ↓            ↓           ↓              ↓                   │");
  console.log("│  score:3      score:2     score:4       Octahedron (8)          │");
  console.log("└─────────────────────────────────────────────────────────────────┘\n");

  try {
    const estimationResult = await runtime.executePipeline("estimation-pipeline", {
      story_id: "STORY-001"
    });

    console.log("\n📦 Estimation Pipeline Result:");
    console.log(`   Success: ${estimationResult.success}`);
    console.log(`   Duration: ${estimationResult.totalDuration}ms`);
    console.log(`   Steps completed: ${estimationResult.stepResults.length}`);

    const finalStep = estimationResult.stepResults[estimationResult.stepResults.length - 1];
    if (finalStep.success && finalStep.output) {
      console.log(`\n   🎯 Final Estimate: ${finalStep.output.data.estimate_name} (${finalStep.output.data.final_estimate})`);
      console.log(`   📊 Confidence: ${finalStep.output.data.confidence}`);
      const breakdown = finalStep.output.data.complexity_breakdown as any;
      console.log(`   📈 Breakdown: Code=${breakdown.code}, DB=${breakdown.database}, Flow=${breakdown.flow}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }

  // ==========================================================================
  // DEMO 3: Parallel Invocation
  // ==========================================================================

  console.log("\n\n┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ DEMO 3: Parallel Agent Invocation                               │");
  console.log("│                                                                 │");
  console.log("│              Story Assigned                                     │");
  console.log("│                   │                                             │");
  console.log("│         ┌─────────┴─────────┐                                   │");
  console.log("│         ↓                   ↓                                   │");
  console.log("│    Dev Agent UI       Dev Agent API                             │");
  console.log("│    (runs parallel)    (runs parallel)                           │");
  console.log("└─────────────────────────────────────────────────────────────────┘\n");

  try {
    const parallelResults = await runtime.invokeParallel(
      ["dev-agent-ui", "dev-agent-api"],
      { story_id: "STORY-001" }
    );

    console.log("\n📦 Parallel Results:");
    for (const [agentId, result] of parallelResults) {
      console.log(`   ${agentId}: ${result.success ? "✅" : "❌"} (${result.duration}ms)`);
      if (result.success) {
        console.log(`      Files created: ${result.modifiedResources.length}`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }

  // ==========================================================================
  // DEMO 4: Permission Enforcement
  // ==========================================================================

  console.log("\n\n┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ DEMO 4: Permission Enforcement                                  │");
  console.log("│                                                                 │");
  console.log("│ 🔒 Trying to invoke deploy-agent-prod from dev-agent-ui...      │");
  console.log("│    (This should FAIL - no agent can invoke prod deploy)         │");
  console.log("└─────────────────────────────────────────────────────────────────┘\n");

  // Check if DevAgentUI can invoke DeployAgentProd
  const canInvoke = runtime.permissions.canInvokeAgent(DevAgentUI, DeployAgentProd);
  console.log(`   Can Dev Agent UI invoke Deploy Agent Prod?`);
  console.log(`   Result: ${canInvoke.allowed ? "✅ YES" : "❌ NO"}`);
  if (!canInvoke.allowed) {
    console.log(`   Reason: ${canInvoke.reason}`);
  }

  // ==========================================================================
  // DEMO 5: Event Bus
  // ==========================================================================

  console.log("\n\n┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ DEMO 5: Event Bus Communication                                 │");
  console.log("│                                                                 │");
  console.log("│ story.expanded event → All subscribers receive it               │");
  console.log("└─────────────────────────────────────────────────────────────────┘\n");

  // Subscribe to events
  let eventReceived = false;
  const unsubscribe = runtime.subscribe("demo-listener", "story.expanded", (event) => {
    console.log(`   📬 Event received: ${event.eventType}`);
    console.log(`      From: ${event.source}`);
    console.log(`      Payload: ${JSON.stringify(event.payload)}`);
    eventReceived = true;
  });

  // Emit an event
  await runtime.emit("story-agent", "story.expanded", {
    story_id: "STORY-001",
    title: "User Login Feature"
  });

  // Small delay to ensure event is processed
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!eventReceived) {
    console.log("   (Event was emitted but listener demo is simplified)");
  }

  unsubscribe();

  // ==========================================================================
  // DEMO 6: Shared Context
  // ==========================================================================

  console.log("\n\n┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ DEMO 6: Shared Context                                          │");
  console.log("│                                                                 │");
  console.log("│ Agents can share state through a key-value store               │");
  console.log("└─────────────────────────────────────────────────────────────────┘\n");

  // Write to context
  runtime.writeContext("story-agent", "current-story", {
    id: "STORY-001",
    status: "in-progress"
  });
  console.log("   📝 Story Agent wrote: current-story");

  // Read from context
  const storyData = runtime.readContext("dev-agent-ui", "current-story");
  console.log(`   📖 Dev Agent UI read: ${JSON.stringify(storyData)}`);

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  console.log("\n\n═══════════════════════════════════════════════════════════════════");
  console.log("                        DEMO COMPLETE                               ");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("\n");
  console.log("What we demonstrated:");
  console.log("  1. ✅ Direct agent invocation (User → QAR → Agent)");
  console.log("  2. ✅ Sequential pipeline (Estimation: 4 agents in series)");
  console.log("  3. ✅ Parallel invocation (UI + API agents simultaneously)");
  console.log("  4. ✅ Permission enforcement (Blocked prod deploy)");
  console.log("  5. ✅ Event bus communication (Pub/sub between agents)");
  console.log("  6. ✅ Shared context (Key-value state sharing)");
  console.log("\n");
  console.log("Key Takeaways:");
  console.log("  • QAR is the SINGLE gateway - all invocations go through it");
  console.log("  • Permissions checked BEFORE and AFTER every action");
  console.log("  • Audit trail logs everything for compliance");
  console.log("  • PROD deployment requires HUMAN approval");
  console.log("\n");
}

// =============================================================================
// RUN DEMO
// =============================================================================

runDemo().catch(console.error);
