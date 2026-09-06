ALTER TABLE demandes_credit
    ADD COLUMN IF NOT EXISTS supprime boolean NOT NULL DEFAULT false;

ALTER TABLE demandes_credit
    ADD COLUMN IF NOT EXISTS date_suppression timestamp without time zone;

ALTER TABLE demandes_credit
    ADD COLUMN IF NOT EXISTS supprime_par varchar(255);
