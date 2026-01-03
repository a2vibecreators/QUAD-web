"use client";

import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

export default function QUADSummary() {
  const sections = [
    { id: "executive", title: "Executive Summary" },
    { id: "numbers", title: "Key Numbers" },
    { id: "circles", title: "4 Circles" },
    { id: "principles", title: "Core Principles" },
    { id: "benefits", title: "Benefits" },
    { id: "when", title: "When to Use" },
  ];

  return (
    <div className="min-h-screen text-white">
      <PageNavigation sections={sections} />
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📝</span>
            <h1 className="text-4xl font-bold">QUAD Summary</h1>
          </div>
          <p className="text-slate-400">
            High-level overview for executives and quick reference (2-3 minute read)
          </p>
        </div>

        {/* Executive Summary */}
        <section id="executive" className="mb-12 scroll-mt-32">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-8 border border-blue-500/20">
            <h2 className="text-2xl font-bold mb-4 text-center">Executive Summary</h2>
            <p className="text-lg text-slate-300 text-center max-w-2xl mx-auto">
              <strong className="text-white">QUAD</strong> (Quick Unified Agentic Development) is a modern software development methodology
              that replaces traditional Agile/Scrum with <strong className="text-blue-300">AI-powered automation</strong>,
              <strong className="text-green-300"> documentation-first practices</strong>, and
              <strong className="text-purple-300"> four functional circles</strong>.
            </p>
          </div>
        </section>

        {/* Key Numbers */}
        <section id="numbers" className="mb-12 scroll-mt-32">
          <h2 className="text-xl font-bold mb-6 text-center">Key Numbers</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { num: "4", label: "Circles", desc: "Functional teams" },
              { num: "5", label: "Agents/Circle", desc: "AI assistants" },
              { num: "1", label: "Month Cycles", desc: "Not 2-week sprints" },
              { num: "90%", label: "Less Meetings", desc: "AI handles coordination" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                <div className="text-3xl font-black text-blue-400">{stat.num}</div>
                <div className="font-semibold text-white text-sm">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* The 4 Circles - Simplified */}
        <section id="circles" className="mb-12 scroll-mt-32">
          <h2 className="text-xl font-bold mb-6">The 4 Circles</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: 1, name: "Management", key: "Requirements → Stories → Docs", mode: "Dedicated", color: "blue" },
              { num: 2, name: "Development", key: "Code → Review → Merge", mode: "Mostly Dedicated", color: "green" },
              { num: 3, name: "QA", key: "Test → Automate → Validate", mode: "Mostly Shared", color: "yellow" },
              { num: 4, name: "Infrastructure", key: "Build → Deploy → Monitor", mode: "Always Shared", color: "purple" },
            ].map((c) => (
              <div key={c.num} className={`bg-${c.color}-500/10 rounded-xl p-4 border border-${c.color}-500/20`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-${c.color}-500/20 flex items-center justify-center text-${c.color}-300 font-bold text-sm`}>
                      {c.num}
                    </div>
                    <h3 className="font-bold text-white">{c.name} Circle</h3>
                  </div>
                  <span className={`text-xs text-${c.color}-300`}>{c.mode}</span>
                </div>
                <p className="text-sm text-slate-400">{c.key}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Principles */}
        <section id="principles" className="mb-12 scroll-mt-32">
          <h2 className="text-xl font-bold mb-6">Core Principles</h2>
          <div className="space-y-4">
            {[
              { icon: "🤖", title: "AI-First", desc: "AI agents handle repetitive tasks: story expansion, code scaffolding, test generation, deployment" },
              { icon: "📚", title: "Docs-First", desc: "Documentation written BEFORE code. Flow documents define UI, API, DB, and test cases." },
              { icon: "🔄", title: "Monthly Cycles", desc: "4-week cycles instead of 2-week sprints. Less context switching, more flow time." },
              { icon: "🚫", title: "No Daily Standups", desc: "AI Scheduling Agent replaces daily meetings. Optional weekly 'Pulse' for blockers." },
              { icon: "☁️", title: "One Source of Truth", desc: "Git is the source. Confluence/Jira sync FROM Git. Never edit docs directly in wikis." },
            ].map((principle) => (
              <div key={principle.title} className="flex items-start gap-4 bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="text-2xl">{principle.icon}</div>
                <div>
                  <h3 className="font-bold text-white">{principle.title}</h3>
                  <p className="text-sm text-slate-400">{principle.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="mb-12 scroll-mt-32">
          <h2 className="text-xl font-bold mb-6">Benefits</h2>
          <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { metric: "Onboarding time", before: "2-4 weeks", after: "3-5 days", improvement: "75% faster" },
                { metric: "'Where is X?' questions", before: "10+/day", after: "Near zero", improvement: "90% reduction" },
                { metric: "QA test case creation", before: "2 hours/feature", after: "Auto-generated", improvement: "80% faster" },
                { metric: "Knowledge transfer", before: "Meetings + shadowing", after: "Read the flow", improvement: "70% faster" },
              ].map((b) => (
                <div key={b.metric} className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-sm font-semibold text-white">{b.metric}</div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-red-400 line-through">{b.before}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-green-400">{b.after}</span>
                  </div>
                  <div className="text-xs text-blue-300 mt-1">{b.improvement}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* When to Use QUAD */}
        <section id="when" className="mb-12 scroll-mt-32">
          <h2 className="text-xl font-bold mb-6">When to Use QUAD</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
              <h3 className="font-bold text-green-300 mb-3">Good Fit</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Teams building new products</li>
                <li>• Organizations adopting AI tools</li>
                <li>• Projects needing better documentation</li>
                <li>• Teams with meeting fatigue</li>
                <li>• Startups wanting to move fast</li>
              </ul>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
              <h3 className="font-bold text-red-300 mb-3">May Not Fit</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Teams resistant to AI adoption</li>
                <li>• Organizations with strict process compliance</li>
                <li>• Projects with no documentation tolerance</li>
                <li>• Very small teams (1-2 people)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Getting Started</h2>
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <div className="grid grid-cols-4 gap-4">
              {[
                { week: "Week 1-2", action: "Story Agent", focus: "AI-enhanced requirements" },
                { week: "Week 3-4", action: "+ Dev Agent", focus: "AI code scaffolding" },
                { week: "Week 5-6", action: "+ Test Agents", focus: "Automated testing" },
                { week: "Week 7+", action: "Full Pipeline", focus: "End-to-end automation" },
              ].map((phase) => (
                <div key={phase.week} className="text-center">
                  <div className="text-xs text-slate-500">{phase.week}</div>
                  <div className="text-blue-300 font-semibold">{phase.action}</div>
                  <div className="text-xs text-slate-400 mt-1">{phase.focus}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12">
          <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20 text-center">
            <h2 className="text-xl font-bold mb-3">Want to Learn More?</h2>
            <p className="text-slate-400 mb-4 text-sm">
              Read the full QUAD documentation for complete details
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/concept" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Main Concept
              </Link>
              <Link href="/details" className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                Technical Details
              </Link>
              <Link href="/case-study" className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                Case Study
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
