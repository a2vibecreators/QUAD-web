"use client";

import { useState } from "react";
import Link from "next/link";

export default function CustomerROI() {
  const [developers, setDevelopers] = useState(200);
  const [avgSalary, setAvgSalary] = useState(150000);
  const [currentCycleWeeks, setCurrentCycleWeeks] = useState(6);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [useBYOK, setUseBYOK] = useState(false);

  // Enterprise Pricing (per user per month)
  const getPricingTier = (devCount: number, byok: boolean) => {
    if (devCount <= 5) return { name: "FREE", pricePerUserPerMonth: 0, aiCostPerUserPerMonth: 0 };
    if (devCount <= 50) {
      return {
        name: "PRO",
        pricePerUserPerMonth: byok ? 29 : 49,
        aiCostPerUserPerMonth: byok ? 15 : 0  // Customer pays ~$15/user/mo for AI
      };
    }
    return {
      name: "ENTERPRISE",
      pricePerUserPerMonth: byok ? 59 : 99,
      aiCostPerUserPerMonth: byok ? 25 : 0  // Customer pays ~$25/user/mo for AI
    };
  };

  const pricingTier = getPricingTier(developers, useBYOK);

  // Investment Costs
  const annualSubscription = pricingTier.pricePerUserPerMonth * developers * 12;
  const annualAICost = pricingTier.aiCostPerUserPerMonth * developers * 12; // Customer pays AI provider directly if BYOK
  const implementationCost = developers <= 50 ? 25000 : developers <= 200 ? 75000 : 150000;
  const trainingCost = developers * 500; // $500 per developer for training
  const integrationCost = 50000; // Jira, GitHub, Slack integration

  // Amortize one-time costs over 3 years for first-year investment
  const oneTimeCosts = implementationCost + trainingCost + integrationCost;
  const amortizedOneTimeCosts = oneTimeCosts / 3;
  const totalFirstYearInvestment = annualSubscription + annualAICost + amortizedOneTimeCosts;

  // Savings Calculations
  const hourlyRate = avgSalary / 2080; // 2080 working hours per year
  const currentHoursPerFeature = currentCycleWeeks * 40;
  const quadHoursPerFeature = 6; // Average 6 hours with QUAD
  const hoursSaved = currentHoursPerFeature - quadHoursPerFeature;
  const featuresPerDevPerYear = 20; // Assume 20 features per dev per year
  const totalHoursSaved = hoursSaved * featuresPerDevPerYear * developers;
  const annualSavings = totalHoursSaved * hourlyRate;

  // ROI Calculations
  const firstYearNetSavings = annualSavings - totalFirstYearInvestment;
  const threeYearTotalInvestment = ((annualSubscription + annualAICost) * 3) + oneTimeCosts;
  const threeYearTotalSavings = annualSavings * 3;
  const threeYearNetSavings = threeYearTotalSavings - threeYearTotalInvestment;
  const threeYearROI = totalFirstYearInvestment > 0 ? ((threeYearNetSavings / threeYearTotalInvestment) * 100).toFixed(0) : "∞";
  const paybackMonths = totalFirstYearInvestment > 0 ? Math.ceil((totalFirstYearInvestment / annualSavings) * 12) : 0;

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

            {/* BYOK Toggle */}
            <div className="mb-6 p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-white">Bring Your Own API Key (BYOK)</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {useBYOK
                      ? `Lower platform cost (${pricingTier.name}: $${pricingTier.pricePerUserPerMonth}/user/mo), but you pay AI provider ~$${pricingTier.aiCostPerUserPerMonth}/user/mo`
                      : `Platform includes AI costs (${pricingTier.name}: $${pricingTier.pricePerUserPerMonth}/user/mo)`
                    }
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useBYOK}
                  onChange={(e) => setUseBYOK(e.target.checked)}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Collapsible Assumptions */}
            <div className="p-4 bg-slate-700/30 rounded-xl text-sm">
              <button
                onClick={() => setShowAssumptions(!showAssumptions)}
                className="flex items-center justify-between w-full text-left"
              >
                <strong className="text-white">Calculation Details</strong>
                <span className="text-slate-400">{showAssumptions ? "▼" : "▶"}</span>
              </button>

              {showAssumptions && (
                <div className="mt-4 space-y-3 text-slate-300">
                  {/* Investment Breakdown */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-amber-600">
                    <p className="text-sm font-semibold text-amber-400 mb-2">💰 Investment (Year 1)</p>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between">
                        <span>QUAD Platform Subscription:</span>
                        <span className="text-amber-300 font-mono">${annualSubscription.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-slate-500 ml-4">
                        ${pricingTier.pricePerUserPerMonth}/user/mo × {developers} devs × 12
                      </div>

                      {useBYOK && annualAICost > 0 && (
                        <>
                          <div className="flex justify-between pt-2 border-t border-slate-700">
                            <span>AI Provider Cost (Anthropic):</span>
                            <span className="text-amber-300 font-mono">${annualAICost.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-slate-500 ml-4">
                            ~${pricingTier.aiCostPerUserPerMonth}/user/mo × {developers} devs × 12 (paid to Anthropic directly)
                          </div>
                        </>
                      )}

                      <div className="flex justify-between pt-2 border-t border-slate-700">
                        <span>Implementation:</span>
                        <span className="text-amber-300 font-mono">${(implementationCost / 3).toLocaleString()}/yr</span>
                      </div>
                      <div className="text-xs text-slate-500 ml-4">
                        ${implementationCost.toLocaleString()} one-time ÷ 3 years
                      </div>

                      <div className="flex justify-between">
                        <span>Training:</span>
                        <span className="text-amber-300 font-mono">${(trainingCost / 3).toLocaleString()}/yr</span>
                      </div>
                      <div className="text-xs text-slate-500 ml-4">
                        ${trainingCost.toLocaleString()} one-time ÷ 3 years
                      </div>

                      <div className="flex justify-between">
                        <span>Integration:</span>
                        <span className="text-amber-300 font-mono">${(integrationCost / 3).toLocaleString()}/yr</span>
                      </div>
                      <div className="text-xs text-slate-500 ml-4">
                        ${integrationCost.toLocaleString()} one-time ÷ 3 years
                      </div>

                      <div className="flex justify-between pt-2 border-t border-amber-600 font-bold">
                        <span className="text-white">Total Year 1 Investment:</span>
                        <span className="text-amber-400">${totalFirstYearInvestment.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Savings Calculation */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-green-600">
                    <p className="text-sm font-semibold text-green-400 mb-2">📈 Annual Savings</p>
                    <div className="text-xs space-y-1">
                      <div>1. Hours saved per feature: {hoursSaved} hrs</div>
                      <div>2. Features per year: {featuresPerDevPerYear} × {developers} devs = {featuresPerDevPerYear * developers}</div>
                      <div>3. Total hours saved: {hoursSaved} × {featuresPerDevPerYear * developers} = {totalHoursSaved.toLocaleString()} hrs</div>
                      <div>4. Hourly rate: ${avgSalary.toLocaleString()} ÷ 2,080 = ${hourlyRate.toFixed(2)}/hr</div>
                      <div className="pt-2 border-t border-green-600 font-bold">
                        <span className="text-white">Annual Savings:</span> <span className="text-green-400">${annualSavings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3-Year ROI */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-600">
                    <p className="text-sm font-semibold text-purple-400 mb-2">🎯 3-Year ROI</p>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between">
                        <span>Total Investment (3 years):</span>
                        <span className="text-purple-300 font-mono">${threeYearTotalInvestment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Savings (3 years):</span>
                        <span className="text-purple-300 font-mono">${threeYearTotalSavings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-purple-600 font-bold">
                        <span className="text-white">Net Gain (3 years):</span>
                        <span className="text-purple-400">${threeYearNetSavings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white">Payback Period:</span>
                        <span className="text-purple-400">{paybackMonths} months</span>
                      </div>
                    </div>
                  </div>

                  {/* Assumptions */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                    <p className="text-xs text-slate-400 mb-2">Assumptions</p>
                    <ul className="space-y-1 text-xs">
                      <li>• {featuresPerDevPerYear} features per developer per year</li>
                      <li>• QUAD reduces cycle to ~{quadHoursPerFeature} hours average</li>
                      <li>• Working hours: 2,080 per year (40 hrs/week × 52 weeks)</li>
                      <li>• One-time costs amortized over 3 years</li>
                    </ul>
                  </div>
                </div>
              )}
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

            {/* Investment & Savings */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-400">Year 1 Investment</div>
                  <div className="text-2xl font-bold text-amber-400">
                    ${(totalFirstYearInvestment / 1000000).toFixed(2)}M
                  </div>
                  {useBYOK && (
                    <div className="text-xs text-slate-500 mt-1">Includes AI costs (~${(annualAICost / 1000).toFixed(0)}K)</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Year 1 Net Savings</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${(firstYearNetSavings / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>
            </div>

            {/* ROI */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-8 border border-purple-500/20">
              <div className="text-sm text-purple-400 mb-2">3-Year ROI</div>
              <div className="text-5xl font-bold text-purple-400">
                {threeYearROI}%
              </div>
              <div className="text-slate-400 text-sm mt-2">
                Payback in {paybackMonths} months
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
          <h2 className="text-2xl font-bold mb-4">Ready to Save ${(firstYearNetSavings / 1000000).toFixed(1)}M in Year 1?</h2>
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
