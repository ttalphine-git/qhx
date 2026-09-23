CREATE TABLE audit_plans (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT NOT NULL,
    auditor_id      VARCHAR(36),
    auditor_name    VARCHAR(255),
    scheduled_date  DATE,
    duration_days   INTEGER,
    scope           TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_plans_app ON audit_plans(application_id);
