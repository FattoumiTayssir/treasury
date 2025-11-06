-- Update analytics tab label to indicate it covers both Analytics and Simulation
-- Since simulation was developed after user management, we use the same permission

BEGIN;

-- Update analytics tab label
UPDATE tab_permissions 
SET tab_label = 'Analyse / Simulation',
    description = 'View analytics and simulation data'
WHERE tab_name = 'analytics';

COMMIT;
