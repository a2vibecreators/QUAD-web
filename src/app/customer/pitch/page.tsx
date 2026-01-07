"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// Slide data
const SLIDES = [
  { id: "title", label: "Welcome" },
  { id: "problem", label: "The Problem" },
  { id: "comparison", label: "Comparison" },
  { id: "meeting-to-code", label: "Meeting → Code" },
  { id: "ai-agents", label: "AI Agents" },
  { id: "dashboards", label: "Dashboards" },
  { id: "security", label: "Security" },
  { id: "roi", label: "ROI" },
  { id: "features", label: "Features" },
  { id: "founding-partner", label: "Partnership" },
  { id: "contact", label: "Contact" },
];

export default function CustomerPitch() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to update active slide
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const windowHeight = window.innerHeight;
      const newActiveSlide = Math.round(scrollPosition / windowHeight);
      setActiveSlide(newActiveSlide);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        const nextSlide = Math.min(activeSlide + 1, SLIDES.length - 1);
        container.scrollTo({ top: nextSlide * window.innerHeight, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const prevSlide = Math.max(activeSlide - 1, 0);
        container.scrollTo({ top: prevSlide * window.innerHeight, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide]);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.3 }
    );

    SLIDES.forEach((slide) => {
      const element = document.getElementById(slide.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSlide = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: index * window.innerHeight, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Navigation Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => scrollToSlide(index)}
            className={`group flex items-center gap-3 transition-all ${
              activeSlide === index ? "scale-110" : ""
            }`}
          >
            <span
              className={`hidden group-hover:block text-xs text-white bg-slate-800 px-2 py-1 rounded whitespace-nowrap`}
            >
              {slide.label}
            </span>
            <div
              className={`w-3 h-3 rounded-full border-2 transition-all ${
                activeSlide === index
                  ? "bg-blue-500 border-blue-500 scale-125"
                  : "border-slate-500 hover:border-blue-400"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-6 right-6 z-50 text-slate-500 text-xs hidden md:flex items-center gap-2">
        <span className="px-2 py-1 bg-slate-800 rounded">↑</span>
        <span className="px-2 py-1 bg-slate-800 rounded">↓</span>
        <span>to navigate</span>
      </div>

      {/* Slides Container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Slide 1: Title */}
        <section
          id="title"
          className={`min-h-screen snap-start flex items-center justify-center px-6 transition-opacity duration-1000 ${
            isVisible["title"] ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="text-center max-w-4xl">
            <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-6">
              Founding Partner Program
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              QUAD Platform
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mb-8">
              Transform how your engineering team delivers software
            </p>
            <div className="flex flex-col items-center gap-4">
              <p className="text-slate-500">Scroll to explore</p>
              <div className="animate-bounce">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 2: The Problem */}
        <section
          id="problem"
          className={`min-h-screen snap-start flex items-center justify-center px-6 bg-gradient-to-b from-slate-900 to-red-950/20 transition-all duration-1000 ${
            isVisible["problem"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="text-center max-w-4xl">
            <div className="inline-block px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm mb-6">
              The Problem
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Why does a <span className="text-red-400">1-paragraph feature</span><br />
              take <span className="text-red-400">6-9 weeks</span> to ship?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { num: "40+", label: "Pages of requirements", icon: "📄" },
                { num: "3-4", label: "Weeks in planning", icon: "📅" },
                { num: "30-40%", label: "Rework rate", icon: "🔄" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 transition-all duration-500 delay-${i * 200}`}
                  style={{ transitionDelay: `${i * 200}ms` }}
                >
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-red-400">{stat.num}</div>
                  <div className="text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Slide 3: Comparison */}
        <section
          id="comparison"
          className={`min-h-screen snap-start flex items-center justify-center px-6 transition-all duration-1000 ${
            isVisible["comparison"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-6xl w-full">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-4">
                The Difference
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Traditional vs QUAD
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Traditional */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-slate-400 mb-4">Traditional Agile</h3>
                <div className="space-y-3">
                  {[
                    { phase: "Requirements", time: "1-2 weeks" },
                    { phase: "Sprint Planning", time: "2-3 days" },
                    { phase: "Development", time: "2 weeks" },
                    { phase: "Code Review", time: "2-3 days" },
                    { phase: "QA Testing", time: "1-2 weeks" },
                    { phase: "Deployment", time: "2-3 days" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-400">{item.phase}</span>
                      <span className="text-slate-500">{item.time}</span>
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

              {/* Vibe Coding */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
                <h3 className="text-lg font-bold text-yellow-400 mb-4">Agile + AI Tools</h3>
                <p className="text-xs text-slate-500 mb-3">(Cursor, Copilot, etc.)</p>
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

              {/* QUAD */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/30 ring-2 ring-blue-500/20">
                <h3 className="text-lg font-bold text-blue-400 mb-4">QUAD Platform</h3>
                <p className="text-xs text-slate-500 mb-3">(AI-first methodology)</p>
                <div className="space-y-3">
                  {[
                    { phase: "Q - Question", time: "10 min" },
                    { phase: "U - Understand", time: "30 min" },
                    { phase: "A - Automate", time: "2-4 hrs" },
                    { phase: "D - Deliver", time: "1-2 hrs" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-300">{item.phase}</span>
                      <span className="text-blue-400">{item.time}</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-500/20 pt-3 mt-3">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-green-400">Same Day</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 4: Meeting to Code */}
        <section
          id="meeting-to-code"
          className={`min-h-screen snap-start flex items-center justify-center px-6 bg-gradient-to-b from-slate-900 to-blue-950/20 transition-all duration-1000 ${
            isVisible["meeting-to-code"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-5xl w-full">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
                The Magic
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Meeting → Code
              </h2>
              <p className="text-xl text-slate-400">
                From email to working code in <span className="text-green-400 font-bold">hours</span>, not weeks
              </p>
            </div>

            <div className="relative">
              {/* Timeline */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 -translate-x-1/2 hidden md:block" />

              <div className="space-y-8">
                {[
                  { time: "9:15 AM", icon: "📧", title: "Email Received", desc: "PM sends: 'Add price filter to products page'", color: "blue" },
                  { time: "9:16 AM", icon: "🎫", title: "Ticket Created", desc: "QUAD auto-creates Jira with user story + acceptance criteria", color: "purple" },
                  { time: "10:30 AM", icon: "💻", title: "Code Generated", desc: "3 files created: component, hook, tests (+147 lines)", color: "indigo" },
                  { time: "1:15 PM", icon: "✅", title: "PR Ready", desc: "Developer reviews, approves → PR created", color: "green" },
                ].map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                      <div className={`bg-slate-800/50 rounded-xl p-6 border border-${step.color}-500/30 inline-block`}>
                        <div className="text-sm text-slate-500 mb-1">{step.time}</div>
                        <div className="text-2xl mb-2">{step.icon}</div>
                        <h3 className="font-bold text-white mb-1">{step.title}</h3>
                        <p className="text-slate-400 text-sm">{step.desc}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex w-4 h-4 bg-white rounded-full z-10 flex-shrink-0" />
                    <div className="flex-1 hidden md:block" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Slide 5: AI Agents */}
        <section
          id="ai-agents"
          className={`min-h-screen snap-start flex items-center justify-center px-6 transition-all duration-1000 ${
            isVisible["ai-agents"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-5xl w-full">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
                AI-Powered
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                10 Specialized AI Agents
              </h2>
              <p className="text-xl text-slate-400">
                Each agent masters one job. Together, they transform your SDLC.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: "📧", name: "Email", desc: "Creates tickets from emails" },
                { icon: "💬", name: "Slack", desc: "Responds to @quad mentions" },
                { icon: "💻", name: "Code", desc: "Generates production code" },
                { icon: "🔍", name: "Review", desc: "Reviews PRs for issues" },
                { icon: "🧪", name: "Test", desc: "Writes unit & E2E tests" },
                { icon: "🚀", name: "Deploy", desc: "Handles CI/CD pipelines" },
                { icon: "💰", name: "Cost", desc: "Optimizes cloud spend" },
                { icon: "📚", name: "Training", desc: "Matches skills to courses" },
                { icon: "🎯", name: "Priority", desc: "Learns PM patterns" },
                { icon: "📊", name: "Analytics", desc: "Tracks performance" },
              ].map((agent, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-purple-500/50 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{agent.icon}</div>
                  <h3 className="font-bold text-white text-sm mb-1">{agent.name}</h3>
                  <p className="text-slate-500 text-xs">{agent.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Slide 6: Role Dashboards */}
        <section
          id="dashboards"
          className={`min-h-screen snap-start flex items-center justify-center px-6 bg-gradient-to-b from-slate-900 to-indigo-950/20 transition-all duration-1000 ${
            isVisible["dashboards"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-5xl w-full">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full text-sm mb-4">
                Role-Based Views
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Every Role, Their Dashboard
              </h2>
              <p className="text-xl text-slate-400">
                7 specialized views. Each person sees what matters to them.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: "👔", role: "Executive", metrics: "All projects, ROI, Talent" },
                { icon: "📊", role: "Director", metrics: "Departments, Resources" },
                { icon: "🎯", role: "Tech Lead", metrics: "Sprint, Allocation, PRs" },
                { icon: "💻", role: "Developer", metrics: "Tasks, AI savings, Code" },
                { icon: "🧪", role: "QA", metrics: "Test queue, Coverage" },
                { icon: "🚨", role: "Prod Support", metrics: "Incidents, MTTR, SLA" },
                { icon: "🔧", role: "Infrastructure", metrics: "Uptime, Deployments, Cost" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`bg-slate-800/50 rounded-xl p-5 border border-slate-700 ${i === 6 ? "md:col-span-4 md:max-w-xs md:mx-auto" : ""}`}
                >
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h3 className="font-bold text-white mb-1">{item.role}</h3>
                  <p className="text-slate-500 text-sm">{item.metrics}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Slide 7: Security & BYOK */}
        <section
          id="security"
          className={`min-h-screen snap-start flex items-center justify-center px-6 transition-all duration-1000 ${
            isVisible["security"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
                Enterprise Ready
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Your Keys. Your Cloud. Your Data.
              </h2>
              <p className="text-xl text-slate-400">
                BYOK (Bring Your Own Key) - Nothing leaves your infrastructure
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: "🔐", title: "Self-Hosted", desc: "Deploy on YOUR cloud (AWS, GCP, Azure)" },
                { icon: "🔑", title: "BYOK", desc: "Use YOUR API keys for AI providers" },
                { icon: "📋", title: "Audit Trail", desc: "Every AI action logged and auditable" },
                { icon: "🛡️", title: "SOC 2 Ready", desc: "Enterprise compliance support" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-white text-xl mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Slide 8: ROI */}
        <section
          id="roi"
          className={`min-h-screen snap-start flex items-center justify-center px-6 bg-gradient-to-b from-slate-900 to-green-950/20 transition-all duration-1000 ${
            isVisible["roi"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
                Return on Investment
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Measurable Impact
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                { metric: "40%", label: "Faster delivery", sub: "Same-day vs 6-9 weeks" },
                { metric: "60%", label: "Less rework", sub: "5-10% vs 30-40%" },
                { metric: "94%", label: "Talent retention", sub: "AI handles routine work" },
                { metric: "8hrs", label: "Saved per dev/week", sub: "Focus on creative work" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center"
                >
                  <div className="text-5xl font-bold text-green-400 mb-2">{item.metric}</div>
                  <div className="text-white font-semibold mb-1">{item.label}</div>
                  <div className="text-slate-500 text-sm">{item.sub}</div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/customer/roi"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
              >
                View Full ROI Calculator
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Slide 9: Features Roadmap */}
        <section
          id="features"
          className={`min-h-screen snap-start flex items-center justify-center px-6 transition-all duration-1000 ${
            isVisible["features"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-5xl w-full">
            <div className="text-center mb-10">
              <div className="inline-block px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-sm mb-4">
                Platform Capabilities
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                41+ Features Across 3 Phases
              </h2>
              <p className="text-xl text-slate-400">
                Built for enterprise scale. Deployed incrementally.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Phase 1 - Current */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-bold">LIVE</span>
                  <h3 className="text-lg font-bold text-white">Phase 1</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    "Meeting → Code flow",
                    "7 Role-based dashboards",
                    "Email & Slack agents",
                    "Code generation",
                    "PR review agent",
                    "Allocation tracking",
                    "Jira integration",
                    "GitHub integration",
                    "BYOK support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Phase 2 - Next */}
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl p-6 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-bold">Q2 2026</span>
                  <h3 className="text-lg font-bold text-white">Phase 2</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    "Zoom meeting MOM",
                    "AI Priority Learning",
                    "Test generation agent",
                    "Deploy agent",
                    "Settings toggles",
                    "Performance tracking",
                    "Training recommendations",
                    "Cost optimization",
                    "Multi-language MOM",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-400">
                      <span className="text-blue-400">○</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Phase 3 - Future */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded font-bold">Q4 2026</span>
                  <h3 className="text-lg font-bold text-white">Phase 3</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    "Data masking (PII)",
                    "Prod-like data setup",
                    "Use case data gen",
                    "VS Code extension",
                    "Azure DevOps",
                    "SOC 2 compliance",
                    "Mobile apps",
                    "Custom agents",
                    "Enterprise analytics",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-500">
                      <span className="text-purple-400">◇</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/customer/features"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
              >
                View All 41 Features
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Slide 10: Founding Partner Program */}
        <section
          id="founding-partner"
          className={`min-h-screen snap-start flex items-center justify-center px-6 bg-gradient-to-b from-slate-900 to-purple-950/30 transition-all duration-1000 ${
            isVisible["founding-partner"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 rounded-full text-sm mb-4">
                ⭐ Exclusive Offer
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Founding Partner Program
              </h2>
              <p className="text-xl text-slate-400">
                Limited to <span className="text-amber-400 font-bold">3 enterprise partners</span> in 2026
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-8 border border-amber-500/30 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">What Founding Partners Get</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: "🎯", title: "Dedicated Success Team", desc: "Personal onboarding and ongoing support" },
                  { icon: "🧠", title: "Custom AI Training", desc: "QUAD trained on YOUR codebase patterns" },
                  { icon: "⚡", title: "Priority Features", desc: "Your requests go to the front of the queue" },
                  { icon: "💎", title: "Founding Partner Pricing", desc: "Lock in pre-launch rates forever" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold text-white mb-4 text-center">Phase 1: Proof of Value (4 Weeks)</h3>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl mb-2">1️⃣</div>
                  <div className="text-white font-semibold">Select 1 Team</div>
                  <div className="text-slate-500 text-sm">5-10 developers</div>
                </div>
                <div>
                  <div className="text-2xl mb-2">2️⃣</div>
                  <div className="text-white font-semibold">Define Success</div>
                  <div className="text-slate-500 text-sm">Measurable metrics upfront</div>
                </div>
                <div>
                  <div className="text-2xl mb-2">3️⃣</div>
                  <div className="text-white font-semibold">Prove ROI</div>
                  <div className="text-slate-500 text-sm">Hit targets → Enterprise rollout</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 10: Contact */}
        <section
          id="contact"
          className={`min-h-screen snap-start flex items-center justify-center px-6 transition-all duration-1000 ${
            isVisible["contact"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="max-w-3xl w-full text-center">
            <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-6">
              Get Started
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Become a Founding Partner
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Only 3 spots available. Let&apos;s discuss if QUAD is right for your team.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/customer/demo"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
              >
                Try Interactive Demo
              </Link>
              <Link
                href="/customer/contact"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all text-lg"
              >
                Schedule a Call
              </Link>
            </div>

            <div className="text-slate-500">
              <a href="mailto:quad@quadframe.work" className="hover:text-white transition-colors">
                quad@quadframe.work
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
