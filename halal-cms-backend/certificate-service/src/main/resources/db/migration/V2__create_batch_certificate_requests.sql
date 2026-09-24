-- Create batch_certificate_requests table for handling batch certificate applications
CREATE TABLE IF NOT EXISTS batch_certificate_requests (
    id                      BIGSERIAL PRIMARY KEY,
    request_number          VARCHAR(50) NOT NULL UNIQUE,
    company_id              VARCHAR(36) NOT NULL,
    factory_id              VARCHAR(36) NOT NULL,
    factory_certificate_id  BIGINT NOT NULL,
    user_id                 VARCHAR(36) NOT NULL,

    -- Request Status
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    -- Factory Certificate Info (denormalized)
    factory_cert_number     VARCHAR(50),
    factory_cert_valid_from DATE,
    factory_cert_valid_to   DATE,

    -- Producer Info
    producer_name           VARCHAR(255),
    producer_phone          VARCHAR(50),
    producer_email          VARCHAR(255),
    producer_contact        VARCHAR(255),

    -- Importer Info (optional)
    importer_name           VARCHAR(255),
    importer_country        VARCHAR(100),
    importer_contact        VARCHAR(255),

    -- Exporter Info (optional)
    exporter_name           VARCHAR(255),
    exporter_country        VARCHAR(100),
    exporter_contact        VARCHAR(255),

    -- Shipment Details
    shipment_date           DATE,
    shipment_reference      VARCHAR(100),
    origin_country          VARCHAR(100),
    destination_country     VARCHAR(100),

    -- Products & Weight (stored as JSON)
    products_json           TEXT NOT NULL,
    total_weight_kg         NUMERIC(12, 2) NOT NULL,

    -- Fee Calculation
    unit_price_per_kg       NUMERIC(10, 2) NOT NULL,
    total_fee               NUMERIC(12, 2) NOT NULL,
    currency                VARCHAR(10) DEFAULT 'MYR',

    -- Payment Status
    payment_status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    amount_owed             NUMERIC(12, 2),

    -- Supporting Documents (stored as JSON)
    documents_json          TEXT,

    -- Admin fields
    assigned_admin_id       VARCHAR(36),
    admin_notes             TEXT,
    approved_at             TIMESTAMP WITH TIME ZONE,
    approved_by             VARCHAR(100),
    rejection_reason        TEXT,
    rejected_at             TIMESTAMP WITH TIME ZONE,
    rejected_by             VARCHAR(100),

    -- Timestamps
    submitted_at            TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_batch_req_cert FOREIGN KEY (factory_certificate_id)
        REFERENCES certificates(id) ON DELETE RESTRICT
);

-- Create indexes for common queries
CREATE INDEX idx_batch_requests_company_id ON batch_certificate_requests(company_id);
CREATE INDEX idx_batch_requests_factory_id ON batch_certificate_requests(factory_id);
CREATE INDEX idx_batch_requests_user_id ON batch_certificate_requests(user_id);
CREATE INDEX idx_batch_requests_status ON batch_certificate_requests(status);
CREATE INDEX idx_batch_requests_cert_id ON batch_certificate_requests(factory_certificate_id);
CREATE INDEX idx_batch_requests_payment_status ON batch_certificate_requests(payment_status);
