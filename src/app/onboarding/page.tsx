"use client";

import { useState } from "react";
import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

// Tool requirements with pricing
const requiredTools = [
  {
    id: "ai",
    category: "Agentic AI Platform",
    icon: "🤖",
    description: "The brain of QUAD - AI that can understand context, execute tasks, and work autonomously",
    tools: [
      {
        name: "Claude (Anthropic)",
        tier: "Business/Enterprise",
        price: "$30/user/month",
        features: ["Extended context (200K tokens)", "Team collaboration", "Admin controls", "API access"],
        recommended: true,
        url: "https://claude.ai/business",
      },
      {
        name: "ChatGPT (OpenAI)",
        tier: "Team/Enterprise",
        price: "$25-30/user/month",
        features: ["GPT-4 access", "Team workspace", "Admin dashboard", "API access"],
        recommended: false,
        url: "https://openai.com/chatgpt/team",
      },
      {
        name: "GitHub Copilot",
        tier: "Business",
        price: "$19/user/month",
        features: ["Code completion", "Chat in IDE", "CLI assistance", "PR summaries"],
        recommended: false,
        url: "https://github.com/features/copilot",
      },
    ],
  },
  {
    id: "pm",
    category: "Project Management",
    icon: "📋",
    description: "Your Single Source of Truth - where all requirements, tasks, and documentation live",
    tools: [
      {
        name: "Jira (Atlassian)",
        tier: "Standard/Premium",
        price: "$7.75-15.25/user/month",
        features: ["Agile boards", "Custom workflows", "Automation rules", "API access"],
        recommended: true,
        url: "https://www.atlassian.com/software/jira/pricing",
      },
      {
        name: "Azure DevOps",
        tier: "Basic/Basic+Test",
        price: "$6-52/user/month",
        features: ["Boards", "Pipelines", "Repos", "Test Plans"],
        recommended: false,
        url: "https://azure.microsoft.com/pricing/details/devops/azure-devops-services/",
      },
      {
        name: "Linear",
        tier: "Business",
        price: "$8/user/month",
        features: ["Fast UI", "Cycles", "Roadmaps", "API"],
        recommended: false,
        url: "https://linear.app/pricing",
      },
    ],
  },
  {
    id: "git",
    category: "Source Control",
    icon: "🔀",
    description: "Version control for your code - essential for AI agents to read and write code",
    tools: [
      {
        name: "GitHub",
        tier: "Team/Enterprise",
        price: "$4-21/user/month",
        features: ["Repos", "Actions CI/CD", "Code review", "Copilot integration"],
        recommended: true,
        url: "https://github.com/pricing",
      },
      {
        name: "GitLab",
        tier: "Premium/Ultimate",
        price: "$29-99/user/month",
        features: ["All-in-one DevOps", "CI/CD", "Security scanning"],
        recommended: false,
        url: "https://about.gitlab.com/pricing/",
      },
      {
        name: "Bitbucket",
        tier: "Standard/Premium",
        price: "$3-6/user/month",
        features: ["Repos", "Pipelines", "Jira integration"],
        recommended: false,
        url: "https://www.atlassian.com/software/bitbucket/pricing",
      },
    ],
  },
  {
    id: "comm",
    category: "Communication",
    icon: "💬",
    description: "Where your team communicates - AI agents can send notifications here",
    tools: [
      {
        name: "Slack",
        tier: "Pro/Business+",
        price: "$7.25-12.50/user/month",
        features: ["Channels", "Huddles", "Workflows", "App integrations"],
        recommended: true,
        url: "https://slack.com/pricing",
      },
      {
        name: "Microsoft Teams",
        tier: "Business Basic+",
        price: "$6-12.50/user/month",
        features: ["Chat", "Video", "File sharing", "M365 integration"],
        recommended: false,
        url: "https://www.microsoft.com/microsoft-teams/compare-microsoft-teams-options",
      },
    ],
  },
];

