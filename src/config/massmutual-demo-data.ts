/**
 * MassMutual Demo Data - Pre-populated for Pitch
 *
 * Structure:
 * - MassMutual (Parent Org)
 *   ├── Digital Experience (Sub-Org) → Customer Portal (Project)
 *   └── Data Engineering (Sub-Org) → Claims Pipeline (Project)
 *
 * Demo Flow: Click to add, but fields auto-fill with realistic data
 */

// =============================================================================
// ORGANIZATION HIERARCHY
// =============================================================================

export const DEMO_ORG = {
  id: "mm-root",
  name: "MassMutual",
  code: "MM",
  type: "enterprise",
  industry: "Financial Services / Insurance",
  headquarters: "Springfield, MA",
  employeeCount: "10,000+",
  logo: "/partners/massmutual-logo.svg",
  createdAt: "2026-01-07",
};

export const DEMO_SUB_ORGS = [
  {
    id: "mm-digital",
    parentId: "mm-root",
    name: "Digital Experience",
    code: "DX",
    description: "Customer-facing digital products and mobile apps",
    headCount: 45,
    techLead: "Mike Rodriguez",
    color: "blue",
    icon: "🌐",
  },
  {
    id: "mm-data",
    parentId: "mm-root",
    name: "Data Engineering",
    code: "DE",
    description: "Data pipelines, ETL, analytics, and ML infrastructure",
    headCount: 28,
    techLead: "Priya Sharma",
    color: "purple",
    icon: "📊",
  },
];

// =============================================================================
// PROJECTS (DOMAINS)
// =============================================================================

export const DEMO_PROJECTS = [
  {
    id: "proj-customer-portal",
    subOrgId: "mm-digital",
    name: "Customer Portal",
    code: "CP",
    description: "Self-service web portal for policy holders to view policies, make payments, and file claims",
    projectType: "web_application",
    status: "active",
    startDate: "2025-09-01",
    targetDate: "2026-06-30",
    color: "blue",
    icon: "🏠",

    // Tech Stack (auto-fills when you select project type)
    techStack: {
      frontend: {
        framework: "Next.js 15",
        language: "TypeScript",
        styling: "Tailwind CSS",
        stateManagement: "Zustand",
      },
      backend: {
        framework: "Spring Boot 3.2",
        language: "Java 21",
        api: "REST + GraphQL",
      },
      database: {
        primary: "PostgreSQL 16",
        cache: "Redis",
        search: "Elasticsearch",
      },
      infrastructure: {
        cloud: "AWS",
        compute: "ECS Fargate",
        cdn: "CloudFront",
        ciCd: "GitHub Actions → ArgoCD",
      },
    },

    // 4 Circles (auto-created based on project type)
    circles: [
      {
        id: "cp-mgmt",
        name: "Management Circle",
        icon: "👔",
        color: "slate",
        memberCount: 3,
        responsibilities: ["Sprint planning", "Stakeholder alignment", "Risk management"],
      },
      {
        id: "cp-dev",
        name: "Development Circle",
        icon: "💻",
        color: "blue",
        memberCount: 8,
        responsibilities: ["Feature development", "Code reviews", "Technical debt"],
      },
      {
        id: "cp-qa",
        name: "QA Circle",
        icon: "🧪",
        color: "green",
        memberCount: 3,
        responsibilities: ["Test automation", "Regression testing", "Performance testing"],
      },
      {
        id: "cp-infra",
        name: "Infrastructure Circle",
        icon: "🔧",
        color: "orange",
        memberCount: 2,
        responsibilities: ["CI/CD pipelines", "Monitoring", "Security"],
      },
    ],

    // Metrics (live-ish)
    metrics: {
      totalStoryPoints: 520,
      completedStoryPoints: 385,
      sprintVelocity: 48,
      currentSprint: "Sprint 12",
      daysRemaining: 6,
      activeFlows: 14,
      blockedFlows: 2,
      healthScore: 87,
    },
  },

  {
    id: "proj-claims-pipeline",
    subOrgId: "mm-data",
    name: "Claims Pipeline",
    code: "CLM",
    description: "Automated claims processing with ML-powered fraud detection and adjudication",
    projectType: "batch_processing",
    status: "active",
    startDate: "2025-11-01",
    targetDate: "2026-04-30",
    color: "purple",
    icon: "⚙️",

    // Tech Stack
    techStack: {
      runtime: {
        framework: "Spring Batch 5",
        language: "Java 21",
        scheduler: "AWS Step Functions",
      },
      data: {
        lake: "S3 + Apache Iceberg",
        warehouse: "Redshift",
        streaming: "Kinesis",
      },
      ml: {
        platform: "SageMaker",
        models: ["Fraud Detection", "Auto-Adjudication"],
        mlOps: "MLflow",
      },
      infrastructure: {
        cloud: "AWS",
        compute: "Lambda + Glue",
        monitoring: "CloudWatch + Datadog",
        ciCd: "GitHub Actions → AWS CodePipeline",
      },
    },

    // 4 Circles
    circles: [
      {
        id: "clm-mgmt",
        name: "Management Circle",
        icon: "👔",
        color: "slate",
        memberCount: 2,
        responsibilities: ["Pipeline prioritization", "SLA monitoring", "Vendor management"],
      },
      {
        id: "clm-dev",
        name: "Development Circle",
        icon: "💻",
        color: "purple",
        memberCount: 5,
        responsibilities: ["ETL development", "ML integration", "Data quality"],
      },
      {
        id: "clm-qa",
        name: "QA Circle",
        icon: "🧪",
        color: "green",
        memberCount: 2,
        responsibilities: ["Data validation", "Pipeline testing", "Reconciliation"],
      },
      {
        id: "clm-infra",
        name: "Infrastructure Circle",
        icon: "🔧",
        color: "orange",
        memberCount: 2,
        responsibilities: ["Pipeline orchestration", "Cost optimization", "Disaster recovery"],
      },
    ],

    // Metrics
    metrics: {
      totalStoryPoints: 280,
      completedStoryPoints: 195,
      sprintVelocity: 32,
      currentSprint: "Sprint 8",
      daysRemaining: 4,
      activeFlows: 8,
      blockedFlows: 1,
      healthScore: 92,
    },
  },
];

