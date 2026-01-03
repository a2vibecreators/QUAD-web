'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PieChart, BarChart, BurndownChart } from '@/components/charts';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface CycleProgress {
  id: string;
  name: string;
  domain: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  total_tickets: number;
  completed_tickets: number;
  completion_percentage: number;
  total_points: number;
  completed_points: number;
  velocity: number;
}

interface DashboardData {
  summary: {
    total_tickets: number;
    open_tickets: number;
    total_requirements: number;
    pending_approvals: number;
    active_domains: number;
  };
  charts: {
    tickets_by_status: { title: string; data: ChartData[] };
    tickets_by_priority: { title: string; data: ChartData[] };
    tickets_by_type: { title: string; data: ChartData[] };
    requirements_by_status: { title: string; data: ChartData[] };
  };
  cycles: CycleProgress[];
  recent_activity: Array<{
    type: string;
    id: string;
    reference: string;
    title: string;
    status: string;
    domain: string;
    timestamp: string;
  }>;
}

interface BurndownData {
  cycle: {
    id: string;
    name: string;
    domain: string;
    start_date: string;
    end_date: string;
  };
  summary: {
    total_work: number;
    completed_work: number;
    remaining_work: number;
    percent_complete: number;
    velocity_per_day: number;
    days_elapsed: number;
    days_remaining: number;
    on_track: boolean;
  };
  burndown: Array<{
    date: string;
    ideal: number;
    actual: number | null;
    completed: number;
  }>;
}

interface VelocityData {
  summary: {
    average_velocity: number;
    trend: 'improving' | 'stable' | 'declining';
    average_completion_rate: number;
    total_cycles_analyzed: number;
  };
  chart: {
    data: Array<{
      label: string;
      committed: number;
      completed: number;
    }>;
  };
  recommendations: string[];
}

interface TeamData {
  summary: {
    total_members: number;
    total_tickets_assigned: number;
    unassigned_tickets: number;
    overloaded_members: number;
  };
  charts: {
    workload_distribution: { data: ChartData[] };
    points_by_member: {
      data: Array<{
        label: string;
        assigned: number;
        completed: number;
      }>;
    };
  };
  members: Array<{
    user_id: string;
    name: string | null;
    email: string;
    tickets_assigned: number;
    tickets_completed: number;
    points_assigned: number;
    workload_status: 'light' | 'normal' | 'heavy' | 'overloaded';
  }>;
  alerts: string[];
}

