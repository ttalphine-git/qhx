CREATE TABLE audit_report_configurations (
    id                     BIGSERIAL PRIMARY KEY,
    name                   VARCHAR(255) NOT NULL,
    report_title           VARCHAR(255) NOT NULL,
    applies_to             TEXT,
    activity_category_keys TEXT,
    risk_level             VARCHAR(30) NOT NULL DEFAULT 'Standard',
    form_code              VARCHAR(80),
    revision               VARCHAR(255),
    stages                 TEXT,
    active                 BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order             INTEGER NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_questions (
    id               BIGSERIAL PRIMARY KEY,
    configuration_id BIGINT NOT NULL REFERENCES audit_report_configurations(id) ON DELETE CASCADE,
    question_text    TEXT NOT NULL,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_reports (
    id                    BIGSERIAL PRIMARY KEY,
    application_id        BIGINT NOT NULL UNIQUE,
    configuration_id      BIGINT REFERENCES audit_report_configurations(id),
    activity_category_key VARCHAR(120),
    status                VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    general_comment       TEXT,
    completed_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_answers (
    id                BIGSERIAL PRIMARY KEY,
    report_id         BIGINT NOT NULL REFERENCES audit_reports(id) ON DELETE CASCADE,
    question_id       BIGINT REFERENCES audit_questions(id) ON DELETE SET NULL,
    question_text     TEXT NOT NULL,
    answer            VARCHAR(20),
    finding           VARCHAR(20),
    customer_comment  TEXT,
    auditor_comment   TEXT,
    sharia_comment    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_questions_config ON audit_questions(configuration_id);
CREATE INDEX idx_audit_reports_app ON audit_reports(application_id);
CREATE INDEX idx_audit_answers_report ON audit_answers(report_id);
