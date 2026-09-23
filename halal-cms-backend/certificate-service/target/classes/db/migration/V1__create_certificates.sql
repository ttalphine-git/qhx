CREATE TABLE certificates (
    id                  BIGSERIAL PRIMARY KEY,
    certificate_key     VARCHAR(50)  NOT NULL UNIQUE,
    application_id      BIGINT       NOT NULL,
    company_name        VARCHAR(255),
    certificate_number  VARCHAR(100) NOT NULL UNIQUE,
    issue_date          DATE,
    expiry_date         DATE,
    status              VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    halal_standard      VARCHAR(255),
    products            TEXT,
    issued_by           VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_certs_app_id ON certificates(application_id);
CREATE INDEX idx_certs_status ON certificates(status);
