-- Migration: Add own_data_only column to user_tab_permissions
-- This allows users to be restricted to only see/modify their own data

BEGIN;

-- Add own_data_only column
ALTER TABLE user_tab_permissions 
ADD COLUMN IF NOT EXISTS own_data_only BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN user_tab_permissions.own_data_only IS 
'If true, user can only see/modify data they created (for movements and manual-entries)';

COMMIT;
