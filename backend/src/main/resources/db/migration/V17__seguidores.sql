CREATE TABLE seguidor (
    id_seguidor INTEGER NOT NULL,
    id_seguido INTEGER NOT NULL,
    data_seguimento TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_seguidor, id_seguido),
    CONSTRAINT fk_seguidor_seguidor FOREIGN KEY (id_seguidor)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_seguidor_seguido FOREIGN KEY (id_seguido)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_seguidor_nao_seguir_a_si CHECK (id_seguidor <> id_seguido)
);

CREATE INDEX idx_seguidor_seguido ON seguidor (id_seguido);
