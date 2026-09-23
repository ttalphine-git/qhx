CREATE TABLE audit_statuses (
    id                      BIGSERIAL PRIMARY KEY,
    application_id          BIGINT  NOT NULL UNIQUE,
    current_phase           VARCHAR(50) DEFAULT 'SUBMITTED',
    f1_started              BOOLEAN NOT NULL DEFAULT false,
    f1_completed            BOOLEAN NOT NULL DEFAULT false,
    f2_started              BOOLEAN NOT NULL DEFAULT false,
    f2_completed            BOOLEAN NOT NULL DEFAULT false,
    compliance_assigned     BOOLEAN NOT NULL DEFAULT false,
    certification_finalized BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
