"use client";

import PageNavigation from "@/components/PageNavigation";
import TermWithLens from "@/components/TermWithLens";

export default function QUADDetails() {
  const sections = [
    { id: "dimensions", title: "2 Dimensions" },
    { id: "resources", title: "Shared/Dedicated" },
    { id: "org-structure", title: "Org Structure" },
    { id: "enabling", title: "Enabling Teams" },
    { id: "hierarchy", title: "Hierarchy Rules" },
    { id: "class-object", title: "Class-Object" },
    { id: "estimation", title: "Estimation" },
    { id: "workload", title: "Workload Tracking" },
    { id: "flow-doc", title: "Flow Doc" },
    { id: "source-truth", title: "Source of Truth" },
  ];

  return (
    <div className="min-h-screen text-white">
      <PageNavigation sections={sections} />
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📋</span>
            <h1 className="text-4xl font-bold">Technical Details</h1>
          </div>
          <p className="text-slate-400">
            Deep-dive into QUAD implementation: Agent patterns, flow docs, hierarchy rules
          </p>
        </div>

        {/* The 2 Dimensions */}
        <section id="dimensions" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">The 2 Dimensions: Business + Technical</h2>
          <p className="text-slate-400 mb-6">
            Every circle operates along two axes: <strong className="text-white">Business</strong> (understanding requirements, stakeholders, value) and <strong className="text-white">Technical</strong> (code, systems, infrastructure). The B/T ratio defines each circle&apos;s focus.
          </p>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Business Dimension */}
              <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold">B</div>
                  <h3 className="text-xl font-bold text-blue-300">Business Dimension</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>• Understanding stakeholder needs</li>
                  <li>• Translating requirements to specs</li>
                  <li>• Prioritization and value assessment</li>
                  <li>• User experience and workflows</li>
                  <li>• Communication with non-technical teams</li>
                </ul>
              </div>

              {/* Technical Dimension */}
              <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-300 font-bold">T</div>
                  <h3 className="text-xl font-bold text-green-300">Technical Dimension</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>• Writing and reviewing code</li>
                  <li>• System architecture decisions</li>
                  <li>• Database design and optimization</li>
                  <li>• Infrastructure and DevOps</li>
                  <li>• Performance and security</li>
                </ul>
              </div>
            </div>
          </div>

          {/* B/T Ratios by Circle */}
          <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-xl p-6 border border-slate-700">
            <h3 className="font-bold text-white mb-4 text-center">B/T Ratios by Circle</h3>
            <div className="space-y-4">
              {[
                { circle: "Management", circleNum: 1, b: 80, t: 20, color: "blue", desc: "Heavy business focus - requirements, stakeholders, planning" },
                { circle: "Development", circleNum: 2, b: 30, t: 70, color: "green", desc: "Mostly technical - coding, but understanding business context" },
                { circle: "QA", circleNum: 3, b: 30, t: 70, color: "yellow", desc: "Technical testing, but understanding business acceptance" },
                { circle: "Infrastructure", circleNum: 4, b: 20, t: 80, color: "purple", desc: "Highly technical - DevOps, cloud, databases" },
              ].map((item) => (
                <div key={item.circle} className="flex items-center gap-4">
                  <div className={`w-24 text-sm font-bold text-${item.color}-300`}>
                    <TermWithLens term={`Circle ${item.circleNum}`}>{item.circle}</TermWithLens>
                  </div>
                  <div className="flex-1">
                    <div className="flex h-6 rounded-full overflow-hidden">
                      <div className="bg-blue-500/50 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${item.b}%` }}>
                        B {item.b}%
                      </div>
                      <div className="bg-green-500/50 flex items-center justify-center text-xs text-white font-medium" style={{ width: `${item.t}%` }}>
                        T {item.t}%
                      </div>
                    </div>
                  </div>
                  <div className="w-64 text-xs text-slate-500 hidden lg:block">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shared vs Dedicated Resources */}
        <section id="resources" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Shared vs Dedicated Resources</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">MORE DEDICATED</span>
              <span className="text-sm text-slate-400">MORE SHARED</span>
            </div>
            <div className="h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-4"></div>
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              {[
                { name: "Management", circleNum: 1, mode: "Dedicated", desc: "per project", color: "blue" },
                { name: "Development", circleNum: 2, mode: "Mostly Dedicated", desc: "can share", color: "green" },
                { name: "QA", circleNum: 3, mode: "Mostly Shared", desc: "across projects", color: "yellow" },
                { name: "Infrastructure", circleNum: 4, mode: "Always Shared", desc: "across directors", color: "purple" },
              ].map((circle) => (
                <div key={circle.name} className={`bg-${circle.color}-500/10 rounded-lg p-3 border border-${circle.color}-500/20`}>
                  <div className="font-bold text-white">
                    <TermWithLens term={`Circle ${circle.circleNum}`}>{circle.name}</TermWithLens>
                  </div>
                  <div className="text-xs text-slate-500">Circle</div>
                  <div className={`text-${circle.color}-300 text-xs mt-2 font-medium`}>{circle.mode}</div>
                  <div className="text-xs text-slate-500">{circle.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Organizational Structure */}
        <section id="org-structure" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Organizational Structure</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <div className="text-center mb-6">
              <div className="inline-block bg-purple-500/20 rounded-lg px-6 py-3 border border-purple-500/30">
                <div className="text-lg font-bold text-purple-300">GROUP</div>
                <div className="text-xs text-slate-400">(e.g., Wealth Management)</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {["Director A", "Director B", "Director C"].map((dir) => (
                <div key={dir} className="text-center">
                  <div className="bg-blue-500/20 rounded-lg px-4 py-2 border border-blue-500/30 mb-2">
                    <div className="font-bold text-blue-300">{dir}</div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="bg-slate-700/50 rounded px-2 py-1">Project 1</div>
                    <div className="bg-slate-700/50 rounded px-2 py-1">Project 2</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="text-center text-xs text-slate-500 mb-3">SHARED RESOURCES</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                  <div className="text-sm font-bold text-purple-300">
                    <TermWithLens term="Circle 4">Infrastructure</TermWithLens> Circle
                  </div>
                  <div className="text-xs text-slate-500">ALWAYS SHARED</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                  <div className="text-sm font-bold text-yellow-300">
                    <TermWithLens term="Circle 3">QA</TermWithLens> Circle
                  </div>
                  <div className="text-xs text-slate-500">USUALLY SHARED</div>
                </div>
                <div className="bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
                  <div className="text-sm font-bold text-slate-300">Enabling Teams</div>
                  <div className="text-xs text-slate-500">OPTIONAL</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enabling Teams */}
        <section id="enabling" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Enabling Teams (Optional)</h2>
          <p className="text-slate-400 mb-6">
            Enabling Teams are <strong className="text-white">NOT</strong> counted as QUAD Circles. They are optional support groups that provide specialized expertise across ALL 4 circles.
          </p>

          {/* Core Teams */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-green-300">3 Core Enabling Teams (Almost Always Needed)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  num: 1,
                  name: "Architecture Group",
                  roles: ["Solution Architect", "Domain Architect", "Database Architect", "Cloud Architect"],
                  agent: "Design Agent",
                  agentDesc: "Reviews PRs for architecture violations, suggests patterns",
                  when: "Large systems, microservices, complex integrations",
                  color: "blue",
                },
                {
                  num: 2,
                  name: "Security Team",
                  roles: ["Security Engineer", "Pen Tester"],
                  agent: "Security Scanner Agent",
                  agentDesc: "SAST/DAST scans, vulnerability detection, dependency audit",
                  when: "Any production app, especially with user data",
                  color: "red",
                },
                {
                  num: 3,
                  name: "Compliance Team",
                  roles: ["Compliance Officer", "Auditor"],
                  agent: "Compliance Checker Agent",
                  agentDesc: "Policy validation, audit trail generation, data handling checks",
                  when: "HIPAA, SOC2, GDPR, PCI-DSS regulated industries",
                  color: "orange",
                },
              ].map((team) => (
                <div key={team.num} className={`bg-${team.color}-500/10 rounded-xl p-5 border border-${team.color}-500/20`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full bg-${team.color}-500/20 flex items-center justify-center text-${team.color}-300 font-bold text-sm`}>
                      {team.num}
                    </div>
                    <h4 className="font-bold text-white">{team.name}</h4>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-slate-500 mb-1">ROLES</div>
                    <div className="flex flex-wrap gap-1">
                      {team.roles.map((role) => (
                        <span key={role} className="px-2 py-0.5 bg-slate-600/30 text-slate-300 rounded text-xs">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-slate-500 mb-1">AI AGENT</div>
                    <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                      <div className="font-semibold text-green-300 text-sm">{team.agent}</div>
                      <div className="text-xs text-slate-400">{team.agentDesc}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="text-slate-400">When needed:</span> {team.when}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extended Teams */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-purple-300">4 Extended Enabling Teams (Add Based on Project Type)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  num: 4,
                  name: "Data/Analytics Team",
                  roles: ["Data Engineer", "Data Scientist", "BI Analyst"],
                  agent: "Analytics Agent",
                  agentDesc: "ETL monitoring, query optimization, anomaly detection",
                  when: "ML features, dashboards, data pipelines, reporting",
                  color: "cyan",
                },
                {
                  num: 5,
                  name: "UX/Design Team",
                  roles: ["UX Designer", "UI Designer", "UX Researcher"],
                  agent: "Design System Agent",
                  agentDesc: "Component consistency, accessibility validation, design tokens",
                  when: "Consumer apps, complex workflows, brand consistency",
                  color: "pink",
                },
                {
                  num: 6,
                  name: "Platform/Tools Team",
                  roles: ["Platform Engineer", "DX Engineer"],
                  agent: "Tooling Agent",
                  agentDesc: "CI/CD optimization, developer experience metrics, build performance",
                  when: "Large orgs, internal developer tools, CI/CD standards",
                  color: "indigo",
                },
                {
                  num: 7,
                  name: "Accessibility Team",
                  roles: ["A11y Specialist", "A11y Tester"],
                  agent: "A11y Scanner Agent",
                  agentDesc: "WCAG compliance scanning, screen reader testing, color contrast",
                  when: "Government contracts, public apps (WCAG/ADA/Section 508)",
                  color: "teal",
                },
              ].map((team) => (
                <div key={team.num} className={`bg-${team.color}-500/10 rounded-xl p-5 border border-${team.color}-500/20`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full bg-${team.color}-500/20 flex items-center justify-center text-${team.color}-300 font-bold text-sm`}>
                      {team.num}
                    </div>
                    <h4 className="font-bold text-white">{team.name}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">ROLES</div>
                      <div className="flex flex-wrap gap-1">
                        {team.roles.map((role) => (
                          <span key={role} className="px-2 py-0.5 bg-slate-600/30 text-slate-300 rounded text-xs">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">AI AGENT</div>
                      <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                        <div className="font-semibold text-green-300 text-xs">{team.agent}</div>
                        <div className="text-xs text-slate-400">{team.agentDesc}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    <span className="text-slate-400">When needed:</span> {team.when}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Points */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <h4 className="font-bold text-white mb-4">Key Points</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {[
                { icon: "⚙️", text: "Enabling Teams are OPTIONAL - Not every project needs them" },
                { icon: "🔄", text: "Support ALL 4 Circles - They don't belong to one circle" },
                { icon: "🤝", text: "Always SHARED - Across all directors/projects (like Infra Circle)" },
                { icon: "🤖", text: "Each has AI Agent(s) - Automation for repetitive checks" },
                { icon: "📊", text: "Core vs Extended - Start with Core 3, add Extended as needed" },
              ].map((point) => (
                <div key={point.text} className="flex items-start gap-3">
                  <span className="text-xl">{point.icon}</span>
                  <span className="text-slate-400">{point.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hierarchy Rules */}
        <section id="hierarchy" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Hierarchy Rules</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <div className="space-y-2">
              {[
                { level: "BASE RULES", desc: "QUAD Platform - Universal do's and don'ts", color: "purple" },
                { level: "COMPANY-WIDE", desc: "Entity/Org level policies", color: "blue" },
                { level: "DIRECTOR", desc: "Program/Portfolio level", color: "green" },
                { level: "TECH LEAD", desc: "Team level", color: "yellow" },
                { level: "TEAM MEMBER", desc: "Personal preferences", color: "orange" },
              ].map((rule, i) => (
                <div key={rule.level} className={`bg-${rule.color}-500/10 rounded-lg p-3 border border-${rule.color}-500/20`}>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">Level {i + 1}</div>
                    <div className={`font-bold text-${rule.color}-300`}>{rule.level}</div>
                    <div className="text-xs text-slate-400 ml-auto">{rule.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">
              Each level can ADD restrictions, never CONTRADICT upper levels
            </p>
          </div>

          {/* Example Rules */}
          <div className="mt-6 bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <h3 className="font-bold text-white mb-4">Example Rules</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left pb-2">Level</th>
                  <th className="text-left pb-2">Example Rule</th>
                </tr>
              </thead>
              <tbody className="text-slate-400">
                <tr><td className="py-1 text-purple-300">Base Rules</td><td>&quot;Never commit secrets to Git&quot;</td></tr>
                <tr><td className="py-1 text-blue-300">Company-wide</td><td>&quot;All PRs require 2 reviewers&quot;</td></tr>
                <tr><td className="py-1 text-green-300">Director</td><td>&quot;Use Java 21 only for this program&quot;</td></tr>
                <tr><td className="py-1 text-yellow-300">Tech Lead</td><td>&quot;Follow our naming conventions&quot;</td></tr>
                <tr><td className="py-1 text-orange-300">Team Member</td><td>&quot;I prefer dark mode in IDE&quot;</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Agent Class-Object Pattern */}
        <section id="class-object" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Agent Class-Object Pattern</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="font-bold text-slate-400 mb-3">CLASS (Template)</h3>
                <div className="space-y-2 text-sm">
                  <div className="text-white">Story Agent (Template)</div>
                  <ul className="text-slate-500 space-y-1">
                    <li>- Capabilities defined</li>
                    <li>- Base rules configured</li>
                    <li>- No connection yet</li>
                    <li>- &quot;Ready&quot; state</li>
                  </ul>
                </div>
                <div className="mt-4 text-xs text-red-400">Cannot execute tasks</div>
              </div>

              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                <h3 className="font-bold text-green-300 mb-3">OBJECT (Instance)</h3>
                <div className="space-y-2 text-sm">
                  <div className="text-white">Your Story Agent</div>
                  <ul className="text-slate-400 space-y-1">
                    <li>- Connected to platform</li>
                    <li>- App password set</li>
                    <li>- Local machine context</li>
                    <li>- User-specific rules</li>
                  </ul>
                </div>
                <div className="mt-4 text-xs text-green-400">Can execute tasks</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="text-4xl mb-2">→</div>
              <div className="text-sm text-slate-400">assign + setup = object</div>
            </div>
          </div>
        </section>

        {/* Estimation Agent Pipeline */}
        <section id="estimation" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Estimation Agent Pipeline</h2>
          <p className="text-slate-400 mb-6">
            The Estimation Agent is unique - it orchestrates multiple agents in a <strong className="text-white">sequential pipeline</strong> to produce accurate, confidence-based estimates.
          </p>

          {/* Pipeline Flow */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 mb-6">
            <div className="flex items-center justify-between overflow-x-auto pb-4">
              {[
                { name: "Code Agent", icon: "💻", analyzes: "Files, components, complexity" },
                { name: "DB Agent", icon: "🗄️", analyzes: "Tables, migrations, queries" },
                { name: "Flow Agent", icon: "📊", analyzes: "Screens, APIs, integrations" },
                { name: "Estimation Agent", icon: "🎯", analyzes: "Aggregates all, final estimate" },
              ].map((agent, i) => (
                <div key={agent.name} className="flex items-center">
                  <div className="text-center min-w-[120px]">
                    <div className="w-14 h-14 mx-auto rounded-full bg-green-500/20 flex items-center justify-center text-2xl mb-2 border border-green-500/30">
                      {agent.icon}
                    </div>
                    <div className="text-xs font-medium text-white">{agent.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{agent.analyzes}</div>
                  </div>
                  {i < 3 && (
                    <div className="text-green-400 mx-3 text-xl">→</div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">
              <strong className="text-slate-400">Pluggable Design:</strong> Agents can be added/removed (e.g., add Security Agent, remove DB Agent if no DB changes)
            </p>
          </div>

          {/* Confidence Calculation */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/20">
              <h3 className="font-bold text-red-300 mb-4">Confidence Deductions</h3>
              <div className="space-y-2 text-sm">
                {[
                  { factor: "High code complexity (>50 files)", value: "-15%" },
                  { factor: "Database migration required", value: "-10%" },
                  { factor: "External API integration", value: "-10%" },
                  { factor: "New technology/framework", value: "-15%" },
                  { factor: "Cross-team dependency", value: "-10%" },
                  { factor: "Unclear requirements", value: "-20%" },
                  { factor: "No similar past stories", value: "-10%" },
                ].map((item) => (
                  <div key={item.factor} className="flex justify-between">
                    <span className="text-slate-400">{item.factor}</span>
                    <span className="text-red-400 font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/20">
              <h3 className="font-bold text-green-300 mb-4">Confidence Additions</h3>
              <div className="space-y-2 text-sm">
                {[
                  { factor: "Similar story completed before", value: "+10%" },
                  { factor: "High test coverage in area", value: "+5%" },
                  { factor: "Clear requirements", value: "+5%" },
                  { factor: "Same developer did similar", value: "+5%" },
                ].map((item) => (
                  <div key={item.factor} className="flex justify-between">
                    <span className="text-slate-400">{item.factor}</span>
                    <span className="text-green-400 font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-green-500/20">
                <div className="text-xs text-slate-500">
                  <strong className="text-white">Formula:</strong> 90% base + additions - deductions
                </div>
                <div className="text-xs text-slate-500">Range: 30% (min) to 95% (max)</div>
              </div>
            </div>
          </div>

          {/* Output Example */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden mb-6">
            <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700">
              <span className="text-green-300 text-sm font-bold">ESTIMATION RESULT</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <div className="text-xs text-slate-500">COMPLEXITY</div>
                  <div className="text-lg font-bold text-blue-300">Octahedron (8)</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <div className="text-xs text-slate-500">CONFIDENCE</div>
                  <div className="text-lg font-bold text-green-300">78%</div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                  <div className="text-xs text-slate-500">EFFORT</div>
                  <div className="text-lg font-bold text-purple-300">5-6 days</div>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-2">BREAKDOWN BY AGENT</div>
                <div className="space-y-1 text-sm text-slate-400">
                  <div>• <span className="text-white">Code Agent:</span> 3 files, 2 components, medium complexity</div>
                  <div>• <span className="text-white">DB Agent:</span> 1 new column (user_preferences.theme)</div>
                  <div>• <span className="text-white">Flow Agent:</span> 2 screens affected, 1 API endpoint</div>
                </div>
              </div>

              <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                <div className="text-xs text-yellow-300 mb-2">⚠️ RISKS</div>
                <div className="space-y-1 text-sm text-slate-400">
                  <div>• CSS variable system not standardized</div>
                  <div>• No existing theme context in app</div>
                </div>
              </div>
            </div>
          </div>

          {/* Human Override */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
            <h3 className="font-bold text-white mb-4">Human Override with AI Learning</h3>
            <div className="grid md:grid-cols-5 gap-3 text-center text-sm">
              {[
                { step: "1", title: "AI Presents", desc: "Complexity: 8, Confidence: 78%" },
                { step: "2", title: "Human Reviews", desc: "[Accept] or [Override]" },
                { step: "3", title: "Override", desc: "Human: 6, Reason: 'Done before'" },
                { step: "4", title: "Story Done", desc: "Actual: 5 days" },
                { step: "5", title: "AI Learns", desc: "Human was closer! Adjusting..." },
              ].map((item, i) => (
                <div key={item.step} className="relative">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="w-6 h-6 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-xs font-bold mb-2">
                      {item.step}
                    </div>
                    <div className="font-medium text-white text-xs">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                  </div>
                  {i < 4 && (
                    <div className="absolute top-1/2 -right-2 text-slate-600 hidden md:block">→</div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Override requires a reason (tracked for retrospectives). AI adjusts models based on who was more accurate.
            </p>
          </div>
        </section>

        {/* Workload Tracking */}
        <section id="workload" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-amber-300">Workload Tracking</h2>
          <p className="text-slate-400 mb-6">
            QUAD tracks three key metrics to identify bottlenecks, skill gaps, and performance patterns.
          </p>

          {/* Three Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/20">
              <div className="text-3xl mb-2">📥</div>
              <h3 className="font-bold text-blue-300 mb-2">Assignments</h3>
              <p className="text-sm text-slate-400 mb-3">
                Work assigned to a team member. Measures workload distribution.
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Story points assigned</li>
                <li>• Tasks per cycle</li>
                <li>• Queue depth</li>
              </ul>
            </div>

            <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/20">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-bold text-green-300 mb-2">Completes</h3>
              <p className="text-sm text-slate-400 mb-3">
                Work finished by a team member. Measures throughput.
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Tasks completed</li>
                <li>• On-time delivery rate</li>
                <li>• Quality score (rework %)</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/20">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-bold text-purple-300 mb-2">Output</h3>
              <p className="text-sm text-slate-400 mb-3">
                Value delivered. Measures effectiveness.
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Features shipped</li>
                <li>• Customer impact</li>
                <li>• Business value score</li>
              </ul>
            </div>
          </div>

          {/* Root Cause Analysis */}
          <div className="bg-amber-500/10 rounded-xl p-6 border border-amber-500/20 mb-6">
            <h3 className="font-bold text-amber-300 mb-4">Root Cause Analysis</h3>
            <p className="text-sm text-slate-400 mb-4">
              When gaps emerge between assignments and completes, QUAD identifies root causes:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { cause: "Skill Gap", symptom: "Low completion in specific areas", action: "Training or pair programming" },
                { cause: "Overload", symptom: "High assignments, low completes", action: "Redistribute workload" },
                { cause: "Blockers", symptom: "Tasks stuck in progress", action: "Identify and remove blockers" },
                { cause: "Scope Creep", symptom: "Tasks taking longer than estimated", action: "Better requirements, smaller stories" },
              ].map((item) => (
                <div key={item.cause} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="font-semibold text-white text-sm mb-1">{item.cause}</div>
                  <div className="text-xs text-slate-400 mb-1">Symptom: {item.symptom}</div>
                  <div className="text-xs text-amber-300">Action: {item.action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fast Performer Identification */}
          <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
            <h3 className="font-bold text-green-300 mb-4">Fast Performer Identification</h3>
            <p className="text-sm text-slate-400 mb-4">
              QUAD identifies team members who consistently exceed expectations:
            </p>
            <div className="flex items-center gap-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-xl">⭐</div>
              <div className="flex-1">
                <div className="font-semibold text-white">Fast Performer Criteria</div>
                <ul className="text-xs text-slate-400 mt-1 space-y-1">
                  <li>• Completes &gt; Assignments (ahead of schedule)</li>
                  <li>• Low rework rate (&lt;5%)</li>
                  <li>• High quality score (peer reviews)</li>
                  <li>• Consistent across 3+ cycles</li>
                </ul>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Benefits</div>
                <div className="text-sm text-green-300">Higher complexity tasks</div>
                <div className="text-sm text-green-300">Mentorship opportunities</div>
              </div>
            </div>
          </div>
        </section>

        {/* Flow Document Template */}
        <section id="flow-doc" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Flow Document Template</h2>
          <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700">
              <code className="text-green-300 text-sm"># FLOW: [Feature Name]</code>
            </div>
            <div className="p-4 font-mono text-sm text-slate-400 space-y-4">
              <div>
                <div className="text-slate-500">## Overview</div>
                <div>| Field        | Value                    |</div>
                <div>| Flow ID      | FLOW_XXX_001             |</div>
                <div>| Owner        | Management Circle (BA/PM/TL) |</div>
                <div>| Status       | Draft / Active / Retired |</div>
              </div>
              <div>
                <div className="text-slate-500">## Step 1: [Action Name]</div>
                <div className="ml-4">### UI</div>
                <div className="ml-4">| Element | Type | Validation |</div>
                <div className="ml-4">### API</div>
                <div className="ml-4 text-green-400">POST /api/endpoint</div>
                <div className="ml-4">### Database</div>
                <div className="ml-4 text-yellow-400">SELECT * FROM table</div>
                <div className="ml-4">### Test Cases</div>
                <div className="ml-4">| TC001 | Happy path | 200 |</div>
              </div>
            </div>
          </div>
        </section>

        {/* One Source of Truth */}
        <section id="source-truth" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">One Source of Truth Architecture</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <div className="text-center mb-6">
              <div className="inline-block bg-purple-500/20 rounded-lg px-6 py-3 border border-purple-500/30">
                <div className="text-lg font-bold text-purple-300">GIT REPOSITORY</div>
                <div className="text-xs text-slate-400">(Version Controlled)</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {["/docs/flows/", "/src/code", "/tests/specs"].map((path) => (
                <div key={path} className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <code className="text-sm text-green-300">{path}</code>
                </div>
              ))}
            </div>

            <div className="text-center mb-6">
              <div className="text-2xl">↓</div>
            </div>

            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 text-center mb-6">
              <div className="font-bold text-blue-300">QUAD WEB APP</div>
              <div className="text-xs text-slate-400 mt-1">Flow viewer, API browser, DB schema, AI chat (RAG), Test dashboard</div>
            </div>

            <div className="text-center mb-6">
              <div className="text-2xl">↓</div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {["Confluence (sync)", "Jira (sync)", "Swagger (auto)"].map((tool) => (
                <div key={tool} className="bg-slate-700/50 rounded-lg p-3 text-center text-sm text-slate-400">
                  {tool}
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-500 mt-4 text-center">
              All tools sync FROM Git (single source). Never edit in Confluence directly.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
