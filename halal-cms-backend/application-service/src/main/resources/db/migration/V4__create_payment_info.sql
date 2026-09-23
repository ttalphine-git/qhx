CREATE TABLE payment_info (
    id               BIGSERIAL   PRIMARY KEY,
    application_id   BIGINT      NOT NULL UNIQUE,
    payment_required BOOLEAN     NOT NULL DEFAULT false,
    payment_status   VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    amount           NUMERIC(12,2),
    currency         VARCHAR(10) DEFAULT 'MYR',
    reference        VARCHAR(255),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
