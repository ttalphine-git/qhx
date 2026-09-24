-- Create batch_certificate_settings table for storing configuration
CREATE TABLE IF NOT EXISTS batch_certificate_settings (
    id                      BIGSERIAL PRIMARY KEY,
    unit_price_per_kg       NUMERIC(10, 2) NOT NULL DEFAULT 0.50,
    currency                VARCHAR(10) DEFAULT 'MYR',
    feature_enabled         BOOLEAN NOT NULL DEFAULT true,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by              VARCHAR(100)
);

-- Ensure only one row exists in this table
CREATE UNIQUE INDEX idx_batch_settings_single_row ON batch_certificate_settings((1));

-- Seed default settings
INSERT INTO batch_certificate_settings (unit_price_per_kg, currency, feature_enabled, updated_at, updated_by)
VALUES (0.50, 'MYR', true, CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT DO NOTHING;
