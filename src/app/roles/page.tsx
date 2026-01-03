"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ParticipationLevel = "PRIMARY" | "SUPPORT" | "REVIEW" | "INFORM" | null;

interface Role {
  id: string;
  role_code: string;
  role_name: string;
  description: string | null;
  can_manage_company: boolean;
  can_manage_users: boolean;
  can_manage_domains: boolean;
  can_manage_flows: boolean;
  can_view_all_metrics: boolean;
  can_manage_circles: boolean;
  can_manage_resources: boolean;
  q_participation: ParticipationLevel;
  u_participation: ParticipationLevel;
  a_participation: ParticipationLevel;
  d_participation: ParticipationLevel;
  color_code: string | null;
  icon_name: string | null;
  hierarchy_level: number;
  display_order: number;
  is_system_role: boolean;
  is_active: boolean;
  _count: { users: number };
}

const participationColors: Record<string, string> = {
  PRIMARY: "bg-blue-600 text-white",
  SUPPORT: "bg-blue-100 text-blue-700",
  REVIEW: "bg-purple-100 text-purple-700",
  INFORM: "bg-gray-100 text-gray-600",
};

const participationLabels: Record<string, string> = {
  PRIMARY: "P",
  SUPPORT: "S",
  REVIEW: "R",
  INFORM: "I",
};

