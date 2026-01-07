"use client";

import Link from "next/link";

export default function CustomerLanding() {
  return (
    <div className="text-white">
      {/* Hero Section - Problem-Focused */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm mb-6">
            The Question No One Asks
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Why Does a 1-Paragraph Feature{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              Take 6 Weeks?
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            Your BA writes a simple request. Six weeks later, after countless meetings,
            refinements, and missed deadlines, something ships. <strong className="text-white">This isn&apos;t agile. This is broken.</strong>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/customer/demo"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
            >
              See the Solution
            </Link>
            <Link
              href="/customer/pitch"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all text-lg"
            >
              View Full Pitch
            </Link>
          </div>
        </div>
      </section>

      {/* The Real Problem - Expanded */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">The Real Problem</h2>
          <p className="text-center text-slate-400 mb-12 max-w-3xl mx-auto">
            It&apos;s not your developers. It&apos;s not your tools. It&apos;s the <strong className="text-white">process itself</strong>.
          </p>

          <div className="space-y-6">
            {/* Problem 1 */}
            <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">The Telephone Game</h3>
                  <p className="text-slate-400">
                    Business → BA → PM → Tech Lead → Developer → Code. By the time requirements
                    reach the keyboard, they&apos;ve been translated 4 times. <strong className="text-slate-300">30-40% of work gets rejected</strong> because
                    &quot;that&apos;s not what we meant.&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* Problem 2 */}
            <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">Ceremony Over Delivery</h3>
                  <p className="text-slate-400">
                    Sprint planning. Daily standups. Refinement. Retros. Your teams spend
                    <strong className="text-slate-300"> 20% of their time talking about work</strong> instead of doing it.
                    Scrum was meant to accelerate delivery. It became the bottleneck.
                  </p>
                </div>
              </div>
            </div>

            {/* Problem 3 */}
            <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">AI Without Strategy</h3>
                  <p className="text-slate-400">
                    Your developers use Claude, Copilot, ChatGPT - everyone has their favorite.
                    But there&apos;s <strong className="text-slate-300">no standardization, no governance, no measurement</strong>.
                    You&apos;re paying for AI but can&apos;t prove ROI.
                  </p>
                </div>
              </div>
            </div>

            {/* Problem 4 */}
            <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 font-bold shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">The Human Cost</h3>
                  <p className="text-slate-400">
                    Weekend deployments. Crunch time before releases. Burnout is normalized.
                    Your best engineers leave for companies that <strong className="text-slate-300">respect their time</strong>.
                    This isn&apos;t sustainable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The QUAD Answer */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">The QUAD Answer</h2>
          <p className="text-center text-slate-400 mb-12 max-w-3xl mx-auto">
            What if the BA could describe a feature in <strong className="text-white">one paragraph</strong>, and
            see working code <strong className="text-white">the same day</strong>?
          </p>

          {/* Timeline Comparison - 3 Columns */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Traditional Agile */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-slate-400 mb-4">Traditional Agile</h3>
              <div className="space-y-3">
                {[
                  { phase: "Requirements", time: "1-2 weeks" },
                  { phase: "Sprint Planning", time: "2-3 days" },
                  { phase: "Development", time: "2 weeks" },
                  { phase: "Code Review", time: "2-3 days" },
                  { phase: "QA Testing", time: "1 week" },
                  { phase: "Deployment", time: "2-3 days" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.phase}</span>
                    <span className="text-red-400">{item.time}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-red-400">6-9 weeks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agile with Vibe Coding */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">Agile + Vibe Coding</h3>
              <p className="text-xs text-slate-500 mb-3">(Cursor, Devin, Copilot, etc.)</p>
              <div className="space-y-3">
                {[
                  { phase: "Requirements", time: "1-2 weeks" },
                  { phase: "Sprint Planning", time: "2-3 days" },
                  { phase: "AI-Assisted Dev", time: "3-5 days" },
                  { phase: "Code Review", time: "2-3 days" },
                  { phase: "QA Testing", time: "1 week" },
                  { phase: "Deployment", time: "2-3 days" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.phase}</span>
                    <span className="text-yellow-400">{item.time}</span>
                  </div>
                ))}
                <div className="border-t border-yellow-500/20 pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-yellow-400">4-6 weeks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QUAD Platform */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
              <h3 className="text-lg font-bold text-blue-400 mb-4">QUAD Platform</h3>
              <p className="text-xs text-slate-500 mb-3">(AI-first methodology)</p>
              <div className="space-y-3">
                {[
                  { phase: "Q - Question", time: "10 min", desc: "BA describes need" },
                  { phase: "U - Understand", time: "30 min", desc: "AI expands to spec" },
                  { phase: "A - Automate", time: "2-4 hrs", desc: "AI generates code" },
                  { phase: "D - Deliver", time: "1-2 hrs", desc: "Human validates" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div>
                      <span className="text-white">{item.phase}</span>
                      <span className="text-slate-500 ml-2 text-xs">({item.desc})</span>
                    </div>
                    <span className="text-green-400">{item.time}</span>
                  </div>
                ))}
                <div className="border-t border-blue-500/20 pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-green-400">3-7 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20 text-center">
            <p className="text-lg text-slate-300">
              The same feature. The same quality. <strong className="text-green-400">100x faster.</strong>
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Not by working harder. By working <em>differently</em>.
            </p>
          </div>
        </div>
      </section>

      {/* How It Actually Works */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Actually Works</h2>
          <p className="text-center text-slate-400 mb-12">
            Four stages. Zero ceremony. Maximum output.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                letter: "Q",
                title: "Question",
                desc: "BA writes what's needed in plain English. One paragraph. No 40-page specs.",
                color: "blue",
              },
              {
                letter: "U",
                title: "Understand",
                desc: "AI expands the request into a detailed technical specification. Asks clarifying questions.",
                color: "purple",
              },
              {
                letter: "A",
                title: "Automate",
                desc: "AI agents generate production-ready code following your standards and patterns.",
                color: "green",
              },
              {
                letter: "D",
                title: "Deliver",
                desc: "Human engineer reviews, tests, and deploys. AI handles the grunt work.",
                color: "orange",
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 h-full">
                  <div className={`w-14 h-14 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-xl flex items-center justify-center text-2xl font-bold mb-4`}>
                    {step.letter}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-slate-600 text-xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Paradigm Shift */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The Paradigm Shift</h2>
          <div className="space-y-6">
            {[
              {
                before: "Developers write code from scratch",
                after: "Developers validate AI-generated code",
              },
              {
                before: "BAs write 40-page requirement docs",
                after: "BAs describe features in plain English",
              },
              {
                before: "QA tests after 2-week sprints",
                after: "QA validates same-day deliveries",
              },
              {
                before: "Scrum Masters manage ceremonies",
                after: "AI agents orchestrate workflows",
              },
              {
                before: "Features take 6-9 weeks",
                after: "Features ship in hours",
              },
            ].map((item, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <span className="text-red-400 text-xs font-bold">BEFORE</span>
                  <p className="text-slate-400 mt-1">{item.before}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <span className="text-green-400 text-xs font-bold">AFTER</span>
                  <p className="text-white mt-1">{item.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUAD Platform: Enterprise Features */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
              Beyond the Methodology
            </div>
            <h2 className="text-3xl font-bold mb-4">QUAD Platform: Enterprise Features</h2>
            <p className="text-slate-400 max-w-3xl mx-auto">
              The QUAD Framework is a methodology anyone can adopt. The QUAD Platform is the software
              that implements it — plus enterprise-grade features for visibility, governance, and team health.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "📊",
                title: "Project Health Dashboards",
                desc: "Real-time visibility into project health, velocity trends, and delivery metrics across your entire organization.",
              },
              {
                icon: "🏆",
                title: "Appreciation & Recognition",
                desc: "AI-suggested appreciation for team contributions. Celebrate wins, boost morale, reduce attrition.",
              },
              {
                icon: "⚖️",
                title: "Skewness Detection",
                desc: "Identify workload imbalances before they cause burnout. Ensure fair distribution across team members.",
              },
              {
                icon: "🔍",
                title: "Bottleneck Identification",
                desc: "Automatically detect where work gets stuck. Find process bottlenecks and resource constraints.",
              },
              {
                icon: "📈",
                title: "Resource Optimization",
                desc: "AI-powered suggestions for team allocation. Right people on right projects at right time.",
              },
              {
                icon: "🛡️",
                title: "AI Governance & Compliance",
                desc: "Track AI usage, enforce policies, audit outputs. Enterprise-grade controls for regulated industries.",
              },
            ].map((feature, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-purple-500/30 transition-all">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              And more coming: Team development activities, cross-project analytics, compliance reporting...
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">See It In Action</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Don&apos;t take our word for it. Watch a feature go from idea to production
            in a single demo session.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/customer/contact"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
            >
              Schedule a Demo
            </Link>
            <Link
              href="/customer/pitch"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all text-lg"
            >
              View Full Pitch Deck
            </Link>
          </div>
        </div>
      </section>

      {/* Next Step Navigation */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
            Next Step
          </div>
          <h2 className="text-3xl font-bold mb-4">View the Full Pitch</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            See the complete pitch deck with ROI calculations and partnership proposal.
          </p>
          <Link
            href="/customer/pitch"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
          >
            View Pitch Deck
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
