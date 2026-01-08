"use client";

import { useState } from "react";
import Link from "next/link";

export default function CustomerROI() {
  const [developers, setDevelopers] = useState(200);
  const [avgSalary, setAvgSalary] = useState(150000);
  const [currentCycleWeeks, setCurrentCycleWeeks] = useState(6);
  const [investmentAmount, setInvestmentAmount] = useState(500000); // Customer investment slider
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Savings Calculations (based on time saved)
  const hourlyRate = avgSalary / 2080; // 2080 working hours per year
  const currentHoursPerFeature = currentCycleWeeks * 40;
  const quadHoursPerFeature = 6; // Average 6 hours with QUAD
  const hoursSaved = currentHoursPerFeature - quadHoursPerFeature;
  const featuresPerDevPerYear = 20; // Assume 20 features per dev per year
  const totalHoursSaved = hoursSaved * featuresPerDevPerYear * developers;
  const annualSavings = totalHoursSaved * hourlyRate;

  // Investment/Partnership Model
  const netProfit = annualSavings - investmentAmount;
  const roi = investmentAmount > 0 ? ((netProfit / investmentAmount) * 100).toFixed(0) : "∞";
  const paybackMonths = investmentAmount > 0 && annualSavings > investmentAmount
    ? Math.ceil((investmentAmount / annualSavings) * 12)
    : annualSavings > 0
    ? Math.ceil((investmentAmount / annualSavings) * 12)
    : 0;

  return (
    <div className="text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
            Investment & Partnership Calculator
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Your Investment, Our Dedication
          </h1>
          <p className="text-slate-400">
            See the ROI when you partner with QUAD to build a 100% customized platform
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

            {/* Investment Amount */}
            <div className="mb-6 p-4 bg-purple-900/20 rounded-xl border border-purple-500/30">
              <label className="block text-sm text-slate-400 mb-2">
                Your Investment in QUAD (Year 1)
              </label>
              <input
                type="range"
                min="200000"
                max="1000000"
                step="50000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="text-2xl font-bold text-purple-400 mt-2">
                ${(investmentAmount / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-slate-400 mt-1">
                We build a 100% customized platform dedicated to your organization
              </div>
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
                  {/* What You Get */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-600">
                    <p className="text-sm font-semibold text-purple-400 mb-2">🎯 What You Get (Year 1)</p>
                    <div className="text-xs space-y-1">
                      <div>✅ 100% customized QUAD platform for your org</div>
                      <div>✅ 14 AI Agents (Email, Messenger, Code, Review, Test, Deploy, etc.)</div>
                      <div>✅ Role-based dashboards (7+ roles)</div>
                      <div>✅ Jira, GitHub, Slack integration</div>
                      <div>✅ Self-hosted in your cloud (AWS/GCP/Azure)</div>
                      <div>✅ Training & onboarding for your team</div>
                      <div>✅ Dedicated support from QUAD team</div>
                      <div>✅ Custom features based on your needs</div>
                      <div className="pt-2 border-t border-purple-600 font-bold text-white">
                        100% of our focus goes to YOUR success
                      </div>
                    </div>
                  </div>

                  {/* Savings Calculation */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-green-600">
                    <p className="text-sm font-semibold text-green-400 mb-2">📈 Your Annual Savings</p>
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

                  {/* ROI Breakdown */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-amber-600">
                    <p className="text-sm font-semibold text-amber-400 mb-2">💰 ROI Breakdown</p>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between">
                        <span>Your Investment (Year 1):</span>
                        <span className="text-amber-300 font-mono">${investmentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Your Savings (Year 1):</span>
                        <span className="text-green-300 font-mono">${annualSavings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-amber-600 font-bold">
                        <span className="text-white">Net Profit (Year 1):</span>
                        <span className="text-green-400">${netProfit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white">ROI:</span>
                        <span className="text-purple-400">{roi}%</span>
                      </div>
                      {paybackMonths > 0 && paybackMonths <= 12 && (
                        <div className="flex justify-between">
                          <span className="text-white">Payback Period:</span>
                          <span className="text-purple-400">{paybackMonths} months</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assumptions */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                    <p className="text-xs text-slate-400 mb-2">Assumptions</p>
                    <ul className="space-y-1 text-xs">
                      <li>• {featuresPerDevPerYear} features per developer per year</li>
                      <li>• QUAD reduces cycle to ~{quadHoursPerFeature} hours average</li>
                      <li>• Working hours: 2,080 per year (40 hrs/week × 52 weeks)</li>
                      <li>• Partnership model: Your investment funds Year 1 development</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Your Investment */}
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl p-8 border border-purple-500/20">
              <div className="text-sm text-purple-400 mb-2">Your Investment</div>
              <div className="text-5xl font-bold text-purple-400">
                ${(investmentAmount / 1000000).toFixed(2)}M
              </div>
              <div className="text-slate-400 text-sm mt-2">
                Year 1 partnership funding
              </div>
            </div>

            {/* Your Savings */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20">
              <div className="text-sm text-green-400 mb-2">Your Savings</div>
              <div className="text-5xl font-bold text-green-400">
                ${(annualSavings / 1000000).toFixed(1)}M
              </div>
              <div className="text-slate-400 text-sm mt-2">
                {totalHoursSaved.toLocaleString()} hours saved @ ${hourlyRate.toFixed(0)}/hr
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-8 border border-amber-500/20">
              <div className="text-sm text-amber-400 mb-2">Your Net Profit (Year 1)</div>
              <div className="text-5xl font-bold text-amber-400">
                ${(netProfit / 1000000).toFixed(1)}M
              </div>
              <div className="text-slate-400 text-sm mt-2">
                Savings - Investment = Profit
              </div>
            </div>

            {/* ROI */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 border border-blue-500/20">
              <div className="text-sm text-blue-400 mb-2">Your ROI (Year 1)</div>
              <div className="text-5xl font-bold text-blue-400">
                {roi}%
              </div>
              <div className="text-slate-400 text-sm mt-2">
                {paybackMonths > 0 && paybackMonths <= 12 ? `Payback in ${paybackMonths} months` : 'Massive return on investment'}
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

        {/* Partnership Value Proposition */}
        <div className="mt-12 pt-12 border-t border-slate-700">
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-8 border border-purple-500/30">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
                The Partnership Model
              </div>
              <h2 className="text-3xl font-bold mb-4">We Grow Together</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-bold mb-2">You Invest</h3>
                <p className="text-sm text-slate-400">
                  Fund Year 1 development (~$500K). Your capital enables us to build a 100% customized platform dedicated to your organization.
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="font-bold mb-2">We Build</h3>
                <p className="text-sm text-slate-400">
                  100% of our focus goes to YOUR success. We build, deploy, train, and support your custom QUAD platform with no distractions.
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-bold mb-2">You Save</h3>
                <p className="text-sm text-slate-400">
                  You save ${(annualSavings / 1000000).toFixed(1)}M+ in Year 1. After Year 1, discuss licensing, continued partnership, or lower maintenance costs.
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-400 mb-6">
                <strong className="text-white">First customer advantage:</strong> We don&apos;t split our time. You get a fully dedicated team building exactly what you need.
              </p>
              <Link
                href="/customer/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all text-lg"
              >
                Let&apos;s Discuss Partnership
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
