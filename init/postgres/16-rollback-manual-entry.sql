-- Rollback: Remove extended recurrence columns from Manual_Entry (PostgreSQL)
-- Run this to rollback the Manual_Entry schema extensions

BEGIN;

-- Drop columns if they exist
DO $$
BEGIN
    -- Drop start_date column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Manual_Entry' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE Manual_Entry DROP COLUMN start_date;
    END IF;

    -- Drop timezone column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Manual_Entry' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE Manual_Entry DROP COLUMN timezone;
    END IF;

    -- Drop recurrence column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Manual_Entry' AND column_name = 'recurrence'
    ) THEN
        ALTER TABLE Manual_Entry DROP COLUMN recurrence;
    END IF;

    -- Drop rrule column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Manual_Entry' AND column_name = 'rrule'
    ) THEN
        ALTER TABLE Manual_Entry DROP COLUMN rrule;
    END IF;

    -- Drop metadata column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Manual_Entry' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE Manual_Entry DROP COLUMN metadata;
    END IF;
END $$;

-- Ensure dates_list column is properly maintained
UPDATE Manual_Entry
SET dates_list = COALESCE(dates_list, '[]'::JSONB)
WHERE dates_list IS NULL;

COMMIT;
