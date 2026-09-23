-- Extend non_conformities table for workflow
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS corrective_action TEXT;
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS is_cleared BOOLEAN DEFAULT FALSE;

-- Create nc_evidence table for evidence submissions
CREATE TABLE IF NOT EXISTS nc_evidence (
    id                      BIGSERIAL PRIMARY KEY,
    nc_id                   BIGINT NOT NULL REFERENCES non_conformities(id) ON DELETE CASCADE,
    submission_number       INTEGER NOT NULL,
    evidence_text           TEXT NOT NULL,
    evidence_files_json     TEXT,
    auditor_status          VARCHAR(30) DEFAULT 'PENDING',
    auditor_feedback        TEXT,
    submitted_by_customer   BOOLEAN DEFAULT TRUE,
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nc_evidence_nc ON nc_evidence(nc_id);
CREATE INDEX idx_nc_evidence_status ON nc_evidence(auditor_status);
CREATE INDEX idx_nc_evidence_submission ON nc_evidence(submission_number);

-- Create index on is_cleared for quick queries
CREATE INDEX idx_nc_is_cleared ON non_conformities(application_id, is_cleared);
