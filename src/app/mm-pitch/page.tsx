"use client";

import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

export default function MMPitch() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation />
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-4">
            Enterprise Technical Pitch
          </div>
          <h1 className="text-4xl font-bold mb-4">
            QUAD for MassMutual
          </h1>
          <p className="text-xl text-slate-400">
            A technical pitch for directors who already have Claude Business and want to maximize AI-assisted development.
          </p>
        </div>

        {/* The Opportunity */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-green-400 mb-6">The Opportunity</h2>
          <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
            <p className="text-lg mb-4">
              <strong className="text-white">MassMutual already has Claude Business.</strong> You&apos;re paying for agentic AI capabilities, but are you using them systematically?
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-yellow-300 mb-2">Current State (Likely)</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>- Developers use Claude ad-hoc for code help</li>
                  <li>- No standardized prompts or workflows</li>
                  <li>- AI output quality varies by person</li>
                  <li>- No metrics on AI productivity gains</li>
                  <li>- Knowledge stays in individual heads</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-green-300 mb-2">With QUAD</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>+ AI agents with defined roles (Story, Dev, Test)</li>
                  <li>+ Standardized prompts in Flow Documents</li>
                  <li>+ Consistent quality via Human Gates</li>
                  <li>+ Measurable productivity metrics</li>
                  <li>+ Knowledge captured in documentation</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Implementation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-blue-400 mb-6">Technical Implementation Path</h2>
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300">1</span>
                Week 1: JIRA Workflow Configuration
              </h3>
              <p className="text-slate-400 mb-3">
                Configure JIRA project with QUAD workflow states. No new tools needed - just workflow customization.
              </p>
              <pre className="bg-slate-900 rounded-lg p-4 text-sm text-green-300 overflow-x-auto">
{`Backlog → In Analysis → Ready for Dev → In Development → In QA → Ready for Deploy → Done
           ↑                    ↑              ↑                ↑
      Story Agent          Dev Agent      Test Agent      Deploy Agent
      (Claude)             (Claude)       (Claude)        (Claude)`}
              </pre>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300">2</span>
                Week 2: Flow Document Templates
              </h3>
              <p className="text-slate-400 mb-3">
                Create standardized prompts for each agent. These become your &quot;AI playbook&quot;.
              </p>
              <pre className="bg-slate-900 rounded-lg p-4 text-sm text-green-300 overflow-x-auto">
{`# Story Agent Prompt Template
You are expanding a user story for [PROJECT_NAME].

Given this story: {story_description}

Generate:
1. Acceptance criteria (Given/When/Then)
2. Edge cases to consider
3. Technical dependencies
4. Estimated complexity (1-13 Fibonacci)

Output as JIRA-compatible markdown.`}
              </pre>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300">3</span>
                Week 3: Pilot Project
              </h3>
              <p className="text-slate-400">
                Select a low-risk feature. Run it through the QUAD flow with one team. Measure:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-300">Time from story to code (baseline vs QUAD)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-300">Lines of code generated vs written manually</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-300">Test coverage achieved</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-slate-300">Bugs found in QA (fewer = better specs)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Honest Cons - The Reality Check */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-red-400 mb-6">Honest Cons - The Reality Check</h2>
          <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20 mb-6">
            <p className="text-lg text-red-300 mb-4">
              Let&apos;s be brutally honest about the challenges:
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                con: "It Might Just Stay a Dream",
                reality: "Many methodologies get proposed, piloted, then abandoned. QUAD could end up as a PowerPoint that never gets implemented.",
                mitigation: "Start SMALL. One team, one project, 4 weeks. If it doesn't show measurable improvement, kill it. No company-wide rollout until proven.",
                risk: "HIGH",
              },
              {
                con: "Developer Resistance",
                reality: "Senior devs may see AI assistance as a threat or dismiss it as 'not production quality'. Some will actively resist.",
                mitigation: "Position AI as 'copilot not autopilot'. Human Gates mean devs ALWAYS approve. Show them it handles the boring stuff (boilerplate, tests) so they can focus on architecture.",
                risk: "HIGH",
              },
              {
                con: "AI Output Quality Varies",
                reality: "Claude doesn't always generate perfect code. Sometimes it hallucinates APIs, misses edge cases, or produces suboptimal solutions.",
                mitigation: "Human Gates are mandatory at every step. AI suggests, humans approve. Track AI acceptance rate - if devs reject >50% of suggestions, the prompts need improvement.",
                risk: "MEDIUM",
              },
              {
                con: "Cultural Inertia",
                reality: "MassMutual has established processes. Introducing QUAD means changing how people work. Change is hard, especially in large orgs.",
                mitigation: "Don't replace existing process - augment it. QUAD can work alongside Scrum/SAFe. Start with 'AI-assisted story expansion' only, then gradually add more.",
                risk: "HIGH",
              },
              {
                con: "Documentation Overhead",
                reality: "Docs-First means writing specs BEFORE coding. Developers hate writing documentation.",
                mitigation: "AI writes 80% of the documentation. Developer writes bullet points, Story Agent expands to full spec. Net documentation time goes DOWN, not up.",
                risk: "MEDIUM",
              },
              {
                con: "Measuring ROI is Hard",
                reality: "How do you prove QUAD saved time? Baseline metrics are often missing or unreliable.",
                mitigation: "Establish baseline BEFORE pilot: current velocity, cycle time, bug rate. Compare after 4 weeks. If no measurable improvement, be honest about it.",
                risk: "MEDIUM",
              },
              {
                con: "Security & Compliance Concerns",
                reality: "Insurance industry has strict data handling requirements. Can we send code/specs to Claude?",
                mitigation: "Claude Business has enterprise security. No customer data in prompts - only technical specs. Get InfoSec sign-off before pilot.",
                risk: "HIGH",
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-white">{item.con}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    item.risk === "HIGH" ? "bg-red-500/20 text-red-300" : "bg-yellow-500/20 text-yellow-300"
                  }`}>
                    {item.risk} RISK
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  <strong className="text-red-300">Reality:</strong> {item.reality}
                </p>
                <p className="text-sm text-slate-400">
                  <strong className="text-green-300">Mitigation:</strong> {item.mitigation}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The "Dream vs Reality" Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">What If We Only Dream?</h2>
          <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/20">
            <p className="text-lg mb-6">
              The honest question: <strong className="text-white">&quot;What if this is just another initiative that sounds great but never gets implemented?&quot;</strong>
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-red-300 mb-3">Signs It Will Fail</h3>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li>❌ No executive sponsor with budget authority</li>
                  <li>❌ Pilot team is already overloaded</li>
                  <li>❌ Success metrics not defined upfront</li>
                  <li>❌ &quot;Let&apos;s try it on everything&quot; approach</li>
                  <li>❌ No one owns the outcome</li>
                  <li>❌ InfoSec hasn&apos;t approved Claude usage</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-bold text-green-300 mb-3">Signs It Will Succeed</h3>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li>✅ Director commits to 4-week pilot</li>
                  <li>✅ One team, one project, protected time</li>
                  <li>✅ Clear metrics: velocity, cycle time, bugs</li>
                  <li>✅ Kill criteria defined (if X, we stop)</li>
                  <li>✅ Champion (you) drives daily adoption</li>
                  <li>✅ Claude already approved by InfoSec</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-yellow-500/30">
              <h4 className="font-bold text-yellow-300 mb-2">The Honest Proposal</h4>
              <p className="text-slate-300 text-sm">
                &quot;Let me run a 4-week pilot with my team. If we don&apos;t see at least 20% improvement in velocity or cycle time, we kill it and move on. Zero company-wide commitment until proven. I&apos;ll own the metrics and report weekly. If it fails, I&apos;ll be the first to say so.&quot;
              </p>
            </div>
          </div>
        </section>

        {/* Proposal Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">The Ask</h2>
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400">4</div>
                <div className="text-slate-400">Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400">1</div>
                <div className="text-slate-400">Team</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400">$0</div>
                <div className="text-slate-400">New Tools</div>
              </div>
            </div>

            <h3 className="font-bold text-white mb-3">What I Need From You (Director)</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                <span className="text-slate-300">Approval to run 4-week pilot with my team</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                <span className="text-slate-300">Protected time (team not pulled for emergencies)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                <span className="text-slate-300">Agreement on success metrics before we start</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                <span className="text-slate-300">15-minute weekly check-in on progress</span>
              </li>
            </ul>

            <h3 className="font-bold text-white mb-3 mt-6">What I Commit To</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Own all setup, training, and execution</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Weekly metrics report (no fluff, just numbers)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Honest assessment - if it doesn&apos;t work, I&apos;ll say so</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Documentation of learnings regardless of outcome</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Links */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Supporting Materials</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/pitch" className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-all">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-bold text-white">ROI Calculator</h3>
              <p className="text-sm text-slate-400">See projected savings by team size</p>
            </Link>
            <Link href="/case-study" className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-all">
              <div className="text-2xl mb-2">🧮</div>
              <h3 className="font-bold text-white">Case Study</h3>
              <p className="text-sm text-slate-400">Agile vs QUAD comparison</p>
            </Link>
            <Link href="/concept" className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-all">
              <div className="text-2xl mb-2">💡</div>
              <h3 className="font-bold text-white">Full Methodology</h3>
              <p className="text-sm text-slate-400">Complete QUAD explanation</p>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm">
          <p>Created by Suman Addanki | suman.addanki@gmail.com</p>
          <p className="mt-1">QUAD Framework - Quick Unified Agentic Development</p>
        </div>
      </div>
    </div>
  );
}
