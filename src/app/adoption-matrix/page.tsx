"use client";

import { useState } from "react";
import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

// 3x3 Matrix zones
const matrix3x3 = [
  // Row 1: Expert
  { skill: "Expert", trust: "Low", name: "Cautious Expert", color: "blue", buffer: 30, desc: "High skills but skeptical. Needs proof before trusting AI." },
  { skill: "Expert", trust: "Medium", name: "Balanced Expert", color: "purple", buffer: 20, desc: "Confident user who verifies AI output selectively." },
  { skill: "Expert", trust: "High", name: "AI Champion", color: "green", buffer: 10, desc: "Full AI integration. Minimal buffers, maximum efficiency." },
  // Row 2: Intermediate
  { skill: "Intermediate", trust: "Low", name: "Skeptical User", color: "yellow", buffer: 50, desc: "Learning AI but doesn't trust it yet. High buffer needed." },
  { skill: "Intermediate", trust: "Medium", name: "Growing User", color: "blue", buffer: 40, desc: "Building confidence. Good balance of verification." },
  { skill: "Intermediate", trust: "High", name: "Eager Adopter", color: "purple", buffer: 25, desc: "Enthusiastic about AI. May need guidance on verification." },
  // Row 3: Beginner
  { skill: "Beginner", trust: "Low", name: "AI Skeptic", color: "red", buffer: 80, desc: "New to AI and doesn't trust it. Maximum protection needed." },
  { skill: "Beginner", trust: "Medium", name: "Curious Novice", color: "yellow", buffer: 60, desc: "Open to AI but lacks experience. Guided approach." },
  { skill: "Beginner", trust: "High", name: "Trusting Novice", color: "blue", buffer: 45, desc: "Trusts AI but needs skill building. Moderate buffer." },
];

// Safety buffer formulas
const bufferFormulas = [
  {
    name: "Linear Decay",
    formula: "buffer = 80 - (skill × 10 + trust × 10)",
    desc: "Simple linear reduction as skills and trust increase.",
    example: "Expert + High Trust = 80 - (30 + 30) = 20%"
  },
  {
    name: "Exponential Decay",
    formula: "buffer = 80 × (0.7 ^ (skill + trust))",
    desc: "Faster decay for advanced users, slower for beginners.",
    example: "Expert + High Trust = 80 × 0.7^6 ≈ 9%"
  },
  {
    name: "Configurable Minimum",
    formula: "buffer = max(minBuffer, calculated)",
    desc: "Never go below a minimum buffer (e.g., 5%) for safety.",
    example: "Even AI Champions get at least 5% buffer"
  },
];

