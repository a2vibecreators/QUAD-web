"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  ticket_type: string;
  story_points: number | null;
  assigned_to: string | null;
  ai_confidence: number | null;
  ai_estimate_hours: number | null;
  domain?: {
    id: string;
    name: string;
    ticket_prefix: string | null;
  };
  cycle?: {
    id: string;
    name: string;
    cycle_number: number;
  } | null;
  _count?: {
    comments: number;
    time_logs: number;
    subtasks: number;
  };
}

interface Status {
  key: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const statuses: Status[] = [
  { key: "backlog", name: "Backlog", color: "text-gray-700", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
  { key: "todo", name: "To Do", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  { key: "in_progress", name: "In Progress", color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
  { key: "in_review", name: "In Review", color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  { key: "testing", name: "Testing", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  { key: "done", name: "Done", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200" },
  { key: "blocked", name: "Blocked", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" },
];

const priorityColors: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

const typeIcons: Record<string, string> = {
  epic: "📦",
  story: "📖",
  task: "✅",
  bug: "🐛",
  subtask: "🔹",
};

export default function TicketsBoard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [domains, setDomains] = useState<{ id: string; name: string; ticket_prefix: string | null }[]>([]);
  const [cycles, setCycles] = useState<{ id: string; name: string; cycle_number: number }[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [newTicketData, setNewTicketData] = useState({
    title: "",
    description: "",
    priority: "medium",
    ticket_type: "task",
    story_points: 0,
    cycle_id: "",
  });

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
        if (data.domains?.length > 0 && !selectedDomain) {
          setSelectedDomain(data.domains[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching domains:", err);
    }
  }, [session?.accessToken, selectedDomain]);

  // Fetch cycles for selected domain
  const fetchCycles = useCallback(async () => {
    if (!session?.accessToken || !selectedDomain) return;
    try {
      const res = await fetch(`/api/cycles?domain_id=${selectedDomain}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCycles(data.cycles || []);
      }
    } catch (err) {
      console.error("Error fetching cycles:", err);
    }
  }, [session?.accessToken, selectedDomain]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      let url = "/api/tickets?view=board";
      if (selectedDomain) url += `&domain_id=${selectedDomain}`;
      if (selectedCycle) url += `&cycle_id=${selectedCycle}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Flatten board data to tickets array
        if (data.board) {
          const allTickets: Ticket[] = [];
          Object.values(data.board).forEach((statusTickets) => {
            allTickets.push(...(statusTickets as Ticket[]));
          });
          setTickets(allTickets);
        } else {
          setTickets(data.tickets || []);
        }
      } else if (res.status === 401) {
        router.push("/auth/login");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch tickets");
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, selectedDomain, selectedCycle, router]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchDomains();
    }
  }, [session?.accessToken, fetchDomains]);

  useEffect(() => {
    if (session?.accessToken && selectedDomain) {
      fetchCycles();
    }
  }, [session?.accessToken, selectedDomain, fetchCycles]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchTickets();
    }
  }, [session?.accessToken, selectedDomain, selectedCycle, fetchTickets]);

  const getTicketsByStatus = (statusKey: string) => {
    return tickets.filter((ticket) => ticket.status === statusKey);
  };

  const handleDragStart = (ticket: Ticket) => {
    setDraggedTicket(ticket);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (statusKey: string) => {
    if (!draggedTicket || draggedTicket.status === statusKey || !session?.accessToken) {
      setDraggedTicket(null);
      return;
    }

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === draggedTicket.id ? { ...t, status: statusKey } : t))
    );

    try {
      const res = await fetch(`/api/tickets/${draggedTicket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status: statusKey }),
      });

      if (!res.ok) {
        fetchTickets();
        const errData = await res.json();
        alert(`Failed to update ticket: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error updating ticket:", err);
      fetchTickets();
      alert("Network error. Please try again.");
    }

    setDraggedTicket(null);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.accessToken || !selectedDomain) {
      alert("Please select a domain first");
      return;
    }

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          domain_id: selectedDomain,
          cycle_id: newTicketData.cycle_id || null,
          title: newTicketData.title,
          description: newTicketData.description || null,
          priority: newTicketData.priority,
          ticket_type: newTicketData.ticket_type,
          story_points: newTicketData.story_points || null,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTicketData({
          title: "",
          description: "",
          priority: "medium",
          ticket_type: "task",
          story_points: 0,
          cycle_id: "",
        });
        fetchTickets();
      } else {
        const errData = await res.json();
        alert(`Failed to create ticket: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error creating ticket:", err);
      alert("Network error. Please try again.");
    }
  };

  const handleAnalyzeTicket = async (ticketId: string) => {
    if (!session?.accessToken) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        alert(`AI Analysis complete!\n\nConfidence: ${Math.round(data.analysis.confidence * 100)}%\nEstimated: ${data.analysis.estimated_hours}h\nComplexity: ${data.analysis.complexity_score}/5`);
        fetchTickets();
      } else {
        const errData = await res.json();
        alert(`Analysis failed: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error analyzing ticket:", err);
      alert("Network error. Please try again.");
    }
  };

  const getStatusCount = (statusKey: string) => {
    return tickets.filter((t) => t.status === statusKey).length;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Tickets Board</h1>
              <span className="text-sm text-gray-500">({tickets.length} tickets)</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Domain Filter */}
              <select
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setSelectedCycle("");
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Domains</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Cycle Filter */}
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                disabled={!selectedDomain}
              >
                <option value="">All Cycles</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>Cycle {c.cycle_number}: {c.name}</option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("board")}
                  className={`px-3 py-2 text-sm ${viewMode === "board" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                >
                  Board
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 text-sm ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                >
                  List
                </button>
              </div>

              {/* Create Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!selectedDomain}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Ticket
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={fetchTickets} className="ml-4 text-red-600 underline">Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Kanban Board View */}
      {viewMode === "board" && !loading && (
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {statuses.map((statusCol) => (
              <div
                key={statusCol.key}
                className={`w-72 flex-shrink-0 ${statusCol.bgColor} ${statusCol.borderColor} border-2 rounded-xl p-4`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(statusCol.key)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-semibold ${statusCol.color}`}>{statusCol.name}</span>
                  <span className={`${statusCol.color} bg-white px-2 py-1 rounded-full text-sm font-medium`}>
                    {getStatusCount(statusCol.key)}
                  </span>
                </div>

                {/* Ticket Cards */}
                <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {getTicketsByStatus(statusCol.key).map((ticket) => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={() => handleDragStart(ticket)}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
                        draggedTicket?.id === ticket.id ? "opacity-50" : ""
                      }`}
                    >
                      {/* Top Row: Type & Priority */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg">{typeIcons[ticket.ticket_type] || "✅"}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>

                      {/* Ticket Number */}
                      <div className="text-xs text-gray-500 font-mono mb-1">{ticket.ticket_number}</div>

                      {/* Title */}
                      <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{ticket.title}</h3>

                      {/* Story Points & AI */}
                      <div className="flex items-center justify-between text-xs">
                        {ticket.story_points && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {ticket.story_points} pts
                          </span>
                        )}
                        {ticket.ai_confidence && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1">
                            🤖 {Math.round(ticket.ai_confidence * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Footer: Comments, Time, Subtasks */}
                      {ticket._count && (
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                          {ticket._count.comments > 0 && (
                            <span className="flex items-center gap-1">
                              💬 {ticket._count.comments}
                            </span>
                          )}
                          {ticket._count.subtasks > 0 && (
                            <span className="flex items-center gap-1">
                              ☑️ {ticket._count.subtasks}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty State */}
                  {getTicketsByStatus(statusCol.key).length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No tickets</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && !loading && (
        <div className="p-4">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 font-mono">{ticket.ticket_number}</div>
                      <div className="font-medium text-gray-900">{ticket.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        statuses.find(s => s.key === ticket.status)?.bgColor
                      } ${statuses.find(s => s.key === ticket.status)?.color}`}>
                        {statuses.find(s => s.key === ticket.status)?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span>{typeIcons[ticket.ticket_type]} {ticket.ticket_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.story_points || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {ticket.cycle ? `Cycle ${ticket.cycle.cycle_number}` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAnalyzeTicket(ticket.id)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        🤖 Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New Ticket</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateTicket}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTicketData.title}
                  onChange={(e) => setNewTicketData({ ...newTicketData, title: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Add details..."
                  rows={3}
                  value={newTicketData.description}
                  onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newTicketData.ticket_type}
                    onChange={(e) => setNewTicketData({ ...newTicketData, ticket_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="epic">📦 Epic</option>
                    <option value="story">📖 Story</option>
                    <option value="task">✅ Task</option>
                    <option value="bug">🐛 Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTicketData.priority}
                    onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Story Points</label>
                  <input
                    type="number"
                    min="0"
                    max="21"
                    value={newTicketData.story_points}
                    onChange={(e) => setNewTicketData({ ...newTicketData, story_points: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cycle</label>
                  <select
                    value={newTicketData.cycle_id}
                    onChange={(e) => setNewTicketData({ ...newTicketData, cycle_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Backlog (No Cycle)</option>
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>Cycle {c.cycle_number}: {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTicketData.title.trim() || !selectedDomain}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Slide-out */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-sm text-gray-500 font-mono">{selectedTicket.ticket_number}</span>
                  <span className="mx-2">•</span>
                  <span>{typeIcons[selectedTicket.ticket_type]} {selectedTicket.ticket_type}</span>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedTicket.title}</h2>

              {selectedTicket.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedTicket.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Status</h3>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    statuses.find(s => s.key === selectedTicket.status)?.bgColor
                  } ${statuses.find(s => s.key === selectedTicket.status)?.color}`}>
                    {statuses.find(s => s.key === selectedTicket.status)?.name}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Priority</h3>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${priorityColors[selectedTicket.priority]}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Story Points</h3>
                  <span>{selectedTicket.story_points || "Not set"}</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Cycle</h3>
                  <span>{selectedTicket.cycle ? `Cycle ${selectedTicket.cycle.cycle_number}` : "Backlog"}</span>
                </div>
              </div>

              {/* AI Analysis Section */}
              {selectedTicket.ai_confidence && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    🤖 AI Analysis
                  </h3>
                  <div className="text-sm text-purple-700">
                    <p>Confidence: {Math.round(selectedTicket.ai_confidence * 100)}%</p>
                    {selectedTicket.ai_estimate_hours && (
                      <p>Estimated: {selectedTicket.ai_estimate_hours}h</p>
                    )}
                  </div>
                </div>
              )}

              {!selectedTicket.ai_confidence && (
                <button
                  onClick={() => handleAnalyzeTicket(selectedTicket.id)}
                  className="w-full py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 hover:bg-purple-50 mb-6"
                >
                  🤖 Run AI Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
