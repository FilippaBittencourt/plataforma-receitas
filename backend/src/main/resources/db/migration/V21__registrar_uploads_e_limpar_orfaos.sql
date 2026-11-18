CREATE TABLE arquivo_upload (
    id_arquivo BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_arquivo VARCHAR(80) NOT NULL UNIQUE,
    id_usuario INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    tamanho_bytes BIGINT NOT NULL CHECK (tamanho_bytes > 0),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_arquivo_upload_usuario_data ON arquivo_upload(id_usuario, criado_em);
CREATE INDEX idx_arquivo_upload_data ON arquivo_upload(criado_em);
