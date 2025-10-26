-- Migration: Add created_by column to manual_entry table
-- This allows tracking who created each manual entry for permission filtering

BEGIN;

-- Add created_by column
ALTER TABLE manual_entry 
ADD COLUMN IF NOT EXISTS created_by INTEGER;

-- Add foreign key constraint
ALTER TABLE manual_entry
ADD CONSTRAINT manual_entry_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES "User"(user_id);

-- Set existing entries to System user (user_id = 1)
UPDATE manual_entry SET created_by = 1 WHERE created_by IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE manual_entry 
ALTER COLUMN created_by SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS ix_manual_entry_created_by ON manual_entry(created_by);

-- Add comment
COMMENT ON COLUMN manual_entry.created_by IS 
'User who created this manual entry - used for own_data_only permission filtering';

COMMIT;
