CREATE TABLE application_documents (
    id             BIGSERIAL    PRIMARY KEY,
    application_id BIGINT       NOT NULL,
    filename       VARCHAR(500) NOT NULL,
    description    TEXT,
    url            TEXT,
    uploaded_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_docs_app_id ON application_documents(application_id);
