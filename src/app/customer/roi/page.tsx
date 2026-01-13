"use client";

import { useState } from "react";
import Link from "next/link";

export default function CustomerROI() {
  const [developers, setDevelopers] = useState(200);
  const [avgSalary, setAvgSalary] = useState(150000);
  const [currentCycleWeeks, setCurrentCycleWeeks] = useState(6);
  const [adoptionPhase, setAdoptionPhase] = useState(1); // 1=Months 1-3, 2=Months 4-6, 3=Months 7-12, 4=Year 2+
  const [investmentAmount, setInvestmentAmount] = useState(500000); // Customer investment slider
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Adoption Phase Mapping (realistic ramp-up) - Conservative estimates
  const adoptionPhaseHours: { [key: number]: { hours: number; label: string; description: string } } = {
    1: { hours: 210, label: "Months 1-3", description: "Learning Phase (~15% faster)" },
    2: { hours: 180, label: "Months 4-6", description: "Getting Comfortable (~25% faster)" },
    3: { hours: 140, label: "Months 7-12", description: "Accelerating (~42% faster)" },
    4: { hours: 100, label: "Year 2+", description: "Full Adoption (~58% faster)" },
  };

  // Savings Calculations (based on time saved)
  const hourlyRate = avgSalary / 2080; // 2080 working hours per year
  const currentHoursPerFeature = currentCycleWeeks * 40;
  const quadHoursPerFeature = adoptionPhaseHours[adoptionPhase].hours; // Dynamic based on adoption phase
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

  // Business Impact Metrics Calculations
  const featuresBeforeQUAD = featuresPerDevPerYear * developers;
  const featuresAfterQUAD = (featuresPerDevPerYear * 10) * developers;
  const velocityMultiplier = 10;
  const equivalentDevs = Math.floor(totalHoursSaved / 2080);
  const speedImprovement = Math.floor((1 - quadHoursPerFeature / currentHoursPerFeature) * 100);
  const cycleTimeReduction = speedImprovement;
  const velocityIncrease = 90;
  const qualityImprovement = 70;
  const riskScore = Math.floor(
    cycleTimeReduction * 0.4 +
    velocityIncrease * 0.3 +
    qualityImprovement * 0.3
  );
  const innovationMultiplier = velocityMultiplier;

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
            See how Fortune 100 companies like MassMutual achieve measurable ROI when partnering with QUAD to build 100% customized platforms
          </p>
        </div>

        {/* Calculator Inputs */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-12">
          <h2 className="text-xl font-bold mb-6 text-center">Your Numbers</h2>

          <div className="grid md:grid-cols-3 gap-6">

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

            {/* QUAD Adoption Phase */}
            <div className="mb-6 p-4 bg-green-900/20 rounded-xl border border-green-500/30">
              <label className="block text-sm text-slate-400 mb-2">
                🚀 QUAD Adoption Phase
              </label>
              <input
                type="range"
                min="1"
                max="4"
                value={adoptionPhase}
                onChange={(e) => setAdoptionPhase(Number(e.target.value))}
                className="w-full accent-green-500"
              />
              <div className="text-lg font-bold text-green-400 mt-2">
                {adoptionPhaseHours[adoptionPhase].label}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {adoptionPhaseHours[adoptionPhase].description}
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

            {/* Business Impact Dashboard */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm mb-4">
                  📊 Business Impact Dashboard
                </div>
                <h3 className="text-2xl font-bold mb-2">Beyond the Numbers</h3>
                <p className="text-slate-400 text-sm">Real-World Impact Across Your Organization</p>
              </div>

              {/* Top Row: 3 Metrics */}
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* Velocity Multiplier */}
                <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-6 border border-purple-500/20">
                  <div className="text-4xl mb-3">🚀</div>
                  <h4 className="font-semibold text-white mb-2">Velocity Multiplier</h4>
                  <div className="text-3xl font-bold text-purple-400 mb-2">{velocityMultiplier}x</div>
                  <p className="text-sm text-slate-400 mb-3">faster delivery</p>
                  <div className="text-xs text-slate-500">
                    {featuresAfterQUAD.toLocaleString()} features vs {featuresBeforeQUAD.toLocaleString()} before
                  </div>
                </div>

                {/* Capacity Freed */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20">
                  <div className="text-4xl mb-3">👥</div>
                  <h4 className="font-semibold text-white mb-2">Capacity Freed</h4>
                  <div className="text-3xl font-bold text-blue-400 mb-2">{equivalentDevs}</div>
                  <p className="text-sm text-slate-400 mb-3">developers equivalent</p>
                  <div className="text-xs text-slate-500">
                    Like hiring {equivalentDevs} more devs
                  </div>
                </div>

                {/* Speed Gain */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20">
                  <div className="text-4xl mb-3">⏱️</div>
                  <h4 className="font-semibold text-white mb-2">Speed Gain</h4>
                  <div className="text-3xl font-bold text-green-400 mb-2">{speedImprovement}%</div>
                  <p className="text-sm text-slate-400 mb-3">faster time to market</p>
                  <div className="text-xs text-slate-500">
                    {quadHoursPerFeature} hrs vs {currentHoursPerFeature} hrs
                  </div>
                </div>
              </div>

              {/* Bottom Row: 2 Metrics */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Risk Reduction */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
                  <div className="text-4xl mb-3">🛡️</div>
                  <h4 className="font-semibold text-white mb-2">Risk Reduction</h4>
                  <div className="text-3xl font-bold text-amber-400 mb-2">{riskScore}%</div>
                  <p className="text-sm text-slate-400 mb-3">lower risk exposure</p>
                  <div className="text-xs text-slate-500">
                    Fewer bugs, better compliance, higher quality
                  </div>
                </div>

                {/* Innovation Capacity */}
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-xl p-6 border border-pink-500/20">
                  <div className="text-4xl mb-3">💡</div>
                  <h4 className="font-semibold text-white mb-2">Innovation Capacity</h4>
                  <div className="text-3xl font-bold text-pink-400 mb-2">{innovationMultiplier}x</div>
                  <p className="text-sm text-slate-400 mb-3">more experiments/year</p>
                  <div className="text-xs text-slate-500">
                    More ML models, A/B tests, competitive advantages
                  </div>
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
