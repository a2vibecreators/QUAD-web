"use client";

import Link from "next/link";

export default function CustomerContact() {
  return (
    <div className="text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
            Step 5 of 5 - Final Step
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Schedule a Demo
          </h1>
          <p className="text-slate-400">
            Let&apos;s discuss how QUAD can transform your engineering workflow
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Email */}
          <a
            href="mailto:suman.addanki@gmail.com?subject=QUAD Platform Demo Request"
            className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-blue-500/50 transition-all group"
          >
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-blue-300 transition-colors">
              Email Us
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Send us an email and we&apos;ll respond within 24 hours
            </p>
            <span className="text-blue-400">
              suman.addanki@gmail.com
            </span>
          </a>

          {/* Calendar */}
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-bold mb-2">
              Schedule a Call
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Book a 30-minute demo call with our team
            </p>
            <span className="text-slate-500 text-sm">
              Calendar booking coming soon
            </span>
          </div>
        </div>

        {/* Team */}
        <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-12">
          <h2 className="text-xl font-bold mb-6">Meet the Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Madhuri",
                role: "Founder & CEO",
                location: "USA",
              },
              {
                name: "Mahesh",
                role: "VP Sales",
                location: "Canada",
              },
              {
                name: "Sharath",
                role: "VP Engineering",
                location: "India",
              },
              {
                name: "Lokesh",
                role: "VP Product",
                location: "India",
              },
              {
                name: "Supriya",
                role: "Human Resources",
                location: "India",
              },
            ].map((member, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {member.name[0]}
                </div>
                <div>
                  <div className="font-bold text-white">{member.name}</div>
                  <div className="text-sm text-slate-400">{member.role}</div>
                  <div className="text-xs text-slate-500">{member.location}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What to Expect */}
        <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20 mb-12">
          <h2 className="text-xl font-bold mb-6">What to Expect</h2>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Discovery Call (30 min)",
                desc: "Understand your current workflow and pain points",
              },
              {
                step: "2",
                title: "Tailored Demo (45 min)",
                desc: "See QUAD configured for your tech stack",
              },
              {
                step: "3",
                title: "Pilot Proposal",
                desc: "4-week pilot plan with clear success metrics",
              },
              {
                step: "4",
                title: "Pilot Kickoff",
                desc: "Start transforming your development workflow",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <div className="font-bold text-white">{item.title}</div>
                  <div className="text-sm text-slate-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Back to Overview */}
        <div className="text-center">
          <Link
            href="/customer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
