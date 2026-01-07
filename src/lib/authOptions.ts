/**
 * NextAuth.js OAuth SSO Configuration
 * Enterprise SSO Support: Okta, Azure AD, Google, GitHub, OneLogin, Auth0, SAML
 */

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import AzureADProvider from "next-auth/providers/azure-ad";
import OktaProvider from "next-auth/providers/okta";
import Auth0Provider from "next-auth/providers/auth0";
import jwt from "jsonwebtoken";
import { getUserByEmail, getOrganization, getUsers } from "@/lib/java-backend";

// JWT configuration for access tokens
const JWT_SECRET = process.env.JWT_SECRET || 'quad-platform-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

export const authOptions: NextAuthOptions = {
  providers: [
    // ============================================
    // ENTERPRISE SSO PROVIDERS (Most Common)
    // ============================================

    // 1. Okta (Mass Mutual, many Fortune 500 companies)
    ...(process.env.OKTA_CLIENT_ID ? [
      OktaProvider({
        clientId: process.env.OKTA_CLIENT_ID!,
        clientSecret: process.env.OKTA_CLIENT_SECRET!,
        issuer: process.env.OKTA_ISSUER!, // e.g., https://dev-12345.okta.com
      })
    ] : []),

    // 2. Microsoft Azure AD / Entra ID (Most enterprise companies)
    ...(process.env.AZURE_AD_CLIENT_ID ? [
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        tenantId: process.env.AZURE_AD_TENANT_ID || "common",
      })
    ] : []),

    // 3. Auth0 (Popular SSO provider)
    ...(process.env.AUTH0_CLIENT_ID ? [
      Auth0Provider({
        clientId: process.env.AUTH0_CLIENT_ID!,
        clientSecret: process.env.AUTH0_CLIENT_SECRET!,
        issuer: process.env.AUTH0_ISSUER!, // e.g., https://yourcompany.auth0.com
      })
    ] : []),

    // ============================================
    // STANDARD OAUTH PROVIDERS
    // ============================================

    // 4. Google Workspace (Startups, SMBs)
    ...(process.env.GOOGLE_CLIENT_ID ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "select_account", // Always show account selector
          },
        },
      })
    ] : []),

    // 5. GitHub (Developer teams)
    ...(process.env.GITHUB_CLIENT_ID ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      })
    ] : []),
  ],

  callbacks: {
    /**
     * Called after successful OAuth sign-in
     * Create or update user in database
     */
    async signIn({ user, account }) {
      if (!account || !user.email) {
        console.log('Sign-in rejected: Missing account or email');
        return false;
      }

      try {
        // Check if user exists by email - this enables account linking
        let existingUser;
        try {
          console.log(`[OAuth signIn] Checking if user exists: ${user.email}`);
          existingUser = await getUserByEmail(user.email);
          console.log('[OAuth signIn] User found:', existingUser);
        } catch (error: any) {
          console.log('[OAuth signIn] getUserByEmail error:', error.message);
          // User doesn't exist (404 error) - continue to new user flow
          if (error.message?.includes('404') ||
              error.message?.includes('not found') ||
              error.message?.includes('User not found')) {
            console.log('[OAuth signIn] User not found (404) - treating as new user');
            existingUser = null;
          } else {
            console.error('[OAuth signIn] Unexpected error - rejecting sign-in:', error);
            throw error;
          }
        }

        if (existingUser) {
          // Account linking: User exists - allow sign-in and let redirect callback handle destination
          console.log(`Account linking: ${user.email} signed in via ${account.provider} (existing user)`);
          // Mark this as an existing user sign-in (will be handled by redirect callback)
          // Store in account object so redirect callback can access it
          (account as any).isExistingUser = true;
          return true; // Allow sign-in, redirect callback will handle destination
        }

        // New user - redirect to unified signup page with OAuth params
        console.log(`New OAuth user: ${user.email} via ${account.provider} - redirecting to signup`);
        const params = new URLSearchParams({
          oauth: 'true',
          provider: account.provider,
          email: user.email || '',
          name: user.name || '',
        });
        return '/auth/signup?' + params.toString();

      } catch (error) {
        console.error('Sign-in callback error:', error);
        return false;
      }
    },

    /**
     * Add custom user data to JWT token
     */
    async jwt({ token, user, account }) {
      if (account && user && user.email) {
        try {
          // Fetch user data from Java backend
          const dbUser = await getUserByEmail(user.email);

          if (dbUser) {
            token.userId = dbUser.id;
            token.companyId = dbUser.companyId; // Same as orgId
            token.role = dbUser.role;
            token.fullName = dbUser.fullName;

            // TODO: Fetch domain membership from Java backend when endpoint exists
            // For now, domain info will be undefined for new users
            token.domainId = undefined;
            token.domainRole = undefined;
            token.allocationPercentage = undefined;

            // Generate access token for API calls
            token.accessToken = jwt.sign(
              {
                userId: dbUser.id,
                companyId: token.companyId,
                email: user.email,
                role: dbUser.role,
              },
              JWT_SECRET,
              { expiresIn: JWT_EXPIRES_IN }
            );
          }
        } catch (error) {
          console.error('[JWT callback] Error fetching user data:', error);
          // Don't throw - return token without user data to avoid breaking auth flow
        }
      }
      return token;
    },

    /**
     * Add custom data to session
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.companyId = token.companyId as string;
        session.user.role = token.role as string;
        session.user.fullName = token.fullName as string;

        // NEW: Add domain context
        session.user.domainId = token.domainId as string;
        session.user.domainRole = token.domainRole as string;
        session.user.allocationPercentage = token.allocationPercentage as number;

        // Add access token for API calls
        session.accessToken = token.accessToken as string;
      }
      return session;
    },

    /**
     * Control redirect destination after sign-in
     * This runs AFTER jwt and session callbacks, so session is properly established
     */
    async redirect({ url, baseUrl }) {
      console.log(`[redirect callback] URL: ${url}, baseUrl: ${baseUrl}`);

      // If URL contains oauth=true, it's a new user being sent to signup - allow it
      if (url.includes('oauth=true')) {
        console.log(`[redirect callback] New OAuth user, allowing redirect to signup`);
        // Handle relative URL
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        return url;
      }

      // If the URL is the signup page WITHOUT oauth=true, it's an existing user
      // who clicked OAuth from signup page - redirect to dashboard instead
      if (url.includes('/auth/signup')) {
        console.log(`[redirect callback] Existing user from signup page, redirecting to dashboard`);
        return `${baseUrl}/dashboard`;
      }

      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // Handle same-origin URLs
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default to dashboard for any other OAuth callback
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    newUser: '/auth/select-domain', // Redirect new users to domain selection
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET!,
};
