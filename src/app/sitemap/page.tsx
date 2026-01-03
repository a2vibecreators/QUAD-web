"use client";

import Link from "next/link";
import { useState } from "react";
import PageNavigation from "@/components/PageNavigation";

export default function SitemapPage() {
  // In a real app, this would come from auth context
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const publicPages = {
    "Getting Started": [
      { href: "/", title: "Home", desc: "QUAD Framework overview with 4-4-4 principle" },
      { href: "/discovery", title: "Discovery", desc: "Introduction to QUAD methodology" },
      { href: "/pitch", title: "Pitch", desc: "Value proposition for stakeholders" },
      { href: "/mm-pitch", title: "MM Pitch", desc: "Management meeting pitch deck" },
    ],
    "Core Concepts": [
      { href: "/concept", title: "Main Concept", desc: "Complete QUAD methodology deep-dive" },
      { href: "/flow", title: "Source of Truth Flow", desc: "Animated SVG visualization" },
      { href: "/architecture", title: "Agent Architecture", desc: "QACA - How agents communicate" },
      { href: "/details", title: "Technical Details", desc: "Agent patterns, flow docs, hierarchy" },
      { href: "/jargons", title: "Terminology", desc: "QUAD jargon glossary" },
      { href: "/summary", title: "Executive Summary", desc: "High-level overview" },
    ],
    "Case Studies": [
      { href: "/case-study", title: "Case Studies", desc: "5 domains: E-commerce, Hospital, Education, Manufacturing, Software" },
      { href: "/explainer", title: "Explainer", desc: "Visual explanation of QUAD concepts" },
    ],
    "Interactive": [
      { href: "/demo", title: "Dashboard Demo", desc: "See how a QUAD dashboard looks" },
      { href: "/quiz", title: "QUAD Quiz", desc: "Test your understanding" },
      { href: "/cheatsheet", title: "Cheat Sheet", desc: "Searchable quick reference" },
    ],
    "Platform": [
      { href: "/platform", title: "QUAD Platform", desc: "Self-hosted or SaaS with enterprise features" },
      { href: "/tools", title: "Tools Catalog", desc: "35+ integrations for your stack" },
      { href: "/adoption-matrix", title: "Adoption Matrix", desc: "Track your AI journey", badge: "NEW" },
    ],
    "Account": [
      { href: "/auth/login", title: "Login", desc: "Sign in to your account" },
      { href: "/auth/signup", title: "Sign Up", desc: "Create a new account" },
    ],
    "Support": [
      { href: "/docs", title: "Documentation", desc: "Complete methodology docs" },
      { href: "/support", title: "Support", desc: "Get help, report issues, or give feedback" },
    ],
  };

  const loggedInPages = {
    "Your Workspace": [
      { href: "/dashboard", title: "Dashboard", desc: "Your projects and metrics" },
      { href: "/configure", title: "Configure", desc: "Setup your QUAD environment" },
      { href: "/configure/integrations", title: "Integrations", desc: "Connect your tools" },
      { href: "/blueprint-agent", title: "Blueprint Agent", desc: "AI-powered project planning" },
    ],
    "Domain Management": [
      { href: "/auth/select-domain", title: "Switch Domain", desc: "Change your active domain" },
      { href: "/onboarding", title: "Onboarding", desc: "Complete your setup" },
    ],
    ...publicPages,
  };

  const sitemap = isLoggedIn ? loggedInPages : publicPages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation />

      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-black mb-4 text-center">
            <span className="gradient-text">Sitemap</span>
          </h1>
          <p className="text-xl text-slate-400 text-center mb-8 max-w-2xl mx-auto">
            Navigate through all pages of the QUAD Framework. Find what you need quickly.
          </p>

          {/* Toggle for demo purposes */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 glass-card rounded-full px-4 py-2">
              <span className={`text-sm ${!isLoggedIn ? "text-white" : "text-slate-500"}`}>Guest</span>
              <button
                onClick={() => setIsLoggedIn(!isLoggedIn)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isLoggedIn ? "bg-blue-500" : "bg-slate-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isLoggedIn ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-sm ${isLoggedIn ? "text-white" : "text-slate-500"}`}>Logged In</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-blue-400">{Object.values(sitemap).flat().length}</div>
              <div className="text-sm text-slate-400">Pages</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-green-400">5</div>
              <div className="text-sm text-slate-400">Case Studies</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-purple-400">35+</div>
              <div className="text-sm text-slate-400">Tool Integrations</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-amber-400">4-4-4</div>
              <div className="text-sm text-slate-400">Principle</div>
            </div>
          </div>

          {/* Sitemap by Category */}
          <div className="space-y-8">
            {Object.entries(sitemap).map(([category, pages]) => (
              <div key={category} className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  {category}
                  {category === "Your Workspace" && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                      Logged In Only
                    </span>
                  )}
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {pages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <span className="text-blue-400 group-hover:text-blue-300">→</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white group-hover:text-blue-300 transition-colors">
                            {page.title}
                          </span>
                          {"badge" in page && page.badge && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                              {page.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-500">{page.desc}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* QUAD Meaning */}
          <div className="mt-12 glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">What is QUAD?</h2>
            <div className="space-y-4">
              <div>
                <p className="text-blue-300 font-semibold mb-1">Quick Unified Agentic Development</p>
                <p className="text-slate-400 text-sm">A modern software development methodology for the AI era.</p>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-400">Q</div>
                  <div className="text-sm text-slate-400">Question</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-400">U</div>
                  <div className="text-sm text-slate-400">Understand</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-amber-400">A</div>
                  <div className="text-sm text-slate-400">Allocate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-purple-400">D</div>
                  <div className="text-sm text-slate-400">Deliver</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-4-4 Principle - Secondary */}
          <div className="mt-6 glass-card rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-slate-500">Bonus:</span>
              <span className="text-emerald-400 font-medium">4 hrs/day × 4 days/wk = 4X efficiency</span>
              <span className="text-slate-500">when AI handles the routine</span>
            </div>
          </div>

          {/* Support Link */}
          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-4">Need help? Have questions?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Support Page
              </Link>
              <a
                href="mailto:suman.addanki@gmail.com?subject=QUAD%20Framework%20Help"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Email: suman.addanki@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
