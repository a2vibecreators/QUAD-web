/**
 * QUAD Example Agents
 * Demonstrable example agents for the QUAD Agent Communication Architecture
 *
 * This file shows how to:
 * 1. Create agents that implement the QUADAgent interface
 * 2. Set up proper permissions
 * 3. Handle events
 * 4. Use shared context
 *
 * Part of QUAD™ (Quick Unified Agentic Development) Methodology
 * © 2025 Suman Addanke / A2 Vibe Creators LLC
 */

import {
  QUADAgent,
  AgentInput,
  AgentOutput,
  AgentEvent,
  Circle,
  PermissionLevel,
  Permission
} from "../types/agent";

// =============================================================================
// HELPER: Create standard permissions
// =============================================================================

function createReadPermission(resource: string): Permission {
  return { resource, level: PermissionLevel.READ };
}

function createWritePermission(resource: string): Permission {
  return { resource, level: PermissionLevel.WRITE };
}

// =============================================================================
// CIRCLE 1: MANAGEMENT - Story Agent
// =============================================================================

/**
 * Story Agent - Expands user stories with AI
 *
 * FLOW:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        STORY AGENT                               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  INPUT:                                                         │
 * │    - story_id: string                                           │
 * │    - brief_description: string                                  │
 * │                                                                 │
 * │  PROCESS:                                                       │
 * │    1. Read brief description                                    │
 * │    2. Generate acceptance criteria                              │
 * │    3. Identify edge cases                                       │
 * │    4. Suggest technical approach                                │
 * │                                                                 │
 * │  OUTPUT:                                                        │
 * │    - expanded_story: object                                     │
 * │    - acceptance_criteria: string[]                              │
 * │    - edge_cases: string[]                                       │
 * │    - tech_notes: string                                         │
 * │                                                                 │
 * │  EVENTS EMITTED:                                                │
 * │    - story.expanded                                             │
 * └─────────────────────────────────────────────────────────────────┘
 */
export const StoryAgent: QUADAgent = {
  // Identity
  agentId: "story-agent",
  circle: Circle.MANAGEMENT,
  version: "1.0.0",
  description: "Expands user stories with AI-generated details",

  // Capabilities
  capabilities: ["expand-story", "generate-acceptance", "identify-edge-cases"],
  requiredInputs: ["story_id", "brief_description"],
  outputs: ["expanded_story", "acceptance_criteria", "edge_cases", "tech_notes"],

  // Permissions
  canRead: [
    createReadPermission("stories/**"),
    createReadPermission("requirements/**"),
    createReadPermission("documentation/**")
  ],
  canWrite: [
    createWritePermission("stories/**")
  ],
  canInvoke: ["estimation-agent"],  // Can call estimation after expansion
  cannotInvoke: ["deploy-agent-prod"],  // Cannot deploy
  maxModifications: 10,
  requiresApproval: false,

  // Event subscriptions
  subscribedEvents: ["story.created"],

  // Main execution
  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const { story_id, brief_description } = input.data as {
      story_id: string;
      brief_description: string;
    };

    console.log(`[StoryAgent] Expanding story ${story_id}...`);

    // Simulate AI expansion
    await simulateDelay(500);

    const expandedStory = {
      id: story_id,
      title: `Expanded: ${brief_description}`,
      description: `As a user, I want to ${brief_description} so that I can achieve my goals.`,
      acceptanceCriteria: [
        `Given the user is logged in`,
        `When they ${brief_description}`,
        `Then the system should respond appropriately`
      ],
      edgeCases: [
        "What if the user is not logged in?",
        "What if the input is invalid?",
        "What if the network fails?"
      ],
      techNotes: "Consider using caching for performance"
    };

    console.log(`[StoryAgent] Story ${story_id} expanded successfully`);

    return {
      requestId: input.requestId,
      agentId: "story-agent",
      success: true,
      data: {
        expanded_story: expandedStory,
        acceptance_criteria: expandedStory.acceptanceCriteria,
        edge_cases: expandedStory.edgeCases,
        tech_notes: expandedStory.techNotes
      },
      modifiedResources: [`stories/${story_id}`],
      readResources: [`stories/${story_id}`],
      duration: Date.now() - startTime,
      nextAgentHint: "estimation-agent"
    };
  },

  // Handle story.created event
  onEvent(event: AgentEvent) {
    console.log(`[StoryAgent] Received event: ${event.eventType}`);
  }
};

