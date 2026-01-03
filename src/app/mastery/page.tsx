"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_email: string;
  user_name: string;
  tickets_completed: number;
  story_points: number;
  complexity_points: number;
  total_hours: number;
  estimated_hours: number;
  bug_fixes: number;
  features: number;
  on_time_deliveries: number;
  late_deliveries: number;
  time_accuracy_percent: number;
  on_time_percent: number;
  score: number;
}

interface GamificationData {
  period: string;
  start_date: string;
  end_date: string;
  leaderboard: LeaderboardEntry[];
  my_stats: LeaderboardEntry | null;
  team_totals: {
    tickets_completed: number;
    story_points: number;
    complexity_points: number;
    total_hours: number;
    bug_fixes: number;
    features: number;
  };
}

const rankEmojis: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

// QUAD-based tier system for developer levels
interface QuadTier {
  name: string;
  emoji: string;
  minScore: number;
  color: string;
  bgColor: string;
  description: string;
}

const quadTiers: QuadTier[] = [
  { name: "Deliverer", emoji: "🚀", minScore: 500, color: "text-green-700", bgColor: "bg-green-100", description: "Consistently shipping high-quality work" },
  { name: "Allocator", emoji: "⚡", minScore: 200, color: "text-orange-700", bgColor: "bg-orange-100", description: "Taking ownership and driving results" },
  { name: "Understander", emoji: "🎯", minScore: 50, color: "text-purple-700", bgColor: "bg-purple-100", description: "Deep understanding of the codebase" },
  { name: "Questioner", emoji: "❓", minScore: 0, color: "text-blue-700", bgColor: "bg-blue-100", description: "Learning and asking good questions" },
];

const getQuadTier = (score: number): QuadTier => {
  return quadTiers.find(tier => score >= tier.minScore) || quadTiers[quadTiers.length - 1];
};

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "all">("week");
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Fetch domains
  const fetchDomains = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch("/api/domains/list", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
      }
    } catch (err) {
      console.error("Error fetching domains:", err);
    }
  }, [session?.accessToken]);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      let url = `/api/gamification?period=${period}`;
      if (selectedDomain) url += `&domain_id=${selectedDomain}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.ok) {
        const responseData = await res.json();
        setData(responseData);
      } else if (res.status === 401) {
        router.push("/auth/login");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch leaderboard");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, period, selectedDomain, router]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchDomains();
    }
  }, [session?.accessToken, fetchDomains]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchLeaderboard();
    }
  }, [session?.accessToken, period, selectedDomain, fetchLeaderboard]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Domain Filter */}
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Domains</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Period Filter */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                {(["week", "month", "quarter", "all"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-2 text-sm capitalize ${
                      period === p ? "bg-purple-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p === "all" ? "All Time" : p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={fetchLeaderboard} className="ml-4 text-red-600 underline">Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <div className="max-w-6xl mx-auto p-4">
          {/* Period Display */}
          <div className="text-center mb-6">
            <span className="text-gray-500">
              {formatDate(data.start_date)} - {formatDate(data.end_date)}
            </span>
          </div>

          {/* My Stats Card */}
          {data.my_stats && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-purple-200 text-sm mb-1">Your Rank</div>
                  <div className="text-4xl font-bold flex items-center gap-2">
                    {rankEmojis[data.my_stats.rank] || `#${data.my_stats.rank}`}
                    {!rankEmojis[data.my_stats.rank] && <span>#{data.my_stats.rank}</span>}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-purple-200 text-sm mb-1">QUAD Tier</div>
                  <div className="text-3xl font-bold flex items-center gap-2 justify-center">
                    <span>{getQuadTier(data.my_stats.score).emoji}</span>
                    <span>{getQuadTier(data.my_stats.score).name}</span>
                  </div>
                  <div className="text-purple-200 text-xs mt-1">{getQuadTier(data.my_stats.score).description}</div>
                </div>
                <div className="text-right">
                  <div className="text-purple-200 text-sm mb-1">Total Score</div>
                  <div className="text-4xl font-bold">{data.my_stats.score.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{data.my_stats.tickets_completed}</div>
                  <div className="text-purple-200 text-xs">Tickets</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{data.my_stats.story_points}</div>
                  <div className="text-purple-200 text-xs">Story Points</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{data.my_stats.complexity_points}</div>
                  <div className="text-purple-200 text-xs">Complexity Pts</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{data.my_stats.on_time_percent}%</div>
                  <div className="text-purple-200 text-xs">On-Time</div>
                </div>
              </div>
            </div>
          )}

          {/* Team Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{data.team_totals.tickets_completed}</div>
              <div className="text-gray-500 text-sm">Team Tickets Completed</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{data.team_totals.story_points}</div>
              <div className="text-gray-500 text-sm">Total Story Points</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{Math.round(data.team_totals.total_hours)}h</div>
              <div className="text-gray-500 text-sm">Total Hours Logged</div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Rankings</h2>
            </div>

            {data.leaderboard.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Developer</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tickets</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Story Pts</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Complexity</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">On-Time</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.leaderboard.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className={`hover:bg-gray-50 ${
                        entry.user_id === data.my_stats?.user_id ? "bg-purple-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl">{rankEmojis[entry.rank] || `#${entry.rank}`}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700 mr-3">
                            {entry.user_name?.[0]?.toUpperCase() || entry.user_email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{entry.user_name || "Unknown"}</span>
                              {/* QUAD Tier Badge */}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getQuadTier(entry.score).bgColor} ${getQuadTier(entry.score).color}`}>
                                {getQuadTier(entry.score).emoji} {getQuadTier(entry.score).name}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{entry.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-medium">{entry.tickets_completed}</div>
                        <div className="text-xs text-gray-500">
                          {entry.features}F / {entry.bug_fixes}B
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          {entry.story_points}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                          {entry.complexity_points}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`font-medium ${entry.on_time_percent >= 80 ? "text-green-600" : entry.on_time_percent >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                          {entry.on_time_percent}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`font-medium ${entry.time_accuracy_percent >= 80 ? "text-green-600" : entry.time_accuracy_percent >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                          {entry.time_accuracy_percent}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-lg text-gray-900">{entry.score.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🏆</div>
                <p>No completed tickets in this period yet.</p>
                <p className="text-sm mt-2">Complete some tickets to see your ranking!</p>
              </div>
            )}
          </div>

          {/* QUAD Tier Legend */}
          <div className="mt-8 bg-white rounded-xl shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">🎖️ QUAD Developer Tiers</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              {quadTiers.slice().reverse().map((tier) => (
                <div key={tier.name} className={`${tier.bgColor} rounded-lg p-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{tier.emoji}</span>
                    <span className={`font-semibold ${tier.color}`}>{tier.name}</span>
                  </div>
                  <div className="text-xs text-gray-600">{tier.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{tier.minScore}+ score</div>
                </div>
              ))}
            </div>
          </div>

          {/* Complexity Legend */}
          <div className="mt-4 bg-white rounded-xl shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">⚡ Complexity Point System</h3>
            <div className="flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">1 pt</span>
                <span className="text-gray-600">Simple</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">2 pts</span>
                <span className="text-gray-600">Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded">4 pts</span>
                <span className="text-gray-600">Complex</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded">8 pts</span>
                <span className="text-gray-600">Very Complex</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded">16 pts</span>
                <span className="text-gray-600">Extremely Complex</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
