"use client";

import Link from "next/link";
import { useState } from "react";

// Complete feature breakdown by phase and category
const PHASE_BREAKDOWN = {
  phase1: {
    label: "Phase 1: Foundation (Q1 2026)",
    total: 48,
    categories: [
      { name: "Core Platform", count: 16 },
      { name: "AI & Memory", count: 12 },
      { name: "Integrations", count: 8 },
      { name: "VS Code Plugin", count: 12 },
      { name: "Voice & Mobile", count: 0 },
    ],
  },
  phase2: {
    label: "Phase 2: Intelligence (Q2-Q3 2026)",
    total: 58,
    categories: [
      { name: "Core Platform", count: 8 },
      { name: "AI & Memory", count: 13 },
      { name: "Integrations", count: 15 },
      { name: "VS Code Plugin", count: 10 },
      { name: "Voice & Mobile", count: 12 },
    ],
  },
  phase3: {
    label: "Phase 3: Autonomy (Q4 2026+)",
    total: 44,
    categories: [
      { name: "Core Platform", count: 5 },
      { name: "AI & Memory", count: 8 },
      { name: "Integrations", count: 10 },
      { name: "VS Code Plugin", count: 9 },
      { name: "Voice & Mobile", count: 12 },
    ],
  },
};

// Feature categories with all QUAD features
const FEATURE_CATEGORIES = [
  {
    id: "core",
    name: "Core Platform",
    icon: "🎯",
    color: "blue",
    features: [
      {
        name: "Meeting to Code",
        description: "Email/Slack message → Jira ticket → Working code in hours",
        status: "live",
        highlight: true,
        phase: 1,
      },
      {
        name: "Role-Based Dashboards",
        description: "Specialized dashboards for each role (Executive, Director, Tech Lead, Developer, QA, Infrastructure)",
        status: "live",
        phase: 1,
      },
      {
        name: "QUAD Model (Q-U-A-D)",
        description: "Question → Understand → Automate → Deliver workflow",
        status: "live",
        phase: 1,
      },
      {
        name: "Resource Allocation Tracking",
        description: "Real-time allocation alerts with yellow (>20%) and red (>50%) warnings",
        status: "live",
        phase: 1,
      },
      {
        name: "Multi-Project Support",
        description: "Web UI, Mobile, ETL, Data Science - all project types supported",
        status: "live",
        phase: 1,
      },
      {
        name: "Organization Management",
        description: "Create orgs, invite members, manage roles",
        status: "live",
        phase: 1,
      },
      {
        name: "Domain Structure",
        description: "Business domains (Product, Engineering, etc.)",
        status: "live",
        phase: 1,
      },
      {
        name: "Circle Management",
        description: "Teams within domains (Platform, Mobile, etc.)",
        status: "live",
        phase: 1,
      },
      {
        name: "Project Tracking",
        description: "Projects with goals, timelines, metrics",
        status: "live",
        phase: 1,
      },
      {
        name: "Ticket System",
        description: "Stories, bugs, tasks with workflows",
        status: "live",
        phase: 1,
      },
      {
        name: "Cycle/Sprint Management",
        description: "2-week cycles with velocity tracking",
        status: "live",
        phase: 1,
      },
      {
        name: "User Authentication",
        description: "OAuth, email/password, SSO (enterprise)",
        status: "live",
        phase: 1,
      },
      {
        name: "Role-Based Access",
        description: "Admin, Lead, Member, Viewer roles",
        status: "live",
        phase: 1,
      },
      {
        name: "Audit Logging",
        description: "Track all changes for compliance",
        status: "live",
        phase: 1,
      },
      {
        name: "Dashboard",
        description: "Org overview, metrics, quick actions",
        status: "live",
        phase: 1,
      },
      {
        name: "Role-Based IDE Dashboards",
        description: "Role-specific views, customizable widgets",
        status: "coming",
        phase: 1,
      },
    ],
  },
  {
    id: "ai-agents",
    name: "AI & Memory",
    icon: "🤖",
    color: "purple",
    features: [
      {
        name: "Email Agent",
        description: "Monitors inbox, auto-creates Jira tickets from feature requests",
        status: "live",
        phase: 1,
      },
      {
        name: "Slack Agent",
        description: "Responds to @quad mentions, implements features from chat",
        status: "live",
        phase: 1,
      },
      {
        name: "Code Agent",
        description: "Generates production-ready code from tickets using AST analysis",
        status: "live",
        phase: 1,
      },
      {
        name: "Review Agent",
        description: "Automated PR reviews with security and best practice checks",
        status: "live",
        phase: 1,
      },
      {
        name: "Multi-Provider AI Router",
        description: "Route tasks to optimal AI provider (Claude, Gemini, Groq, DeepSeek)",
        status: "live",
        phase: 1,
      },
      {
        name: "Task Classification",
        description: "Analyze request, pick best AI",
        status: "live",
        phase: 1,
      },
      {
        name: "AI Configuration (per org)",
        description: "BYOK keys, provider preferences",
        status: "live",
        phase: 1,
      },
      {
        name: "Token Usage Tracking",
        description: "Monitor costs per user/project",
        status: "live",
        phase: 1,
      },
      {
        name: "AI Chat Interface",
        description: "Web-based AI assistant",
        status: "coming",
        phase: 1,
      },
      {
        name: "Hierarchical Memory",
        description: "Org → Domain → Project → Circle → User",
        status: "live",
        phase: 1,
      },
      {
        name: "Memory Documents",
        description: "Store patterns, rules, context",
        status: "live",
        phase: 1,
      },
      {
        name: "Memory Chunks",
        description: "Searchable context pieces",
        status: "live",
        phase: 1,
      },
      {
        name: "Test Agent",
        description: "Auto-generates unit, integration, and E2E tests",
        status: "coming",
        phase: 2,
      },
      {
        name: "Deploy Agent",
        description: "Handles CI/CD pipelines and deployments",
        status: "coming",
        phase: 2,
      },
      {
        name: "Intelligent Context Selection",
        description: "Smart context for AI requests",
        status: "coming",
        phase: 2,
      },
      {
        name: "Code Generation",
        description: "Generate code from tickets",
        status: "coming",
        phase: 2,
      },
      {
        name: "Code Review AI",
        description: "Automated PR review",
        status: "coming",
        phase: 2,
      },
      {
        name: "Documentation Generation",
        description: "Auto-generate docs from code",
        status: "coming",
        phase: 2,
      },
      {
        name: "Test Generation",
        description: "Generate tests from code",
        status: "coming",
        phase: 2,
      },
      {
        name: "Codebase Understanding",
        description: "AST-based analysis knows every class, function, and pattern",
        status: "live",
        phase: 1,
      },
      {
        name: "Style Matching",
        description: "Generated code matches your team's coding standards",
        status: "live",
        phase: 1,
      },
      {
        name: "Priority Learning",
        description: "AI learns from PM behavior to auto-prioritize new tickets",
        status: "coming",
        phase: 2,
      },
      {
        name: "Pattern Recognition",
        description: "Identifies recurring issues and suggests preventive measures",
        status: "coming",
        phase: 2,
      },
      {
        name: "Full Autonomous Dev Agent",
        description: "Code from ticket, no human",
        status: "coming",
        phase: 3,
      },
      {
        name: "Architecture Analysis",
        description: "AI reviews system design",
        status: "coming",
        phase: 3,
      },
      {
        name: "Security Scanning",
        description: "AI finds vulnerabilities",
        status: "coming",
        phase: 3,
      },
      {
        name: "Performance Optimization",
        description: "AI suggests optimizations",
        status: "coming",
        phase: 3,
      },
      {
        name: "Context Retrieval",
        description: "RAG-based context for AI",
        status: "coming",
        phase: 1,
      },
      {
        name: "Memory API",
        description: "CRUD operations for memory",
        status: "coming",
        phase: 1,
      },
      {
        name: "Cost Agent",
        description: "Optimizes cloud spend",
        status: "coming",
        phase: 2,
      },
      {
        name: "Training Agent",
        description: "Matches skills to courses",
        status: "coming",
        phase: 2,
      },
      {
        name: "Analytics Agent",
        description: "Tracks performance",
        status: "coming",
        phase: 2,
      },
      {
        name: "Document Agent",
        description: "Generates & updates docs",
        status: "coming",
        phase: 2,
      },
      {
        name: "Velocity Analytics",
        description: "Track team performance metrics",
        status: "coming",
        phase: 2,
      },
      {
        name: "Retrospective Insights",
        description: "AI summarizes sprint learnings",
        status: "coming",
        phase: 2,
      },
      {
        name: "Blocker Detection",
        description: "AI identifies stuck tickets",
        status: "coming",
        phase: 2,
      },
      {
        name: "Manager Edit Layer",
        description: "Manager adds context to AI summary",
        status: "coming",
        phase: 2,
      },
      {
        name: "Certification Recommendations",
        description: "AI suggests certifications based on skills",
        status: "coming",
        phase: 2,
      },
      {
        name: "Training Cost Optimization",
        description: "Optimize team training investments",
        status: "coming",
        phase: 2,
      },
      {
        name: "Collaboration Metrics",
        description: "Who worked with whom analytics",
        status: "coming",
        phase: 2,
      },
      {
        name: "Productivity Insights",
        description: "AI-driven productivity analytics",
        status: "coming",
        phase: 2,
      },
      {
        name: "Autonomous Architecture Review",
        description: "AI autonomously reviews architecture",
        status: "coming",
        phase: 3,
      },
      {
        name: "HIPAA Compliance",
        description: "Healthcare-ready compliance",
        status: "coming",
        phase: 3,
      },
      {
        name: "SOC 2 Type II",
        description: "Enterprise security certification",
        status: "coming",
        phase: 3,
      },
      {
        name: "On-Premise Deployment",
        description: "Full self-hosted option",
        status: "coming",
        phase: 3,
      },
      {
        name: "SAML SSO Integration",
        description: "Enterprise identity integration",
        status: "coming",
        phase: 3,
      },
      {
        name: "Advanced Security Scanning",
        description: "Comprehensive vulnerability detection",
        status: "coming",
        phase: 3,
      },
      {
        name: "Compliance Dashboard",
        description: "Real-time compliance monitoring",
        status: "coming",
        phase: 3,
      },
    ],
  },
  {
    id: "integrations",
    name: "Integrations",
    icon: "🔗",
    color: "slate",
    features: [
      {
        name: "Jira Integration",
        description: "Two-way sync with Jira tickets and workflows",
        status: "live",
        phase: 1,
      },
      {
        name: "GitHub Integration",
        description: "PR creation, reviews, and merge automation",
        status: "live",
        phase: 1,
      },
      {
        name: "Slack Integration",
        description: "@quad mentions trigger AI agents",
        status: "live",
        phase: 1,
      },
      {
        name: "GitHub Codebase Indexing",
        description: "Index files for AI context",
        status: "coming",
        phase: 1,
      },
      {
        name: "PR ↔ Ticket Linking",
        description: "Auto-link PRs to tickets",
        status: "coming",
        phase: 1,
      },
      {
        name: "Slack Notifications",
        description: "Push updates to Slack channels",
        status: "coming",
        phase: 1,
      },
      {
        name: "Email Notifications",
        description: "Ticket updates via email",
        status: "coming",
        phase: 1,
      },
      {
        name: "Webhook Support",
        description: "Custom integrations",
        status: "coming",
        phase: 1,
      },
      {
        name: "Jira Sync",
        description: "Bi-directional ticket sync",
        status: "coming",
        phase: 2,
      },
      {
        name: "Jira Import",
        description: "Migrate from Jira to QUAD",
        status: "coming",
        phase: 2,
      },
      {
        name: "Confluence Import",
        description: "Migrate docs from Confluence",
        status: "coming",
        phase: 2,
      },
      {
        name: "Linear Sync",
        description: "Bi-directional with Linear",
        status: "coming",
        phase: 2,
      },
      {
        name: "Notion Import",
        description: "Migrate from Notion",
        status: "coming",
        phase: 2,
      },
      {
        name: "GitLab Integration",
        description: "Full GitLab support",
        status: "coming",
        phase: 2,
      },
      {
        name: "Bitbucket Integration",
        description: "Bitbucket repo support",
        status: "coming",
        phase: 2,
      },
      {
        name: "Asana Integration",
        description: "Bi-directional with Asana",
        status: "coming",
        phase: 3,
      },
      {
        name: "Monday.com Integration",
        description: "Sync with Monday.com",
        status: "coming",
        phase: 3,
      },
      {
        name: "Trello Integration",
        description: "Trello board sync",
        status: "coming",
        phase: 3,
      },
      {
        name: "Azure DevOps",
        description: "Full integration with Azure DevOps boards and repos",
        status: "coming",
        phase: 3,
      },
      {
        name: "SharePoint Integration",
        description: "SharePoint doc sync",
        status: "coming",
        phase: 3,
      },
      {
        name: "Confluence Sync",
        description: "Bi-directional with Confluence",
        status: "coming",
        phase: 2,
      },
      {
        name: "GitBook Sync",
        description: "GitBook integration",
        status: "coming",
        phase: 2,
      },
      {
        name: "DeepWiki Sync",
        description: "DeepWiki integration",
        status: "coming",
        phase: 2,
      },
      {
        name: "Auto-Deploy on Approval",
        description: "Voice approval triggers deploy",
        status: "coming",
        phase: 3,
      },
      {
        name: "Ticket Auto-Assignment",
        description: "AI assigns tickets based on skills",
        status: "coming",
        phase: 3,
      },
      {
        name: "Code Scanner Integration",
        description: "SonarQube, JAR-based security scanning",
        status: "coming",
        phase: 2,
      },
      {
        name: "Azure Repos",
        description: "Azure Repos support",
        status: "coming",
        phase: 3,
      },
      {
        name: "Bitbucket Cloud",
        description: "Bitbucket Cloud support",
        status: "coming",
        phase: 3,
      },
      {
        name: "BitBucket Server",
        description: "BitBucket Server support",
        status: "coming",
        phase: 3,
      },
      {
        name: "GitHub Enterprise",
        description: "GitHub Enterprise support",
        status: "coming",
        phase: 2,
      },
    ],
  },
  {
    id: "vscode",
    name: "VS Code Plugin",
    icon: "⚙️",
    color: "blue",
    features: [
      {
        name: "VS Code Extension",
        description: "QUAD agents accessible from your IDE",
        status: "coming",
        phase: 1,
      },
      {
        name: "Code Generation in IDE",
        description: "Generate code directly in VS Code",
        status: "coming",
        phase: 1,
      },
      {
        name: "Code Review in IDE",
        description: "Review code without leaving VS Code",
        status: "coming",
        phase: 1,
      },
      {
        name: "Test Generation in IDE",
        description: "Generate tests from VS Code",
        status: "coming",
        phase: 1,
      },
      {
        name: "Deploy from IDE",
        description: "Deploy directly from VS Code",
        status: "coming",
        phase: 1,
      },
      {
        name: "Memory Integration",
        description: "Access org memory from IDE",
        status: "coming",
        phase: 1,
      },
      {
        name: "Code Snippets",
        description: "Access codebase snippets",
        status: "coming",
        phase: 1,
      },
      {
        name: "Terminal Integration",
        description: "QUAD commands in terminal",
        status: "coming",
        phase: 1,
      },
      {
        name: "Debugging Assistant",
        description: "AI debugging help in IDE",
        status: "coming",
        phase: 1,
      },
      {
        name: "Performance Profiling",
        description: "Profile code from IDE",
        status: "coming",
        phase: 1,
      },
      {
        name: "Security Analysis",
        description: "Security checks in IDE",
        status: "coming",
        phase: 1,
      },
      {
        name: "Settings Sync",
        description: "Sync settings across IDEs",
        status: "coming",
        phase: 1,
      },
      {
        name: "Refactoring Assistant",
        description: "AI-powered refactoring suggestions",
        status: "coming",
        phase: 2,
      },
      {
        name: "Documentation from Code",
        description: "Auto-generate docs from code in IDE",
        status: "coming",
        phase: 2,
      },
      {
        name: "Visual Debugging",
        description: "Visual debugger integration",
        status: "coming",
        phase: 2,
      },
      {
        name: "Performance Monitoring",
        description: "Monitor app performance from IDE",
        status: "coming",
        phase: 2,
      },
      {
        name: "Error Analysis",
        description: "AI analyzes errors in IDE",
        status: "coming",
        phase: 2,
      },
      {
        name: "Code Metrics",
        description: "Real-time code metrics",
        status: "coming",
        phase: 2,
      },
      {
        name: "Team Collaboration",
        description: "Real-time code collaboration",
        status: "coming",
        phase: 2,
      },
      {
        name: "Custom Commands",
        description: "Create custom QUAD commands",
        status: "coming",
        phase: 2,
      },
      {
        name: "QUAD IDE",
        description: "QUAD's own IDE (Beyond VS Code)",
        status: "coming",
        phase: 3,
      },
      {
        name: "AI-Native Editor",
        description: "AI integrated at every level",
        status: "coming",
        phase: 3,
      },
      {
        name: "Real-time Collaboration",
        description: "Google Docs for code",
        status: "coming",
        phase: 3,
      },
      {
        name: "QUAD API Direct from IDE",
        description: "Create tickets, update status from IDE",
        status: "coming",
        phase: 3,
      },
      {
        name: "Extensions Marketplace",
        description: "Third-party QUAD extensions",
        status: "coming",
        phase: 3,
      },
      {
        name: "Theme Support",
        description: "Custom themes for QUAD IDE",
        status: "coming",
        phase: 3,
      },
      {
        name: "Keyboard Shortcuts",
        description: "Customizable keyboard shortcuts",
        status: "coming",
        phase: 3,
      },
      {
        name: "Version Control",
        description: "Version control integration",
        status: "coming",
        phase: 3,
      },
      {
        name: "Terminal Emulator",
        description: "Built-in terminal emulator",
        status: "coming",
        phase: 3,
      },
      {
        name: "File Explorer",
        description: "Advanced file explorer",
        status: "coming",
        phase: 3,
      },
      {
        name: "Search & Replace",
        description: "Powerful search and replace",
        status: "coming",
        phase: 3,
      },
      {
        name: "Language Support",
        description: "Support for all major languages",
        status: "coming",
        phase: 3,
      },
    ],
  },
  {
    id: "voice-mobile",
    name: "Voice & Mobile",
    icon: "📱",
    color: "green",
    features: [
      {
        name: "Voice Commands",
        description: "Talk to QUAD via voice",
        status: "coming",
        phase: 2,
      },
      {
        name: "Multilingual Voice",
        description: "Telugu, Hindi, Tamil support",
        status: "coming",
        phase: 2,
      },
      {
        name: "Voice-to-Ticket",
        description: "Create tickets by speaking",
        status: "coming",
        phase: 2,
      },
      {
        name: "Status Queries",
        description: "Ask about project status",
        status: "coming",
        phase: 2,
      },
      {
        name: "Mobile Apps (iOS/Android)",
        description: "Native mobile apps as thin REST clients",
        status: "coming",
        phase: 2,
      },
      {
        name: "iPad App (Split-View)",
        description: "iPad-optimized for team management",
        status: "coming",
        phase: 2,
      },
      {
        name: "Meeting Recording Integration",
        description: "Connect Zoom/Meet recordings",
        status: "coming",
        phase: 2,
      },
      {
        name: "AI Meeting Summaries",
        description: "Auto-generate meeting notes",
        status: "coming",
        phase: 2,
      },
      {
        name: "Action Item Extraction",
        description: "Create tickets from meetings",
        status: "coming",
        phase: 2,
      },
      {
        name: "Calendar Sync",
        description: "Sync with Google/Outlook calendar",
        status: "coming",
        phase: 2,
      },
      {
        name: "Daily Standup Facilitation",
        description: "AI runs async standups",
        status: "coming",
        phase: 2,
      },
      {
        name: "Sprint Planning Assistant",
        description: "AI suggests ticket priorities",
        status: "coming",
        phase: 2,
      },
      {
        name: "Proactive Phone Calling",
        description: "QUAD calls developer for decisions",
        status: "coming",
        phase: 3,
      },
      {
        name: "Email Reply Automation",
        description: "AI drafts, user approves via voice",
        status: "coming",
        phase: 3,
      },
      {
        name: "Test Agent with Screenshots",
        description: "AI runs tests, captures screenshots",
        status: "coming",
        phase: 3,
      },
      {
        name: "Voice Approval for Deploy",
        description: "Approve deployments via voice",
        status: "coming",
        phase: 3,
      },
      {
        name: "Mobile Dashboard",
        description: "Full dashboard on mobile",
        status: "coming",
        phase: 3,
      },
      {
        name: "Offline Mode",
        description: "Work offline, sync when connected",
        status: "coming",
        phase: 3,
      },
      {
        name: "Push Notifications",
        description: "Smart push notifications",
        status: "coming",
        phase: 3,
      },
      {
        name: "Mobile Widgets",
        description: "Home screen widgets for Android",
        status: "coming",
        phase: 3,
      },
      {
        name: "Native Features",
        description: "Camera, microphone integration",
        status: "coming",
        phase: 3,
      },
      {
        name: "Biometric Auth",
        description: "Face ID / fingerprint authentication",
        status: "coming",
        phase: 3,
      },
      {
        name: "Mobile Performance",
        description: "Optimized for slow networks",
        status: "coming",
        phase: 3,
      },
      {
        name: "Dark Mode",
        description: "Native dark mode support",
        status: "coming",
        phase: 3,
      },
    ],
  },
];

