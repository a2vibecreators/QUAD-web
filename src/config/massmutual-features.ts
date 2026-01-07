/**
 * MassMutual Feature Toggle Configuration
 *
 * Structure mirrors FEATURES.md pitch flow:
 * Part → Category → Feature
 */

export interface Feature {
  key: string;
  name: string;
  description: string;
  isDemo: boolean;
}

export interface Category {
  key: string;
  name: string;
  description: string;
  features: Feature[];
}

export interface Part {
  key: string;
  name: string;
  tagline: string;
  categories: Category[];
}

export interface FeatureConfig {
  parts: Part[];
}

export const MASSMUTUAL_FEATURES: FeatureConfig = {
  parts: [
    {
      key: "pain",
      name: "PART 1: THE PAIN",
      tagline: "Open Strong",
      categories: [
        {
          key: "problemStatement",
          name: "Problem Statement",
          description: "Make them feel the pain. They should be nodding their heads.",
          features: [
            { key: "problemStatement", name: "Why does 1-paragraph feature take 6 weeks?", description: "Opening hook - the core problem", isDemo: true },
            { key: "agilePainPoints", name: "MassMutual-specific Agile Pain Points", description: "Customized for MM's workflow", isDemo: true },
            { key: "traditionalWorkflow", name: "Traditional Dev Workflow", description: "BA → Spec → Dev → QA → Deploy", isDemo: true },
            { key: "waterfallVsAgile", name: "Waterfall vs Agile False Choice", description: '"Agile" is still waterfall in disguise', isDemo: true },
            { key: "documentationProblem", name: "The Documentation Problem", description: "Knowledge silos, tribal knowledge", isDemo: true },
          ],
        },
      ],
    },
    {
      key: "solution",
      name: "PART 2: THE SOLUTION",
      tagline: "The Big Reveal",
      categories: [
        {
          key: "quadModel",
          name: "QUAD Model",
          description: "Show the elegant solution. Simple. Powerful.",
          features: [
            { key: "quadModel", name: "Q-U-A-D Flow Diagram", description: "Visual representation of Q→U→A→D", isDemo: true },
            { key: "quadQuery", name: "Q = Query (Requirement)", description: "Start with a question/requirement", isDemo: true },
            { key: "quadUnderstand", name: "U = Understand (Analysis)", description: "AI analyzes and plans", isDemo: true },
            { key: "quadAct", name: "A = Act (Development)", description: "AI agents develop code", isDemo: true },
            { key: "quadDeploy", name: "D = Deploy (Release)", description: "Auto-deploy with approval gates", isDemo: true },
            { key: "cycleTime", name: "Cycle Time Comparison", description: "6 weeks → 6 hours", isDemo: true },
            { key: "fourCircles", name: "4 Circles Structure", description: "Management, Dev, QA, Infra", isDemo: false },
            { key: "humanGates", name: "Human-in-the-Loop Gates", description: "Human approval at key points", isDemo: true },
          ],
        },
      ],
    },
    {
      key: "how",
      name: "PART 3: HOW IT WORKS",
      tagline: "The Magic",
      categories: [
        {
          key: "documentFirst",
          name: "Document-First AI",
          description: "Show the paradigm shift - documentation drives everything.",
          features: [
            { key: "documentFirst", name: "Documentation as Source of Truth", description: "Everything starts with docs", isDemo: true },
            { key: "aiReadsDoc", name: "AI Reads Documentation", description: "AI understands context from docs", isDemo: true },
            { key: "autoSpecs", name: "Auto-Generated Specs", description: "AI generates technical specs from requirements", isDemo: true },
            { key: "livingDocs", name: "Living Documentation", description: "Docs update as code changes", isDemo: false },
            { key: "knowledgeBase", name: "Knowledge Base Integration", description: "Integrates with existing wikis", isDemo: false },
            { key: "reducesTribalKnowledge", name: "Documentation Reduces Tribal Knowledge", description: "Less dependency on specific people", isDemo: true },
          ],
        },
        {
          key: "agentSystem",
          name: "AI Agent System",
          description: "Show the AI agents that do the work.",
          features: [
            { key: "agentFlow", name: "AI Agent Architecture", description: "How agents work together", isDemo: true },
            { key: "agentBA", name: "BA Agent", description: "Business Analyst AI agent", isDemo: true },
            { key: "agentDev", name: "Developer Agent", description: "Code generation agent", isDemo: true },
            { key: "agentQA", name: "QA Agent", description: "Testing and quality agent", isDemo: true },
            { key: "agentDevOps", name: "DevOps Agent", description: "Deployment agent", isDemo: true },
            { key: "agentCollaboration", name: "Agent Collaboration", description: "How agents hand off work", isDemo: false },
            { key: "agentCustomization", name: "Agent Customization", description: "Custom agents for MM workflows", isDemo: true },
            { key: "agentTraining", name: "Agent Training", description: "Train on MM's codebase", isDemo: false },
            { key: "agentMonitoring", name: "Agent Monitoring", description: "Track agent activity", isDemo: false },
            { key: "agentCost", name: "Agent Cost Optimization", description: "Smart routing to reduce costs", isDemo: false },
          ],
        },
      ],
    },
    {
      key: "proof",
      name: "PART 4: THE PROOF",
      tagline: "The Killer Demo",
      categories: [
        {
          key: "docAI",
          name: "Documentation AI & Test Intelligence",
          description: "This is where you WIN. Show the magic. QA will never say \"I don't know where to start\" again.",
          features: [
            { key: "docRenderer", name: "Documentation UI Renderer", description: "Beautiful UI rendering of GitHub .md files", isDemo: true },
            { key: "docRAG", name: "RAG-Powered Q&A", description: "Ask any question, get answers from docs", isDemo: true },
            { key: "docAST", name: "AST Code Understanding", description: "AI understands code structure, not just text", isDemo: true },
            { key: "docJargons", name: "Key Jargon Extraction", description: 'Auto-extract key terms that "pitch their nerve"', isDemo: false },
            { key: "testJourneys", name: "Test Journey Documentation", description: "Step-by-step test flows (e.g., Login Journey)", isDemo: true },
            { key: "apiTableMapping", name: "API-to-Table Mapping", description: "Show which APIs hit which database tables", isDemo: true },
            { key: "sampleQueries", name: "Sample Query Generator", description: "Auto-generate SQL queries for test verification", isDemo: true },
            { key: "multiPathTests", name: "Multi-Path Test Flows", description: "Document 3 ways to login, all test paths", isDemo: true },
            { key: "agentRulesContext", name: "Agent Rules Context", description: "Base agent rules that partners can extend", isDemo: false },
            { key: "customExtensions", name: "Custom Extension Points", description: "MM can add custom rules/docs on top of QUAD", isDemo: false },
            { key: "testCoverageViz", name: "Test Coverage Visualization", description: "Visual map of what's tested vs untested", isDemo: false },
            { key: "qaOnboarding", name: "QA Onboarding Accelerator", description: "New QA → productive in hours, not weeks", isDemo: true },
          ],
        },
        {
          key: "testingEcosystem",
          name: "Complete Testing Ecosystem",
          description: "Not just web - Android, iOS, Batch, Scheduling, Performance, Infrastructure",
          features: [
            { key: "webTesting", name: "Web Testing", description: "Browser compatibility, E2E, accessibility", isDemo: true },
            { key: "mobileTesting", name: "Mobile Testing (Android/iOS)", description: "API calls, emulators, app store testing", isDemo: true },
            { key: "batchTesting", name: "Batch Jobs Testing", description: "Nightly processes, data migrations", isDemo: true },
            { key: "schedulingTesting", name: "Scheduling Testing", description: "Cron jobs, queue processors, event triggers", isDemo: true },
            { key: "performanceMonitoring", name: "Performance Monitoring", description: "P50/P95/P99 response times, bottleneck detection", isDemo: true },
            { key: "machineIdle", name: "Machine Idle Detection", description: "Identify underutilized infrastructure", isDemo: true },
            { key: "incidentResponse", name: "Incident Response", description: "Auto-generated runbooks for alerts", isDemo: true },
            { key: "infraHealth", name: "Infrastructure Health", description: "Infrastructure map with health status", isDemo: false },
            { key: "dbOperations", name: "Database Operations", description: "Common queries, safe vs dangerous", isDemo: false },
          ],
        },
        {
          key: "securityCompliance",
          name: "Security & Compliance Testing",
          description: "OWASP, GDPR, Insurance-specific regulations",
          features: [
            { key: "owaspCompliance", name: "OWASP Top 10 Compliance", description: "SQL injection, XSS, broken auth tracking", isDemo: true },
            { key: "penTesting", name: "Penetration Testing", description: "Documented pen test scenarios", isDemo: false },
            { key: "gdprCcpa", name: "GDPR/CCPA Compliance", description: "Right to access, delete, portability", isDemo: true },
            { key: "insuranceCompliance", name: "Insurance-Specific (NAIC, NY DFS)", description: "MDL-668, 23 NYCRR 500 compliance", isDemo: true },
            { key: "disasterRecovery", name: "Disaster Recovery Testing", description: "RTO/RPO metrics, failover testing", isDemo: true },
            { key: "backupVerification", name: "Backup Verification", description: "Daily backup test automation", isDemo: false },
          ],
        },
        {
          key: "vendorIntegrations",
          name: "Third-Party & Cost Analytics",
          description: "Vendor APIs, SLA tracking, cost visibility",
          features: [
            { key: "vendorApis", name: "External Vendor API Testing", description: "Stripe, Twilio, SendGrid, etc.", isDemo: false },
            { key: "vendorFailover", name: "Vendor Failover Scenarios", description: "What happens when Stripe is down?", isDemo: true },
            { key: "slaTracking", name: "SLA Tracking", description: "Contract and uptime monitoring", isDemo: false },
            { key: "envCosts", name: "Per-Environment Costs", description: "DEV/QA/STAGING/PROD cost breakdown", isDemo: true },
            { key: "aiTokenUsage", name: "AI Token Usage", description: "Track AI costs per agent, per feature", isDemo: true },
            { key: "scalingProjections", name: "Scaling Projections", description: "Cost per user at different scales", isDemo: true },
          ],
        },
      ],
    },
    {
      key: "enterprise",
      name: "PART 5: ENTERPRISE-READY",
      tagline: "Build Trust",
      categories: [
        {
          key: "compliance",
          name: "Compliance & Security",
          description: "Show them QUAD is enterprise-ready. Security is not an afterthought.",
          features: [
            { key: "compliance", name: "Compliance Dashboard", description: "SOC 2, HIPAA, PCI tracking", isDemo: false },
            { key: "riskManagement", name: "Risk Management", description: "Automated risk assessment", isDemo: false },
            { key: "auditTrail", name: "Audit Trail", description: "Complete activity logging", isDemo: true },
            { key: "dataResidency", name: "Data Residency", description: "On-prem or cloud options", isDemo: true },
            { key: "securityScan", name: "Security Scanning", description: "Code vulnerability detection", isDemo: false },
            { key: "accessControls", name: "Access Controls", description: "Fine-grained permissions", isDemo: false },
          ],
        },
        {
          key: "integrations",
          name: "Tool Integrations",
          description: "Show them QUAD fits into their existing ecosystem.",
          features: [
            { key: "jiraIntegration", name: "Jira Integration", description: "Two-way sync with Jira", isDemo: true },
            { key: "githubIntegration", name: "GitHub Integration", description: "Git workflow integration", isDemo: true },
            { key: "slackIntegration", name: "Slack Integration", description: "Notifications and commands", isDemo: false },
            { key: "confluenceIntegration", name: "Confluence Integration", description: "Wiki synchronization", isDemo: false },
            { key: "servicenowIntegration", name: "ServiceNow Integration", description: "Enterprise ticketing", isDemo: false },
            { key: "azureDevopsIntegration", name: "Azure DevOps Integration", description: "MS ecosystem support", isDemo: false },
            { key: "ssoIntegration", name: "SSO Integration", description: "Okta, Azure AD, etc.", isDemo: true },
            { key: "apiGateway", name: "API Gateway", description: "Custom integrations via API", isDemo: false },
          ],
        },
        {
          key: "ide",
          name: "IDE Integration",
          description: "Developer experience in the IDE",
          features: [
            { key: "vscodePlugin", name: "VS Code Extension", description: "Full IDE integration", isDemo: true },
            { key: "intellijPlugin", name: "IntelliJ Plugin", description: "Java IDE support", isDemo: false },
            { key: "realtimeCollab", name: "Real-time Collaboration", description: "AI assists while coding", isDemo: false },
            { key: "codeSuggestions", name: "Code Suggestions", description: "AI-powered completions", isDemo: false },
            { key: "docLookup", name: "Documentation Lookup", description: "Query docs from IDE", isDemo: true },
          ],
        },
      ],
    },
    {
      key: "roi",
      name: "PART 6: ROI",
      tagline: "Show the Money",
      categories: [
        {
          key: "dashboards",
          name: "Dashboards & Analytics",
          description: "Show measurable results. Numbers they can take to leadership.",
          features: [
            { key: "dashboards", name: "Executive Dashboard", description: "High-level metrics for leadership", isDemo: true },
            { key: "engDashboard", name: "Engineering Dashboard", description: "Developer productivity metrics", isDemo: false },
            { key: "flowAnalytics", name: "Flow Analytics", description: "Track Q-U-A-D flow times", isDemo: true },
            { key: "agentAnalytics", name: "AI Agent Analytics", description: "Agent activity and success rates", isDemo: false },
            { key: "costAnalytics", name: "Cost Analytics", description: "AI token usage and costs", isDemo: true },
            { key: "qualityMetrics", name: "Quality Metrics", description: "Bug rates, test coverage", isDemo: false },
            { key: "velocityTracking", name: "Velocity Tracking", description: "Team velocity over time", isDemo: false },
            { key: "customReports", name: "Custom Reports", description: "Build your own dashboards", isDemo: false },
          ],
        },
        {
          key: "orgHierarchy",
          name: "Organization Hierarchy",
          description: "Company structure in QUAD",
          features: [
            { key: "orgHierarchy", name: "Org Structure Visualization", description: "Company → Domain → Circle → User", isDemo: false },
            { key: "domainManagement", name: "Domain Management", description: "Projects/products as domains", isDemo: false },
            { key: "circleTeams", name: "Circle-Based Teams", description: "4 circles per domain", isDemo: false },
            { key: "roleAccess", name: "Role-Based Access", description: "Permissions by role", isDemo: false },
            { key: "adoptionMatrix", name: "Adoption Matrix", description: "Track AI adoption per user", isDemo: false },
          ],
        },
        {
          key: "talent",
          name: "Talent & Training",
          description: "Keep your developers happy and skilled",
          features: [
            { key: "training", name: "Training Suggestions", description: "AI suggests training for devs", isDemo: false },
            { key: "appreciation", name: "Appreciation System", description: "Recognition and rewards", isDemo: false },
            { key: "talentRetention", name: "Talent Retention", description: "Keep talent engaged", isDemo: true },
            { key: "skillDevelopment", name: "Skill Development", description: "Track skill growth", isDemo: false },
            { key: "onboarding", name: "Onboarding Automation", description: "New dev onboarding", isDemo: false },
            { key: "reduceDependency", name: "Documentation = Less Dependency", description: "Less reliance on individuals", isDemo: true },
          ],
        },
      ],
    },
    {
      key: "ask",
      name: "PART 7: THE ASK",
      tagline: "Close Strong",
      categories: [
        {
          key: "enterpriseFeatures",
          name: "Enterprise Features",
          description: "Enterprise-grade capabilities",
          features: [
            { key: "multiTenant", name: "Multi-Tenant Architecture", description: "Isolated per business unit", isDemo: false },
            { key: "highAvailability", name: "High Availability", description: "99.9% uptime SLA", isDemo: false },
            { key: "disasterRecoveryFeature", name: "Disaster Recovery", description: "Business continuity", isDemo: false },
            { key: "enterpriseSupport", name: "Enterprise Support", description: "Dedicated support team", isDemo: false },
          ],
        },
        {
          key: "dataIntelligence",
          name: "Data Intelligence (Future)",
          description: "Coming soon - AI insights from your data",
          features: [
            { key: "dataIntelligence", name: "Data Intelligence", description: "AI insights from data", isDemo: false },
            { key: "patternRecognition", name: "Pattern Recognition", description: "Identify dev patterns", isDemo: false },
            { key: "predictiveAnalytics", name: "Predictive Analytics", description: "Forecast completion times", isDemo: false },
            { key: "resourceOptimization", name: "Resource Optimization", description: "Optimize team allocation", isDemo: false },
          ],
        },
      ],
    },
  ],
};

// Helper to get all feature keys in a flat list
export function getAllFeatureKeys(): string[] {
  const keys: string[] = [];
  MASSMUTUAL_FEATURES.parts.forEach(part => {
    part.categories.forEach(category => {
      category.features.forEach(feature => {
        keys.push(feature.key);
      });
    });
  });
  return keys;
}

// Helper to get feature count
export function getFeatureCount(): number {
  let count = 0;
  MASSMUTUAL_FEATURES.parts.forEach(part => {
    part.categories.forEach(category => {
      count += category.features.length;
    });
  });
  return count;
}

// Default enabled state - all features enabled by default
export function getDefaultEnabledState(): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  getAllFeatureKeys().forEach(key => {
    state[key] = true;
  });
  return state;
}
