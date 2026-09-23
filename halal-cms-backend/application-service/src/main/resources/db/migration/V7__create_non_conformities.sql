CREATE TABLE non_conformities (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    question_id VARCHAR(255) NOT NULL,
    question_text TEXT,
    category VARCHAR(255) NOT NULL,
    nc_evidence_json TEXT,
    customer_comment TEXT,
    customer_evidence_json TEXT,
    auditor_comment TEXT,
    auditor_evidence_json TEXT,
    sharia_comment TEXT,
    sharia_evidence_json TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    UNIQUE(application_id, question_id)
);

CREATE INDEX idx_non_conformities_application_id ON non_conformities(application_id);
CREATE INDEX idx_non_conformities_question_id ON non_conformities(question_id);
