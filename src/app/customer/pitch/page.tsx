"use client";

import Link from "next/link";

export default function CustomerPitch() {
  return (
    <div className="text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
            Pitch Deck
          </div>
          <h1 className="text-4xl font-bold mb-4">
            QUAD Platform for Enterprise
          </h1>
          <p className="text-slate-400">
            45-minute presentation: 15 min slides + 20 min demo + 10 min Q&A
          </p>
        </div>

        {/* Slide Navigation */}
        <div className="grid gap-6">
          {/* Executive Summary */}
          <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">
                1
              </div>
              <h2 className="text-2xl font-bold">Executive Summary</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-red-400 mb-3">The Problem</h3>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>• Traditional Agile = Waterfall in disguise</li>
                  <li>• 6-9 weeks from requirements to deployment</li>
                  <li>• 30-40% rework rate</li>
                  <li>• Developer burnout (nights/weekends)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-green-400 mb-3">QUAD Solution</h3>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>• 2-8 hours from requirements to QA-ready</li>
                  <li>• 5-10% rework rate</li>
                  <li>• Work-life balance restored</li>
                  <li>• $4.8M annual savings (200 devs)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Channelized AI Energy */}
          <section className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-8 border border-yellow-500/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-400 font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold">Channelized AI Energy</h2>
            </div>
            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                Today&apos;s AI coding assistants have incredible power - <span className="text-yellow-400 font-mono">Agent Rules</span>, <span className="text-yellow-400 font-mono">Commands</span>, <span className="text-yellow-400 font-mono">Skills</span>, <span className="text-yellow-400 font-mono">RAG</span>, <span className="text-yellow-400 font-mono">AST</span>, <span className="text-yellow-400 font-mono">ADK</span> - but it&apos;s scattered.
              </p>
              <p className="text-slate-400 text-sm italic">
                Developers send raw HTTP requests to AI, hoping for the best. Result? Hallucinations. Wrong syntax. Made-up file paths.
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
              <p className="text-center text-lg">
                Think of AI like <span className="text-yellow-400 font-bold">electricity</span> - raw electricity is dangerous. Through proper wiring, it powers your home safely.
              </p>
              <p className="text-center text-2xl font-bold mt-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                QUAD is the wiring.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { before: "Random AI responses", after: "Predictable output" },
                { before: "Hallucinated paths", after: "Real codebase refs" },
                { before: "Syntax errors", after: "AST-verified code" },
                { before: "Context confusion", after: "Smart memory" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-red-400 text-xs line-through mb-1">{item.before}</div>
                  <div className="text-green-400 text-sm font-bold">{item.after}</div>
                </div>
              ))}
            </div>
          </section>

          {/* The QUAD Model */}
          <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">
                3
              </div>
              <h2 className="text-2xl font-bold">The QUAD Model</h2>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { letter: "Q", name: "Question", desc: "What needs to be built?" },
                { letter: "U", name: "Understand", desc: "AI expands to spec" },
                { letter: "A", name: "Automate", desc: "AI generates code" },
                { letter: "D", name: "Deliver", desc: "Human validates & ships" },
              ].map((step, i) => (
                <div key={i} className="bg-slate-700/50 rounded-xl p-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                    {step.letter}
                  </div>
                  <div className="font-bold text-white">{step.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{step.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Competitive Advantage */}
          <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">
                4
              </div>
              <h2 className="text-2xl font-bold">Why QUAD vs Competitors</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Feature</th>
                    <th className="text-center py-3 px-4 text-blue-400">QUAD</th>
                    <th className="text-center py-3 px-4 text-slate-500">Copilot</th>
                    <th className="text-center py-3 px-4 text-slate-500">Cursor</th>
                    <th className="text-center py-3 px-4 text-slate-500">Devin</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4">Full SDLC Coverage</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-yellow-400">~</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4">BYOK (Your AI Keys)</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-red-400">✗</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4">Self-Hosted Option</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-red-400">✗</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4">Meeting → Code</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-red-400">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Enterprise SSO</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-green-400">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Customership Proposal */}
          <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">
                5
              </div>
              <h2 className="text-2xl font-bold">Customership Proposal</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="font-bold text-blue-400 mb-3">Pilot Program</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>• 4-week proof of concept</li>
                  <li>• 1 team, 1 project</li>
                  <li>• $0 commitment</li>
                  <li>• Clear success metrics</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="font-bold text-green-400 mb-3">Rollout</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>• Department-wide deployment</li>
                  <li>• Custom agent templates</li>
                  <li>• Training & onboarding</li>
                  <li>• $399/mo (MATRIX tier)</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="font-bold text-purple-400 mb-3">Strategic</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>• Exclusive insurance rights</li>
                  <li>• White-label for customers</li>
                  <li>• Co-development roadmap</li>
                  <li>• Revenue share model</li>
                </ul>
              </div>
            </div>
          </section>

          {/* The Ask */}
          <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 font-bold">
                6
              </div>
              <h2 className="text-2xl font-bold">The Ask</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">4</div>
                <div className="text-slate-400">Weeks</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">1</div>
                <div className="text-slate-400">Team</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">$0</div>
                <div className="text-slate-400">Commitment</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/customer/contact"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
              >
                Start Pilot Program
              </Link>
            </div>
          </section>
        </div>

        {/* Download Full Deck */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 mb-4">
            Want the full presentation deck?
          </p>
          <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all">
            Download PDF (Coming Soon)
          </button>
        </div>

        {/* Next Step Navigation */}
        <div className="mt-16 pt-12 border-t border-slate-700">
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
              Next Step
            </div>
            <h2 className="text-2xl font-bold mb-4">See the Platform Demo</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-8">
              Experience the QUAD Platform with your organization name and pre-configured demo data.
            </p>
            <Link
              href="/customer/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
            >
              Try Platform Demo
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
