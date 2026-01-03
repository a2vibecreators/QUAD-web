import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation />

      {/* Hero Section */}
      <section className="relative py-8 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
            <span className="gradient-text">QUAD</span>
            <span className="text-xl align-super text-slate-500 ml-2">Framework</span>
          </h1>
          <p className="text-xl font-semibold text-blue-300 mb-1">
            Quick Unified Agentic Development
          </p>
          <p className="text-base text-slate-500 mb-6">
            <span className="text-blue-400">Q</span>uestion → <span className="text-green-400">U</span>nderstand → <span className="text-amber-400">A</span>llocate → <span className="text-purple-400">D</span>eliver
          </p>

          {/* Circle of Functions - Super Blocks */}
          <div className="max-w-3xl mx-auto mb-8 px-4">
            <p className="text-sm font-semibold text-slate-400 mb-4 tracking-widest uppercase">Circle of Functions</p>
            <div className="grid grid-cols-4 gap-3 md:gap-4 mb-6">
              {/* Block 1 - Method */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3 md:p-5 border border-blue-500/30 hover:border-blue-400/50 transition-all hover:scale-105">
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent mb-1">1</div>
                  <div className="text-[10px] md:text-xs font-bold text-blue-400 tracking-wider uppercase">Method</div>
                  <div className="text-xs md:text-sm text-white font-semibold mt-1">QUAD</div>
                </div>
              </div>
              {/* Block 2 - Dimensions */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3 md:p-5 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-105">
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent mb-1">2</div>
                  <div className="text-[10px] md:text-xs font-bold text-green-400 tracking-wider uppercase">Dims</div>
                  <div className="text-xs md:text-sm text-white font-semibold mt-1">Biz+Tech</div>
                </div>
              </div>
              {/* Block 3 - Axioms */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3 md:p-5 border border-amber-500/30 hover:border-amber-400/50 transition-all hover:scale-105">
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-br from-amber-400 to-orange-600 bg-clip-text text-transparent mb-1">3</div>
                  <div className="text-[10px] md:text-xs font-bold text-amber-400 tracking-wider uppercase">Axioms</div>
                  <div className="text-xs md:text-sm text-white font-semibold mt-1">Truths</div>
                </div>
              </div>
              {/* Block 4 - Circles */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-700 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3 md:p-5 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-105">
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-br from-purple-400 to-violet-600 bg-clip-text text-transparent mb-1">4</div>
                  <div className="text-[10px] md:text-xs font-bold text-purple-400 tracking-wider uppercase">Circles</div>
                  <div className="text-xs md:text-sm text-white font-semibold mt-1">Teams</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-xl mx-auto text-center">
              AI agents at every step with documentation-first approach.
            </p>
          </div>

        </div>
      </section>

      {/* Revolutionary Development Model */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-y border-blue-500/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                The QUAD Revolution
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              From weeks of documentation to hours of working software
            </p>
          </div>

          {/* Comparison Table */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Traditional Agile */}
            <div className="glass-card rounded-2xl p-8 border border-red-500/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🐢</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Traditional Agile</h3>
                  <p className="text-sm text-red-400">Waterfall in Disguise</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">❌</span>
                  <div>
                    <p className="text-white font-medium">6-9 weeks to first prototype</p>
                    <p className="text-sm text-slate-400">BA writes 40-page specs first</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">❌</span>
                  <div>
                    <p className="text-white font-medium">2-4 week sprint cycles</p>
                    <p className="text-sm text-slate-400">Slow feedback loops</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">❌</span>
                  <div>
                    <p className="text-white font-medium">30-40% rework rate</p>
                    <p className="text-sm text-slate-400">Build wrong features, waste time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">❌</span>
                  <div>
                    <p className="text-white font-medium">12-16 weeks to production</p>
                    <p className="text-sm text-slate-400">Long deployment cycles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">❌</span>
                  <div>
                    <p className="text-white font-medium">$50K-$200K per feature</p>
                    <p className="text-sm text-slate-400">High cost, low satisfaction</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QUAD Model */}
            <div className="glass-card rounded-2xl p-8 border border-green-500/30 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                  100x FASTER
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">QUAD Model</h3>
                  <p className="text-sm text-green-400">AI-Accelerated Spiral</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✅</span>
                  <div>
                    <p className="text-white font-medium">2-8 hours to first prototype</p>
                    <p className="text-sm text-slate-400">Minimal POC spec → AI builds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✅</span>
                  <div>
                    <p className="text-white font-medium">Same-day iteration cycles</p>
                    <p className="text-sm text-slate-400">3-5 iterations per day</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✅</span>
                  <div>
                    <p className="text-white font-medium">5-10% rework rate</p>
                    <p className="text-sm text-slate-400">Rapid validation, minimal waste</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✅</span>
                  <div>
                    <p className="text-white font-medium">1-3 days to production</p>
                    <p className="text-sm text-slate-400">Continuous deployment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✅</span>
                  <div>
                    <p className="text-white font-medium">$2K-$10K per feature</p>
                    <p className="text-sm text-slate-400">Low cost, high satisfaction (95%)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-blue-500/20">
            <h3 className="text-2xl font-bold text-center mb-8">How QUAD Works</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h4 className="font-semibold text-white mb-2">1. Minimal POC</h4>
                <p className="text-sm text-slate-400">
                  BA writes 1-2 paragraph spec, not 40-page document
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤖</span>
                </div>
                <h4 className="font-semibold text-white mb-2">2. AI Builds</h4>
                <p className="text-sm text-slate-400">
                  QUAD agents develop & deploy to DEV in 2-8 hours
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👀</span>
                </div>
                <h4 className="font-semibold text-white mb-2">3. Business Reviews</h4>
                <p className="text-sm text-slate-400">
                  See working software same day, provide feedback
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔄</span>
                </div>
                <h4 className="font-semibold text-white mb-2">4. Rapid Iteration</h4>
                <p className="text-sm text-slate-400">
                  AI updates based on feedback in hours, not weeks
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* The 1-2-3-4 Hierarchy */}
      <section className="py-16 px-4 md:px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">The 1-2-3-4 Hierarchy</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { num: "1", term: "METHOD", items: ["QUAD"], desc: "Quick Unified Agentic Development", color: "blue" },
              { num: "2", term: "DIMENSIONS", items: ["Business", "Technical"], desc: "The two focus axes", color: "green" },
              { num: "3", term: "AXIOMS", items: ["Operators", "AI Agents", "Docs-First"], desc: "Foundational truths", color: "amber" },
              { num: "4", term: "CIRCLES", items: ["Management", "Development", "QA", "Infrastructure"], desc: "Functional teams", color: "purple" },
            ].map((item) => (
              <div key={item.num} className={`glass-card rounded-xl p-5 md:p-6 text-center border border-${item.color}-500/20`}>
                <div className={`text-4xl md:text-5xl font-black text-${item.color}-400 mb-3`}>{item.num}</div>
                <div className="text-sm font-bold text-white mb-3">{item.term}</div>
                <div className="space-y-1 mb-3">
                  {item.items.map((i) => (
                    <div key={i} className={`text-sm text-${item.color}-300`}>{i}</div>
                  ))}
                </div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The 4 Circles - Shared to Dedicated Spectrum */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">The 4 Circles</h2>
          <p className="text-center text-slate-400 mb-8 max-w-2xl mx-auto">
            Resource allocation spectrum: from shared infrastructure to dedicated management
          </p>

          {/* Spectrum Bar */}
          <div className="mb-8 px-4">
            <div className="relative h-3 rounded-full bg-gradient-to-r from-blue-600 via-green-500 via-yellow-500 to-purple-600 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent opacity-50"></div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-blue-400 font-medium">← DEDICATED</span>
              <span className="text-purple-400 font-medium">SHARED →</span>
            </div>
          </div>

          {/* Sequential Circles - Horizontal Flow (1→2→3→4) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Circle 1: Management - Dedicated */}
            <div className="relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                  <span className="lg:hidden">DED</span>
                  <span className="hidden lg:inline">DEDICATED</span>
                </span>
              </div>
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-5 border-2 border-blue-500/50 hover:border-blue-400 transition-all h-full">
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-lg">1</div>
                  <div>
                    <h3 className="font-bold text-white">Management</h3>
                    <p className="text-[10px] text-blue-300">Biz 80%</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {["BA", "PM", "Tech Lead"].map((r) => (
                      <span key={r} className="px-2 py-0.5 bg-blue-500/20 text-blue-200 rounded">{r}</span>
                    ))}
                  </div>
                  <p className="text-blue-300/70 text-[10px]">Story, Schedule, Doc Agents</p>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-blue-900/50 rounded-full overflow-hidden">
                      <div className="h-full w-[100%] bg-blue-400 rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-blue-400">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Circle 2: Development - Mostly Dedicated */}
            <div className="relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                  <span className="lg:hidden">MOSTLY DED</span>
                  <span className="hidden lg:inline">MOSTLY DEDICATED</span>
                </span>
              </div>
              <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-xl p-5 border-2 border-green-500/50 hover:border-green-400 transition-all h-full">
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center text-green-300 font-bold text-lg">2</div>
                  <div>
                    <h3 className="font-bold text-white">Development</h3>
                    <p className="text-[10px] text-green-300">Tech 70%</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {["Full Stack", "Backend", "Mobile"].map((r) => (
                      <span key={r} className="px-2 py-0.5 bg-green-500/20 text-green-200 rounded">{r}</span>
                    ))}
                  </div>
                  <p className="text-green-300/70 text-[10px]">Dev Agent UI, API, Code Review</p>
                </div>
                <div className="mt-3 pt-3 border-t border-green-500/30">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-green-900/50 rounded-full overflow-hidden">
                      <div className="h-full w-[75%] bg-green-400 rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-green-400">75%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Circle 3: QA - Mostly Shared */}
            <div className="relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                  <span className="lg:hidden">MOSTLY SHR</span>
                  <span className="hidden lg:inline">MOSTLY SHARED</span>
                </span>
              </div>
              <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 rounded-xl p-5 border-2 border-yellow-500/50 hover:border-yellow-400 transition-all h-full">
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center text-yellow-300 font-bold text-lg">3</div>
                  <div>
                    <h3 className="font-bold text-white">QA</h3>
                    <p className="text-[10px] text-yellow-300">Tech 70%</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {["QA Eng", "Automation", "Security"].map((r) => (
                      <span key={r} className="px-2 py-0.5 bg-yellow-500/20 text-yellow-200 rounded">{r}</span>
                    ))}
                  </div>
                  <p className="text-yellow-300/70 text-[10px]">UI Test, API Test, Generator</p>
                </div>
                <div className="mt-3 pt-3 border-t border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-yellow-900/50 rounded-full overflow-hidden">
                      <div className="h-full w-[40%] bg-yellow-400 rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-yellow-400">40%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Circle 4: Infrastructure - Shared */}
            <div className="relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                  <span className="lg:hidden">SHR</span>
                  <span className="hidden lg:inline">SHARED</span>
                </span>
              </div>
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-5 border-2 border-purple-500/50 hover:border-purple-400 transition-all h-full">
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-lg">4</div>
                  <div>
                    <h3 className="font-bold text-white">Infrastructure</h3>
                    <p className="text-[10px] text-purple-300">Tech 80%</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {["DevOps", "SRE", "DBA"].map((r) => (
                      <span key={r} className="px-2 py-0.5 bg-purple-500/20 text-purple-200 rounded">{r}</span>
                    ))}
                  </div>
                  <p className="text-purple-300/70 text-[10px]">Deploy, Monitor, Incident Agents</p>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-purple-900/50 rounded-full overflow-hidden">
                      <div className="h-full w-[20%] bg-purple-400 rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-purple-400">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm text-slate-300">
                  <strong className="text-white">Shared vs Dedicated:</strong> Infrastructure resources are shared across projects (cost-efficient),
                  while Management resources are dedicated per project (focused attention). Development and QA fall in between based on project needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 px-8 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Why QUAD?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "🚀", title: "100x Faster Development", desc: "From weeks to hours - AI builds working prototypes same day" },
              { icon: "📝", title: "Documentation-First", desc: "AI agents work from docs, ensuring consistency and traceability" },
              { icon: "🤖", title: "AI Amplification", desc: "AI handles repetitive tasks, you handle creativity and decisions" },
              { icon: "📊", title: "Adoption Matrix", desc: "Track your AI journey from Skeptic to Expert" },
              { icon: "🎯", title: "Workload Tracking", desc: "Assignments vs Completes vs Output metrics" },
              { icon: "4×4", title: "Work-Life Balance", desc: "When efficiency improves, work less and achieve more" },
            ].map((benefit) => (
              <div key={benefit.title} className="glass-card rounded-xl p-6 text-center">
                <div className="text-3xl font-black text-blue-400 mb-3">{benefit.icon}</div>
                <h3 className="font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-400">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                How QUAD Compares
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              The only end-to-end platform: Requirement → Tickets → Code → Deploy
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Linear</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Cursor</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Devin</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Emergent</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">Bolt</th>
                  <th className="text-center py-3 px-2 text-green-400 font-bold">QUAD</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-800">
                  <td className="py-3 px-4">Ticket Management</td>
                  <td className="text-center py-3 px-2 text-green-400">✓</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-green-400 font-bold">✓</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 px-4">AI Code Generation</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-green-400">✓</td>
                  <td className="text-center py-3 px-2 text-green-400">✓</td>
                  <td className="text-center py-3 px-2 text-green-400">✓</td>
                  <td className="text-center py-3 px-2 text-green-400">✓</td>
                  <td className="text-center py-3 px-2 text-green-400 font-bold">✓</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 px-4">Meeting → Tasks</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-green-400 font-bold">✓</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 px-4">Deployment Recipes</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-yellow-400">~</td>
                  <td className="text-center py-3 px-2 text-green-400 font-bold">✓</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 px-4">DB Copy + Anonymize</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-red-400">✗</td>
                  <td className="text-center py-3 px-2 text-green-400 font-bold">✓</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 px-4">Human-in-the-Loop</td>
                  <td className="text-center py-3 px-2 text-slate-500">N/A</td>
                  <td className="text-center py-3 px-2 text-green-400">✓</td>
                  <td className="text-center py-3 px-2 text-yellow-400">~</td>
                  <td className="text-center py-3 px-2 text-green-400">✓</td>
                  <td className="text-center py-3 px-2 text-yellow-400">~</td>
                  <td className="text-center py-3 px-2 text-green-400 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Pricing</td>
                  <td className="text-center py-3 px-2 text-slate-400">$12/user</td>
                  <td className="text-center py-3 px-2 text-slate-400">$40/user</td>
                  <td className="text-center py-3 px-2 text-slate-400">$500/mo</td>
                  <td className="text-center py-3 px-2 text-slate-400">$20/mo</td>
                  <td className="text-center py-3 px-2 text-slate-400">$20-200</td>
                  <td className="text-center py-3 px-2 text-green-400 font-bold">$399/mo</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Value Prop */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-amber-400 mb-2">$399/mo</div>
              <div className="text-sm text-slate-400">Flat pricing, 10 users</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">Replaces ~$380</div>
              <div className="text-sm text-slate-400">Linear + Cursor + Tools</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-2">~$24K/yr</div>
              <div className="text-sm text-slate-400">Saved in engineering time</div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
            >
              View Full Comparison
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Choose Your Journey - The 3 Flows */}
      <section className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Choose Your Journey</h2>
          <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
            Navigate through QUAD using one of three guided paths. Each flow is designed for a different purpose.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* EXPLORE Flow */}
            <Link
              href="/concept"
              className="group relative rounded-2xl p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 hover:border-blue-400/50 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-xl">🔍</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-300">EXPLORE</h3>
                  <p className="text-xs text-slate-500">8 pages</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Understand QUAD methodology - concepts, discovery, value proposition, architecture, and terminology.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Concept", "Discovery", "Pitch", "Flow", "Architecture", "Details", "Terms", "Summary"].map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-xs">
                    {p}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                  Start exploring <span>→</span>
                </span>
              </div>
            </Link>

            {/* TRY Flow */}
            <Link
              href="/case-study"
              className="group relative rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 text-xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-300">TRY</h3>
                  <p className="text-xs text-slate-500">6 pages</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                See QUAD in action - case study, demo, configuration wizard, quiz, and platform.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Case Study", "Demo", "Configure", "Matrix", "Platform", "Quiz"].map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-green-500/10 text-green-300 rounded text-xs">
                    {p}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-xs text-green-400 group-hover:text-green-300 flex items-center gap-1">
                Try it out <span>→</span>
              </div>
            </Link>

            {/* RESOURCES Flow */}
            <Link
              href="/cheatsheet"
              className="group relative rounded-2xl p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-xl">📚</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-300">RESOURCES</h3>
                  <p className="text-xs text-slate-500">7 pages</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Quick reference - cheat sheet, onboarding checklist, documentation, and enterprise materials.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Cheat Sheet", "Onboarding", "Docs", "Sitemap", "Support", "Pitch", "Book"].map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-xs">
                    {p}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-xs text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                Get resources <span>→</span>
              </div>
            </Link>
          </div>

          {/* Flow path visualization */}
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            <span className="text-blue-400 font-medium">EXPLORE</span>
            <span className="text-slate-600">→</span>
            <span className="text-green-400 font-medium">TRY</span>
            <span className="text-slate-600">→</span>
            <span className="text-purple-400 font-medium">RESOURCES</span>
            <span className="text-slate-600">→</span>
            <span className="text-emerald-400 font-medium">✓ Complete</span>
          </div>
        </div>
      </section>

      {/* Quick Navigation - All Pages */}
      <section className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Explore QUAD</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Source of Truth Flow",
                desc: "Watch how requirements flow through QUAD - animated SVG visualization",
                href: "/flow",
                icon: "🔄",
              },
              {
                title: "Main Concept",
                desc: "The complete QUAD methodology - Operators, AI Agents, Docs-First approach",
                href: "/concept",
                icon: "💡",
              },
              {
                title: "Agent Architecture",
                desc: "QACA - How agents communicate, permissions, and execution patterns",
                href: "/architecture",
                icon: "🏗️",
              },
              {
                title: "Technical Details",
                desc: "Deep-dive: Agent patterns, flow docs, organizational hierarchy",
                href: "/details",
                icon: "📋",
              },
              {
                title: "Terminology",
                desc: "QUAD jargon glossary - Cycle, Pulse, Trajectory, Checkpoint",
                href: "/jargons",
                icon: "📖",
              },
              {
                title: "Executive Summary",
                desc: "High-level overview for executives and quick reference",
                href: "/summary",
                icon: "📝",
              },
              {
                title: "Case Studies",
                desc: "5 domains: E-commerce, Hospital, Education, Manufacturing, Software",
                href: "/case-study",
                icon: "📊",
                badge: "5 DOMAINS",
              },
              {
                title: "Dashboard Demo",
                desc: "See how a QUAD implementation dashboard might look",
                href: "/demo",
                icon: "🌐",
              },
              {
                title: "QUAD Quiz",
                desc: "Test your understanding of QUAD methodology concepts",
                href: "/quiz",
                icon: "🎯",
              },
              {
                title: "Cheat Sheet",
                desc: "Searchable quick reference for all QUAD terminology",
                href: "/cheatsheet",
                icon: "📄",
              },
              {
                title: "QUAD Platform",
                desc: "Complete deployable solution - Self-hosted or SaaS with enterprise features",
                href: "/platform",
                icon: "🏢",
                badge: "PRODUCT",
              },
              {
                title: "Adoption Matrix",
                desc: "Measure your AI journey - 3×3 or 5×5 positioning system with safety buffers",
                href: "/adoption-matrix",
                icon: "🎯",
              },
              {
                title: "Documentation",
                desc: "Complete methodology documentation - from concepts to implementation",
                href: "/docs",
                icon: "📚",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="glass-card rounded-xl p-6 hover:bg-white/10 transition-all group relative"
              >
                {card.badge && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                    {card.badge}
                  </span>
                )}
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-400">{card.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Free Book Section */}
      <section className="py-16 px-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-y border-green-500/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Book Preview */}
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-3"></div>
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700 shadow-xl">
                  <div className="w-40 h-52 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-blue-400 font-mono mb-1">A2VIBE</div>
                      <div className="text-2xl font-black text-blue-400">Java</div>
                      <div className="text-sm text-slate-300">for the</div>
                      <div className="text-xl font-black text-green-400">AI Era</div>
                    </div>
                    <div className="flex items-center gap-2 text-2xl">
                      <span>☕</span>
                      <span className="text-sm">+</span>
                      <span>🤖</span>
                    </div>
                    <div className="text-xs text-slate-400">12 Chapters + QUAD</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-4">
                <span>📖</span>
                <span>FREE for registered users</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Get the Complete Book
              </h2>
              <p className="text-slate-300 mb-6">
                <strong>Java for the AI Era</strong> teaches Java concepts that AI can't replace,
                effective prompting techniques, and includes two chapters on the QUAD Framework.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">12 Chapters</span>
                <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">4+ Hours</span>
                <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">QUAD Included</span>
              </div>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-all hover:scale-105"
              >
                <span>📥</span>
                <span>Download Free Book</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-slate-400 mb-8">
            Go from weeks of documentation to hours of working software. Start with Case Studies to see QUAD in action across 5 domains.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
            >
              Sign Up Free →
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-4 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors font-semibold border border-slate-600"
            >
              Sign In
            </Link>
            <Link
              href="/case-study"
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              View Case Study
            </Link>
          </div>
        </div>
      </section>

      {/* 4-4-4 Principle - Secondary Note */}
      <section className="py-8 px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
            <p className="text-sm text-slate-400 mb-2">
              <span className="text-emerald-400 font-semibold">Bonus:</span> When AI handles the repetitive work...
            </p>
            <div className="flex items-center justify-center gap-3 text-emerald-400">
              <span className="text-lg font-bold">4 hrs/day</span>
              <span className="text-slate-600">×</span>
              <span className="text-lg font-bold">4 days/wk</span>
              <span className="text-slate-600">=</span>
              <span className="text-lg font-bold">4X efficiency</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Work-life balance becomes possible when you're not fighting inefficiency
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
