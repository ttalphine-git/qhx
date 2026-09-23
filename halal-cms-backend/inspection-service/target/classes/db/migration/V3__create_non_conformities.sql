CREATE TABLE non_conformities (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT       NOT NULL,
    category        VARCHAR(100),
    description     TEXT,
    severity        VARCHAR(20)  NOT NULL DEFAULT 'LOW',
    status          VARCHAR(30)  NOT NULL DEFAULT 'OPEN',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);
CREATE INDEX idx_nc_app ON non_conformities(application_id);
