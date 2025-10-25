-- Migration: Add treasury_balance_source table for multiple sources per balance
-- Date: 2025-10-25

-- Create treasury_balance_source table
CREATE TABLE IF NOT EXISTS treasury_balance_source (
    source_id SERIAL PRIMARY KEY,
    treasury_balance_id INTEGER NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    source_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT FK_TreasuryBalanceSource_TreasuryBalance 
        FOREIGN KEY (treasury_balance_id) 
        REFERENCES treasury_balance(treasury_balance_id) 
        ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS IX_TreasuryBalanceSource_treasury 
    ON treasury_balance_source(treasury_balance_id);

-- Comment on table
COMMENT ON TABLE treasury_balance_source IS 'Stores individual sources (bank accounts, cash, etc.) that make up a treasury balance';

-- Comment on columns
COMMENT ON COLUMN treasury_balance_source.source_name IS 'Name of the source (e.g., BNP Account, Cash, Crédit Agricole)';
COMMENT ON COLUMN treasury_balance_source.source_date IS 'Date when this specific source balance was checked';
COMMENT ON COLUMN treasury_balance_source.amount IS 'Amount for this specific source';
