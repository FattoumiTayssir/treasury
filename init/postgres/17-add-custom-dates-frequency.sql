-- Migration: Add 'Dates personnalisées' to frequency constraint
-- Date: 2025-10-19

-- Drop the old constraint
ALTER TABLE Manual_Entry DROP CONSTRAINT IF EXISTS CK_ManualEntry_frequency;

-- Add the new constraint with custom dates support
ALTER TABLE Manual_Entry ADD CONSTRAINT CK_ManualEntry_frequency 
  CHECK (frequency IN ('Une seule fois', 'Mensuel', 'Annuel', 'Dates personnalisées'));
