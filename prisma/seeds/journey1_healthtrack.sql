-- ============================================================================
-- QUAD Framework Test Journey 1: HealthTrack Startup
-- Full Stack Mobile App (iOS + Android + Web + PostgreSQL + GCP)
-- ============================================================================
-- Run with: psql -U quad_user -d quad_db -f journey1_healthtrack.sql
-- Or via Prisma: npx prisma db execute --file prisma/seeds/journey1_healthtrack.sql
-- ============================================================================

-- Clean up existing test data (if re-running)
DELETE FROM "QUAD_flows" WHERE domain_id IN (SELECT id FROM "QUAD_domains" WHERE name = 'HealthTrack App');
DELETE FROM "QUAD_circle_members" WHERE circle_id IN (SELECT c.id FROM "QUAD_circles" c JOIN "QUAD_domains" d ON c.domain_id = d.id WHERE d.name = 'HealthTrack App');
DELETE FROM "QUAD_circles" WHERE domain_id IN (SELECT id FROM "QUAD_domains" WHERE name = 'HealthTrack App');
DELETE FROM "QUAD_domain_members" WHERE domain_id IN (SELECT id FROM "QUAD_domains" WHERE name = 'HealthTrack App');
DELETE FROM "QUAD_resource_attributes" WHERE resource_id IN (SELECT r.id FROM "QUAD_domain_resources" r JOIN "QUAD_domains" d ON r.domain_id = d.id WHERE d.name = 'HealthTrack App');
DELETE FROM "QUAD_domain_resources" WHERE domain_id IN (SELECT id FROM "QUAD_domains" WHERE name = 'HealthTrack App');
DELETE FROM "QUAD_domains" WHERE name = 'HealthTrack App';
DELETE FROM "QUAD_adoption_matrix" WHERE user_id IN (SELECT id FROM "QUAD_users" WHERE email LIKE '%@healthtrack.io');
DELETE FROM "QUAD_users" WHERE email LIKE '%@healthtrack.io';
DELETE FROM "QUAD_roles" WHERE company_id IN (SELECT id FROM "QUAD_companies" WHERE name = 'HealthTrack Startup');
DELETE FROM "QUAD_companies" WHERE name = 'HealthTrack Startup';

