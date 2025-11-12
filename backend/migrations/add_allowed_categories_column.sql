-- Migration: Add allowed_categories column to user_tab_permissions table
-- Date: November 12, 2024
-- Description: Add category-based access control for movements and manual entries

-- Add allowed_categories column to user_tab_permissions table
-- Using JSONB for efficient storage and querying of category arrays
ALTER TABLE user_tab_permissions 
ADD COLUMN IF NOT EXISTS allowed_categories JSONB DEFAULT NULL;

-- Add index for faster queries on allowed_categories
CREATE INDEX IF NOT EXISTS idx_user_tab_permissions_allowed_categories 
ON user_tab_permissions USING GIN (allowed_categories);

-- Note: This migration is backward-compatible
-- NULL or empty array means access to all categories
-- Non-empty array restricts access to specified categories only