export default function ReportingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'burndown' | 'velocity' | 'team'>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Load dashboard data
  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session]);

  // Load burndown when cycle is selected
  useEffect(() => {
    if (selectedCycleId && activeTab === 'burndown') {
      loadBurndownData(selectedCycleId);
    }
  }, [selectedCycleId, activeTab]);

  // Load velocity data when tab is active
  useEffect(() => {
    if (session && activeTab === 'velocity') {
      loadVelocityData();
    }
  }, [session, activeTab]);

  // Load team data when tab is active
  useEffect(() => {
    if (session && activeTab === 'team') {
      loadTeamData();
    }
  }, [session, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${(session as { accessToken?: string })?.accessToken || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        // Auto-select first cycle if available
        if (data.cycles && data.cycles.length > 0) {
          setSelectedCycleId(data.cycles[0].id);
        }
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadBurndownData = async (cycleId: string) => {
    try {
      const response = await fetch(`/api/dashboard/cycles/${cycleId}/burndown`, {
        headers: {
          'Authorization': `Bearer ${(session as { accessToken?: string })?.accessToken || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBurndownData(data);
      }
    } catch (err) {
      console.error('Burndown error:', err);
    }
  };

  const loadVelocityData = async () => {
    try {
      const response = await fetch('/api/dashboard/velocity', {
        headers: {
          'Authorization': `Bearer ${(session as { accessToken?: string })?.accessToken || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVelocityData(data);
      }
    } catch (err) {
      console.error('Velocity error:', err);
    }
  };

  const loadTeamData = async () => {
    try {
      const response = await fetch('/api/dashboard/team', {
        headers: {
          'Authorization': `Bearer ${(session as { accessToken?: string })?.accessToken || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTeamData(data);
      }
    } catch (err) {
      console.error('Team error:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Project Reports</h1>
              <p className="text-slate-400 mt-1">Analytics and insights for your projects</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                ← Dashboard
              </Link>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/30 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {(['overview', 'burndown', 'velocity', 'team'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'burndown' && '📉 Burndown'}
                {tab === 'velocity' && '🚀 Velocity'}
                {tab === 'team' && '👥 Team'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.summary.total_tickets}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Open Tickets</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardData.summary.open_tickets}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Requirements</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardData.summary.total_requirements}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-amber-600">{dashboardData.summary.pending_approvals}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Active Domains</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.summary.active_domains}</p>
              </div>
            </div>

            {/* Pie Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PieChart
                title={dashboardData.charts.tickets_by_status.title}
                data={dashboardData.charts.tickets_by_status.data}
              />
              <PieChart
                title={dashboardData.charts.tickets_by_priority.title}
                data={dashboardData.charts.tickets_by_priority.data}
              />
              <PieChart
                title={dashboardData.charts.tickets_by_type.title}
                data={dashboardData.charts.tickets_by_type.data}
              />
              <PieChart
                title={dashboardData.charts.requirements_by_status.title}
                data={dashboardData.charts.requirements_by_status.data}
              />
            </div>

            {/* Active Cycles Progress */}
            {dashboardData.cycles.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Cycles Progress</h3>
                <div className="space-y-4">
                  {dashboardData.cycles.map((cycle) => (
                    <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{cycle.name}</h4>
                          <p className="text-sm text-gray-500">{cycle.domain}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{cycle.completion_percentage}%</p>
                          <p className="text-sm text-gray-500">
                            {cycle.completed_tickets}/{cycle.total_tickets} tickets
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${cycle.completion_percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>{new Date(cycle.start_date).toLocaleDateString()}</span>
                        <span>Velocity: {cycle.velocity} pts/day</span>
                        <span>{new Date(cycle.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {dashboardData.recent_activity.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {dashboardData.recent_activity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {activity.status === 'done' ? '✅' :
                           activity.status === 'in_progress' ? '🔄' :
                           activity.status === 'blocked' ? '🚫' : '📋'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.reference}: {activity.title}
                          </p>
                          <p className="text-sm text-gray-500">{activity.domain}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          activity.status === 'done' ? 'bg-green-100 text-green-800' :
                          activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          activity.status === 'blocked' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Burndown Tab */}
        {activeTab === 'burndown' && (
          <div className="space-y-6">
            {/* Cycle Selector */}
            {dashboardData && dashboardData.cycles.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Cycle
                </label>
                <select
                  value={selectedCycleId || ''}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  {dashboardData.cycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name} ({cycle.domain})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {burndownData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Work</p>
                    <p className="text-2xl font-bold text-gray-900">{burndownData.summary.total_work} pts</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{burndownData.summary.completed_work} pts</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="text-2xl font-bold text-blue-600">{burndownData.summary.remaining_work} pts</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`text-2xl font-bold ${burndownData.summary.on_track ? 'text-green-600' : 'text-red-600'}`}>
                      {burndownData.summary.on_track ? '✅ On Track' : '⚠️ At Risk'}
                    </p>
                  </div>
                </div>

                {/* Burndown Chart */}
                <BurndownChart
                  title={`Burndown: ${burndownData.cycle.name}`}
                  data={burndownData.burndown}
                  height={400}
                />
              </>
            )}

            {(!dashboardData || dashboardData.cycles.length === 0) && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <span className="text-6xl mb-4 block">📉</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Cycles</h3>
                <p className="text-gray-600">Create a cycle with tickets to see burndown charts</p>
              </div>
            )}
          </div>
        )}

        {/* Velocity Tab */}
        {activeTab === 'velocity' && (
          <div className="space-y-6">
            {velocityData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Average Velocity</p>
                    <p className="text-2xl font-bold text-gray-900">{velocityData.summary.average_velocity} pts</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Trend</p>
                    <p className={`text-2xl font-bold ${
                      velocityData.summary.trend === 'improving' ? 'text-green-600' :
                      velocityData.summary.trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {velocityData.summary.trend === 'improving' ? '📈 Improving' :
                       velocityData.summary.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{velocityData.summary.average_completion_rate}%</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Cycles Analyzed</p>
                    <p className="text-2xl font-bold text-gray-900">{velocityData.summary.total_cycles_analyzed}</p>
                  </div>
                </div>

                {/* Velocity Chart */}
                {velocityData.chart.data.length > 0 && (
                  <BarChart
                    title="Velocity Trend"
                    data={velocityData.chart.data}
                    bars={[
                      { dataKey: 'committed', name: 'Committed', color: '#9CA3AF' },
                      { dataKey: 'completed', name: 'Completed', color: '#3B82F6' }
                    ]}
                    height={350}
                  />
                )}

                {/* Recommendations */}
                {velocityData.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Recommendations</h3>
                    <ul className="space-y-2">
                      {velocityData.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-blue-800">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {!velocityData && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <span className="text-6xl mb-4 block">🚀</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Velocity Data</h3>
                <p className="text-gray-600">Complete some cycles to see velocity trends</p>
              </div>
            )}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {teamData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Team Members</p>
                    <p className="text-2xl font-bold text-gray-900">{teamData.summary.total_members}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Tickets Assigned</p>
                    <p className="text-2xl font-bold text-blue-600">{teamData.summary.total_tickets_assigned}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Unassigned</p>
                    <p className="text-2xl font-bold text-amber-600">{teamData.summary.unassigned_tickets}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Overloaded</p>
                    <p className={`text-2xl font-bold ${teamData.summary.overloaded_members > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {teamData.summary.overloaded_members}
                    </p>
                  </div>
                </div>

                {/* Alerts */}
                {teamData.alerts.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-800 mb-2">⚠️ Alerts</h3>
                    <ul className="space-y-1">
                      {teamData.alerts.map((alert, index) => (
                        <li key={index} className="text-amber-700">• {alert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Workload Distribution Pie */}
                  <PieChart
                    title="Workload Distribution"
                    data={teamData.charts.workload_distribution.data}
                  />

                  {/* Points by Member Bar */}
                  {teamData.charts.points_by_member.data.length > 0 && (
                    <BarChart
                      title="Points by Team Member"
                      data={teamData.charts.points_by_member.data}
                      bars={[
                        { dataKey: 'assigned', name: 'Assigned', color: '#9CA3AF' },
                        { dataKey: 'completed', name: 'Completed', color: '#10B981' }
                      ]}
                    />
                  )}
                </div>

                {/* Team Members Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Team Workload</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Member</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Tickets</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Points</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamData.members.map((member) => (
                          <tr key={member.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{member.name || member.email}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-gray-900">{member.tickets_completed}</span>
                              <span className="text-gray-400"> / </span>
                              <span className="text-gray-600">{member.tickets_assigned}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-900">{member.points_assigned}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                member.workload_status === 'light' ? 'bg-green-100 text-green-800' :
                                member.workload_status === 'normal' ? 'bg-blue-100 text-blue-800' :
                                member.workload_status === 'heavy' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {member.workload_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {!teamData && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <span className="text-6xl mb-4 block">👥</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Data</h3>
                <p className="text-gray-600">Assign tickets to team members to see workload distribution</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