// =============================================================================
// CIRCLE 1: MANAGEMENT - Estimation Agent
// =============================================================================

/**
 * Estimation Agent - Multi-agent pipeline for complexity estimation
 *
 * FLOW:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    ESTIMATION PIPELINE                          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
 * │  │  Code    │───►│   DB     │───►│  Flow    │───►│  Final   │  │
 * │  │  Agent   │    │  Agent   │    │  Agent   │    │ Estimate │  │
 * │  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
 * │       │               │               │               │        │
 * │       ▼               ▼               ▼               ▼        │
 * │   code_score      db_score       flow_score    final_estimate  │
 * │     (1-5)          (1-5)           (1-5)         (4-20)        │
 * │                                                                 │
 * │  Formula: final = code + db + flow + integration_factor        │
 * │                                                                 │
 * │  Platonic Solid Scale:                                         │
 * │    4  = Tetrahedron (Trivial)                                  │
 * │    6  = Cube (Simple)                                          │
 * │    8  = Octahedron (Moderate)                                  │
 * │    12 = Dodecahedron (Complex)                                 │
 * │    20 = Icosahedron (Very Complex)                             │
 * │                                                                 │
 * └─────────────────────────────────────────────────────────────────┘
 */
export const EstimationAgent: QUADAgent = {
  agentId: "estimation-agent",
  circle: Circle.MANAGEMENT,
  version: "1.0.0",
  description: "Estimates story complexity using multi-agent pipeline",

  capabilities: ["estimate-complexity", "calculate-effort"],
  requiredInputs: ["story_id"],
  outputs: ["final_estimate", "complexity_breakdown", "confidence"],

  canRead: [
    createReadPermission("stories/**"),
    createReadPermission("code/**"),
    createReadPermission("database/**")
  ],
  canWrite: [
    createWritePermission("stories/**/estimate")
  ],
  canInvoke: [],  // This is the FINAL agent in the pipeline
  cannotInvoke: ["deploy-agent-prod"],
  maxModifications: 5,
  requiresApproval: false,

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const { story_id } = input.data as { story_id: string };

    // Get scores from previous agents in pipeline (if running as pipeline)
    const codeScore = (input.previousOutput?.data?.code_complexity as number) || 3;
    const dbScore = (input.previousOutput?.data?.db_impact as number) || 2;
    const flowScore = (input.previousOutput?.data?.flow_complexity as number) || 2;

    console.log(`[EstimationAgent] Calculating estimate for story ${story_id}`);
    console.log(`  Code: ${codeScore}, DB: ${dbScore}, Flow: ${flowScore}`);

    // Calculate final score
    const integrationFactor = Math.ceil((codeScore + dbScore + flowScore) / 6);
    const rawScore = codeScore + dbScore + flowScore + integrationFactor;

    // Map to Platonic Solid scale
    const platonicScale = mapToPlatonicSolid(rawScore);

    console.log(`[EstimationAgent] Final estimate: ${platonicScale.name} (${platonicScale.value})`);

    return {
      requestId: input.requestId,
      agentId: "estimation-agent",
      success: true,
      data: {
        final_estimate: platonicScale.value,
        estimate_name: platonicScale.name,
        complexity_breakdown: {
          code: codeScore,
          database: dbScore,
          flow: flowScore,
          integration: integrationFactor
        },
        confidence: calculateConfidence(codeScore, dbScore, flowScore)
      },
      modifiedResources: [`stories/${story_id}/estimate`],
      readResources: [`stories/${story_id}`],
      duration: Date.now() - startTime
    };
  }
};

// =============================================================================
// CIRCLE 2: DEVELOPMENT - Dev Agent (UI)
// =============================================================================

/**
 * Dev Agent UI - Generates UI component scaffolding
 *
 * FLOW:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      DEV AGENT (UI)                              │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  INPUT:                                                         │
 * │    - story_id: string                                           │
 * │    - expanded_story: object (from Story Agent)                  │
 * │                                                                 │
 * │  PROCESS:                                                       │
 * │    1. Analyze story requirements                                │
 * │    2. Generate component structure                              │
 * │    3. Create TypeScript interfaces                              │
 * │    4. Scaffold tests                                            │
 * │                                                                 │
 * │  OUTPUT:                                                        │
 * │    - components: string[] (file paths)                          │
 * │    - interfaces: string[] (file paths)                          │
 * │    - test_files: string[] (file paths)                          │
 * │                                                                 │
 * │  PERMISSIONS:                                                   │
 * │    ✅ Can write: src/ui/**, src/components/**                   │
 * │    ✅ Can read: src/**                                          │
 * │    ❌ Cannot write: src/api/**, database/**                     │
 * │    ❌ Cannot invoke: deploy-agent-prod                          │
 * └─────────────────────────────────────────────────────────────────┘
 */