-- ============================================================================
-- 1. CREATE COMPANY
-- ============================================================================
INSERT INTO "QUAD_companies" (id, name, admin_email, size, is_active, created_at, updated_at)
VALUES (
  'a1b2c3d4-1111-1111-1111-111111111111',
  'HealthTrack Startup',
  'founder@healthtrack.io',
  'startup',
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- 2. CREATE ROLES (6 Default + 1 Custom)
-- ============================================================================

-- ADMIN Role
INSERT INTO "QUAD_roles" (id, company_id, role_code, role_name, description,
  can_manage_company, can_manage_users, can_manage_domains, can_manage_flows,
  can_view_all_metrics, can_manage_circles, can_manage_resources,
  q_participation, u_participation, a_participation, d_participation,
  hierarchy_level, is_system_role, color_code, display_order, created_at, updated_at)
VALUES (
  'b1b2c3d4-2222-1111-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'ADMIN',
  'Administrator',
  'Full system access - manages company, users, and all resources',
  true, true, true, true, true, true, true,
  'PRIMARY', 'REVIEW', 'REVIEW', 'PRIMARY',
  100, true, '#3B82F6', 1, NOW(), NOW()
);

-- TECH_LEAD Role
INSERT INTO "QUAD_roles" (id, company_id, role_code, role_name, description,
  can_manage_company, can_manage_users, can_manage_domains, can_manage_flows,
  can_view_all_metrics, can_manage_circles, can_manage_resources,
  q_participation, u_participation, a_participation, d_participation,
  hierarchy_level, is_system_role, color_code, display_order, created_at, updated_at)
VALUES (
  'b1b2c3d4-2222-2222-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'TECH_LEAD',
  'Technical Lead',
  'Leads technical decisions and architecture',
  false, false, true, true, true, true, true,
  'SUPPORT', 'PRIMARY', 'REVIEW', 'REVIEW',
  80, true, '#10B981', 2, NOW(), NOW()
);

-- SENIOR_DEVELOPER Role
INSERT INTO "QUAD_roles" (id, company_id, role_code, role_name, description,
  can_manage_company, can_manage_users, can_manage_domains, can_manage_flows,
  can_view_all_metrics, can_manage_circles, can_manage_resources,
  q_participation, u_participation, a_participation, d_participation,
  hierarchy_level, is_system_role, color_code, display_order, created_at, updated_at)
VALUES (
  'b1b2c3d4-2222-3333-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'SENIOR_DEVELOPER',
  'Senior Developer',
  'Experienced developer with code review responsibilities',
  false, false, false, true, false, false, true,
  'SUPPORT', 'SUPPORT', 'PRIMARY', 'SUPPORT',
  70, true, '#8B5CF6', 3, NOW(), NOW()
);

-- DEVELOPER Role
INSERT INTO "QUAD_roles" (id, company_id, role_code, role_name, description,
  can_manage_company, can_manage_users, can_manage_domains, can_manage_flows,
  can_view_all_metrics, can_manage_circles, can_manage_resources,
  q_participation, u_participation, a_participation, d_participation,
  hierarchy_level, is_system_role, color_code, display_order, created_at, updated_at)
VALUES (
  'b1b2c3d4-2222-4444-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'DEVELOPER',
  'Developer',
  'Core development team member',
  false, false, false, true, false, false, false,
  'INFORM', 'SUPPORT', 'PRIMARY', 'SUPPORT',
  60, true, '#F59E0B', 4, NOW(), NOW()
);

-- JUNIOR_DEVELOPER Role
INSERT INTO "QUAD_roles" (id, company_id, role_code, role_name, description,
  can_manage_company, can_manage_users, can_manage_domains, can_manage_flows,
  can_view_all_metrics, can_manage_circles, can_manage_resources,
  q_participation, u_participation, a_participation, d_participation,
  hierarchy_level, is_system_role, color_code, display_order, created_at, updated_at)
VALUES (
  'b1b2c3d4-2222-5555-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'JUNIOR_DEVELOPER',
  'Junior Developer',
  'Learning developer with mentorship needs',
  false, false, false, false, false, false, false,
  'INFORM', 'INFORM', 'SUPPORT', 'INFORM',
  50, true, '#EF4444', 5, NOW(), NOW()
);

-- QA_ENGINEER Role
INSERT INTO "QUAD_roles" (id, company_id, role_code, role_name, description,
  can_manage_company, can_manage_users, can_manage_domains, can_manage_flows,
  can_view_all_metrics, can_manage_circles, can_manage_resources,
  q_participation, u_participation, a_participation, d_participation,
  hierarchy_level, is_system_role, color_code, display_order, created_at, updated_at)
VALUES (
  'b1b2c3d4-2222-6666-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'QA_ENGINEER',
  'QA Engineer',
  'Quality assurance and testing specialist',
  false, false, false, true, false, false, false,
  'REVIEW', 'REVIEW', 'REVIEW', 'PRIMARY',
  60, true, '#EC4899', 6, NOW(), NOW()
);

-- MOBILE_LEAD Role (Custom for this startup)
INSERT INTO "QUAD_roles" (id, company_id, role_code, role_name, description,
  can_manage_company, can_manage_users, can_manage_domains, can_manage_flows,
  can_view_all_metrics, can_manage_circles, can_manage_resources,
  q_participation, u_participation, a_participation, d_participation,
  hierarchy_level, is_system_role, color_code, display_order, created_at, updated_at)
VALUES (
  'b1b2c3d4-2222-7777-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'MOBILE_LEAD',
  'Mobile Lead',
  'Leads both iOS and Android development',
  false, false, false, true, true, false, true,
  'PRIMARY', 'PRIMARY', 'REVIEW', 'SUPPORT',
  75, false, '#06B6D4', 7, NOW(), NOW()
);

-- ============================================================================
-- 3. CREATE USERS (Founder + 3 Developers)
-- Password hash for 'Test123!@#' using bcrypt
-- ============================================================================

-- Founder (Alex Chen) - ADMIN
INSERT INTO "QUAD_users" (id, company_id, email, password_hash, role_id, role, full_name, is_active, email_verified, created_at, updated_at)
VALUES (
  'c1c2c3d4-3333-1111-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'founder@healthtrack.io',
  '$2a$10$rQEY8tLxE.mJqoLh1JU.EOYwBCvBKwL1HA8GQmQh.cKxQGBPjn8x2',
  'b1b2c3d4-2222-1111-1111-111111111111',
  'ADMIN',
  'Alex Chen',
  true, true, NOW(), NOW()
);

-- iOS Developer (Sarah Kim) - DEVELOPER
INSERT INTO "QUAD_users" (id, company_id, email, password_hash, role_id, role, full_name, is_active, email_verified, created_at, updated_at)
VALUES (
  'c1c2c3d4-3333-2222-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'ios@healthtrack.io',
  '$2a$10$rQEY8tLxE.mJqoLh1JU.EOYwBCvBKwL1HA8GQmQh.cKxQGBPjn8x2',
  'b1b2c3d4-2222-4444-1111-111111111111',
  'DEVELOPER',
  'Sarah Kim',
  true, true, NOW(), NOW()
);

-- Android Developer (Mike Johnson) - DEVELOPER
INSERT INTO "QUAD_users" (id, company_id, email, password_hash, role_id, role, full_name, is_active, email_verified, created_at, updated_at)
VALUES (
  'c1c2c3d4-3333-3333-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'android@healthtrack.io',
  '$2a$10$rQEY8tLxE.mJqoLh1JU.EOYwBCvBKwL1HA8GQmQh.cKxQGBPjn8x2',
  'b1b2c3d4-2222-4444-1111-111111111111',
  'DEVELOPER',
  'Mike Johnson',
  true, true, NOW(), NOW()
);

-- Full Stack Developer (Jamie Lee) - SENIOR_DEVELOPER
INSERT INTO "QUAD_users" (id, company_id, email, password_hash, role_id, role, full_name, is_active, email_verified, created_at, updated_at)
VALUES (
  'c1c2c3d4-3333-4444-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'fullstack@healthtrack.io',
  '$2a$10$rQEY8tLxE.mJqoLh1JU.EOYwBCvBKwL1HA8GQmQh.cKxQGBPjn8x2',
  'b1b2c3d4-2222-3333-1111-111111111111',
  'SENIOR_DEVELOPER',
  'Jamie Lee',
  true, true, NOW(), NOW()
);

-- ============================================================================
-- 4. CREATE ADOPTION MATRIX ENTRIES
-- ============================================================================

-- Alex (Founder) - S2-T2 (Growing User)
INSERT INTO "QUAD_adoption_matrix" (id, user_id, skill_level, trust_level, created_at, updated_at)
VALUES (
  'd1d2d3d4-4444-1111-1111-111111111111',
  'c1c2c3d4-3333-1111-1111-111111111111',
  2, 2, NOW(), NOW()
);

-- Sarah (iOS) - S2-T1 (Skeptical User)
INSERT INTO "QUAD_adoption_matrix" (id, user_id, skill_level, trust_level, created_at, updated_at)
VALUES (
  'd1d2d3d4-4444-2222-1111-111111111111',
  'c1c2c3d4-3333-2222-1111-111111111111',
  2, 1, NOW(), NOW()
);

-- Mike (Android) - S1-T2 (Curious Novice)
INSERT INTO "QUAD_adoption_matrix" (id, user_id, skill_level, trust_level, created_at, updated_at)
VALUES (
  'd1d2d3d4-4444-3333-1111-111111111111',
  'c1c2c3d4-3333-3333-1111-111111111111',
  1, 2, NOW(), NOW()
);

-- Jamie (Full Stack) - S3-T2 (Balanced Expert)
INSERT INTO "QUAD_adoption_matrix" (id, user_id, skill_level, trust_level, created_at, updated_at)
VALUES (
  'd1d2d3d4-4444-4444-1111-111111111111',
  'c1c2c3d4-3333-4444-1111-111111111111',
  3, 2, NOW(), NOW()
);

-- ============================================================================
-- 5. CREATE DOMAIN
-- ============================================================================

INSERT INTO "QUAD_domains" (id, company_id, name, domain_type, path, created_at, updated_at)
VALUES (
  'e1e2e3d4-5555-1111-1111-111111111111',
  'a1b2c3d4-1111-1111-1111-111111111111',
  'HealthTrack App',
  'product',
  '/healthtrack',
  NOW(), NOW()
);

-- ============================================================================
-- 6. ADD DOMAIN MEMBERS
-- ============================================================================

-- Alex (Founder) - 50% allocation (also doing infra)
INSERT INTO "QUAD_domain_members" (id, user_id, domain_id, role, allocation_percentage, created_at, updated_at)
VALUES (
  'f1f2f3d4-6666-1111-1111-111111111111',
  'c1c2c3d4-3333-1111-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'ADMIN',
  50, NOW(), NOW()
);

-- Sarah (iOS) - 100% allocation
INSERT INTO "QUAD_domain_members" (id, user_id, domain_id, role, allocation_percentage, created_at, updated_at)
VALUES (
  'f1f2f3d4-6666-2222-1111-111111111111',
  'c1c2c3d4-3333-2222-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'DEVELOPER',
  100, NOW(), NOW()
);

-- Mike (Android) - 100% allocation
INSERT INTO "QUAD_domain_members" (id, user_id, domain_id, role, allocation_percentage, created_at, updated_at)
VALUES (
  'f1f2f3d4-6666-3333-1111-111111111111',
  'c1c2c3d4-3333-3333-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'DEVELOPER',
  100, NOW(), NOW()
);

-- Jamie (Full Stack) - 80% allocation (also doing QA)
INSERT INTO "QUAD_domain_members" (id, user_id, domain_id, role, allocation_percentage, created_at, updated_at)
VALUES (
  'f1f2f3d4-6666-4444-1111-111111111111',
  'c1c2c3d4-3333-4444-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'SENIOR_DEVELOPER',
  80, NOW(), NOW()
);

-- ============================================================================
-- 7. CREATE 4 CIRCLES
-- ============================================================================

-- Circle 1: Management (DEDICATED - 100%)
INSERT INTO "QUAD_circles" (id, domain_id, circle_number, circle_name, description, lead_user_id, is_active, created_at, updated_at)
VALUES (
  'a1a2a3a4-7777-1111-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  1,
  'Product & Planning',
  'Product management, story creation, scheduling. DEDICATED allocation.',
  'c1c2c3d4-3333-1111-1111-111111111111', -- Alex leads
  true, NOW(), NOW()
);

-- Circle 2: Development (MOSTLY_DEDICATED - 75%)
INSERT INTO "QUAD_circles" (id, domain_id, circle_number, circle_name, description, lead_user_id, is_active, created_at, updated_at)
VALUES (
  'a1a2a3a4-7777-2222-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  2,
  'Mobile & Web Dev',
  'iOS, Android, and Web development. MOSTLY DEDICATED allocation.',
  'c1c2c3d4-3333-4444-1111-111111111111', -- Jamie leads
  true, NOW(), NOW()
);

-- Circle 3: QA (MOSTLY_SHARED - 40%)
INSERT INTO "QUAD_circles" (id, domain_id, circle_number, circle_name, description, lead_user_id, is_active, created_at, updated_at)
VALUES (
  'a1a2a3a4-7777-3333-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  3,
  'Quality Assurance',
  'Testing, automation, quality gates. MOSTLY SHARED allocation.',
  'c1c2c3d4-3333-4444-1111-111111111111', -- Jamie leads (shared)
  true, NOW(), NOW()
);

-- Circle 4: Infrastructure (SHARED - 20%)
INSERT INTO "QUAD_circles" (id, domain_id, circle_number, circle_name, description, lead_user_id, is_active, created_at, updated_at)
VALUES (
  'a1a2a3a4-7777-4444-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  4,
  'DevOps & Cloud',
  'GCP deployment, monitoring, CI/CD. SHARED allocation.',
  'c1c2c3d4-3333-1111-1111-111111111111', -- Alex leads (shared)
  true, NOW(), NOW()
);

-- ============================================================================
-- 8. ADD CIRCLE MEMBERS
-- ============================================================================

-- Circle 1 (Management): Alex only
INSERT INTO "QUAD_circle_members" (id, circle_id, user_id, role, allocation_pct, created_at, updated_at)
VALUES (
  'b1b2b3b4-8888-1111-1111-111111111111',
  'a1a2a3a4-7777-1111-1111-111111111111',
  'c1c2c3d4-3333-1111-1111-111111111111',
  'lead',
  100, NOW(), NOW()
);

-- Circle 2 (Development): All devs
INSERT INTO "QUAD_circle_members" (id, circle_id, user_id, role, allocation_pct, created_at, updated_at)
VALUES
  ('b1b2b3b4-8888-2111-1111-111111111111', 'a1a2a3a4-7777-2222-1111-111111111111', 'c1c2c3d4-3333-4444-1111-111111111111', 'lead', 100, NOW(), NOW()),
  ('b1b2b3b4-8888-2222-1111-111111111111', 'a1a2a3a4-7777-2222-1111-111111111111', 'c1c2c3d4-3333-2222-1111-111111111111', 'member', 100, NOW(), NOW()),
  ('b1b2b3b4-8888-2333-1111-111111111111', 'a1a2a3a4-7777-2222-1111-111111111111', 'c1c2c3d4-3333-3333-1111-111111111111', 'member', 100, NOW(), NOW());

-- Circle 3 (QA): Jamie (shared)
INSERT INTO "QUAD_circle_members" (id, circle_id, user_id, role, allocation_pct, created_at, updated_at)
VALUES (
  'b1b2b3b4-8888-3111-1111-111111111111',
  'a1a2a3a4-7777-3333-1111-111111111111',
  'c1c2c3d4-3333-4444-1111-111111111111',
  'lead',
  40, NOW(), NOW()
);

-- Circle 4 (Infrastructure): Alex (shared)
INSERT INTO "QUAD_circle_members" (id, circle_id, user_id, role, allocation_pct, created_at, updated_at)
VALUES (
  'b1b2b3b4-8888-4111-1111-111111111111',
  'a1a2a3a4-7777-4444-1111-111111111111',
  'c1c2c3d4-3333-1111-1111-111111111111',
  'lead',
  20, NOW(), NOW()
);

-- ============================================================================
-- 9. CREATE DOMAIN RESOURCES
-- ============================================================================

-- Git Repository: iOS App
INSERT INTO "QUAD_domain_resources" (id, domain_id, resource_type, resource_name, resource_status, created_by, created_at, updated_at)
VALUES (
  'c1c2c3c4-9999-1111-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'GIT_REPO',
  'healthtrack-ios',
  'active',
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW(), NOW()
);

INSERT INTO "QUAD_resource_attributes" (id, resource_id, attribute_name, attribute_value, created_at, updated_at)
VALUES
  ('d1d2d3d4-0000-1111-1111-111111111111', 'c1c2c3c4-9999-1111-1111-111111111111', 'url', 'https://github.com/healthtrack/ios-app', NOW(), NOW()),
  ('d1d2d3d4-0000-1112-1111-111111111111', 'c1c2c3c4-9999-1111-1111-111111111111', 'branch', 'main', NOW(), NOW()),
  ('d1d2d3d4-0000-1113-1111-111111111111', 'c1c2c3c4-9999-1111-1111-111111111111', 'language', 'Swift', NOW(), NOW());

-- Git Repository: Android App
INSERT INTO "QUAD_domain_resources" (id, domain_id, resource_type, resource_name, resource_status, created_by, created_at, updated_at)
VALUES (
  'c1c2c3c4-9999-2222-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'GIT_REPO',
  'healthtrack-android',
  'active',
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW(), NOW()
);

INSERT INTO "QUAD_resource_attributes" (id, resource_id, attribute_name, attribute_value, created_at, updated_at)
VALUES
  ('d1d2d3d4-0000-2111-1111-111111111111', 'c1c2c3c4-9999-2222-1111-111111111111', 'url', 'https://github.com/healthtrack/android-app', NOW(), NOW()),
  ('d1d2d3d4-0000-2112-1111-111111111111', 'c1c2c3c4-9999-2222-1111-111111111111', 'branch', 'main', NOW(), NOW()),
  ('d1d2d3d4-0000-2113-1111-111111111111', 'c1c2c3c4-9999-2222-1111-111111111111', 'language', 'Kotlin', NOW(), NOW());

-- Git Repository: Web App
INSERT INTO "QUAD_domain_resources" (id, domain_id, resource_type, resource_name, resource_status, created_by, created_at, updated_at)
VALUES (
  'c1c2c3c4-9999-3333-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'GIT_REPO',
  'healthtrack-web',
  'active',
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW(), NOW()
);

INSERT INTO "QUAD_resource_attributes" (id, resource_id, attribute_name, attribute_value, created_at, updated_at)
VALUES
  ('d1d2d3d4-0000-3111-1111-111111111111', 'c1c2c3c4-9999-3333-1111-111111111111', 'url', 'https://github.com/healthtrack/web-app', NOW(), NOW()),
  ('d1d2d3d4-0000-3112-1111-111111111111', 'c1c2c3c4-9999-3333-1111-111111111111', 'branch', 'main', NOW(), NOW()),
  ('d1d2d3d4-0000-3113-1111-111111111111', 'c1c2c3c4-9999-3333-1111-111111111111', 'language', 'TypeScript', NOW(), NOW());

-- Database: PostgreSQL Dev
INSERT INTO "QUAD_domain_resources" (id, domain_id, resource_type, resource_name, resource_status, created_by, created_at, updated_at)
VALUES (
  'c1c2c3c4-9999-4444-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'DATABASE',
  'PostgreSQL Dev',
  'active',
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW(), NOW()
);

INSERT INTO "QUAD_resource_attributes" (id, resource_id, attribute_name, attribute_value, created_at, updated_at)
VALUES
  ('d1d2d3d4-0000-4111-1111-111111111111', 'c1c2c3c4-9999-4444-1111-111111111111', 'host', 'localhost', NOW(), NOW()),
  ('d1d2d3d4-0000-4112-1111-111111111111', 'c1c2c3c4-9999-4444-1111-111111111111', 'port', '5432', NOW(), NOW()),
  ('d1d2d3d4-0000-4113-1111-111111111111', 'c1c2c3c4-9999-4444-1111-111111111111', 'database', 'healthtrack_dev', NOW(), NOW());

-- Cloud Project: GCP
INSERT INTO "QUAD_domain_resources" (id, domain_id, resource_type, resource_name, resource_status, created_by, created_at, updated_at)
VALUES (
  'c1c2c3c4-9999-5555-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'CLOUD_PROJECT',
  'GCP Production',
  'active',
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW(), NOW()
);

INSERT INTO "QUAD_resource_attributes" (id, resource_id, attribute_name, attribute_value, created_at, updated_at)
VALUES
  ('d1d2d3d4-0000-5111-1111-111111111111', 'c1c2c3c4-9999-5555-1111-111111111111', 'project_id', 'healthtrack-prod', NOW(), NOW()),
  ('d1d2d3d4-0000-5112-1111-111111111111', 'c1c2c3c4-9999-5555-1111-111111111111', 'region', 'us-central1', NOW(), NOW()),
  ('d1d2d3d4-0000-5113-1111-111111111111', 'c1c2c3c4-9999-5555-1111-111111111111', 'services', 'Cloud Run, Cloud SQL, Cloud Storage', NOW(), NOW());

-- ============================================================================
-- 10. CREATE SAMPLE FLOWS (Q-U-A-D Stages)
-- ============================================================================

-- Flow 1: User Authentication (Stage: Q - just started)
INSERT INTO "QUAD_flows" (id, domain_id, title, description, flow_type, quad_stage, stage_status, priority,
  question_started_at, assigned_to, circle_number, created_by, created_at, updated_at)
VALUES (
  'e1e2e3e4-1111-1111-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'Implement User Authentication',
  'OAuth2 + Email/Password login for all platforms (iOS, Android, Web)',
  'feature',
  'Q',
  'in_progress',
  'high',
  NOW(),
  'c1c2c3d4-3333-4444-1111-111111111111', -- Jamie
  2, -- Development circle
  'c1c2c3d4-3333-1111-1111-111111111111', -- Alex created
  NOW(), NOW()
);

-- Flow 2: HealthKit Integration (Stage: U - designing)
INSERT INTO "QUAD_flows" (id, domain_id, title, description, flow_type, quad_stage, stage_status, priority,
  question_started_at, question_completed_at, understand_started_at, assigned_to, circle_number, created_by, created_at, updated_at)
VALUES (
  'e1e2e3e4-1111-2222-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'HealthKit/Google Fit Integration',
  'Sync step count, heart rate, sleep data from device health APIs',
  'feature',
  'U',
  'in_progress',
  'high',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  'c1c2c3d4-3333-2222-1111-111111111111', -- Sarah (iOS)
  2, -- Development circle
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW() - INTERVAL '3 days', NOW()
);

-- Flow 3: API Backend (Stage: A - implementing)
INSERT INTO "QUAD_flows" (id, domain_id, title, description, flow_type, quad_stage, stage_status, priority,
  question_started_at, question_completed_at, understand_started_at, understand_completed_at, allocate_started_at,
  assigned_to, circle_number, ai_estimate_hours, buffer_pct, created_by, created_at, updated_at)
VALUES (
  'e1e2e3e4-1111-3333-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'Core API Backend',
  'RESTful API for user management, health data storage, sync endpoints',
  'feature',
  'A',
  'in_progress',
  'critical',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  'c1c2c3d4-3333-4444-1111-111111111111', -- Jamie
  2, -- Development circle
  40.00,
  20,
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW() - INTERVAL '7 days', NOW()
);

-- Flow 4: GCP Deployment (Stage: D - deploying)
INSERT INTO "QUAD_flows" (id, domain_id, title, description, flow_type, quad_stage, stage_status, priority,
  question_started_at, question_completed_at, understand_started_at, understand_completed_at,
  allocate_started_at, allocate_completed_at, deliver_started_at,
  assigned_to, circle_number, ai_estimate_hours, buffer_pct, actual_hours, created_by, created_at, updated_at)
VALUES (
  'e1e2e3e4-1111-4444-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'GCP Cloud Run Deployment',
  'Set up CI/CD pipeline, Cloud Run services, Cloud SQL instance',
  'infrastructure',
  'D',
  'in_progress',
  'high',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '9 days',
  NOW() - INTERVAL '9 days',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  'c1c2c3d4-3333-1111-1111-111111111111', -- Alex
  4, -- Infrastructure circle
  16.00,
  10,
  14.50,
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW() - INTERVAL '10 days', NOW()
);

-- Flow 5: Onboarding Screens (Stage: completed)
INSERT INTO "QUAD_flows" (id, domain_id, title, description, flow_type, quad_stage, stage_status, priority,
  question_started_at, question_completed_at, understand_started_at, understand_completed_at,
  allocate_started_at, allocate_completed_at, deliver_started_at, deliver_completed_at,
  assigned_to, circle_number, ai_estimate_hours, actual_hours, created_by, created_at, updated_at)
VALUES (
  'e1e2e3e4-1111-5555-1111-111111111111',
  'e1e2e3d4-5555-1111-1111-111111111111',
  'User Onboarding Flow',
  'First-time user experience with profile setup, health goals, and permissions',
  'feature',
  'D',
  'completed',
  'medium',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '13 days',
  NOW() - INTERVAL '13 days',
  NOW() - INTERVAL '11 days',
  NOW() - INTERVAL '11 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day',
  'c1c2c3d4-3333-3333-1111-111111111111', -- Mike
  2, -- Development circle
  24.00,
  22.50,
  'c1c2c3d4-3333-1111-1111-111111111111',
  NOW() - INTERVAL '14 days', NOW()
);

-- ============================================================================
-- 11. CREATE FLOW STAGE HISTORY
-- ============================================================================

-- History for Flow 5 (completed flow)
INSERT INTO "QUAD_flow_stage_history" (id, flow_id, from_stage, to_stage, from_status, to_status, changed_by, change_reason, created_at)
VALUES
  ('f1f2f3f4-1111-1111-1111-111111111111', 'e1e2e3e4-1111-5555-1111-111111111111', NULL, 'Q', NULL, 'in_progress', 'c1c2c3d4-3333-1111-1111-111111111111', 'Flow created', NOW() - INTERVAL '14 days'),
  ('f1f2f3f4-1111-2222-1111-111111111111', 'e1e2e3e4-1111-5555-1111-111111111111', 'Q', 'U', 'completed', 'in_progress', 'c1c2c3d4-3333-1111-1111-111111111111', 'Requirements approved', NOW() - INTERVAL '13 days'),
  ('f1f2f3f4-1111-3333-1111-111111111111', 'e1e2e3e4-1111-5555-1111-111111111111', 'U', 'A', 'completed', 'in_progress', 'c1c2c3d4-3333-4444-1111-111111111111', 'Design approved', NOW() - INTERVAL '11 days'),
  ('f1f2f3f4-1111-4444-1111-111111111111', 'e1e2e3e4-1111-5555-1111-111111111111', 'A', 'D', 'completed', 'in_progress', 'c1c2c3d4-3333-3333-1111-111111111111', 'Code complete, ready for deploy', NOW() - INTERVAL '5 days'),
  ('f1f2f3f4-1111-5555-1111-111111111111', 'e1e2e3e4-1111-5555-1111-111111111111', 'D', 'D', 'in_progress', 'completed', 'c1c2c3d4-3333-1111-1111-111111111111', 'Deployed to production', NOW() - INTERVAL '1 day');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify data was inserted
SELECT 'Companies' as entity, COUNT(*) as count FROM "QUAD_companies" WHERE name = 'HealthTrack Startup'
UNION ALL
SELECT 'Roles', COUNT(*) FROM "QUAD_roles" WHERE company_id = 'a1b2c3d4-1111-1111-1111-111111111111'
UNION ALL
SELECT 'Users', COUNT(*) FROM "QUAD_users" WHERE email LIKE '%@healthtrack.io'
UNION ALL
SELECT 'Domains', COUNT(*) FROM "QUAD_domains" WHERE name = 'HealthTrack App'
UNION ALL
SELECT 'Circles', COUNT(*) FROM "QUAD_circles" WHERE domain_id = 'e1e2e3d4-5555-1111-1111-111111111111'
UNION ALL
SELECT 'Flows', COUNT(*) FROM "QUAD_flows" WHERE domain_id = 'e1e2e3d4-5555-1111-1111-111111111111'
UNION ALL
SELECT 'Resources', COUNT(*) FROM "QUAD_domain_resources" WHERE domain_id = 'e1e2e3d4-5555-1111-1111-111111111111';

-- ============================================================================
-- TEST CREDENTIALS
-- ============================================================================
--
-- Admin Login:
--   Email: founder@healthtrack.io
--   Password: Test123!@#
--
-- Developer Logins:
--   ios@healthtrack.io / Test123!@#
--   android@healthtrack.io / Test123!@#
--   fullstack@healthtrack.io / Test123!@#
--
-- ============================================================================
