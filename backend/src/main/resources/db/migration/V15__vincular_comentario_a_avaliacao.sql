ALTER TABLE comenta
    ADD COLUMN id_avaliacao BIGINT UNIQUE REFERENCES avalia(id_avaliacao) ON DELETE CASCADE;
