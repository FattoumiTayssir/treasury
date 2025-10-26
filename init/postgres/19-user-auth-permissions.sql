-- Add password and authentication fields to User table
-- Create permissions system for tab-based access control

BEGIN;

-- Add password_hash field to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Create tab_permissions table to store available tabs/modules
CREATE TABLE IF NOT EXISTS tab_permissions (
    tab_id SERIAL PRIMARY KEY,
    tab_name VARCHAR(50) NOT NULL UNIQUE,
    tab_label VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

-- Create user_tab_permissions table to store user permissions per tab
CREATE TABLE IF NOT EXISTS user_tab_permissions (
    user_tab_permission_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    tab_id INTEGER NOT NULL REFERENCES tab_permissions(tab_id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_modify BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    CONSTRAINT UX_user_tab_permissions UNIQUE (user_id, tab_id)
);

-- Insert default tabs (excluding dashboard and user-management which is admin-only)
INSERT INTO tab_permissions (tab_name, tab_label, description) VALUES
    ('analytics', 'Analyse', 'View and analyze financial data'),
    ('movements', 'Mouvements', 'Manage financial movements'),
    ('manual-entries', 'Entrées manuelles', 'Manage manual entries'),
    ('exceptions', 'Exceptions', 'Handle exceptions'),
    ('settings', 'Paramètres', 'Treasury settings and configuration')
ON CONFLICT (tab_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS IX_user_tab_permissions_user ON user_tab_permissions(user_id);
CREATE INDEX IF NOT EXISTS IX_user_tab_permissions_tab ON user_tab_permissions(tab_id);

COMMIT;