// Onboarding steps for Senior Director
const onboardingSteps = [
  {
    step: 1,
    title: "Get Leadership Buy-In",
    duration: "1-2 weeks",
    owner: "Senior Director",
    tasks: [
      "Review QUAD pitch deck (/pitch page)",
      "Calculate ROI with your team size",
      "Present to C-suite / stakeholders",
      "Get budget approval for tools",
    ],
    deliverable: "Approved budget and timeline",
  },
  {
    step: 2,
    title: "Procure Required Tools",
    duration: "1-2 weeks",
    owner: "IT / Procurement",
    tasks: [
      "Subscribe to Claude Business (or equivalent AI)",
      "Ensure Jira/GitHub accounts have API access",
      "Set up Slack workspace (if not existing)",
      "Create service accounts for AI agents",
    ],
    deliverable: "All tools provisioned with API keys",
  },
  {
    step: 3,
    title: "Configure QUAD",
    duration: "1 day",
    owner: "Senior Director + Tech Lead",
    tasks: [
      "Go to /configure page",
      "Select adoption level (start with 1D recommended)",
      "Define team structure (Directors → Team Leads)",
      "Export quad.config.yaml",
    ],
    deliverable: "QUAD configuration file",
  },
  {
    step: 4,
    title: "Pilot Project Selection",
    duration: "1 week",
    owner: "Director",
    tasks: [
      "Choose 1 project for pilot (not critical, not trivial)",
      "Identify pilot team (1 Team Lead per Circle)",
      "Set up QUAD labels in Jira",
      "Brief pilot team on QUAD methodology",
    ],
    deliverable: "Pilot project and team ready",
  },
  {
    step: 5,
    title: "Run First Sprint with QUAD",
    duration: "2 weeks",
    owner: "Team Lead",
    tasks: [
      "Write first stories using QUAD format",
      "Use AI agent for story expansion",
      "Track time saved vs traditional approach",
      "Document lessons learned",
    ],
    deliverable: "Sprint completed + metrics",
  },
  {
    step: 6,
    title: "Review & Scale",
    duration: "1-2 weeks",
    owner: "Senior Director",
    tasks: [
      "Review pilot metrics (velocity, quality, team feedback)",
      "Decide: Scale to more projects or iterate",
      "Plan rollout to remaining teams",
      "Consider moving to next adoption level",
    ],
    deliverable: "Rollout plan or pivot decision",
  },
];

// What is Agentic AI explainer content
const agenticAIExplainer = {
  title: "What is Agentic AI?",
  definition: "AI that can autonomously perform tasks, make decisions, and take actions - not just chat.",
  comparison: [
    { type: "Traditional AI (ChatGPT free)", desc: "You ask → AI answers → You do the work", icon: "💬" },
    { type: "Agentic AI (Claude Code, Copilot)", desc: "You describe goal → AI plans + executes → You review", icon: "🤖" },
  ],
  examples: [
    { task: "Expand user story", traditional: "You ask AI for suggestions, copy-paste into Jira", agentic: "AI reads Jira, writes story, updates Jira directly" },
    { task: "Write tests", traditional: "You ask AI for test code, copy into file", agentic: "AI analyzes code, writes tests, creates PR" },
    { task: "Code review", traditional: "You paste code, ask for feedback", agentic: "AI reads PR, adds comments, suggests fixes" },
  ],
};

