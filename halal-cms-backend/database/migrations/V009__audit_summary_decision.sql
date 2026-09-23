-- Create audit_report_summary table
CREATE TABLE IF NOT EXISTS audit_report_summary (
    id BIGSERIAL PRIMARY KEY,
    audit_id BIGINT NOT NULL REFERENCES audit_plan(id) ON DELETE CASCADE,
    main_auditor_summary TEXT,
    sharia_summary TEXT,
    complied_products JSON,
    non_complied_products JSON,
    submitted_by BIGINT,
    submitted_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_report_summary_audit_id ON audit_report_summary(audit_id);

-- Create decision_request table
CREATE TABLE IF NOT EXISTS decision_request (
    id BIGSERIAL PRIMARY KEY,
    audit_id BIGINT NOT NULL REFERENCES audit_plan(id) ON DELETE CASCADE,
    assigned_to BIGINT NOT NULL,
    decision_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    decision_text TEXT,
    conditions TEXT,
    decision_value VARCHAR(20),
    decided_by BIGINT,
    decided_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_decision_request_audit_id ON decision_request(audit_id);
CREATE INDEX IF NOT EXISTS idx_decision_request_assigned_to ON decision_request(assigned_to);
CREATE INDEX IF NOT EXISTS idx_decision_request_status ON decision_request(status);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    audit_id BIGINT NOT NULL REFERENCES audit_plan(id) ON DELETE CASCADE,
    application_id BIGINT NOT NULL,
    certificate_number VARCHAR(50) UNIQUE,
    template_id BIGINT,
    status VARCHAR(30) DEFAULT 'GENERATED',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_from DATE,
    valid_to DATE,
    approved_by BIGINT,
    approved_at TIMESTAMP,
    approval_notes TEXT,
    sent_at TIMESTAMP,
    sent_to_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_audit_id ON certificates(audit_id);
CREATE INDEX IF NOT EXISTS idx_certificates_application_id ON certificates(application_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);

-- Create audit_lifecycle table to track workflow stages
CREATE TABLE IF NOT EXISTS audit_lifecycle (
    id BIGSERIAL PRIMARY KEY,
    audit_id BIGINT NOT NULL REFERENCES audit_plan(id) ON DELETE CASCADE,
    stage VARCHAR(50),
    stage_status VARCHAR(30),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_lifecycle_audit_id ON audit_lifecycle(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_lifecycle_stage ON audit_lifecycle(audit_id, stage);
