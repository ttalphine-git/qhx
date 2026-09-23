-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    read_at TIMESTAMP,
    action_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON notifications(event_type);

-- Create workflow_logs table for audit trail
CREATE TABLE IF NOT EXISTS workflow_logs (
    id BIGSERIAL PRIMARY KEY,
    audit_id BIGINT NOT NULL REFERENCES audit_plan(id) ON DELETE CASCADE,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    performed_by BIGINT,
    old_value JSON,
    new_value JSON,
    status VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_audit_id ON workflow_logs(audit_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_action ON workflow_logs(action);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_created ON workflow_logs(created_at);

-- Create emails_sent table for tracking email communications
CREATE TABLE IF NOT EXISTS emails_sent (
    id BIGSERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_id BIGINT,
    subject VARCHAR(255),
    email_type VARCHAR(50),
    event_id VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id BIGINT,
    status VARCHAR(30) DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_emails_sent_recipient ON emails_sent(recipient_email);
CREATE INDEX IF NOT EXISTS idx_emails_sent_event ON emails_sent(event_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_type ON emails_sent(email_type);
