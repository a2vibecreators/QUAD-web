'use client';

import { useState } from 'react';

export default function RequestIntegrationPage() {
  const [formData, setFormData] = useState({
    toolName: '',
    category: '',
    website: '',
    useCase: '',
    companyName: '',
    email: '',
    plan: 'free',
    urgency: 'medium',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/tools/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Request Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your integration request. Our team will review it and contact you soon.
          </p>
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>
              <strong>Expected Timeline:</strong>
            </p>
            <ul className="text-left space-y-1">
              <li>• Enterprise: 3-4 weeks</li>
              <li>• Pro: 4-6 weeks</li>
              <li>• Free: Best effort (based on demand)</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <a
              href="/tools"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Tools
            </a>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  toolName: '',
                  category: '',
                  website: '',
                  useCase: '',
                  companyName: '',
                  email: '',
                  plan: 'free',
                  urgency: 'medium',
                });
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              New Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Request New Integration
          </h1>
          <p className="text-gray-600 mt-2">
            Don't see the tool you need? Let us know and we'll prioritize based on customer demand.
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {/* Tool Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tool Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.toolName}
                  onChange={(e) =>
                    setFormData({ ...formData, toolName: e.target.value })
                  }
                  placeholder="e.g., Trello, Asana, Monday.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="version-control">Version Control</option>
                  <option value="itsm">ITSM / Project Management</option>
                  <option value="sso">SSO / Authentication</option>
                  <option value="cicd">CI/CD</option>
                  <option value="cloud">Cloud Infrastructure</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="database">Databases</option>
                  <option value="communication">Communication</option>
                  <option value="secret-management">Secret Management</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Use Case / Why You Need This *
                </label>
                <textarea
                  required
                  value={formData.useCase}
                  onChange={(e) =>
                    setFormData({ ...formData, useCase: e.target.value })
                  }
                  placeholder="Describe how you plan to use this integration and why it's important for your workflow..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Your Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Your company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your.email@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your QUAD Plan *
                </label>
                <select
                  required
                  value={formData.plan}
                  onChange={(e) =>
                    setFormData({ ...formData, plan: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="free">Free (Self-hosted or 5 users)</option>
                  <option value="pro">Pro ($99/mo)</option>
                  <option value="enterprise">Enterprise ($499/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) =>
                    setFormData({ ...formData, urgency: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low - Nice to have</option>
                  <option value="medium">Medium - Would improve workflow</option>
                  <option value="high">High - Blocking our adoption</option>
                  <option value="critical">Critical - Cannot use QUAD without it</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timeline Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Expected Timeline
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Enterprise</strong>: 3-4 weeks (priority support)</li>
              <li>• <strong>Pro</strong>: 4-6 weeks</li>
              <li>• <strong>Free</strong>: Best effort (based on community demand)</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              Timeline may vary based on API availability and complexity.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <a
              href="/tools"
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
            >
              Cancel
            </a>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Request
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
