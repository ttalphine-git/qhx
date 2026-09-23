-- Extend non_conformities table for customer workflow
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS customer_corrective_action TEXT;
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS customer_due_date DATE;
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS auditor_id BIGINT;
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING_CUSTOMER_ACTION';
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS is_cleared BOOLEAN DEFAULT false;
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMP;

-- Create nc_evidence table for tracking evidence submissions and auditor reviews
CREATE TABLE IF NOT EXISTS nc_evidence (
    id BIGSERIAL PRIMARY KEY,
    nc_id BIGINT NOT NULL REFERENCES non_conformities(id) ON DELETE CASCADE,
    submission_number INT NOT NULL,
    evidence_text TEXT,
    evidence_files JSON,
    submitted_by BIGINT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auditor_review_status VARCHAR(30),
    auditor_feedback TEXT,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nc_evidence_nc_id ON nc_evidence(nc_id);
CREATE INDEX IF NOT EXISTS idx_nc_evidence_submission ON nc_evidence(nc_id, submission_number);
