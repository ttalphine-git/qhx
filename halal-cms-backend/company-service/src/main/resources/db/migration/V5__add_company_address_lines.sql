ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);

UPDATE companies
SET address_line1 = address
WHERE address_line1 IS NULL;
