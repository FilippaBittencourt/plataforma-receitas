CREATE TABLE uso_assistente_global (
    inicio_janela TIMESTAMPTZ PRIMARY KEY,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0)
);

CREATE TABLE limite_autenticacao (
    rota VARCHAR(80) NOT NULL,
    cliente VARCHAR(100) NOT NULL,
    inicio_janela TIMESTAMPTZ NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (rota, cliente, inicio_janela)
);

CREATE INDEX idx_limite_autenticacao_janela ON limite_autenticacao(inicio_janela);
