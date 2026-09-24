-- Create batch certificate templates table
CREATE TABLE IF NOT EXISTS batch_certificate_templates (
    id                      BIGSERIAL PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL,
    version                 INT DEFAULT 1,
    is_default              BOOLEAN DEFAULT FALSE,

    -- Template design JSON (elements, layout, styling)
    template_json           TEXT NOT NULL,

    -- Template metadata
    page_count              INT DEFAULT 1,
    page_width              INT DEFAULT 660,
    page_height             INT DEFAULT 932,

    -- Audit
    created_by              VARCHAR(255),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by              VARCHAR(255),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one default template
CREATE UNIQUE INDEX idx_batch_template_default ON batch_certificate_templates(is_default)
WHERE is_default = TRUE;

-- Create index for lookups
CREATE INDEX idx_batch_template_name ON batch_certificate_templates(name);