export default function RolesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for creating/editing roles
  const [formData, setFormData] = useState({
    role_code: "",
    role_name: "",
    description: "",
    hierarchy_level: 50,
    color_code: "#6B7280",
    q_participation: "" as string,
    u_participation: "" as string,
    a_participation: "" as string,
    d_participation: "" as string,
    can_manage_company: false,
    can_manage_users: false,
    can_manage_domains: false,
    can_manage_flows: false,
    can_view_all_metrics: false,
    can_manage_circles: false,
    can_manage_resources: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/roles", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      } else if (res.status === 401) {
        router.push("/auth/login");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch roles");
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, router]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchRoles();
    }
  }, [session?.accessToken, fetchRoles]);

  // Reset form when editing a role
  useEffect(() => {
    if (editingRole) {
      setFormData({
        role_code: editingRole.role_code,
        role_name: editingRole.role_name,
        description: editingRole.description || "",
        hierarchy_level: editingRole.hierarchy_level,
        color_code: editingRole.color_code || "#6B7280",
        q_participation: editingRole.q_participation || "",
        u_participation: editingRole.u_participation || "",
        a_participation: editingRole.a_participation || "",
        d_participation: editingRole.d_participation || "",
        can_manage_company: editingRole.can_manage_company,
        can_manage_users: editingRole.can_manage_users,
        can_manage_domains: editingRole.can_manage_domains,
        can_manage_flows: editingRole.can_manage_flows,
        can_view_all_metrics: editingRole.can_view_all_metrics,
        can_manage_circles: editingRole.can_manage_circles,
        can_manage_resources: editingRole.can_manage_resources,
      });
    }
  }, [editingRole]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setSaving(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          q_participation: formData.q_participation || null,
          u_participation: formData.u_participation || null,
          a_participation: formData.a_participation || null,
          d_participation: formData.d_participation || null,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          role_code: "",
          role_name: "",
          description: "",
          hierarchy_level: 50,
          color_code: "#6B7280",
          q_participation: "",
          u_participation: "",
          a_participation: "",
          d_participation: "",
          can_manage_company: false,
          can_manage_users: false,
          can_manage_domains: false,
          can_manage_flows: false,
          can_view_all_metrics: false,
          can_manage_circles: false,
          can_manage_resources: false,
        });
        fetchRoles();
      } else {
        const errData = await res.json();
        alert(`Failed to create role: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error creating role:", err);
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken || !editingRole) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          role_name: formData.role_name,
          description: formData.description || null,
          hierarchy_level: formData.hierarchy_level,
          color_code: formData.color_code,
          q_participation: formData.q_participation || null,
          u_participation: formData.u_participation || null,
          a_participation: formData.a_participation || null,
          d_participation: formData.d_participation || null,
          can_manage_company: formData.can_manage_company,
          can_manage_users: formData.can_manage_users,
          can_manage_domains: formData.can_manage_domains,
          can_manage_flows: formData.can_manage_flows,
          can_view_all_metrics: formData.can_view_all_metrics,
          can_manage_circles: formData.can_manage_circles,
          can_manage_resources: formData.can_manage_resources,
        }),
      });

      if (res.ok) {
        setEditingRole(null);
        fetchRoles();
      } else {
        const errData = await res.json();
        alert(`Failed to update role: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderParticipation = (level: ParticipationLevel) => {
    if (!level) return <span className="text-gray-300">-</span>;
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${participationColors[level]}`}
        title={level}
      >
        {participationLabels[level]}
      </span>
    );
  };

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect handled in useEffect, but show nothing while redirecting
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
                <p className="text-sm text-gray-500">Configure roles with Q-U-A-D stage participation</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFormData({
                  role_code: "",
                  role_name: "",
                  description: "",
                  hierarchy_level: 50,
                  color_code: "#6B7280",
                  q_participation: "",
                  u_participation: "",
                  a_participation: "",
                  d_participation: "",
                  can_manage_company: false,
                  can_manage_users: false,
                  can_manage_domains: false,
                  can_manage_flows: false,
                  can_view_all_metrics: false,
                  can_manage_circles: false,
                  can_manage_resources: false,
                });
                setShowCreateModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Role
            </button>
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm">
          <span className="text-gray-500">Stage Participation:</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className={`w-6 h-6 rounded-full ${participationColors.PRIMARY} text-xs flex items-center justify-center font-bold`}>P</span>
              <span className="text-gray-600">Primary</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-6 h-6 rounded-full ${participationColors.SUPPORT} text-xs flex items-center justify-center font-bold`}>S</span>
              <span className="text-gray-600">Support</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-6 h-6 rounded-full ${participationColors.REVIEW} text-xs flex items-center justify-center font-bold`}>R</span>
              <span className="text-gray-600">Review</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-6 h-6 rounded-full ${participationColors.INFORM} text-xs flex items-center justify-center font-bold`}>I</span>
              <span className="text-gray-600">Inform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={fetchRoles} className="ml-4 text-red-600 underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Roles Table */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {roles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
              <p className="text-gray-500 mb-4">Create your first role to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Q</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">U</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">A</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hierarchy</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color_code || "#6B7280" }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{role.role_name}</div>
                            <div className="text-xs text-gray-500">{role.role_code}</div>
                          </div>
                          {role.is_system_role && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">System</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{renderParticipation(role.q_participation)}</td>
                      <td className="px-6 py-4 text-center">{renderParticipation(role.u_participation)}</td>
                      <td className="px-6 py-4 text-center">{renderParticipation(role.a_participation)}</td>
                      <td className="px-6 py-4 text-center">{renderParticipation(role.d_participation)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">{role.hierarchy_level}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                          {role._count?.users || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingRole(role)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Permissions Matrix */}
          {roles.length > 0 && (
            <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-gray-500">Role</th>
                      <th className="px-4 py-2 text-center text-gray-500">Company</th>
                      <th className="px-4 py-2 text-center text-gray-500">Users</th>
                      <th className="px-4 py-2 text-center text-gray-500">Domains</th>
                      <th className="px-4 py-2 text-center text-gray-500">Flows</th>
                      <th className="px-4 py-2 text-center text-gray-500">Metrics</th>
                      <th className="px-4 py-2 text-center text-gray-500">Circles</th>
                      <th className="px-4 py-2 text-center text-gray-500">Resources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className="border-b border-gray-100">
                        <td className="px-4 py-2 font-medium text-gray-900">{role.role_name}</td>
                        <td className="px-4 py-2 text-center">
                          {role.can_manage_company ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {role.can_manage_users ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {role.can_manage_domains ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {role.can_manage_flows ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {role.can_view_all_metrics ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {role.can_manage_circles ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {role.can_manage_resources ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Create New Role</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                  <input
                    type="text"
                    value={formData.role_name}
                    onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Senior Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Code *</label>
                  <input
                    type="text"
                    value={formData.role_code}
                    onChange={(e) => setFormData({ ...formData, role_code: e.target.value.toUpperCase() })}
                    required
                    pattern="^[A-Z][A-Z0-9_]*$"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., SENIOR_DEV"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Q-U-A-D Participation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Stage Participation</label>
                <div className="grid grid-cols-4 gap-4">
                  {["q", "u", "a", "d"].map((stage) => (
                    <div key={stage}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">
                        {stage === "q" ? "Question" : stage === "u" ? "Understand" : stage === "a" ? "Allocate" : "Deliver"}
                      </label>
                      <select
                        value={formData[`${stage}_participation` as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [`${stage}_participation`]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">None</option>
                        <option value="PRIMARY">Primary</option>
                        <option value="SUPPORT">Support</option>
                        <option value="REVIEW">Review</option>
                        <option value="INFORM">Inform</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hierarchy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hierarchy Level</label>
                  <input
                    type="number"
                    value={formData.hierarchy_level}
                    onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={formData.color_code}
                    onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "can_manage_company", label: "Manage Company" },
                    { key: "can_manage_users", label: "Manage Users" },
                    { key: "can_manage_domains", label: "Manage Domains" },
                    { key: "can_manage_flows", label: "Manage Flows" },
                    { key: "can_view_all_metrics", label: "View All Metrics" },
                    { key: "can_manage_circles", label: "Manage Circles" },
                    { key: "can_manage_resources", label: "Manage Resources" },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[perm.key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [perm.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Role: {editingRole.role_name}</h2>
                <button
                  onClick={() => setEditingRole(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={formData.role_name}
                    onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Code</label>
                  <input
                    type="text"
                    value={formData.role_code}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Q-U-A-D Participation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Stage Participation</label>
                <div className="grid grid-cols-4 gap-4">
                  {["q", "u", "a", "d"].map((stage) => (
                    <div key={stage}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">
                        {stage === "q" ? "Question" : stage === "u" ? "Understand" : stage === "a" ? "Allocate" : "Deliver"}
                      </label>
                      <select
                        value={formData[`${stage}_participation` as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [`${stage}_participation`]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">None</option>
                        <option value="PRIMARY">Primary</option>
                        <option value="SUPPORT">Support</option>
                        <option value="REVIEW">Review</option>
                        <option value="INFORM">Inform</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hierarchy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hierarchy Level</label>
                  <input
                    type="number"
                    value={formData.hierarchy_level}
                    onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={formData.color_code}
                    onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "can_manage_company", label: "Manage Company" },
                    { key: "can_manage_users", label: "Manage Users" },
                    { key: "can_manage_domains", label: "Manage Domains" },
                    { key: "can_manage_flows", label: "Manage Flows" },
                    { key: "can_view_all_metrics", label: "View All Metrics" },
                    { key: "can_manage_circles", label: "Manage Circles" },
                    { key: "can_manage_resources", label: "Manage Resources" },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData[perm.key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [perm.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <div>
                  {!editingRole.is_system_role && (
                    <button type="button" className="text-red-600 hover:text-red-700 text-sm">Delete Role</button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
