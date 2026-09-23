CREATE TABLE applications (
    id                    BIGSERIAL    PRIMARY KEY,
    application_number    VARCHAR(50)  NOT NULL UNIQUE,
    status                VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    type                  VARCHAR(20)  NOT NULL DEFAULT 'NEW',
    user_id               VARCHAR(36)  NOT NULL,
    company_id            VARCHAR(36),
    company_name          VARCHAR(255),
    assigned_auditor_id   VARCHAR(36),
    assigned_auditor_name VARCHAR(255),
    halal_standard        VARCHAR(255),
    country               VARCHAR(100),
    product_count         INTEGER,
    submitted_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_apps_user_id ON applications(user_id);
CREATE INDEX idx_apps_status  ON applications(status);
