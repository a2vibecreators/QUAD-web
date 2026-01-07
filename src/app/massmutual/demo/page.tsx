"use client";

import Link from "next/link";

/**
 * MassMutual Demo Page
 *
 * Features list documented in: /documentation/massmutual/FEATURES.md
 * This page shows demo scenarios - detailed features are in the features doc.
 */
export default function MassMutualDemo() {
  return (
    <div className="text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
            Interactive Demo
          </div>
          <h1 className="text-4xl font-bold mb-4">
            QUAD Platform in Action
          </h1>
          <p className="text-slate-400">
            See how AI agents transform your development workflow
          </p>
        </div>

        {/* Key Demos */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Live Dashboard */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-xl font-bold mb-2 text-blue-300">
              Live Dashboard Preview
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Real-time visibility into flows, AI agent activity, and team performance. We&apos;ll configure this for MassMutual&apos;s tech stack during the demo.
            </p>
            <div className="text-blue-400/60 text-sm">
              Available in personalized demo
            </div>
          </div>

          {/* AI Workflow */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-bold mb-2 text-green-300">
              AI Agent Workflow
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              See how AI agents handle the Q→U→A→D flow: from requirement to production in hours, not weeks.
            </p>
            <div className="text-green-400/60 text-sm">
              Available in personalized demo
            </div>
          </div>
        </div>

        {/* Demo Scenarios */}
        <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-12">
          <h2 className="text-2xl font-bold mb-6">Demo Scenarios</h2>
          <div className="space-y-4">
            {[
              {
                title: "Scenario 1: Feature Request → Production",
                desc: "Watch a 1-paragraph feature request become production-ready code in 4 hours",
                time: "15 min demo",
                status: "Ready",
              },
              {
                title: "Scenario 2: Bug Report → Fix → Deploy",
                desc: "See how AI agents diagnose, fix, and deploy a bug without developer intervention",
                time: "10 min demo",
                status: "Ready",
              },
              {
                title: "Scenario 3: Meeting → Tickets → Code",
                desc: "From a 30-minute standup to executed work items, all AI-driven",
                time: "20 min demo",
                status: "Coming Soon",
              },
              {
                title: "Scenario 4: Compliance Audit",
                desc: "AI generates SOC 2 compliance reports automatically",
                time: "10 min demo",
                status: "Coming Soon",
              },
            ].map((scenario, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-white">{scenario.title}</h3>
                  <p className="text-sm text-slate-400">{scenario.desc}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xs text-slate-500">{scenario.time}</div>
                  <div
                    className={`text-xs mt-1 ${
                      scenario.status === "Ready"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {scenario.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Video Placeholder */}
        <section className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center mb-12">
          <div className="text-6xl mb-6">🎬</div>
          <h2 className="text-2xl font-bold mb-4">Video Walkthrough</h2>
          <p className="text-slate-400 mb-6">
            Coming Soon: Full 20-minute video demo of QUAD Platform
          </p>
          <button className="px-6 py-3 bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed">
            Video Not Available Yet
          </button>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Want a Personalized Demo?</h2>
          <p className="text-slate-400 mb-6">
            We&apos;ll tailor the demo to MassMutual&apos;s specific tech stack and workflows.
          </p>
          <Link
            href="/massmutual/contact"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
          >
            Schedule Personalized Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
