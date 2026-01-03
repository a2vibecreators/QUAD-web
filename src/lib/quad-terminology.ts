/**
 * QUAD Framework Terminology Mapping
 *
 * Maps technical database/API names to user-friendly QUAD terminology.
 * Use this file to display friendly names in the UI while keeping
 * technical names in the database and API.
 *
 * Strategy: Database tables use technical names, UI displays friendly names.
 */

// =============================================================================
// FLOW ACCELERATORS (formerly "Crowd-Pulling Features")
// =============================================================================

export const FLOW_ACCELERATORS = {
  // Q Stage (Question)
  sprint_risk_predictions: {
    displayName: 'Trajectory Predictor',
    description: 'Predicts Cycle trajectory - will you reach your destination or drift off course?',
    stage: 'Q',
    icon: '🎯',
  },
  story_point_suggestions: {
    displayName: 'Magnitude Estimator',
    description: 'AI estimates complexity points based on Flow description and historical patterns',
    stage: 'Q',
    icon: '📐',
  },

  // U Stage (Understand)
  technical_debt_scores: {
    displayName: 'Code Topology',
    description: 'Maps the shape and health of your codebase',
    stage: 'U',
    icon: '🗺️',
  },
  dora_metrics: {
    displayName: 'Velocity Vectors',
    description: 'Measures direction and speed of delivery',
    stage: 'U',
    icon: '📊',
  },
  ai_code_reviews: {
    displayName: 'Code Sentinel',
    description: 'AI sentinel reviews every PR, catching issues before they enter the codebase',
    stage: 'U',
    icon: '🛡️',
  },

  // A Stage (Allocate)
  secret_scans: {
    displayName: 'Vault Guardian',
    description: 'Guards secrets and credentials, auto-rotates compromised credentials',
    stage: 'A',
    icon: '🔐',
  },
  incident_runbooks: {
    displayName: 'Response Protocols',
    description: 'Automated incident response with pre-defined steps',
    stage: 'A',
    icon: '📋',
  },
  developer_onboarding: {
    displayName: 'Circle Catalyst',
    description: 'Streamlined onboarding with checklists and automations',
    stage: 'A',
    icon: '🚀',
  },

  // D Stage (Deliver)
  release_notes: {
    displayName: 'Release Codex',
    description: 'Chronicles every release with context, linking Q→U→A→D journey',
    stage: 'D',
    icon: '📜',
  },
  rollback_operations: {
    displayName: 'Temporal Rewind',
    description: 'One-click time travel to previous deployment state',
    stage: 'D',
    icon: '⏪',
  },
  cost_estimates: {
    displayName: 'Resource Calculus',
    description: 'Track and forecast infrastructure costs',
    stage: 'D',
    icon: '💰',
  },

  // All Stages
  slack_bot: {
    displayName: 'QUAD Nexus',
    description: 'Interact with QUAD from Slack',
    stage: 'All',
    icon: '💬',
  },
} as const;

// =============================================================================
// COMPANY TIERS (Mathematical Dimensions)
// =============================================================================

export const COMPANY_TIERS = {
  SCALAR: {
    displayName: 'Scalar',
    mathConcept: 'Single Value (1D)',
    description: 'A single number with magnitude only. Focused, essential, perfect for startups finding their direction.',
    target: 'Startups',
    maxMembers: 10,
    monthlyPrice: 99,
    color: '#4CAF50', // Green
  },
  VECTOR: {
    displayName: 'Vector',
    mathConcept: 'Direction + Magnitude (2D)',
    description: 'Has both direction AND magnitude. You know where you\'re going and how fast. Growing teams with momentum.',
    target: 'Small Business',
    maxMembers: 50,
    monthlyPrice: 249,
    color: '#2196F3', // Blue
  },
  MATRIX: {
    displayName: 'Matrix',
    mathConcept: 'Multi-dimensional (nD)',
    description: 'Multi-dimensional operations. Complex transformations at scale. Enterprise-grade capabilities.',
    target: 'Enterprise',
    maxMembers: null, // Unlimited
    monthlyPrice: 399,
    color: '#9C27B0', // Purple
  },
} as const;