export default function CustomerFeatures() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  const filteredCategories = selectedCategory
    ? FEATURE_CATEGORIES.filter((c) => c.id === selectedCategory)
    : FEATURE_CATEGORIES;

  const totalFeatures = FEATURE_CATEGORIES.reduce((acc, cat) => acc + cat.features.length, 0);
  const liveFeatures = FEATURE_CATEGORIES.reduce(
    (acc, cat) => acc + cat.features.filter((f) => f.status === "live").length,
    0
  );

  const phase1Features = FEATURE_CATEGORIES.reduce(
    (acc, cat) => acc + cat.features.filter((f) => f.phase === 1).length,
    0
  );
  const phase2Features = FEATURE_CATEGORIES.reduce(
    (acc, cat) => acc + cat.features.filter((f) => f.phase === 2).length,
    0
  );
  const phase3Features = FEATURE_CATEGORIES.reduce(
    (acc, cat) => acc + cat.features.filter((f) => f.phase === 3).length,
    0
  );

  const getFilteredFeatures = (features: typeof FEATURE_CATEGORIES[0]['features']) => {
    if (!selectedPhase) return features;
    return features.filter((f) => f.phase === selectedPhase);
  };

  return (
    <div className="text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
            Complete Product Roadmap
          </div>
          <h1 className="text-4xl font-bold mb-4">150+ Features Across 3 Phases</h1>
          <p className="text-slate-400 max-w-3xl mx-auto">
            The QUAD innovation stack: {totalFeatures} features across {FEATURE_CATEGORIES.length} categories.{" "}
            <span className="text-green-400">{liveFeatures} live</span>,{" "}
            <span className="text-yellow-400">{totalFeatures - liveFeatures} coming soon</span>.
          </p>
        </div>

        {/* Phase Summary Table */}
        <div className="mb-12 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-6">Feature Breakdown by Phase</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400 mb-2">{phase1Features}</div>
              <div className="font-semibold text-white mb-1">Phase 1: Foundation (Q1 2026)</div>
              <div className="text-sm text-slate-400">Core platform + AI agents live</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400 mb-2">{phase2Features}</div>
              <div className="font-semibold text-white mb-1">Phase 2: Intelligence (Q2-Q3 2026)</div>
              <div className="text-sm text-slate-400">Advanced AI + voice + integrations</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400 mb-2">{phase3Features}</div>
              <div className="font-semibold text-white mb-1">Phase 3: Autonomy (Q4 2026+)</div>
              <div className="text-sm text-slate-400">Proactive agents + full IDE</div>
            </div>
          </div>
        </div>

        {/* Phase Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedPhase(null)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPhase === null
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            All Phases ({totalFeatures})
          </button>
          <button
            onClick={() => setSelectedPhase(1)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPhase === 1
                ? "bg-green-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Phase 1 ({phase1Features})
          </button>
          <button
            onClick={() => setSelectedPhase(2)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPhase === 2
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Phase 2 ({phase2Features})
          </button>
          <button
            onClick={() => setSelectedPhase(3)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPhase === 3
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Phase 3 ({phase3Features})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            All Categories
          </button>
          {FEATURE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Feature Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => {
            const filtered = getFilteredFeatures(category.features);
            if (filtered.length === 0) return null;

            return (
              <section
                key={category.id}
                className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold">{category.name}</h2>
                    <p className="text-slate-500 text-sm">{filtered.length} features {selectedPhase ? `in Phase ${selectedPhase}` : ''}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((feature, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        feature.highlight
                          ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30"
                          : "bg-slate-900/50 border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{feature.name}</h3>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {feature.phase === 1 && (
                              <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-300 rounded font-medium">
                                P1
                              </span>
                            )}
                            {feature.phase === 2 && (
                              <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded font-medium">
                                P2
                              </span>
                            )}
                            {feature.phase === 3 && (
                              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded font-medium">
                                P3
                              </span>
                            )}
                            {(() => {
                              if ('configurable' in feature && feature.configurable) {
                                return (
                                  <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                                    ⚙️
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                feature.status === "live"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {feature.status === "live" ? "Live" : "Coming"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mt-2">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Configuration Note */}
        <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚙️</span>
            <h3 className="font-bold text-lg">Configurable Features</h3>
          </div>
          <p className="text-slate-400 mb-4">
            Features marked with ⚙️ are fully configurable per organization:
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-300">MOM recipients: BA, First Circle, or all attendees</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-300">Action items: Auto-assigned with TL approval</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-300">Priority learning: Enable/disable AI suggestions</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-300">Auto-reassignment: Require approval or auto-approve</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">See It In Action</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Experience these features with your organization name in our interactive demo.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/customer/demo"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all"
            >
              Try Interactive Demo
            </Link>
            <Link
              href="/customer/contact"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all"
            >
              Schedule a Call
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-16 text-center">
          <Link href="/customer" className="text-slate-400 hover:text-white transition-colors">
            ← Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
