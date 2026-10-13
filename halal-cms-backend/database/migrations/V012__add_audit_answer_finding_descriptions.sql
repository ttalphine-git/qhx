ALTER TABLE audit_answers
    ADD COLUMN IF NOT EXISTS nc_description TEXT,
    ADD COLUMN IF NOT EXISTS obs_description TEXT;
