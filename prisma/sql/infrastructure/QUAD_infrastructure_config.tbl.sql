-- QUAD_infrastructure_config Table
-- Organization-level infrastructure configuration
--
-- Controls three main strategies:
--   1. Sandbox Strategy: dedicated, shared, on_demand
--   2. Indexing Strategy: minimal, balanced, deep
--   3. Cache Strategy: basic, standard, premium, custom
--
-- Part of: QUAD Infrastructure System
-- Created: January 2026
-- Last Modified: January 3, 2026

CREATE TABLE IF NOT EXISTS QUAD_infrastructure_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL UNIQUE REFERENCES QUAD_organizations(id) ON DELETE CASCADE,

    -- ========================================================================
    -- SANDBOX STRATEGY
    -- ========================================================================
    -- 'dedicated' = Per-ticket sandbox (Enterprise)
    -- 'shared' = Shared pool (Default, most cost-effective)
    -- 'on_demand' = Serverless, spin up only when needed
    sandbox_strategy              VARCHAR(20) NOT NULL DEFAULT 'shared',
    sandbox_pool_size             INTEGER DEFAULT 0, -- For shared: number of warm instances
    sandbox_enable_ticket_grouping BOOLEAN DEFAULT true, -- AI suggests grouping tickets

    -- Dedicated sandbox settings
    sandbox_dedicated_max_per_ticket INTEGER DEFAULT 1,
    sandbox_dedicated_timeout_hours  INTEGER DEFAULT 24, -- Auto-terminate after

    -- On-demand settings
    sandbox_ondemand_timeout_minutes INTEGER DEFAULT 30,
    sandbox_ondemand_max_concurrent  INTEGER DEFAULT 5,

    -- ========================================================================
    -- INDEXING STRATEGY
    -- ========================================================================
    -- 'minimal' = File names + keywords only (FREE)
    -- 'balanced' = + Functions + AI summaries (Default)
    -- 'deep' = + AST + Dependencies + Full analysis
    indexing_depth                VARCHAR(20) NOT NULL DEFAULT 'balanced',
    indexing_include_tests        BOOLEAN DEFAULT false,
    indexing_include_node_modules BOOLEAN DEFAULT false,
    indexing_max_file_size_kb     INTEGER DEFAULT 500, -- Skip files larger than this
    indexing_languages            TEXT[] DEFAULT '{}', -- Empty = all supported

    -- ========================================================================
    -- CACHE STRATEGY
    -- ========================================================================
    -- 'basic' = 256MB, 1 hour TTL (FREE)
    -- 'standard' = 1GB, 24 hours TTL
    -- 'premium' = 5GB, 7 days TTL
    -- 'custom' = User-defined
    cache_tier                    VARCHAR(20) NOT NULL DEFAULT 'basic',
    cache_size_mb                 INTEGER DEFAULT 256,
    cache_ttl_hours               INTEGER DEFAULT 1,
    cache_priority_paths          TEXT[] DEFAULT '{}', -- Always cache these paths

    -- ========================================================================
    -- CLOUD PROVIDER (BYOK for Infrastructure)
    -- ========================================================================
    cloud_provider                VARCHAR(20) DEFAULT 'gcp',
    -- 'gcp' = Google Cloud (Default)
    -- 'aws' = Amazon Web Services
    -- 'azure' = Microsoft Azure
    -- 'byok' = Bring Your Own Kubernetes

    cloud_region                  VARCHAR(50),
    cloud_project_id              VARCHAR(255), -- For BYOK

    -- Kubernetes settings (for BYOK)
    k8s_cluster_endpoint          VARCHAR(500),
    k8s_namespace                 VARCHAR(100) DEFAULT 'quad-sandboxes',
    k8s_service_account           VARCHAR(255),

    -- ========================================================================
    -- COST CONTROLS
    -- ========================================================================
    monthly_budget_usd            DECIMAL(10, 2),
    alert_threshold_percent       INTEGER DEFAULT 80,
    auto_downgrade_on_budget      BOOLEAN DEFAULT false, -- Downgrade to cheaper tier

    -- ========================================================================
    -- METADATA
    -- ========================================================================
    configured_by                 UUID REFERENCES QUAD_users(id),
    configured_at                 TIMESTAMP WITH TIME ZONE,
    last_reviewed_at              TIMESTAMP WITH TIME ZONE,

    created_at                    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quad_infra_config_org ON QUAD_infrastructure_config(org_id);
CREATE INDEX IF NOT EXISTS idx_quad_infra_config_sandbox ON QUAD_infrastructure_config(sandbox_strategy);
CREATE INDEX IF NOT EXISTS idx_quad_infra_config_cache ON QUAD_infrastructure_config(cache_tier);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_quad_infrastructure_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quad_infrastructure_config_updated ON QUAD_infrastructure_config;
CREATE TRIGGER trg_quad_infrastructure_config_updated
    BEFORE UPDATE ON QUAD_infrastructure_config
    FOR EACH ROW
    EXECUTE FUNCTION update_quad_infrastructure_config_timestamp();

-- Check constraints
ALTER TABLE QUAD_infrastructure_config
    ADD CONSTRAINT chk_sandbox_strategy
    CHECK (sandbox_strategy IN ('dedicated', 'shared', 'on_demand'));

ALTER TABLE QUAD_infrastructure_config
    ADD CONSTRAINT chk_indexing_depth
    CHECK (indexing_depth IN ('minimal', 'balanced', 'deep'));

ALTER TABLE QUAD_infrastructure_config
    ADD CONSTRAINT chk_cache_tier
    CHECK (cache_tier IN ('basic', 'standard', 'premium', 'custom'));

ALTER TABLE QUAD_infrastructure_config
    ADD CONSTRAINT chk_cloud_provider
    CHECK (cloud_provider IN ('gcp', 'aws', 'azure', 'byok'));

-- Comments
COMMENT ON TABLE QUAD_infrastructure_config IS 'Organization-level infrastructure settings';
COMMENT ON COLUMN QUAD_infrastructure_config.sandbox_strategy IS 'dedicated, shared (default), or on_demand';
COMMENT ON COLUMN QUAD_infrastructure_config.indexing_depth IS 'minimal, balanced (default), or deep';
COMMENT ON COLUMN QUAD_infrastructure_config.cache_tier IS 'basic (default), standard, premium, or custom';
COMMENT ON COLUMN QUAD_infrastructure_config.cloud_provider IS 'gcp (default), aws, azure, or byok';
