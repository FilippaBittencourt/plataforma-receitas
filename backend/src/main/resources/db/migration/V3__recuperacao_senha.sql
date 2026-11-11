CREATE TABLE token_recuperacao_senha (
    id_token BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    usado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_recuperacao_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE INDEX idx_token_recuperacao_usuario ON token_recuperacao_senha(id_usuario);
CREATE INDEX idx_token_recuperacao_expira ON token_recuperacao_senha(expira_em);
