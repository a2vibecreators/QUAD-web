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
import { query } from "@/lib/db";

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
        // If user signed up with email/password and later uses OAuth with same email,
        // they will be linked by email and allowed to sign in
        const existingUser = await query(
          'SELECT id, company_id, role, password_hash FROM "QUAD_users" WHERE email = $1',
          [user.email]
        );

        if (existingUser.rows.length > 0) {
          const dbUser = existingUser.rows[0] as { id: string; password_hash: string };

          // Account linking: User exists, allow OAuth sign-in regardless of original auth method
          // This links OAuth provider to existing account
          console.log(`Account linking: ${user.email} signed in via ${account.provider} (existing user)`);

          await query(
            `UPDATE "QUAD_users" SET updated_at = NOW() WHERE email = $1`,
            [user.email]
          );
          return true;
        }

        // New user - check if they belong to existing organization by email domain
        const emailDomain = user.email.split('@')[1];

        // Look for organization with matching admin email domain
        const orgResult = await query(
          `SELECT id FROM "QUAD_organizations"
           WHERE admin_email LIKE $1 AND is_active = true`,
          [`%@${emailDomain}`]
        );

        if (orgResult.rows.length > 0) {
          // Organization exists - add user as team member
          const org = orgResult.rows[0] as { id: string };

          // Check user count for free tier limit (5 users)
          const userCountResult = await query<{ count: string }>(
            'SELECT COUNT(*) as count FROM "QUAD_users" WHERE company_id = $1',
            [org.id]
          );

          const userCount = parseInt(userCountResult.rows[0].count);

          if (userCount >= 5) {
            // Check if org has paid plan
            const orgPlanResult = await query<{ size: string }>(
              'SELECT size FROM "QUAD_organizations" WHERE id = $1',
              [org.id]
            );

            // For now, allow if size is not 'startup' (pro/enterprise plans)
            if (orgPlanResult.rows[0]?.size === 'startup') {
              console.log(`Sign-in rejected: Free tier limit (5 users) reached for ${user.email}`);
              return '/upgrade?reason=user-limit'; // Redirect to upgrade page
            }
          }

          // Add user with minimal required fields (no oauth columns in schema)
          await query(
            `INSERT INTO "QUAD_users" (
              company_id, email, password_hash, full_name, role, is_active, email_verified
            ) VALUES ($1, $2, $3, $4, 'DEVELOPER', true, true)`,
            [
              org.id,
              user.email,
              'oauth-' + account.provider, // Placeholder hash for OAuth users
              user.name,
            ]
          );
          return true;
        } else {
          // No organization found - redirect to signup with OAuth data
          // User is already verified by Google/GitHub, so skip OTP
          console.log(`New OAuth user: ${user.email} via ${account.provider} - redirecting to signup`);
          const params = new URLSearchParams({
            oauth: 'true',
            provider: account.provider,
            email: user.email || '',
            name: user.name || '',
          });
          // Note: orgType will be read from sessionStorage on the client side
          // since we can't access it from the server callback
          return '/auth/signup?' + params.toString();
        }

      } catch (error) {
        console.error('Sign-in callback error:', error);
        return false;
      }
    },

    /**
     * Add custom user data to JWT token
     */
    async jwt({ token, user, account }) {
      if (account && user) {
        // Fetch user data from database (using correct QUAD_ table names)
        const userResult = await query(
          `SELECT id, company_id, role, full_name FROM "QUAD_users" WHERE email = $1`,
          [user.email]
        );

        if (userResult.rows.length > 0) {
          const dbUser = userResult.rows[0] as { id: string; company_id: string; role: string; full_name: string };
          token.userId = dbUser.id;
          token.companyId = dbUser.company_id;
          token.role = dbUser.role;
          token.fullName = dbUser.full_name;

          // Fetch domain membership (if exists)
          const domainResult = await query(
            `SELECT
              dm.domain_id,
              dm.role as domain_role,
              dm.allocation_percentage
            FROM "QUAD_domain_members" dm
            WHERE dm.user_id = $1
            ORDER BY dm.created_at ASC
            LIMIT 1`,
            [dbUser.id]
          );

          if (domainResult.rows.length > 0) {
            const domainMembership = domainResult.rows[0] as { domain_id: string; domain_role: string; allocation_percentage: number };
            token.domainId = domainMembership.domain_id;
            token.domainRole = domainMembership.domain_role;
            token.allocationPercentage = domainMembership.allocation_percentage;
          }

          // Generate access token for API calls
          token.accessToken = jwt.sign(
            {
              userId: dbUser.id,
              companyId: dbUser.company_id,
              email: user.email,
              role: dbUser.role,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
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
