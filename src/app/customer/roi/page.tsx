"use client";

import { useState } from "react";
import Link from "next/link";

export default function CustomerROI() {
  const [developers, setDevelopers] = useState(200);
  const [avgSalary, setAvgSalary] = useState(150000);
  const [currentCycleWeeks, setCurrentCycleWeeks] = useState(6);

  // Calculations
  const hourlyRate = avgSalary / 2080; // 2080 working hours per year
  const currentHoursPerFeature = currentCycleWeeks * 40;
  const quadHoursPerFeature = 6; // Average 6 hours with QUAD
  const hoursSaved = currentHoursPerFeature - quadHoursPerFeature;
  const featuresPerDevPerYear = 20; // Assume 20 features per dev per year
  const totalHoursSaved = hoursSaved * featuresPerDevPerYear * developers;
  const annualSavings = totalHoursSaved * hourlyRate;
  const platformCost = 399 * 12; // MATRIX tier annually
  const netSavings = annualSavings - platformCost;
  const roi = ((netSavings / platformCost) * 100).toFixed(0);

  return (
    <div className="text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
            ROI Calculator
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Calculate Your Savings
          </h1>
          <p className="text-slate-400">
            See how much your organization could save with QUAD Platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <h2 className="text-xl font-bold mb-6">Your Numbers</h2>

            {/* Developers */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">
                Number of Developers
              </label>
              <input
                type="range"
                min="10"
                max="500"
                value={developers}
                onChange={(e) => setDevelopers(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-2xl font-bold text-blue-400 mt-2">
                {developers} developers
              </div>
            </div>

            {/* Salary */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">
                Average Developer Salary
              </label>
              <input
                type="range"
                min="80000"
                max="250000"
                step="10000"
                value={avgSalary}
                onChange={(e) => setAvgSalary(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-2xl font-bold text-blue-400 mt-2">
                ${(avgSalary / 1000).toFixed(0)}K/year
              </div>
            </div>

            {/* Cycle Time */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">
                Current Feature Cycle (weeks)
              </label>
              <input
                type="range"
                min="2"
                max="12"
                value={currentCycleWeeks}
                onChange={(e) => setCurrentCycleWeeks(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-2xl font-bold text-blue-400 mt-2">
                {currentCycleWeeks} weeks
              </div>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-xl text-sm text-slate-400">
              <strong className="text-white">Assumptions:</strong>
              <ul className="mt-2 space-y-1">
                <li>• 20 features per developer per year</li>
                <li>• QUAD reduces cycle to ~6 hours average</li>
                <li>• MATRIX tier ($399/mo) for 51+ users</li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Annual Savings */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20">
              <div className="text-sm text-green-400 mb-2">Annual Savings</div>
              <div className="text-5xl font-bold text-green-400">
                ${(annualSavings / 1000000).toFixed(1)}M
              </div>
              <div className="text-slate-400 text-sm mt-2">
                {totalHoursSaved.toLocaleString()} hours saved @ ${hourlyRate.toFixed(0)}/hr
              </div>
            </div>

            {/* Platform Cost */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-400">Platform Cost</div>
                  <div className="text-2xl font-bold text-slate-300">
                    ${(platformCost).toLocaleString()}/year
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Net Savings</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${(netSavings / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>
            </div>

            {/* ROI */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-8 border border-purple-500/20">
              <div className="text-sm text-purple-400 mb-2">Return on Investment</div>
              <div className="text-5xl font-bold text-purple-400">
                {roi}x
              </div>
              <div className="text-slate-400 text-sm mt-2">
                Every $1 spent returns ${roi}
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-bold mb-4">Time Savings Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current cycle:</span>
                  <span className="text-red-400">{currentHoursPerFeature} hours/feature</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">With QUAD:</span>
                  <span className="text-green-400">{quadHoursPerFeature} hours/feature</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-3">
                  <span className="text-slate-400">Time saved per feature:</span>
                  <span className="text-blue-400 font-bold">{hoursSaved} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Improvement:</span>
                  <span className="text-green-400 font-bold">
                    {((1 - quadHoursPerFeature / currentHoursPerFeature) * 100).toFixed(0)}% faster
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Step Navigation */}
        <div className="mt-12 pt-12 border-t border-slate-700 text-center">
          <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-4">
            Step 4 of 5
          </div>
          <h2 className="text-2xl font-bold mb-4">Ready to Save ${(netSavings / 1000000).toFixed(1)}M/year?</h2>
          <p className="text-slate-400 mb-6">
            Let&apos;s discuss how QUAD can transform your engineering workflow.
          </p>
          <Link
            href="/customer/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
          >
            Schedule a Call
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
