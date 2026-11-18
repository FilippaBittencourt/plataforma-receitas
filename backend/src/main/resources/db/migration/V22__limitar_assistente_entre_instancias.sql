CREATE TABLE uso_assistente (
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    inicio_janela TIMESTAMPTZ NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (id_usuario, inicio_janela)
);

CREATE INDEX idx_uso_assistente_janela ON uso_assistente(inicio_janela);
