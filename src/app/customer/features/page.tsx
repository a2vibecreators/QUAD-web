"use client";

import Link from "next/link";
import { useState } from "react";

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
      },
      {
        name: "Role-Based Dashboards",
        description: "7 specialized views: Executive, Director, Tech Lead, Developer, QA, Prod Support, Infrastructure",
        status: "live",
      },
      {
        name: "QUAD Model (Q-U-A-D)",
        description: "Question → Understand → Automate → Deliver workflow",
        status: "live",
      },
      {
        name: "Resource Allocation Tracking",
        description: "Real-time allocation alerts with yellow (>20%) and red (>50%) warnings",
        status: "live",
      },
      {
        name: "Multi-Project Support",
        description: "Web UI, Mobile, ETL, Data Science - all project types supported",
        status: "live",
      },
    ],
  },
  {
    id: "ai-agents",
    name: "AI Agents",
    icon: "🤖",
    color: "purple",
    features: [
      {
        name: "Email Agent",
        description: "Monitors inbox, auto-creates Jira tickets from feature requests",
        status: "live",
      },
      {
        name: "Slack Agent",
        description: "Responds to @quad mentions, implements features from chat",
        status: "live",
      },
      {
        name: "Code Agent",
        description: "Generates production-ready code from tickets using AST analysis",
        status: "live",
      },
      {
        name: "Review Agent",
        description: "Automated PR reviews with security and best practice checks",
        status: "live",
      },
      {
        name: "Test Agent",
        description: "Auto-generates unit, integration, and E2E tests",
        status: "coming",
      },
      {
        name: "Deploy Agent",
        description: "Handles CI/CD pipelines and deployments",
        status: "coming",
      },
    ],
  },
  {
    id: "meeting-intelligence",
    name: "Meeting Intelligence",
    icon: "📅",
    color: "green",
    features: [
      {
        name: "Zoom Integration",
        description: "Auto-schedule meetings via Zoom API with service account",
        status: "coming",
        configurable: true,
      },
      {
        name: "Auto-MOM Generation",
        description: "AI generates Minutes of Meeting with action items",
        status: "coming",
        configurable: true,
      },
      {
        name: "Action Item → Tickets",
        description: "Auto-create Jira tickets from meeting action items (TL approval required)",
        status: "coming",
        configurable: true,
      },
      {
        name: "Multi-Language Support",
        description: "Meetings in any language - transcription and MOM in preferred language",
        status: "coming",
      },
      {
        name: "MOM Distribution",
        description: "Configurable: Send to BA, First Circle, or all attendees",
        status: "coming",
        configurable: true,
      },
    ],
  },
  {
    id: "data-intelligence",
    name: "Data Intelligence",
    icon: "🗄️",
    color: "cyan",
    features: [
      {
        name: "Data Masking",
        description: "Auto-mask PII (SSN, credit cards, emails) in dev environments",
        status: "coming",
        highlight: true,
      },
      {
        name: "Prod-Like Data Setup",
        description: "Initialize dev with production-like data structure automatically",
        status: "coming",
      },
      {
        name: "Use Case Data Generation",
        description: "Generate synthetic data for specific test scenarios",
        status: "coming",
      },
      {
        name: "Referential Integrity",
        description: "Masked data maintains foreign key relationships",
        status: "coming",
      },
    ],
  },
  {
    id: "ai-learning",
    name: "AI Learning",
    icon: "🧠",
    color: "yellow",
    features: [
      {
        name: "Priority Learning",
        description: "AI learns from PM behavior to auto-prioritize new tickets",
        status: "coming",
        configurable: true,
      },
      {
        name: "Pattern Recognition",
        description: "Identifies recurring issues and suggests preventive measures",
        status: "coming",
      },
      {
        name: "Codebase Understanding",
        description: "AST-based analysis knows every class, function, and pattern",
        status: "live",
      },
      {
        name: "Style Matching",
        description: "Generated code matches your team's coding standards",
        status: "live",
      },
    ],
  },
  {
    id: "automation",
    name: "Automation",
    icon: "⚡",
    color: "orange",
    features: [
      {
        name: "Auto-Reassignment",
        description: "Detect PTO/leave and auto-reassign tickets (TL approval)",
        status: "live",
        configurable: true,
      },
      {
        name: "Trivial Error → BAU Tickets",
        description: "Auto-create tickets from recurring log errors",
        status: "coming",
        configurable: true,
      },
      {
        name: "Auto-Scheduled Syncs",
        description: "QUAD schedules meetings when blockers detected",
        status: "coming",
        configurable: true,
      },
      {
        name: "Smart Notifications",
        description: "Role-based alerts for what matters to each person",
        status: "live",
      },
    ],
  },
  {
    id: "compliance",
    name: "Compliance & Security",
    icon: "🔒",
    color: "red",
    features: [
      {
        name: "BYOK (Bring Your Own Key)",
        description: "Your API keys, your data, your cloud - nothing leaves your infrastructure",
        status: "live",
        highlight: true,
      },
      {
        name: "Self-Hosted Option",
        description: "Deploy on your own cloud (AWS, GCP, Azure)",
        status: "live",
      },
      {
        name: "Audit Trail",
        description: "Every AI action logged and auditable",
        status: "live",
      },
      {
        name: "SOC 2 / HIPAA Ready",
        description: "Enterprise compliance support",
        status: "coming",
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
      },
      {
        name: "GitHub Integration",
        description: "PR creation, reviews, and merge automation",
        status: "live",
      },
      {
        name: "Slack Integration",
        description: "@quad mentions trigger AI agents",
        status: "live",
      },
      {
        name: "VS Code Extension",
        description: "QUAD agents accessible from your IDE",
        status: "coming",
      },
      {
        name: "Azure DevOps",
        description: "Full integration with Azure DevOps boards and repos",
        status: "coming",
      },
    ],
  },
];

export default function CustomerFeatures() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = selectedCategory
    ? FEATURE_CATEGORIES.filter((c) => c.id === selectedCategory)
    : FEATURE_CATEGORIES;

  const totalFeatures = FEATURE_CATEGORIES.reduce((acc, cat) => acc + cat.features.length, 0);
  const liveFeatures = FEATURE_CATEGORIES.reduce(
    (acc, cat) => acc + cat.features.filter((f) => f.status === "live").length,
    0
  );

  return (
    <div className="text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
            Platform Features
          </div>
          <h1 className="text-4xl font-bold mb-4">Everything QUAD Can Do</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {totalFeatures} features across {FEATURE_CATEGORIES.length} categories.{" "}
            <span className="text-green-400">{liveFeatures} live</span>,{" "}
            <span className="text-yellow-400">{totalFeatures - liveFeatures} coming soon</span>.
          </p>
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
            All ({totalFeatures})
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
              {cat.icon} {cat.name} ({cat.features.length})
            </button>
          ))}
        </div>

        {/* Feature Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <section
              key={category.id}
              className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{category.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  <p className="text-slate-500 text-sm">{category.features.length} features</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      feature.highlight
                        ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30"
                        : "bg-slate-900/50 border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{feature.name}</h3>
                      <div className="flex gap-1">
                        {feature.configurable && (
                          <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                            ⚙️
                          </span>
                        )}
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
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
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