// =============================================================================
// USERS WITH MULTI-PROJECT ALLOCATION
// =============================================================================

export const DEMO_USERS = [
  {
    id: "user-sarah",
    name: "Sarah Chen",
    email: "sarah.chen@massmutual.com",
    title: "Senior Director, Digital Transformation",
    avatar: "SC",
    avatarColor: "from-rose-500 to-pink-500",
    role: "SENIOR_DIRECTOR",
    yearsAtCompany: 8,

    // Multi-project allocation (percentage + role in each)
    allocations: [
      {
        projectId: "proj-customer-portal",
        percentage: 40,
        role: "Executive Sponsor",
        circle: "Management Circle",
      },
      {
        projectId: "proj-claims-pipeline",
        percentage: 40,
        role: "Executive Sponsor",
        circle: "Management Circle",
      },
    ],
    // 20% reserved for cross-team initiatives

    quadLevel: {
      query: 5,
      understand: 5,
      act: 3,
      deploy: 3,
    },
    badges: ["Strategic Thinker", "Mentor", "Cross-Functional Leader"],
  },

  {
    id: "user-mike",
    name: "Mike Rodriguez",
    email: "mike.rodriguez@massmutual.com",
    title: "Team Lead, Customer Portal",
    avatar: "MR",
    avatarColor: "from-blue-500 to-cyan-500",
    role: "TEAM_LEAD",
    yearsAtCompany: 5,

    allocations: [
      {
        projectId: "proj-customer-portal",
        percentage: 80,
        role: "Team Lead",
        circle: "Development Circle",
      },
      {
        projectId: "proj-claims-pipeline",
        percentage: 20,
        role: "Technical Advisor",
        circle: "Development Circle",
      },
    ],

    quadLevel: {
      query: 4,
      understand: 5,
      act: 5,
      deploy: 4,
    },
    badges: ["Code Craftsman", "Team Builder", "React Expert"],
  },

  {
    id: "user-priya",
    name: "Priya Sharma",
    email: "priya.sharma@massmutual.com",
    title: "Principal Engineer, Data",
    avatar: "PS",
    avatarColor: "from-purple-500 to-violet-500",
    role: "PRINCIPAL_ENGINEER",
    yearsAtCompany: 6,

    allocations: [
      {
        projectId: "proj-claims-pipeline",
        percentage: 70,
        role: "Tech Lead",
        circle: "Development Circle",
      },
      {
        projectId: "proj-customer-portal",
        percentage: 30,
        role: "Backend Architect",
        circle: "Development Circle",
      },
    ],

    quadLevel: {
      query: 4,
      understand: 5,
      act: 5,
      deploy: 5,
    },
    badges: ["Data Wizard", "System Architect", "AWS Certified"],
  },

  {
    id: "user-james",
    name: "James Wilson",
    email: "james.wilson@massmutual.com",
    title: "Senior Developer",
    avatar: "JW",
    avatarColor: "from-green-500 to-emerald-500",
    role: "SENIOR_DEVELOPER",
    yearsAtCompany: 3,

    allocations: [
      {
        projectId: "proj-customer-portal",
        percentage: 100,
        role: "Full Stack Developer",
        circle: "Development Circle",
      },
    ],

    quadLevel: {
      query: 3,
      understand: 4,
      act: 5,
      deploy: 4,
    },
    badges: ["TypeScript Pro", "Fast Learner"],
  },

  {
    id: "user-emma",
    name: "Emma Thompson",
    email: "emma.thompson@massmutual.com",
    title: "QA Lead",
    avatar: "ET",
    avatarColor: "from-amber-500 to-yellow-500",
    role: "QA_LEAD",
    yearsAtCompany: 4,

    allocations: [
      {
        projectId: "proj-customer-portal",
        percentage: 60,
        role: "QA Lead",
        circle: "QA Circle",
      },
      {
        projectId: "proj-claims-pipeline",
        percentage: 40,
        role: "QA Engineer",
        circle: "QA Circle",
      },
    ],

    quadLevel: {
      query: 4,
      understand: 5,
      act: 4,
      deploy: 3,
    },
    badges: ["Quality Champion", "Automation Expert"],
  },

  {
    id: "user-david",
    name: "David Kim",
    email: "david.kim@massmutual.com",
    title: "Platform Engineer",
    avatar: "DK",
    avatarColor: "from-orange-500 to-red-500",
    role: "PLATFORM_ENGINEER",
    yearsAtCompany: 2,

    allocations: [
      {
        projectId: "proj-customer-portal",
        percentage: 50,
        role: "DevOps Lead",
        circle: "Infrastructure Circle",
      },
      {
        projectId: "proj-claims-pipeline",
        percentage: 50,
        role: "Platform Engineer",
        circle: "Infrastructure Circle",
      },
    ],

    quadLevel: {
      query: 3,
      understand: 4,
      act: 4,
      deploy: 5,
    },
    badges: ["Kubernetes Expert", "Security Champion", "Cost Optimizer"],
  },
];

