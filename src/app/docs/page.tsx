"use client";

import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

// Define documentation structure
const docs = [
  {
    category: "Core Documentation",
    items: [
      { slug: "QUAD", title: "QUAD Methodology", desc: "Complete QUAD specification and principles", icon: "📘" },
      { slug: "QUAD_PLATFORM", title: "QUAD Platform", desc: "Enterprise deployment - Self-hosted or SaaS", icon: "🏢", badge: "NEW" },
      { slug: "QUAD_DETAILS", title: "Technical Details", desc: "In-depth technical specifications", icon: "📋" },
      { slug: "QUAD_JARGONS", title: "Terminology", desc: "QUAD jargon and glossary", icon: "📖" },
      { slug: "QUAD_SUMMARY", title: "Executive Summary", desc: "High-level overview for executives", icon: "📝" },
      { slug: "QUAD_CASE_STUDY", title: "Case Study", desc: "Calculator app: Agile vs QUAD", icon: "🧮" },
      { slug: "QUAD_AGENT_ARCHITECTURE", title: "Agent Architecture", desc: "QACA - Agent communication spec", icon: "🏗️" },
      { slug: "QUAD_DISCOVERY", title: "Discovery Framework", desc: "Diagnostic process for confused clients", icon: "🔍", badge: "NEW" },
      { slug: "QUAD_PITCH", title: "Value Proposition", desc: "ROI calculator and benefits analysis", icon: "💰" },
      { slug: "QUAD_FLOW", title: "Source of Truth Flow", desc: "How requirements flow through QUAD", icon: "🔄" },
      { slug: "QUAD_ONBOARDING", title: "Onboarding Requirements", desc: "Prerequisites and setup checklist", icon: "🎯" },
    ],
  },
  {
    category: "QUAD Workflow",
    items: [
      { slug: "quad-workflow/QUAD_PROJECT_LIFECYCLE", title: "Project Lifecycle", desc: "Full project flow from inception to delivery", icon: "🔄" },
      { slug: "quad-workflow/QUAD_ADOPTION_JOURNEY", title: "Adoption Journey", desc: "8-step journey (2×QUAD) for teams", icon: "🚀" },
      { slug: "quad-workflow/QUAD_ADOPTION_LEVELS", title: "Adoption Levels (0D-4D)", desc: "Origin → Vector → Plane → Space → Hyperspace", icon: "📐", badge: "NEW" },
      { slug: "quad-workflow/QUAD_CUSTOMIZABLE_TRIGGERS", title: "Customizable Triggers", desc: "Configure agent triggers per project", icon: "⚙️" },
      { slug: "quad-workflow/QUAD_ASSIGNMENT_AGENT", title: "Assignment Agent", desc: "AI-powered task assignment with learning", icon: "🤖" },
      { slug: "quad-workflow/QUAD_INTEGRATION_ARCHITECTURE", title: "Integration Architecture", desc: "Connect QUAD with Jira, Slack, GitHub", icon: "🔌" },
      { slug: "quad-workflow/QUAD_CUSTOM_AGENTS", title: "Custom Agents", desc: "Build your own QUAD agents", icon: "🛠️" },
      { slug: "quad-workflow/QUAD_COMMANDS", title: "QUAD Commands", desc: "CLI and IDE commands reference", icon: "⌨️" },
      { slug: "quad-workflow/QUAD_STORY_LABELS", title: "Story Labels", desc: "Configurable labeling system with presets", icon: "🏷️" },
      { slug: "quad-workflow/QUAD_SAMPLE_ENVIRONMENT", title: "Sample Environment", desc: "Example project setup and configuration", icon: "📦" },
    ],
  },
];

export default function DocsPage() {
  const sections = [
    { id: "core", title: "Core Documentation" },
    { id: "workflow", title: "QUAD Workflow" },
    { id: "download", title: "Downloads" },
  ];

  return (
    <div className="min-h-screen text-white">
      <PageNavigation sections={sections} />
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📚</span>
            <h1 className="text-4xl font-bold">Documentation</h1>
          </div>
          <p className="text-slate-400">
            Complete QUAD methodology documentation - from high-level concepts to implementation details
          </p>
        </div>

        {/* Core Documentation */}
        <section id="core" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-blue-300">{docs[0].category}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {docs[0].items.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{doc.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{doc.desc}</p>
                  </div>
                  <span className="text-slate-500 group-hover:text-blue-400 transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* QUAD Workflow */}
        <section id="workflow" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-green-300">{docs[1].category}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {docs[1].items.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 hover:bg-slate-800 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{doc.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-green-300 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{doc.desc}</p>
                  </div>
                  <span className="text-slate-500 group-hover:text-green-400 transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Downloads */}
        <section id="download" className="mb-12 scroll-mt-32">
          <h2 className="text-2xl font-bold mb-6 text-purple-300">Downloads</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="/documentation/methodology/QUAD.pdf"
              target="_blank"
              className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/20 hover:bg-purple-500/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">📄</div>
                <div className="flex-1">
                  <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                    QUAD White Paper (PDF)
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Downloadable PDF version of the complete QUAD methodology
                  </p>
                </div>
                <span className="text-purple-400">↓</span>
              </div>
            </a>
            <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700 opacity-50">
              <div className="flex items-center gap-4">
                <div className="text-3xl">📦</div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">QUAD Platform Package</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Docker installation package (Coming Soon)
                  </p>
                </div>
                <span className="text-slate-600">—</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
            <h2 className="text-xl font-bold mb-4">Quick Navigation</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/concept" className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors text-sm">
                Visual Concept →
              </Link>
              <Link href="/flow" className="px-4 py-2 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition-colors text-sm">
                Source of Truth Flow →
              </Link>
              <Link href="/architecture" className="px-4 py-2 bg-yellow-600/20 text-yellow-300 rounded-lg hover:bg-yellow-600/30 transition-colors text-sm">
                Agent Architecture →
              </Link>
              <Link href="/platform" className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-sm">
                QUAD Platform →
              </Link>
              <Link href="/demo" className="px-4 py-2 bg-cyan-600/20 text-cyan-300 rounded-lg hover:bg-cyan-600/30 transition-colors text-sm">
                Dashboard Demo →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
