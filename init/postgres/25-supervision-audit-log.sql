-- Create supervision audit log table for tracking changes
-- This will log all changes to movements and manual entries

BEGIN;

-- Create audit log table
CREATE TABLE IF NOT EXISTS supervision_log (
    log_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'movement', 'manual_entry', 'data_refresh'
    entity_id INTEGER, -- ID of the affected entity (NULL for data_refresh)
    action VARCHAR(50) NOT NULL, -- 'include', 'exclude', 'insert', 'update', 'delete', 'refresh'
    user_id INTEGER NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    user_name VARCHAR(120) NOT NULL,
    timestamp TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    details JSON, -- Store details like what changed (old/new values)
    description TEXT, -- Human-readable description of the action
    company_id INTEGER REFERENCES company(company_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS IX_supervision_log_entity ON supervision_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS IX_supervision_log_user ON supervision_log(user_id);
CREATE INDEX IF NOT EXISTS IX_supervision_log_timestamp ON supervision_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS IX_supervision_log_action ON supervision_log(action);
CREATE INDEX IF NOT EXISTS IX_supervision_log_company ON supervision_log(company_id);

-- Add constraint for entity_type
ALTER TABLE supervision_log
ADD CONSTRAINT CK_supervision_entity_type 
CHECK (entity_type IN ('movement', 'manual_entry', 'data_refresh'));

-- Add constraint for action
ALTER TABLE supervision_log
ADD CONSTRAINT CK_supervision_action 
CHECK (action IN ('include', 'exclude', 'insert', 'update', 'delete', 'refresh', 'create', 'modify'));

COMMIT;
