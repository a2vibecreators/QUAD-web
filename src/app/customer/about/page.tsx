"use client";

import Link from "next/link";

export default function CustomerAbout() {
  const team = [
    {
      name: "Madhuri",
      role: "Founder & CEO",
      bio: "Business operations expert with deep experience in enterprise transformation. Bridges the gap between technology and business outcomes.",
      email: "madhuri@quadframe.work",
    },
    {
      name: "Sharath",
      role: "Engineering",
      bio: "Engineering leader specializing in AI/ML integrations. Architect of QUAD agent orchestration system.",
      email: "sharath@quadframe.work",
    },
    {
      name: "Lokesh",
      role: "Product & Sales",
      bio: "Product strategist driving QUAD vision, roadmap, and enterprise sales. Bridges technical capabilities with customer needs.",
      email: "lokesh@quadframe.work",
    },
    {
      name: "Mahesh",
      role: "Tech Ops",
      bio: "Technical operations specialist ensuring smooth deployments and system reliability. Keeps QUAD running 24/7.",
      email: "mahesh@quadframe.work",
    },
    {
      name: "Pradeep",
      role: "Architecture",
      bio: "Solutions architect with expertise in cloud infrastructure and enterprise systems. Designing scalable architectures for QUAD deployments.",
      email: "pradeep@quadframe.work",
    },
    {
      name: "Supriya",
      role: "Human Resources",
      bio: "HR specialist ensuring QUAD attracts and retains top talent. Building a culture of innovation and collaboration across global teams.",
      email: "supriya@quadframe.work",
    },
  ];

  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-6">
            About QUAD
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Ushering Your Organization into the{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Era
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            AI has changed everything. QUAD is how organizations catch up with the AI flow -
            a methodology built for the new era of agentic AI and vibe coding. Not replacing
            what works, but evolving how we work with AI.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The Genesis of QUAD</h2>

          <div className="space-y-8">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start gap-4">
                <div className="w-16 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                  Early 2025
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">The Rise of Agentic AI</h3>
                  <p className="text-slate-400">
                    Claude Code, Cursor, and &quot;vibe coding&quot; emerged. For the first time, AI could
                    write entire features, not just autocomplete lines. Developers saw 10x productivity
                    gains in personal projects. The promise was undeniable.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start gap-4">
                <div className="w-16 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                  Jul 2025
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Enterprise Rush to Adopt</h3>
                  <p className="text-slate-400">
                    Organizations rushed to leverage these powerful tools. But something wasn't
                    working - teams weren't realizing the efficiency gains they expected. AI was powerful,
                    but without structure, it was chaos. Hallucinations, context loss, no governance.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start gap-4">
                <div className="w-16 h-12 bg-red-500/20 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                  Aug 2025
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Deep Research Begins</h3>
                  <p className="text-slate-400">
                    We studied how teams were actually using AI coding assistants. The pain points were clear:
                    hallucinations, context loss, no governance, inconsistent quality. The tools were brilliant,
                    but the process around them was broken.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start gap-4">
                <div className="w-16 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                  Oct 2025
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">The Insight</h3>
                  <p className="text-slate-400">
                    Raw AI power without methodology is like raw electricity without wiring - dangerous and
                    unpredictable. The solution wasn't better AI, it was better process. We needed to
                    change the way organizations work WITH AI.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-start gap-4">
                <div className="w-16 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                  Nov 2025
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">QUAD Is Born</h3>
                  <p className="text-slate-400">
                    QUAD - Quick Unified Agentic Development. A methodology that channels AI's raw power
                    into predictable, enterprise-grade software delivery. Not replacing developers, but
                    amplifying them. Same-day features, zero hallucinations, every time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Principles */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Principles</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Humans Decide, AI Executes",
                desc: "AI generates code. Humans approve it. The expertise stays with your team.",
                icon: "brain",
              },
              {
                title: "Process Should Be Invisible",
                desc: "Good methodology doesn't require ceremonies. It just works.",
                icon: "eye-off",
              },
              {
                title: "Speed Without Sacrifice",
                desc: "Faster doesn't mean sloppier. AI-generated code meets enterprise standards.",
                icon: "zap",
              },
              {
                title: "People Over Process",
                desc: "Tools should adapt to teams, not the other way around.",
                icon: "users",
              },
            ].map((principle, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-2">{principle.title}</h3>
                <p className="text-slate-400">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Meet the Team</h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            A small team of experienced engineers who&apos;ve lived the problems we&apos;re solving.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <h3 className="text-lg font-bold text-white">{member.name}</h3>
                <p className="text-blue-400 text-sm mb-3">{member.role}</p>
                <p className="text-slate-400 text-sm mb-4">{member.bio}</p>
                <div className="flex items-center gap-3 text-sm">
                  <a href={`mailto:${member.email}`} className="text-slate-500 hover:text-blue-400 transition-colors">
                    {member.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Company Information</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Legal Entity</h3>
              <div className="space-y-2 text-slate-400">
                <p><strong className="text-white">Name:</strong> QUADFRAMEWORK LLC</p>
                <p><strong className="text-white">Type:</strong> Limited Liability Company</p>
                <p><strong className="text-white">Incorporated:</strong> Delaware, USA</p>
                <p><strong className="text-white">Founded:</strong> 2024</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
              <div className="space-y-2 text-slate-400">
                <p><strong className="text-white">Email:</strong> quad@quadframe.work</p>
                <p><strong className="text-white">Sales:</strong> sales@quadframe.work</p>
                <p><strong className="text-white">Support:</strong> support@quadframe.work</p>
                <p><strong className="text-white">Website:</strong> quadframe.work</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-slate-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your SDLC?</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Let&apos;s discuss how QUAD can help your team ship features in hours, not weeks.
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
              View Full Pitch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
