CREATE TABLE favorito (
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_receita INTEGER NOT NULL REFERENCES receita(id_receita) ON DELETE CASCADE,
    data_favorito TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_receita)
);

CREATE INDEX idx_favorito_usuario_data
    ON favorito (id_usuario, data_favorito DESC);
