CREATE TABLE IF NOT EXISTS hcb_accreditation_scopes (
    id             BIGSERIAL PRIMARY KEY,
    body           VARCHAR(255) NOT NULL,
    standard       VARCHAR(255) NOT NULL,
    cert_number    VARCHAR(100),
    scope          TEXT,
    country        VARCHAR(100),
    issue_date     DATE,
    expiry_date    DATE NOT NULL,
    cert_file_data TEXT,
    cert_file_name VARCHAR(255),
    notes          TEXT,
    unit_price     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcb_accreditation_scopes_standard ON hcb_accreditation_scopes(standard);
CREATE INDEX IF NOT EXISTS idx_hcb_accreditation_scopes_country ON hcb_accreditation_scopes(country);
