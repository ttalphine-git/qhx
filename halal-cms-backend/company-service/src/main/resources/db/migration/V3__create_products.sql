CREATE TABLE products (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id           UUID         NOT NULL,
    factory_id           UUID,
    name                 VARCHAR(255) NOT NULL,
    sku                  VARCHAR(100),
    brand                VARCHAR(255),
    category             VARCHAR(50)  NOT NULL,
    description          TEXT,
    halal_status         VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    certification_number VARCHAR(100),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_ingredients (
    product_id UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient VARCHAR(255) NOT NULL
);

CREATE INDEX idx_products_company_id   ON products(company_id);
CREATE INDEX idx_products_halal_status ON products(halal_status);
