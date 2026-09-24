-- Add QR code column to certificates table
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS qr_code_data TEXT;

-- Create index for certificate number lookups
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