export default function AdoptionMatrixPage() {
  const [selectedZone, setSelectedZone] = useState<typeof matrix3x3[0] | null>(null);

  const sections = [
    { id: "intro", title: "Introduction" },
    { id: "matrix", title: "3×3 Matrix" },
    { id: "zones", title: "Zone Details" },
    { id: "buffer", title: "Safety Buffers" },
    { id: "journey", title: "Your Journey" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation sections={sections} />

      <div className="max-w-5xl mx-auto p-8">
        {/* Hero */}
        <section id="intro" className="text-center mb-12 scroll-mt-20">
          <div className="inline-block px-4 py-1 bg-amber-500/20 rounded-full text-amber-300 text-sm font-medium mb-4">
            Adoption Matrix
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Track Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              AI Journey
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Position yourself on the matrix based on AI skill level and trust level.
            Understand your safety buffer and growth path.
          </p>
        </section>

        {/* 3x3 Matrix */}
        <section id="matrix" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">QUAD Adoption Matrix (3×3)</h2>
          <p className="text-slate-400 mb-6">
            Click on any zone to see details. Your position determines your safety buffer percentage.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            {/* Y-axis label */}
            <div className="flex">
              <div className="w-24 flex flex-col justify-center items-center pr-4">
                <span className="text-sm text-slate-500 transform -rotate-90 whitespace-nowrap">AI Skill Level →</span>
              </div>

              <div className="flex-1">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div></div>
                  <div className="text-center text-sm text-slate-400 py-2">Low Trust</div>
                  <div className="text-center text-sm text-slate-400 py-2">Medium Trust</div>
                  <div className="text-center text-sm text-slate-400 py-2">High Trust</div>
                </div>

                {/* Expert row */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="flex items-center justify-end pr-2 text-sm text-slate-400">Expert</div>
                  {matrix3x3.slice(0, 3).map((zone) => (
                    <button
                      key={zone.name}
                      onClick={() => setSelectedZone(zone)}
                      className={`p-3 rounded-lg text-center transition-all hover:scale-105 border ${
                        selectedZone?.name === zone.name
                          ? `bg-${zone.color}-500/30 border-${zone.color}-400`
                          : `bg-${zone.color}-500/10 border-${zone.color}-500/20 hover:border-${zone.color}-400/50`
                      }`}
                    >
                      <div className={`text-sm font-semibold text-${zone.color}-300`}>{zone.name}</div>
                      <div className="text-xs text-slate-500">{zone.buffer}% buffer</div>
                    </button>
                  ))}
                </div>

                {/* Intermediate row */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="flex items-center justify-end pr-2 text-sm text-slate-400">Intermediate</div>
                  {matrix3x3.slice(3, 6).map((zone) => (
                    <button
                      key={zone.name}
                      onClick={() => setSelectedZone(zone)}
                      className={`p-3 rounded-lg text-center transition-all hover:scale-105 border ${
                        selectedZone?.name === zone.name
                          ? `bg-${zone.color}-500/30 border-${zone.color}-400`
                          : `bg-${zone.color}-500/10 border-${zone.color}-500/20 hover:border-${zone.color}-400/50`
                      }`}
                    >
                      <div className={`text-sm font-semibold text-${zone.color}-300`}>{zone.name}</div>
                      <div className="text-xs text-slate-500">{zone.buffer}% buffer</div>
                    </button>
                  ))}
                </div>

                {/* Beginner row */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex items-center justify-end pr-2 text-sm text-slate-400">Beginner</div>
                  {matrix3x3.slice(6, 9).map((zone) => (
                    <button
                      key={zone.name}
                      onClick={() => setSelectedZone(zone)}
                      className={`p-3 rounded-lg text-center transition-all hover:scale-105 border ${
                        selectedZone?.name === zone.name
                          ? `bg-${zone.color}-500/30 border-${zone.color}-400`
                          : `bg-${zone.color}-500/10 border-${zone.color}-500/20 hover:border-${zone.color}-400/50`
                      }`}
                    >
                      <div className={`text-sm font-semibold text-${zone.color}-300`}>{zone.name}</div>
                      <div className="text-xs text-slate-500">{zone.buffer}% buffer</div>
                    </button>
                  ))}
                </div>

                {/* X-axis label */}
                <div className="text-center text-sm text-slate-500 mt-4">Trust Level →</div>
              </div>
            </div>
          </div>

          {/* Selected Zone Detail */}
          {selectedZone && (
            <div className={`mt-6 bg-${selectedZone.color}-500/10 rounded-xl p-6 border border-${selectedZone.color}-500/20`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold text-${selectedZone.color}-300`}>{selectedZone.name}</h3>
                  <p className="text-sm text-slate-400">
                    {selectedZone.skill} Skill • {selectedZone.trust} Trust
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-black text-${selectedZone.color}-400`}>{selectedZone.buffer}%</div>
                  <div className="text-xs text-slate-500">Safety Buffer</div>
                </div>
              </div>
              <p className="text-slate-300">{selectedZone.desc}</p>
            </div>
          )}
        </section>

        {/* Zone Details */}
        <section id="zones" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">All Zones Explained</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {matrix3x3.map((zone) => (
              <div
                key={zone.name}
                className={`bg-${zone.color}-500/10 rounded-xl p-4 border border-${zone.color}-500/20`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-${zone.color}-300`}>{zone.name}</h3>
                  <span className={`text-sm font-mono text-${zone.color}-400`}>{zone.buffer}%</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  {zone.skill} • {zone.trust} Trust
                </p>
                <p className="text-sm text-slate-300">{zone.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Buffer System */}
        <section id="buffer" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">Safety Buffer System</h2>
          <p className="text-slate-400 mb-6">
            AI-generated estimates include a safety buffer that decreases as trust and skill increase.
            This builds confidence gradually while protecting against over-reliance.
          </p>

          <div className="space-y-4">
            {bufferFormulas.map((formula) => (
              <div key={formula.name} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <h3 className="font-bold text-amber-300 mb-2">{formula.name}</h3>
                <code className="block bg-slate-900/50 rounded p-3 text-sm text-green-400 font-mono mb-2">
                  {formula.formula}
                </code>
                <p className="text-sm text-slate-400 mb-2">{formula.desc}</p>
                <p className="text-xs text-slate-500">Example: {formula.example}</p>
              </div>
            ))}
          </div>

          {/* Buffer Visualization */}
          <div className="mt-8 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10 rounded-xl p-6 border border-amber-500/20">
            <h3 className="font-bold text-white mb-4 text-center">Buffer Reduction Journey</h3>
            <div className="flex items-end justify-between h-32 gap-4">
              {[
                { zone: "AI Skeptic", buffer: 80, color: "red" },
                { zone: "Curious Novice", buffer: 60, color: "yellow" },
                { zone: "Growing User", buffer: 40, color: "blue" },
                { zone: "Balanced Expert", buffer: 20, color: "purple" },
                { zone: "AI Champion", buffer: 10, color: "green" },
              ].map((item) => (
                <div key={item.zone} className="flex-1 text-center">
                  <div
                    className={`bg-${item.color}-500/50 rounded-t-lg mx-auto max-w-[60px]`}
                    style={{ height: `${item.buffer}%` }}
                  />
                  <div className="text-xs text-slate-400 mt-2">{item.zone}</div>
                  <div className={`text-sm font-bold text-${item.color}-400`}>{item.buffer}%</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Your Journey */}
        <section id="journey" className="mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-6">Your Growth Path</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Skill Growth */}
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20">
              <h3 className="font-bold text-blue-300 mb-4">Increase AI Skill</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">→</span>
                  Complete AI prompt engineering tutorials
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">→</span>
                  Practice with QUAD agents on non-critical tasks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">→</span>
                  Learn to verify and improve AI outputs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">→</span>
                  Understand AI limitations and failure modes
                </li>
              </ul>
            </div>

            {/* Trust Growth */}
            <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
              <h3 className="font-bold text-green-300 mb-4">Build AI Trust</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">→</span>
                  Start with low-stakes tasks and verify results
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">→</span>
                  Track AI accuracy over time (our system does this)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">→</span>
                  Gradually reduce manual verification
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">→</span>
                  Celebrate AI wins, learn from AI failures
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-8 border border-amber-500/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Configure your QUAD environment and see where you fall on the adoption matrix.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/configure"
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Configure QUAD
            </Link>
            <Link
              href="/concept"
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
