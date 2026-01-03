"use client";

import PageNavigation from "@/components/PageNavigation";
import { useState } from "react";

export default function QUADPlatform() {
  const sections = [
    { id: "overview", title: "Platform Overview" },
    { id: "444-principle", title: "4-4-4 Principle" },
    { id: "deployment", title: "Deployment Options" },
    { id: "adoption", title: "Adoption Levels" },
    { id: "hierarchy", title: "Company Hierarchy" },
    { id: "onboarding", title: "User Onboarding" },
    { id: "ai-config", title: "AI Configuration" },
    { id: "package", title: "Installation Package" },
    { id: "acl", title: "ACL & Permissions" },
  ];

  const [adoptionLevel, setAdoptionLevel] = useState(4);
  const adoptionLevels = [
    { id: "origin", name: "Origin", symbol: "0D", timeline: "12 months", desc: "Documentation-first, no agents", features: ["4 Circles structure", "Flow Documents", "QUAD terminology"] },
    { id: "vector", name: "Vector", symbol: "1D", timeline: "9 months", desc: "AI agents (sequential)", features: ["Story Agent", "Dev Agents", "Test Agents", "Human approval between steps"] },
    { id: "plane", name: "Plane", symbol: "2D", timeline: "6 months", desc: "Parallel execution", features: ["UI + API in parallel", "Test agents in parallel", "Reduced checkpoints"] },
    { id: "space", name: "Space", symbol: "3D", timeline: "4 months", desc: "End-to-end pipelines", features: ["Estimation pipeline", "Development pipeline", "One command = full workflow"] },
    { id: "hyperspace", name: "Hyperspace", symbol: "4D", timeline: "2 months", desc: "Guardrails + self-improving", features: ["Compliance automation", "Feedback learning", "Custom rules", "Agents learn from YOU"] },
  ];

  const [deploymentMode, setDeploymentMode] = useState<"self-hosted" | "saas">("self-hosted");

  return (
    <div className="min-h-screen text-white">
      <PageNavigation sections={sections} />
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏢</span>
            <h1 className="text-4xl font-bold">QUAD Platform</h1>
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
              PRODUCT
            </span>
          </div>
          <p className="text-slate-400">
            Complete end-to-end deployable solution for enterprise QUAD adoption
          </p>
        </div>

        {/* Platform Overview */}
        <section id="overview" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Platform Overview</h2>
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
            <p className="text-lg text-slate-300 mb-6">
              <strong className="text-white">QUAD Platform</strong> is an enterprise-ready installation package
              that brings the QUAD methodology to your organization. It includes:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: "🤖", title: "AI Agent Runtime", desc: "Pluggable AI providers (Claude, OpenAI, Gemini, Local)" },
                { icon: "🔄", title: "Integration Hub", desc: "Connect Jira, Slack, GitHub, Teams, Email" },
                { icon: "📊", title: "Admin Dashboard", desc: "Company/Director/Project management" },
                { icon: "👥", title: "User Management", desc: "Role-based access control with circle assignments" },
                { icon: "📈", title: "Analytics", desc: "Flow rate, cycle metrics, agent performance" },
                { icon: "🔐", title: "Enterprise Security", desc: "SSO, audit logs, data encryption" },
              ].map((feature) => (
                <div key={feature.title} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="font-bold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4-4-4 Principle */}
        <section id="444-principle" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">The 4-4-4 Principle</h2>
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
            <div className="text-center mb-6">
              <p className="text-lg text-slate-400 mb-4">QUAD transforms your work capacity through AI collaboration</p>
              <div className="flex items-center justify-center gap-4 text-4xl font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">4</span>
                  <span className="text-slate-500 text-xl">hours/day</span>
                </div>
                <span className="text-slate-600">×</span>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400">4</span>
                  <span className="text-slate-500 text-xl">days/week</span>
                </div>
                <span className="text-slate-600">=</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">4X</span>
                  <span className="text-slate-500 text-xl">output</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20 text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-2">4 Hours</div>
                <div className="text-sm text-slate-400">Focused Human Work</div>
                <p className="text-xs text-slate-500 mt-2">
                  Deep work sessions while AI handles routine tasks in parallel
                </p>
              </div>
              <div className="bg-teal-500/10 rounded-lg p-4 border border-teal-500/20 text-center">
                <div className="text-3xl font-bold text-teal-400 mb-2">4 Days</div>
                <div className="text-sm text-slate-400">Work Week</div>
                <p className="text-xs text-slate-500 mt-2">
                  Sustainable pace with AI processing during off-days
                </p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">4X</div>
                <div className="text-sm text-slate-400">Efficiency Gain</div>
                <p className="text-xs text-slate-500 mt-2">
                  Deliver 4x more output with same effort level
                </p>
              </div>
            </div>

            <div className="mt-6 bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">How It Works in Practice</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-400">Human reviews AI-generated code during focused hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-400">AI agents continue processing overnight and weekends</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-400">Handoff queues ensure nothing is blocked</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-400">Adoption Matrix tracks individual readiness</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <a
                href="/adoption-matrix"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                See the Adoption Matrix →
              </a>
            </div>
          </div>
        </section>

        {/* Deployment Options */}
        <section id="deployment" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Deployment Options</h2>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setDeploymentMode("self-hosted")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deploymentMode === "self-hosted"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Self-Hosted (Docker)
            </button>
            <button
              onClick={() => setDeploymentMode("saas")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deploymentMode === "saas"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              SaaS (Cloud)
            </button>
          </div>

          {deploymentMode === "self-hosted" ? (
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20">
              <h3 className="font-bold text-blue-300 mb-4 flex items-center gap-2">
                <span>🐳</span> Self-Hosted Deployment
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Requirements</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Docker & Docker Compose</li>
                    <li>• 8GB RAM minimum (16GB recommended)</li>
                    <li>• 50GB storage</li>
                    <li>• PostgreSQL 15+ (included)</li>
                    <li>• Your AI provider API key</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Quick Start</h4>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-green-400">
                    <div>$ git clone quad-platform</div>
                    <div>$ cp .env.example .env</div>
                    <div>$ # Edit .env with API keys</div>
                    <div>$ docker-compose up -d</div>
                    <div className="text-slate-500 mt-2"># Access: http://localhost:3000</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-green-400 text-sm">✓ Your data stays on your servers</span>
              </div>
            </div>
          ) : (
            <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/20">
              <h3 className="font-bold text-purple-300 mb-4 flex items-center gap-2">
                <span>☁️</span> SaaS Deployment
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Benefits</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• No infrastructure to manage</li>
                    <li>• Automatic updates</li>
                    <li>• 99.9% uptime SLA</li>
                    <li>• SOC2 / HIPAA compliant</li>
                    <li>• Multi-region availability</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Getting Started</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-slate-400">1. Sign up at quad.dev</div>
                    <div className="text-sm text-slate-400">2. Create your organization</div>
                    <div className="text-sm text-slate-400">3. Connect your AI provider</div>
                    <div className="text-sm text-slate-400">4. Invite your team</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <span className="text-purple-400 text-sm">✓ Start in under 5 minutes</span>
              </div>
            </div>
          )}
        </section>

        {/* Adoption Levels */}
        <section id="adoption" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Adoption Levels (0D → 4D)</h2>
          <p className="text-slate-400 mb-6">
            Choose your transformation speed. Start conservative or go all-in.
          </p>

          {/* Level Slider */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 mb-6">
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max="4"
                value={adoptionLevel}
                onChange={(e) => setAdoptionLevel(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-3">
                {adoptionLevels.map((level, i) => (
                  <button
                    key={level.id}
                    onClick={() => setAdoptionLevel(i)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      i === adoptionLevel
                        ? "bg-blue-500/20 text-blue-300 font-bold"
                        : "text-slate-500 hover:text-white"
                    }`}
                  >
                    {level.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Level Details */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-blue-400">{adoptionLevels[adoptionLevel].symbol}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{adoptionLevels[adoptionLevel].name}</h3>
                    <p className="text-slate-400">{adoptionLevels[adoptionLevel].desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">{adoptionLevels[adoptionLevel].timeline}</div>
                  <div className="text-sm text-slate-500">to full adoption</div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">What You Get:</h4>
                <div className="flex flex-wrap gap-2">
                  {adoptionLevels[adoptionLevel].features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {adoptionLevels.map((level, i) => (
              <div
                key={level.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  i === adoptionLevel
                    ? "bg-blue-500/20 border-blue-500 scale-105"
                    : "bg-slate-800/30 border-slate-700 hover:border-slate-600"
                }`}
                onClick={() => setAdoptionLevel(i)}
              >
                <div className="text-2xl font-bold text-center mb-1 text-blue-400">{level.symbol}</div>
                <div className="text-sm font-semibold text-center text-white">{level.name}</div>
                <div className="text-xs text-center text-green-400 mt-1">{level.timeline}</div>
              </div>
            ))}
          </div>

          {/* Level Progression Table */}
          <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400">Dimension</th>
                  <th className="px-4 py-3 text-center text-slate-400">AI Agents</th>
                  <th className="px-4 py-3 text-center text-slate-400">Human Gates</th>
                  <th className="px-4 py-3 text-center text-slate-400">Automation</th>
                  <th className="px-4 py-3 text-center text-slate-400">Best For</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { dim: "0D Origin", agents: "None", gates: "All manual", auto: "0%", best: "Methodology only" },
                  { dim: "1D Vector", agents: "Sequential", gates: "Between each", auto: "25%", best: "Cautious teams" },
                  { dim: "2D Plane", agents: "Parallel", gates: "Per phase", auto: "50%", best: "Growing teams" },
                  { dim: "3D Space", agents: "Pipelines", gates: "Start/End", auto: "75%", best: "Mature teams" },
                  { dim: "4D Hyperspace", agents: "Self-improving", gates: "Exceptions", auto: "95%", best: "AI-native orgs" },
                ].map((row, i) => (
                  <tr
                    key={row.dim}
                    className={`${i === adoptionLevel ? "bg-blue-500/20" : i % 2 === 0 ? "bg-slate-800/20" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold text-white">{row.dim}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.agents}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.gates}</td>
                    <td className="px-4 py-3 text-center text-green-400">{row.auto}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendation */}
          <div className="mt-6 bg-green-500/10 rounded-xl p-4 border border-green-500/20 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-green-300">Recommended Starting Point</h3>
              <p className="text-sm text-slate-400">
                Most organizations start at <strong className="text-white">2D Plane</strong> for a good balance of
                AI assistance and human oversight.
              </p>
            </div>
            <a
              href="/configure"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
            >
              Configure Now →
            </a>
          </div>
        </section>

        {/* Company Hierarchy */}
        <section id="hierarchy" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Company Hierarchy</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            {/* Visual Hierarchy */}
            <div className="space-y-4">
              {/* Company Level */}
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold">
                    C
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Company Level</h3>
                    <p className="text-xs text-slate-400">QUAD Platform Installation</p>
                  </div>
                </div>
                <div className="ml-12 text-sm text-slate-400">
                  <span className="text-blue-300 font-semibold">Company Admin</span> - Installs platform, configures AI providers, manages directors
                </div>
              </div>

              {/* Director Level */}
              <div className="ml-8 bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-300 font-bold">
                    D
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Director Level</h3>
                    <p className="text-xs text-slate-400">Portfolio Management</p>
                  </div>
                </div>
                <div className="ml-12 text-sm text-slate-400">
                  <span className="text-green-300 font-semibold">Directors</span> - Own multiple projects, assign circle leads, set budgets
                </div>
              </div>

              {/* Project Level */}
              <div className="ml-16 bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 font-bold">
                    P
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Project Level</h3>
                    <p className="text-xs text-slate-400">4 Circles Per Project</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    { num: 1, name: "Management", color: "blue" },
                    { num: 2, name: "Development", color: "green" },
                    { num: 3, name: "QA", color: "yellow" },
                    { num: 4, name: "Infrastructure", color: "purple" },
                  ].map((circle) => (
                    <div
                      key={circle.num}
                      className={`bg-${circle.color}-500/10 rounded p-2 text-center border border-${circle.color}-500/20`}
                    >
                      <div className={`text-xs text-${circle.color}-300 font-semibold`}>
                        Circle {circle.num}
                      </div>
                      <div className="text-xs text-slate-500">{circle.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Level */}
              <div className="ml-24 bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold">
                    T
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Team Level</h3>
                    <p className="text-xs text-slate-400">Operators + AI Agents</p>
                  </div>
                </div>
                <div className="ml-12 text-sm text-slate-400">
                  <span className="text-purple-300 font-semibold">Circle Lead + Operators</span> - Execute circle functions, collaborate with AI agents
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Onboarding Journey */}
        <section id="onboarding" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">User Onboarding Journey</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <p className="text-slate-400 mb-6">
              From joining a company to becoming a productive QUAD circle member
            </p>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  actor: "IT Admin",
                  action: "Installs QUAD Platform",
                  acl: "COMPANY_ADMIN",
                  desc: "Downloads package, runs Docker, configures AI provider API key",
                },
                {
                  step: 2,
                  actor: "IT Admin",
                  action: "Creates Director Accounts",
                  acl: "DIRECTOR",
                  desc: "Invites department heads (Engineering VP, Product VP, etc.)",
                },
                {
                  step: 3,
                  actor: "Director",
                  action: "Creates Projects",
                  acl: "PROJECT_OWNER",
                  desc: "Sets up projects under their portfolio with 4 circles each",
                },
                {
                  step: 4,
                  actor: "Director",
                  action: "Assigns Circle Leads",
                  acl: "CIRCLE_LEAD",
                  desc: "Tech Lead → Management, Senior Dev → Development, QA Lead → QA, DevOps Lead → Infra",
                },
                {
                  step: 5,
                  actor: "HR / Director",
                  action: "Invites New Employee",
                  acl: "EMPLOYEE",
                  desc: "Employee gets company SSO access, sees available projects",
                },
                {
                  step: 6,
                  actor: "Circle Lead",
                  action: "Assigns to Circle",
                  acl: "CIRCLE_MEMBER",
                  desc: "Employee gains access to circle-specific agents and tools",
                },
                {
                  step: 7,
                  actor: "Employee",
                  action: "Starts Contributing",
                  acl: "OPERATOR",
                  desc: "Works within circle, uses AI agents, follows QUAD flow",
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{item.action}</span>
                      <span className="text-xs text-slate-500">by {item.actor}</span>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                        +{item.acl}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Configuration */}
        <section id="ai-config" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">AI Provider Configuration</h2>
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20">
            <p className="text-slate-400 mb-4">
              QUAD is a <strong className="text-white">generic methodology</strong> - not locked to any single AI provider.
              Configure your preferred providers at the company level.
            </p>

            {/* Provider Logos */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { name: "Claude", status: "recommended", icon: "🟣" },
                { name: "OpenAI", status: "supported", icon: "🟢" },
                { name: "Gemini", status: "supported", icon: "🔵" },
                { name: "Ollama", status: "self-hosted", icon: "🦙" },
              ].map((provider) => (
                <div
                  key={provider.name}
                  className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700"
                >
                  <div className="text-2xl mb-1">{provider.icon}</div>
                  <div className="text-sm font-semibold text-white">{provider.name}</div>
                  <div className={`text-xs ${
                    provider.status === "recommended" ? "text-green-400" :
                    provider.status === "self-hosted" ? "text-purple-400" :
                    "text-slate-500"
                  }`}>
                    {provider.status}
                  </div>
                </div>
              ))}
            </div>

            {/* Config Example */}
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
              <div className="text-slate-500"># quad-config.yaml</div>
              <div className="text-yellow-400 mt-2">ai_providers:</div>
              <div className="text-slate-300 ml-4">primary:</div>
              <div className="text-slate-400 ml-8">type: <span className="text-green-400">claude</span></div>
              <div className="text-slate-400 ml-8">api_key: <span className="text-purple-400">$&#123;ANTHROPIC_API_KEY&#125;</span></div>
              <div className="text-slate-400 ml-8">model: <span className="text-green-400">claude-sonnet-4-20250514</span></div>
              <div className="text-slate-300 ml-4 mt-2">fallback:</div>
              <div className="text-slate-400 ml-8">type: <span className="text-green-400">openai</span></div>
              <div className="text-slate-400 ml-8">api_key: <span className="text-purple-400">$&#123;OPENAI_API_KEY&#125;</span></div>
              <div className="text-slate-400 ml-8">model: <span className="text-green-400">gpt-4o</span></div>
              <div className="text-slate-500 ml-4 mt-2"># Add more providers as needed</div>
            </div>
          </div>
        </section>

        {/* Installation Package */}
        <section id="package" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Installation Package Contents</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 font-mono text-sm">
            <div className="text-yellow-400">quad-platform/</div>
            <div className="text-slate-400">├── <span className="text-green-400">docker-compose.yml</span>     <span className="text-slate-600"># All services orchestration</span></div>
            <div className="text-slate-400">├── <span className="text-green-400">.env.example</span>           <span className="text-slate-600"># Environment template</span></div>
            <div className="text-slate-400">├── <span className="text-green-400">quad-config.yaml</span>       <span className="text-slate-600"># QUAD configuration</span></div>
            <div className="text-slate-400">├── <span className="text-blue-400">services/</span></div>
            <div className="text-slate-400">│   ├── <span className="text-purple-400">quad-api/</span>         <span className="text-slate-600"># Backend API (Node.js)</span></div>
            <div className="text-slate-400">│   ├── <span className="text-purple-400">quad-web/</span>         <span className="text-slate-600"># Admin Dashboard (Next.js)</span></div>
            <div className="text-slate-400">│   ├── <span className="text-purple-400">quad-agents/</span>      <span className="text-slate-600"># AI Agent Runtime</span></div>
            <div className="text-slate-400">│   └── <span className="text-purple-400">quad-db/</span>          <span className="text-slate-600"># PostgreSQL + migrations</span></div>
            <div className="text-slate-400">├── <span className="text-blue-400">integrations/</span></div>
            <div className="text-slate-400">│   ├── <span className="text-cyan-400">jira-connector/</span>    <span className="text-slate-600"># Jira Cloud/Server</span></div>
            <div className="text-slate-400">│   ├── <span className="text-cyan-400">slack-connector/</span>   <span className="text-slate-600"># Slack App</span></div>
            <div className="text-slate-400">│   ├── <span className="text-cyan-400">github-connector/</span>  <span className="text-slate-600"># GitHub App</span></div>
            <div className="text-slate-400">│   ├── <span className="text-cyan-400">teams-connector/</span>   <span className="text-slate-600"># MS Teams</span></div>
            <div className="text-slate-400">│   └── <span className="text-cyan-400">email-connector/</span>   <span className="text-slate-600"># SMTP/SendGrid</span></div>
            <div className="text-slate-400">├── <span className="text-blue-400">helm/</span>                <span className="text-slate-600"># Kubernetes charts</span></div>
            <div className="text-slate-400">└── <span className="text-blue-400">docs/</span></div>
            <div className="text-slate-400">    ├── <span className="text-green-400">INSTALLATION.md</span></div>
            <div className="text-slate-400">    ├── <span className="text-green-400">CONFIGURATION.md</span></div>
            <div className="text-slate-400">    └── <span className="text-green-400">UPGRADING.md</span></div>
          </div>
        </section>

        {/* ACL & Permissions */}
        <section id="acl" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">ACL & Permissions Matrix</h2>
          <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400">Role</th>
                  <th className="px-4 py-3 text-center text-slate-400">Company</th>
                  <th className="px-4 py-3 text-center text-slate-400">Directors</th>
                  <th className="px-4 py-3 text-center text-slate-400">Projects</th>
                  <th className="px-4 py-3 text-center text-slate-400">Circles</th>
                  <th className="px-4 py-3 text-center text-slate-400">Agents</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "COMPANY_ADMIN", company: "✓ Admin", directors: "✓ Manage", projects: "✓ View All", circles: "✓ View All", agents: "✓ Configure" },
                  { role: "DIRECTOR", company: "View", directors: "Self", projects: "✓ Manage Own", circles: "✓ Assign Leads", agents: "✓ View" },
                  { role: "CIRCLE_LEAD", company: "—", directors: "View", projects: "View Assigned", circles: "✓ Manage Own", agents: "✓ Use" },
                  { role: "OPERATOR", company: "—", directors: "—", projects: "View Assigned", circles: "Work In", agents: "✓ Use" },
                  { role: "VIEWER", company: "—", directors: "—", projects: "View Only", circles: "View Only", agents: "—" },
                ].map((row, i) => (
                  <tr key={row.role} className={i % 2 === 0 ? "bg-slate-800/20" : ""}>
                    <td className="px-4 py-3 font-semibold text-white">{row.role}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.company}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.directors}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.projects}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.circles}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.agents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
              <h3 className="font-bold text-green-300 mb-2">Default ACL (New Employee)</h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Can view company directory</li>
                <li>• Can see available projects</li>
                <li>• Cannot access any project until assigned</li>
                <li>• Gets OPERATOR role when added to circle</li>
              </ul>
            </div>
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
              <h3 className="font-bold text-purple-300 mb-2">Inherited Permissions</h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Circle members inherit project view access</li>
                <li>• Circle leads inherit operator permissions</li>
                <li>• Directors inherit circle lead permissions</li>
                <li>• Admins have full access to everything</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-8 border border-blue-500/30 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Deploy QUAD?</h2>
            <p className="text-slate-400 mb-6">
              Choose your deployment method and transform how your organization builds software
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Download Self-Hosted
              </button>
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Start SaaS Trial
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
