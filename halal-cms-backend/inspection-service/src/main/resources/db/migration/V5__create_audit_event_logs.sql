CREATE TABLE audit_event_logs (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT       NOT NULL,
    event           VARCHAR(100) NOT NULL,
    description     TEXT,
    performed_by    VARCHAR(255),
    performed_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    old_status      VARCHAR(50),
    new_status      VARCHAR(50)
);
CREATE INDEX idx_ael_app ON audit_event_logs(application_id);