export const DevAgentUI: QUADAgent = {
  agentId: "dev-agent-ui",
  circle: Circle.DEVELOPMENT,
  version: "1.0.0",
  description: "Generates UI components and scaffolding",

  capabilities: ["generate-component", "create-interface", "scaffold-test"],
  requiredInputs: ["story_id"],
  outputs: ["components", "interfaces", "test_files"],

  canRead: [
    createReadPermission("src/**"),
    createReadPermission("stories/**")
  ],
  canWrite: [
    createWritePermission("src/ui/**"),
    createWritePermission("src/components/**"),
    createWritePermission("tests/ui/**")
  ],
  canInvoke: ["test-agent-ui", "review-agent"],
  cannotInvoke: ["deploy-agent-prod", "dev-agent-api"],  // UI agent can't touch API
  maxModifications: 20,
  requiresApproval: false,

  subscribedEvents: ["story.assigned"],

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const { story_id } = input.data as { story_id: string };

    console.log(`[DevAgentUI] Generating UI components for story ${story_id}`);
    await simulateDelay(300);

    const componentName = `Feature${story_id}`;
    const components = [
      `src/components/${componentName}/${componentName}.tsx`,
      `src/components/${componentName}/${componentName}.styles.ts`,
      `src/components/${componentName}/index.ts`
    ];

    const interfaces = [
      `src/types/${componentName}.types.ts`
    ];

    const testFiles = [
      `tests/ui/${componentName}.test.tsx`
    ];

    console.log(`[DevAgentUI] Generated ${components.length} components`);

    return {
      requestId: input.requestId,
      agentId: "dev-agent-ui",
      success: true,
      data: {
        components,
        interfaces,
        test_files: testFiles
      },
      modifiedResources: [...components, ...interfaces, ...testFiles],
      readResources: [`stories/${story_id}`],
      duration: Date.now() - startTime,
      nextAgentHint: "test-agent-ui"
    };
  },

  onEvent(event: AgentEvent) {
    if (event.eventType === "story.assigned") {
      console.log(`[DevAgentUI] Story assigned, ready to generate UI`);
    }
  }
};

// =============================================================================
// CIRCLE 2: DEVELOPMENT - Dev Agent (API)
// =============================================================================

/**
 * Dev Agent API - Generates API endpoints and services
 *
 * FLOW (runs in PARALLEL with Dev Agent UI):
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      DEV AGENT (API)                             │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  INPUT:                                                         │
 * │    - story_id: string                                           │
 * │    - expanded_story: object                                     │
 * │                                                                 │
 * │  PROCESS:                                                       │
 * │    1. Analyze API requirements                                  │
 * │    2. Generate controller                                       │
 * │    3. Create service layer                                      │
 * │    4. Generate DTOs                                             │
 * │    5. Create repository                                         │
 * │                                                                 │
 * │  OUTPUT:                                                        │
 * │    - controllers: string[]                                      │
 * │    - services: string[]                                         │
 * │    - dtos: string[]                                             │
 * │    - repositories: string[]                                     │
 * │                                                                 │
 * │  PERMISSIONS:                                                   │
 * │    ✅ Can write: src/api/**, src/services/**                    │
 * │    ✅ Can read: src/**, database/schema/**                      │
 * │    ❌ Cannot write: src/ui/**, database/data/**                 │
 * └─────────────────────────────────────────────────────────────────┘
 */