// =============================================================================
// ACTIVE FLOWS (WORK ITEMS)
// =============================================================================

export const DEMO_FLOWS = [
  // Customer Portal - Various stages
  {
    id: "flow-cp-1",
    projectId: "proj-customer-portal",
    title: "Implement MFA with Authenticator Apps",
    description: "Add support for TOTP-based MFA using Google Authenticator, Authy",
    stage: "Act",
    storyPoints: 8,
    assigneeId: "user-priya",
    jiraKey: "CP-234",
    priority: "high",
    daysInStage: 2,
    tags: ["security", "authentication"],
  },
  {
    id: "flow-cp-2",
    projectId: "proj-customer-portal",
    title: "Policy Document Upload & Storage",
    description: "Allow customers to upload policy documents with virus scanning",
    stage: "Understand",
    storyPoints: 13,
    assigneeId: "user-james",
    jiraKey: "CP-235",
    priority: "medium",
    daysInStage: 1,
    tags: ["feature", "storage", "security"],
  },
  {
    id: "flow-cp-3",
    projectId: "proj-customer-portal",
    title: "Payment History Dashboard Widget",
    description: "New widget showing last 12 months of payment history with charts",
    stage: "Query",
    storyPoints: 5,
    assigneeId: "user-mike",
    jiraKey: "CP-236",
    priority: "low",
    daysInStage: 0,
    tags: ["dashboard", "payments"],
  },
  {
    id: "flow-cp-4",
    projectId: "proj-customer-portal",
    title: "Beneficiary Management Module",
    description: "Full CRUD for beneficiaries with validation and audit trail",
    stage: "Deploy",
    storyPoints: 13,
    assigneeId: "user-david",
    jiraKey: "CP-230",
    priority: "high",
    daysInStage: 1,
    tags: ["feature", "compliance"],
  },
  {
    id: "flow-cp-5",
    projectId: "proj-customer-portal",
    title: "Mobile-Responsive Claims Form",
    description: "Redesign claims form for mobile-first experience",
    stage: "Act",
    storyPoints: 8,
    assigneeId: "user-james",
    jiraKey: "CP-240",
    priority: "medium",
    daysInStage: 3,
    tags: ["mobile", "ux"],
  },

  // Claims Pipeline - Various stages
  {
    id: "flow-dp-1",
    projectId: "proj-claims-pipeline",
    title: "Fraud Detection ML Model v2",
    description: "Upgrade fraud detection model with new features and 15% accuracy improvement",
    stage: "Act",
    storyPoints: 21,
    assigneeId: "user-priya",
    jiraKey: "CLM-089",
    priority: "high",
    daysInStage: 4,
    tags: ["ml", "fraud", "critical"],
  },
  {
    id: "flow-dp-2",
    projectId: "proj-claims-pipeline",
    title: "Claims Data Validation Framework",
    description: "Build reusable validation framework for all incoming claim data",
    stage: "Understand",
    storyPoints: 13,
    assigneeId: "user-emma",
    jiraKey: "CLM-090",
    priority: "medium",
    daysInStage: 2,
    tags: ["data-quality", "framework"],
  },
  {
    id: "flow-dp-3",
    projectId: "proj-claims-pipeline",
    title: "Auto-Adjudication for Simple Claims",
    description: "Implement straight-through processing for claims under $500",
    stage: "Query",
    storyPoints: 8,
    assigneeId: "user-priya",
    jiraKey: "CLM-095",
    priority: "high",
    daysInStage: 1,
    tags: ["automation", "efficiency"],
  },
  {
    id: "flow-dp-4",
    projectId: "proj-claims-pipeline",
    title: "Redshift Query Optimization",
    description: "Optimize top 10 slow queries reducing avg response from 12s to 2s",
    stage: "Deploy",
    storyPoints: 5,
    assigneeId: "user-david",
    jiraKey: "CLM-088",
    priority: "medium",
    daysInStage: 1,
    tags: ["performance", "database"],
  },
];

