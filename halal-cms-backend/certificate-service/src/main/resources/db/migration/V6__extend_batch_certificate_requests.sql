-- Extend batch_certificate_requests table with certificate and PDF fields
ALTER TABLE batch_certificate_requests
ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS certificate_template_id BIGINT,
ADD COLUMN IF NOT EXISTS approved_template_snapshot TEXT,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Add foreign key for template
ALTER TABLE batch_certificate_requests
ADD CONSTRAINT fk_batch_cert_template FOREIGN KEY (certificate_template_id)
    REFERENCES batch_certificate_templates(id) ON DELETE SET NULL;

-- Add indexes for certificate queries
CREATE INDEX IF NOT EXISTS idx_batch_cert_number ON batch_certificate_requests(certificate_number);
CREATE INDEX IF NOT EXISTS idx_batch_template_id_fk ON batch_certificate_requests(certificate_template_id);
CREATE INDEX IF NOT EXISTS idx_batch_pdf_generated ON batch_certificate_requests(pdf_generated_at);
CREATE INDEX IF NOT EXISTS idx_batch_notif_sent ON batch_certificate_requests(notification_sent_at);
