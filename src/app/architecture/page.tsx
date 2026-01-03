"use client";

import PageNavigation from "@/components/PageNavigation";

export default function QUADArchitecture() {
  const sections = [
    { id: "gateway", title: "Single Gateway" },
    { id: "patterns", title: "Communication Patterns" },
    { id: "permissions", title: "Permission System" },
    { id: "invocation", title: "Who Can Invoke" },
  ];

  return (
    <div className="min-h-screen text-white">
      <PageNavigation sections={sections} />
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏗️</span>
            <h1 className="text-4xl font-bold">Agent Architecture</h1>
          </div>
          <p className="text-slate-400">
            QUAD Agent Communication Architecture (QACA) - How agents talk to each other
          </p>
        </div>

        {/* Overview Card - Visual Gateway */}
        <section id="gateway" className="mb-12 scroll-mt-32">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-blue-500/20">
            <h2 className="text-2xl font-bold mb-4 text-center">The Single Gateway</h2>
            <p className="text-slate-300 text-center max-w-2xl mx-auto mb-8">
              All agent invocations go through the <strong className="text-blue-300">QUAD Agent Runtime (QAR)</strong>.
              Whether triggered by IDE, CLI, Chat, or CI/CD - QAR enforces permissions and routes to the right agent.
            </p>

            {/* Visual Gateway Diagram */}
            <div className="relative">
              {/* Entry Points */}
              <div className="flex justify-center gap-4 mb-6">
                {[
                  { name: "IDE", icon: "💻", desc: "VSCode" },
                  { name: "CLI", icon: "⌨️", desc: "Terminal" },
                  { name: "Chat", icon: "💬", desc: "Claude" },
                  { name: "Auto", icon: "🔄", desc: "CI/CD" },
                  { name: "MCP", icon: "🔌", desc: "Desktop" },
                ].map((entry) => (
                  <div key={entry.name} className="w-20 text-center">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-slate-800/50 border border-slate-600 flex items-center justify-center text-2xl mb-2 hover:bg-slate-700/50 transition-colors">
                      {entry.icon}
                    </div>
                    <div className="text-xs font-semibold text-white">{entry.name}</div>
                    <div className="text-xs text-slate-500">{entry.desc}</div>
                  </div>
                ))}
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center mb-4">
                <div className="text-slate-500 text-2xl">↓</div>
              </div>

              {/* QAR Box */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border-2 border-blue-500/30 mb-6">
                <div className="text-center mb-4">
                  <span className="px-4 py-1 bg-blue-500/30 rounded-full text-blue-200 text-sm font-semibold">QUAD Agent Runtime (QAR)</span>
                </div>

                {/* Permission Checker */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700">
                  <div className="text-center text-sm font-semibold text-yellow-300 mb-2">🔒 Permission Checker</div>
                  <div className="flex justify-center gap-4 text-xs text-slate-400">
                    <span>• Who is invoking?</span>
                    <span>• Can they invoke?</span>
                    <span>• Audit everything</span>
                  </div>
                </div>

                {/* Three Components */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 text-center">
                    <div className="text-2xl mb-2">📋</div>
                    <div className="text-sm font-semibold text-blue-300">Orchestrator</div>
                    <div className="text-xs text-slate-400">Sequential</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 text-center">
                    <div className="text-2xl mb-2">📡</div>
                    <div className="text-sm font-semibold text-green-300">Event Bus</div>
                    <div className="text-xs text-slate-400">Parallel</div>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20 text-center">
                    <div className="text-2xl mb-2">🗄️</div>
                    <div className="text-sm font-semibold text-purple-300">Shared Context</div>
                    <div className="text-xs text-slate-400">State</div>
                  </div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center mb-4">
                <div className="text-slate-500 text-2xl">↓</div>
              </div>

              {/* Agent Pool */}
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                <div className="text-center text-sm font-semibold text-slate-300 mb-4">Agent Pool</div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { circle: 1, name: "MGMT", agents: ["Story", "Estimation"], color: "blue" },
                    { circle: 2, name: "DEV", agents: ["Dev UI", "Dev API"], color: "green" },
                    { circle: 3, name: "QA", agents: ["Test", "Perf"], color: "yellow" },
                    { circle: 4, name: "INFRA", agents: ["Deploy DEV", "Deploy PROD"], color: "purple" },
                  ].map((c) => (
                    <div key={c.circle} className={`bg-${c.color}-500/10 rounded-lg p-3 border border-${c.color}-500/20`}>
                      <div className={`text-xs font-semibold text-${c.color}-300 mb-2`}>Circle {c.circle}: {c.name}</div>
                      <div className="space-y-1">
                        {c.agents.map((a) => (
                          <div key={a} className="text-xs text-slate-400 bg-slate-900/30 rounded px-2 py-1">{a}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Communication Patterns */}
        <section id="patterns" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Three Communication Patterns</h2>

          <div className="space-y-8">
            {/* Pattern 1: Sequential */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-xl font-bold">1</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Sequential (Orchestrator)</h3>
                  <p className="text-sm text-slate-400">For: Estimation Pipeline, Code Review Chain</p>
                </div>
              </div>

              {/* Visual Pipeline */}
              <div className="flex items-center justify-center gap-2 mb-4 overflow-x-auto py-4">
                {[
                  { name: "Code Agent", output: "code_score", color: "blue" },
                  { name: "DB Agent", output: "db_score", color: "green" },
                  { name: "Flow Agent", output: "flow_score", color: "yellow" },
                  { name: "Estimation", output: "final_estimate", color: "purple" },
                ].map((agent, i) => (
                  <div key={agent.name} className="flex items-center">
                    <div className={`bg-${agent.color}-500/20 rounded-xl p-4 border border-${agent.color}-500/30 text-center min-w-[120px]`}>
                      <div className="text-sm font-semibold text-white mb-2">{agent.name}</div>
                      <div className={`text-xs text-${agent.color}-300 bg-slate-900/30 rounded px-2 py-1`}>
                        → {agent.output}
                      </div>
                    </div>
                    {i < 3 && <div className="text-2xl text-slate-500 mx-2">→</div>}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Output → Input chaining</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Order enforced</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Each agent waits</span>
              </div>
            </div>

            {/* Pattern 2: Parallel */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-300 text-xl font-bold">2</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Parallel (Event Bus)</h3>
                  <p className="text-sm text-slate-400">For: Development Phase (UI + API simultaneously)</p>
                </div>
              </div>

              {/* Visual Parallel */}
              <div className="flex flex-col items-center">
                {/* Event */}
                <div className="px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30 text-yellow-300 text-sm mb-4">
                  📡 Story Assigned Event
                </div>

                {/* Split Arrow */}
                <div className="flex items-center gap-8 mb-4">
                  <div className="text-2xl text-slate-500">↙</div>
                  <div className="text-2xl text-slate-500">↘</div>
                </div>

                {/* Two Agents */}
                <div className="flex gap-8 mb-4">
                  <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 text-center w-40">
                    <div className="text-lg mb-2">🎨</div>
                    <div className="font-semibold text-white mb-2">Dev Agent UI</div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div>Components</div>
                      <div>Interfaces</div>
                      <div>UI Tests</div>
                    </div>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 text-center w-40">
                    <div className="text-lg mb-2">⚙️</div>
                    <div className="font-semibold text-white mb-2">Dev Agent API</div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div>Controllers</div>
                      <div>Services</div>
                      <div>DTOs</div>
                    </div>
                  </div>
                </div>

                {/* Merge Arrow */}
                <div className="flex items-center gap-8 mb-4">
                  <div className="text-2xl text-slate-500">↘</div>
                  <div className="text-2xl text-slate-500">↙</div>
                </div>

                {/* Complete Event */}
                <div className="px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30 text-green-300 text-sm">
                  ✅ Both Complete Event
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-center mt-6">
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Run simultaneously</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Async pub/sub</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Independent work</span>
              </div>
            </div>

            {/* Pattern 3: Hybrid */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-xl font-bold">3</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hybrid (Stages)</h3>
                  <p className="text-sm text-slate-400">For: Full Development Pipeline</p>
                </div>
              </div>

              {/* Visual Stages */}
              <div className="space-y-4">
                {[
                  {
                    name: "STAGE 1: DEV",
                    agents: [
                      { name: "Dev Agent UI", icon: "🎨" },
                      { name: "Dev Agent API", icon: "⚙️" }
                    ],
                    mode: "PARALLEL",
                    color: "green"
                  },
                  {
                    name: "STAGE 2: TEST",
                    agents: [
                      { name: "Test Agent UI", icon: "🧪" },
                      { name: "Test Agent API", icon: "🔬" }
                    ],
                    mode: "PARALLEL",
                    color: "yellow"
                  },
                  {
                    name: "STAGE 3: REVIEW",
                    agents: [
                      { name: "Review Agent", icon: "📝" }
                    ],
                    mode: "SEQUENTIAL",
                    color: "purple"
                  },
                ].map((stage, i) => (
                  <div key={stage.name}>
                    <div className={`bg-${stage.color}-500/10 rounded-xl p-4 border border-${stage.color}-500/20`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-semibold text-${stage.color}-300`}>{stage.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full bg-${stage.color}-500/20 text-${stage.color}-200`}>
                          {stage.mode}
                        </span>
                      </div>
                      <div className="flex justify-center gap-4">
                        {stage.agents.map((agent) => (
                          <div key={agent.name} className="bg-slate-900/30 rounded-lg px-4 py-2 flex items-center gap-2">
                            <span>{agent.icon}</span>
                            <span className="text-sm text-white">{agent.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {i < 2 && (
                      <div className="flex justify-center py-2">
                        <div className="text-slate-500 text-sm">↓ wait for all</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap justify-center mt-6">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Stages are sequential</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Within stage: parallel</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Best of both</span>
              </div>
            </div>
          </div>
        </section>

        {/* Permission System */}
        <section id="permissions" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Permission System</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Permission Levels */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold text-white mb-4">Permission Levels</h3>
              <div className="space-y-3">
                {[
                  { level: 0, name: "NONE", icon: "❌", desc: "Cannot access", color: "red" },
                  { level: 1, name: "READ", icon: "👁️", desc: "Read-only", color: "yellow" },
                  { level: 2, name: "SUGGEST", icon: "💡", desc: "Can suggest, human OK", color: "blue" },
                  { level: 3, name: "WRITE", icon: "✏️", desc: "Can modify (audited)", color: "green" },
                  { level: 4, name: "ADMIN", icon: "👑", desc: "Full access (rare)", color: "purple" },
                ].map((p) => (
                  <div key={p.level} className={`flex items-center gap-3 bg-${p.color}-500/10 rounded-lg p-3 border border-${p.color}-500/20`}>
                    <span className="text-lg w-8">{p.icon}</span>
                    <div className="flex-1">
                      <div className={`font-semibold text-${p.color}-300`}>Level {p.level}: {p.name}</div>
                      <div className="text-xs text-slate-400">{p.desc}</div>
                    </div>
                    <div className="w-16 bg-slate-900/50 rounded h-2">
                      <div className={`h-full rounded bg-${p.color}-500`} style={{ width: `${(p.level + 1) * 20}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Example Permissions */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold text-white mb-4">Example: Dev Agent UI</h3>
              <div className="space-y-2">
                {[
                  { resource: "src/ui/**", level: "WRITE", icon: "✅", color: "green" },
                  { resource: "src/components/**", level: "WRITE", icon: "✅", color: "green" },
                  { resource: "src/api/**", level: "READ", icon: "👁️", color: "yellow" },
                  { resource: "database/**", level: "NONE", icon: "❌", color: "red" },
                  { resource: "tests/ui/**", level: "SUGGEST", icon: "💡", color: "blue" },
                ].map((row) => (
                  <div key={row.resource} className="flex items-center justify-between bg-slate-900/30 rounded-lg px-4 py-2">
                    <span className="text-sm text-slate-300 font-mono">{row.resource}</span>
                    <span className={`px-2 py-0.5 text-xs rounded bg-${row.color}-500/20 text-${row.color}-300`}>
                      {row.icon} {row.level}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-300 font-semibold mb-1">
                  <span className="text-lg">🔒</span>
                  <span>Critical Rule</span>
                </div>
                <div className="text-sm text-slate-400">No agent can invoke Deploy PROD directly!</div>
                <div className="text-sm text-slate-400">Only humans can trigger production deployment.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Invocation Matrix */}
        <section id="invocation" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Who Can Invoke Whom</h2>

          <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400">Agent</th>
                  <th className="px-4 py-3 text-left text-green-300">✅ Can Invoke</th>
                  <th className="px-4 py-3 text-left text-red-300">❌ Cannot</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { agent: "Story Agent", can: ["Estimation Agent"], cannot: ["Deploy PROD"] },
                  { agent: "Dev Agent UI", can: ["Test Agent", "Review"], cannot: ["Deploy PROD", "Dev API"] },
                  { agent: "Dev Agent API", can: ["Test Agent", "Review"], cannot: ["Deploy PROD", "Dev UI"] },
                  { agent: "Test Agent", can: ["Review Agent"], cannot: ["Deploy PROD"] },
                  { agent: "Deploy DEV", can: [], cannot: ["Deploy PROD"] },
                  { agent: "Deploy PROD", can: [], cannot: [] },
                ].map((row, i) => (
                  <tr key={row.agent} className={i % 2 === 0 ? "bg-slate-800/20" : ""}>
                    <td className="px-4 py-3 text-white font-medium">{row.agent}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.can.length > 0 ? row.can.map((a) => (
                          <span key={a} className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">{a}</span>
                        )) : <span className="text-slate-500 text-xs">(terminal agent)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.cannot.map((a) => (
                          <span key={a} className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">{a}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20">
            <h2 className="text-xl font-bold mb-6 text-center">Key Takeaways</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: "🚪", title: "Single Gateway", desc: "QAR is the ONLY way to invoke agents" },
                { icon: "🔒", title: "Permissions First", desc: "Checked BEFORE and AFTER every action" },
                { icon: "📝", title: "Full Audit", desc: "Every action logged for compliance" },
                { icon: "👤", title: "Human in Loop", desc: "PROD deployment requires approval" },
                { icon: "⚙️", title: "Configurable", desc: "YAML config per project" },
                { icon: "🔄", title: "Flexible", desc: "Sequential, Parallel, or Hybrid" },
              ].map((item) => (
                <div key={item.title} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="font-semibold text-white mb-1">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