// =============================================================================
// ROLE-BASED DASHBOARD CONFIGURATIONS
// =============================================================================

export const DEMO_DASHBOARD_VIEWS = {
  SENIOR_DIRECTOR: {
    key: "executive",
    name: "Executive Dashboard",
    icon: "📊",
    description: "Portfolio-level insights across all projects and teams",
    layout: "grid-cols-3",
    widgets: [
      {
        id: "portfolio-health",
        name: "Portfolio Health",
        size: "col-span-2",
        metrics: ["On Track: 2/2", "Health Score: 89%", "Risk Items: 3"],
      },
      {
        id: "resource-utilization",
        name: "Resource Utilization",
        size: "col-span-1",
        metrics: ["Allocated: 95%", "Overloaded: 1", "Available: 2"],
      },
      {
        id: "velocity-trend",
        name: "Velocity Trend (12 weeks)",
        size: "col-span-2",
        chart: "line",
      },
      {
        id: "budget-burn",
        name: "Budget Utilization",
        size: "col-span-1",
        metrics: ["YTD: $1.2M / $1.8M", "Burn Rate: 67%", "Forecast: On Track"],
      },
    ],
  },

  TEAM_LEAD: {
    key: "team-lead",
    name: "Team Lead Dashboard",
    icon: "👥",
    description: "Sprint management and team performance",
    layout: "grid-cols-2",
    widgets: [
      {
        id: "sprint-board",
        name: "Current Sprint",
        size: "col-span-2",
        showKanban: true,
      },
      {
        id: "team-velocity",
        name: "Team Velocity",
        size: "col-span-1",
        chart: "bar",
      },
      {
        id: "blockers",
        name: "Blockers & Dependencies",
        size: "col-span-1",
        showAlerts: true,
      },
    ],
  },

  DEVELOPER: {
    key: "developer",
    name: "Developer Dashboard",
    icon: "💻",
    description: "Your tasks, PRs, and code metrics",
    layout: "grid-cols-2",
    widgets: [
      {
        id: "my-flows",
        name: "My Active Flows",
        size: "col-span-1",
        showPersonalTasks: true,
      },
      {
        id: "pr-queue",
        name: "Pull Request Queue",
        size: "col-span-1",
        showPRs: true,
      },
      {
        id: "quad-progress",
        name: "My QUAD Progress",
        size: "col-span-2",
        showRadar: true,
      },
    ],
  },
};

