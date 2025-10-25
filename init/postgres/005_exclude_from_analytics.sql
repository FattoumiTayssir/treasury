-- Migration: Add exclude_from_analytics flag for movements and exceptions
-- Date: 2025-10-25

-- Add exclude_from_analytics column to movement table
ALTER TABLE movement 
ADD COLUMN IF NOT EXISTS exclude_from_analytics BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN movement.exclude_from_analytics IS 'When true, this movement is excluded from all analytics and projections';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS IX_Movement_exclude_analytics 
    ON movement(exclude_from_analytics) WHERE exclude_from_analytics = FALSE;

-- Add exclude_from_analytics column to Exception table
ALTER TABLE "Exception" 
ADD COLUMN IF NOT EXISTS exclude_from_analytics BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN "Exception".exclude_from_analytics IS 'When true, this exception is excluded from all analytics displays';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS IX_Exception_exclude_analytics 
    ON "Exception"(exclude_from_analytics) WHERE exclude_from_analytics = FALSE;
