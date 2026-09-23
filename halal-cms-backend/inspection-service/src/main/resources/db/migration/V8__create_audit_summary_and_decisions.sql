-- Create audit_report_summary table
CREATE TABLE IF NOT EXISTS audit_report_summary (
    id                      BIGSERIAL PRIMARY KEY,
    audit_id                BIGINT NOT NULL UNIQUE,
    application_id          BIGINT NOT NULL,
    main_auditor_summary    TEXT,
    sharia_summary          TEXT,
    complied_products_json  TEXT,
    noncomplied_products_json TEXT,
    status                  VARCHAR(30) DEFAULT 'DRAFT',
    submitted_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_summary_audit ON audit_report_summary(audit_id);
CREATE INDEX idx_audit_summary_app ON audit_report_summary(application_id);

-- Create decision_request table
CREATE TABLE IF NOT EXISTS decision_request (
    id                      BIGSERIAL PRIMARY KEY,
    audit_id                BIGINT NOT NULL,
    application_id          BIGINT NOT NULL,
    decision_type           VARCHAR(50) NOT NULL,
    assigned_to_user_id     VARCHAR(100),
    assigned_to_role        VARCHAR(30),
    decision_value          VARCHAR(30),
    reasoning               TEXT,
    conditions              TEXT,
    status                  VARCHAR(30) DEFAULT 'PENDING',
    decided_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decision_request_audit ON decision_request(audit_id);
CREATE INDEX idx_decision_request_app ON decision_request(application_id);
CREATE INDEX idx_decision_request_user ON decision_request(assigned_to_user_id);
CREATE INDEX idx_decision_request_status ON decision_request(status);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id                      BIGSERIAL PRIMARY KEY,
    audit_id                BIGINT NOT NULL,
    application_id          BIGINT NOT NULL,
    certificate_number      VARCHAR(50) NOT NULL UNIQUE,
    generated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_from              TIMESTAMPTZ,
    valid_to                TIMESTAMPTZ,
    status                  VARCHAR(30) DEFAULT 'GENERATED',
    approved_by             VARCHAR(100),
    approved_at             TIMESTAMPTZ,
    sent_to_customer_at     TIMESTAMPTZ,
    certificate_data        BYTEA,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificates_audit ON certificates(audit_id);
CREATE INDEX idx_certificates_app ON certificates(application_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_status ON certificates(status);
