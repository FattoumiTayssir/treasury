-- Migration: Add exchange_rate column to Movement table
-- Date: 2025-10-19
-- Purpose: Support exchange rate for import purchases (Achat Importation)

BEGIN;

-- Add exchange_rate column (nullable, defaults to NULL for non-import movements)
ALTER TABLE Movement 
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6);

-- Add comment to document the column
COMMENT ON COLUMN Movement.exchange_rate IS 'Taux de change pour les achats d''importation (custom_rate depuis Odoo account.move)';

COMMIT;
