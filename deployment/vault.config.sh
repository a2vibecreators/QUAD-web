#!/bin/bash
# =============================================================================
# Vaultwarden Configuration
# =============================================================================
# This file contains Vaultwarden organization and collection IDs
# DO NOT commit BW_SESSION to version control!
# =============================================================================

# QUAD Organization ID (hardcoded - this does not change)
export VAULT_QUAD_ORG_ID="7548352c-4c18-45ab-ba58-cabceb58a25b"

# Collection IDs per environment
export VAULT_COLLECTION_DEV="bd26fd3e-b01f-47a9-80e9-9841b52fc1c6"
export VAULT_COLLECTION_QA="5b3ffa64-ee2e-41e2-a05a-11d4603f5496"
export VAULT_COLLECTION_PROD="0dc1c5d4-0b3d-49fc-8ab9-2322e1e2db67"

# NutriNine Organization ID (for reference)
export VAULT_NUTRININE_ORG_ID="c1c58783-3eee-4a54-8d9d-5489538e9ba9"

# Usage:
#   source deployment/vault.config.sh
#   echo $VAULT_QUAD_ORG_ID
