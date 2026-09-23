-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 VARCHAR(100) NOT NULL,
    notification_type       VARCHAR(50) NOT NULL,
    title                   VARCHAR(255),
    message                 TEXT,
    related_audit_id        BIGINT,
    related_application_id  BIGINT,
    is_read                 BOOLEAN DEFAULT FALSE,
    read_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_audit ON notifications(related_audit_id);
CREATE INDEX idx_notifications_app ON notifications(related_application_id);

-- Create workflow_logs table
CREATE TABLE IF NOT EXISTS workflow_logs (
    id                      BIGSERIAL PRIMARY KEY,
    audit_id                BIGINT,
    application_id          BIGINT NOT NULL,
    action_type             VARCHAR(100),
    action_description      TEXT,
    performed_by_user_id    VARCHAR(100),
    performed_by_role       VARCHAR(30),
    old_status              VARCHAR(30),
    new_status              VARCHAR(30),
    metadata_json           TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_logs_app ON workflow_logs(application_id);
CREATE INDEX idx_workflow_logs_audit ON workflow_logs(audit_id);
CREATE INDEX idx_workflow_logs_action ON workflow_logs(action_type);
CREATE INDEX idx_workflow_logs_user ON workflow_logs(performed_by_user_id);

-- Create emails_sent table for tracking
CREATE TABLE IF NOT EXISTS emails_sent (
    id                      BIGSERIAL PRIMARY KEY,
    recipient_email         VARCHAR(255) NOT NULL,
    recipient_user_id       VARCHAR(100),
    subject                 VARCHAR(255),
    body_text               TEXT,
    email_type              VARCHAR(50),
    related_audit_id        BIGINT,
    related_application_id  BIGINT,
    sent_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivery_status         VARCHAR(30) DEFAULT 'PENDING',
    delivery_error          TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emails_sent_recipient ON emails_sent(recipient_email);
CREATE INDEX idx_emails_sent_user ON emails_sent(recipient_user_id);
CREATE INDEX idx_emails_sent_status ON emails_sent(delivery_status);
CREATE INDEX idx_emails_sent_type ON emails_sent(email_type);
