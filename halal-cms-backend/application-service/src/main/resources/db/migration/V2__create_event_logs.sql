CREATE TABLE event_logs (
    id             BIGSERIAL    PRIMARY KEY,
    application_id BIGINT       NOT NULL,
    event          VARCHAR(100) NOT NULL,
    description    TEXT,
    performed_by   VARCHAR(255),
    performed_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    old_status     VARCHAR(50),
    new_status     VARCHAR(50)
);

CREATE INDEX idx_event_logs_app_id ON event_logs(application_id);
