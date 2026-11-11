CREATE TABLE rascunho_receita (
    id_rascunho INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL DEFAULT '',
    conteudo TEXT NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rascunho_receita_usuario_atualizado
    ON rascunho_receita (id_usuario, atualizado_em DESC);