export const DevAgentAPI: QUADAgent = {
  agentId: "dev-agent-api",
  circle: Circle.DEVELOPMENT,
  version: "1.0.0",
  description: "Generates API endpoints, services, and DTOs",

  capabilities: ["generate-controller", "create-service", "generate-dto"],
  requiredInputs: ["story_id"],
  outputs: ["controllers", "services", "dtos", "repositories"],

  canRead: [
    createReadPermission("src/**"),
    createReadPermission("database/schema/**"),
    createReadPermission("stories/**")
  ],
  canWrite: [
    createWritePermission("src/api/**"),
    createWritePermission("src/services/**"),
    createWritePermission("src/dto/**"),
    createWritePermission("src/repository/**"),
    createWritePermission("tests/api/**")
  ],
  canInvoke: ["test-agent-api", "review-agent"],
  cannotInvoke: ["deploy-agent-prod", "dev-agent-ui"],
  maxModifications: 20,
  requiresApproval: false,

  subscribedEvents: ["story.assigned"],

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const { story_id } = input.data as { story_id: string };

    console.log(`[DevAgentAPI] Generating API for story ${story_id}`);
    await simulateDelay(400);

    const featureName = `Feature${story_id}`;
    const controllers = [`src/api/controllers/${featureName}Controller.ts`];
    const services = [`src/services/${featureName}Service.ts`];
    const dtos = [
      `src/dto/${featureName}Request.ts`,
      `src/dto/${featureName}Response.ts`
    ];
    const repositories = [`src/repository/${featureName}Repository.ts`];

    console.log(`[DevAgentAPI] Generated API structure for ${featureName}`);

    return {
      requestId: input.requestId,
      agentId: "dev-agent-api",
      success: true,
      data: {
        controllers,
        services,
        dtos,
        repositories
      },
      modifiedResources: [...controllers, ...services, ...dtos, ...repositories],
      readResources: [`stories/${story_id}`, `database/schema`],
      duration: Date.now() - startTime,
      nextAgentHint: "test-agent-api"
    };
  },

  onEvent(event: AgentEvent) {
    if (event.eventType === "story.assigned") {
      console.log(`[DevAgentAPI] Story assigned, ready to generate API`);
    }
  }
};

// =============================================================================
// CIRCLE 3: QA - Test Agent
// =============================================================================

/**
 * Test Agent - Runs automated tests
 *
 * FLOW:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                       TEST AGENT                                 │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  TRIGGERED BY: code.pushed, pr.created                          │
 * │                                                                 │
 * │  PROCESS:                                                       │
 * │    1. Identify changed files                                    │
 * │    2. Find related tests                                        │
 * │    3. Execute tests                                             │
 * │    4. Report results                                            │
 * │                                                                 │
 * │  EVENTS EMITTED:                                                │
 * │    - test.started                                               │
 * │    - test.passed (if all pass)                                  │
 * │    - test.failed (if any fail)                                  │
 * └─────────────────────────────────────────────────────────────────┘
 */
export const TestAgent: QUADAgent = {
  agentId: "test-agent",
  circle: Circle.QA,
  version: "1.0.0",
  description: "Runs automated tests on code changes",

  capabilities: ["run-unit-tests", "run-integration-tests", "generate-report"],
  requiredInputs: ["changed_files"],
  outputs: ["test_results", "coverage", "failed_tests"],

  canRead: [
    createReadPermission("src/**"),
    createReadPermission("tests/**")
  ],
  canWrite: [
    createWritePermission("coverage/**"),
    createWritePermission("test-results/**")
  ],
  canInvoke: ["review-agent"],
  cannotInvoke: ["deploy-agent-prod"],
  maxModifications: 5,
  requiresApproval: false,

  subscribedEvents: ["code.pushed", "pr.created"],

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const { changed_files } = input.data as { changed_files: string[] };

    console.log(`[TestAgent] Running tests for ${changed_files?.length || 0} files`);
    await simulateDelay(800);

    const testResults = {
      total: 42,
      passed: 40,
      failed: 2,
      skipped: 0
    };

    const success = testResults.failed === 0;
    console.log(`[TestAgent] Tests complete: ${testResults.passed}/${testResults.total} passed`);

    return {
      requestId: input.requestId,
      agentId: "test-agent",
      success,
      data: {
        test_results: testResults,
        coverage: 85.5,
        failed_tests: success ? [] : ["test1.spec.ts", "test2.spec.ts"]
      },
      modifiedResources: ["coverage/report.json", "test-results/latest.json"],
      readResources: changed_files || [],
      duration: Date.now() - startTime
    };
  },

  onEvent(event: AgentEvent) {
    console.log(`[TestAgent] Received event: ${event.eventType}`);
  }
};

// =============================================================================
// CIRCLE 4: INFRASTRUCTURE - Deploy Agent
// =============================================================================