// =============================================================================
// CORE TERMINOLOGY
// =============================================================================

export const QUAD_TERMS = {
  // Work Items
  sprint: { displayName: 'Cycle', plural: 'Cycles' },
  story: { displayName: 'Flow', plural: 'Flows' },
  ticket: { displayName: 'Flow', plural: 'Flows' },
  task: { displayName: 'Flow', plural: 'Flows' },
  epic: { displayName: 'Stream', plural: 'Streams' },

  // Organization
  team: { displayName: 'Circle', plural: 'Circles' },
  project: { displayName: 'Domain', plural: 'Domains' },
  board: { displayName: 'Canvas', plural: 'Canvases' },

  // Metrics
  story_points: { displayName: 'Complexity Points', plural: 'Complexity Points' },
  velocity: { displayName: 'Velocity Vector', plural: 'Velocity Vectors' },
  burndown: { displayName: 'Trajectory Chart', plural: 'Trajectory Charts' },

  // Gamification
  leaderboard: { displayName: 'Mastery Board', plural: 'Mastery Boards' },
  points: { displayName: 'Mastery Points', plural: 'Mastery Points' },
  ranking: { displayName: 'Mastery Ranking', plural: 'Mastery Rankings' },

  // Stages
  backlog: { displayName: 'Question Stage', plural: 'Question Stages' },
  analysis: { displayName: 'Understand Stage', plural: 'Understand Stages' },
  in_progress: { displayName: 'Allocate Stage', plural: 'Allocate Stages' },
  done: { displayName: 'Deliver Stage', plural: 'Deliver Stages' },
} as const;

// =============================================================================
// QUAD STAGES
// =============================================================================

export const QUAD_STAGES = {
  Q: {
    name: 'Question',
    shortName: 'Q',
    description: 'Define what needs to be done',
    color: '#FF9800', // Orange
    icon: '❓',
  },
  U: {
    name: 'Understand',
    shortName: 'U',
    description: 'Analyze and plan',
    color: '#2196F3', // Blue
    icon: '🔍',
  },
  A: {
    name: 'Allocate',
    shortName: 'A',
    description: 'Assign and schedule',
    color: '#4CAF50', // Green
    icon: '📋',
  },
  D: {
    name: 'Deliver',
    shortName: 'D',
    description: 'Execute and deploy',
    color: '#9C27B0', // Purple
    icon: '🚀',
  },
} as const;

// =============================================================================
// VELOCITY DIMENSION LEVELS
// =============================================================================

export const VELOCITY_DIMENSIONS = {
  '1D': { name: 'Low', color: '#f44336' },      // Red
  '2D': { name: 'Medium', color: '#FF9800' },   // Orange
  '3D': { name: 'High', color: '#2196F3' },     // Blue
  '4D': { name: 'Elite', color: '#4CAF50' },    // Green
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get friendly display name for a Flow Accelerator
 */
export function getAcceleratorName(technicalName: string): string {
  const accelerator = FLOW_ACCELERATORS[technicalName as keyof typeof FLOW_ACCELERATORS];
  return accelerator?.displayName ?? technicalName;
}

/**
 * Get tier display info
 */
export function getTierInfo(tierCode: string) {
  return COMPANY_TIERS[tierCode as keyof typeof COMPANY_TIERS] ?? null;
}

/**
 * Get QUAD term for legacy terminology
 */
export function getQuadTerm(legacyTerm: string, plural = false): string {
  const term = QUAD_TERMS[legacyTerm as keyof typeof QUAD_TERMS];
  if (!term) return legacyTerm;
  return plural ? term.plural : term.displayName;
}

/**
 * Get stage info by letter
 */
export function getStageInfo(stage: 'Q' | 'U' | 'A' | 'D') {
  return QUAD_STAGES[stage];
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type FlowAcceleratorKey = keyof typeof FLOW_ACCELERATORS;
export type CompanyTierKey = keyof typeof COMPANY_TIERS;
export type QuadStageKey = keyof typeof QUAD_STAGES;
export type VelocityDimensionKey = keyof typeof VELOCITY_DIMENSIONS;
