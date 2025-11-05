-- Migration: Remove visibility column from movement table
-- Date: November 5, 2024
-- Description: Remove the visibility field as it's no longer needed

-- Remove visibility column from movement table
ALTER TABLE movement DROP COLUMN IF EXISTS visibility;

-- Note: This migration is backward-compatible and can be run safely
-- All existing data will remain intact, only the visibility column is removed