/**
 * Deploy Agent - Handles deployments
 *
 * FLOW:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      DEPLOY AGENT (DEV)                          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  TRIGGERED BY: test.passed, pr.merged (to develop)              │
 * │                                                                 │
 * │  PROCESS:                                                       │
 * │    1. Build application                                         │
 * │    2. Run health checks                                         │
 * │    3. Deploy to DEV environment                                 │
 * │    4. Verify deployment                                         │
 * │                                                                 │
 * │  EVENTS EMITTED:                                                │
 * │    - deploy.started                                             │
 * │    - deploy.completed                                           │
 * │                                                                 │
 * │  PERMISSIONS:                                                   │
 * │    ✅ requiresApproval: false (DEV only)                        │
 * │    ❌ Cannot invoke other agents (terminal agent)               │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      DEPLOY AGENT (PROD)                         │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  PERMISSIONS:                                                   │
 * │    ⚠️ requiresApproval: true (HUMAN MUST APPROVE)               │
 * │    ❌ No agent can invoke this directly                         │
 * └─────────────────────────────────────────────────────────────────┘
 */
export const DeployAgentDev: QUADAgent = {
  agentId: "deploy-agent-dev",
  circle: Circle.INFRASTRUCTURE,
  version: "1.0.0",
  description: "Deploys to DEV environment",

  capabilities: ["build", "deploy-dev", "health-check"],
  requiredInputs: ["version"],
  outputs: ["deployment_url", "build_id", "health_status"],

  canRead: [
    createReadPermission("src/**"),
    createReadPermission("config/**")
  ],
  canWrite: [
    createWritePermission("deployments/dev/**")
  ],
  canInvoke: [],  // Terminal agent - cannot invoke others
  cannotInvoke: ["deploy-agent-prod"],
  maxModifications: 3,
  requiresApproval: false,  // DEV doesn't need approval

  subscribedEvents: ["test.passed", "pr.merged"],

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const { version } = input.data as { version: string };

    console.log(`[DeployAgentDev] Deploying version ${version} to DEV`);
    await simulateDelay(1000);

    const buildId = `build-${Date.now()}`;
    const deploymentUrl = `https://dev.example.com`;

    console.log(`[DeployAgentDev] Deployed to ${deploymentUrl}`);

    return {
      requestId: input.requestId,
      agentId: "deploy-agent-dev",
      success: true,
      data: {
        deployment_url: deploymentUrl,
        build_id: buildId,
        health_status: "healthy"
      },
      modifiedResources: [`deployments/dev/${buildId}`],
      readResources: ["src/**", "config/dev.json"],
      duration: Date.now() - startTime
    };
  },

  onEvent(event: AgentEvent) {
    if (event.eventType === "test.passed") {
      console.log(`[DeployAgentDev] Tests passed, ready to deploy`);
    }
  }
};

export const DeployAgentProd: QUADAgent = {
  agentId: "deploy-agent-prod",
  circle: Circle.INFRASTRUCTURE,
  version: "1.0.0",
  description: "Deploys to PRODUCTION environment (REQUIRES APPROVAL)",

  capabilities: ["build", "deploy-prod", "rollback"],
  requiredInputs: ["version", "approval_ticket"],
  outputs: ["deployment_url", "build_id", "rollback_id"],

  canRead: [
    createReadPermission("src/**"),
    createReadPermission("config/**")
  ],
  canWrite: [
    createWritePermission("deployments/prod/**")
  ],
  canInvoke: [],
  cannotInvoke: [],
  maxModifications: 3,
  requiresApproval: true,  // PRODUCTION REQUIRES HUMAN APPROVAL

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const { version, approval_ticket } = input.data as {
      version: string;
      approval_ticket: string;
    };

    if (!approval_ticket) {
      return {
        requestId: input.requestId,
        agentId: "deploy-agent-prod",
        success: false,
        data: {},
        error: "Production deployment requires an approval ticket",
        modifiedResources: [],
        readResources: [],
        duration: Date.now() - startTime
      };
    }

    console.log(`[DeployAgentProd] Deploying version ${version} to PROD`);
    console.log(`[DeployAgentProd] Approval ticket: ${approval_ticket}`);
    await simulateDelay(1500);

    return {
      requestId: input.requestId,
      agentId: "deploy-agent-prod",
      success: true,
      data: {
        deployment_url: "https://prod.example.com",
        build_id: `prod-build-${Date.now()}`,
        rollback_id: `rollback-${Date.now()}`
      },
      modifiedResources: [`deployments/prod/v${version}`],
      readResources: ["src/**", "config/prod.json"],
      duration: Date.now() - startTime
    };
  }
};

