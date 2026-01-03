'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import IntegrationMethodSelector from '@/components/IntegrationMethodSelector';

export default function ConfigureIntegrationsPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'webhooks' | 'ssh' | 'mcp' | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedMethod) return;

    setSaving(true);
    try {
      // TODO: Save integration method to backend
      const response = await fetch('/api/integrations/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod }),
      });

      if (response.ok) {
        // Redirect to setup guide based on selected method
        if (selectedMethod === 'webhooks') {
          router.push('/configure/integrations/webhooks');
        } else if (selectedMethod === 'ssh') {
          router.push('/configure/integrations/ssh');
        } else if (selectedMethod === 'mcp') {
          router.push('/configure/integrations/mcp');
        }
      }
    } catch (error) {
      console.error('Failed to save integration method:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Configure Integrations
                </h1>
                <p className="text-gray-600 mt-1">
                  Set up how QUAD Platform connects to your development tools
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IntegrationMethodSelector
          onSelect={setSelectedMethod}
          selectedMethod={selectedMethod || undefined}
          deploymentType="self-hosted" // TODO: Get from user's company settings
        />

        {/* Continue Button */}
        {selectedMethod && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? 'Saving...' : 'Continue to Setup Guide'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
