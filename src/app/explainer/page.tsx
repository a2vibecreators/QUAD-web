"use client";

import { useState } from "react";
import PageNavigation from "@/components/PageNavigation";
import QUADExplainer from "@/components/QUADExplainer";

export default function ExplainerPage() {
  const [key, setKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900">
      <PageNavigation />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">QUAD Framework Explainer</h1>
          <p className="text-slate-400">
            Watch how the 4 Circles and AI Agents work together
          </p>
        </div>

        {/* Animated Explainer */}
        <div className="mb-12">
          <QUADExplainer key={key} onComplete={() => {}} />
        </div>

        {/* Restart Button */}
        <div className="text-center mb-12">
          <button
            onClick={() => setKey(k => k + 1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Restart Animation
          </button>
        </div>

        {/* Text Explanation */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">The 4 Circles</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 text-lg">1</span>
                <div>
                  <div className="font-medium text-white">Management</div>
                  <div className="text-sm text-slate-400">BA, PM, Tech Lead - 80% business focus</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 text-lg">2</span>
                <div>
                  <div className="font-medium text-white">Development</div>
                  <div className="text-sm text-slate-400">Full Stack, Backend, UI, Mobile - 70% technical</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 text-lg">3</span>
                <div>
                  <div className="font-medium text-white">QA</div>
                  <div className="text-sm text-slate-400">QA Engineers, Automation, Security - 70% technical</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 text-lg">4</span>
                <div>
                  <div className="font-medium text-white">Infrastructure</div>
                  <div className="text-sm text-slate-400">DevOps, SRE, Cloud, DBA - 80% technical</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">AI Agents</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-white">Story Agent</div>
                  <div className="text-sm text-slate-400">Expands user stories with acceptance criteria</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-white">Dev Agent</div>
                  <div className="text-sm text-slate-400">Generates code from Flow Documents</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-white">Test Agent</div>
                  <div className="text-sm text-slate-400">Creates test cases from acceptance criteria</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-white">Deploy Agent</div>
                  <div className="text-sm text-slate-400">Handles CI/CD and deployments</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
