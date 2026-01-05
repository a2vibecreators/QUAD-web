'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

type OrgType = 'startup' | 'business' | 'enterprise';

interface OAuthUserData {
  provider: string;
  email: string;
  name: string;
}

const ORG_TYPES = [
  {
    id: 'startup' as const,
    title: 'Startup',
    subtitle: '1-10 developers',
    description: 'Perfect for small teams and indie developers. Get started instantly with full access.',
    icon: '🚀',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200 hover:border-green-400',
    features: ['Up to 5 users free', 'All core features', 'Community support', 'Instant access'],
    price: 'Free',
    priceNote: 'forever for small teams',
    instant: true,
  },
  {
    id: 'business' as const,
    title: 'Growing Business',
    subtitle: '10-100 developers',
    description: 'For scaling teams that need more power. Priority support and advanced features.',
    icon: '📈',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
    features: ['Unlimited users', 'Priority support', 'Advanced analytics', 'Instant access'],
    price: '$49',
    priceNote: 'per month',
    instant: true,
  },
  {
    id: 'enterprise' as const,
    title: 'Enterprise',
    subtitle: '100+ developers',
    description: 'For large organizations with SSO, compliance, and dedicated support requirements.',
    icon: '🏢',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
    features: ['SSO/SAML integration', 'Dedicated support', 'Custom deployment', 'SLA guarantee'],
    price: 'Custom',
    priceNote: 'contact sales',
    instant: false,
  },
];

function CompleteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [oauthData, setOAuthData] = useState<OAuthUserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract OAuth data from URL params
  useEffect(() => {
    const provider = searchParams.get('provider') || '';
    const email = searchParams.get('email') || '';
    const name = searchParams.get('name') || '';

    if (!provider || !email) {
      // Missing required OAuth data - redirect to login
      router.push('/auth/login');
      return;
    }

    setOAuthData({ provider, email, name });
  }, [searchParams, router]);

  const handleTypeSelect = async (orgType: OrgType) => {
    if (!oauthData) return;

    setIsLoading(true);
    setError(null);

    try {
      if (orgType === 'enterprise') {
        // Enterprise: Redirect to contact sales (no instant signup)
        router.push(`/contact?type=enterprise&email=${encodeURIComponent(oauthData.email)}`);
        return;
      }

      // Startup/Business: Complete signup automatically
      const response = await fetch('/api/auth/complete-oauth-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: oauthData.provider,
          email: oauthData.email,
          fullName: oauthData.name,
          orgType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      if (data.success) {
        // Sign in with OAuth provider to create proper NextAuth session
        await signIn(oauthData.provider, {
          callbackUrl: '/dashboard',
          redirect: true,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!oauthData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Signed in with {oauthData.provider === 'google' ? 'Google' : 'GitHub'}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Complete Your QUAD Account
          </h1>
          <p className="text-xl text-gray-600">
            Choose your account type to get started
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Signed in as <span className="font-medium">{oauthData.email}</span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Account Type Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {ORG_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              disabled={isLoading || type.id === 'business' || type.id === 'enterprise'}
              className={`relative p-6 rounded-xl border-2 ${type.borderColor} ${type.bgColor} text-left transition-all transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {/* Icon and Title */}
              <div className="text-center mb-4">
                <div className="text-5xl mb-3">{type.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900">{type.title}</h3>
                <p className="text-sm text-gray-600">{type.subtitle}</p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 mb-4 min-h-[48px]">{type.description}</p>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {type.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className={`text-center py-3 px-4 rounded-lg bg-gradient-to-r ${type.color} text-white`}>
                <div className="text-2xl font-bold">{type.price}</div>
                <div className="text-xs opacity-90">{type.priceNote}</div>
              </div>

              {/* Instant Access Badge */}
              {type.instant && (
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Instant
                </div>
              )}

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Cancel and return to login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompleteSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CompleteSignupContent />
    </Suspense>
  );
}
