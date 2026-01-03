import Link from "next/link";

export const metadata = {
  title: "QUAD vs Competitors - Feature & Pricing Comparison",
  description: "Compare QUAD Framework with Linear, Cursor, Devin, Bolt.new, Emergent, and other AI coding tools.",
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              QUAD vs Competitors
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            The only end-to-end agentic development platform: Requirement → Tickets → Code → Deploy
          </p>
        </div>

        {/* Key Insight */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="text-lg font-bold text-amber-400 mb-2">Key Insight</h3>
              <p className="text-slate-300">
                Competitors focus on either <strong>Project Management</strong> (Linear, Shortcut) OR <strong>AI Coding</strong> (Cursor, Copilot, Devin) OR <strong>Vibe Coding</strong> (Bolt.new, Lovable).
                <span className="text-amber-400 font-semibold"> QUAD bridges all three</span> with narrow-purpose AI agents and human-in-the-loop approvals.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Comparison */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Pricing Comparison</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* AI Coding Tools */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-blue-400 mb-4">AI Coding Tools</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">GitHub Copilot</span>
                  <span className="text-slate-300">$10-39/user</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cursor</span>
                  <span className="text-slate-300">$20-40/user</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Devin</span>
                  <span className="text-slate-300">$20-500/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Windsurf</span>
                  <span className="text-slate-300">$15-60/user</span>
                </div>
              </div>
            </div>

            {/* Vibe Coding */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-green-400 mb-4">Vibe Coding Platforms</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bolt.new</span>
                  <span className="text-slate-300">$20-200/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">v0.dev</span>
                  <span className="text-slate-300">$20-30/user</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lovable</span>
                  <span className="text-slate-300">$20-100/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergent</span>
                  <span className="text-slate-300">$20/mo credits</span>
                </div>
              </div>
            </div>

            {/* Project Management */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-purple-400 mb-4">Project Management</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Linear</span>
                  <span className="text-slate-300">$8-12/user</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shortcut</span>
                  <span className="text-slate-300">$10-16/user</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jira</span>
                  <span className="text-slate-300">$8-16/user</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Asana</span>
                  <span className="text-slate-300">$11-25/user</span>
                </div>
              </div>
            </div>
          </div>

          {/* QUAD Pricing */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/50 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">QUAD Framework</h3>
                <p className="text-slate-300">All features included. No hidden costs. No credit limits.</p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-4xl font-black text-green-400">$399/mo</div>
                <div className="text-sm text-slate-400">10 users, all features</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Matrix */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold border-b border-slate-700">Feature</th>
                  <th className="text-center py-4 px-3 text-slate-400 border-b border-slate-700">Linear</th>
                  <th className="text-center py-4 px-3 text-slate-400 border-b border-slate-700">Cursor</th>
                  <th className="text-center py-4 px-3 text-slate-400 border-b border-slate-700">Devin</th>
                  <th className="text-center py-4 px-3 text-slate-400 border-b border-slate-700">Bolt</th>
                  <th className="text-center py-4 px-3 text-slate-400 border-b border-slate-700">Emergent</th>
                  <th className="text-center py-4 px-3 text-green-400 font-bold border-b border-slate-700 bg-green-500/5">QUAD</th>
                </tr>
              </thead>
              <tbody>
                {/* Project Management */}
                <tr className="border-b border-slate-800 bg-slate-800/20">
                  <td colSpan={7} className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project Management</td>
                </tr>
                {[
                  { feature: "Ticket Management", linear: true, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                  { feature: "Sprint Planning", linear: true, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                  { feature: "Requirement → Tickets", linear: false, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                  { feature: "Burndown Charts", linear: true, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                    <td className="text-center py-3 px-3">{row.linear ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.cursor ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.devin ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.bolt ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.emergent ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3 bg-green-500/5">{row.quad ? <span className="text-green-400 font-bold">✓</span> : <span className="text-red-400">✗</span>}</td>
                  </tr>
                ))}

                {/* AI Coding */}
                <tr className="border-b border-slate-800 bg-slate-800/20">
                  <td colSpan={7} className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">AI Coding</td>
                </tr>
                {([
                  { feature: "Code Generation", linear: false, cursor: true, devin: true, bolt: true, emergent: true, quad: true },
                  { feature: "Code Review", linear: false, cursor: true, devin: true, bolt: false, emergent: false, quad: true },
                  { feature: "RAG Context", linear: false, cursor: true, devin: true, bolt: false, emergent: false, quad: true },
                  { feature: "Human-in-the-Loop", linear: "na", cursor: true, devin: "partial", bolt: "partial", emergent: "partial", quad: true },
                  { feature: "Confidence Scoring", linear: "na", cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                ] as Array<{ feature: string; linear: boolean | string; cursor: boolean | string; devin: boolean | string; bolt: boolean | string; emergent: boolean | string; quad: boolean }>).map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                    <td className="text-center py-3 px-3">{row.linear === "na" ? <span className="text-slate-500">N/A</span> : row.linear ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.cursor === "partial" ? <span className="text-yellow-400">~</span> : row.cursor ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.devin === "partial" ? <span className="text-yellow-400">~</span> : row.devin ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.bolt === "partial" ? <span className="text-yellow-400">~</span> : row.bolt ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.emergent === "partial" ? <span className="text-yellow-400">~</span> : row.emergent ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3 bg-green-500/5">{row.quad ? <span className="text-green-400 font-bold">✓</span> : <span className="text-red-400">✗</span>}</td>
                  </tr>
                ))}

                {/* Meetings */}
                <tr className="border-b border-slate-800 bg-slate-800/20">
                  <td colSpan={7} className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Meetings & Communication</td>
                </tr>
                {[
                  { feature: "Meeting → Tasks", linear: false, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                  { feature: "Transcript Processing", linear: false, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                  { feature: "AI Standup Summaries", linear: false, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                  { feature: "Slack Integration", linear: true, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                    <td className="text-center py-3 px-3">{row.linear ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.cursor ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.devin ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.bolt ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.emergent ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3 bg-green-500/5"><span className="text-green-400 font-bold">✓</span></td>
                  </tr>
                ))}

                {/* Deployment */}
                <tr className="border-b border-slate-800 bg-slate-800/20">
                  <td colSpan={7} className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deployment & DevOps</td>
                </tr>
                {[
                  { feature: "One-click Deploy", linear: false, cursor: false, devin: "partial", bolt: true, emergent: "partial", quad: true },
                  { feature: "Deployment Recipes", linear: false, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                  { feature: "Multi-env Support", linear: false, cursor: false, devin: false, bolt: "partial", emergent: false, quad: true },
                  { feature: "Rollback Support", linear: false, cursor: false, devin: false, bolt: false, emergent: false, quad: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                    <td className="text-center py-3 px-3">{row.linear ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.cursor ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.devin === "partial" ? <span className="text-yellow-400">~</span> : row.devin ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.bolt === "partial" ? <span className="text-yellow-400">~</span> : row.bolt ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3">{row.emergent === "partial" ? <span className="text-yellow-400">~</span> : row.emergent ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
                    <td className="text-center py-3 px-3 bg-green-500/5"><span className="text-green-400 font-bold">✓</span></td>
                  </tr>
                ))}

                {/* Database - QUAD Exclusive */}
                <tr className="border-b border-slate-800 bg-amber-500/10">
                  <td colSpan={7} className="py-2 px-4 text-xs font-bold text-amber-400 uppercase tracking-wider">Database Operations (QUAD Exclusive)</td>
                </tr>
                {[
                  { feature: "DB Copy Between Envs", quad: true },
                  { feature: "Data Anonymization", quad: true },
                  { feature: "Multi-stakeholder Approval", quad: true },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300">{row.feature}</td>
                    <td className="text-center py-3 px-3 text-red-400">✗</td>
                    <td className="text-center py-3 px-3 text-red-400">✗</td>
                    <td className="text-center py-3 px-3 text-red-400">✗</td>
                    <td className="text-center py-3 px-3 text-red-400">✗</td>
                    <td className="text-center py-3 px-3 text-red-400">✗</td>
                    <td className="text-center py-3 px-3 bg-green-500/5"><span className="text-green-400 font-bold">✓</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* QUAD Roadmap */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">QUAD Feature Roadmap</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Phase 1 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-bold">PHASE 1</span>
                <span className="text-sm text-slate-400">Q1 2026</span>
              </div>
              <h3 className="text-lg font-bold text-blue-400 mb-4">Foundation</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Requirements → Tickets</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Sprint Management</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Git Integration</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Deployment Recipes</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> DB Copy + Anonymize</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Meeting → Tasks</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> RAG Codebase Chat</li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">PHASE 2</span>
                <span className="text-sm text-slate-400">Q2-Q3 2026</span>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-4">Intelligence</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><span className="text-amber-400">⏳</span> Production Monitor Agent</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">⏳</span> Email → Ticket Agent</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">⏳</span> Slack → Ticket Agent</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">⏳</span> Velocity Analytics</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">⏳</span> Weekly Performance Email</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">⏳</span> Leaderboards & Badges</li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">PHASE 3</span>
                <span className="text-sm text-slate-400">Q4 2026+</span>
              </div>
              <h3 className="text-lg font-bold text-purple-400 mb-4">Autonomy</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><span className="text-slate-500">◯</span> Solution Architect Agent</li>
                <li className="flex items-center gap-2"><span className="text-slate-500">◯</span> Complexity Scoring</li>
                <li className="flex items-center gap-2"><span className="text-slate-500">◯</span> Impact Measurement</li>
                <li className="flex items-center gap-2"><span className="text-slate-500">◯</span> Cross-dept Comparison</li>
                <li className="flex items-center gap-2"><span className="text-slate-500">◯</span> Resource Forecasting</li>
                <li className="flex items-center gap-2"><span className="text-slate-500">◯</span> Risk Prediction</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cost Comparison */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Cost Comparison (10-User Startup)</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional Stack */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-red-500/30">
              <h3 className="text-lg font-bold text-red-400 mb-4">Traditional Stack</h3>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Linear (10 users × $12)</span>
                  <span className="text-slate-300">$120/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cursor (5 devs × $40)</span>
                  <span className="text-slate-300">$200/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Otter.ai (3 managers × $20)</span>
                  <span className="text-slate-300">$60/mo</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-3">
                  <span className="text-white font-semibold">Subtotal</span>
                  <span className="text-white font-semibold">$380/mo</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>+ Engineering time (20hrs × $100/hr)</span>
                  <span>+$2,000/mo</span>
                </div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">~$2,380/mo</div>
                <div className="text-xs text-slate-400">Total with hidden costs</div>
              </div>
            </div>

            {/* QUAD Stack */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-xl p-6 border-2 border-green-500/50">
              <h3 className="text-lg font-bold text-green-400 mb-4">QUAD Stack</h3>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">QUAD Startup (10 users)</span>
                  <span className="text-slate-300">$399/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Otter.ai (users own accounts)</span>
                  <span className="text-green-400">$0/mo</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-3">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-white font-semibold">$399/mo</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Engineering time saved</span>
                  <span>~20 hrs/mo</span>
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">$399/mo</div>
                <div className="text-xs text-slate-400">All-inclusive, no hidden costs</div>
              </div>
            </div>
          </div>

          {/* Annual Savings */}
          <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/30 text-center">
            <div className="text-3xl font-bold text-amber-400 mb-2">~$24,000/year saved</div>
            <div className="text-slate-400">When factoring in engineering time and tool consolidation</div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Try QUAD?</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            See QUAD in action with our interactive demo and case studies across 5 domains.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/demo"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Try Demo
            </Link>
            <Link
              href="/case-study"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              View Case Studies
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600"
            >
              ← Back to Home
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
