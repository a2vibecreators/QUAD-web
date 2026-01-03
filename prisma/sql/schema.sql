-- QUAD Framework Database Schema
-- Modular SQL Schema Loader
--
-- This file loads all individual table files organized by domain.
-- Run this file to create/update the complete schema.
--
-- Structure:
--   /sql
--   ├── schema.sql (this file)
--   ├── core/        - Organizations, Users, Roles
--   ├── domains/     - Domains, Resources, Tickets
--   ├── git/         - Git, PRs, Repositories
--   ├── meetings/    - Meetings, Calendar Integration
--   ├── memory/      - QUAD Memory System
--   ├── ai/          - AI Providers, Configs, Credits
--   ├── infrastructure/ - Sandboxes, Cache, Indexing
--   ├── skills/      - Skills, Assignments
--   ├── flows/       - Workflows, Deployments
--   └── portal/      - Portal Access, Audit

-- Created: January 3, 2026
-- Maintainer: A2Vibe Creators LLC

-- ============================================================================
-- CORE TABLES (Organizations, Users, Roles)
-- ============================================================================

\echo 'Loading Core Tables...'
\i core/QUAD_org_tiers.tbl.sql
\i core/QUAD_organizations.tbl.sql
\i core/QUAD_org_settings.tbl.sql
\i core/QUAD_org_setup_status.tbl.sql
\i core/QUAD_org_members.tbl.sql
\i core/QUAD_org_invitations.tbl.sql
\i core/QUAD_core_roles.tbl.sql
\i core/QUAD_roles.tbl.sql
\i core/QUAD_users.tbl.sql
\i core/QUAD_user_sessions.tbl.sql
\i core/QUAD_email_verification_codes.tbl.sql

-- ============================================================================
-- DOMAINS & PROJECTS
-- ============================================================================

\echo 'Loading Domain Tables...'
\i domains/QUAD_domains.tbl.sql
\i domains/QUAD_domain_members.tbl.sql
\i domains/QUAD_domain_resources.tbl.sql
\i domains/QUAD_domain_operations.tbl.sql
\i domains/QUAD_resource_attributes.tbl.sql
\i domains/QUAD_requirements.tbl.sql
\i domains/QUAD_milestones.tbl.sql
\i domains/QUAD_adoption_matrix.tbl.sql
\i domains/QUAD_workload_metrics.tbl.sql

-- ============================================================================
-- CIRCLES & TICKETS
-- ============================================================================

\echo 'Loading Ticket Tables...'
\i tickets/QUAD_circles.tbl.sql
\i tickets/QUAD_circle_members.tbl.sql
\i tickets/QUAD_cycles.tbl.sql
\i tickets/QUAD_tickets.tbl.sql
\i tickets/QUAD_ticket_comments.tbl.sql
\i tickets/QUAD_ticket_time_logs.tbl.sql
\i tickets/QUAD_ticket_skills.tbl.sql
\i tickets/QUAD_assignment_scores.tbl.sql

-- ============================================================================
-- GIT & PULL REQUESTS
-- ============================================================================

\echo 'Loading Git Tables...'
\i git/QUAD_git_integrations.tbl.sql
\i git/QUAD_git_repositories.tbl.sql
\i git/QUAD_pull_requests.tbl.sql
\i git/QUAD_pr_reviewers.tbl.sql
\i git/QUAD_pr_approvals.tbl.sql
\i git/QUAD_git_operations.tbl.sql

-- ============================================================================
-- MEETINGS & CALENDAR
-- ============================================================================

\echo 'Loading Meeting Tables...'
\i meetings/QUAD_meeting_integrations.tbl.sql
\i meetings/QUAD_meetings.tbl.sql
\i meetings/QUAD_meeting_action_items.tbl.sql
\i meetings/QUAD_meeting_follow_ups.tbl.sql

-- ============================================================================
-- QUAD MEMORY SYSTEM
-- ============================================================================

\echo 'Loading Memory Tables...'
\i memory/QUAD_memory_documents.tbl.sql
\i memory/QUAD_memory_chunks.tbl.sql
\i memory/QUAD_memory_keywords.tbl.sql
\i memory/QUAD_memory_templates.tbl.sql
\i memory/QUAD_context_sessions.tbl.sql
\i memory/QUAD_context_requests.tbl.sql
\i memory/QUAD_context_rules.tbl.sql
\i memory/QUAD_memory_update_queue.tbl.sql

-- ============================================================================
-- AI & PROVIDERS
-- ============================================================================

\echo 'Loading AI Tables...'
\i ai/QUAD_ai_provider_config.tbl.sql
\i ai/QUAD_ai_configs.tbl.sql
\i ai/QUAD_ai_operations.tbl.sql
\i ai/QUAD_ai_contexts.tbl.sql
\i ai/QUAD_ai_context_relationships.tbl.sql
\i ai/QUAD_ai_code_reviews.tbl.sql
\i ai/QUAD_ai_conversations.tbl.sql
\i ai/QUAD_ai_messages.tbl.sql
\i ai/QUAD_ai_user_memories.tbl.sql
\i ai/QUAD_ai_activity_routing.tbl.sql
\i ai/QUAD_ai_analysis_cache.tbl.sql
\i ai/QUAD_ai_credit_balances.tbl.sql
\i ai/QUAD_ai_credit_transactions.tbl.sql
\i ai/QUAD_platform_credit_pool.tbl.sql
\i ai/QUAD_platform_pool_transactions.tbl.sql
\i ai/QUAD_rag_indexes.tbl.sql

-- ============================================================================
-- INFRASTRUCTURE (Sandboxes, Cache, Indexing)
-- ============================================================================