// =============================================================================
// HELPER AGENTS FOR ESTIMATION PIPELINE
// =============================================================================

/**
 * Code Agent - Analyzes code complexity
 * Part of the Estimation Pipeline
 */
export const CodeAgent: QUADAgent = {
  agentId: "code-agent",
  circle: Circle.DEVELOPMENT,
  version: "1.0.0",
  description: "Analyzes code complexity for estimation",

  capabilities: ["analyze-complexity"],
  requiredInputs: ["story_id"],
  outputs: ["code_complexity"],

  canRead: [createReadPermission("src/**")],
  canWrite: [],
  canInvoke: [],
  cannotInvoke: [],
  maxModifications: 0,
  requiresApproval: false,

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    console.log(`[CodeAgent] Analyzing code complexity...`);
    await simulateDelay(200);

    return {
      requestId: input.requestId,
      agentId: "code-agent",
      success: true,
      data: { code_complexity: 3 },
      modifiedResources: [],
      readResources: ["src/**"],
      duration: Date.now() - startTime
    };
  }
};

/**
 * DB Agent - Analyzes database impact
 */
export const DBAgent: QUADAgent = {
  agentId: "db-agent",
  circle: Circle.DEVELOPMENT,
  version: "1.0.0",
  description: "Analyzes database impact for estimation",

  capabilities: ["analyze-db-impact"],
  requiredInputs: ["story_id"],
  outputs: ["db_impact"],

  canRead: [createReadPermission("database/**")],
  canWrite: [],
  canInvoke: [],
  cannotInvoke: [],
  maxModifications: 0,
  requiresApproval: false,

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    console.log(`[DBAgent] Analyzing database impact...`);
    await simulateDelay(200);

    return {
      requestId: input.requestId,
      agentId: "db-agent",
      success: true,
      data: { db_impact: 2 },
      modifiedResources: [],
      readResources: ["database/schema/**"],
      duration: Date.now() - startTime
    };
  }
};

/**
 * Flow Agent - Analyzes user flow complexity
 */
export const FlowAgent: QUADAgent = {
  agentId: "flow-agent",
  circle: Circle.MANAGEMENT,
  version: "1.0.0",
  description: "Analyzes user flow complexity for estimation",

  capabilities: ["analyze-flow"],
  requiredInputs: ["story_id"],
  outputs: ["flow_complexity"],

  canRead: [createReadPermission("stories/**"), createReadPermission("flows/**")],
  canWrite: [],
  canInvoke: [],
  cannotInvoke: [],
  maxModifications: 0,
  requiresApproval: false,

  async invoke(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    console.log(`[FlowAgent] Analyzing flow complexity...`);
    await simulateDelay(200);

    return {
      requestId: input.requestId,
      agentId: "flow-agent",
      success: true,
      data: { flow_complexity: 4 },
      modifiedResources: [],
      readResources: ["flows/**"],
      duration: Date.now() - startTime
    };
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapToPlatonicSolid(score: number): { name: string; value: number } {
  if (score <= 5) return { name: "Tetrahedron", value: 4 };
  if (score <= 7) return { name: "Cube", value: 6 };
  if (score <= 10) return { name: "Octahedron", value: 8 };
  if (score <= 14) return { name: "Dodecahedron", value: 12 };
  return { name: "Icosahedron", value: 20 };
}

function calculateConfidence(code: number, db: number, flow: number): string {
  const variance = Math.abs(code - db) + Math.abs(db - flow) + Math.abs(code - flow);
  if (variance <= 2) return "HIGH";
  if (variance <= 4) return "MEDIUM";
  return "LOW";
}

// =============================================================================
// EXPORT ALL AGENTS
// =============================================================================

export const ExampleAgents = {
  // Circle 1: Management
  StoryAgent,
  EstimationAgent,

  // Circle 2: Development
  DevAgentUI,
  DevAgentAPI,
  CodeAgent,
  DBAgent,
  FlowAgent,

  // Circle 3: QA
  TestAgent,

  // Circle 4: Infrastructure
  DeployAgentDev,
  DeployAgentProd
};
