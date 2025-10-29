-- Create table for tracking data refresh executions
-- This allows admins to refresh data from Odoo and track progress

CREATE TABLE IF NOT EXISTS data_refresh_execution (
    execution_id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    started_by INTEGER NOT NULL REFERENCES "User"(user_id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    total_records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_step VARCHAR(100),
    details JSONB, -- Store additional details like per-job results
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS IX_data_refresh_execution_status ON data_refresh_execution(status);
CREATE INDEX IF NOT EXISTS IX_data_refresh_execution_started_by ON data_refresh_execution(started_by);
CREATE INDEX IF NOT EXISTS IX_data_refresh_execution_started_at ON data_refresh_execution(started_at DESC);

-- Add comments for documentation
COMMENT ON TABLE data_refresh_execution IS 'Tracks data refresh operations from Odoo. Used to prevent concurrent refreshes and show history.';
COMMENT ON COLUMN data_refresh_execution.status IS 'Current status: running, completed, failed, or cancelled';
COMMENT ON COLUMN data_refresh_execution.progress_percentage IS 'Current progress from 0 to 100';
COMMENT ON COLUMN data_refresh_execution.current_step IS 'Human-readable description of current operation';
COMMENT ON COLUMN data_refresh_execution.details IS 'JSON details about each job (purchases, sales, etc.)';