\echo 'Loading Infrastructure Tables...'
\i infrastructure/QUAD_infrastructure_config.tbl.sql
\i infrastructure/QUAD_sandbox_instances.tbl.sql
\i infrastructure/QUAD_ticket_sandbox_groups.tbl.sql
\i infrastructure/QUAD_codebase_files.tbl.sql
\i infrastructure/QUAD_codebase_indexes.tbl.sql
\i infrastructure/QUAD_code_cache.tbl.sql
\i infrastructure/QUAD_cache_usage.tbl.sql
\i infrastructure/QUAD_sandbox_usage.tbl.sql
\i infrastructure/QUAD_indexing_usage.tbl.sql

-- ============================================================================
-- SKILLS & ASSIGNMENTS
-- ============================================================================

\echo 'Loading Skills Tables...'
\i skills/QUAD_skills.tbl.sql
\i skills/QUAD_user_skills.tbl.sql
\i skills/QUAD_skill_feedback.tbl.sql

-- ============================================================================
-- FLOWS & DEPLOYMENTS
-- ============================================================================

\echo 'Loading Flow Tables...'
\i flows/QUAD_flows.tbl.sql
\i flows/QUAD_flow_stage_history.tbl.sql
\i flows/QUAD_flow_branches.tbl.sql
\i flows/QUAD_environments.tbl.sql
\i flows/QUAD_deployment_recipes.tbl.sql
\i flows/QUAD_deployments.tbl.sql
\i flows/QUAD_release_notes.tbl.sql
\i flows/QUAD_release_contributors.tbl.sql
\i flows/QUAD_rollback_operations.tbl.sql

-- ============================================================================
-- PORTAL & ACCESS
-- ============================================================================

\echo 'Loading Portal Tables...'
\i portal/QUAD_portal_access.tbl.sql
\i portal/QUAD_portal_audit_log.tbl.sql

-- ============================================================================
-- OTHER TABLES
-- ============================================================================

\echo 'Loading Other Tables...'
\i other/QUAD_notifications.tbl.sql
\i other/QUAD_notification_preferences.tbl.sql
\i other/QUAD_user_role_allocations.tbl.sql
\i other/QUAD_approvals.tbl.sql
\i other/QUAD_file_imports.tbl.sql
\i other/QUAD_work_sessions.tbl.sql
\i other/QUAD_user_activity_summaries.tbl.sql
\i other/QUAD_database_connections.tbl.sql
\i other/QUAD_database_operations.tbl.sql
\i other/QUAD_database_approvals.tbl.sql
\i other/QUAD_anonymization_rules.tbl.sql
\i other/QUAD_verification_requests.tbl.sql
\i other/QUAD_validated_credentials.tbl.sql
\i other/QUAD_integration_health_checks.tbl.sql
\i other/QUAD_api_access_config.tbl.sql
\i other/QUAD_api_request_logs.tbl.sql

-- ============================================================================
-- ANALYTICS & METRICS
-- ============================================================================

\echo 'Loading Analytics Tables...'
\i analytics/QUAD_cycle_risk_predictions.tbl.sql
\i analytics/QUAD_story_point_suggestions.tbl.sql
\i analytics/QUAD_technical_debt_scores.tbl.sql
\i analytics/QUAD_dora_metrics.tbl.sql
\i analytics/QUAD_ranking_configs.tbl.sql
\i analytics/QUAD_user_rankings.tbl.sql
\i analytics/QUAD_kudos.tbl.sql
\i analytics/QUAD_cost_estimates.tbl.sql
\i analytics/QUAD_risk_factors.tbl.sql

-- ============================================================================
-- SECURITY
-- ============================================================================

\echo 'Loading Security Tables...'
\i security/QUAD_secret_scans.tbl.sql
\i security/QUAD_secret_rotations.tbl.sql
\i security/QUAD_incident_runbooks.tbl.sql
\i security/QUAD_runbook_executions.tbl.sql

-- ============================================================================
-- ONBOARDING & SETUP
-- ============================================================================

\echo 'Loading Onboarding Tables...'
\i onboarding/QUAD_resource_setup_templates.tbl.sql
\i onboarding/QUAD_user_resource_setups.tbl.sql
\i onboarding/QUAD_setup_bundles.tbl.sql
\i onboarding/QUAD_user_setup_journeys.tbl.sql
\i onboarding/QUAD_developer_onboarding_templates.tbl.sql
\i onboarding/QUAD_developer_onboarding_progress.tbl.sql
\i onboarding/QUAD_training_content.tbl.sql
\i onboarding/QUAD_training_completions.tbl.sql

-- ============================================================================
-- SLACK INTEGRATION
-- ============================================================================

\echo 'Loading Slack Tables...'
\i slack/QUAD_slack_bot_commands.tbl.sql
\i slack/QUAD_slack_messages.tbl.sql

-- ============================================================================
-- DONE
-- ============================================================================

\echo '✅ QUAD Framework schema loaded successfully!'
\echo 'Tables created in categories:'
\echo '  - Core (Organizations, Users, Roles)'
\echo '  - Domains & Projects'
\echo '  - Tickets & Circles'
\echo '  - Git & Pull Requests'
\echo '  - Meetings & Calendar'
\echo '  - QUAD Memory System'
\echo '  - AI & Providers'
\echo '  - Infrastructure (Sandboxes, Cache)'
\echo '  - Skills & Assignments'
\echo '  - Flows & Deployments'
\echo '  - Portal & Access'
\echo '  - Analytics & Metrics'
\echo '  - Security'
\echo '  - Onboarding & Training'
\echo '  - Slack Integration'
