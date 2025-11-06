-- Add Supervision tab for admin-only audit logging

BEGIN;

-- Insert supervision tab
INSERT INTO tab_permissions (tab_name, tab_label, description) VALUES
    ('supervision', 'Supervision', 'Admin-only audit log for tracking changes to movements, manual entries, and data refresh')
ON CONFLICT (tab_name) DO NOTHING;

COMMIT;
