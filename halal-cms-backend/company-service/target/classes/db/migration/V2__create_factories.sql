CREATE TABLE factories (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID         NOT NULL,
    name         VARCHAR(255) NOT NULL,
    factory_type VARCHAR(50)  NOT NULL,
    address      TEXT         NOT NULL,
    city         VARCHAR(100),
    state        VARCHAR(100),
    postcode     VARCHAR(20),
    country      VARCHAR(100),
    phone        VARCHAR(50),
    pic          VARCHAR(255),
    pic_phone    VARCHAR(50),
    notes        TEXT,
    status       VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_factories_company_id ON factories(company_id);
