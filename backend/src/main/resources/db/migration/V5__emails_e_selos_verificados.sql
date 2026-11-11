CREATE TABLE historico_selo_receita (
    id_historico BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_receita INTEGER NOT NULL REFERENCES receita(id_receita) ON UPDATE CASCADE ON DELETE CASCADE,
    concedido_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historico_selo_concedido_em
    ON historico_selo_receita (concedido_em DESC);
