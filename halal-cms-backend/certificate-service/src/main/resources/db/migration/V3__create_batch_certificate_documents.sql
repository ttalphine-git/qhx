-- Create batch_certificate_documents table for tracking uploaded documents
CREATE TABLE IF NOT EXISTS batch_certificate_documents (
    id              BIGSERIAL PRIMARY KEY,
    batch_request_id BIGINT NOT NULL,
    document_type   VARCHAR(50),
    filename        VARCHAR(500) NOT NULL,
    description     TEXT,
    url             TEXT,
    uploaded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_batch_doc_request FOREIGN KEY (batch_request_id)
        REFERENCES batch_certificate_requests(id) ON DELETE CASCADE
);

-- Create index for quick lookups
CREATE INDEX idx_batch_docs_request_id ON batch_certificate_documents(batch_request_id);