export default function OnboardingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCheckedItems(newSet);
  };

  // Calculate progress
  const totalTasks = onboardingSteps.reduce((acc, step) => acc + step.tasks.length, 0);
  const completedTasks = checkedItems.size;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🚀 QUAD Onboarding Requirements</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            What you need before adopting QUAD, and how to get started as a Senior Director
          </p>
        </div>

        {/* What is Agentic AI Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              {agenticAIExplainer.title}
            </h2>
            <p className="text-lg text-slate-300 mb-6">{agenticAIExplainer.definition}</p>

            {/* Comparison */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {agenticAIExplainer.comparison.map((item, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-xl border ${
                    i === 1 ? "bg-green-500/10 border-green-500/30" : "bg-slate-800/50 border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="font-bold">{item.type}</span>
                    {i === 1 && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                        QUAD Uses This
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Examples Table */}
            <h3 className="font-bold mb-4">Real Examples:</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 px-4">Task</th>
                    <th className="text-left py-2 px-4 text-slate-400">Traditional AI</th>
                    <th className="text-left py-2 px-4 text-green-400">Agentic AI (QUAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {agenticAIExplainer.examples.map((ex, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-medium">{ex.task}</td>
                      <td className="py-3 px-4 text-slate-400">{ex.traditional}</td>
                      <td className="py-3 px-4 text-green-300">{ex.agentic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Required Tools Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">🔧</span>
            Required Tools & Subscriptions
          </h2>
          <p className="text-slate-400 mb-8">
            Before you can use QUAD, your organization needs these tools. Most enterprises already have them.
          </p>

          <div className="space-y-6">
            {requiredTools.map((category) => (
              <div
                key={category.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setSelectedCategory(selectedCategory === category.id ? null : category.id)
                  }
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{category.icon}</span>
                    <div className="text-left">
                      <h3 className="font-bold text-lg">{category.category}</h3>
                      <p className="text-sm text-slate-400">{category.description}</p>
                    </div>
                  </div>
                  <span className="text-2xl text-slate-400">
                    {selectedCategory === category.id ? "▲" : "▼"}
                  </span>
                </button>

                {selectedCategory === category.id && (
                  <div className="p-6 pt-0 border-t border-slate-700">
                    <div className="grid md:grid-cols-3 gap-4">
                      {category.tools.map((tool) => (
                        <div
                          key={tool.name}
                          className={`p-4 rounded-xl border ${
                            tool.recommended
                              ? "bg-blue-500/10 border-blue-500/50"
                              : "bg-slate-700/30 border-slate-600"
                          }`}
                        >
                          {tool.recommended && (
                            <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded text-xs mb-2 inline-block">
                              Recommended
                            </span>
                          )}
                          <h4 className="font-bold">{tool.name}</h4>
                          <div className="text-sm text-slate-400 mb-2">{tool.tier}</div>
                          <div className="text-lg font-bold text-green-400 mb-3">{tool.price}</div>
                          <ul className="text-xs text-slate-400 space-y-1 mb-4">
                            {tool.features.map((f, i) => (
                              <li key={i}>• {f}</li>
                            ))}
                          </ul>
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:underline"
                          >
                            View pricing →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cost Estimate */}
          <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="font-bold mb-4">💰 Estimated Monthly Cost (per user)</h3>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">$30</div>
                <div className="text-sm text-slate-400">Claude Business</div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">$8</div>
                <div className="text-sm text-slate-400">Jira Standard</div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">$4</div>
                <div className="text-sm text-slate-400">GitHub Team</div>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">~$42</div>
                <div className="text-sm text-slate-400">Total/user/month</div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              * Many organizations already have Jira, GitHub, and Slack. You may only need Claude Business.
            </p>
          </div>
        </section>

        {/* Onboarding Steps Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-3xl">📋</span>
              Senior Director Onboarding Steps
            </h2>
            <div className="text-right">
              <div className="text-sm text-slate-400">Progress</div>
              <div className="text-2xl font-bold text-blue-400">{progress}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 mb-8">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {onboardingSteps.map((step) => (
              <div
                key={step.step}
                className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        step.tasks.every((_, i) => checkedItems.has(`${step.step}-${i}`))
                          ? "bg-green-500 text-white"
                          : "bg-blue-500/20 text-blue-400 border-2 border-blue-500"
                      }`}
                    >
                      {step.tasks.every((_, i) => checkedItems.has(`${step.step}-${i}`))
                        ? "✓"
                        : step.step}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold">{step.title}</h3>
                      <div className="text-sm text-slate-400">
                        {step.duration} • Owner: {step.owner}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {expandedStep === step.step ? "▲" : "▼"}
                  </span>
                </button>

                {expandedStep === step.step && (
                  <div className="p-6 pt-0 border-t border-slate-700">
                    <div className="space-y-3 mb-6">
                      {step.tasks.map((task, i) => (
                        <button
                          key={i}
                          onClick={() => toggleCheck(`${step.step}-${i}`)}
                          className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-all ${
                            checkedItems.has(`${step.step}-${i}`)
                              ? "bg-green-500/20 border border-green-500/50"
                              : "bg-slate-700/30 border border-slate-600 hover:border-slate-500"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded border flex items-center justify-center text-sm ${
                              checkedItems.has(`${step.step}-${i}`)
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-slate-500"
                            }`}
                          >
                            {checkedItems.has(`${step.step}-${i}`) && "✓"}
                          </span>
                          <span
                            className={
                              checkedItems.has(`${step.step}-${i}`)
                                ? "line-through text-slate-500"
                                : ""
                            }
                          >
                            {task}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <span className="text-sm text-blue-400">📦 Deliverable:</span>
                      <div className="font-medium">{step.deliverable}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Timeline Summary */}
        <section className="mb-16">
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
            <h2 className="text-xl font-bold mb-6">⏱️ Total Onboarding Timeline</h2>
            <div className="flex flex-wrap justify-between items-center">
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-blue-400">6-8</div>
                <div className="text-sm text-slate-400">Weeks Total</div>
              </div>
              <div className="text-slate-600 text-2xl">→</div>
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-green-400">1</div>
                <div className="text-sm text-slate-400">Pilot Project</div>
              </div>
              <div className="text-slate-600 text-2xl">→</div>
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-purple-400">1</div>
                <div className="text-sm text-slate-400">Sprint with QUAD</div>
              </div>
              <div className="text-slate-600 text-2xl">→</div>
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-orange-400">Scale</div>
                <div className="text-sm text-slate-400">Or Iterate</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-slate-400 mb-8">
            Once you have the required tools, configure QUAD for your team
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discovery"
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-lg font-semibold transition-all hover:scale-105"
            >
              🔍 Not Sure? Take Discovery Quiz
            </Link>
            <Link
              href="/configure"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition-all hover:scale-105"
            >
              ⚙️ Ready? Configure QUAD
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
