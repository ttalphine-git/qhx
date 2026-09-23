ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS job_title        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS department       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS employment_type  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS id_proof_number  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS start_date       VARCHAR(20),
    ADD COLUMN IF NOT EXISTS notes            TEXT;
