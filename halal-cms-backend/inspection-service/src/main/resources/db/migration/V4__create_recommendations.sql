CREATE TABLE recommendations (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT NOT NULL,
    text            TEXT,
    priority        VARCHAR(20) DEFAULT 'MEDIUM',
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
