'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense } from 'react';

type OrgType = 'startup' | 'business' | 'enterprise' | null;
type Step = 'select-type' | 'signup-form' | 'success';

interface FormData {
  orgType: OrgType;
  email: string;
  fullName: string;
  companyName: string;
  companySize: string;
  ssoProvider: string;
  message: string;
}

// Verified user data from URL (OAuth or email/OTP verified)
interface VerifiedUserData {
  isVerified: boolean;
  isOAuth: boolean;
  provider: string;  // 'google', 'github', or 'email'
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

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for verified user params (OAuth or email/OTP verified)
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUserData>({
    isVerified: false,
    isOAuth: false,
    provider: '',
    email: '',
    name: '',
  });

  const [step, setStep] = useState<Step>('select-type');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    orgType: null,
    email: '',
    fullName: '',
    companyName: '',
    companySize: 'small',
    ssoProvider: '',
    message: '',
  });

  // On mount, check URL params for verified user data (OAuth or email/OTP)
  useEffect(() => {
    const isOAuth = searchParams.get('oauth') === 'true';
    const isEmailVerified = searchParams.get('verified') === 'true';
    const provider = searchParams.get('provider') || '';
    const email = searchParams.get('email') || '';
    const name = searchParams.get('name') || '';

    if (isOAuth && email) {
      // OAuth flow: Google/GitHub verified user
      setVerifiedUser({ isVerified: true, isOAuth: true, provider, email, name });

      // Check if orgType was stored in sessionStorage before OAuth redirect
      const savedOrgType = sessionStorage.getItem('quad_signup_orgType') as OrgType;
      if (savedOrgType && ['startup', 'business', 'enterprise'].includes(savedOrgType)) {
        // User already selected org type before OAuth - skip to form
        setFormData(prev => ({
          ...prev,
          orgType: savedOrgType,
          email,
          fullName: name,
        }));
        setStep('signup-form');
        sessionStorage.removeItem('quad_signup_orgType'); // Clean up
      } else {
        // User came from login page OAuth - show org type selection
        setFormData(prev => ({
          ...prev,
          email,
          fullName: name,
        }));
      }
    } else if (isEmailVerified && email) {
      // Email/OTP flow: User already verified via OTP on login page
      setVerifiedUser({ isVerified: true, isOAuth: false, provider: 'email', email, name: '' });
      setFormData(prev => ({
        ...prev,
        email,
      }));
    }
  }, [searchParams]);

  const selectedType = ORG_TYPES.find((t) => t.id === formData.orgType);

  const handleTypeSelect = (type: OrgType) => {
    setFormData({ ...formData, orgType: type });
    setStep('signup-form');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (formData.orgType === 'enterprise') {
        // Enterprise: Submit access request (manual approval)
        const response = await fetch('/api/auth/request-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: formData.companyName,
            adminEmail: formData.email,
            adminName: formData.fullName,
            companySize: formData.companySize,
            ssoProvider: formData.ssoProvider,
            message: formData.message,
            orgType: 'enterprise',
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }
      } else {
        // Startup/Business: Instant signup

        // OAuth users: Use complete-oauth-signup endpoint
        if (verifiedUser.isOAuth) {
          const response = await fetch('/api/auth/complete-oauth-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: verifiedUser.provider,
              email: formData.email,
              fullName: formData.fullName,
              orgType: formData.orgType,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'OAuth signup failed');
          }

          if (data.success) {
            // Create session without OAuth redirect (fixes double redirect issue)
            const sessionResponse = await fetch('/api/auth/create-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: formData.email,
                provider: verifiedUser.provider,
              }),
            });

            const sessionData = await sessionResponse.json();
            if (!sessionResponse.ok) {
              throw new Error(sessionData.error || 'Failed to create session');
            }

            // Redirect to dashboard (session cookie is set)
            router.push('/dashboard');
            return;
          }
        } else {
          // Regular signup: Use standard signup endpoint
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              fullName: formData.fullName,
              companyName: formData.companyName || `${formData.fullName}'s Team`,
              orgType: formData.orgType,
              // For email-verified users, mark as pre-verified
              isEmailVerified: verifiedUser.isVerified,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
          }
        }

        // Passwordless signup - redirect to verify page to enter OTP
        if (data.success && data.requiresVerification) {
          router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
          return;
        }

        // Password-based signup with token - auto login
        if (data.success && data.token) {
          localStorage.setItem('auth_token', data.token);
          router.push('/setup');
          return;
        }
      }

      setStep('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'signup-form') {
      setStep('select-type');
      setError(null);
    }
  };

  // Step 1: Select Organization Type
  if (step === 'select-type') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-3xl">Q</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Get Started with QUAD
            </h1>
            <p className="text-xl text-blue-200">
              Choose the plan that fits your team
            </p>

            {/* Verified User Info (OAuth or Email) */}
            {verifiedUser.isVerified && (
              <div className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  {verifiedUser.provider === 'google' ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  ) : verifiedUser.provider === 'github' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  ) : (
                    // Email icon for email-verified users
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  {verifiedUser.name && <p className="text-white text-sm font-medium">{verifiedUser.name}</p>}
                  <p className={verifiedUser.name ? "text-blue-200 text-xs" : "text-white text-sm font-medium"}>{verifiedUser.email}</p>
                </div>
                <span className="text-green-400 text-xs">✓ Verified</span>
              </div>
            )}
          </div>

          {/* Org Type Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {ORG_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                disabled={type.id === 'business' || type.id === 'enterprise'}
                className={`
                  relative bg-white rounded-2xl p-6 text-left transition-all duration-300
                  border-2 ${type.borderColor}
                  hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1
                  focus:outline-none focus:ring-4 focus:ring-blue-500/50
                  ${(type.id === 'business' || type.id === 'enterprise') ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0' : ''}
                `}
              >
                {/* Icon */}
                <div className="text-4xl mb-4">{type.icon}</div>

                {/* Title & Subtitle */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {type.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{type.subtitle}</p>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4">{type.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {type.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Price */}
                <div className={`${type.bgColor} rounded-lg p-3 mb-4`}>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{type.price}</span>
                    <span className="text-sm text-gray-600">{type.priceNote}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className={`
                  w-full py-3 rounded-lg text-center font-medium text-white
                  bg-gradient-to-r ${type.color}
                `}>
                  {type.instant ? 'Get Started' : 'Contact Sales'}
                </div>

                {/* Instant Badge */}
                {type.instant && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Instant Access
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-blue-200">
              Already have an account?{' '}
              <a href="/auth/login" className="text-white font-medium hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Signup Form (varies by org type)
  if (step === 'signup-form' && selectedType) {
    const isEnterprise = formData.orgType === 'enterprise';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-3xl">{selectedType.icon}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEnterprise ? 'Request Enterprise Access' : `Create Your ${selectedType.title} Account`}
              </h2>
              <p className="text-gray-600">
                {isEnterprise
                  ? "We'll get back to you within 24 hours"
                  : 'Get started in under a minute'}
              </p>
            </div>
          </div>

          {/* Verified User Badge */}
          {verifiedUser.isVerified && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-800">
                {verifiedUser.isOAuth
                  ? `Signed in with ${verifiedUser.provider === 'google' ? 'Google' : 'GitHub'} - no email verification needed`
                  : 'Email verified - no additional verification needed'
                }
              </span>
            </div>
          )}

          {/* OAuth Options - Show only for non-verified users (not from OAuth callback) */}
          {!verifiedUser.isVerified && !isEnterprise && (
            <div className="mb-6">
              <div className="space-y-3">
                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={() => {
                    // Store selected org type in sessionStorage before OAuth redirect
                    sessionStorage.setItem('quad_signup_orgType', formData.orgType || '');
                    signIn('google', {
                      callbackUrl: `/auth/signup?orgType=${formData.orgType}`,
                      redirect: true,
                    });
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-gray-700 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">or fill in your details</span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email - Read-only for verified users (OAuth or email-verified) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Your Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                readOnly={verifiedUser.isVerified}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  verifiedUser.isVerified ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                {verifiedUser.isVerified
                  ? verifiedUser.isOAuth
                    ? `Verified via ${verifiedUser.provider}`
                    : 'Email verified via code'
                  : "You'll use this to sign in"
                }
              </p>
            </div>

            {/* Full Name - Read-only for OAuth only (email-verified users need to enter name) */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                readOnly={verifiedUser.isOAuth}
                placeholder="John Smith"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  verifiedUser.isOAuth ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Company Name - Optional for Startup, Required for Business/Enterprise */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.orgType === 'startup' ? 'Team/Company Name' : 'Company Name *'}
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                required={formData.orgType !== 'startup'}
                value={formData.companyName}
                onChange={handleChange}
                placeholder={formData.orgType === 'startup' ? 'Optional - we can create one for you' : 'Acme Inc.'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Enterprise-only fields */}
            {isEnterprise && (
              <>
                {/* Company Size */}
                <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size *
                  </label>
                  <select
                    id="companySize"
                    name="companySize"
                    required
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="100-500">100-500 employees</option>
                    <option value="500-1000">500-1,000 employees</option>
                    <option value="1000-5000">1,000-5,000 employees</option>
                    <option value="5000+">5,000+ employees</option>
                  </select>
                </div>

                {/* SSO Provider */}
                <div>
                  <label htmlFor="ssoProvider" className="block text-sm font-medium text-gray-700 mb-1">
                    SSO Provider *
                  </label>
                  <select
                    id="ssoProvider"
                    name="ssoProvider"
                    required
                    value={formData.ssoProvider}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select your SSO provider</option>
                    <option value="okta">Okta</option>
                    <option value="azure-ad">Microsoft Azure AD</option>
                    <option value="google">Google Workspace</option>
                    <option value="github">GitHub Enterprise</option>
                    <option value="auth0">Auth0</option>
                    <option value="oidc">Generic OIDC</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Information
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your requirements..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3 rounded-lg font-medium text-white transition-all
                bg-gradient-to-r ${selectedType.color}
                hover:shadow-lg hover:scale-[1.02]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEnterprise ? 'Submitting Request...' : 'Creating Account...'}
                </span>
              ) : isEnterprise ? (
                'Submit Request'
              ) : (
                'Create Account'
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === 'success' && selectedType) {
    const isEnterprise = formData.orgType === 'enterprise';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className={`
              w-20 h-20 rounded-full flex items-center justify-center
              ${isEnterprise ? 'bg-purple-100' : 'bg-green-100'}
            `}>
              {isEnterprise ? (
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEnterprise ? 'Request Submitted!' : 'Account Created!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isEnterprise
              ? `We've received your enterprise access request and will contact you at ${formData.email} within 24 hours.`
              : `We've sent a 6-digit verification code to ${formData.email}. Enter the code on the next page to activate your account.`}
          </p>

          {/* What's Next */}
          <div className={`${selectedType.bgColor} border rounded-lg p-4 text-left mb-6`}>
            <p className="text-sm font-medium text-gray-900 mb-2">What happens next?</p>
            <ul className="text-sm text-gray-700 space-y-2">
              {isEnterprise ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">1.</span>
                    <span>Our team reviews your requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">2.</span>
                    <span>We'll schedule a call to discuss SSO setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">3.</span>
                    <span>Custom deployment within 48 hours</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">1.</span>
                    <span>Check your email for the 6-digit code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">2.</span>
                    <span>Enter your email and the code to sign in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">3.</span>
                    <span>Complete setup and start building!</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Button */}
          <button
            onClick={() => router.push(isEnterprise ? '/' : '/auth/login')}
            className={`
              w-full py-3 rounded-lg font-medium text-white transition-all
              bg-gradient-to-r ${selectedType.color}
              hover:shadow-lg hover:scale-[1.02]
            `}
          >
            {isEnterprise ? 'Back to Home' : 'Continue to Login'}
          </button>

          {/* Didn't receive code */}
          {!isEnterprise && (
            <p className="mt-4 text-sm text-gray-500">
              Didn't receive the code?{' '}
              <button className="text-blue-600 hover:underline">Resend Code</button>
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Wrap with Suspense for useSearchParams
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
