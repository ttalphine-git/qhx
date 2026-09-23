CREATE TABLE companies (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id             UUID NOT NULL,
    registration_number  VARCHAR(100) NOT NULL UNIQUE,
    name                 VARCHAR(255) NOT NULL,
    business_type        VARCHAR(50)  NOT NULL,
    address              TEXT         NOT NULL,
    city                 VARCHAR(100),
    state                VARCHAR(100),
    postcode             VARCHAR(20),
    country              VARCHAR(100) NOT NULL,
    phone                VARCHAR(50),
    email                VARCHAR(255),
    website              VARCHAR(255),
    activity_category    VARCHAR(100),
    specific_activities  TEXT,
    description          TEXT,
    incorporation_date   DATE,
    status               VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_owner_id ON companies(owner_id);
CREATE INDEX idx_companies_status   ON companies(status);