// =============================================================================
// QUAD STAGE DEFINITIONS
// =============================================================================

export const QUAD_STAGES = {
  Query: {
    color: "blue",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    textColor: "text-blue-400",
    icon: "Q",
    description: "Requirements gathering & analysis",
    activities: ["Stakeholder interviews", "Requirements documentation", "Acceptance criteria"],
  },
  Understand: {
    color: "purple",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/50",
    textColor: "text-purple-400",
    icon: "U",
    description: "Design & documentation",
    activities: ["Technical design", "API contracts", "Architecture review"],
  },
  Act: {
    color: "green",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
    textColor: "text-green-400",
    icon: "A",
    description: "Development & coding",
    activities: ["Implementation", "Unit tests", "Code review"],
  },
  Deploy: {
    color: "orange",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/50",
    textColor: "text-orange-400",
    icon: "D",
    description: "Testing & release",
    activities: ["Integration testing", "UAT", "Production deployment"],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getUserById(userId: string) {
  return DEMO_USERS.find((u) => u.id === userId);
}

export function getProjectById(projectId: string) {
  return DEMO_PROJECTS.find((p) => p.id === projectId);
}

export function getSubOrgById(subOrgId: string) {
  return DEMO_SUB_ORGS.find((s) => s.id === subOrgId);
}

export function getUserProjects(userId: string) {
  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) return [];

  return user.allocations.map((alloc) => {
    const project = DEMO_PROJECTS.find((p) => p.id === alloc.projectId);
    return {
      ...project,
      userRole: alloc.role,
      userCircle: alloc.circle,
      allocation: alloc.percentage,
    };
  });
}

export function getProjectFlows(projectId: string) {
  return DEMO_FLOWS.filter((f) => f.projectId === projectId);
}

export function getUserFlows(userId: string) {
  return DEMO_FLOWS.filter((f) => f.assigneeId === userId);
}

export function getFlowsByStage(projectId: string, stage: string) {
  return DEMO_FLOWS.filter((f) => f.projectId === projectId && f.stage === stage);
}

export function getDashboardView(role: string) {
  return DEMO_DASHBOARD_VIEWS[role as keyof typeof DEMO_DASHBOARD_VIEWS] || DEMO_DASHBOARD_VIEWS.DEVELOPER;
}

export function getProjectMembers(projectId: string) {
  return DEMO_USERS.filter((u) =>
    u.allocations.some((a) => a.projectId === projectId)
  );
}

// Summary stats
export const DEMO_METRICS_SUMMARY = {
  organization: DEMO_ORG.name,
  subOrgs: DEMO_SUB_ORGS.length,
  totalProjects: DEMO_PROJECTS.length,
  totalUsers: DEMO_USERS.length,
  activeFlows: DEMO_FLOWS.length,
  totalStoryPoints: DEMO_PROJECTS.reduce((sum, p) => sum + p.metrics.totalStoryPoints, 0),
  completedStoryPoints: DEMO_PROJECTS.reduce((sum, p) => sum + p.metrics.completedStoryPoints, 0),
  avgHealthScore: Math.round(
    DEMO_PROJECTS.reduce((sum, p) => sum + p.metrics.healthScore, 0) / DEMO_PROJECTS.length
  ),
};
