-- Seed default admin user
-- Password: admin123 (hashed with bcrypt)
-- IMPORTANT: Change this password in production!

BEGIN;

-- Insert default admin user
-- Password hash for 'admin123' using bcrypt
-- Generated with: python -c "from passlib.hash import bcrypt; print(bcrypt.hash('admin123'))"
INSERT INTO "User" (display_name, email, role, password_hash)
VALUES (
    'Admin User',
    'admin@treasury.local',
    'Admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqxvJW6.W2'
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    role = 'Admin',
    updated_at = now();

-- Grant admin full permissions to all tabs
INSERT INTO user_tab_permissions (user_id, tab_id, can_view, can_modify)
SELECT 
    u.user_id,
    t.tab_id,
    true,
    true
FROM "User" u
CROSS JOIN tab_permissions t
WHERE u.email = 'admin@treasury.local'
ON CONFLICT (user_id, tab_id) DO UPDATE
SET can_view = true, can_modify = true, updated_at = now();

COMMIT;
